from django.db import models
from django.conf import settings


class AcademicTerm(models.Model):
    """
    Canonical definition of a term's date range. Every other model that
    references (year, term) as plain integers — TermEvent, FeeStructure,
    FeeLevy, ClassRoom — should be understood as pointing at one of these,
    even though (for now, deliberately) they stay loosely coupled via plain
    integers rather than a hard foreign key, to avoid a large migration
    touching four existing tables. This model's only job is to answer
    "when does term N of year Y start and end."
    """
    year = models.IntegerField()
    term_number = models.IntegerField()  # 1, 2, 3 — not hardcoded to exactly 3
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ["year", "term_number"]
        unique_together = ("year", "term_number")
        verbose_name = "Academic Term"
        verbose_name_plural = "Academic Terms"

    def __str__(self):
        return f"Term {self.term_number}, {self.year} ({self.start_date} – {self.end_date})"

    def save(self, *args, **kwargs):
        # Only one term system-wide can be "current" at a time.
        if self.is_current:
            AcademicTerm.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)
        if self.is_current:
            self._sync_school_current_term()

    def _sync_school_current_term(self):
        """
        Keep School.current_term/current_year/term_start/term_end in sync so
        existing code that already reads those fields directly keeps working
        unchanged. This model is additive, not a breaking replacement.
        """
        from apps.school.models import School
        school = School.objects.first()
        if school:
            school.current_term = self.term_number
            school.current_year = self.year
            school.term_start = self.start_date
            school.term_end = self.end_date
            school.save(update_fields=["current_term", "current_year", "term_start", "term_end"])


class ClassRoom(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100) # e.g. Grade 6 Blue
    grade_level = models.CharField(max_length=20) # PP1, Grade 1, etc.
    stream = models.CharField(max_length=20, default="A")
    curriculum = models.CharField(max_length=20, default="CBC")
    capacity = models.IntegerField(default=40)
    room = models.CharField(max_length=20, blank=True, null=True)
    academic_year = models.IntegerField(default=2026)
    
    # Class Teacher link
    class_teacher = models.ForeignKey(
        "staff.Staff", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="classes_assigned"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Class"
        verbose_name_plural = "Classes"
        ordering = ["grade_level", "name"]

class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    curriculum = models.CharField(max_length=20, default="CBC", choices=(("CBC", "CBC"), ("844", "8-4-4")))
    grade_levels = models.JSONField(default=list, blank=True)
    is_core = models.BooleanField(default=True)
    learning_area = models.CharField(max_length=100, blank=True, null=True)
    grading_system = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name

class SubjectAssignment(models.Model):
    """Links teachers to subjects and classes."""
    teacher = models.ForeignKey("staff.Staff", on_delete=models.CASCADE, related_name="subject_assignments")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    class_room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="subject_assignments")
    periods_per_week = models.IntegerField(default=5)
    
    class Meta:
        unique_together = ("teacher", "subject", "class_room")

    def __str__(self):
        return f"{self.teacher.user.name if self.teacher.user else 'Staff'} - {self.subject.name} ({self.class_room.name})"

class TimetableSlot(models.Model):
    DAY_CHOICES = (
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    )
    class_room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name="timetable_slots")
    day = models.CharField(max_length=15, choices=DAY_CHOICES)
    period_number = models.IntegerField()
    start_time = models.CharField(max_length=10) # e.g. "08:30"
    end_time = models.CharField(max_length=10)   # e.g. "09:30"
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    teacher = models.ForeignKey("staff.Staff", on_delete=models.SET_NULL, null=True, blank=True)
    is_break = models.BooleanField(default=False)
    break_name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        verbose_name = "Timetable Slot"
        verbose_name_plural = "Timetable Slots"
        unique_together = ("class_room", "day", "period_number")
        ordering = ["day", "period_number"]

    def __str__(self):
        if self.is_break:
            return f"{self.class_room.name} - {self.day} P{self.period_number}: {self.break_name or 'Break'}"
        return f"{self.class_room.name} - {self.day} P{self.period_number}: {self.subject.name if self.subject else 'None'} ({self.teacher.user.name if self.teacher and self.teacher.user else 'No Teacher'})"


class TermEvent(models.Model):
    CATEGORY_CHOICES = (
        ("exam", "Exam"),
        ("holiday", "Holiday"),
        ("closure", "Closure"),
        ("meeting", "Meeting"),
        ("activity", "Activity"),
        ("trip", "Trip"),
        ("deadline", "Deadline"),
        ("other", "Other"),
    )
    SCOPE_CHOICES = (
        ("school", "School-wide"),
        ("grade", "Grade Level"),
        ("class", "Specific Class"),
    )
    APPROVAL_CHOICES = (
        ("draft", "Draft"),
        ("pending_approval", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="school")
    class_room = models.ForeignKey(ClassRoom, on_delete=models.SET_NULL, null=True, blank=True, related_name="term_events")
    grade_level = models.CharField(max_length=20, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    term = models.IntegerField()
    year = models.IntegerField()
    visible_to_parents = models.BooleanField(default=False)
    exam = models.ForeignKey("exams.Exam", on_delete=models.SET_NULL, null=True, blank=True, related_name="term_events")
    approval_status = models.CharField(max_length=30, choices=APPROVAL_CHOICES, default="pending_approval")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_term_events")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_term_events")
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_date", "title"]

    def __str__(self):
        return f"{self.title} ({self.start_date})"

    @property
    def is_range(self):
        return self.start_date != self.end_date
