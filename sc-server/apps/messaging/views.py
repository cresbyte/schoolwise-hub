from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsStaff, IsStaffOrParent
from apps.accounts.models import UserRole
from .models import SchoolMessage, ParentReply, MessageRead
from .serializers import SchoolMessageSerializer, ParentReplySerializer


class SchoolMessageViewSet(viewsets.ModelViewSet):
    """Broadcast school messages with parent-visibility filtering."""
    queryset = SchoolMessage.objects.select_related(
        "sender", "target_class", "student"
    ).prefetch_related("replies", "reads").all().order_by("-created_at")
    serializer_class = SchoolMessageSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["scope", "channel"]
    search_fields = ["title", "body"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "read"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == UserRole.PARENT:
            # Parents see messages scoped to school, their children's grades/classes,
            # or messages targeted individually at their children.
            from apps.students.models import Student
            children = Student.objects.filter(guardians=user)
            grade_levels = list(children.values_list("grade_level", flat=True).distinct())
            class_ids = list(children.values_list("class_room_id", flat=True).distinct())
            student_ids = list(children.values_list("id", flat=True))

            queryset = queryset.filter(
                scope__in=["school"] if not grade_levels else []
            ) | queryset.filter(
                scope="grade", target_grade__in=grade_levels
            ) | queryset.filter(
                scope="class", target_class_id__in=class_ids
            ) | queryset.filter(
                scope="individual", student_id__in=student_ids
            )
            # Deduplicate
            queryset = SchoolMessage.objects.filter(
                id__in=queryset.values_list("id", flat=True)
            ).select_related("sender", "target_class", "student").prefetch_related("replies", "reads").order_by("-created_at")

        student_id = self.request.query_params.get("student")
        if student_id:
            # Return messages relevant to this specific student
            if user.role == UserRole.PARENT:
                from apps.students.models import Student
                try:
                    student = Student.objects.get(id=student_id, guardians=user)
                    queryset = SchoolMessage.objects.filter(
                        id__in=(
                            SchoolMessage.objects.filter(scope="school") |
                            SchoolMessage.objects.filter(scope="grade", target_grade=student.grade_level) |
                            SchoolMessage.objects.filter(scope="class", target_class=student.class_room) |
                            SchoolMessage.objects.filter(scope="individual", student=student)
                        ).values_list("id", flat=True)
                    ).select_related("sender", "target_class", "student").prefetch_related("replies", "reads").order_by("-created_at")
                except Student.DoesNotExist:
                    queryset = SchoolMessage.objects.none()
            # Staff can filter by student too
            else:
                from apps.students.models import Student
                try:
                    student = Student.objects.get(id=student_id)
                    queryset = SchoolMessage.objects.filter(
                        id__in=(
                            SchoolMessage.objects.filter(scope="school") |
                            SchoolMessage.objects.filter(scope="grade", target_grade=student.grade_level) |
                            SchoolMessage.objects.filter(scope="class", target_class=student.class_room) |
                            SchoolMessage.objects.filter(scope="individual", student=student)
                        ).values_list("id", flat=True)
                    ).select_related("sender", "target_class", "student").prefetch_related("replies", "reads").order_by("-created_at")
                except Student.DoesNotExist:
                    pass

        return queryset

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        """Mark this message as read for the current user."""
        msg = self.get_object()
        MessageRead.objects.get_or_create(user=request.user, school_message=msg)
        return Response({"status": "read"})


class ParentReplyViewSet(viewsets.ModelViewSet):
    """Parent replies to school messages."""
    queryset = ParentReply.objects.select_related("message", "student").all().order_by("-sent_at")
    serializer_class = ParentReplySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["message", "student"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        if self.action in ["create"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == UserRole.PARENT:
            from apps.students.models import Student
            children = Student.objects.filter(guardians=user)
            queryset = queryset.filter(student__in=children)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        name = user.name or user.email
        serializer.save(parent_name=name)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        """Mark a reply as read by staff."""
        reply = self.get_object()
        reply.read_by_staff = True
        reply.save()
        return Response({"status": "read"})
