from rest_framework import serializers
from .models import Exam, Mark, ClassTeacherComment


class ExamSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source="start_date")
    endDate = serializers.DateField(source="end_date")
    examType = serializers.CharField(source="exam_type")

    class Meta:
        model = Exam
        fields = [
            "id", "name", "term", "year", "examType", "status",
            "startDate", "endDate", "created_at",
        ]


class MarkSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source="student.id", read_only=True)
    studentName = serializers.SerializerMethodField()
    admissionNumber = serializers.CharField(source="student.admission_number", read_only=True)
    subjectId = serializers.CharField(source="subject.id", read_only=True)
    subjectName = serializers.CharField(source="subject.name", read_only=True)
    examId = serializers.IntegerField(source="exam.id", read_only=True)

    class Meta:
        model = Mark
        fields = [
            "id", "exam", "examId", "student", "studentId", "studentName",
            "admissionNumber", "subject", "subjectId", "subjectName",
            "score", "comment",
        ]

    def get_studentName(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class ClassTeacherCommentSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source="student_id", read_only=True)
    examId = serializers.IntegerField(source="exam_id", read_only=True)
    authorName = serializers.CharField(source="author.user.name", read_only=True)

    class Meta:
        model = ClassTeacherComment
        fields = [
            "id", "exam", "examId", "student", "studentId",
            "author", "authorName", "comment", "created_at", "updated_at",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]
