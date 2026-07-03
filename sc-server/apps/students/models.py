from django.db import models
from django.conf import settings
from django.utils import timezone


class Student(models.Model):
    GENDER_CHOICES = (
        ("Male", "Male"),
        ("Female", "Female"),
    )
    BOARDING_CHOICES = (
        ("day", "Day Scholar"),
        ("boarding", "Boarding"),
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("graduated", "Graduated"),
        ("transferred_out", "Transferred"),
    )
    CURRICULUM_CHOICES = (
        ("CBC", "CBC"),
        ("844", "8-4-4"),
    )

    id = models.CharField(max_length=50, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    other_name = models.CharField(max_length=100, blank=True, null=True)
    admission_number = models.CharField(max_length=50, unique=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()

    # Academics
    grade_level = models.CharField(max_length=20)
    class_room = models.ForeignKey(
        "academics.ClassRoom",
        on_delete=models.SET_NULL,
        null=True,
        related_name="students",
    )
    curriculum = models.CharField(
        max_length=10, choices=CURRICULUM_CHOICES, default="CBC"
    )
    admission_date = models.DateField(null=True, blank=True)

    # Status
    boarding_status = models.CharField(
        max_length=20, choices=BOARDING_CHOICES, default="day"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    # Identifiers
    nemis_number = models.CharField(max_length=50, blank=True, null=True)
    birth_cert_number = models.CharField(max_length=50, blank=True, null=True)

    # Parent/Guardian Details (as specified in mock data)
    father_name = models.CharField(max_length=200, blank=True, null=True)
    father_phone = models.CharField(max_length=20, blank=True, null=True)
    father_email = models.EmailField(blank=True, null=True)
    father_id_number = models.CharField(max_length=50, blank=True, null=True)
    father_occupation = models.CharField(max_length=100, blank=True, null=True)

    mother_name = models.CharField(max_length=200, blank=True, null=True)
    mother_phone = models.CharField(max_length=20, blank=True, null=True)
    mother_occupation = models.CharField(max_length=100, blank=True, null=True)

    primary_contact_name = models.CharField(max_length=200, blank=True, null=True)
    primary_contact_phone = models.CharField(max_length=20, blank=True, null=True)

    # Others
    home_location = models.CharField(max_length=255, blank=True, null=True)
    fee_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    photo = models.ImageField(upload_to="students/photos/", null=True, blank=True)
    health_info = models.TextField(blank=True)

    # System Links
    guardians = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="children",
        limit_choices_to={"role": "parent"},
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"

    class Meta:
        ordering = ["first_name", "last_name"]


class Application(models.Model):
    """
    Online/walk-in admission application.
    Lifecycle: pending -> interview_scheduled -> offered -> enrolled
                                                \\-> rejected
                        \\-> withdrawn (parent-initiated, any stage before enrolled)
    """

    GENDER_CHOICES = (
        ("Male", "Male"),
        ("Female", "Female"),
    )
    BOARDING_CHOICES = (
        ("day", "Day Scholar"),
        ("boarding", "Boarding"),
    )
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("interview_scheduled", "Interview Scheduled"),
        ("offered", "Offered"),
        ("enrolled", "Enrolled"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    )
    SOURCE_CHOICES = (
        ("website", "Website"),
        ("walk_in", "Walk-in"),
        ("referral", "Referral"),
    )

    # Learner details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    grade_applying = models.CharField(max_length=20)
    boarding_type = models.CharField(
        max_length=20, choices=BOARDING_CHOICES, default="day"
    )
    other_name = models.CharField(max_length=100, blank=True, null=True)
    nemis_number = models.CharField(max_length=50, blank=True, null=True)
    birth_cert_number = models.CharField(max_length=50, blank=True, null=True)
    curriculum = models.CharField(
        max_length=10, choices=Student.CURRICULUM_CHOICES, default="CBC"
    )


    # Parent/Guardian details
    parent_name = models.CharField(max_length=200)
    parent_phone = models.CharField(max_length=20)
    parent_email = models.EmailField(blank=True, null=True)
    relationship = models.CharField(max_length=50, blank=True)

    # Previous school
    prev_school = models.CharField(max_length=200, blank=True)
    prev_class = models.CharField(max_length=50, blank=True)
    reason = models.TextField(blank=True)

    # Workflow
    admission_ref = models.CharField(max_length=50, unique=True, editable=False)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pending")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="website")
    interview_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_applications",
    )
    converted_student = models.OneToOneField(
        Student,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_application",
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return (
            f"{self.admission_ref} — {self.first_name} {self.last_name} ({self.status})"
        )

    def save(self, *args, **kwargs):
        if not self.admission_ref:
            self.admission_ref = self._generate_ref()
        super().save(*args, **kwargs)

    def _generate_ref(self):
        """
        APP-<year>-<sequence>, e.g. APP-2026-0001.
        Sequence resets per calendar year. Prefix could later be pulled
        from School settings to make this fully per-school configurable.
        """
        year = timezone.now().year
        last = (
            Application.objects.filter(admission_ref__startswith=f"APP-{year}-")
            .order_by("-id")
            .first()
        )
        next_seq = 1
        if last and last.admission_ref:
            try:
                next_seq = int(last.admission_ref.split("-")[-1]) + 1
            except (ValueError, IndexError):
                next_seq = (
                    Application.objects.filter(
                        admission_ref__startswith=f"APP-{year}-"
                    ).count()
                    + 1
                )
        return f"APP-{year}-{next_seq:04d}"
