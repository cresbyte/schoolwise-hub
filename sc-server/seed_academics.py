"""
Seed the academics database.
  - Subjects (Mathematics, English, Kiswahili, Science, Social Studies, CRE, Music, Art)
  - Exams    (Opener, Midterm, Endterm for Term 1 & 2 2026)
  - Attendance records for the last 10 school days for each class
  - Exam Marks  (random scores for all students in each exam)

Usage:
    python seed_academics.py
"""
import os
import django
import random
from datetime import date, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.academics.models import ClassRoom, Subject
from apps.exams.models import Exam, Mark
from apps.attendance.models import Attendance
from apps.students.models import Student


# ─── helpers ──────────────────────────────────────────────────────────────────

random.seed(20260627)


def weekdays_in_range(start: date, end: date):
    """Return a list of weekday dates (Mon–Fri) between start and end inclusive."""
    days = []
    d = start
    while d <= end:
        if d.weekday() < 5:  # Mon=0, Fri=4
            days.append(d)
        d += timedelta(days=1)
    return days


# ─── 1. Subjects ──────────────────────────────────────────────────────────────

DEFAULT_GRADING = [
    {"grade": "A", "min": 80, "max": 100, "color": "#4caf50", "comment": "Excellent"},
    {"grade": "B", "min": 70, "max": 79, "color": "#8bc34a", "comment": "Very Good"},
    {"grade": "C", "min": 50, "max": 69, "color": "#ffeb3b", "comment": "Good"},
    {"grade": "D", "min": 40, "max": 49, "color": "#ff9800", "comment": "Fair"},
    {"grade": "E", "min": 0, "max": 39, "color": "#f44336", "comment": "Needs Improvement"},
]

SUBJECTS = [
    ("sub-math",   "Mathematics",     "MATH", "CBC", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"], True, "Mathematics"),
    ("sub-eng",    "English",         "ENG", "CBC", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"], True, "Languages"),
    ("sub-kisw",   "Kiswahili",       "KISW", "CBC", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"], True, "Languages"),
    ("sub-sci",    "Science",         "SCI", "CBC", ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"], True, "Sciences"),
    ("sub-sst",    "Social Studies",  "SST", "CBC", ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"], True, "Humanities"),
    ("sub-cre",    "CRE",             "CRE", "CBC", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"], True, "Religious Education"),
    ("sub-music",  "Music",           "MUS", "CBC", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"], False, "Creative Arts"),
    ("sub-art",    "Art & Craft",     "ART", "CBC", ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"], False, "Creative Arts"),
]

print("Seeding Subjects…")
for sid, name, code, curriculum, grade_levels, is_core, learning_area in SUBJECTS:
    sub, created = Subject.objects.update_or_create(
        code=code,
        defaults={
            "name": name, 
            "description": f"{name} subject",
            "curriculum": curriculum,
            "grade_levels": grade_levels,
            "is_core": is_core,
            "learning_area": learning_area,
            "grading_system": DEFAULT_GRADING
        },
    )
    print(f"  {'Created' if created else 'Updated'}: {sub.name}")

subjects = list(Subject.objects.all())
print(f"  → {len(subjects)} subjects in DB.\n")


# ─── 2. Exams ─────────────────────────────────────────────────────────────────

EXAMS = [
    {"name": "Term 1 Opener 2026",   "term": 1, "year": 2026, "exam_type": "opener",   "status": "completed", "start_date": date(2026, 1, 27), "end_date": date(2026, 1, 31)},
    {"name": "Term 1 Midterm 2026",  "term": 1, "year": 2026, "exam_type": "midterm",  "status": "completed", "start_date": date(2026, 2, 24), "end_date": date(2026, 2, 28)},
    {"name": "Term 1 Endterm 2026",  "term": 1, "year": 2026, "exam_type": "endterm",  "status": "completed", "start_date": date(2026, 4,  7), "end_date": date(2026, 4, 11)},
    {"name": "Term 2 Opener 2026",   "term": 2, "year": 2026, "exam_type": "opener",   "status": "completed", "start_date": date(2026, 5, 12), "end_date": date(2026, 5, 16)},
    {"name": "Term 2 Midterm 2026",  "term": 2, "year": 2026, "exam_type": "midterm",  "status": "ongoing",   "start_date": date(2026, 6, 23), "end_date": date(2026, 6, 27)},
    {"name": "Term 2 Endterm 2026",  "term": 2, "year": 2026, "exam_type": "endterm",  "status": "upcoming",  "start_date": date(2026, 8,  4), "end_date": date(2026, 8,  8)},
]

print("Seeding Exams…")
exam_objects = []
for e_data in EXAMS:
    exam, created = Exam.objects.update_or_create(
        name=e_data["name"],
        defaults=e_data,
    )
    exam_objects.append(exam)
    print(f"  {'Created' if created else 'Updated'}: {exam.name} [{exam.status}]")
print(f"  → {len(exam_objects)} exams in DB.\n")


# ─── 3. Exam Marks ────────────────────────────────────────────────────────────

print("Seeding Exam Marks…")
students = list(Student.objects.all())
completed_exams = [e for e in exam_objects if e.status in ("completed", "ongoing")]
# Use first 3 subjects for marks to keep it manageable
mark_subjects = subjects[:3]

mark_count = 0
for exam in completed_exams:
    for student in students:
        for subject in mark_subjects:
            score = round(random.uniform(30, 98), 1)
            _, created = Mark.objects.update_or_create(
                exam=exam,
                student=student,
                subject=subject,
                defaults={"score": score, "comment": ""},
            )
            if created:
                mark_count += 1

print(f"  → {mark_count} new marks created.\n")


# ─── 4. Attendance Records ────────────────────────────────────────────────────

print("Seeding Attendance records…")

# 10 school days ending yesterday
end_date = date.today() - timedelta(days=1)
start_date = end_date - timedelta(days=20)  # go back 20 calendar days to get ~10 weekdays
school_days = weekdays_in_range(start_date, end_date)[:10]

STATUS_POOL = ["present"] * 8 + ["absent"] * 1 + ["late"] * 1  # 80% present

att_count = 0
for student in students:
    for day in school_days:
        _, created = Attendance.objects.update_or_create(
            student=student,
            date=day,
            defaults={
                "status": random.choice(STATUS_POOL),
                "remarks": "",
                "taken_by": None,
            },
        )
        if created:
            att_count += 1

print(f"  → {att_count} new attendance records created.\n")

print("✅ Academic seeding complete!")
