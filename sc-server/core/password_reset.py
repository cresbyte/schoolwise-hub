"""Password reset endpoints.

POST /api/auth/password-reset/request/   { phone }
POST /api/auth/password-reset/confirm/   { phone, code, new_password }
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .auth_services import request_reset_code, reset_password_with_code

User = get_user_model()

# Same answer whether or not the account exists, so nobody can use this
# endpoint to find out which phone numbers are registered.
SENT_MESSAGE = (
    "If that account has an email on file, we've sent a 6-digit code. "
    "It expires in 5 minutes."
)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # an old or expired token must not block this
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        phone = str(request.data.get("phone", "")).strip()

        if phone:
            user = (
                User.objects.filter(phone=phone, is_active=True)
                .exclude(email__isnull=True)
                .exclude(email="")
                .first()
            )
            if user:
                request_reset_code(user)

        return Response({"detail": SENT_MESSAGE})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_confirm"

    def post(self, request):
        phone = str(request.data.get("phone", "")).strip()
        code = str(request.data.get("code", "")).strip()
        new_password = str(request.data.get("new_password", ""))

        user = User.objects.filter(phone=phone, is_active=True).first()

        # Check the password first, so a weak password doesn't use up the code
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response({"detail": " ".join(e.messages)}, status=400)

        if (
            not user
            or not code
            or not reset_password_with_code(user, code, new_password)
        ):
            return Response(
                {"detail": "That code is invalid or has expired."}, status=400
            )

        return Response({"detail": "Password updated. You can now log in."})
