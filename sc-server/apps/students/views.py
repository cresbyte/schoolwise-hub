from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Student
from .serializers import StudentSerializer, StudentSummarySerializer
from apps.accounts.permissions import IsStaff, IsParent, IsStaffOrParent

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["grade_level", "class_room", "status", "boarding_status"]
    search_fields = ["first_name", "last_name", "admission_number", "primary_contact_phone"]
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
