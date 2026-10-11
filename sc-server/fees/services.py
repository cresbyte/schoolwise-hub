"""Fees services. Business logic in one place. Views call these."""

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from academics.models import ClassRoom, Enrollment
from core.models import Student
from fees.models import (
    Charge, ChargeAssignment, FeeStructure, Invoice, InvoiceLine,
    Payment, PaymentAllocation,
)
from school.models import AcademicYear, Term


# ============================================================================
# Balance (the single rule)
# ============================================================================

def recompute_student_balance(student):
    """
    Recompute Student.fee_balance = sum(invoice totals − paid) − credits.

    Called after any invoice or payment change. Never called from a view
    directly — always through the services below.
    """
    invoice_totals = (
        Invoice.objects
        .filter(student=student)
        .exclude(status=Invoice.Status.VOID)
        .aggregate(s=Sum("total"))["s"]
        or Decimal("0")
    )
    invoice_paid = (
        Invoice.objects
        .filter(student=student)
        .exclude(status=Invoice.Status.VOID)
        .aggregate(s=Sum("paid_amount"))["s"]
        or Decimal("0")
    )
    # Negative payments (refunds) are stored as negative amounts and
    # reduce the balance further. This is what makes overpayments become
    # credits.
    payments = (
        Payment.objects
        .filter(student=student, status=Payment.Status.SUCCESS)
        .aggregate(s=Sum("amount"))["s"]
        or Decimal("0")
    )
    # Balance = what's owed on invoices minus what's been paid.
    # If payments exceed invoice paid_amounts (overpayment), the balance
    # goes negative.
    balance = (invoice_totals - invoice_paid) - (payments - invoice_paid)
    # Simpler equivalent:
    balance = invoice_totals - payments
    student.fee_balance = balance
    student.save(update_fields=["fee_balance"])
    return balance


# ============================================================================
# Invoice generation
# ============================================================================

@transaction.atomic
def generate_term_invoices(academic_year, term, user=None):
    """
    Create invoices for every actively-enrolled student in a year/term.

    Idempotent: skips students who already have a non-void invoice.
    Returns a summary dict.
    """
    # Find active enrollments for the year
    enrollments = (
        Enrollment.objects
        .filter(academic_year=academic_year, status=Enrollment.Status.ACTIVE)
        .select_related("student", "class_room")
    )

    # Load fee structures keyed by grade name
    structures = {
        fs.grade_level_id: fs
        for fs in FeeStructure.objects
        .filter(academic_year=academic_year, term=term)
        .prefetch_related("items")
    }

    created_count = 0
    skipped_count = 0
    errors = []
    created_invoices = []

    for enrollment in enrollments:
        student = enrollment.student
        grade_name = enrollment.class_room.grade_level_id

        # Skip if they already have a non-void invoice
        if Invoice.objects.filter(
            student=student, academic_year=academic_year, term=term,
        ).exclude(status=Invoice.Status.VOID).exists():
            skipped_count += 1
            continue

        structure = structures.get(grade_name)
        if not structure:
            errors.append(f"No fee structure for {grade_name} — {student}")
            continue

        # Create the invoice
        invoice = Invoice.objects.create(
            number=_generate_invoice_number(academic_year, term, student),
            student=student,
            academic_year=academic_year,
            term=term,
            grade_level=grade_name,
            class_room=enrollment.class_room,
            issued_on=date.today(),
            due_on=term.start_date + timedelta(days=30),
            total=structure.total,
            created_by=user,
        )

        # Add line items from the fee structure
        for item in structure.items.all():
            InvoiceLine.objects.create(
                invoice=invoice,
                description=item.name,
                amount=item.amount,
                fee_structure_item=item,
                due_date=term.start_date + timedelta(days=30),
            )

        # Add any active charges that apply to this student
        _apply_charges_to_invoice(invoice, student, academic_year)

        # Recompute total from all lines (structure + charges)
        _recalculate_invoice_total(invoice)

        # Recompute the student's balance
        recompute_student_balance(student)

        created_count += 1
        created_invoices.append(invoice)

    return {
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors,
        "invoices": created_invoices,
    }


def _generate_invoice_number(academic_year, term, student):
    """Human-readable number, e.g. INV-2026-T1-00042."""
    prefix = f"INV-{academic_year.name}-T{term.number}-"
    # Count existing invoices with this prefix
    last = (
        Invoice.objects
        .filter(number__startswith=prefix)
        .order_by("-number")
        .values_list("number", flat=True)
        .first()
    )
    seq = int(last.split("-")[-1]) + 1 if last else 1
    return f"{prefix}{seq:05d}"


def _recalculate_invoice_total(invoice):
    """Set invoice.total to the sum of its lines and refresh status."""
    total = (
        invoice.lines
        .aggregate(s=Sum("amount"))["s"]
        or Decimal("0")
    )
    invoice.total = total
    invoice.recompute_status()
    invoice.save(update_fields=["total", "status"])


# ============================================================================
# Charges
# ============================================================================

def _apply_charges_to_invoice(invoice, student, academic_year):
    """
    Add every applicable active charge as a line item on the invoice.
    Skips charges the student has already been charged for on another invoice,
    and skips optional charges the student hasn't opted into.
    """
    charges = Charge.objects.filter(
        academic_year=academic_year,
        status=Charge.Status.ACTIVE,
    )

    for charge in charges:
        if not _charge_applies_to(charge, student):
            continue

        # Optional charges: only if opted in
        assignment = ChargeAssignment.objects.filter(
            charge=charge, student=student,
        ).first()
        if charge.is_optional:
            if not assignment or not assignment.opted_in:
                continue

        # Skip if this charge already appears on a line for this student
        if InvoiceLine.objects.filter(
            invoice__student=student,
            charge=charge,
        ).exclude(invoice__status=Invoice.Status.VOID).exists():
            continue

        line = InvoiceLine.objects.create(
            invoice=invoice,
            description=charge.name,
            amount=charge.amount,
            charge=charge,
            due_date=charge.due_date,
        )

        if assignment:
            assignment.invoice_line = line
            assignment.applied_at = timezone.now()
            assignment.save(update_fields=["invoice_line", "applied_at"])


def _charge_applies_to(charge, student):
    """True if this charge's scope includes the student."""
    if charge.scope == Charge.Scope.SCHOOL:
        return True
    if charge.scope == Charge.Scope.GRADE:
        return charge.grade_levels.filter(name=student.grade_level).exists()
    if charge.scope == Charge.Scope.CLASS:
        return (
            student.class_room_id is not None
            and charge.classes.filter(pk=student.class_room_id).exists()
        )
    if charge.scope == Charge.Scope.STUDENTS:
        return ChargeAssignment.objects.filter(
            charge=charge, student=student,
        ).exists()
    return False


@transaction.atomic
def apply_charge_to_students(charge, user=None):
    """
    Create the ChargeAssignment rows for every affected student, and add
    the charge as a line item to each student's active invoice for the term.
    Idempotent.
    """
    if charge.status != Charge.Status.ACTIVE:
        raise ValueError("Charge must be active to apply.")

    students = _resolve_charge_students(charge)
    applied = 0

    for student in students:
        assignment, created = ChargeAssignment.objects.get_or_create(
            charge=charge, student=student,
            defaults={"opted_in": not charge.is_optional},
        )

        if charge.is_optional and not assignment.opted_in:
            continue

        # Find the student's active invoice for this year + term
        invoice = (
            Invoice.objects
            .filter(
                student=student,
                academic_year=charge.academic_year,
                term=charge.term,
            )
            .exclude(status=Invoice.Status.VOID)
            .first()
        )
        if not invoice:
            continue

        if InvoiceLine.objects.filter(invoice=invoice, charge=charge).exists():
            continue

        line = InvoiceLine.objects.create(
            invoice=invoice,
            description=charge.name,
            amount=charge.amount,
            charge=charge,
            due_date=charge.due_date,
        )
        assignment.invoice_line = line
        assignment.applied_at = timezone.now()
        assignment.save(update_fields=["invoice_line", "applied_at"])

        _recalculate_invoice_total(invoice)
        recompute_student_balance(student)
        applied += 1

    return {"applied": applied, "students": students.count()}


def _resolve_charge_students(charge):
    """Return the queryset of students this charge applies to."""
    active = Student.objects.filter(status="active")
    if charge.scope == Charge.Scope.SCHOOL:
        return active
    if charge.scope == Charge.Scope.GRADE:
        names = charge.grade_levels.values_list("name", flat=True)
        return active.filter(grade_level__in=list(names))
    if charge.scope == Charge.Scope.CLASS:
        ids = charge.classes.values_list("id", flat=True)
        return active.filter(class_room_id__in=list(ids))
    if charge.scope == Charge.Scope.STUDENTS:
        ids = ChargeAssignment.objects.filter(charge=charge).values_list("student_id", flat=True)
        return active.filter(id__in=list(ids))
    return active.none()


@transaction.atomic
def cancel_charge(charge, user=None, reason=""):
    """
    Cancel an active charge. Students who paid for it get a credit.
    """
    if charge.status not in (Charge.Status.ACTIVE, Charge.Status.DRAFT):
        raise ValueError("Only active or draft charges can be cancelled.")

    if charge.status == Charge.Status.DRAFT:
        # Never applied — just mark cancelled
        charge.status = Charge.Status.CANCELLED
        charge.save(update_fields=["status"])
        return {"credited": 0}

    credited = 0
    for assignment in charge.assignments.select_related("student").all():
        if assignment.invoice_line:
            # Add a credit to the student's account
            Payment.objects.create(
                student=assignment.student,
                amount=-assignment.invoice_line.amount,
                method=Payment.Method.REFUND,
                reference=f"CANCELLED-{charge.id}",
                paid_on=date.today(),
                notes=f"Credit for cancelled charge: {charge.name}. {reason}",
                status=Payment.Status.SUCCESS,
            )
            recompute_student_balance(assignment.student)
            credited += 1

    charge.status = Charge.Status.CANCELLED
    charge.save(update_fields=["status"])
    return {"credited": credited}


# ============================================================================
# Payments
# ============================================================================

@transaction.atomic
def record_payment(
    student,
    amount,
    method,
    reference="",
    paid_on=None,
    notes="",
    user=None,
    mpesa_fields=None,
):
    """
    Record a payment and allocate it to unpaid invoices (oldest first).

    amount: Decimal. Can be negative for a refund.
    """
    if amount == 0:
        raise ValueError("Amount cannot be zero.")

    payment = Payment.objects.create(
        student=student,
        amount=amount,
        method=method,
        reference=reference,
        paid_on=paid_on or date.today(),
        notes=notes,
        status=Payment.Status.SUCCESS,
        recorded_by=user,
        **(mpesa_fields or {}),
    )

    if amount > 0:
        _allocate_payment(payment)

    recompute_student_balance(student)
    return payment


def _allocate_payment(payment):
    """
    Apply the payment to unpaid invoices, oldest first (FIFO).
    Sets each invoice's paid_amount and status accordingly.
    """
    remaining = payment.amount
    invoices = (
        Invoice.objects
        .filter(student=payment.student)
        .exclude(status__in=[Invoice.Status.VOID, Invoice.Status.PAID])
        .order_by("due_on", "issued_on")
    )

    for invoice in invoices:
        due = invoice.total - invoice.paid_amount
        if due <= 0:
            continue
        applied = min(remaining, due)
        PaymentAllocation.objects.create(
            payment=payment, invoice=invoice, amount=applied,
        )
        invoice.paid_amount += applied
        invoice.recompute_status()
        invoice.save(update_fields=["paid_amount", "status"])
        remaining -= applied
        if remaining <= 0:
            break

    # Anything left over stays as a credit — no allocation row needed.


# ============================================================================
# Outstanding reports
# ============================================================================

def students_with_balance(academic_year=None, class_room=None, min_amount=Decimal("0.01")):
    """Return students who owe money, with their balance and aging info."""
    qs = Student.objects.filter(status="active", fee_balance__gte=min_amount)
    if academic_year:
        enrolled_ids = Enrollment.objects.filter(
            academic_year=academic_year, status=Enrollment.Status.ACTIVE,
        ).values_list("student_id", flat=True)
        qs = qs.filter(id__in=list(enrolled_ids))
    if class_room:
        qs = qs.filter(class_room=class_room)

    today = date.today()
    result = []
    for student in qs.select_related("class_room"):
        oldest_unpaid = (
            Invoice.objects
            .filter(student=student)
            .exclude(status__in=[Invoice.Status.VOID, Invoice.Status.PAID])
            .order_by("due_on")
            .first()
        )
        days_overdue = 0
        if oldest_unpaid and oldest_unpaid.due_on < today:
            days_overdue = (today - oldest_unpaid.due_on).days
        result.append({
            "student": student,
            "balance": student.fee_balance,
            "days_overdue": days_overdue,
        })
    return result


def collection_summary(academic_year, term=None):
    """Aggregate stats for the dashboard."""
    invoices = Invoice.objects.filter(academic_year=academic_year)
    if term:
        invoices = invoices.filter(term=term)
    invoices = invoices.exclude(status=Invoice.Status.VOID)

    totals = invoices.aggregate(
        invoiced=Sum("total"),
        paid=Sum("paid_amount"),
    )
    invoiced = totals["invoiced"] or Decimal("0")
    paid = totals["paid"] or Decimal("0")

    return {
        "totalInvoiced": invoiced,
        "totalCollected": paid,
        "outstanding": invoiced - paid,
        "collectionRate": (
            float(paid / invoiced) if invoiced else 0.0
        ),
        "invoiceCount": invoices.count(),
    }


def student_fee_summary(student):
    """
    Return a summary of a student's fee position:

      {
        "studentId": "std-abc",
        "studentName": "Jane Mwangi",
        "balance": Decimal,            # positive = owes, negative = credit
        "totalInvoiced": Decimal,      # sum of all non-void invoices
        "totalPaid": Decimal,          # sum of successful payments
        "unpaidInvoiceCount": int,
        "oldestUnpaidDueDate": date | None,
        "daysOverdue": int,            # 0 if nothing overdue
        "lastPayment": {
            "amount": Decimal,
            "method": "mpesa",
            "methodLabel": "M-Pesa",
            "reference": "...",
            "paidOn": date,
            "receiptNumber": "...",
        } | None,
        "currentInvoice": {
            "id": ...,
            "number": "INV-...",
            "termLabel": "Term 1, 2026",
            "total": Decimal,
            "paidAmount": Decimal,
            "balanceDue": Decimal,
            "dueOn": date,
            "status": "issued" | "partially_paid" | "paid",
        } | None,
      }
    """
    invoices = (
        Invoice.objects
        .filter(student=student)
        .exclude(status=Invoice.Status.VOID)
        .order_by("-issued_on")
    )
    paid_invoices = invoices.exclude(status=Invoice.Status.PAID)
    total_invoiced = invoices.aggregate(s=Sum("total"))["s"] or Decimal("0")
    total_paid = invoices.aggregate(s=Sum("paid_amount"))["s"] or Decimal("0")

    oldest_unpaid = paid_invoices.order_by("due_on").first()
    today = date.today()
    days_overdue = 0
    if oldest_unpaid and oldest_unpaid.due_on < today:
        days_overdue = (today - oldest_unpaid.due_on).days

    last_payment = (
        Payment.objects
        .filter(student=student, status=Payment.Status.SUCCESS)
        .order_by("-paid_on", "-created_at")
        .first()
    )

    # The most recent non-void, non-paid invoice (current outstanding)
    current = invoices.exclude(status=Invoice.Status.PAID).first()

    return {
        "studentId": student.id,
        "studentName": f"{student.first_name} {student.last_name}".strip(),
        "balance": student.fee_balance,
        "totalInvoiced": total_invoiced,
        "totalPaid": total_paid,
        "unpaidInvoiceCount": paid_invoices.count(),
        "oldestUnpaidDueDate": oldest_unpaid.due_on if oldest_unpaid else None,
        "daysOverdue": days_overdue,
        "lastPayment": (
            {
                "amount": last_payment.amount,
                "method": last_payment.method,
                "methodLabel": last_payment.get_method_display(),
                "reference": last_payment.reference,
                "paidOn": last_payment.paid_on,
                "receiptNumber": last_payment.mpesa_receipt_number,
            }
            if last_payment else None
        ),
        "currentInvoice": (
            {
                "id": current.id,
                "number": current.number,
                "termLabel": current.term.label,
                "total": current.total,
                "paidAmount": current.paid_amount,
                "balanceDue": current.balance_due,
                "dueOn": current.due_on,
                "status": current.status,
            }
            if current else None
        ),
    }


def student_statement(student):
    """
    Return a chronological ledger of invoices and payments for one student.

      [
        {
          "type": "invoice" | "payment",
          "date": date,
          "description": "Term 1, 2026 fees" | "M-Pesa payment",
          "debit": Decimal | None,      # invoices only
          "credit": Decimal | None,     # payments only
          "balance": Decimal,           # running balance after this entry
          "reference": "INV-..." | "M-Pesa QK3X7Y2P",
          "details": {...},             # invoice lines or payment fields
        },
        ...
      ]
    """
    entries = []

    invoices = (
        Invoice.objects
        .filter(student=student)
        .exclude(status=Invoice.Status.VOID)
        .prefetch_related("lines")
        .order_by("issued_on")
    )
    for invoice in invoices:
        entries.append({
            "type": "invoice",
            "date": invoice.issued_on,
            "description": f"{invoice.term.label} fees",
            "debit": invoice.total,
            "credit": None,
            "reference": invoice.number,
            "details": {
                "invoiceId": invoice.id,
                "status": invoice.status,
                "dueOn": invoice.due_on,
                "lines": [
                    {"description": line.description, "amount": line.amount}
                    for line in invoice.lines.all()
                ],
            },
        })

    payments = (
        Payment.objects
        .filter(student=student, status=Payment.Status.SUCCESS)
        .order_by("paid_on", "created_at")
    )
    for payment in payments:
        desc = (
            f"{payment.get_method_display()} payment"
            if payment.amount >= 0
            else f"{payment.get_method_display()} refund"
        )
        entries.append({
            "type": "payment",
            "date": payment.paid_on,
            "description": desc,
            "debit": None,
            "credit": payment.amount,
            "reference": payment.mpesa_receipt_number or payment.reference or "",
            "details": {
                "paymentId": payment.id,
                "method": payment.method,
                "methodLabel": payment.get_method_display(),
                "notes": payment.notes,
            },
        })

    # Sort chronologically, then compute running balance
    entries.sort(key=lambda e: (e["date"], e["type"] == "invoice"))
    running = Decimal("0")
    for entry in entries:
        running += (entry["debit"] or Decimal("0"))
        running -= (entry["credit"] or Decimal("0"))
        entry["balance"] = running

    return entries


@transaction.atomic
def update_active_charge(charge, user=None):
    """
    Called after a charge's fields are edited and it's already active.
    Syncs the affected students, invoice lines, and credits for removed students.

    Handles four cases:
      - New student now matches scope: add a line item.
      - Student no longer matches scope: remove their line item and credit them.
      - Amount changed: update existing line items.
      - Name changed: update existing line item descriptions.
    """
    if charge.status != Charge.Status.ACTIVE:
        return {"added": 0, "removed": 0, "updated": 0}

    # Current applicable students
    applicable = set(
        services._resolve_charge_students(charge).values_list("id", flat=True)
    )
    # Existing assignments
    existing = {
        a.student_id: a
        for a in charge.assignments.select_related("student", "invoice_line")
    }

    added = updated = removed = 0

    # 1. Update existing assignments whose charge is still applicable
    for student_id, assignment in existing.items():
        if student_id not in applicable:
            continue
        if not assignment.invoice_line_id:
            continue

        line = assignment.invoice_line
        changed = False
        if line.amount != charge.amount:
            line.amount = charge.amount
            changed = True
        if line.description != charge.name:
            line.description = charge.name
            changed = True
        if line.due_date != charge.due_date:
            line.due_date = charge.due_date
            changed = True

        if changed:
            line.save(update_fields=["amount", "description", "due_date"])
            _recalculate_invoice_total(line.invoice)
            services.recompute_student_balance(line.invoice.student)
            updated += 1

    # 2. Add new students who now match
    new_student_ids = applicable - set(existing.keys())
    for student_id in new_student_ids:
        student = Student.objects.get(pk=student_id)
        invoice = (
            Invoice.objects
            .filter(
                student=student,
                academic_year=charge.academic_year,
                term=charge.term,
            )
            .exclude(status=Invoice.Status.VOID)
            .first()
        )
        if not invoice:
            continue
        line = InvoiceLine.objects.create(
            invoice=invoice,
            description=charge.name,
            amount=charge.amount,
            charge=charge,
            due_date=charge.due_date,
        )
        ChargeAssignment.objects.update_or_create(
            charge=charge, student=student,
            defaults={"opted_in": True, "invoice_line": line,
                      "applied_at": timezone.now()},
        )
        _recalculate_invoice_total(invoice)
        services.recompute_student_balance(student)
        added += 1

    # 3. Remove students who no longer match
    for student_id, assignment in existing.items():
        if student_id in applicable:
            continue

        # Credit the student if the line was on an invoice
        if assignment.invoice_line_id:
            line = assignment.invoice_line
            invoice = line.invoice

            # If the invoice is unpaid, just delete the line
            if invoice.paid_amount == 0:
                line.delete()
            else:
                # If it's been paid, add a credit so the balance drops
                Payment.objects.create(
                    student=assignment.student,
                    amount=-line.amount,
                    method=Payment.Method.REFUND,
                    reference=f"REMOVED-CHARGE-{charge.id}",
                    paid_on=date.today(),
                    notes=f"Credit for removed charge: {charge.name}",
                    status=Payment.Status.SUCCESS,
                )
                line.delete()

            _recalculate_invoice_total(invoice)
            services.recompute_student_balance(assignment.student)

        assignment.delete()
        removed += 1

    return {"added": added, "removed": removed, "updated": updated}



# ============================================================================
# Charge roster & opt-out
# ============================================================================

def charge_roster(charge):
    """
    Return every student assigned to this charge, with their opt-in state
    and payment state.

    Returns a dict:
      {
        "charge": <Charge>,
        "summary": {
            "total": int,          # students in scope
            "optedIn": int,
            "optedOut": int,
            "applied": int,        # has an invoice line
            "paid": int,
            "partial": int,
            "unpaid": int,
            "notApplied": int,
            "totalValue": Decimal, # amount * applied
            "totalCollected": Decimal,
        },
        "students": [ { ...per-student dict... }, ... ],
      }
    """
    assignments = (
        charge.assignments
        .select_related("student", "student__class_room", "invoice_line",
                        "invoice_line__invoice")
        .order_by("student__first_name", "student__last_name")
    )

    rows = []
    summary = {
        "total": 0, "optedIn": 0, "optedOut": 0, "applied": 0,
        "paid": 0, "partial": 0, "unpaid": 0, "notApplied": 0,
        "totalValue": Decimal("0"), "totalCollected": Decimal("0"),
    }

    for a in assignments:
        summary["total"] += 1
        if a.opted_in:
            summary["optedIn"] += 1
        else:
            summary["optedOut"] += 1

        status = a.payment_status
        paid = a.paid_amount
        owed = a.invoice_line.amount if a.invoice_line else charge.amount

        if a.applied_at:
            summary["applied"] += 1
            summary["totalValue"] += owed
            summary["totalCollected"] += paid

        if status == "paid":
            summary["paid"] += 1
        elif status == "partial":
            summary["partial"] += 1
        elif status == "unpaid":
            summary["unpaid"] += 1
        else:
            summary["notApplied"] += 1

        rows.append({
            "studentId": a.student_id,
            "studentName": f"{a.student.first_name} {a.student.last_name}".strip(),
            "admissionNumber": a.student.admission_number,
            "className": a.student.class_room.name if a.student.class_room else "",
            "optedIn": a.opted_in,
            "optedInAt": a.opted_in_at,
            "appliedAt": a.applied_at,
            "invoiceLineId": a.invoice_line_id,
            "invoiceId": a.invoice_line.invoice_id if a.invoice_line else None,
            "amountOwed": owed,
            "amountPaid": paid,
            "paymentStatus": status,
        })

    return {"charge": charge, "summary": summary, "students": rows}


@transaction.atomic
def opt_out_charge(charge, student, user=None):
    """
    Parent says no to an optional charge (or staff removes a student).

    Removes the invoice line if it hasn't been paid. If it has been paid,
    issues a credit (negative Payment) so the balance drops — same pattern
    as cancel_charge and update_active_charge's "removed" branch.
    """
    if not charge.is_optional:
        raise ValueError("Only optional charges can be opted out of.")
    if charge.status != Charge.Status.ACTIVE:
        raise ValueError("Only active charges can be opted out of.")

    assignment = ChargeAssignment.objects.filter(
        charge=charge, student=student,
    ).first()
    if not assignment:
        raise ValueError("Student is not assigned to this charge.")

    assignment.opted_in = False
    assignment.opted_in_at = timezone.now()

    if assignment.invoice_line_id:
        line = assignment.invoice_line
        invoice = line.invoice

        if invoice.paid_amount == 0:
            # Nothing paid yet — just remove the line
            line.delete()
        else:
            # Already (partially) paid — credit the student
            Payment.objects.create(
                student=student,
                amount=-line.amount,
                method=Payment.Method.REFUND,
                reference=f"OPTOUT-{charge.id}",
                paid_on=date.today(),
                notes=f"Credit for opted-out charge: {charge.name}",
                status=Payment.Status.SUCCESS,
            )
            line.delete()

        _recalculate_invoice_total(invoice)
        recompute_student_balance(student)

    assignment.invoice_line = None
    assignment.applied_at = None
    assignment.save(update_fields=["opted_in", "opted_in_at",
                                    "invoice_line", "applied_at"])
    return assignment
