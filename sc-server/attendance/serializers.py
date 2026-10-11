from rest_framework import serializers

from academics.models import ClassRoom
from attendance.models import Attendance, AbsenceReason, AttendanceStatus

# ============================================================================
# Read serializers
# ============================================================================


class AttendanceSerializer(serializers.ModelSerializer):
    """Full read of a saved record."""

    studentId = serializers.CharField(source="student_id", read_only=True)
    studentName = serializers.SerializerMethodField()
    classId = serializers.CharField(source="class_room_id", read_only=True)
    className = serializers.CharField(source="class_room.name", read_only=True)
    academicYearId = serializers.IntegerField(source="academic_year_id", read_only=True)

    recordedBy = serializers.CharField(
        source="recorded_by.name", read_only=True, default=None
    )
    updatedBy = serializers.CharField(
        source="updated_by.name", read_only=True, default=None
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "studentId",
            "studentName",
            "date",
            "status",
            "reason",
            "notes",
            "classId",
            "className",
            "academicYearId",
            "recordedBy",
            "recorded_at",
            "updatedBy",
            "updated_at",
        ]

    def get_studentName(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip()


class RosterEntrySerializer(serializers.Serializer):
    """One row of the 'take attendance' grid. Not a ModelSerializer."""

    studentId = serializers.CharField()
    studentName = serializers.CharField()
    admissionNumber = serializers.CharField()
    status = serializers.CharField(allow_blank=True)
    reason = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)
    attendanceId = serializers.IntegerField(allow_null=True)


# ============================================================================
# Write serializers
# ============================================================================


class BulkSaveRecordSerializer(serializers.Serializer):
    studentId = serializers.CharField()
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)
    reason = serializers.ChoiceField(
        choices=AbsenceReason.choices, required=False, allow_blank=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class BulkSaveSerializer(serializers.Serializer):
    """
    The whole grid for one class on one day.

    Body:
      {
        "classRoom": "cls-...",
        "date": "2026-10-08",
        "records": [
          {"studentId": "std-1", "status": "present"},
          {"studentId": "std-2", "status": "absent", "reason": "sick"}
        ]
      }
    """

    classRoom = serializers.CharField()
    date = serializers.DateField()
    records = BulkSaveRecordSerializer(many=True)

    def validate_classRoom(self, value):
        try:
            return ClassRoom.objects.get(pk=value)
        except ClassRoom.DoesNotExist:
            raise serializers.ValidationError("Class not found.")

    def validate_records(self, value):
        if not value:
            raise serializers.ValidationError("At least one record is required.")
        seen = set()
        for r in value:
            sid = r["studentId"]
            if sid in seen:
                raise serializers.ValidationError(f"Duplicate student {sid}.")
            seen.add(sid)
            # reason required for absent / excused
            if r["status"] in ("absent", "excused") and not r.get("reason"):
                raise serializers.ValidationError(
                    f"Reason required for {r['status']} (student {sid})."
                )
        return value
