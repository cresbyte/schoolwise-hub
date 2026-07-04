from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from decouple import config as env_config
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

class IntegrationsStatusView(APIView):
    """
    Read-only status check so the settings UI can show whether email/M-Pesa/SMS
    are configured, WITHOUT ever exposing the actual credential values.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "emailConfigured": bool(env_config("EMAIL_HOST", default="")),
            "mpesaConfigured": bool(env_config("MPESA_CONSUMER_KEY", default="")),
            "smsConfigured": bool(env_config("AFRICASTALKING_API_KEY", default="")),
        })
