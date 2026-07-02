from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import Attendance
from .serializers import AttendanceSerializer
from apps.accounts.permissions import IsStaff, IsStaffOrParent
from apps.accounts.models import UserRole


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("student", "taken_by__user").all()
    serializer_class = AttendanceSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["date", "status"]
    ordering_fields = ["date", "created_at"]
    ordering = ["date"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "summary"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        user = self.request.user

        if user.role == UserRole.PARENT:
            queryset = queryset.filter(student__guardians=user)

        class_id = params.get("class_room")
        if class_id:
            queryset = queryset.filter(student__class_room_id=class_id)

        student_id = params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        date_from = params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)

        date_to = params.get("date_to")
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        """Auto-assign the recording staff member."""
        staff = getattr(self.request.user, "staff", None)
        serializer.save(taken_by=staff)

    def perform_update(self, serializer):
        staff = getattr(self.request.user, "staff", None)
        serializer.save(taken_by=staff)

    @action(detail=False, methods=["post"], url_path="bulk_save")
    def bulk_save(self, request):
        """
        Idempotent bulk upsert — create or update attendance records.

        Request body:
            [{"student": <id>, "date": "YYYY-MM-DD", "status": "present"|"absent"|"late"|"excused", "remarks": ""}]
        """
        records = request.data
        if not isinstance(records, list):
            return Response(
                {"detail": "Expected a list of attendance records."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff = getattr(request.user, "staff", None)
        saved = []
        errors = []

        for record in records:
            student_id = record.get("student")
            date = record.get("date")
            att_status = record.get("status", "present")
            remarks = record.get("remarks", "")

            if not student_id or not date:
                errors.append({"record": record, "error": "student and date are required."})
                continue

            try:
                obj, created = Attendance.objects.update_or_create(
                    student_id=student_id,
                    date=date,
                    defaults={
                        "status": att_status,
                        "remarks": remarks,
                        "taken_by": staff,
                    },
                )
                saved.append({"id": obj.id, "student": student_id, "date": date, "created": created})
            except Exception as e:
                errors.append({"record": record, "error": str(e)})

        response_data = {"saved": len(saved), "errors": errors}
        http_status = status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS
        return Response(response_data, status=http_status)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Returns per-day attendance counts for a class in a date range.

        Query params: class_room, date_from, date_to
        Response: [{"date": "YYYY-MM-DD", "present": N, "absent": N, "late": N, "excused": N, "total": N}]
        """
        queryset = self.get_queryset()

        from django.db.models.functions import TruncDate
        daily = (
            queryset
            .values("date")
            .annotate(
                present=Count("id", filter=Q(status="present")),
                absent=Count("id", filter=Q(status="absent")),
                late=Count("id", filter=Q(status="late")),
                excused=Count("id", filter=Q(status="excused")),
                total=Count("id"),
            )
            .order_by("date")
        )

        return Response(list(daily))
