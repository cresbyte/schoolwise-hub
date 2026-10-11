"""Attendance: one row per student per day.

The student's roster context (class_room, academic_year) is SNAPSHOTTED on
each row. Never derive it from Student.class_room — that field changes when
a student is promoted, and the historical record must not change with it.

Dependency rule: this app imports from `core`, `school`, and `academics`.
Nothing imports from `attendance` except reporting/notification code.
"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from academics.models import ClassRoom, Enrollment
from school.models import AcademicYear, Term


class AttendanceStatus(models.TextChoices):
    PRESENT = "present", "Present"
    ABSENT = "absent", "Absent"
    LATE = "late", "Late"
    EXCUSED = "excused", "Excused"


class AbsenceReason(models.TextChoices):
    """Controlled reasons. Free text goes in `notes`, not here."""

    SICK = "sick", "Sick"
    FAMILY = "family", "Family emergency"
    TRANSPORT = "transport", "Transport problem"
    SCHOOL_ACTIVITY = "school_activity", "School activity"
    MEDICAL = "medical", "Medical appointment"
    FEES = "fees", "Fee-related"
    UNKNOWN = "unknown", "Unknown"
    OTHER = "other", "Other"


class AttendanceQuerySet(models.QuerySet):
    def for_date(self, day):
        return self.filter(date=day)

    def for_range(self, start, end):
        return self.filter(date__gte=start, date__lte=end)

    def for_class(self, class_room):
        return self.filter(class_room=class_room)

    def for_student(self, student):
        return self.filter(student=student)

    def for_year(self, academic_year):
        return self.filter(academic_year=academic_year)

    def present_like(self):
        """Present or late — the two statuses that count as 'attended'."""
        return self.filter(
            status__in=[
                AttendanceStatus.PRESENT,
                AttendanceStatus.LATE,
            ]
        )


class Attendance(models.Model):
    """
    One student's attendance on one calendar day.

    Enrollment-aware: the roster for (class_room, date) comes from
    Enrollment rows active on that date, not from Student.class_room.
    """

    student = models.ForeignKey(
        "core.Student",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
    )
    reason = models.CharField(
        max_length=20,
        choices=AbsenceReason.choices,
        blank=True,
    )
    notes = models.CharField(max_length=200, blank=True)

    # Snapshot — where the student was on this day
    class_room = models.ForeignKey(
        ClassRoom,
        on_delete=models.PROTECT,
        related_name="attendance_records",
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="attendance_records",
    )

    # Audit
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_recorded",
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_updated",
    )
    updated_at = models.DateTimeField(auto_now=True)

    objects = AttendanceQuerySet.as_manager()

    class Meta:
        ordering = ["-date", "student__first_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "date"],
                name="one_attendance_per_student_per_day",
            ),
        ]
        indexes = [
            models.Index(fields=["class_room", "date"]),
            models.Index(fields=["student", "date"]),
            models.Index(fields=["academic_year", "date"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.student} — {self.date} — {self.status}"

    def clean(self):
        errors = {}

        # Reason only makes sense for absent/excused
        if self.reason and self.status == AttendanceStatus.PRESENT:
            errors["reason"] = "A present record cannot have a reason."
        if self.status == AttendanceStatus.ABSENT and not self.reason:
            errors["reason"] = "An absence needs a reason."
        if self.status == AttendanceStatus.EXCUSED and not self.reason:
            errors["reason"] = "An excused absence needs a reason."

        # The class must belong to the same academic year as the record
        if (
            self.class_room_id
            and self.academic_year_id
            and self.class_room.academic_year_id != self.academic_year_id
        ):
            errors["class_room"] = (
                f"{self.class_room.name} is not in {self.academic_year.name}."
            )

        if errors:
            raise ValidationError(errors)


# ============================================================================
# Small helper for building the roster — used by services and views
# ============================================================================


def roster_for(class_room, day):
    """
    Return the queryset of Enrollments that should be on the register for
    `class_room` on `day`.

    A student is on the register if they had an active enrollment in this
    class on this date — enrolled on or before, and either still enrolled
    or left after this date.
    """
    return (
        Enrollment.objects.filter(
            class_room=class_room,
            status__in=[
                Enrollment.Status.ACTIVE,
                Enrollment.Status.PROMOTED,  # left the class by promotion
            ],
            enrolled_on__lte=day,
        )
        .filter(Q(left_on__isnull=True) | Q(left_on__gt=day))
        .select_related("student")
        .order_by("student__first_name", "student__last_name")
    )
