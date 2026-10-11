from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from django.utils.crypto import get_random_string
from rest_framework.decorators import action
from django.db.models import Q
from django.db import transaction
from rest_framework.throttling import ScopedRateThrottle


from .models import Student
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer, UserCreateSerializer,
    ChangePasswordSerializer, StudentSerializer, StudentSummarySerializer,
    StaffSerializer, StaffSummarySerializer, SelfProfileSerializer, SelfChangePasswordSerializer, AdminSetPasswordSerializer, AdminUserUpdateSerializer, UserListSerializer
)
# from core.permissions import IsSchoolAdmin, IsStaffOrParent (I will redefine these in core.permissions)
from .permissions import IsSchoolAdmin, IsStaffOrParent

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """POST /api/auth/logout/"""
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out successfully."})
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/"""
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user


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
        return Response({"detail": "Password changed successfully."})


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/         — list users; supports ?role=parent&phone=254XXXXXXXXX filters
    POST /api/auth/users/         — create a user
    """
    permission_classes = [IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by("name")

        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)

        phone = self.request.query_params.get("phone")
        if phone:
            qs = qs.filter(phone=phone)

        return qs


class ParentLookupView(APIView):
    """
    GET /api/auth/parents/lookup/?phone=07XXXXXXXXX

    Used on the admission form to detect whether an existing account already has
    the given phone number. Returns a single JSON object:
        { id, name, email, role, children: [{ name, className }] }
    or HTTP 404 if no user exists with that phone.
    Matches any user role (parent, teacher, etc.) so the front-end can show an
    appropriate confirmation dialog in all cases.
    """
    permission_classes = [IsSchoolAdmin]

    def get(self, request):
        phone = request.query_params.get("phone", "").strip()
        if not phone:
            return Response(
                {"detail": "Provide a ?phone= query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Match any existing user with this phone — not just parents.
        # If the phone belongs to a teacher or other staff member we still want
        # the front-end to show the "is this the same person?" dialog so the
        # clerk can explicitly decide to link or reject, rather than having the
        # server silently reuse a staff account.
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(None, status=status.HTTP_404_NOT_FOUND)

        # Build the list of children this user is already linked to as a parent.
        children = [
            {
                "name": f"{s.first_name} {s.last_name}",
                "className": s.class_room.name if s.class_room else "",
            }
            for s in user.children.select_related("class_room").all()
        ]

        return Response({
            "id": user.id,
            "name": user.name,
            "email": user.email or "",
            "role": user.role,
            "children": children,
        })


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSchoolAdmin]


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["grade_level", "class_room", "status"]
    search_fields = ["first_name", "last_name", "admission_number"]
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
            return Student.objects.filter(parents=user)
        return super().get_queryset()


class StaffViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_staff=True).exclude(role='parent')
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "phone", "staff_id"]

    def get_serializer_class(self):
        if self.action == "list":
            return StaffSummarySerializer
        return StaffSerializer

    def get_permissions(self):
        from .permissions import IsStaff
        if self.action in ["list", "retrieve"]:
            return [IsStaff()]
        return [IsSchoolAdmin()]

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """POST /api/staff/<id>/reset-password/ — admin sets a new temporary password."""
        user = self.get_object()
        temp_password = get_random_string(10)
        user.set_password(temp_password)
        user.save(update_fields=["password"])
        return Response({"temporaryPassword": temp_password})


class PortalChildrenView(APIView):
    """
    GET /api/portal/children/

    Returns the current parent's children with their summary data:
    class, attendance rate this month, fee balance, unread notices.
    One request, one response — nothing else needed for the home page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "parent":
            raise PermissionDenied("This endpoint is for parents.")

        from attendance.services import student_attendance_summary
        from fees.services import student_fee_summary
        from datetime import date, timedelta

        month_ago = date.today() - timedelta(days=30)
        today = date.today()

        children = request.user.children.select_related("class_room").all()
        out = []
        for student in children:
            attendance = student_attendance_summary(student, month_ago, today)
            fees = student_fee_summary(student)
            out.append({
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}".strip(),
                "admissionNumber": student.admission_number,
                "photo": student.photo.url if student.photo else None,
                "gradeLevel": student.grade_level,
                "className": student.class_room.name if student.class_room else "",
                "status": student.status,
                "attendance": {
                    "rate": attendance["attendance_rate"],
                    "present": attendance["present"],
                    "absent": attendance["absent"],
                    "schoolDays": attendance["school_days"],
                },
                "fees": {
                    "balance": str(fees["balance"]),
                    "totalInvoiced": str(fees["totalInvoiced"]),
                    "totalPaid": str(fees["totalPaid"]),
                    "daysOverdue": fees["daysOverdue"],
                },
            })

        return Response(out)


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/          — list users; filters: ?role=&search=&is_active=
    POST /api/auth/users/          — create a user
    """
    permission_classes = [IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserListSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by("name")

        role = self.request.query_params.get("role")
        if role:
            # "staff" means any non-parent
            if role == "staff":
                qs = qs.exclude(role="parent")
            else:
                qs = qs.filter(role=role)

        is_active = self.request.query_params.get("is_active")
        if is_active in ("true", "1"):
            qs = qs.filter(is_active=True)
        elif is_active in ("false", "0"):
            qs = qs.filter(is_active=False)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(phone__icontains=search)
                | Q(email__icontains=search)
                | Q(staff_id__icontains=search)
            )

        return qs


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/auth/users/<id>/
    PATCH  /api/auth/users/<id>/    — admin full edit
    DELETE /api/auth/users/<id>/    — soft delete via is_active=False (safer)
    """
    queryset = User.objects.all()
    permission_classes = [IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return AdminUserUpdateSerializer
        return UserListSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSetPasswordView(APIView):
    """POST /api/auth/users/<id>/set-password/ — admin sets a new password."""
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        serializer = AdminSetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated."})


class UserToggleActiveView(APIView):
    """POST /api/auth/users/<id>/toggle-active/ — flip is_active."""
    permission_classes = [IsSchoolAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        if user == request.user:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response({"id": user.id, "isActive": user.is_active})


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/     — current user (any role)
    PATCH /api/auth/me/     — update own profile (narrow fields)
    """
    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return SelfProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — user changes own password."""
    def post(self, request):
        serializer = SelfChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"detail": "Old password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password changed successfully."})


class ParentChildrenView(APIView):
    """
    GET  /api/auth/users/<id>/children/    — list this parent's linked children
    POST /api/auth/users/<id>/children/    — replace the whole link set
    """
    permission_classes = [IsSchoolAdmin]

    def get(self, request, pk):
        try:
            parent = User.objects.get(pk=pk, role="parent")
        except User.DoesNotExist:
            return Response({"detail": "Parent not found."}, status=404)

        links = parent.child_links.select_related("student").all()
        return Response([
            {
                "studentId": link.student_id,
                "studentName": f"{link.student.first_name} {link.student.last_name}".strip(),
                "admissionNumber": link.student.admission_number,
                "className": link.student.class_room.name if link.student.class_room else "",
                "relationship": link.relationship,
            }
            for link in links
        ])

    def post(self, request, pk):
        """
        Body: { children: [{ studentId, relationship }] }
        Replaces all links for this parent with the submitted set.
        """
        from .models import ParentRelationship

        try:
            parent = User.objects.get(pk=pk, role="parent")
        except User.DoesNotExist:
            return Response({"detail": "Parent not found."}, status=404)

        items = request.data.get("children", [])
        if not isinstance(items, list):
            return Response({"detail": "children must be an array."}, status=400)

        with transaction.atomic():
            parent.child_links.all().delete()
            created = []
            for item in items:
                sid = item.get("studentId")
                relationship = item.get("relationship") or "guardian"
                if not sid:
                    continue
                created.append(ParentRelationship(
                    parent=parent,
                    student_id=sid,
                    relationship=relationship,
                ))
            ParentRelationship.objects.bulk_create(created, ignore_conflicts=True)

        return Response({"linked": len(created)})
