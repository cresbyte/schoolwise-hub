"""Fees: structures, invoices, payments, and one-off charges.

Rules that must never be broken:
  * Invoices are frozen once issued. To change one, void it and create a new one.
  * Payments apply oldest-first to unpaid invoices.
  * Overpayments become credits, absorbed by future invoices.
  * Student.fee_balance is a cache. It is recomputed, never edited directly.
"""

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from academics.models import ClassRoom, Enrollment
from core.models import Student
from school.models import AcademicYear, GradeLevel, Term


# ============================================================================
# FeeStructure
# ============================================================================

class FeeStructureItem(models.Model):
    """One line on the price list, e.g. 'Tuition — KES 15,000'."""

    class Category(models.TextChoices):
        TUITION = "tuition", "Tuition"
        ACTIVITIES = "activities", "Activities"
        MEALS = "meals", "Meals"
        TRANSPORT = "transport", "Transport"
        BOARDING = "boarding", "Boarding"
        EXAM = "exam", "Exam fee"
        OTHER = "other", "Other"

    fee_structure = models.ForeignKey(
        "FeeStructure", on_delete=models.CASCADE, related_name="items",
    )
    name = models.CharField(max_length=100)      # "Tuition", "Lunch programme"
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        ordering = ["fee_structure", "category", "name"]
        unique_together = [("fee_structure", "name")]

    def __str__(self):
        return f"{self.name} — {self.amount}"


class FeeStructure(models.Model):
    """
    The price list for one (academic_year, term, grade_level).

    Editable. Changing it affects invoices generated *after* the change.
    Existing invoices are never touched.
    """

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.PROTECT, related_name="fee_structures",
    )
    term = models.ForeignKey(
        Term, on_delete=models.PROTECT, related_name="fee_structures",
    )
    grade_level = models.ForeignKey(
        GradeLevel, on_delete=models.PROTECT, related_name="fee_structures",
        to_field="name", db_column="grade_level",
    )

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="fee_structures_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-academic_year__start_date", "term__number", "grade_level__order"]
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "term", "grade_level"],
                name="uniq_fee_structure_per_year_term_grade",
            ),
        ]

    def __str__(self):
        return f"{self.grade_level_id} · {self.term.label} · {self.academic_year.name}"

    @property
    def total(self):
        return sum(
            (item.amount for item in self.items.all()),
            Decimal("0"),
        )


# ============================================================================
# Charge (one-off charges: trips, activities, exam fees)
# ============================================================================

class ChargeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status=Charge.Status.ACTIVE)

    def for_year(self, year):
        return self.filter(academic_year=year)


class Charge(models.Model):
    """
    A one-off charge applied to a set of students, alongside the standard
    fee structure. Examples: a school trip, KCSE registration, a science kit.
    """

    class Scope(models.TextChoices):
        SCHOOL = "school", "Whole school"
        GRADE = "grade", "Grade level(s)"
        CLASS = "class", "Class(es)"
        STUDENTS = "students", "Specific students"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"
        CANCELLED = "cancelled", "Cancelled"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.PROTECT, related_name="charges",
    )
    term = models.ForeignKey(
        Term, on_delete=models.PROTECT, related_name="charges",
        null=True, blank=True,
    )

    scope = models.CharField(max_length=20, choices=Scope.choices)

    # Scope targets — only one is used depending on `scope`
    grade_levels = models.ManyToManyField(
        GradeLevel,
        blank=True,
        related_name="charges",
    )
    classes = models.ManyToManyField(
        ClassRoom, blank=True, related_name="charges",
    )
    students = models.ManyToManyField(
        Student, blank=True, related_name="direct_charges",
        through="ChargeAssignment",
    )

    is_optional = models.BooleanField(
        default=False,
        help_text="Optional charges require an opt-in before appearing on an invoice.",
    )
    due_date = models.DateField()

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="charges_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ChargeQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.amount})"


class ChargeAssignment(models.Model):
    """
    One row per (charge, student). Records whether the student is affected,
    whether they've opted in (for optional charges), and links to the
    invoice line the charge produced.
    """

    charge = models.ForeignKey(
        Charge, on_delete=models.CASCADE, related_name="assignments",
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="charge_assignments",
    )

    opted_in = models.BooleanField(
        default=True,
        help_text="True for mandatory charges. For optional, set when the parent confirms.",
    )
    opted_in_at = models.DateTimeField(null=True, blank=True)

    applied_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the charge was added to an invoice.",
    )
    invoice_line = models.OneToOneField(
        "InvoiceLine", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="charge_assignment",
    )

    class Meta:
        unique_together = [("charge", "student")]
        indexes = [models.Index(fields=["charge", "opted_in"])]

    def __str__(self):
        return f"{self.charge.name} → {self.student}"

    # fees/models.py — add to ChargeAssignment class (after __str__)

    @property
    def paid_amount(self):
        """
        How much of this charge's invoice line has been covered by payments.

        Payments are allocated to the *invoice* FIFO, not to individual
        lines. So we pro-rate: if the invoice is 50% paid, we treat each
        line as 50% paid. This is honest given the current allocation model.

        If you later want true line-level allocation, change
        services._allocate_payment to allocate against InvoiceLine instead
        of Invoice.
        """
        if not self.invoice_line_id:
            return Decimal("0")
        line = self.invoice_line
        invoice = line.invoice

        if invoice.status == Invoice.Status.PAID:
            return line.amount
        if invoice.total <= 0 or invoice.paid_amount <= 0:
            return Decimal("0")

        ratio = invoice.paid_amount / invoice.total
        return (line.amount * ratio).quantize(Decimal("0.01"))

    @property
    def payment_status(self):
        """'not_applied' | 'unpaid' | 'partial' | 'paid' | 'waived'"""
        if not self.invoice_line_id:
            return "not_applied"
        line = self.invoice_line
        invoice = line.invoice
        if invoice.status == Invoice.Status.VOID:
            return "not_applied"
        if invoice.status == Invoice.Status.PAID:
            return "paid"
        if invoice.paid_amount > 0:
            return "partial"
        return "unpaid"


# ============================================================================
# Invoice
# ============================================================================

class InvoiceQuerySet(models.QuerySet):
    def unpaid(self):
        return self.filter(status__in=[
            Invoice.Status.ISSUED, Invoice.Status.PARTIALLY_PAID,
        ])

    def for_student(self, student):
        return self.filter(student=student)

    def for_year(self, year):
        return self.filter(academic_year=year)


class Invoice(models.Model):
    """
    One student's bill for one term. Frozen once issued.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ISSUED = "issued", "Issued"
        PARTIALLY_PAID = "partially_paid", "Partially paid"
        PAID = "paid", "Paid"
        VOID = "void", "Void"

    number = models.CharField(max_length=30, unique=True)
    student = models.ForeignKey(
        Student, on_delete=models.PROTECT, related_name="invoices",
    )

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.PROTECT, related_name="invoices",
    )
    term = models.ForeignKey(
        Term, on_delete=models.PROTECT, related_name="invoices",
    )
    grade_level = models.CharField(
        max_length=30,
        help_text="Snapshot of the student's grade at invoice time.",
    )
    class_room = models.ForeignKey(
        ClassRoom, on_delete=models.PROTECT, null=True, blank=True,
        related_name="invoices",
    )

    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    issued_on = models.DateField()
    due_on = models.DateField()

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ISSUED,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoices_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    voided_at = models.DateTimeField(null=True, blank=True)
    void_reason = models.TextField(blank=True)
    replaced_by = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="replaces",
    )

    objects = InvoiceQuerySet.as_manager()

    class Meta:
        ordering = ["-issued_on", "student__first_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "academic_year", "term"],
                condition=~Q(status="void"),
                name="one_active_invoice_per_student_per_term",
            ),
        ]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["academic_year", "term"]),
        ]

    def __str__(self):
        return f"{self.number} — {self.student} — {self.total}"

    @property
    def balance_due(self):
        return self.total - self.paid_amount

    def recompute_status(self):
        """Set status based on paid_amount vs total. Call after payment changes."""
        if self.status == self.Status.VOID:
            return
        if self.paid_amount <= 0:
            self.status = self.Status.ISSUED
        elif self.paid_amount < self.total:
            self.status = self.Status.PARTIALLY_PAID
        else:
            self.status = self.Status.PAID


class InvoiceLine(models.Model):
    """One line on an invoice. Frozen once the invoice is issued."""

    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="lines",
    )

    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Source: either from the fee structure (standard item) or from a Charge.
    fee_structure_item = models.ForeignKey(
        FeeStructureItem, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoice_lines",
    )
    charge = models.ForeignKey(
        Charge, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invoice_lines",
    )
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.description} — {self.amount}"


# ============================================================================
# Payment
# ============================================================================

class PaymentQuerySet(models.QuerySet):
    def for_student(self, student):
        return self.filter(student=student)

    def mpesa(self):
        return self.filter(method=Payment.Method.MPESA)


class Payment(models.Model):
    """Money received. Belongs to the student, not to a specific invoice."""

    class Method(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        CASH = "cash", "Cash"
        BANK = "bank", "Bank transfer"
        CHEQUE = "cheque", "Cheque"
        CARD = "card", "Card"
        OTHER = "other", "Other"
        REFUND = "refund", "Refund"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        REVERSED = "reversed", "Reversed"

    student = models.ForeignKey(
        Student, on_delete=models.PROTECT, related_name="payments",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=Method.choices)
    reference = models.CharField(
        max_length=100, blank=True,
        help_text="M-Pesa receipt, cheque number, bank slip reference, etc.",
    )
    paid_on = models.DateField()

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SUCCESS,
    )

    notes = models.TextField(blank=True)

    # M-Pesa specific fields
    mpesa_checkout_request_id = models.CharField(
        max_length=100, blank=True, db_index=True,
    )
    mpesa_merchant_request_id = models.CharField(max_length=100, blank=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    mpesa_phone = models.CharField(max_length=20, blank=True)
    mpesa_result_code = models.CharField(max_length=10, blank=True)
    mpesa_result_desc = models.CharField(max_length=200, blank=True)
    mpesa_raw_callback = models.JSONField(null=True, blank=True)

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="payments_recorded",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PaymentQuerySet.as_manager()

    class Meta:
        ordering = ["-paid_on", "-created_at"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["mpesa_checkout_request_id"]),
        ]

    def __str__(self):
        return f"{self.student} — {self.amount} ({self.method})"


class PaymentAllocation(models.Model):
    """
    Which invoice(s) a payment was applied to. One payment can produce
    multiple allocations (oldest-first FIFO across unpaid invoices).
    """

    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name="allocations",
    )
    invoice = models.ForeignKey(
        Invoice, on_delete=models.PROTECT, related_name="allocations",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = [("payment", "invoice")]

    def __str__(self):
        return f"{self.payment} → {self.invoice.number}: {self.amount}"
