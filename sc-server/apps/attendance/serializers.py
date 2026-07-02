from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    # Read-only computed fields
    studentName = serializers.SerializerMethodField()
    admissionNumber = serializers.CharField(source="student.admission_number", read_only=True)
    takenByName = serializers.SerializerMethodField()
    classRoomId = serializers.CharField(source="student.class_room_id", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "student",         # FK — writable (accepts student PK)
            "studentName",     # read-only
            "admissionNumber", # read-only
            "classRoomId",     # read-only
            "date",
            "status",
            "remarks",
            "taken_by",        # auto-set in view, read-only effectively
            "takenByName",     # read-only
            "created_at",
        ]
        read_only_fields = ["taken_by", "created_at"]

    def get_studentName(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_takenByName(self, obj):
        try:
            return obj.taken_by.user.get_full_name() or obj.taken_by.user.username
        except Exception:
            return "System"
