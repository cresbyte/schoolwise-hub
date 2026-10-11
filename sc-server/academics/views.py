from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.db.models import ProtectedError
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from django.utils import timezone

from core.permissions import IsSchoolAdmin, IsStaff, IsStaffOrParent
from .models import (
    ClassRoom,
    Subject,
    SubjectAssignment,
    TimetableSlot,
    Enrollment,
    Promotion,
    BellSchedule,
)
from .serializers import (
    ClassRoomSerializer,
    EnrollmentSerializer,
    SubjectAssignmentSerializer,
    SubjectSerializer,
    TimetableSlotSerializer,
    BellScheduleSerializer,
)

from academics import services
from academics.models import Promotion, PromotionBatch
from academics.serializers import (
    PromotionBatchSerializer,
    PromotionBatchDetailSerializer,
)

class ProtectedDeleteMixin:
    """Return 409 instead of 500 when a PROTECTed row is still referenced."""

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This record is in use and cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )


# ============================================================================
# ClassRoom
# ============================================================================


class ClassRoomViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    """
    ?academic_year=<id>       filter to one year
    ?grade_level=<name>       e.g. ?grade_level=Grade%207
    ?current=1                only the active academic year
    """

    serializer_class = ClassRoomSerializer
    filterset_fields = {
        "academic_year": ["exact"],
        "grade_level": ["exact"],
        "stream": ["exact"],
    }
    filter_backends = [
        __import__("django_filters").rest_framework.DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "room"]
    ordering_fields = ["grade_level__order", "stream", "name"]

    def get_queryset(self):
        qs = ClassRoom.objects.select_related(
            "grade_level", "academic_year", "class_teacher"
        ).all()
        if self.request.query_params.get("current") in ("1", "true", "True"):
            qs = qs.current()
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [IsSchoolAdmin()]

    @action(detail=True, methods=["get"], url_path="roster")
    def roster(self, request, pk=None):
        """Students in this class, ordered by name."""
        room = self.get_object()
        students = room.students.order_by("first_name", "last_name")
        # Lazy import to avoid core → academics at module load
        from core.serializers import StudentSummarySerializer

        return Response(StudentSummarySerializer(students, many=True).data)

    @action(detail=False, methods=["post"], url_path="copy-forward")
    def copy_forward(self, request):
        """
        Copy this year's class structure into another academic year.

        Body: { "fromYear": 1, "toYear": 2, "skipFinalGrade": true }

        For every ClassRoom in `fromYear`, create an equivalent ClassRoom in
        `toYear` at the *next* grade level (Grade 4 East → Grade 5 East). Final
        grades are skipped because their students graduate.
        """
        from_year_id = request.data.get("fromYear")
        to_year_id = request.data.get("toYear")
        skip_final = bool(request.data.get("skipFinalGrade", True))

        if not from_year_id or not to_year_id:
            raise ValidationError({"detail": "fromYear and toYear are required."})

        from school.models import AcademicYear

        try:
            from_year = AcademicYear.objects.get(pk=from_year_id)
            to_year = AcademicYear.objects.get(pk=to_year_id)
        except AcademicYear.DoesNotExist:
            raise ValidationError({"detail": "Academic year not found."})

        if from_year.pk == to_year.pk:
            raise ValidationError({"detail": "Years must be different."})

        source = ClassRoom.objects.filter(academic_year=from_year).select_related(
            "grade_level"
        )
        created = 0
        skipped = 0
        notes = []

        for c in source:
            if skip_final and c.grade_level.is_final:
                skipped += 1
                continue

            target_grade = c.grade_level.next_grade
            if not target_grade:
                skipped += 1
                notes.append(f"{c.name}: no next grade for {c.grade_level.name}.")
                continue

            obj, was_created = ClassRoom.objects.get_or_create(
                grade_level=target_grade,
                stream=c.stream,
                academic_year=to_year,
                defaults={"capacity": c.capacity},
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        return Response(
            {
                "created": created,
                "skipped": skipped,
                "notes": notes,
                "classesInTargetYear": ClassRoom.objects.filter(
                    academic_year=to_year
                ).count(),
            }
        )


# ============================================================================
# Subject
# ============================================================================


class SubjectViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    """
    ?grade_level=Grade%207      subjects offered in one grade
    ?is_core=true|false
    """

    serializer_class = SubjectSerializer
    filterset_fields = {
        "is_core": ["exact"],
        "learning_area": ["exact"],
    }
    filter_backends = [
        __import__("django_filters").rest_framework.DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "code", "description"]
    ordering_fields = ["name", "code"]

    def get_queryset(self):
        qs = Subject.objects.all()
        grade = self.request.query_params.get("grade_level")
        if grade:
            qs = qs.for_grade(grade)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [IsSchoolAdmin()]


# ============================================================================
# SubjectAssignment
# ============================================================================


class SubjectAssignmentViewSet(viewsets.ModelViewSet):
    """
    ?class_room=<id>     assignments for one class
    ?teacher=<id>        subjects a teacher teaches
    ?subject=<id>        who teaches this subject (across all classes)
    ?academic_year=<id>  filter by class's academic year
    """

    serializer_class = SubjectAssignmentSerializer
    filterset_fields = {
        "class_room": ["exact"],
        "teacher": ["exact"],
        "subject": ["exact"],
    }
    filter_backends = [
        __import__("django_filters").rest_framework.DjangoFilterBackend,
    ]

    def get_queryset(self):
        qs = SubjectAssignment.objects.select_related(
            "teacher", "subject", "class_room", "class_room__grade_level"
        )
        year = self.request.query_params.get("academic_year")
        if year:
            qs = qs.for_year(year)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [IsSchoolAdmin()]


# ============================================================================
# TimetableSlot
# ============================================================================


class BellScheduleViewSet(viewsets.ModelViewSet):
    """
    CRUD for school-day shapes. Reading is open to staff/parents (the timetable
    needs it); changing it is admin-only.
    """

    serializer_class = BellScheduleSerializer
    queryset = BellSchedule.objects.prefetch_related("periods", "grade_levels")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffOrParent()]
        return [IsSchoolAdmin()]


def _teacher_conflicts(class_room, rows):
    """
    Return human-readable messages for every teacher who is already booked in
    a *different* class at the same day + period as one of `rows`.

    `rows` are validated slot dicts (model field names: teacher, day,
    period_number, is_break).
    """
    wanted = {}
    for r in rows:
        teacher = r.get("teacher")
        if teacher is None or r.get("is_break"):
            continue
        wanted[(teacher.pk, r["day"], r["period_number"])] = teacher
    if not wanted:
        return []

    others = (
        TimetableSlot.objects.exclude(class_room=class_room)
        .filter(is_break=False, teacher_id__in={k[0] for k in wanted})
        .select_related("class_room", "teacher")
    )
    return [
        f"{s.teacher.name} is already teaching {s.class_room.name} "
        f"on {s.day}, period {s.period_number}."
        for s in others
        if (s.teacher_id, s.day, s.period_number) in wanted
    ]


class TimetableSlotViewSet(viewsets.ModelViewSet):
    """
    ?class_room=<id>    the full weekly timetable for a class
    ?teacher=<id>       a teacher's week
    ?day=Monday
    """

    serializer_class = TimetableSlotSerializer
    filterset_fields = {
        "class_room": ["exact"],
        "teacher": ["exact"],
        "day": ["exact"],
    }
    filter_backends = [
        __import__("django_filters").rest_framework.DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    ordering_fields = ["day", "period_number"]

    def get_queryset(self):
        return TimetableSlot.objects.select_related(
            "subject", "teacher", "class_room"
        ).all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffOrParent()]
        return [IsSchoolAdmin()]

    # ---- bell for one class -----------------------------------------------
    @action(detail=False, methods=["get"], url_path="bell")
    def bell(self, request):
        """
        The periods + breaks this class follows, chosen by its grade level.
        Returns [] when no schedule is configured (the UI then shows its default).
        """
        class_room = get_object_or_404(
            ClassRoom, pk=request.query_params.get("class_room")
        )
        return Response([
            {
                "periodNumber": p["period_number"],
                "startTime": p["start_time"],
                "endTime": p["end_time"],
                "isBreak": p["is_break"],
                "breakName": p["break_name"],
            }
            for p in services.configured_bell_for_class(class_room)
        ])

    # ---- bulk save --------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        """
        Replace the entire timetable for one class in one transaction.

        Body:
          {
            "classId": "cls-grade-4-east-abc123",
            "slots": [
              {"day": "Monday", "periodNumber": 1,
               "startTime": "08:00", "endTime": "08:40",
               "subjectId": 12, "teacherId": 4, "isBreak": false},
              {"day": "Monday", "periodNumber": 4,
               "startTime": "10:00", "endTime": "10:30",
               "isBreak": true, "breakName": "Tea Break"}
            ]
          }
        """
        class_id = request.data.get("classId")
        slots = request.data.get("slots")
        if not class_id or not isinstance(slots, list):
            raise ValidationError({"detail": "classId and a slots array are required."})

        try:
            class_room = ClassRoom.objects.get(pk=class_id)
        except ClassRoom.DoesNotExist:
            raise ValidationError({"classId": "Class not found."})

        # The client sends one classId for the whole payload; stamp it onto
        # each slot so the serializer's required `classId` field is satisfied
        # and a slot can't point at a different class.
        slots = [{**s, "classId": class_id} for s in slots]

        # Validate all slots first so a bad row doesn't half-apply
        serializer = self.get_serializer(
            data=slots,
            many=True,
            context={**self.get_serializer_context(), "bulk": True},
        )
        serializer.is_valid(raise_exception=True)
        rows = serializer.validated_data

        # Same class can't have two slots in the same day + period
        seen = set()
        for r in rows:
            key = (r["day"], r["period_number"])
            if key in seen:
                raise ValidationError(
                    {"detail": f"Duplicate slot: {key[0]}, period {key[1]}."}
                )
            seen.add(key)

        # Only periods that exist in this class's school day
        allowed = {p["period_number"] for p in services.bell_for_class(class_room)}
        outside = sorted({r["period_number"] for r in rows} - allowed)
        if outside:
            raise ValidationError({
                "detail": f"Period {', '.join(map(str, outside))} is not part of "
                          f"{class_room.grade_level_id}'s school day."
            })

        # A teacher can't be in two classes at once — report which one
        conflicts = _teacher_conflicts(class_room, rows)
        if conflicts:
            raise ValidationError({"detail": " ".join(conflicts)})

        try:
            with transaction.atomic():
                TimetableSlot.objects.filter(class_room=class_room).delete()
                created = serializer.save()  # save() runs model.clean() via mixin
        except IntegrityError:
            # Backstop for a race (someone else booked the teacher between our
            # check and the insert). The transaction has rolled back, so the
            # old timetable is intact.
            raise ValidationError(
                {"detail": "A teacher or period conflict occurred while saving. "
                           "Please refresh and try again."}
            )

        return Response(
            self.get_serializer(created, many=True).data,
            status=status.HTTP_200_OK,
        )

    # ---- auto-generate ----------------------------------------------------
    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """
        Round-robin fill the timetable from SubjectAssignment rows.

        Body: { "classId": "...", "includeSaturday": false }
        """
        class_id = request.data.get("classId")
        include_saturday = bool(request.data.get("includeSaturday", False))

        if not class_id:
            raise ValidationError({"classId": "classId is required."})
        try:
            class_room = ClassRoom.objects.get(pk=class_id)
        except ClassRoom.DoesNotExist:
            raise ValidationError({"classId": "Class not found."})

        assignments = list(
            SubjectAssignment.objects.filter(class_room=class_room).select_related(
                "subject", "teacher"
            )
        )
        if not assignments:
            raise ValidationError(
                {"detail": "Assign teachers to subjects before generating."}
            )

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        if include_saturday:
            days.append("Saturday")

        # This class's school day (its grade's bell schedule, else the default)
        bell = [
            (p["period_number"], p["start_time"], p["end_time"],
             p["is_break"], p["break_name"])
            for p in services.bell_for_class(class_room)
        ]

        # Build a pool where each subject appears periods_per_week times,
        # but no more than once per day.
        from collections import defaultdict

        pool_per_day = defaultdict(list)
        for a in assignments:
            for _ in range(a.periods_per_week):
                pool_per_day[a.id].append(a)

        # Teachers already booked in OTHER classes (this class's rows are
        # about to be replaced, so they don't count).
        teacher_busy = set(
            TimetableSlot.objects.exclude(class_room=class_room)
            .filter(is_break=False, teacher__isnull=False)
            .values_list("teacher_id", "day", "period_number")
        )

        try:
            with transaction.atomic():
                created = self._generate_slots(
                    class_room, assignments, days, bell, teacher_busy
                )
        except IntegrityError:
            raise ValidationError(
                {"detail": "A teacher conflict occurred while generating. "
                           "Please refresh and try again."}
            )

        return Response(self.get_serializer(created, many=True).data)

    def _generate_slots(self, class_room, assignments, days, bell, teacher_busy):
        from collections import defaultdict

        TimetableSlot.objects.filter(class_room=class_room).delete()

        subject_used_today = defaultdict(set)  # day -> set(subject_id)
        created = []

        for day in days:
            assignment_pool = list(assignments)
            idx = 0
            for period_no, start, end, is_break, break_name in bell:
                if is_break:
                    created.append(
                        TimetableSlot.objects.create(
                            class_room=class_room,
                            day=day,
                            period_number=period_no,
                            start_time=start,
                            end_time=end,
                            is_break=True,
                            break_name=break_name,
                        )
                    )
                    continue

                # Find the next assignment that fits
                chosen = None
                for _ in range(len(assignment_pool)):
                    a = assignment_pool[idx % len(assignment_pool)]
                    idx += 1
                    key = (a.teacher_id, day, period_no)
                    if a.subject_id in subject_used_today[day]:
                        continue
                    if a.teacher_id and key in teacher_busy:
                        continue
                    chosen = a
                    break

                if chosen is None:
                    # No viable assignment — leave the slot empty
                    continue

                teacher_busy.add((chosen.teacher_id, day, period_no))
                subject_used_today[day].add(chosen.subject_id)
                created.append(
                    TimetableSlot.objects.create(
                        class_room=class_room,
                        day=day,
                        period_number=period_no,
                        start_time=start,
                        end_time=end,
                        subject=chosen.subject,
                        teacher=chosen.teacher,
                    )
                )

        return created


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ?student=<id>          a student's full enrollment history
    ?class_room=<id>       everyone in a class (filter with ?status=active for current roster)
    ?academic_year=<id>    everyone enrolled in a given year
    ?status=active         only active enrollments
    """

    serializer_class = EnrollmentSerializer
    filterset_fields = {
        "student": ["exact"],
        "class_room": ["exact"],
        "academic_year": ["exact"],
        "status": ["exact"],
    }
    filter_backends = [
        __import__("django_filters").rest_framework.DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    ordering_fields = ["enrolled_on", "created_at"]

    def get_queryset(self):
        return Enrollment.objects.select_related(
            "student", "class_room", "class_room__grade_level", "academic_year"
        ).all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [IsSchoolAdmin()]

    def perform_create(self, serializer):
        enrollment = serializer.save()
        self._sync_student_cache(enrollment)

    def perform_update(self, serializer):
        enrollment = serializer.save()
        self._sync_student_cache(enrollment)

    @staticmethod
    def _sync_student_cache(enrollment):
        """
        Keep Student.class_room and Student.grade_level in sync with the
        active enrollment. Student.class_room is a denormalized cache.
        """
        if enrollment.status != Enrollment.Status.ACTIVE:
            return
        student = enrollment.student
        changed = False
        if student.class_room_id != enrollment.class_room_id:
            student.class_room = enrollment.class_room
            changed = True
        if student.grade_level != enrollment.class_room.grade_level_id:
            student.grade_level = enrollment.class_room.grade_level_id
            changed = True
        if changed:
            student.save(update_fields=["class_room", "grade_level"])

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        """
        Close an enrollment (transfer, graduation, withdrawal).

        Body: { "status": "transferred" | "graduated" | "withdrawn",
                "leftOn": "YYYY-MM-DD", "notes": "..." }
        """
        enrollment = self.get_object()
        if enrollment.status != Enrollment.Status.ACTIVE:
            raise ValidationError({"detail": "This enrollment is already closed."})

        new_status = request.data.get("status")
        if new_status not in (
            Enrollment.Status.TRANSFERRED,
            Enrollment.Status.GRADUATED,
            Enrollment.Status.WITHDRAWN,
        ):
            raise ValidationError(
                {"status": "Must be one of: transferred, graduated, withdrawn."}
            )

        left_on = request.data.get("leftOn") or timezone.now().date()

        enrollment.status = new_status
        enrollment.left_on = left_on
        enrollment.notes = request.data.get("notes", enrollment.notes)
        enrollment.full_clean()
        enrollment.save()

        # If this was the student's active enrollment, clear the cache
        student = enrollment.student
        if student.class_room_id == enrollment.class_room_id:
            student.class_room = None
            student.grade_level = ""
            student.status = (
                "transferred_out"
                if new_status == Enrollment.Status.TRANSFERRED
                else (
                    "graduated"
                    if new_status == Enrollment.Status.GRADUATED
                    else "inactive"
                )
            )
            student.save(update_fields=["class_room", "grade_level", "status"])

        return Response(self.get_serializer(enrollment).data)



# ============================================================================
# Promotion
# ============================================================================
class PromotionViewSet(viewsets.ViewSet):
    """
    Top-level promotion endpoints:
      POST /api/academics/promotions/suggest-mapping/
      GET  /api/academics/promotions/batches/       list recent batches
      POST /api/academics/promotions/batches/       create a new batch
    """

    permission_classes = [IsSchoolAdmin]

    @action(detail=False, methods=["post"], url_path="suggest-mapping")
    def suggest_mapping(self, request):
        from_year = self._year(request.data.get("fromYear"))
        to_year = self._year(request.data.get("toYear"))
        grade = request.data.get("fromGrade")
        if not grade:
            raise ValidationError({"detail": "fromGrade is required."})

        suggestions = services.suggest_stream_mapping(from_year, to_year, grade)
        return Response([
            {
                "fromStream": s.from_stream,
                "fromStudentCount": s.from_student_count,
                "toStream": s.to_stream,
                "toClassId": s.to_class_id,
            }
            for s in suggestions
        ])

    @action(detail=False, methods=["get", "post"], url_path="batches")
    def batches(self, request):
        """GET: list recent batches. POST: create a new one."""
        if request.method == "GET":
            qs = (
                PromotionBatch.objects
                .select_related("from_year", "to_year", "created_by", "executed_by")
                .order_by("-created_at")[:200]
            )
            return Response(PromotionBatchSerializer(qs, many=True).data)

        # POST — create
        from_year = self._year(request.data.get("fromYear"))
        to_year = self._year(request.data.get("toYear"))
        grade = request.data.get("fromGrade")
        stream_mapping = request.data.get("streamMapping") or {}

        if not grade:
            raise ValidationError({"detail": "fromGrade is required."})
        if not isinstance(stream_mapping, dict):
            raise ValidationError({"detail": "streamMapping must be an object."})

        try:
            batch = services.create_promotion_batch(
                from_year=from_year,
                to_year=to_year,
                from_grade_name=grade,
                stream_mapping=stream_mapping,
                user=request.user,
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})

        return Response(
            PromotionBatchDetailSerializer(batch).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _year(year_id):
        if not year_id:
            raise ValidationError({"detail": "fromYear and toYear are required."})
        from school.models import AcademicYear
        try:
            return AcademicYear.objects.get(pk=year_id)
        except AcademicYear.DoesNotExist:
            raise ValidationError({"detail": f"Academic year {year_id} not found."})


class PromotionBatchViewSet(viewsets.ViewSet):
    """
    Detail operations on a single batch:
      GET   /api/academics/promotion-batches/<id>/
      PATCH /api/academics/promotion-batches/<id>/students/<row_id>/
      POST  /api/academics/promotion-batches/<id>/execute/
      POST  /api/academics/promotion-batches/<id>/undo/
    """

    permission_classes = [IsSchoolAdmin]

    def retrieve(self, request, pk=None):
        try:
            batch = (
                PromotionBatch.objects
                .select_related("from_year", "to_year", "created_by", "executed_by")
                .prefetch_related("stream_mappings", "students__student")
                .get(pk=pk)
            )
        except PromotionBatch.DoesNotExist:
            raise ValidationError({"detail": "Batch not found."})
        return Response(PromotionBatchDetailSerializer(batch).data)

    @action(
        detail=True,
        methods=["patch"],
        url_path=r"students/(?P<row_id>[^/.]+)",
    )
    def update_student(self, request, pk=None, row_id=None):
        try:
            row = services.update_promotion_row(
                row_id,
                outcome=request.data.get("outcome"),
                to_class_id=request.data.get("toClassId"),
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})

        return Response({
            "id": row.id,
            "studentId": row.student_id,
            "outcome": row.outcome,
            "toClass": row.to_class,
            "toClassId": row.to_class_ref_id,
            "reason": row.reason,
        })

    @action(detail=True, methods=["post"])
    def execute(self, request, pk=None):
        try:
            batch = services.execute_promotion_batch(pk, user=request.user)
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        except PromotionBatch.DoesNotExist:
            raise ValidationError({"detail": "Batch not found."})
        return Response(PromotionBatchSerializer(batch).data)

    @action(detail=True, methods=["post"])
    def undo(self, request, pk=None):
        window_hours = int(request.data.get("windowHours", 24))
        try:
            batch = services.undo_promotion_batch(
                pk, user=request.user, window_hours=window_hours
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        except PromotionBatch.DoesNotExist:
            raise ValidationError({"detail": "Batch not found."})
        return Response(PromotionBatchSerializer(batch).data)
