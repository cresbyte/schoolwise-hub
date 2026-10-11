"""
Bootstrap a fresh SchoolWise database for local testing.

    python manage.py seed_school
    python manage.py seed_school --wipe              # delete everything first
    python manage.py seed_school --dry-run           # show what would happen

What it creates:
  - Grade levels: Play Group, PP1, PP2, Grade 1 ... Grade 9 (final)
  - Academic years: 2026 (active), 2027 (draft)
  - Terms for each year: Term 1, 2, 3 with dates
  - ClassRooms: one stream per grade, per year
  - Wipes School row and recreates a default profile (optional)

Idempotent: safe to re-run. Existing rows are updated in place.

After this, run:
    python manage.py seed_cbc_subjects
    python manage.py seed_students
"""

from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from school.models import AcademicYear, GradeLevel, Term, YearStatus
from academics.models import ClassRoom


# ─── Configuration ──────────────────────────────────────────────────────

# The full CBC ladder. `order` drives promotion (lower = earlier).
# The last grade in this list is marked `is_final=True` so promotion
# graduates students there instead of looking for a next grade.
GRADE_LADDER = [
    ("Play Group", 0),
    ("PP1", 1),
    ("PP2", 2),
    ("Grade 1", 3),
    ("Grade 2", 4),
    ("Grade 3", 5),
    ("Grade 4", 6),
    ("Grade 5", 7),
    ("Grade 6", 8),
    ("Grade 7", 9),
    ("Grade 8", 10),
    ("Grade 9", 11),   # ← mark this as final for a junior school
]

# Which grades get classes created for them. Trim this to your school's size.
GRADES_WITH_CLASSES = [
    "PP1", "PP2",
    "Grade 1", "Grade 2", "Grade 3",
    "Grade 4", "Grade 5", "Grade 6",
]

# Academic years to create.
# The first is activated. The rest are draft.
YEARS = [
    {
        "name": "2026",
        "start_date": date(2026, 1, 5),
        "end_date": date(2026, 10, 30),
        "status": YearStatus.ACTIVE,
        "terms": [
            {"number": 1, "start": date(2026, 1, 5), "end": date(2026, 4, 10)},
            {"number": 2, "start": date(2026, 5, 5), "end": date(2026, 8, 7)},
            {"number": 3, "start": date(2026, 8, 25), "end": date(2026, 10, 30)},
        ],
        "current_term_number": 1,
    },
    {
        "name": "2027",
        "start_date": date(2027, 1, 4),
        "end_date": date(2027, 10, 29),
        "status": YearStatus.DRAFT,
        "terms": [
            {"number": 1, "start": date(2027, 1, 4), "end": date(2027, 4, 9)},
            {"number": 2, "start": date(2027, 5, 4), "end": date(2027, 8, 6)},
            {"number": 3, "start": date(2027, 8, 24), "end": date(2027, 10, 29)},
        ],
        "current_term_number": None,
    },
]

# Streams to create per grade per year. Add more if your school has multi-stream grades.
STREAMS = ["A"]


class Command(BaseCommand):
    help = "Bootstrap grade levels, years, terms, and classes for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--wipe", action="store_true",
            help="Delete existing grade levels, years, terms, and classes first.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Show what would be created without writing.",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]
        wipe = opts["wipe"]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))

        # ─── Wipe ────────────────────────────────────────────────────────
        if wipe and not dry_run:
            with transaction.atomic():
                # Order matters: classes reference years and grades, terms
                # reference years, enrollments reference both. Protect FKs
                # will raise if we try to delete something in use.
                ClassRoom.objects.all().delete()
                Term.objects.all().delete()
                AcademicYear.objects.all().delete()
                GradeLevel.objects.all().delete()
            self.stdout.write(self.style.WARNING("Wiped grade levels, years, terms, and classes."))

        # ─── Grade levels ───────────────────────────────────────────────
        self.stdout.write("\nGrade levels")
        final_grade_name = GRADE_LADDER[-1][0]
        grades_created = grades_updated = 0
        grade_objs = {}

        for name, order in GRADE_LADDER:
            is_final = (name == final_grade_name)
            if dry_run:
                self.stdout.write(f"  would set {name} (order={order}, is_final={is_final})")
                continue
            obj, created = GradeLevel.objects.update_or_create(
                name=name,
                defaults={"order": order, "is_final": is_final},
            )
            grade_objs[name] = obj
            if created:
                grades_created += 1
            else:
                grades_updated += 1

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"  Created {grades_created}, updated {grades_updated}, "
                f"{GradeLevel.objects.count()} total."
            ))

        # ─── Years and terms ────────────────────────────────────────────
        for y in YEARS:
            self.stdout.write(f"\nYear {y['name']} (status={y['status']})")
            if dry_run:
                self.stdout.write(f"  would create/update with {len(y['terms'])} terms")
                continue

            year_obj, created = AcademicYear.objects.update_or_create(
                name=y["name"],
                defaults={
                    "start_date": y["start_date"],
                    "end_date": y["end_date"],
                    "status": y["status"],
                },
            )
            self.stdout.write(
                f"  {'Created' if created else 'Updated'} year {year_obj.name}."
            )

            for t in y["terms"]:
                is_current = t["number"] == y.get("current_term_number")
                term_obj, t_created = Term.objects.update_or_create(
                    academic_year=year_obj,
                    number=t["number"],
                    defaults={
                        "start_date": t["start"],
                        "end_date": t["end"],
                        "is_current": is_current,
                    },
                )
                self.stdout.write(
                    f"    {'Created' if t_created else 'Updated'} "
                    f"{term_obj.label}{' (current)' if is_current else ''}"
                )

            # Enforce only one current term per year (DB constraint handles
            # it, but resetting the others is the intent).
            if y.get("current_term_number"):
                Term.objects.filter(academic_year=year_obj, is_current=True).exclude(
                    number=y["current_term_number"]
                ).update(is_current=False)

        # ─── Classes ────────────────────────────────────────────────────
        self.stdout.write("\nClasses")
        if dry_run:
            for y in YEARS:
                for grade in GRADES_WITH_CLASSES:
                    for stream in STREAMS:
                        self.stdout.write(
                            f"  would create {grade} {stream} in {y['name']}"
                        )
            self.stdout.write(self.style.WARNING("\nDry run complete. Nothing written."))
            return

        classes_created = classes_skipped = 0

        for y in YEARS:
            try:
                year_obj = AcademicYear.objects.get(name=y["name"])
            except AcademicYear.DoesNotExist:
                continue

            for grade_name in GRADES_WITH_CLASSES:
                try:
                    grade_obj = GradeLevel.objects.get(name=grade_name)
                except GradeLevel.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f"  Grade {grade_name} not found, skipping."
                    ))
                    continue

                for stream in STREAMS:
                    obj, was_created = ClassRoom.objects.get_or_create(
                        grade_level=grade_obj,
                        stream=stream,
                        academic_year=year_obj,
                        defaults={"capacity": 40},
                    )
                    if was_created:
                        classes_created += 1
                    else:
                        classes_skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"  Created {classes_created}, existing {classes_skipped}, "
            f"{ClassRoom.objects.count()} total."
        ))

        # ─── Summary ────────────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Bootstrap complete."))
        self.stdout.write(f"  Grade levels:   {GradeLevel.objects.count()}")
        self.stdout.write(f"  Academic years: {AcademicYear.objects.count()}")
        self.stdout.write(f"  Terms:          {Term.objects.count()}")
        self.stdout.write(f"  Classes:        {ClassRoom.objects.count()}")
        self.stdout.write("")
        self.stdout.write("Next steps:")
        self.stdout.write("  python manage.py seed_cbc_subjects")
        self.stdout.write("  python manage.py seed_students")
