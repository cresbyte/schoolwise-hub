"""Year-end promotion services.

Business rules live here. Views call these. Nothing else should write
Promotion/PromotionBatch/Enrollment rows for promotion purposes.
"""

from collections import Counter
from dataclasses import dataclass

from django.db import transaction
from django.utils import timezone

from academics.models import (
    ClassRoom,
    Enrollment,
    Promotion,
    PromotionBatch,
    PromotionStreamMapping,
    BellSchedule,
)


# ============================================================================
# Guards
# ============================================================================

def _assert_year_transition(from_year, to_year):
    if from_year.pk == to_year.pk:
        raise ValueError("Source and target years must be different.")
    if to_year.start_date <= from_year.start_date:
        raise ValueError("Target year must start after the source year.")
    if from_year.status != "active":
        raise ValueError(
            f"Cannot promote from {from_year.name}: it is not the active year."
        )
    if to_year.status != "draft":
        raise ValueError(
            f"Cannot promote into {to_year.name}: it must be a draft year."
        )


# ============================================================================
# Stream mapping
# ============================================================================

@dataclass
class StreamMappingSuggestion:
    from_stream: str
    from_student_count: int
    to_stream: str | None
    to_class_id: str | None


def suggest_stream_mapping(from_year, to_year, from_grade_name):
    """
    Compute a default stream mapping for one grade.

    Rules:
      1. Name match (A → A) wins.
      2. Remaining source streams are matched to remaining target streams in
         alphabetical order.
      3. Any source stream left over is unmapped.

    Returns a list of StreamMappingSuggestion.
    """
    from school.models import GradeLevel

    try:
        from_grade = GradeLevel.objects.get(name=from_grade_name)
    except GradeLevel.DoesNotExist:
        return []

    to_grade = from_grade.next_grade
    if not to_grade:
        return []

    source_streams = list(
        ClassRoom.objects
        .filter(academic_year=from_year, grade_level=from_grade)
        .values_list("stream", flat=True)
        .distinct()
        .order_by("stream")
    )
    target_classes = list(
        ClassRoom.objects
        .filter(academic_year=to_year, grade_level=to_grade)
        .order_by("stream")
    )
    target_by_stream = {c.stream: c for c in target_classes}
    target_streams = list(target_by_stream.keys())

    mapping = {}
    used = set()

    # 1. Name-matched pairs
    for src in source_streams:
        if src in target_by_stream:
            mapping[src] = src
            used.add(src)

    # 2. Fill the rest, alphabetically
    remaining = [s for s in target_streams if s not in used]
    for src in source_streams:
        if src in mapping:
            continue
        if remaining:
            tgt = remaining.pop(0)
            mapping[src] = tgt
        else:
            mapping[src] = None

    # 3. Attach counts
    suggestions = []
    for src in source_streams:
        count = Enrollment.objects.filter(
            academic_year=from_year,
            status=Enrollment.Status.ACTIVE,
            class_room__grade_level=from_grade,
            class_room__stream=src,
        ).count()
        tgt = mapping.get(src)
        tgt_class = target_by_stream.get(tgt) if tgt else None
        suggestions.append(StreamMappingSuggestion(
            from_stream=src,
            from_student_count=count,
            to_stream=tgt,
            to_class_id=tgt_class.id if tgt_class else None,
        ))
    return suggestions


# ============================================================================
# Batch creation (preview)
# ============================================================================

def create_promotion_batch(
    from_year,
    to_year,
    from_grade_name,
    stream_mapping,
    user,
):
    """
    Create a PromotionBatch in PREVIEWED status with one Promotion row per
    student currently enrolled in `from_grade_name` in `from_year`.

    Does NOT modify any enrollment or student.

    stream_mapping: dict { from_stream: to_stream | None }.
                    A source stream mapped to None produces skipped rows.
    """
    _assert_year_transition(from_year, to_year)

    from school.models import GradeLevel

    try:
        from_grade = GradeLevel.objects.get(name=from_grade_name)
    except GradeLevel.DoesNotExist:
        raise ValueError(f"Grade '{from_grade_name}' not found.")

    to_grade = from_grade.next_grade
    if to_grade is None and not from_grade.is_final:
        raise ValueError(
            f"Grade '{from_grade.name}' has no next grade and is not final."
        )

    # Reject if another active batch exists for this transition+grade
    existing = PromotionBatch.objects.filter(
        from_year=from_year,
        to_year=to_year,
        from_grade=from_grade.name,
        status__in=[
            PromotionBatch.Status.PREVIEWED,
            PromotionBatch.Status.EXECUTED,
        ],
    ).first()
    if existing:
        raise ValueError(
            f"An active batch already exists for {from_grade.name} → "
            f"{to_year.name}. Undo it first."
        )

    # Target classes by stream, for lookups
    target_by_stream = {}
    if to_grade is not None:
        target_by_stream = {
            c.stream: c
            for c in ClassRoom.objects.filter(
                academic_year=to_year, grade_level=to_grade
            )
        }

    with transaction.atomic():
        batch = PromotionBatch.objects.create(
            from_year=from_year,
            to_year=to_year,
            from_grade=from_grade.name,
            to_grade=to_grade.name if to_grade else "",
            created_by=user,
        )

        # Persist the stream mappings on the batch
        streams = list(
            ClassRoom.objects
            .filter(academic_year=from_year, grade_level=from_grade)
            .values_list("stream", flat=True)
            .distinct()
            .order_by("stream")
        )

        for src in streams:
            src_class = (
                ClassRoom.objects
                .filter(academic_year=from_year, grade_level=from_grade, stream=src)
                .first()
            )
            count = Enrollment.objects.filter(
                academic_year=from_year,
                status=Enrollment.Status.ACTIVE,
                class_room__grade_level=from_grade,
                class_room__stream=src,
            ).count()
            tgt_stream = stream_mapping.get(src)
            tgt_class = target_by_stream.get(tgt_stream) if tgt_stream else None

            PromotionStreamMapping.objects.create(
                batch=batch,
                from_stream=src,
                from_class=src_class,
                from_student_count=count,
                to_stream=tgt_stream or "",
                to_class=tgt_class,
            )

        # Build the student rows
        enrollments = (
            Enrollment.objects
            .filter(
                academic_year=from_year,
                status=Enrollment.Status.ACTIVE,
                class_room__grade_level=from_grade,
            )
            .select_related("student", "class_room")
            .order_by("class_room__stream", "student__first_name")
        )

        rows = []
        for e in enrollments:
            student = e.student
            src_class = e.class_room
            src_stream = src_class.stream

            # Graduation takes priority — no target needed
            if from_grade.is_final:
                outcome = Promotion.Outcome.GRADUATED
                to_class_name = ""
                to_class_ref = None
                to_grade_name = ""
                reason = ""
            else:
                tgt_stream = stream_mapping.get(src_stream)
                tgt_class = target_by_stream.get(tgt_stream) if tgt_stream else None

                if tgt_stream is None:
                    outcome = Promotion.Outcome.SKIPPED
                    to_class_name = ""
                    to_class_ref = None
                    to_grade_name = ""
                    reason = f"No target stream mapped for source stream '{src_stream}'."
                elif tgt_class is None:
                    outcome = Promotion.Outcome.SKIPPED
                    to_class_name = ""
                    to_class_ref = None
                    to_grade_name = ""
                    reason = (
                        f"Target stream '{tgt_stream}' has no class in "
                        f"{to_year.name} for grade {to_grade.name}."
                    )
                else:
                    outcome = Promotion.Outcome.PROMOTED
                    to_class_name = tgt_class.name
                    to_class_ref = tgt_class
                    to_grade_name = to_grade.name
                    reason = ""

            rows.append(Promotion(
                batch=batch,
                student=student,
                from_class=src_class.name,
                from_grade=from_grade.name,
                to_class=to_class_name,
                to_class_ref=to_class_ref,
                to_grade=to_grade_name,
                outcome=outcome,
                reason=reason,
            ))

        Promotion.objects.bulk_create(rows)

        counts = Counter(r.outcome for r in rows)
        batch.student_count = len(rows)
        batch.promoted_count = counts.get("promoted", 0)
        batch.repeated_count = counts.get("repeated", 0)
        batch.graduated_count = counts.get("graduated", 0)
        batch.skipped_count = counts.get("skipped", 0)
        batch.save(update_fields=[
            "student_count", "promoted_count", "repeated_count",
            "graduated_count", "skipped_count",
        ])

    return batch


# ============================================================================
# Per-student overrides
# ============================================================================

def update_promotion_row(
    row_id,
    *,
    outcome=None,
    to_class_id=None,
):
    """
    Change the outcome or target class for a single student in a batch.
    Only allowed before execution.
    """
    row = Promotion.objects.select_related(
        "batch", "student", "to_class_ref"
    ).get(pk=row_id)

    if row.batch.status != PromotionBatch.Status.PREVIEWED:
        raise ValueError("Cannot edit rows in a batch that has been executed.")

    if outcome is not None:
        if outcome not in Promotion.Outcome.values:
            raise ValueError(f"Invalid outcome: {outcome}")
        row.outcome = outcome

    if to_class_id is not None:
        target = ClassRoom.objects.filter(pk=to_class_id).first()
        if target is None:
            raise ValueError(f"Class '{to_class_id}' not found.")
        row.to_class_ref = target
        row.to_class = target.name
        row.to_grade = target.grade_level_id

    # Keep the summary counters in sync
    row.save()
    _refresh_batch_counts(row.batch)
    return row


def _refresh_batch_counts(batch):
    counts = Counter(
        Promotion.objects.filter(batch=batch).values_list("outcome", flat=True)
    )
    batch.student_count = sum(counts.values())
    batch.promoted_count = counts.get("promoted", 0)
    batch.repeated_count = counts.get("repeated", 0)
    batch.graduated_count = counts.get("graduated", 0)
    batch.skipped_count = counts.get("skipped", 0)
    batch.save(update_fields=[
        "student_count", "promoted_count", "repeated_count",
        "graduated_count", "skipped_count",
    ])


# ============================================================================
# Execute
# ============================================================================

@transaction.atomic
def execute_promotion_batch(batch_id, user):
    """
    Apply a PREVIEWED batch. Idempotent: if already executed, returns as-is.
    """
    batch = PromotionBatch.objects.select_for_update().get(pk=batch_id)

    if batch.status == PromotionBatch.Status.EXECUTED:
        return batch
    if batch.status == PromotionBatch.Status.UNDONE:
        raise ValueError("Cannot execute an undone batch. Create a new one.")

    # Re-check guards — the years may have changed since preview
    _assert_year_transition(batch.from_year, batch.to_year)

    today = timezone.now().date()

    rows = (
        Promotion.objects
        .filter(batch=batch)
        .select_related("student", "to_class_ref")
    )

    for row in rows:
        student = row.student

        # If the student is already enrolled in the target year, skip them.
        already = Enrollment.objects.filter(
            student=student,
            academic_year=batch.to_year,
            status=Enrollment.Status.ACTIVE,
        ).exists()
        if already and row.outcome not in (
            Promotion.Outcome.SKIPPED,
            Promotion.Outcome.GRADUATED,
        ):
            row.reason = "Already enrolled in target year — skipped at execute."
            row.outcome = Promotion.Outcome.SKIPPED
            row.applied_at = timezone.now()
            row.save(update_fields=["reason", "outcome", "applied_at"])
            continue

        src_enrollment = Enrollment.objects.filter(
            student=student,
            academic_year=batch.from_year,
            status=Enrollment.Status.ACTIVE,
        ).first()
        row.from_enrollment = src_enrollment

        if row.outcome == Promotion.Outcome.SKIPPED:
            row.applied_at = timezone.now()
            row.save(update_fields=["from_enrollment", "applied_at"])
            continue

        if row.outcome == Promotion.Outcome.GRADUATED:
            if src_enrollment:
                src_enrollment.status = Enrollment.Status.GRADUATED
                src_enrollment.left_on = today
                src_enrollment.save(update_fields=["status", "left_on"])
            student.status = "graduated"
            student.class_room = None
            student.save(update_fields=["status", "class_room"])
            row.applied_at = timezone.now()
            row.save(update_fields=["from_enrollment", "applied_at"])
            continue

        # promoted or repeated
        if src_enrollment:
            src_enrollment.status = Enrollment.Status.PROMOTED
            src_enrollment.left_on = today
            src_enrollment.save(update_fields=["status", "left_on"])

        if row.to_class_ref is None:
            # Defensive: skip rather than crash
            row.outcome = Promotion.Outcome.SKIPPED
            row.reason = "No target class set."
            row.applied_at = timezone.now()
            row.save(update_fields=["outcome", "reason", "applied_at"])
            continue

        new_enrollment = Enrollment.objects.create(
            student=student,
            class_room=row.to_class_ref,
            academic_year=batch.to_year,
            enrolled_on=batch.to_year.start_date,
            status=Enrollment.Status.ACTIVE,
        )
        student.class_room = row.to_class_ref
        student.grade_level = row.to_class_ref.grade_level_id
        student.status = "active"
        student.save(update_fields=["class_room", "grade_level", "status"])

        row.to_enrollment = new_enrollment
        row.applied_at = timezone.now()
        row.save(update_fields=["from_enrollment", "to_enrollment", "applied_at"])

    batch.status = PromotionBatch.Status.EXECUTED
    batch.executed_at = timezone.now()
    batch.executed_by = user
    batch.save(update_fields=["status", "executed_at", "executed_by"])
    _refresh_batch_counts(batch)
    return batch


# ============================================================================
# Undo
# ============================================================================

@transaction.atomic
def undo_promotion_batch(batch_id, user, window_hours=24):
    """
    Reverse an EXECUTED batch.

    Allowed only:
      - while the source year is still active (not yet closed), and
      - within `window_hours` of execution.
    """
    batch = PromotionBatch.objects.select_for_update().get(pk=batch_id)

    if batch.status != PromotionBatch.Status.EXECUTED:
        raise ValueError("Only executed batches can be undone.")

    if batch.from_year.status != "active":
        raise ValueError(
            "Cannot undo: the source year has been closed. "
            "This requires a manual correction."
        )

    if batch.executed_at:
        elapsed = timezone.now() - batch.executed_at
        if elapsed.total_seconds() > window_hours * 3600:
            raise ValueError(
                f"Cannot undo: more than {window_hours} hours have passed."
            )

    rows = (
        Promotion.objects
        .filter(batch=batch)
        .select_related("student", "from_enrollment", "to_enrollment")
    )

    for row in rows:
        if row.applied_at is None:
            continue

        # Restore the source enrollment
        if row.from_enrollment:
            row.from_enrollment.status = Enrollment.Status.ACTIVE
            row.from_enrollment.left_on = None
            row.from_enrollment.save(update_fields=["status", "left_on"])

        # Delete the target enrollment created by this promotion
        if row.to_enrollment:
            row.to_enrollment.delete()

        # Restore the student cache
        student = row.student
        if row.from_enrollment:
            student.class_room = row.from_enrollment.class_room
            student.grade_level = row.from_enrollment.class_room.grade_level_id
            student.status = "active"
        else:
            # Graduated with no source: revert to active, no class
            student.status = "active"
            student.class_room = None
        student.save(update_fields=["class_room", "grade_level", "status"])

        row.applied_at = None
        row.to_enrollment = None
        row.save(update_fields=["applied_at", "to_enrollment"])

    batch.status = PromotionBatch.Status.UNDONE
    batch.undone_at = timezone.now()
    batch.undone_by = user
    batch.save(update_fields=["status", "undone_at", "undone_by"])
    return batch



"""Timetable rules: which school day a class follows.

Views call these. The bell schedule is chosen by the class's grade level;
if the grade isn't mapped, the schedule flagged `is_default` is used; if
there is none, DEFAULT_BELL keeps the timetable working.
"""

# Same day the frontend and generate() used before bell schedules existed.
DEFAULT_BELL = [
    {"period_number": 1, "start_time": "08:00", "end_time": "08:40", "is_break": False, "break_name": None},
    {"period_number": 2, "start_time": "08:40", "end_time": "09:20", "is_break": False, "break_name": None},
    {"period_number": 3, "start_time": "09:20", "end_time": "10:00", "is_break": False, "break_name": None},
    {"period_number": 4, "start_time": "10:00", "end_time": "10:30", "is_break": True, "break_name": "Tea Break"},
    {"period_number": 5, "start_time": "10:30", "end_time": "11:10", "is_break": False, "break_name": None},
    {"period_number": 6, "start_time": "11:10", "end_time": "11:50", "is_break": False, "break_name": None},
    {"period_number": 7, "start_time": "11:50", "end_time": "12:30", "is_break": False, "break_name": None},
    {"period_number": 8, "start_time": "12:30", "end_time": "13:30", "is_break": True, "break_name": "Lunch Break"},
    {"period_number": 9, "start_time": "13:30", "end_time": "14:10", "is_break": False, "break_name": None},
    {"period_number": 10, "start_time": "14:10", "end_time": "14:50", "is_break": False, "break_name": None},
]


def _periods_of(schedule):
    return [
        {
            "period_number": p.period_number,
            "start_time": p.start_time.strftime("%H:%M"),
            "end_time": p.end_time.strftime("%H:%M"),
            "is_break": p.is_break,
            "break_name": p.break_name,
        }
        for p in schedule.periods.all()
    ]


def configured_bell_for_class(class_room):
    """The class's configured bell, or [] if none applies."""
    from .models import BellSchedule

    qs = BellSchedule.objects.prefetch_related("periods")
    schedule = (
        qs.filter(grade_levels__name=class_room.grade_level_id).first()
        or qs.filter(is_default=True).first()
    )
    return _periods_of(schedule) if schedule else []


def bell_for_class(class_room):
    """The bell to actually use: configured, else the built-in default."""
    return configured_bell_for_class(class_room) or DEFAULT_BELL
