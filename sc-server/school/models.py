"""School app models: academic calendar structure (AcademicYear -> Term, GradeLevel)
and the school calendar (CalendarEvent).

Dependency rule: this app sits near the bottom of the stack. It must not import
from academics, exams, fees or attendance. They import from here, never the reverse.
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

# ============================================================================
# School (existing model): paste your current `School` class here, unchanged.
# Later, remove current_term / current_year / term_start / term_end from it and
# read services.get_current_period() instead.
# ============================================================================


# ============================================================================
# Academic year, term, grade level
# ============================================================================
MAX_TERMS_PER_YEAR = 3


class YearStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"


class AcademicYearQuerySet(models.QuerySet):
    def get_active(self):
        return self.filter(status=YearStatus.ACTIVE).first()


class AcademicYear(models.Model):
    name = models.CharField(max_length=20, unique=True)  # e.g. "2026"
    start_date = models.DateField()
    end_date = models.DateField()
    # Changed only through services.activate_year / close_year.
    status = models.CharField(
        max_length=10, choices=YearStatus.choices, default=YearStatus.DRAFT
    )

    objects = AcademicYearQuerySet.as_manager()

    class Meta:
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["status"],
                condition=Q(status="active"),
                name="only_one_active_year",
            )
        ]

    def __str__(self):
        return self.name

    def clean(self):
        errors = {}
        if self.pk and self.status == YearStatus.CLOSED:
            raise ValidationError("A closed academic year cannot be edited.")
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                errors["end_date"] = "End date must be after the start date."
            else:
                overlap = (
                    AcademicYear.objects.exclude(pk=self.pk)
                    .filter(
                        start_date__lte=self.end_date, end_date__gte=self.start_date
                    )
                    .first()
                )
                if overlap:
                    errors["start_date"] = (
                        f"Overlaps with academic year {overlap.name}."
                    )
                elif (
                    self.pk
                    and self.terms.filter(
                        Q(start_date__lt=self.start_date)
                        | Q(end_date__gt=self.end_date)
                    ).exists()
                ):
                    errors["start_date"] = "Existing terms fall outside these dates."
        if errors:
            raise ValidationError(errors)


class TermQuerySet(models.QuerySet):
    def get_current(self):
        return self.select_related("academic_year").filter(is_current=True).first()


class Term(models.Model):
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.PROTECT, related_name="terms"
    )
    number = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(MAX_TERMS_PER_YEAR)]
    )
    start_date = models.DateField()
    end_date = models.DateField()
    # Changed only through services.set_current_term.
    is_current = models.BooleanField(default=False)

    objects = TermQuerySet.as_manager()

    class Meta:
        ordering = ["-academic_year__start_date", "number"]
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "number"], name="uniq_term_number_per_year"
            ),
            models.UniqueConstraint(
                fields=["is_current"],
                condition=Q(is_current=True),
                name="only_one_current_term",
            ),
        ]

    def __str__(self):
        return self.label

    @property
    def label(self):
        return f"Term {self.number}, {self.academic_year.name}"

    def clean(self):
        errors = {}
        if self.academic_year_id and self.academic_year.status == YearStatus.CLOSED:
            raise ValidationError("Terms of a closed academic year cannot be changed.")
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                errors["end_date"] = "End date must be after the start date."
            else:
                if self.academic_year_id:
                    year = self.academic_year
                    if (
                        self.start_date < year.start_date
                        or self.end_date > year.end_date
                    ):
                        errors["start_date"] = (
                            f"Term must fall within academic year {year.name} "
                            f"({year.start_date} to {year.end_date})."
                        )
                overlap = (
                    Term.objects.exclude(pk=self.pk)
                    .filter(
                        start_date__lte=self.end_date, end_date__gte=self.start_date
                    )
                    .select_related("academic_year")
                    .first()
                )
                if overlap and "start_date" not in errors:
                    errors["start_date"] = f"Overlaps with {overlap.label}."
        if errors:
            raise ValidationError(errors)


class GradeLevel(models.Model):
    """Ordered grades (PP1, PP2, Grade 1 ...). `order` drives promotion."""

    name = models.CharField(max_length=30, unique=True)
    order = models.PositiveSmallIntegerField(unique=True)
    is_final = models.BooleanField(
        default=False, help_text="Students graduate after this grade."
    )

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name

    @property
    def next_grade(self):
        if self.is_final:
            return None
        return GradeLevel.objects.filter(order__gt=self.order).first()


# ============================================================================
# Calendar
# ============================================================================


class EventCategory(models.TextChoices):
    EXAM = "exam", "Exam"
    HOLIDAY = "holiday", "Holiday"
    CLOSURE = "closure", "Closure"
    MEETING = "meeting", "Meeting"
    ACTIVITY = "activity", "Activity"
    TRIP = "trip", "Trip"
    DEADLINE = "deadline", "Deadline"
    OTHER = "other", "Other"


class EventScope(models.TextChoices):
    SCHOOL = "school", "School-wide"
    GRADE = "grade", "Grade level(s)"


class ApprovalStatus(models.TextChoices):
    PENDING = "pending", "Pending approval"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class CalendarEvent(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20, choices=EventCategory.choices, default=EventCategory.OTHER
    )
    scope = models.CharField(
        max_length=10, choices=EventScope.choices, default=EventScope.SCHOOL
    )
    grade_levels = models.ManyToManyField(
        GradeLevel, blank=True, related_name="calendar_events"
    )
    start_date = models.DateField()
    end_date = models.DateField()

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.PROTECT, related_name="events"
    )
    # Nullable on purpose: holidays, breaks and staff days sit between terms.
    term = models.ForeignKey(
        Term, on_delete=models.PROTECT, null=True, blank=True, related_name="events"
    )
    visible_to_parents = models.BooleanField(default=False)

    approval_status = models.CharField(
        max_length=10, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_calendar_events",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_calendar_events",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    

    class Meta:
        ordering = ["start_date", "title"]
        indexes = [
            models.Index(fields=["academic_year", "start_date"]),
            models.Index(fields=["approval_status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.start_date})"

    def clean(self):
        errors = {}
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                errors["end_date"] = "End date cannot be before the start date."
            elif self.academic_year_id:
                year = self.academic_year
                if year.status == YearStatus.CLOSED:
                    raise ValidationError(
                        "Cannot add or change events in a closed academic year."
                    )
                if self.start_date < year.start_date or self.end_date > year.end_date:
                    errors["start_date"] = (
                        f"Event must fall within academic year {year.name} "
                        f"({year.start_date} to {year.end_date})."
                    )
                if self.term_id:
                    term = self.term
                    if term.academic_year_id != self.academic_year_id:
                        errors["term"] = (
                            "Term does not belong to the selected academic year."
                        )
                    elif (
                        self.start_date < term.start_date
                        or self.end_date > term.end_date
                    ):
                        errors["term"] = (
                            f"Event must fall within {term.label} "
                            f"({term.start_date} to {term.end_date}). "
                            "Leave the term empty for holidays and breaks."
                        )
        if errors:
            raise ValidationError(errors)
