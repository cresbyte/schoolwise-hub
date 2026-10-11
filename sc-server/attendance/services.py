"""Attendance services.

Every consumer (report cards, SMS digests, at-risk lists, the parent portal)
reads attendance through these functions. Never query the model directly for
business logic.
"""

from collections import defaultdict
from datetime import date, timedelta

from django.db.models import Count, Q

from academics.models import ClassRoom, Enrollment
from school.models import AcademicYear, CalendarEvent, Term

from attendance.models import (
    Attendance,
    AttendanceStatus,
    roster_for,
)


# ============================================================================
# Summaries
# ============================================================================


def student_attendance_summary(student, from_date, to_date):
    """
    Return a dict for one student over a date range:

      {
        "school_days": 40,           # days the student was enrolled and the school was open
        "present": 30,
        "absent": 5,
        "late": 3,
        "excused": 2,
        "attended": 33,              # present + late
        "attendance_rate": 0.825,    # attended / school_days
      }

    Attendance rate uses SCHOOL DAYS THE STUDENT WAS ENROLLED as the
    denominator, not the number of attendance records taken. A week where
    no one recorded attendance is not a week of perfect attendance.
    """
    enrollments = Enrollment.objects.filter(
        student=student,
        status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.PROMOTED,
                    Enrollment.Status.GRADUATED],
    )
    if not enrollments.exists():
        return _empty_summary()

    # Determine the student's enrolled window
    enrolled_from = min(e.enrolled_on for e in enrollments)
    enrolled_to = max((e.left_on for e in enrollments if e.left_on), default=None)

    window_start = max(from_date, enrolled_from)
    window_end = min(to_date, enrolled_to) if enrolled_to else to_date

    if window_end < window_start:
        return _empty_summary()

    school_days = _school_days_between(window_start, window_end)

    # Count attendance records in the window
    records = Attendance.objects.filter(
        student=student,
        date__gte=window_start,
        date__lte=window_end,
    ).values("status").annotate(n=Count("id"))

    counts = {"present": 0, "absent": 0, "late": 0, "excused": 0}
    for row in records:
        counts[row["status"]] = row["n"]

    attended = counts["present"] + counts["late"]

    return {
        "school_days": school_days,
        "present": counts["present"],
        "absent": counts["absent"],
        "late": counts["late"],
        "excused": counts["excused"],
        "attended": attended,
        "attendance_rate": round(attended / school_days, 4) if school_days else 0.0,
    }


def class_summary(class_room, from_date, to_date):
    """
    Per-student summaries for a class over a range.
    Returns a list of dicts, one per student.
    """
    rosters = (
        Enrollment.objects
        .filter(
            class_room=class_room,
            status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.PROMOTED,
                        Enrollment.Status.GRADUATED],
        )
        .select_related("student")
    )
    student_ids = {e.student_id for e in rosters}
    out = []
    for sid in student_ids:
        from core.models import Student
        student = Student.objects.get(pk=sid)
        summary = student_attendance_summary(student, from_date, to_date)
        summary["studentId"] = sid
        summary["studentName"] = f"{student.first_name} {student.last_name}".strip()
        out.append(summary)
    out.sort(key=lambda r: r["studentName"])
    return out


def daily_summary(day, class_room=None):
    """
    Per-class totals on a single day.
    If class_room is given, returns totals for just that class.
    """
    qs = Attendance.objects.filter(date=day)
    if class_room:
        qs = qs.filter(class_room=class_room)

    agg = qs.values("class_room_id").annotate(
        present=Count("id", filter=Q(status="present")),
        absent=Count("id", filter=Q(status="absent")),
        late=Count("id", filter=Q(status="late")),
        excused=Count("id", filter=Q(status="excused")),
        total=Count("id"),
    )

    result = []
    for row in agg:
        try:
            cls = ClassRoom.objects.get(pk=row["class_room_id"])
        except ClassRoom.DoesNotExist:
            continue
        result.append({
            "classRoomId": row["class_room_id"],
            "className": cls.name,
            "present": row["present"],
            "absent": row["absent"],
            "late": row["late"],
            "excused": row["excused"],
            "total": row["total"],
            "attendanceRate": round(
                (row["present"] + row["late"]) / row["total"], 4
            ) if row["total"] else 0.0,
        })
    return result


def at_risk_students(academic_year, term=None, threshold=0.8):
    """
    Students whose attendance rate is below `threshold` for the period.

    If `term` is given, uses the term's date range; otherwise the full year.
    """
    if term:
        from_date = term.start_date
        to_date = term.end_date
    else:
        from_date = academic_year.start_date
        to_date = academic_year.end_date

    # All actively-enrolled students this year
    enrollments = (
        Enrollment.objects
        .filter(
            academic_year=academic_year,
            status__in=[Enrollment.Status.ACTIVE, Enrollment.Status.PROMOTED],
        )
        .select_related("student", "class_room")
    )

    seen = set()
    out = []
    for e in enrollments:
        if e.student_id in seen:
            continue
        seen.add(e.student_id)

        summary = student_attendance_summary(e.student, from_date, to_date)
        if summary["school_days"] < 5:
            continue  # too little data to judge
        if summary["attendance_rate"] < threshold:
            out.append({
                "studentId": e.student_id,
                "studentName": f"{e.student.first_name} {e.student.last_name}".strip(),
                "className": e.class_room.name if e.class_room else "",
                "attendanceRate": summary["attendance_rate"],
                "schoolDays": summary["school_days"],
                "absent": summary["absent"],
            })
    out.sort(key=lambda r: r["attendanceRate"])
    return out


# ============================================================================
# Roster / grid helpers
# ============================================================================


def roster_with_attendance(class_room, day):
    """
    Return the class roster for `day`, merged with any existing attendance.

    Used by the 'take attendance' page. Returns a list of dicts:
      {
        "studentId": ..., "studentName": ..., "admissionNumber": ...,
        "status": "present" | "absent" | "late" | "excused" | "",  # "" = unmarked
        "reason": "...", "notes": "...",
        "attendanceId": 123 | None,
      }
    """
    enrollments = roster_for(class_room, day)
    existing = {
        a.student_id: a
        for a in Attendance.objects.filter(
            class_room=class_room, date=day
        )
    }

    out = []
    for e in enrollments:
        student = e.student
        record = existing.get(student.id)
        out.append({
            "studentId": student.id,
            "studentName": f"{student.first_name} {student.last_name}".strip(),
            "admissionNumber": student.admission_number,
            "status": record.status if record else "",
            "reason": record.reason if record else "",
            "notes": record.notes if record else "",
            "attendanceId": record.id if record else None,
        })
    return out


# ============================================================================
# Helpers
# ============================================================================


def _school_days_between(start, end):
    """
    Count school days (Mon–Fri) between two dates, minus holidays.
    Uses CalendarEvent(category="holiday") from the school app.
    """
    if end < start:
        return 0
    day = start
    count = 0
    holidays = set(
        CalendarEvent.objects
        .filter(
            start_date__lte=end,
            end_date__gte=start,
            category="holiday",
        )
        .values_list("start_date", "end_date")
    )
    holiday_days = set()
    for h_start, h_end in holidays:
        d = h_start
        while d <= h_end:
            holiday_days.add(d)
            d += timedelta(days=1)

    while day <= end:
        if day.weekday() < 5 and day not in holiday_days:
            count += 1
        day += timedelta(days=1)
    return count


def _empty_summary():
    return {
        "school_days": 0,
        "present": 0,
        "absent": 0,
        "late": 0,
        "excused": 0,
        "attended": 0,
        "attendance_rate": 0.0,
    }
