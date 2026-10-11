"""All state changes for years, terms and events live here.

Views, admin actions and management commands call these functions instead of
re-implementing the rules.
"""

from django.db import transaction
from django.utils import timezone

from .models import AcademicYear, ApprovalStatus, Term, YearStatus


class PeriodError(Exception):
    """A business-rule violation. Views turn this into a 400."""


# ---- lookups ---------------------------------------------------------------
def get_current_period():
    """Return (academic_year, term). Term may be None between terms."""
    term = Term.objects.get_current()
    if term:
        return term.academic_year, term
    return AcademicYear.objects.get_active(), None


def find_year_for_date(day):
    return AcademicYear.objects.filter(start_date__lte=day, end_date__gte=day).first()


def find_term_for_range(start, end):
    """The term that fully contains [start, end], or None (holiday / break)."""
    return Term.objects.filter(start_date__lte=start, end_date__gte=end).first()


# ---- academic year lifecycle ------------------------------------------------
@transaction.atomic
def activate_year(year):
    if year.status == YearStatus.CLOSED:
        raise PeriodError("A closed academic year cannot be re-activated.")
    other = (
        AcademicYear.objects.select_for_update()
        .filter(status=YearStatus.ACTIVE)
        .exclude(pk=year.pk)
        .first()
    )
    if other:
        raise PeriodError(
            f"Academic year {other.name} is still active. Close it first."
        )
    year.status = YearStatus.ACTIVE
    year.save(update_fields=["status"])
    return year


@transaction.atomic
def close_year(year):
    if year.status != YearStatus.ACTIVE:
        raise PeriodError("Only the active academic year can be closed.")
    year.status = YearStatus.CLOSED
    year.save(update_fields=["status"])
    Term.objects.filter(academic_year=year, is_current=True).update(is_current=False)
    return year


@transaction.atomic
def set_current_term(term):
    if term.academic_year.status != YearStatus.ACTIVE:
        raise PeriodError("Activate the academic year before making its term current.")
    # Unset first: the DB constraint allows only one current term at a time.
    Term.objects.filter(is_current=True).exclude(pk=term.pk).update(is_current=False)
    if not term.is_current:
        term.is_current = True
        term.save(update_fields=["is_current"])
    return term


# ---- calendar approval --------------------------------------------------------
def approve_event(event, reviewer):
    event.approval_status = ApprovalStatus.APPROVED
    event.reviewed_by = reviewer
    event.reviewed_at = timezone.now()
    event.rejection_reason = ""
    event.save(
        update_fields=[
            "approval_status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "updated_at",
        ]
    )
    return event


def reject_event(event, reviewer, reason):
    if not reason.strip():
        raise PeriodError("A rejection reason is required.")
    event.approval_status = ApprovalStatus.REJECTED
    event.reviewed_by = reviewer
    event.reviewed_at = timezone.now()
    event.rejection_reason = reason.strip()
    event.save(
        update_fields=[
            "approval_status",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "updated_at",
        ]
    )
    return event
