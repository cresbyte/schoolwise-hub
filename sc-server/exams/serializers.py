from rest_framework import serializers

from academics.models import ClassRoom
from school.models import GradeLevel
from exams.models import Exam, ExamComment, ExamSubject, Mark

# ============================================================================
# Exam
# ============================================================================


class ExamSerializer(serializers.ModelSerializer):
    termLabel = serializers.CharField(source="term.label", read_only=True)
    termNumber = serializers.IntegerField(source="term.number", read_only=True)
    academicYearName = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    gradeLevels = serializers.SlugRelatedField(
        source="grade_levels",
        many=True,
        slug_field="name",
        queryset=GradeLevel.objects.all(),
        required=False,
    )
    classRooms = serializers.PrimaryKeyRelatedField(
        source="class_rooms",
        many=True,
        queryset=ClassRoom.objects.all(),
        required=False,
    )
    createdByName = serializers.CharField(
        source="created_by.name", read_only=True, default=None
    )
    subjectCount = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            "id",
            "name",
            "academic_year",
            "academicYearName",
            "term",
            "termLabel",
            "termNumber",
            "gradeLevels",
            "start_date",
            "end_date",
            "status",
            "createdByName",
            "subjectCount",
            "released_at",
            "classRooms",
        ]
        read_only_fields = ["status", "released_at"]

    def get_subjectCount(self, obj):
        return obj.exam_subjects.count()


# ============================================================================
# ExamSubject
# ============================================================================


class ExamSubjectSerializer(serializers.ModelSerializer):
    subjectName = serializers.CharField(source="subject.name", read_only=True)
    subjectCode = serializers.CharField(source="subject.code", read_only=True)
    gradeLevel = serializers.CharField(source="grade_level_id", read_only=True)
    markCount = serializers.SerializerMethodField()

    class Meta:
        model = ExamSubject
        fields = [
            "id",
            "exam",
            "gradeLevel",
            "subject",
            "subjectName",
            "subjectCode",
            "max_mark",
            "grading_scale",
            "markCount",
        ]

    def get_markCount(self, obj):
        return obj.marks.count()


class ExamSubjectCreateSerializer(serializers.Serializer):
    """Create many ExamSubject rows for a list of grades and subjects."""

    gradeLevels = serializers.ListField(child=serializers.CharField())
    subjectIds = serializers.ListField(child=serializers.IntegerField())


# ============================================================================
# Mark
# ============================================================================


class MarkSerializer(serializers.ModelSerializer):
    studentName = serializers.SerializerMethodField()
    subjectName = serializers.CharField(
        source="exam_subject.subject.name", read_only=True
    )

    class Meta:
        model = Mark
        fields = [
            "id",
            "exam_subject",
            "student",
            "studentName",
            "subjectName",
            "score",
            "grade",
            "points",
            "comment",
            "is_na",
        ]
        read_only_fields = ["grade", "points"]

    def get_studentName(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip()


class MarkRecordSerializer(serializers.Serializer):
    """One row of a bulk mark save."""

    studentId = serializers.CharField()
    score = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, allow_null=True
    )
    comment = serializers.CharField(required=False, allow_blank=True)
    isNa = serializers.BooleanField(required=False, default=False)


class BulkMarkSaveSerializer(serializers.Serializer):
    examSubject = serializers.IntegerField()
    records = MarkRecordSerializer(many=True)


# ============================================================================
# Comments
# ============================================================================


class ExamCommentSerializer(serializers.ModelSerializer):
    studentName = serializers.SerializerMethodField()
    meanPoints = serializers.SerializerMethodField()
    defaultClassTeacher = serializers.SerializerMethodField()
    defaultHeadTeacher = serializers.SerializerMethodField()

    class Meta:
        model = ExamComment
        fields = [
            "id",
            "exam",
            "student",
            "studentName",
            "class_teacher_comment",
            "head_teacher_comment",
            "meanPoints",
            "defaultClassTeacher",
            "defaultHeadTeacher",
            "updated_at",
        ]

    def get_studentName(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip()

    def _mean(self, obj):
        if not hasattr(obj, "_mean_cache"):
            from exams.services import mean_points_for_student

            obj._mean_cache = mean_points_for_student(obj.exam, obj.student)[0]
        return obj._mean_cache

    def get_meanPoints(self, obj):
        return self._mean(obj)

    def get_defaultClassTeacher(self, obj):
        from exams.services import default_class_teacher_comment

        return default_class_teacher_comment(self._mean(obj))

    def get_defaultHeadTeacher(self, obj):
        from exams.services import default_head_teacher_comment

        return default_head_teacher_comment(self._mean(obj))


class CommentRecordSerializer(serializers.Serializer):
    studentId = serializers.CharField()
    comment = serializers.CharField(required=False, allow_blank=True)


class BulkCommentSaveSerializer(serializers.Serializer):
    comments = CommentRecordSerializer(many=True)
