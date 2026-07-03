import random
from datetime import datetime

from rest_framework import viewsets, permissions, filters, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Student, Application
from .serializers import (
    StudentSerializer,
    StudentSummarySerializer,
    ApplicationSerializer,
)
from apps.accounts.permissions import IsStaff, IsParent, IsStaffOrParent


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["grade_level", "class_room", "status", "boarding_status"]
    search_fields = [
        "first_name",
        "last_name",
        "admission_number",
        "primary_contact_phone",
    ]
    ordering_fields = ["admission_number", "first_name", "last_name", "fee_balance"]

    def get_serializer_class(self):
        if self.action == "list":
            return StudentSummarySerializer
        return StudentSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsStaffOrParent()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "parent":
            return Student.objects.filter(guardians=user)
        return super().get_queryset()


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    Admission applications.

    - Anyone can submit (POST /api/students/applications/) — this is the
      public "Apply Now" form on the school website, so it must not require auth.
    - Only staff can list/view/update/review applications.
    - Status changes go through `status` and `convert` actions rather than a
      raw PATCH, so we can enforce the workflow and side effects in one place.
    """

    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["grade_applying", "source"]
    ordering_fields = ["submitted_at"]
    ordering = ["-submitted_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get("status")
        if status:
            if status == "pending":
                queryset = queryset.filter(status__in=["pending", "interview_scheduled"])
            else:
                queryset = queryset.filter(status=status)
        return queryset


    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def perform_create(self, serializer):
        # Public submissions are always "website" sourced and start pending;
        # staff-recorded walk-ins can pass source explicitly via the same endpoint.
        serializer.save(source=self.request.data.get("source", "website"))

    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request, pk=None):
        """
        Move an application forward/reject it.
        Body: { "status": "interview_scheduled" | "offered" | "rejected" | "withdrawn",
                 "interviewDate": "YYYY-MM-DD" (optional),
                 "notes": "..." (optional),
                 "rejectionReason": "..." (optional, required if status=rejected) }
        """
        application = self.get_object()
        new_status = request.data.get("status")
        valid_statuses = [
            c[0] for c in Application.STATUS_CHOICES if c[0] != "enrolled"
        ]

        if new_status not in valid_statuses:
            return Response(
                {
                    "detail": f"status must be one of {valid_statuses}. Use the convert/ action to enrol."
                },
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        application.status = new_status
        application.reviewed_by = request.user
        if request.data.get("interviewDate"):
            application.interview_date = request.data["interviewDate"]
        if request.data.get("notes"):
            application.notes = request.data["notes"]
        if new_status == "rejected":
            application.rejection_reason = request.data.get("rejectionReason", "")
        application.save()

        # Hook point: fire an SMS/email to the parent about the status change.
        # Not wired to a real gateway yet — see apps/notifications.
        # notify_application_status(application)

        return Response(ApplicationSerializer(application).data)

    @action(detail=True, methods=["post"], url_path="convert")
    def convert(self, request, pk=None):
        """
        Turn an approved application into a real Student (+ parent User account,
        reusing StudentSerializer's existing guardian-sync logic).
        Body: { "classId": "<ClassRoom id>" }  — required, since applications
        aren't tied to a specific class/stream until admission is confirmed.
        """
        application = self.get_object()

        if application.status not in ["offered", "interview_scheduled", "pending"]:
            return Response(
                {
                    "detail": f"Cannot convert an application with status '{application.status}'."
                },
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        if application.converted_student_id:
            return Response(
                {"detail": "This application has already been converted to a student."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        class_id = request.data.get("classId")
        if not class_id:
            return Response(
                {"detail": "classId is required to enrol a student."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        student_payload = {
            "id": f"std-{int(datetime.now().timestamp() * 1000)}-{random.randint(100, 999)}",
            "firstName": application.first_name,
            "lastName": application.last_name,
            "otherName": application.other_name,
            "admissionNumber": f"ADM-{datetime.now().year}-{random.randint(10000, 99999)}",
            "gender": application.gender,
            "dateOfBirth": application.dob,
            "gradeLevel": application.grade_applying,
            "classId": class_id,
            "curriculum": application.curriculum,
            "boardingStatus": application.boarding_type,
            "admissionDate": datetime.now().date().isoformat(),
            "primary_contact_name": application.parent_name,
            "primary_contact_phone": application.parent_phone,
            "nemisNumber": application.nemis_number,
            "birthCertNumber": application.birth_cert_number,
        }


        serializer = StudentSerializer(data=student_payload)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        application.converted_student = student
        application.status = "enrolled"
        application.reviewed_by = request.user
        application.save()

        return Response(
            {
                "application": ApplicationSerializer(application).data,
                "student": StudentSerializer(student).data,
            },
            status=http_status.HTTP_201_CREATED,
        )
