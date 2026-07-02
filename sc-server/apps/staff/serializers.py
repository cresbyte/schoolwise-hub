from rest_framework import serializers
from .models import Staff
from apps.accounts.serializers import UserSerializer

class StaffSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="pk", read_only=True)
    firstName = serializers.CharField(source="user.first_name", read_only=True)
    lastName = serializers.CharField(source="user.last_name", read_only=True)
    gender = serializers.CharField(source="user.gender", read_only=True)
    dateOfBirth = serializers.DateField(source="user.birth_date", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    photoUrl = serializers.SerializerMethodField()
    staffNumber = serializers.CharField(source="staff_id", read_only=True)
    contractType = serializers.CharField(source="contract_type")
    idNumber = serializers.CharField(source="id_number")
    nssfNumber = serializers.CharField(source="nssf_number")
    nhifNumber = serializers.CharField(source="nhif_number")
    shifNumber = serializers.CharField(source="shif_number")
    kraPin = serializers.CharField(source="kra_pin")
    
    class Meta:
        model = Staff
        fields = [
            "id", "staff_id", "staffNumber", "firstName", "lastName", "gender", "dateOfBirth",
            "phone", "email", "photoUrl", "designation", "specialization", "status", 
            "contractType", "joining_date", "idNumber", "nssfNumber", 
            "nhifNumber", "shifNumber", "kraPin", "basic_salary"
        ]

    def get_photoUrl(self, obj):
        if obj.user.photo:
            return obj.user.photo.url
        return None

class StaffSummarySerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = Staff
        fields = ["staff_id", "name", "phone", "designation", "status"]
