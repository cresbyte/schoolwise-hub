from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import ClassRoom
from core.permissions import IsStaff, IsStaffOrParent
from exams import services
from exams.models import Exam, ExamComment, ExamSubject, Mark
from exams.permissions import (
    ADMIN_ROLES,
    CanEnterMarks,
    CanManageExams,
    CanWriteClassComment,
    user_is_class_teacher_of,
    user_teaches_exam_subject,
)
from exams.serializers import (
    BulkCommentSaveSerializer,
    BulkMarkSaveSerializer,
    ExamCommentSerializer,
    ExamSerializer,
    ExamSubjectCreateSerializer,
    ExamSubjectSerializer,
    MarkSerializer,
)

# ============================================================================
# Exam CRUD + lifecycle
# ============================================================================


class ExamViewSet(viewsets.ModelViewSet):
    """Admin-managed exam records + lifecycle actions."""

    queryset = Exam.objects.select_related("term", "academic_year", "created_by")
    serializer_class = ExamSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "class_report"):
            return [IsStaff()]
        if self.action in ("released_for_student", "report_card"):
            return [IsStaffOrParent()]
        return [CanManageExams()]

    @action(detail=True, methods=["post"], url_path="open")
    def open(self, request, pk=None):
        try:
            exam = services.open_exam_for_marks(self.get_object(), request.user)
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response(self.get_serializer(exam).data)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        try:
            exam = services.close_exam_marks(self.get_object(), request.user)
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response(self.get_serializer(exam).data)

    @action(detail=True, methods=["post"], url_path="release")
    def release(self, request, pk=None):
        try:
            exam = services.release_exam(self.get_object(), request.user)
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response(self.get_serializer(exam).data)

    @action(detail=False, methods=["get"], url_path=r"released-for-student/(?P<student_id>[^/.]+)")
    def released_for_student(self, request, student_id=None):
        """
        Returns released exams that have at least one mark for the given student.

        Accessible to:
        - Staff (any student)
        - Parents (their own children only)
        """
        from core.models import Student
        from exams.models import Mark

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        # Parents can only see their own children
        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        # Exams that are released AND have at least one mark for this student
        exam_ids = (
            Mark.objects
            .filter(student=student, exam_subject__exam__status=Exam.Status.RELEASED)
            .values_list("exam_subject__exam_id", flat=True)
            .distinct()
        )
        exams = (
            Exam.objects
            .filter(id__in=list(exam_ids))
            .select_related("term", "academic_year")
            .order_by("-academic_year__start_date", "term__number")
        )
        return Response(self.get_serializer(exams, many=True).data)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        try:
            exam = services.reopen_exam(self.get_object(), request.user)
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response(self.get_serializer(exam).data)

    @action(detail=True, methods=["post"], url_path="setup-subjects")
    def setup_subjects(self, request, pk=None):
        exam = self.get_object()
        body = ExamSubjectCreateSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            created = services.create_exam_subjects(
                exam,
                body.validated_data["gradeLevels"],
                body.validated_data["subjectIds"],
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response(
            ExamSubjectSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="subjects")
    def subjects(self, request, pk=None):
        exam = self.get_object()
        qs = exam.exam_subjects.select_related("subject").all()
        return Response(ExamSubjectSerializer(qs, many=True).data)

    # ---- report cards -----------------------------------------------------

    @action(detail=True, methods=["get"], url_path=r"report-card/(?P<student_id>[^/.]+)")
    def report_card(self, request, pk=None, student_id=None):
        from core.models import Student

        exam = self.get_object()

        # Parents: only their own children, and only if released
        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")
            if exam.status != Exam.Status.RELEASED:
                raise PermissionDenied("Report card is not released yet.")
        else:
            # Staff: admins can see unreleased; others only released
            if exam.status != Exam.Status.RELEASED and request.user.role not in ADMIN_ROLES:
                raise PermissionDenied("Report card is not released yet.")

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        return Response(services.compute_report_card(exam, student))

    @action(detail=True, methods=["get"], url_path=r"class-report/(?P<class_id>[^/.]+)")
    def class_report(self, request, pk=None, class_id=None):
        exam = self.get_object()
        try:
            class_room = ClassRoom.objects.get(pk=class_id)
        except ClassRoom.DoesNotExist:
            raise ValidationError({"detail": "Class not found."})
        # Class teachers can see their own class; admins see all
        if request.user.role not in ADMIN_ROLES and not user_is_class_teacher_of(
            request.user, class_room
        ):
            raise PermissionDenied("Not your class.")
        return Response(services.compute_class_report(exam, class_room))

    @action(detail=True, methods=["get"], url_path="missing-marks")
    def missing_marks(self, request, pk=None):
        """
        Return a summary of exam subjects that don't have a mark for every
        enrolled student. Used to warn the admin before release.

        Returns:
        {
            "totalStudents": 300,
            "totalSubjects": 61,
            "completeSubjects": 55,
            "incompleteSubjects": [
            {
                "examSubjectId": 42,
                "gradeLevel": "Grade 4",
                "subjectName": "Mathematics",
                "expected": 45,
                "entered": 40,
                "missing": 5,
                "missingStudents": ["Jane Mwangi", "John Otieno", ...]   # up to 20
            },
            ...
            ],
        }
        """
        exam = self.get_object()
        from academics.models import Enrollment
        from exams.models import ExamSubject, Mark

        report = []
        total_expected = 0
        total_entered = 0

        for es in exam.exam_subjects.select_related("subject"):
            expected_sids = set(
                Enrollment.objects.filter(
                    class_room__in=exam.classes_for(es.grade_level_id),
                    status=Enrollment.Status.ACTIVE,
                ).values_list("student_id", flat=True)
            )
            entered_sids = set(
                Mark.objects
                .filter(exam_subject=es, is_na=False)
                .values_list("student_id", flat=True)
            )
            missing_sids = expected_sids - entered_sids

            total_expected += len(expected_sids)
            total_entered += len(entered_sids)

            if not missing_sids:
                continue

            # Fetch missing student names for display
            from core.models import Student
            missing_names = list(
                Student.objects
                .filter(id__in=list(missing_sids)[:20])
                .values_list("first_name", "last_name")
            )
            missing_names = [
                f"{f} {l}".strip() for f, l in missing_names
            ]

            report.append({
                "examSubjectId": es.id,
                "gradeLevel": es.grade_level_id,
                "subjectName": es.subject.name,
                "expected": len(expected_sids),
                "entered": len(entered_sids),
                "missing": len(missing_sids),
                "missingStudents": missing_names,
            })

        return Response({
            "totalStudents": total_expected,
            "totalSubjects": exam.exam_subjects.count(),
            "completeSubjects": exam.exam_subjects.count() - len(report),
            "incompleteSubjects": report,
        })


# ============================================================================
# ExamSubject — read + bulk mark endpoints
# ============================================================================


class ExamSubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExamSubject.objects.select_related("exam", "subject").all()
    serializer_class = ExamSubjectSerializer
    permission_classes = [IsStaff]

    @action(detail=True, methods=["get"], url_path="roster")
    def roster(self, request, pk=None):
        """Rows for the marks-entry grid, merged with existing marks."""
        exam_subject = self.get_object()
        class_id = request.query_params.get("class_room")
        class_room = None
        if class_id:
            class_room = ClassRoom.objects.filter(pk=class_id).first()
        rows = services.roster_for_exam_subject(exam_subject, class_room)
        return Response(
            {
                "examSubject": ExamSubjectSerializer(exam_subject).data,
                "examStatus": exam_subject.exam.status,
                "canEdit": (
                    exam_subject.exam.status == Exam.Status.OPEN
                    and (
                        request.user.role in ADMIN_ROLES
                        or user_teaches_exam_subject(request.user, exam_subject)
                    )
                ),
                "rows": rows,
            }
        )

    @action(detail=True, methods=["post"], url_path="marks")
    def save_marks(self, request, pk=None):
        exam_subject = self.get_object()
        if request.user.role not in ADMIN_ROLES and not user_teaches_exam_subject(
            request.user, exam_subject
        ):
            raise PermissionDenied("You don't teach this subject.")
        body = BulkMarkSaveSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            services.bulk_save_marks(
                exam_subject, body.validated_data["records"], request.user
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response({"saved": len(body.validated_data["records"])})


# ============================================================================
# Comments
# ============================================================================


class ExamCommentViewSet(viewsets.ModelViewSet):
    """
    Class teacher & head teacher comments. Class teachers write for their class;
    admins/heads write anywhere.
    """

    queryset = ExamComment.objects.select_related("student", "exam").all()
    serializer_class = ExamCommentSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [CanWriteClassComment()]

    def get_queryset(self):
        qs = super().get_queryset()
        exam_id = self.request.query_params.get("exam")
        class_id = self.request.query_params.get("class_room")
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        if class_id:
            qs = qs.filter(student__enrollments__class_room_id=class_id)
        return qs

    @action(detail=False, methods=["post"], url_path="class-teacher/bulk")
    def class_teacher_bulk(self, request):
        exam_id = request.data.get("exam")
        if not exam_id:
            raise ValidationError({"detail": "exam is required."})
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            raise ValidationError({"detail": "Exam not found."})
        body = BulkCommentSaveSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            services.save_class_teacher_comments(
                exam,
                body.validated_data["comments"],
                request.user,
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response({"saved": len(body.validated_data["comments"])})

    @action(detail=False, methods=["post"], url_path="head-teacher/bulk")
    def head_teacher_bulk(self, request):
        if request.user.role not in ADMIN_ROLES:
            raise PermissionDenied("Only admins can set head teacher comments.")
        exam_id = request.data.get("exam")
        if not exam_id:
            raise ValidationError({"detail": "exam is required."})
        exam = Exam.objects.get(pk=exam_id)
        body = BulkCommentSaveSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        services.save_head_teacher_comments(
            exam,
            body.validated_data["comments"],
            request.user,
        )
        return Response({"saved": len(body.validated_data["comments"])})

    @action(detail=False, methods=["get"], url_path=r"roster/(?P<class_id>[^/.]+)")
    def roster(self, request, class_id=None):
        """
        Roster for a class in this exam, with existing comments merged in.
        Returns one row per enrolled student, plus the default comment based
        on their current mean points.
        """
        exam_id = request.query_params.get("exam")
        if not exam_id:
            raise ValidationError({"detail": "exam is required."})
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            raise ValidationError({"detail": "Exam not found."})

        try:
            class_room = ClassRoom.objects.get(pk=class_id)
        except ClassRoom.DoesNotExist:
            raise ValidationError({"detail": "Class not found."})

        from academics.models import Enrollment
        enrollments = (
            Enrollment.objects
            .filter(
                class_room=class_room,
                academic_year=exam.academic_year,
                status=Enrollment.Status.ACTIVE,
            )
            .select_related("student")
            .order_by("student__first_name", "student__last_name")
        )

        existing = {
            c.student_id: c
            for c in ExamComment.objects.filter(exam=exam)
        }

        rows = []
        for e in enrollments:
            mean_points, _ = services.mean_points_for_student(exam, e.student)
            comment_row = existing.get(e.student_id)
            rows.append({
                "id": comment_row.id if comment_row else None,
                "studentId": e.student_id,
                "studentName": f"{e.student.first_name} {e.student.last_name}".strip(),
                "meanPoints": mean_points,
                "classTeacherComment": (
                    comment_row.class_teacher_comment if comment_row else ""
                ),
                "headTeacherComment": (
                    comment_row.head_teacher_comment if comment_row else ""
                ),
                "defaultClassTeacher": services.default_class_teacher_comment(mean_points),
                "defaultHeadTeacher": services.default_head_teacher_comment(mean_points),
            })
        return Response(rows)


# ============================================================================
# "My grading" — a teacher's own list
# ============================================================================


class MyGradingView(APIView):
    """Exams currently open, with the teacher's own exam-subjects."""

    permission_classes = [IsStaff]

    def get(self, request):
        from academics.models import SubjectAssignment

        user = request.user
        open_exams = Exam.objects.filter(status=Exam.Status.OPEN)
        out = []

        for exam in open_exams:
            if user.role in ADMIN_ROLES:
                subjects = exam.exam_subjects.select_related("subject").all()
            else:
                assignments = SubjectAssignment.objects.filter(
                    teacher=user,
                    class_room__academic_year=exam.academic_year,
                )
                # Class-level exam: only the teacher's classes in that exam count
                if exam.class_rooms.exists():
                    assignments = assignments.filter(
                        class_room__in=exam.class_rooms.all()
                    )

                # (subject, grade) pairs the teacher actually teaches
                pairs = set(
                    assignments.values_list("subject_id", "class_room__grade_level_id")
                )
                if not pairs:
                    continue

                match = Q()
                for subject_id, grade in pairs:
                    match |= Q(subject_id=subject_id, grade_level_id=grade)
                subjects = exam.exam_subjects.select_related("subject").filter(match)

            if not subjects.exists():
                continue

            out.append(
                {
                    "exam": ExamSerializer(exam).data,
                    "subjects": ExamSubjectSerializer(subjects, many=True).data,
                }
            )
        return Response(out)
