from rest_framework import generics, permissions
from .models import School
from .serializers import SchoolSerializer
from apps.accounts.permissions import IsSchoolAdmin

class SchoolDetailView(generics.RetrieveUpdateAPIView):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    
    def get_object(self):
        return School.objects.first()

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [IsSchoolAdmin()]
