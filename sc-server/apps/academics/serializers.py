from rest_framework import serializers
from .models import AcademicTerm, ClassRoom, Subject, SubjectAssignment, TimetableSlot, TermEvent
from apps.staff.models import Staff
from apps.exams.models import Exam


class AcademicTermSerializer(serializers.ModelSerializer):
    """Serializer for AcademicTerm with camelCase field mappings."""
    termNumber = serializers.IntegerField(source="term_number")
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    isCurrent = serializers.BooleanField(source="is_current", required=False, default=False)

    class Meta:
        model = AcademicTerm
        fields = [
            "id", "year", "term_number", "termNumber",
            "start_date", "startDate", "end_date", "endDate",
            "is_current", "isCurrent"
        ]


class ClassRoomSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(source="students.count", read_only=True)
    class_teacher_name = serializers.CharField(source="class_teacher.user.name", read_only=True)
    
    # CamelCase aliases
    gradeLevel = serializers.CharField(source="grade_level")
    academicYear = serializers.IntegerField(source="academic_year", required=False, default=2026)
    classTeacherId = serializers.PrimaryKeyRelatedField(
        source="class_teacher", 
        queryset=Staff.objects.all(), 
        required=False, 
        allow_null=True
    )
    classTeacherName = serializers.CharField(source="class_teacher.user.name", read_only=True)
    studentCount = serializers.IntegerField(source="students.count", read_only=True)

    class Meta:
        model = ClassRoom
        fields = [
            "id", "name", "grade_level", "gradeLevel", "stream", "curriculum", 
            "capacity", "room", "academic_year", "academicYear", 
            "class_teacher", "classTeacherId", "class_teacher_name", "classTeacherName", 
            "student_count", "studentCount"
        ]

class SubjectSerializer(serializers.ModelSerializer):
    # CamelCase aliases
    gradeLevels = serializers.JSONField(source="grade_levels", required=False, default=list)
    gradeLevel = serializers.JSONField(source="grade_levels", required=False, default=list)  # legacy alias
    isCore = serializers.BooleanField(source="is_core", required=False, default=True)
    learningArea = serializers.CharField(source="learning_area", required=False, allow_null=True, allow_blank=True)
    gradingSystem = serializers.JSONField(source="grading_system", required=False, default=list)

    class Meta:
        model = Subject
        fields = [
            "id", "name", "code", "description", "curriculum", 
            "grade_levels", "gradeLevel", "gradeLevels", "is_core", "isCore", 
            "learning_area", "learningArea", "grading_system", "gradingSystem"
        ]

class SubjectAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.user.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="class_room.name", read_only=True)

    # CamelCase aliases for relations (these are the writable fields)
    classId = serializers.PrimaryKeyRelatedField(source="class_room", queryset=ClassRoom.objects.all())
    subjectId = serializers.PrimaryKeyRelatedField(source="subject", queryset=Subject.objects.all())
    teacherId = serializers.PrimaryKeyRelatedField(source="teacher", queryset=Staff.objects.all())
    periodsPerWeek = serializers.IntegerField(source="periods_per_week", required=False, default=5)

    # CamelCase aliases for read-only fields
    teacherName = serializers.CharField(source="teacher.user.name", read_only=True)
    subjectName = serializers.CharField(source="subject.name", read_only=True)
    className = serializers.CharField(source="class_room.name", read_only=True)

    class Meta:
        model = SubjectAssignment
        fields = [
            "id", "teacher", "teacher_id", "teacherId", "teacher_name", "teacherName",
            "subject", "subject_id", "subjectId", "subject_name", "subjectName",
            "class_room", "class_room_id", "classId", "class_name", "className",
            "periods_per_week", "periodsPerWeek"
        ]
        read_only_fields = ["teacher", "subject", "class_room"]

class TimetableSlotSerializer(serializers.ModelSerializer):
    classId = serializers.PrimaryKeyRelatedField(source="class_room", queryset=ClassRoom.objects.all())
    class_name = serializers.CharField(source="class_room.name", read_only=True)
    subjectId = serializers.PrimaryKeyRelatedField(source="subject", queryset=Subject.objects.all(), required=False, allow_null=True)
    subjectName = serializers.CharField(source="subject.name", read_only=True)
    teacherId = serializers.PrimaryKeyRelatedField(source="teacher", queryset=Staff.objects.all(), required=False, allow_null=True)
    teacherName = serializers.CharField(source="teacher.user.name", read_only=True)
    
    # CamelCase mappings
    periodNumber = serializers.IntegerField(source="period_number")
    startTime = serializers.CharField(source="start_time")
    endTime = serializers.CharField(source="end_time")
    isBreak = serializers.BooleanField(source="is_break", required=False, default=False)
    breakName = serializers.CharField(source="break_name", required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = TimetableSlot
        fields = [
            "id", "class_room", "classId", "class_name",
            "day", "period_number", "periodNumber",
            "start_time", "startTime", "end_time", "endTime",
            "subject", "subjectId", "subjectName",
            "teacher", "teacherId", "teacherName",
            "is_break", "isBreak", "break_name", "breakName"
        ]


class TermEventSerializer(serializers.ModelSerializer):
    classId = serializers.PrimaryKeyRelatedField(
        source="class_room", queryset=ClassRoom.objects.all(), required=False, allow_null=True
    )
    className = serializers.CharField(source="class_room.name", read_only=True)
    gradeLevel = serializers.CharField(source="grade_level", required=False, allow_blank=True)
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    isRange = serializers.SerializerMethodField()
    visibleToParents = serializers.BooleanField(source="visible_to_parents", required=False, default=False)
    examId = serializers.PrimaryKeyRelatedField(
        source="exam", queryset=Exam.objects.all(), required=False, allow_null=True
    )
    approvalStatus = serializers.CharField(source="approval_status", required=False)
    createdBy = serializers.CharField(source="created_by_id", read_only=True)
    createdByName = serializers.CharField(source="created_by.name", read_only=True)
    reviewedBy = serializers.CharField(source="reviewed_by_id", read_only=True)
    reviewedByName = serializers.CharField(source="reviewed_by.name", read_only=True)
    rejectionReason = serializers.CharField(source="rejection_reason", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = TermEvent
        fields = [
            "id", "title", "description", "category", "scope",
            "class_room", "classId", "className", "grade_level", "gradeLevel",
            "start_date", "end_date", "startDate", "endDate", "isRange",
            "term", "year", "visible_to_parents", "visibleToParents",
            "exam", "examId", "approval_status", "approvalStatus",
            "created_by", "createdBy", "createdByName",
            "reviewed_by", "reviewedBy", "reviewedByName",
            "rejection_reason", "rejectionReason", "created_at", "createdAt",
        ]
        read_only_fields = ["created_by", "reviewed_by", "created_at"]

    def get_isRange(self, obj):
        return obj.is_range
