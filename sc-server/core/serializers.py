import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from academics.models import ClassRoom
from school.services import get_current_period

User = get_user_model()

from .models import ParentRelationship, Student, UserRole


# ============================================================================
# Auth
# ============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["name"] = user.name

        # Link to student IDs if parent
        if user.role == "parent":
            token["studentIds"] = list(user.children.values_list("id", flat=True))
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = {
            "id": self.user.id,
            "name": self.user.name,
            "gender": self.user.gender,
            "birthDate": self.user.birth_date,
            "phone": self.user.phone,
            "email": self.user.email,
            "role": self.user.role,
            "photo": self.user.photo.url if self.user.photo else None,
            "isActive": self.user.is_active,
        }

        if self.user.role == "parent":
            user_data["studentIds"] = list(self.user.children.values_list("id", flat=True))

        data["user"] = user_data
        return data


class UserSerializer(serializers.ModelSerializer):
    birthDate = serializers.DateField(source="birth_date", required=False, allow_null=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    studentIds = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "name", "gender", "birthDate",
            "phone", "email", "role", "photo", "isActive", "last_login", "created_at",
            "studentIds",
        ]
        read_only_fields = ["id", "last_login", "created_at"]

    def get_studentIds(self, obj):
        if obj.role == "parent":
            return list(obj.children.values_list("id", flat=True))
        return []


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    birthDate = serializers.DateField(
        source="birth_date", required=False, allow_null=True
    )
    staffNumber = serializers.CharField(
        source="staff_id", required=False, allow_blank=True
    )
    gender = serializers.CharField(required=False, allow_blank=True)
    designation = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "name",
            "phone",
            "email",
            "role",
            "password",
            "gender",
            "birthDate",
            "staffNumber",
            "designation",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Auto-generate a staff number if blank and the role is staff
        if validated_data.get("role") != "parent" and not validated_data.get(
            "staff_id"
        ):
            from django.utils.crypto import get_random_string

            validated_data["staff_id"] = f"STF-{get_random_string(6).upper()}"
        user = User.objects.create_user(password=password, **validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)


# ============================================================================
# Staff
# ============================================================================

class StaffSerializer(serializers.ModelSerializer):
    """Serializer for Staff that maps to the core User model under the hood."""

    id = serializers.IntegerField(source="pk", read_only=True)
    staffNumber = serializers.CharField(source="staff_id", required=False, allow_blank=True)
    dateOfBirth = serializers.DateField(source="birth_date", required=False, allow_null=True)
    photoUrl = serializers.SerializerMethodField()

    # Optional fields for compatibility, map to None or default if not needed anymore
    contractType = serializers.CharField(required=False, allow_blank=True, default="permanent")
    idNumber = serializers.CharField(required=False, allow_blank=True)
    basic_salary = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0.00)

    class Meta:
        model = User
        fields = [
            "id", "staffNumber", "name", "gender", "dateOfBirth",
            "phone", "email", "photoUrl", "designation", "role", "is_active",
            "contractType", "idNumber", "basic_salary",
        ]

    def get_photoUrl(self, obj):
        if obj.photo:
            return obj.photo.url
        return None

    def create(self, validated_data):
        from django.utils.crypto import get_random_string

        # Remove dummy fields
        validated_data.pop("contractType", None)
        validated_data.pop("idNumber", None)
        validated_data.pop("basic_salary", None)

        designation = validated_data.get("designation", "").lower()
        role = UserRole.ACCOUNTANT if "account" in designation else UserRole.TEACHER

        if not validated_data.get("staff_id"):
            validated_data["staff_id"] = f"STF-{get_random_string(6).upper()}"

        user = User.objects.create_user(
            phone=validated_data.get("phone"),
            name=validated_data.get("name"),
            email=validated_data.get("email", ""),
            gender=validated_data.get("gender", ""),
            birth_date=validated_data.get("birth_date"),
            staff_id=validated_data.get("staff_id"),
            designation=validated_data.get("designation", ""),
            role=role,
            is_staff=True,
        )

        user.set_password(get_random_string(10))
        user.save()
        return user


class StaffSummarySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="pk", read_only=True)
    staffNumber = serializers.CharField(source="staff_id", read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "staffNumber", "name", "phone", "designation", "status"]

    def get_status(self, obj):
        return "active" if obj.is_active else "inactive"


# ============================================================================
# Students
# ============================================================================

class ParentInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False, allow_null=True)
    existingParentId = serializers.IntegerField(required=False, allow_null=True)
    relationship = serializers.CharField(default="guardian")
    name = serializers.CharField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)
    email = serializers.EmailField(allow_blank=True, required=False)


class StudentSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    otherName = serializers.CharField(source="other_name", required=False, allow_null=True, allow_blank=True)
    admissionNumber = serializers.CharField(source="admission_number")
    dateOfBirth = serializers.DateField(source="date_of_birth")
    gradeLevel = serializers.CharField(source="grade_level", required=False)
    className = serializers.CharField(source="class_room.name", read_only=True)
    classId = serializers.PrimaryKeyRelatedField(
        source="class_room",
        queryset=ClassRoom.objects.all(),
        required=False,
        allow_null=True,
    )
    admissionDate = serializers.DateField(
        source="admission_date", required=False, allow_null=True
    )
    nemisNumber = serializers.CharField(source="nemis_number", required=False, allow_null=True, allow_blank=True)
    birthCertNumber = serializers.CharField(source="birth_cert_number", required=False, allow_null=True, allow_blank=True)
    homeLocation = serializers.CharField(source="home_location", required=False, allow_null=True, allow_blank=True)
    feeBalance = serializers.DecimalField(
        source="fee_balance", max_digits=12, decimal_places=2, read_only=True
    )
    photo = serializers.ImageField(required=False, allow_null=True)

    # Read: full parent detail with relationship labels
    parents = serializers.SerializerMethodField()

    # Write: receives the array of parent objects from the frontend
    parents_data = ParentInputSerializer(many=True, required=False, write_only=True)

    # Read: the student's current active enrollment, or null
    currentEnrollment = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "firstName", "lastName", "otherName", "admissionNumber", "gender",
            "dateOfBirth", "gradeLevel", "classId", "className", "admissionDate",
            "status", "nemisNumber", "birthCertNumber", "homeLocation", "feeBalance",
            "photo", "health_info", "parents", "parents_data", "currentEnrollment",
        ]
        read_only_fields = ["id", "currentEnrollment"]

    # ---- read helpers -----------------------------------------------------

    def get_parents(self, obj):
        """Return each parent with their relationship label from the through model."""
        result = []
        for link in obj.parent_links.select_related("parent").all():
            p = link.parent
            result.append({
                "id": p.id,
                "existingParentId": p.id,
                "relationship": link.relationship,
                "name": p.name,
                "phone": p.phone,
                "email": p.email or "",
            })
        return result

    def get_currentEnrollment(self, obj):
        """
        Return the active enrollment (or None).

        This is what the frontend should read to know which class/year the
        student is currently in — Student.class_room is a denormalized cache
        that mirrors this, but the enrollment is the source of truth.
        """
        # Use the prefetched list when available to avoid N+1 on list views.
        enrollments = getattr(obj, "_prefetched_objects_cache", {}).get("enrollments")
        if enrollments is not None:
            active = next((e for e in enrollments if e.status == "active"), None)
        else:
            active = obj.enrollments.filter(status="active").select_related(
                "class_room", "academic_year"
            ).first()

        if not active:
            return None

        return {
            "id": active.id,
            "classId": active.class_room_id,
            "className": active.class_room.name,
            "gradeLevel": active.class_room.grade_level_id,
            "academicYearId": active.academic_year_id,
            "academicYearName": active.academic_year.name,
            "enrolledOn": active.enrolled_on,
            "status": active.status,
        }

    # ---- multipart/form-data handling ------------------------------------

    def to_internal_value(self, data):
        """Handle multipart/form-data where parents_data arrives as a JSON string."""
        import json
        if "parents_data" in data and isinstance(data["parents_data"], str):
            try:
                if hasattr(data, "copy"):
                    data = data.copy()
                data["parents_data"] = json.loads(data["parents_data"])
            except Exception:
                pass
        return super().to_internal_value(data)

    # ---- create / update --------------------------------------------------

    @transaction.atomic
    def create(self, validated_data):
        parents_data = validated_data.pop("parents_data", [])

        # Auto-generate a unique student ID if not provided (CharField primary key).
        if not validated_data.get("id"):
            validated_data["id"] = uuid.uuid4().hex

        # Default admission_date to today if the clerk left it blank.
        if not validated_data.get("admission_date"):
            validated_data["admission_date"] = timezone.now().date()

        # The class is the source of truth for grade_level. If a class was
        # supplied, derive grade_level from it and ignore whatever the client
        # sent — this prevents "gradeLevel: PP2, classId: PP1 A" mismatches.
        class_room = validated_data.get("class_room")
        if class_room is not None:
            validated_data["grade_level"] = class_room.grade_level_id

        student = super().create(validated_data)
        self._sync_parents(student, parents_data)
        self._create_initial_enrollment(student)
        return student

    @transaction.atomic
    def update(self, instance, validated_data):
        parents_data = validated_data.pop("parents_data", None)

        # Class changes must go through the Enrollment API — close the old
        # enrollment and open a new one. Allowing a plain PATCH to change
        # class_room would silently drift Student.class_room away from the
        # active enrollment.
        if "class_room" in validated_data:
            new_class = validated_data["class_room"]
            if new_class is not None and new_class.id != instance.class_room_id:
                raise serializers.ValidationError({
                    "classId": (
                        "To change a student's class, close their current "
                        "enrollment and open a new one via /academics/enrollments/."
                    )
                })
            # No-op write; drop it to keep the payload clean.
            if new_class is not None and new_class.id == instance.class_room_id:
                validated_data.pop("class_room")

        student = super().update(instance, validated_data)
        if parents_data is not None:
            self._sync_parents(student, parents_data)
        return student

    # ---- private helpers --------------------------------------------------

    def _sync_parents(self, student, parents_data):
        """
        Create or update parent User accounts and link them to the student
        via ParentRelationship. Also sets a temporary password on new accounts.
        """
        kept_parent_ids = []

        for pdata in parents_data:
            # Skip completely empty entries
            if not pdata.get("name", "").strip() and not pdata.get("phone", "").strip():
                continue

            relationship = pdata.get("relationship", "guardian")
            parent_id = pdata.get("existingParentId") or pdata.get("id")

            # 1. Find the parent User
            parent = None
            if parent_id:
                # Explicit link via existingParentId (set when clerk clicks
                # "Link" in the form dialog). Accepts any role — a staff
                # member who is also a parent keeps their existing role.
                parent = User.objects.filter(id=parent_id).first()
            if not parent and pdata.get("phone"):
                # Phone-only fallback: match any existing user so we never
                # attempt to create a second account with the same phone
                # (which would hit the UNIQUE constraint and crash the
                # whole transaction).
                parent = User.objects.filter(phone=pdata["phone"]).first()

            # 2. Create a new parent account if not found
            if not parent:
                parent = User.objects.create_user(
                    phone=pdata["phone"],
                    name=pdata.get("name", "Parent"),
                    email=pdata.get("email") or None,
                    role=UserRole.PARENT,
                    password=pdata["phone"],  # initial password = phone number
                )
            else:
                # Update existing parent details if supplied
                changed = False
                if pdata.get("name") and parent.name != pdata["name"]:
                    parent.name = pdata["name"]
                    changed = True
                if pdata.get("email") and parent.email != pdata["email"]:
                    parent.email = pdata["email"]
                    changed = True
                if pdata.get("phone") and parent.phone != pdata["phone"]:
                    parent.phone = pdata["phone"]
                    changed = True
                if changed:
                    parent.save()

            # 3. Create or update the through record
            ParentRelationship.objects.update_or_create(
                student=student,
                parent=parent,
                defaults={"relationship": relationship},
            )
            kept_parent_ids.append(parent.id)

        # Remove links not in the current submission
        student.parent_links.exclude(parent_id__in=kept_parent_ids).delete()

    def _create_initial_enrollment(self, student):
        """
        Every newly admitted student gets exactly one active Enrollment in the
        current academic year, pointing at their class.

        This is the linchpin that lets us answer "which class was this student
        in during 2026?" years later, and it's what attendance, fees and exams
        all key off.

        Raises ValidationError if the student has no class, if no year is
        active, or if their class belongs to a different year.
        """
        from academics.models import Enrollment  # lazy import to avoid cycle

        if not student.class_room_id:
            raise serializers.ValidationError({
                "classId": "A class is required to admit a student."
            })

        year, _term = get_current_period()
        if not year:
            raise serializers.ValidationError({
                "detail": "No active academic year. Activate one before admitting students."
            })

        if student.class_room.academic_year_id != year.id:
            raise serializers.ValidationError({
                "classId": (
                    f"{student.class_room.name} belongs to "
                    f"{student.class_room.academic_year.name}, "
                    f"not the current year ({year.name})."
                )
            })

        Enrollment.objects.create(
            student=student,
            class_room=student.class_room,
            academic_year=year,
            enrolled_on=student.admission_date or timezone.now().date(),
            status=Enrollment.Status.ACTIVE,
        )


class StudentSummarySerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    admissionNumber = serializers.CharField(source="admission_number")
    className = serializers.CharField(source="class_room.name", read_only=True)
    gradeLevel = serializers.CharField(source="grade_level")

    class Meta:
        model = Student
        fields = [
            "id", "firstName", "lastName", "admissionNumber", "gender",
            "className", "gradeLevel", "status",
        ]


class UserListSerializer(serializers.ModelSerializer):
    """Compact list view for the users table."""
    birthDate = serializers.DateField(source="birth_date", required=False, allow_null=True)
    staffNumber = serializers.CharField(source="staff_id", required=False, allow_blank=True)
    isActive = serializers.BooleanField(source="is_active")
    lastLogin = serializers.DateTimeField(source="last_login", read_only=True)
    photoUrl = serializers.SerializerMethodField()
    childrenCount = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "name", "phone", "email", "role", "gender",
            "birthDate", "staffNumber", "designation",
            "isActive", "lastLogin", "photoUrl", "created_at",
            "childrenCount",
        ]
        read_only_fields = ["id", "lastLogin", "created_at"]

    def get_photoUrl(self, obj):
        return obj.photo.url if obj.photo else None

    def get_childrenCount(self, obj):
        if obj.role == "parent":
            return obj.children.count()
        return 0


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Admin-only edits: role, active flag, staff fields."""
    birthDate = serializers.DateField(source="birth_date", required=False, allow_null=True)
    staffNumber = serializers.CharField(source="staff_id", required=False, allow_blank=True)
    isActive = serializers.BooleanField(source="is_active", required=False)

    class Meta:
        model = User
        fields = [
            "name", "phone", "email", "gender", "birthDate", "role",
            "staffNumber", "designation", "isActive", "photo",
        ]

    def validate_phone(self, value):
        qs = User.objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value


class SelfProfileSerializer(serializers.ModelSerializer):
    """
    What a staff or parent can edit about themselves. Deliberately narrow:
    no role, no is_active, no staff_id, no phone (login identifier).
    """
    birthDate = serializers.DateField(source="birth_date", required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["name", "email", "gender", "birthDate", "photo"]


class AdminSetPasswordSerializer(serializers.Serializer):
    """Admin sets a new password for a user (no old-password check)."""
    new_password = serializers.CharField(min_length=6, write_only=True)


class SelfChangePasswordSerializer(serializers.Serializer):
    """User changes their own password (old-password check required)."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=6, write_only=True)
