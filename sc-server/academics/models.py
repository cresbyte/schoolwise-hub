"""Academics: classes, subjects, teacher assignments, and the timetable.

Dependency rule: this app imports from `core` and `school`. Nothing else in
the codebase imports from here except `students` (via Student.class_room FK)
and `exams` (via ClassRoom FK).
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

from school.models import AcademicYear, GradeLevel, Term


# ============================================================================
# ClassRoom
# ============================================================================

class ClassRoomQuerySet(models.QuerySet):
    def for_year(self, year):
        """Accepts an AcademicYear instance or a PK."""
        return self.filter(academic_year=year)

    def current(self):
        """Classes in the active academic year."""
        return self.filter(academic_year__status="active")


class ClassRoom(models.Model):
    """
    A teaching group: 'Grade 4 East', for one academic year.

    A CBC junior school typically has 1–2 streams per grade. This model is the
    single source of truth for 'which class a student is in this year'.
    """

    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, blank=True)   # auto-built if empty
    grade_level = models.ForeignKey(
        GradeLevel,
        on_delete=models.PROTECT,
        related_name="classes",
        to_field="name",         # match GradeLevel.name, not PK
        db_column="grade_level",
    )
    stream = models.CharField(max_length=20, default="A")
    capacity = models.PositiveSmallIntegerField(default=40)
    room = models.CharField(max_length=20, blank=True, null=True)
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="class_rooms",
    )
    class_teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="classes_led",
        limit_choices_to={
            "role__in": [
                "teacher", "class_teacher", "headteacher",
                "deputy", "hod", "admin",
            ]
        },
    )

    objects = ClassRoomQuerySet.as_manager()

    class Meta:
        ordering = ["academic_year__start_date", "grade_level__order", "stream"]
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "grade_level", "stream"],
                name="uniq_class_per_year_grade_stream",
            ),
        ]
        indexes = [
            models.Index(fields=["academic_year", "grade_level"]),
        ]

    def __str__(self):
        return self.name or f"{self.grade_level_id} {self.stream}"

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = f"{self.grade_level_id} {self.stream}".strip()
        if not self.id:
            import uuid
            base = slugify(self.name) or "class"
            self.id = f"cls-{base}-{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)

    def clean(self):
        errors = {}
        if self.academic_year_id and self.academic_year.status == "closed":
            raise ValidationError(
                "Cannot create or edit classes in a closed academic year."
            )
        if self.capacity and self.capacity < 1:
            errors["capacity"] = "Capacity must be at least 1."
        # class_teacher must be staff, not a parent
        if self.class_teacher_id and self.class_teacher.role == "parent":
            errors["class_teacher"] = "A parent cannot be a class teacher."
        if errors:
            raise ValidationError(errors)

    @property
    def student_count(self):
        return self.students.count()


# ============================================================================
# Subject
# ============================================================================

def default_cbc_grading():
    """Default CBC grading scale. Each row: band, range, points, comment."""
    return [
        {"grade": "EE", "min": 80.0, "max": 100.0, "points": 4,
         "comment": "Well above expected standard."},
        {"grade": "ME", "min": 50.0, "max": 79.99, "points": 3,
         "comment": "At expected standard level."},
        {"grade": "AE", "min": 40.0, "max": 49.99, "points": 2,
         "comment": "On track, needs support."},
        {"grade": "BE", "min": 0.0, "max": 39.99, "points": 1,
         "comment": "Below expected standard level."},
    ]


class SubjectQuerySet(models.QuerySet):
    def for_grade(self, grade_name):
        """Subjects offered for a given GradeLevel.name."""
        return self.filter(grade_levels__name=grade_name)

    def core(self):
        return self.filter(is_core=True)


class Subject(models.Model):
    """
    A CBC learning area. `grade_levels` is a M2M to GradeLevel — one row per
    subject per CBC band, not per grade.
    """

    LEARNING_AREA_CHOICES = [
        ("languages", "Languages"),
        ("mathematics", "Mathematics"),
        ("sciences", "Sciences"),
        ("social_sciences", "Social Sciences"),
        ("technical", "Technical & Applied"),
        ("creative", "Creative Arts & Sports"),
        ("religious", "Religious Education"),
        ("life_skills", "Life Skills"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    grade_levels = models.ManyToManyField(
        GradeLevel,
        related_name="subjects",
        blank=True,
    )
    is_core = models.BooleanField(default=True)
    learning_area = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        choices=LEARNING_AREA_CHOICES,
    )
    grading_scale = models.JSONField(default=default_cbc_grading, blank=True)

    objects = SubjectQuerySet.as_manager()  # ← this is what was missing

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_core"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        errors = {}
        if not self.code:
            errors["code"] = "Code is required."
        elif self.code != self.code.upper():
            errors["code"] = "Code must be uppercase."
        if errors:
            raise ValidationError(errors)

    def is_offered_in(self, grade_name):
        return self.grade_levels.filter(name=grade_name).exists()


# ============================================================================
# SubjectAssignment
# ============================================================================

class SubjectAssignmentQuerySet(models.QuerySet):
    def for_class(self, class_room):
        return self.filter(class_room=class_room)

    def for_teacher(self, teacher):
        return self.filter(teacher=teacher)

    def for_year(self, year):
        return self.filter(class_room__academic_year=year)


class SubjectAssignment(models.Model):
    """
    'Mr. Otieno teaches Mathematics in Grade 4 East.'

    One row per (class, subject). The unique constraint enforces that a class
    has exactly one teacher for a given subject — which is how CBC junior
    schools actually run. If a school needs team-teaching, that's a future
    M2M; today it would be a bug to allow it silently.
    """

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
        limit_choices_to={"role__in": [
            "teacher", "class_teacher", "headteacher", "deputy", "hod",
        ]},
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    class_room = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="subject_assignments",
    )
    periods_per_week = models.PositiveSmallIntegerField(default=5)

    objects = SubjectAssignmentQuerySet.as_manager()

    class Meta:
        ordering = ["class_room__grade_level__order", "class_room__stream", "subject__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["subject", "class_room"],
                name="uniq_teacher_per_subject_per_class",
            ),
        ]
        indexes = [
            models.Index(fields=["class_room", "subject"]),
            models.Index(fields=["teacher"]),
        ]

    def __str__(self):
        return f"{self.teacher.name} — {self.subject.name} ({self.class_room.name})"

    def clean(self):
        errors = {}
        if self.teacher_id and self.teacher.role == "parent":
            errors["teacher"] = "A parent cannot be assigned to teach a subject."
        if (
            self.subject_id
            and self.class_room_id
            and self.class_room.grade_level_id
            and not self.subject.is_offered_in(self.class_room.grade_level_id)
        ):
            errors["subject"] = (
                f"{self.subject.name} is not offered in "
                f"{self.class_room.grade_level_id}."
            )
        if self.periods_per_week and self.periods_per_week < 1:
            errors["periods_per_week"] = "Must be at least 1."
        if errors:
            raise ValidationError(errors)


# ============================================================================
# TimetableSlot
# ============================================================================


class BellSchedule(models.Model):
    name = models.CharField(
        max_length=60, unique=True
    )  # "Pre-Primary", "Upper Primary"
    grade_levels = models.ManyToManyField(
        GradeLevel, related_name="bell_schedules", blank=True
    )
    is_default = models.BooleanField(default=False)  # used when a grade isn't mapped


class BellPeriod(models.Model):
    schedule = models.ForeignKey(
        BellSchedule, on_delete=models.CASCADE, related_name="periods"
    )
    period_number = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_break = models.BooleanField(default=False)
    break_name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["schedule", "period_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["schedule", "period_number"], name="uniq_period_per_schedule"
            )
        ]


class TimetableSlotQuerySet(models.QuerySet):
    def for_class(self, class_room):
        return self.filter(class_room=class_room)

    def for_teacher(self, teacher):
        return self.filter(teacher=teacher)

    def for_day(self, day):
        return self.filter(day=day)


class TimetableSlot(models.Model):
    """
    One cell of the weekly timetable: 'Grade 4 East, Monday, P1, Maths, Mr. Otieno.'

    Two DB constraints prevent double-booking:
      * a class can't be in two places at once (class_room + day + period)
      * a teacher can't be in two classes at once (teacher + day + period)

    Breaks are rows too, so the timetable prints correctly.
    """

    class Day(models.TextChoices):
        MONDAY = "Monday", "Monday"
        TUESDAY = "Tuesday", "Tuesday"
        WEDNESDAY = "Wednesday", "Wednesday"
        THURSDAY = "Thursday", "Thursday"
        FRIDAY = "Friday", "Friday"
        SATURDAY = "Saturday", "Saturday"

    class_room = models.ForeignKey(
        ClassRoom,
        on_delete=models.CASCADE,
        related_name="timetable_slots",
    )
    day = models.CharField(max_length=15, choices=Day.choices)
    period_number = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="timetable_slots",
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="timetable_slots",
    )
    is_break = models.BooleanField(default=False)
    break_name = models.CharField(max_length=100, blank=True, null=True)

    objects = TimetableSlotQuerySet.as_manager()

    class Meta:
        ordering = ["class_room", "day", "period_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["class_room", "day", "period_number"],
                name="uniq_class_slot",
            ),
            models.UniqueConstraint(
                fields=["teacher", "day", "period_number"],
                condition=Q(is_break=False, teacher__isnull=False),
                name="uniq_teacher_slot",
            ),
        ]
        indexes = [
            models.Index(fields=["class_room", "day"]),
            models.Index(fields=["teacher", "day"]),
        ]

    def __str__(self):
        label = self.break_name or (self.subject.name if self.subject else "—")
        return f"{self.class_room.name} · {self.day} P{self.period_number} · {label}"

    def clean(self):
        errors = {}
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            errors["end_time"] = "End time must be after start time."
        if self.is_break and self.subject_id:
            errors["subject"] = "A break cannot have a subject."
        if not self.is_break and not self.subject_id:
            errors["subject"] = "A teaching slot must have a subject."
        if errors:
            raise ValidationError(errors)


# ============================================================================
# Enrollment
# ============================================================================


class EnrollmentQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status=Enrollment.Status.ACTIVE)

    def closed(self):
        return self.exclude(status=Enrollment.Status.ACTIVE)

    def for_year(self, year):
        return self.filter(academic_year=year)

    def for_student(self, student):
        return self.filter(student=student)

    def for_class(self, class_room):
        return self.filter(class_room=class_room)


class Enrollment(models.Model):
    """
    A student's placement in a class, for one academic year.

    One row per (student, academic_year) while active. When a student leaves
    mid-year, set status + left_on. When they're promoted at year-end, close
    the old row and create a new one for the next year — never overwrite.

    `Student.class_room` and `Student.grade_level` are a denormalized cache of
    the *active* enrollment. Keep them in sync via the service functions; do
    not write them directly from a serializer.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PROMOTED = "promoted", "Promoted"
        TRANSFERRED = "transferred", "Transferred out"
        GRADUATED = "graduated", "Graduated"
        WITHDRAWN = "withdrawn", "Withdrawn"

    student = models.ForeignKey(
        "core.Student",
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    class_room = models.ForeignKey(
        ClassRoom,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )
    enrolled_on = models.DateField()
    left_on = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = EnrollmentQuerySet.as_manager()

    class Meta:
        ordering = ["-academic_year__start_date", "student__first_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "academic_year"],
                condition=Q(status="active"),
                name="one_active_enrollment_per_student_per_year",
            ),
        ]
        indexes = [
            models.Index(fields=["academic_year", "class_room"]),
            models.Index(fields=["student", "status"]),
        ]

    def __str__(self):
        return f"{self.student} — {self.class_room.name} ({self.academic_year.name})"

    def clean(self):
        errors = {}

        # class_room must belong to the same academic year
        if self.class_room_id and self.academic_year_id:
            if self.class_room.academic_year_id != self.academic_year_id:
                errors["class_room"] = (
                    f"{self.class_room.name} belongs to "
                    f"{self.class_room.academic_year.name}, not "
                    f"{self.academic_year.name}."
                )

        # left_on cannot be before enrolled_on
        if self.enrolled_on and self.left_on and self.left_on < self.enrolled_on:
            errors["left_on"] = "left_on cannot be before enrolled_on."

        # closed statuses must have a left_on
        closed = (
            self.Status.PROMOTED,
            self.Status.TRANSFERRED,
            self.Status.GRADUATED,
            self.Status.WITHDRAWN,
        )
        if self.left_on and self.status == self.Status.ACTIVE:
            errors["status"] = "An active enrollment cannot have a left_on date."
        if not self.left_on and self.status in closed:
            errors["left_on"] = "A closed enrollment must have a left_on date."

        if errors:
            raise ValidationError(errors)


# ============================================================================
# Promotion (batch-based)
# ============================================================================

class PromotionBatchQuerySet(models.QuerySet):
    def active(self):
        """Batches that are still 'live' — previewed or executed."""
        return self.filter(status__in=[
            PromotionBatch.Status.PREVIEWED,
            PromotionBatch.Status.EXECUTED,
        ])

    def for_transition(self, from_year, to_year):
        return self.filter(from_year=from_year, to_year=to_year)


class PromotionBatch(models.Model):
    """
    One grade's worth of promotion from one academic year to the next.

    A school runs ~12 of these per year-end (one per grade). Each batch is
    previewed, reviewed, executed, and (if needed) undone independently.
    Preview materializes the batch: one Promotion row per student exists
    *before* execution. Executing fills in the enrollment links and applies
    the side effects. This guarantees preview == execute.
    """

    class Status(models.TextChoices):
        PREVIEWED = "previewed", "Previewed"
        EXECUTED = "executed", "Executed"
        UNDONE = "undone", "Undone"

    from_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="promotion_batches_out",
    )
    to_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="promotion_batches_in",
    )
    from_grade = models.CharField(max_length=30)
    to_grade = models.CharField(max_length=30, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PREVIEWED,
    )

    # Summary counters (recomputed at execute time)
    student_count = models.PositiveIntegerField(default=0)
    promoted_count = models.PositiveIntegerField(default=0)
    repeated_count = models.PositiveIntegerField(default=0)
    graduated_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="promotion_batches_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    executed_at = models.DateTimeField(null=True, blank=True)
    executed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotion_batches_executed",
    )

    undone_at = models.DateTimeField(null=True, blank=True)
    undone_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotion_batches_undone",
    )

    objects = PromotionBatchQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["from_year", "to_year", "from_grade"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            # Only one active (previewed/executed) batch per transition+grade.
            models.UniqueConstraint(
                fields=["from_year", "to_year", "from_grade"],
                condition=Q(status__in=["previewed", "executed"]),
                name="one_active_batch_per_grade_per_transition",
            ),
        ]

    def __str__(self):
        return f"{self.from_grade} → {self.to_grade or 'graduate'} ({self.from_year.name} → {self.to_year.name})"

    @property
    def can_undo(self):
        """Undo is allowed only while the source year is still active."""
        return (
            self.status == self.Status.EXECUTED
            and self.from_year.status == "active"
        )


class PromotionStreamMapping(models.Model):
    """
    How a source class-stream maps to a target class-stream, within one batch.

    Example: Grade 1 has streams A, B, C. Grade 2 has streams North, West.
    The admin decides A → North, B → West, C → North (or split, manually later).

    Stored so that months later we can answer "why is Mary in 2 North when
    she was in 1 C?" — because that was the mapping on this batch.
    """

    batch = models.ForeignKey(
        PromotionBatch,
        on_delete=models.CASCADE,
        related_name="stream_mappings",
    )
    from_stream = models.CharField(max_length=20)
    from_class = models.ForeignKey(
        ClassRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    from_student_count = models.PositiveIntegerField(default=0)

    to_class = models.ForeignKey(
        ClassRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    to_stream = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["from_stream"]
        constraints = [
            models.UniqueConstraint(
                fields=["batch", "from_stream"],
                name="uniq_mapping_per_stream_per_batch",
            ),
        ]

    def __str__(self):
        target = self.to_stream or "unmapped"
        return f"{self.from_stream} → {target}"


class PromotionQuerySet(models.QuerySet):
    def for_batch(self, batch):
        return self.filter(batch=batch)

    def applied(self):
        return self.filter(applied_at__isnull=False)

    def pending(self):
        return self.filter(applied_at__isnull=True)


class Promotion(models.Model):
    """
    One student's outcome within a PromotionBatch.

    Written at preview time with applied_at=NULL. Executing the batch sets
    applied_at and performs the enrollment changes. Undoing clears applied_at
    and reverses the enrollment changes.
    """

    class Outcome(models.TextChoices):
        PROMOTED = "promoted", "Promoted"
        REPEATED = "repeated", "Repeated"
        GRADUATED = "graduated", "Graduated"
        SKIPPED = "skipped", "Skipped"

    batch = models.ForeignKey(
        PromotionBatch,
        on_delete=models.CASCADE,
        related_name="students",
    )
    student = models.ForeignKey(
        "core.Student",
        on_delete=models.CASCADE,
        related_name="promotions",
    )

    # Snapshot at preview time — what the admin reviewed
    from_class = models.CharField(max_length=100)
    from_grade = models.CharField(max_length=30)
    to_class = models.CharField(max_length=100, blank=True)
    to_class_ref = models.ForeignKey(
        ClassRoom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    to_grade = models.CharField(max_length=30, blank=True)

    outcome = models.CharField(max_length=20, choices=Outcome.choices)
    reason = models.TextField(blank=True)

    # Set only on execute
    from_enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    to_enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    applied_at = models.DateTimeField(null=True, blank=True)

    objects = PromotionQuerySet.as_manager()

    class Meta:
        ordering = ["student__first_name", "student__last_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["batch", "student"],
                name="one_row_per_student_per_batch",
            ),
        ]
        indexes = [
            models.Index(fields=["batch", "applied_at"]),
        ]

    def __str__(self):
        target = self.to_class or self.outcome
        return f"{self.student} — {self.from_class} → {target}"
