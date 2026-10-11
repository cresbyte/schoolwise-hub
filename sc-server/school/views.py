from django.db.models import ProtectedError, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import (
    AcademicYear,
    ApprovalStatus,
    CalendarEvent,
    GradeLevel,
    Term,
    YearStatus,
)
from .permissions import (
    CalendarEventPermission,
    IsSchoolAdmin,
    IsSchoolAdminOrReadOnly,
    is_parent,
)
from .serializers import (
    AcademicYearSerializer,
    CalendarEventSerializer,
    GradeLevelSerializer,
    RejectEventSerializer,
    TermSerializer,
)


# ---- helpers ----------------------------------------------------------------
def _int_param(request, name):
    raw = request.query_params.get(name)
    if raw in (None, ""):
        return None
    try:
        return int(raw)
    except ValueError:
        raise ValidationError({name: "Must be an integer."})


def _date_param(request, name):
    raw = request.query_params.get(name)
    if raw in (None, ""):
        return None
    try:
        value = parse_date(raw)
    except ValueError:
        value = None
    if value is None:
        raise ValidationError({name: "Use YYYY-MM-DD."})
    return value


class ProtectedDeleteMixin:
    """Return 409 instead of a 500 when a PROTECTed record is still referenced."""

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This record is in use and cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )


# ---- academic years -----------------------------------------------------------
class AcademicYearViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = AcademicYear.objects.prefetch_related("terms__academic_year")
    serializer_class = AcademicYearSerializer
    permission_classes = [IsSchoolAdminOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        if self.get_object().status != YearStatus.DRAFT:
            return Response(
                {"detail": "Only draft academic years can be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        year = self.get_object()
        try:
            services.activate_year(year)
        except services.PeriodError as exc:
            raise ValidationError({"detail": str(exc)})
        return Response(self.get_serializer(year).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        year = self.get_object()
        try:
            services.close_year(year)
        except services.PeriodError as exc:
            raise ValidationError({"detail": str(exc)})
        return Response(self.get_serializer(year).data)


# ---- terms ----------------------------------------------------------------------
class TermViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsSchoolAdminOrReadOnly]

    def get_queryset(self):
        qs = Term.objects.select_related("academic_year")
        year_id = _int_param(self.request, "academic_year")
        if year_id:
            qs = qs.filter(academic_year_id=year_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        term = self.get_object()
        if term.is_current or term.academic_year.status == YearStatus.CLOSED:
            return Response(
                {
                    "detail": "The current term, or a term in a closed year, cannot be deleted."
                },
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="set-current")
    def set_current(self, request, pk=None):
        term = self.get_object()
        try:
            services.set_current_term(term)
        except services.PeriodError as exc:
            raise ValidationError({"detail": str(exc)})
        return Response(self.get_serializer(term).data)


# ---- grade levels ---------------------------------------------------------------
class GradeLevelViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = GradeLevel.objects.all()
    serializer_class = GradeLevelSerializer
    permission_classes = [IsSchoolAdminOrReadOnly]


# ---- current period (replaces School.current_term / current_year) ---------------------
class CurrentPeriodView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year, term = services.get_current_period()
        return Response(
            {
                "academic_year": AcademicYearSerializer(year).data if year else None,
                "term": TermSerializer(term).data if term else None,
            }
        )


# ---- calendar -------------------------------------------------------------------------
class CalendarEventViewSet(viewsets.ModelViewSet):
    """
    Filters: ?academic_year= &term= &category= &scope= &approval_status= &from= &to=
    (from/to return events that overlap that date range).
    """

    serializer_class = CalendarEventSerializer
    permission_classes = [CalendarEventPermission]

    def get_queryset(self):
        user = self.request.user
        qs = CalendarEvent.objects.select_related(
            "academic_year", "term", "created_by"
        ).prefetch_related("grade_levels")

        if is_parent(user):
            qs = qs.filter(
                approval_status=ApprovalStatus.APPROVED, visible_to_parents=True
            )
        elif not user.is_school_admin:
            qs = qs.filter(
                Q(approval_status=ApprovalStatus.APPROVED) | Q(created_by=user)
            )

        params = self.request.query_params
        if year_id := _int_param(self.request, "academic_year"):
            qs = qs.filter(academic_year_id=year_id)
        if term_id := _int_param(self.request, "term"):
            qs = qs.filter(term_id=term_id)
        for field in ("category", "scope", "approval_status"):
            if params.get(field):
                qs = qs.filter(**{field: params[field]})
        if date_from := _date_param(self.request, "from"):
            qs = qs.filter(end_date__gte=date_from)
        if date_to := _date_param(self.request, "to"):
            qs = qs.filter(start_date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_school_admin:  # admins don't need to approve their own events
            serializer.save(
                created_by=user,
                approval_status=ApprovalStatus.APPROVED,
                reviewed_by=user,
                reviewed_at=timezone.now(),
            )
        else:
            serializer.save(created_by=user)

    def perform_update(self, serializer):
        if self.request.user.is_school_admin:
            serializer.save()
        else:  # an edit by the creator sends the event back for approval
            serializer.save(
                approval_status=ApprovalStatus.PENDING,
                reviewed_by=None,
                reviewed_at=None,
                rejection_reason="",
            )

    @action(detail=True, methods=["post"], permission_classes=[IsSchoolAdmin])
    def approve(self, request, pk=None):
        event = services.approve_event(self.get_object(), request.user)
        return Response(self.get_serializer(event).data)

    @action(detail=True, methods=["post"], permission_classes=[IsSchoolAdmin])
    def reject(self, request, pk=None):
        body = RejectEventSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            event = services.reject_event(
                self.get_object(), request.user, body.validated_data["reason"]
            )
        except services.PeriodError as exc:
            raise ValidationError({"detail": str(exc)})
        return Response(self.get_serializer(event).data)
