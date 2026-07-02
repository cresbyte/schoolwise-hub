from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import CustomTokenObtainPairSerializer, UserSerializer, UserCreateSerializer, ChangePasswordSerializer
from .permissions import IsSchoolAdmin

class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — returns access + refresh tokens + user object"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            from apps.notifications.utils import log_action
            user = User.objects.get(phone=request.data.get("phone"))
            log_action(
                user=user,
                action="Login",
                module="Authentication",
                description=f"User logged in from {request.META.get('REMOTE_ADDR')}"
            )
        return response

class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklists the refresh token"""
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out successfully."})
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — get or update own profile"""
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        from apps.notifications.utils import log_action
        serializer.save()
        log_action(
            user=self.request.user,
            action="Profile Update",
            module="Accounts",
            description="User updated their profile details."
        )

class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"detail": "Old password is incorrect."}, status=400)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        
        from apps.notifications.utils import log_action
        log_action(
            user=user,
            action="Password Change",
            module="Security",
            description="User successfully changed their password."
        )
        
        return Response({"detail": "Password changed successfully."})

class UserListCreateView(generics.ListCreateAPIView):
    """GET /api/users/ — admin only"""
    queryset = User.objects.all().order_by("name")
    permission_classes = [IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSchoolAdmin]
