from rest_framework import viewsets, permissions
from .models import Staff
from .serializers import StaffSerializer, StaffSummarySerializer
from apps.accounts.permissions import IsSchoolAdmin, IsStaff as IsStaffMember

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    
    def get_serializer_class(self):
        if self.action == "list":
            return StaffSummarySerializer
        return StaffSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            # All staff can see other staff, but maybe restricted details?
            # For now, allow IsStaffMember
            return [IsStaffMember()]
        return [IsSchoolAdmin()]
