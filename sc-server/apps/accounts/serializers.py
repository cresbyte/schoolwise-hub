from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds role, name, and user_id to JWT payload so frontend can read role without extra API call."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["name"] = user.name
        token["firstName"] = user.first_name
        token["lastName"] = user.last_name
        token["gender"] = user.gender
        token["birthDate"] = user.birth_date
        token["phone"] = user.phone
        token["photo"] = user.photo.url if user.photo else None
        
        # Link to staff profile if exists
        staff_profile = getattr(user, "staff_profile", None)
        token["staffId"] = staff_profile.pk if staff_profile else None
        
        if staff_profile:
            token["classTeacherOf"] = list(staff_profile.classes_assigned.values_list("id", flat=True))
            token["subjectsTaught"] = list(staff_profile.subject_assignments.values("subject__name", "class_room__id", "class_room__name", "periods_per_week"))
        
        # Link to student IDs if parent (requires relationship mapping)
        if user.role == "parent":
            token["studentIds"] = list(user.children.values_list("id", flat=True))
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        staff_profile = getattr(self.user, "staff_profile", None)
        # Include user details in login response (not just tokens)
        user_data = {
            "id": self.user.id,
            "name": self.user.name,
            "firstName": self.user.first_name,
            "lastName": self.user.last_name,
            "gender": self.user.gender,
            "birthDate": self.user.birth_date,
            "phone": self.user.phone,
            "email": self.user.email,
            "role": self.user.role,
            "photo": self.user.photo.url if self.user.photo else None,
            "staffId": staff_profile.pk if staff_profile else None,
            "isActive": self.user.is_active,
        }
        if staff_profile:
            user_data["classTeacherOf"] = list(staff_profile.classes_assigned.values_list("id", flat=True))
            user_data["subjectsTaught"] = list(staff_profile.subject_assignments.values("subject__name", "class_room__id", "class_room__name", "periods_per_week"))
        
        if self.user.role == "parent":
            user_data["studentIds"] = list(self.user.children.values_list("id", flat=True))
        data["user"] = user_data
        return data

class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    birthDate = serializers.DateField(source="birth_date")
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    studentIds = serializers.SerializerMethodField()
    classTeacherOf = serializers.SerializerMethodField()
    subjectsTaught = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "name", "firstName", "lastName", "gender", "birthDate", 
            "phone", "email", "role", "photo", "isActive", "last_login", "created_at",
            "studentIds", "classTeacherOf", "subjectsTaught"
        ]
        read_only_fields = ["id", "last_login", "created_at"]

    def get_studentIds(self, obj):
        if obj.role == "parent":
            return list(obj.children.values_list("id", flat=True))
        return []

    def get_classTeacherOf(self, obj):
        staff_profile = getattr(obj, "staff_profile", None)
        if staff_profile:
            return list(staff_profile.classes_assigned.values_list("id", flat=True))
        return []

    def get_subjectsTaught(self, obj):
        staff_profile = getattr(obj, "staff_profile", None)
        if staff_profile:
            return list(staff_profile.subject_assignments.values("subject__name", "class_room__id", "class_room__name", "periods_per_week"))
        return []

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["name", "phone", "email", "role", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
