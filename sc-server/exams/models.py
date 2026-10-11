"""Exams: exams, subjects, marks, and comments.

Dependency rule: imports from core, school, academics. Nothing else in the
codebase imports from here except reporting/parent-portal code.
"""

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from academics.models import ClassRoom, Subject
from school.models import AcademicYear, GradeLevel, Term


# ============================================================================
# Exam
# ============================================================================

class ExamQuerySet(models.QuerySet):
    def open(self):
        return self.filter(status=Exam.Status.OPEN)

    def released(self):
        return self.filter(status=Exam.Status.RELEASED)

    def for_year(self, academic_year):
        return self.filter(academic_year=academic_year)

    def for_term(self, term):
        return self.filter(term=term)


class Exam(models.Model):
    """
    One exam for one term. E.g. 'End of Term 2, 2026'.

    Grade scoping: `grade_levels` is a M2M to GradeLevel. Subjects are
    created per (grade, subject) via ExamSubject.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open for marks"
        CLOSED = "closed", "Marks closed"
        RELEASED = "released", "Released"

    class ExamType(models.TextChoices):
        CAT = "cat", "CAT"
        MID_TERM = "mid_term", "Mid-term"
        END_TERM = "end_term", "End of term"
        MOCK = "mock", "Mock"
        OTHER = "other", "Other"

    name = models.CharField(max_length=100)
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.PROTECT, related_name="exams",
    )
    term = models.ForeignKey(
        Term, on_delete=models.PROTECT, related_name="exams",
    )
    grade_levels = models.ManyToManyField(
        GradeLevel, related_name="exams", blank=True,
    )
    class_rooms = models.ManyToManyField(
        ClassRoom,
        related_name="exams",
        blank=True,
    )

    exam_type = models.CharField(
        max_length=20,
        choices=ExamType.choices,
        default=ExamType.END_TERM,
    )

    start_date = models.DateField()
    end_date = models.DateField()

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT,
    )

    # Who created / released it
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="exams_created",
    )
    released_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="exams_released",
    )
    released_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ExamQuerySet.as_manager()

    class Meta:
        ordering = ["-academic_year__start_date", "term__number", "name"]
        indexes = [
            models.Index(fields=["academic_year", "term"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.term.label})"

    def clean(self):
        errors = {}
        if self.start_date and self.end_date and self.end_date < self.start_date:
            errors["end_date"] = "End date cannot be before the start date."
        if self.term_id and self.academic_year_id:
            if self.term.academic_year_id != self.academic_year_id:
                errors["term"] = "Term does not belong to the academic year."
        if errors:
            raise ValidationError(errors)

    def classes_for(self, grade_name):
        """Classes covered by this exam for a grade. No classes picked = whole grade."""
        qs = ClassRoom.objects.filter(
            academic_year=self.academic_year, grade_level_id=grade_name,
        )
        if self.class_rooms.exists():
            qs = qs.filter(pk__in=self.class_rooms.values("pk"))
        return qs

    @property
    def can_edit_marks(self):
        return self.status == self.Status.OPEN

    @property
    def is_released(self):
        return self.status == self.Status.RELEASED


# ============================================================================
# ExamSubject
# ============================================================================

class ExamSubjectQuerySet(models.QuerySet):
    def for_exam(self, exam):
        return self.filter(exam=exam)

    def for_grade(self, grade_name):
        return self.filter(grade_level_id=grade_name)

    def for_teacher(self, user):
        """Subjects this teacher can enter marks for, based on SubjectAssignment."""
        from academics.models import SubjectAssignment
        class_ids = SubjectAssignment.objects.filter(teacher=user).values_list(
            "class_room_id", flat=True
        )
        subject_ids = SubjectAssignment.objects.filter(teacher=user).values_list(
            "subject_id", flat=True
        )
        return self.filter(
            subject_id__in=subject_ids,
            exam__grade_levels__classes__id__in=class_ids,
        ).distinct()


class ExamSubject(models.Model):
    """
    One subject being examined for one grade in one exam.

    The grading scale is COPIED from the subject at creation time. Why?
    Because the subject's scale can change later, and old exams must keep
    their original grading.
    """

    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="exam_subjects",
    )
    grade_level = models.ForeignKey(
        GradeLevel, on_delete=models.PROTECT, related_name="exam_subjects",
        to_field="name", db_column="grade_level",
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.PROTECT, related_name="exam_subjects",
    )
    max_mark = models.PositiveSmallIntegerField(default=100)

    # Snapshot of the grading scale at exam creation time
    grading_scale = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    objects = ExamSubjectQuerySet.as_manager()

    class Meta:
        ordering = ["grade_level__order", "subject__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["exam", "grade_level", "subject"],
                name="uniq_subject_per_grade_per_exam",
            ),
        ]

    def __str__(self):
        return f"{self.exam.name} · {self.grade_level_id} · {self.subject.name}"

    def compute_grade(self, score):
        """
        Return (grade, points) for a raw score using this subject's scale.
        Falls back to (None, 0) if the scale is empty.
        """
        if score is None or not self.grading_scale:
            return None, 0
        s = float(score)
        for band in self.grading_scale:
            lo = float(band.get("min", 0))
            hi = float(band.get("max", 100))
            if lo <= s <= hi:
                return band.get("grade", None), int(band.get("points", 0))
        return None, 0

    def default_comment_for(self, score):
        """Return the default comment for a score, or ''."""
        if score is None or not self.grading_scale:
            return ""
        s = float(score)
        for band in self.grading_scale:
            lo = float(band.get("min", 0))
            hi = float(band.get("max", 100))
            if lo <= s <= hi:
                return band.get("default_comment", "")
        return ""


# ============================================================================
# Mark
# ============================================================================

class MarkQuerySet(models.QuerySet):
    def for_exam(self, exam):
        return self.filter(exam_subject__exam=exam)

    def for_student(self, student):
        return self.filter(student=student)

    def for_exam_subject(self, exam_subject):
        return self.filter(exam_subject=exam_subject)

    def missing_comment(self):
        return self.filter(Q(comment="") | Q(comment__isnull=True), is_na=False)


class Mark(models.Model):
    """
    One student's mark in one exam subject.

    `grade` and `points` are snapshots computed at entry time. Never recompute
    them on read — the grading scale could change later, and old reports
    must not change.
    """

    exam_subject = models.ForeignKey(
        ExamSubject, on_delete=models.CASCADE, related_name="marks",
    )
    student = models.ForeignKey(
        "core.Student", on_delete=models.CASCADE, related_name="marks",
    )

    score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)   # EE, ME, AE, BE
    points = models.PositiveSmallIntegerField(default=0)

    comment = models.TextField(blank=True)
    is_na = models.BooleanField(
        default=False,
        help_text="Not assessed (transferred in mid-term, or exempt).",
    )

    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="marks_entered",
    )
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MarkQuerySet.as_manager()

    class Meta:
        ordering = ["student__first_name", "student__last_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["exam_subject", "student"],
                name="uniq_mark_per_student_per_subject",
            ),
        ]
        indexes = [
            models.Index(fields=["exam_subject", "student"]),
            models.Index(fields=["student"]),
        ]

    def __str__(self):
        return f"{self.student} — {self.exam_subject.subject.name} — {self.score}"

    def save(self, *args, **kwargs):
        """
        Recompute grade + points from the exam subject's scale on every save.
        The client may send them, but the server overrides.
        """
        if not self.is_na and self.score is not None:
            grade, points = self.exam_subject.compute_grade(self.score)
            self.grade = grade or ""
            self.points = points
        else:
            self.grade = ""
            self.points = 0
        super().save(*args, **kwargs)

    def clean(self):
        errors = {}
        if not self.is_na:
            if self.score is None:
                errors["score"] = "Score is required."
            elif self.score < 0:
                errors["score"] = "Score cannot be negative."
            elif self.exam_subject_id and self.score > self.exam_subject.max_mark:
                errors["score"] = (
                    f"Score cannot exceed {self.exam_subject.max_mark}."
                )
        if errors:
            raise ValidationError(errors)


# ============================================================================
# ExamComment
# ============================================================================

class ExamComment(models.Model):
    """
    One comment per student per exam: the class teacher's and the head
    teacher's overall remarks. Separate from Mark because it's about the
    student's exam as a whole, not one subject.
    """

    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="comments",
    )
    student = models.ForeignKey(
        "core.Student", on_delete=models.CASCADE, related_name="exam_comments",
    )

    class_teacher_comment = models.TextField(blank=True)
    head_teacher_comment = models.TextField(blank=True)

    class_teacher_set_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="comments_class_teacher_set",
    )
    class_teacher_set_at = models.DateTimeField(null=True, blank=True)

    head_teacher_set_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="comments_head_teacher_set",
    )
    head_teacher_set_at = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["exam", "student"],
                name="uniq_comment_per_student_per_exam",
            ),
        ]
        indexes = [
            models.Index(fields=["exam", "student"]),
        ]

    def __str__(self):
        return f"{self.exam.name} — {self.student}"
