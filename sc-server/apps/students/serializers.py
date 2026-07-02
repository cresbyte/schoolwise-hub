from rest_framework import serializers
from .models import Student
from apps.academics.models import ClassRoom
from apps.academics.serializers import ClassRoomSerializer

class StudentSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    otherName = serializers.CharField(source="other_name", required=False, allow_null=True, allow_blank=True)
    admissionNumber = serializers.CharField(source="admission_number")
    dateOfBirth = serializers.DateField(source="date_of_birth")
    gradeLevel = serializers.CharField(source="grade_level")
    class_room_name = serializers.CharField(source="class_room.name", read_only=True)
    classId = serializers.PrimaryKeyRelatedField(source="class_room", queryset=ClassRoom.objects.all())
    admissionDate = serializers.DateField(source="admission_date")
    boardingStatus = serializers.CharField(source="boarding_status")
    nemisNumber = serializers.CharField(source="nemis_number", required=False, allow_null=True, allow_blank=True)
    birthCertNumber = serializers.CharField(source="birth_cert_number", required=False, allow_null=True, allow_blank=True)
    homeLocation = serializers.CharField(source="home_location", required=False, allow_null=True, allow_blank=True)
    feeBalance = serializers.DecimalField(source="fee_balance", max_digits=12, decimal_places=2, read_only=True)
    
    avatarUrl = serializers.CharField(source="photo", read_only=True)
    
    parent = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "firstName", "lastName", "otherName", "admissionNumber", 
            "gender", "dateOfBirth", "gradeLevel", "classId", "class_room_name", 
            "curriculum", "admissionDate", "boardingStatus", "status", 
            "nemisNumber", "birthCertNumber", "homeLocation", "feeBalance", 
            "photo", "avatarUrl", "health_info", "guardians", "parent",
            "father_name", "father_phone", "father_email", "father_id_number", "father_occupation",
            "mother_name", "mother_phone", "mother_occupation",
            "primary_contact_name", "primary_contact_phone",
        ]

    def get_parent(self, obj):
        return {
            "fatherName": obj.father_name,
            "fatherPhone": obj.father_phone,
            "fatherEmail": obj.father_email,
            "fatherIdNumber": obj.father_id_number,
            "fatherOccupation": obj.father_occupation,
            "motherName": obj.mother_name,
            "motherPhone": obj.mother_phone,
            "motherOccupation": obj.mother_occupation,
            "primaryContactName": obj.primary_contact_name,
            "primaryContactPhone": obj.primary_contact_phone,
        }

    def create(self, validated_data):
        guardians = validated_data.pop("guardians", None)
        student = super().create(validated_data)
        if guardians:
            student.guardians.set(guardians)
        self._sync_guardian(student)
        return student

    def update(self, instance, validated_data):
        guardians = validated_data.pop("guardians", None)
        student = super().update(instance, validated_data)
        if guardians is not None:
            student.guardians.set(guardians)
        self._sync_guardian(student)
        return student

    def _sync_guardian(self, student):
        phone = student.primary_contact_phone
        name = student.primary_contact_name
        
        if phone:
            from apps.accounts.models import User
            if not name:
                name = "Parent of " + student.first_name
            
            # Check if there is already a parent with this phone
            parent_user = User.objects.filter(phone=phone).first()
            if not parent_user:
                # Create parent account
                names = name.strip().split(" ", 1)
                first_name = names[0]
                last_name = names[1] if len(names) > 1 else ""
                parent_user = User.objects.create_user(
                    phone=phone,
                    name=name,
                    first_name=first_name,
                    last_name=last_name,
                    role="parent",
                )
                parent_user.set_password("parent123")
                parent_user.save()
            
            # Sync the guardians ManyToMany relationship
            if parent_user not in student.guardians.all():
                student.guardians.add(parent_user)

class StudentSummarySerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    admissionNumber = serializers.CharField(source="admission_number", read_only=True)
    className = serializers.CharField(source="class_room.name", read_only=True)
    classId = serializers.CharField(source="class_room_id", read_only=True)
    curriculum = serializers.CharField(read_only=True)
    boardingStatus = serializers.CharField(source="boarding_status", read_only=True)
    feeBalance = serializers.DecimalField(source="fee_balance", max_digits=12, decimal_places=2, read_only=True)
    avatarUrl = serializers.CharField(source="photo", read_only=True)
    name = serializers.SerializerMethodField()
    primary_contact_phone = serializers.CharField(read_only=True)
    parent = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id", "name", "firstName", "lastName", "admissionNumber", 
            "grade_level", "className", "classId", "curriculum", "gender", "status", "photo", "avatarUrl",
            "boardingStatus", "feeBalance", "primary_contact_phone", "parent"
        ]

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_parent(self, obj):
        return {
            "primaryContactPhone": obj.primary_contact_phone
        }
