"""Exam services. Business rules in one place."""

from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from academics.models import ClassRoom, Enrollment, SubjectAssignment
from exams.models import Exam, ExamComment, ExamSubject, Mark


# ============================================================================
# Exam lifecycle
# ============================================================================


@transaction.atomic
def open_exam_for_marks(exam, user):
    """Move a draft or closed exam to 'open'. Teachers can enter marks."""
    if exam.status not in (Exam.Status.DRAFT, Exam.Status.CLOSED):
        raise ValueError("Only draft or closed exams can be opened for marks.")
    if not exam.exam_subjects.exists():
        raise ValueError("Add at least one subject before opening the exam.")
    exam.status = Exam.Status.OPEN
    exam.save(update_fields=["status", "updated_at"])
    return exam


@transaction.atomic
def close_exam_marks(exam, user):
    """Stop marks entry."""
    if exam.status != Exam.Status.OPEN:
        raise ValueError("Only open exams can be closed.")
    exam.status = Exam.Status.CLOSED
    exam.save(update_fields=["status", "updated_at"])
    return exam


@transaction.atomic
def release_exam(exam, user):
    """Freeze marks and make report cards visible to parents."""
    if exam.status not in (Exam.Status.CLOSED, Exam.Status.OPEN):
        raise ValueError("Only open or closed exams can be released.")
    exam.status = Exam.Status.RELEASED
    exam.released_by = user
    exam.released_at = timezone.now()
    exam.save(update_fields=["status", "released_by", "released_at", "updated_at"])
    return exam


@transaction.atomic
def reopen_exam(exam, user):
    """Take a released exam back to open for corrections."""
    if exam.status != Exam.Status.RELEASED:
        raise ValueError("Only released exams can be reopened.")
    exam.status = Exam.Status.OPEN
    exam.released_by = None
    exam.released_at = None
    exam.save(update_fields=["status", "released_by", "released_at", "updated_at"])
    return exam


# ============================================================================
# Subject setup
# ============================================================================

@transaction.atomic
def create_exam_subjects(exam, grade_names, subject_ids):
    """
    Create ExamSubject rows for the given grades and subjects.
    Copies the grading scale from each Subject at this moment.
    Idempotent: existing rows are skipped.
    """
    from academics.models import Subject

    created = []
    for grade_name in grade_names:
        for subject_id in subject_ids:
            try:
                subject = Subject.objects.get(pk=subject_id)
            except Subject.DoesNotExist:
                continue
            # Skip if the subject isn't offered for this grade
            if not subject.is_offered_in(grade_name):
                continue
            obj, was_created = ExamSubject.objects.get_or_create(
                exam=exam,
                grade_level_id=grade_name,
                subject=subject,
                defaults={
                    "max_mark": 100,
                    "grading_scale": subject.grading_scale or [],
                },
            )
            if was_created:
                created.append(obj)
    return created


# ============================================================================
# Marks entry
# ============================================================================

def roster_for_exam_subject(exam_subject, class_room=None):
    """
    Students who should appear in the marks grid.

    If `class_room` is given, only that class. Otherwise all classes of the
    exam subject's grade level in the current academic year.

    Uses enrollments, not Student.class_room.
    """
    from academics.models import ClassRoom

    classes_qs = exam_subject.exam.classes_for(exam_subject.grade_level_id)
    if class_room:
        classes_qs = classes_qs.filter(pk=class_room.pk)

    enrollments = (
        Enrollment.objects
        .filter(class_room__in=classes_qs, status=Enrollment.Status.ACTIVE)
        .select_related("student", "class_room")
        .order_by("class_room__stream", "student__first_name")
    )

    existing = {
        m.student_id: m
        for m in Mark.objects.filter(exam_subject=exam_subject)
    }

    rows = []
    for e in enrollments:
        mark = existing.get(e.student_id)
        rows.append({
            "studentId": e.student_id,
            "studentName": f"{e.student.first_name} {e.student.last_name}".strip(),
            "admissionNumber": e.student.admission_number,
            "classId": e.class_room_id,
            "className": e.class_room.name,
            "score": str(mark.score) if mark and mark.score is not None else "",
            "grade": mark.grade if mark else "",
            "points": mark.points if mark else 0,
            "comment": mark.comment if mark else "",
            "isNa": mark.is_na if mark else False,
            "markId": mark.id if mark else None,
        })
    return rows


@transaction.atomic
def bulk_save_marks(exam_subject, records, user):
    """
    Upsert marks for one exam subject.

    Records: list of
      { studentId, score (or null if isNa), comment, isNa }

    Server overrides grade + points from the scale.
    Refuses if the exam isn't open.
    """
    if exam_subject.exam.status != Exam.Status.OPEN:
        raise ValueError("Marks can only be entered while the exam is open.")

    saved = []
    for r in records:
        sid = r["studentId"]
        is_na = bool(r.get("isNa", False))
        score = r.get("score")
        if not is_na and (score is None or score == ""):
            raise ValueError(f"Score required for student {sid}.")

        mark, _ = Mark.objects.update_or_create(
            exam_subject=exam_subject,
            student_id=sid,
            defaults={
                "score": Decimal(str(score)) if not is_na else 0,
                "comment": r.get("comment", "") or "",
                "is_na": is_na,
                "entered_by": user,
            },
        )
        saved.append(mark)
    return saved


# ============================================================================
# Comments (class teacher + head teacher)
# ============================================================================

def mean_points_for_student(exam, student):
    """
    Return (mean_points, subject_count) across all non-NA marks for the
    student in this exam.
    """
    marks = Mark.objects.filter(
        exam_subject__exam=exam, student=student, is_na=False,
    )
    total = 0
    count = 0
    for m in marks:
        total += m.points
        count += 1
    return (round(total / count, 2) if count else 0.0), count


def default_class_teacher_comment(mean_points):
    """Return the school's default comment band for a mean-points value."""
    if mean_points >= 4.5:
        return "An outstanding performance this term. Keep it up."
    if mean_points >= 3.5:
        return "A strong performance. Well done, keep improving."
    if mean_points >= 2.5:
        return "A satisfactory performance. There is room to grow."
    if mean_points >= 1.5:
        return "Below expectations. Focused effort is needed next term."
    return "Significantly below expectations. Requires close support."


def default_head_teacher_comment(mean_points):
    """Same idea, different voice."""
    if mean_points >= 4.5:
        return "Excellent. The school is proud of your work."
    if mean_points >= 3.5:
        return "Well done. Continue with the same effort."
    if mean_points >= 2.5:
        return "Satisfactory. More effort will yield better results."
    if mean_points >= 1.5:
        return "Needs improvement. Seek extra help where needed."
    return "Requires significant support. Please see the class teacher."


@transaction.atomic
def save_class_teacher_comments(exam, comments, user):
    """
    comments: list of { studentId, comment }

    If a comment is empty, the default for the student's mean points is
    used instead. This ensures the report card always has a comment once
    the teacher saves, without requiring them to type one.
    """
    if exam.status not in (Exam.Status.OPEN, Exam.Status.CLOSED):
        raise ValueError("Comments can only be set before release.")
    saved = []
    for c in comments:
        student_id = c["studentId"]
        provided = (c.get("comment") or "").strip()

        if not provided:
            # Compute the default from the student's mean points
            from core.models import Student

            try:
                student = Student.objects.get(pk=student_id)
                mean_points, _ = mean_points_for_student(exam, student)
                provided = default_class_teacher_comment(mean_points)
            except Student.DoesNotExist:
                provided = ""

        obj, _ = ExamComment.objects.update_or_create(
            exam=exam,
            student_id=student_id,
            defaults={
                "class_teacher_comment": provided,
                "class_teacher_set_by": user,
                "class_teacher_set_at": timezone.now(),
            },
        )
        saved.append(obj)
    return saved


@transaction.atomic
def save_head_teacher_comments(exam, comments, user):
    """
    comments: list of { studentId, comment }

    If a comment is empty, the default for the student's mean points is
    used instead. Mirrors save_class_teacher_comments.
    """
    if exam.status not in (Exam.Status.OPEN, Exam.Status.CLOSED):
        raise ValueError("Comments can only be set before release.")
    saved = []
    for c in comments:
        student_id = c["studentId"]
        provided = (c.get("comment") or "").strip()

        if not provided:
            from core.models import Student

            try:
                student = Student.objects.get(pk=student_id)
                mean_points, _ = mean_points_for_student(exam, student)
                provided = default_head_teacher_comment(mean_points)
            except Student.DoesNotExist:
                provided = ""

        obj, _ = ExamComment.objects.update_or_create(
            exam=exam,
            student_id=student_id,
            defaults={
                "head_teacher_comment": provided,
                "head_teacher_set_by": user,
                "head_teacher_set_at": timezone.now(),
            },
        )
        saved.append(obj)
    return saved


# ============================================================================
# Report card computation
# ============================================================================

def compute_report_card(exam, student):
    """
    Compute one student's report card for one exam. Returns a dict.

    This is the single source of truth for report card content. Both the
    preview page and the parent portal call it.
    """
    from academics.models import ClassRoom

    # Which class was the student in during this exam's academic year?
    enrollment = (
        Enrollment.objects
        .filter(student=student, academic_year=exam.academic_year)
        .select_related("class_room")
        .order_by("-enrolled_on")
        .first()
    )
    class_room = enrollment.class_room if enrollment else None

    # Subjects examined for this student's grade level
    exam_subjects = (
        ExamSubject.objects
        .filter(exam=exam, grade_level_id=student.grade_level)
        .select_related("subject")
        .order_by("subject__name")
    )

    marks_by_subject = {
        m.exam_subject_id: m
        for m in Mark.objects.filter(
            exam_subject__in=exam_subjects, student=student,
        )
    }

    subject_rows = []
    total_points = 0
    scored_subjects = 0
    total_score = Decimal("0")
    for es in exam_subjects:
        mark = marks_by_subject.get(es.id)
        if mark and not mark.is_na:
            total_points += mark.points
            scored_subjects += 1
            total_score += mark.score
        subject_rows.append({
            "subjectId": es.subject_id,
            "subjectName": es.subject.name,
            "subjectCode": es.subject.code,
            "maxMark": es.max_mark,
            "score": str(mark.score) if mark and not mark.is_na else None,
            "grade": mark.grade if mark and not mark.is_na else "",
            "points": mark.points if mark and not mark.is_na else 0,
            "comment": mark.comment if mark else "",
            "isNa": mark.is_na if mark else False,
        })

    mean_points = round(total_points / scored_subjects, 2) if scored_subjects else 0.0
    mean_score = (
        round(total_score / scored_subjects, 2) if scored_subjects else Decimal("0")
    )

    exam_comment = ExamComment.objects.filter(exam=exam, student=student).first()

    return {
        "student": {
            "id": student.id,
            "name": f"{student.first_name} {student.last_name}".strip(),
            "admissionNumber": student.admission_number,
            "gradeLevel": student.grade_level,
            "className": class_room.name if class_room else "",
        },
        "exam": {
            "id": exam.id,
            "name": exam.name,
            "term": exam.term.label,
            "status": exam.status,
        },
        "subjects": subject_rows,
        "totals": {
            "totalPoints": total_points,
            "scoredSubjects": scored_subjects,
            "meanPoints": mean_points,
            "totalScore": str(total_score),
            "meanScore": str(mean_score),
        },
        "comments": {
            "classTeacher": (
                exam_comment.class_teacher_comment if exam_comment else ""
            ),
            "headTeacher": (
                exam_comment.head_teacher_comment if exam_comment else ""
            ),
        },
    }


def compute_class_report(exam, class_room):
    """
    Compute report cards for every student in a class, plus rank by mean points.
    Rank is 'competition ranking' (ties share the same rank).
    """
    enrollments = (
        Enrollment.objects
        .filter(
            class_room=class_room,
            academic_year=exam.academic_year,
            status=Enrollment.Status.ACTIVE,
        )
        .select_related("student")
    )
    cards = [compute_report_card(exam, e.student) for e in enrollments]

    # Rank by mean points, descending
    cards.sort(key=lambda c: -c["totals"]["meanPoints"])
    rank = 0
    prev = None
    for i, c in enumerate(cards):
        mp = c["totals"]["meanPoints"]
        if mp != prev:
            rank = i + 1
            prev = mp
        c["rank"] = rank

    return cards
