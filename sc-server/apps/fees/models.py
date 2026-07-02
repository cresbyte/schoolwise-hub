from django.db import models


class FeeStructure(models.Model):
    name = models.CharField(max_length=200)  # e.g. Term 2 2026 Grade 6
    grade_level = models.CharField(max_length=20)
    year = models.IntegerField(default=2026)
    term = models.IntegerField(default=1)

    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    breakdown = models.JSONField()  # e.g. {"tuition": 15000, "transport": 5000}

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Payment(models.Model):
    METHOD_CHOICES = (
        ("mpesa", "M-Pesa"),
        ("cash", "Cash"),
        ("bank_transfer", "Bank Transfer"),
        ("cheque", "Cheque"),
    )

    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    reference_number = models.CharField(max_length=100, unique=True)
    date = models.DateField()

    received_by = models.ForeignKey("staff.Staff", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.amount} ({self.reference_number})"


class FeeLevy(models.Model):
    SCOPE_CHOICES = (
        ("all", "All Students"),
        ("class", "Class"),
        ("grade", "Grade"),
        ("individual", "Individual"),
    )
    CATEGORY_CHOICES = (
        ("trip", "Trip"),
        ("uniform", "Uniform"),
        ("activity", "Activity"),
        ("other", "Other"),
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("cancelled", "Cancelled"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="all")
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.SET_NULL, null=True, blank=True)
    grade_level = models.CharField(max_length=20, blank=True)
    student_ids = models.JSONField(default=list, blank=True)
    academic_year = models.IntegerField(default=2026)
    term = models.IntegerField(default=1)
    due_date = models.DateField()
    issued_date = models.DateField(auto_now_add=True)
    issued_by = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    def __str__(self):
        return self.title


class LevyPayment(models.Model):
    levy = models.ForeignKey(FeeLevy, on_delete=models.CASCADE, related_name="payments")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="levy_payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    receipt_number = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("levy", "student")

    def __str__(self):
        return f"{self.student} - {self.levy.title}"
