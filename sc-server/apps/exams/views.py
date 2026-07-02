from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Max, Min
from django.utils import timezone
from .models import Exam, Mark, ClassTeacherComment
from .serializers import ExamSerializer, MarkSerializer, ClassTeacherCommentSerializer
from apps.accounts.permissions import IsStaff, IsStaffOrParent
from apps.accounts.models import UserRole


class ExamViewSet(viewsets.ModelViewSet):
    """CRUD for Exams, with filtering and ordering."""
    queryset = Exam.objects.all().order_by("-year", "-term", "start_date")
    serializer_class = ExamSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "term", "year", "exam_type"]
    search_fields = ["name"]
    ordering_fields = ["start_date", "end_date", "name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == UserRole.PARENT:
            queryset = queryset.filter(status="published")
        return queryset

    def perform_create(self, serializer):
        data = self.request.data
        serializer.save(
            start_date=data.get("startDate", data.get("start_date")),
            end_date=data.get("endDate", data.get("end_date")),
            exam_type=data.get("examType", data.get("exam_type", "endterm")),
        )


class MarkViewSet(viewsets.ModelViewSet):
    """CRUD for marks, supporting bulk save and class-based filtering."""
    queryset = Mark.objects.select_related("student", "subject", "exam").all()
    serializer_class = MarkSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["exam", "student", "subject"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        if self.action == "bulk_save":
            return [permissions.IsAuthenticated(), IsStaff()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == UserRole.PARENT:
            queryset = queryset.filter(
                student__guardians=user,
                exam__status="published",
            )

        class_id = self.request.query_params.get("class_room")
        if class_id:
            queryset = queryset.filter(student__class_room_id=class_id)

        return queryset

    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        """
        Bulk create or update marks.
        Expects: { examId, classId, marks: [{ studentId, subjectId, score, comment }] }
        """
        exam_id = request.data.get("examId")
        marks_data = request.data.get("marks", [])

        if not exam_id or not marks_data:
            return Response({"detail": "examId and marks are required."}, status=status.HTTP_400_BAD_REQUEST)

        saved = []
        for entry in marks_data:
            mark, _ = Mark.objects.update_or_create(
                exam_id=exam_id,
                student_id=entry["studentId"],
                subject_id=entry["subjectId"],
                defaults={
                    "score": entry.get("score", 0),
                    "comment": entry.get("comment", ""),
                },
            )
            saved.append(MarkSerializer(mark).data)

        return Response(saved, status=status.HTTP_200_OK)


class ClassTeacherCommentViewSet(viewsets.ModelViewSet):
    """Upsert class-teacher comments per student/exam."""
    queryset = ClassTeacherComment.objects.select_related("student", "exam", "author__user").all()
    serializer_class = ClassTeacherCommentSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["exam", "student"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == UserRole.PARENT:
            queryset = queryset.filter(
                student__guardians=user,
                exam__status="published",
            )

        class_id = self.request.query_params.get("class_room")
        if class_id:
            queryset = queryset.filter(student__class_room_id=class_id)

        return queryset

    def perform_create(self, serializer):
        staff = getattr(self.request.user, "staff_profile", None)
        serializer.save(author=staff)

    def perform_update(self, serializer):
        staff = getattr(self.request.user, "staff_profile", None)
        serializer.save(author=staff)

    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        """
        Bulk upsert class-teacher comments.
        Expects: { examId, classId, comments: [{ studentId, comment }] }
        """
        exam_id = request.data.get("examId")
        comments_data = request.data.get("comments", [])

        if not exam_id or not comments_data:
            return Response(
                {"detail": "examId and comments are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff = getattr(request.user, "staff_profile", None)
        saved = []
        for entry in comments_data:
            comment, _ = ClassTeacherComment.objects.update_or_create(
                exam_id=exam_id,
                student_id=entry["studentId"],
                defaults={
                    "comment": entry.get("comment", ""),
                    "author": staff,
                },
            )
            saved.append(ClassTeacherCommentSerializer(comment).data)

        return Response(saved, status=status.HTTP_200_OK)


class PerformanceReportView(APIView):
    """Per-class subject performance stats for an exam."""
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        class_id = request.query_params.get("class_room")
        exam_id = request.query_params.get("exam")
        if not class_id or not exam_id:
            return Response(
                {"detail": "class_room and exam query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        marks = Mark.objects.filter(
            exam_id=exam_id,
            student__class_room_id=class_id,
        ).select_related("subject")

        subject_stats = []
        for sub in marks.values("subject_id", "subject__name").distinct():
            scores = [float(s) for s in marks.filter(subject_id=sub["subject_id"]).values_list("score", flat=True)]
            if not scores:
                continue
            subject_stats.append({
                "subject": sub["subject__name"],
                "average": round(sum(scores) / len(scores)),
                "highest": max(scores),
                "lowest": min(scores),
                "passRate": round(len([s for s in scores if s >= 50]) / len(scores) * 100),
            })

        return Response({"subjectStats": subject_stats})


class SchoolPerformanceTrendView(APIView):
    """School-wide mean score trend across published exams."""
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        exams = Exam.objects.filter(status="published").order_by("year", "term")
        trend = []
        for exam in exams:
            agg = Mark.objects.filter(exam=exam).aggregate(
                average=Avg("score"),
                highest=Max("score"),
                lowest=Min("score"),
            )
            if agg["average"] is None:
                continue
            trend.append({
                "term": f"T{exam.term} {exam.year}",
                "average": round(float(agg["average"])),
                "highest": round(float(agg["highest"])),
                "lowest": round(float(agg["lowest"])),
            })
        return Response(trend)


class KNEC7BestView(APIView):
    """KCSE-style 7-best subjects ranking for a class/exam."""
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        class_id = request.query_params.get("class_room")
        exam_id = request.query_params.get("exam")
        if not class_id or not exam_id:
            return Response(
                {"detail": "class_room and exam query params are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.students.models import Student

        students = Student.objects.filter(class_room_id=class_id)
        result = []
        for student in students:
            marks = Mark.objects.filter(exam_id=exam_id, student=student).select_related("subject")
            scored = sorted(
                [{"subjectName": m.subject.name, "marks": float(m.score)} for m in marks],
                key=lambda x: x["marks"],
                reverse=True,
            )[:7]
            if not scored:
                continue
            result.append({
                "studentName": f"{student.first_name} {student.last_name}",
                "subjects": scored,
                "best7Total": sum(s["marks"] for s in scored),
            })

        result.sort(key=lambda x: x["best7Total"], reverse=True)
        return Response(result)
