"""
Seed subject assignments: one teacher per subject per class.

    python manage.py seed_subject_assignments
    python manage.py seed_subject_assignments --wipe       # delete first
    python manage.py seed_subject_assignments --dry-run

Requires:
  - GradeLevels (from seed_school)
  - Subjects with grade_levels (from seed_cbc_subjects)
  - Classes in the active year (from seed_school)
  - Teachers (from seed_staff)

Creates one SubjectAssignment per (class, subject-that-applies-to-that-grade),
picking a teacher that is not a parent and, when possible, a teacher who isn't
already teaching that subject in another class in the same grade.

Idempotent: existing assignments are updated, not duplicated.
"""

import random
from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction

from academics.models import ClassRoom, Subject, SubjectAssignment
from core.models import User
from school.models import AcademicYear


STAFF_ROLES = [
    "teacher", "class_teacher", "headteacher", "deputy", "hod", "admin",
]

# Rough target of how many periods per week each subject gets, by band.
# The exact number doesn't matter for testing; consistency does.
PERIODS_BY_SUBJECT = {
    # Codes ending in -PP (pre-primary)
    "-PP": 5,
    # Codes ending in -L (lower primary)
    "-L": 5,
    # Upper primary
    "-U": 5,
    # Junior
    "-J": 4,
    # Senior
    "-S": 4,
}


class Command(BaseCommand):
    help = "Seed one teacher per subject per class for the active year."

    def add_arguments(self, parser):
        parser.add_argument(
            "--wipe", action="store_true",
            help="Delete all existing subject assignments first.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Print the plan without writing.",
        )
        parser.add_argument(
            "--reuse-teachers", action="store_true",
            help="Allow the same teacher to teach the same subject in multiple "
                 "classes (default: spread them out).",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]
        wipe = opts["wipe"]
        reuse_teachers = opts["reuse_teachers"]

        year = AcademicYear.objects.filter(status="active").first()
        if not year:
            self.stdout.write(self.style.ERROR(
                "No active academic year. Run seed_school first."
            ))
            return

        classes = list(
            ClassRoom.objects
            .filter(academic_year=year)
            .select_related("grade_level")
            .order_by("grade_level__order", "stream")
        )
        if not classes:
            self.stdout.write(self.style.ERROR(
                f"No classes in {year.name}. Run seed_school first."
            ))
            return

        # Teachers only (exclude parents). Order for reproducibility.
        teachers = list(
            User.objects
            .filter(role__in=STAFF_ROLES, is_active=True)
            .order_by("id")
        )
        if not teachers:
            self.stdout.write(self.style.ERROR(
                "No staff users found. Run seed_staff first."
            ))
            return

        subjects = list(Subject.objects.order_by("name"))
        if not subjects:
            self.stdout.write(self.style.ERROR(
                "No subjects found. Run seed_cbc_subjects first."
            ))
            return

        self.stdout.write(
            f"Active year: {year.name} · "
            f"{len(classes)} classes · "
            f"{len(teachers)} teachers · "
            f"{len(subjects)} subjects"
        )

        # Group subjects by grade level name so we can look them up quickly
        subjects_by_grade = defaultdict(list)
        for s in subjects:
            for grade_name in s.grade_levels.values_list("name", flat=True):
                subjects_by_grade[grade_name].append(s)

        if dry_run:
            total = 0
            for c in classes:
                n = len(subjects_by_grade.get(c.grade_level_id, []))
                total += n
                self.stdout.write(f"  {c.name}: {n} subjects")
            self.stdout.write(self.style.WARNING(
                f"Would create/update ~{total} assignments."
            ))
            return

        # Wipe if requested
        if wipe:
            n = SubjectAssignment.objects.count()
            SubjectAssignment.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {n} existing assignments."))

        # Track which teacher has been assigned which subject, so we can
        # spread the load when --reuse-teachers is off.
        #   teacher_id -> set(subject_id)
        teacher_subject_load = defaultdict(set)
        #   (class_id, subject_id) -> True  (idempotency check)
        existing_keys = set(
            SubjectAssignment.objects.values_list("class_room_id", "subject_id")
        )

        created = updated = skipped = 0
        # Round-robin pointer for teacher assignment
        teacher_cursor = 0

        with transaction.atomic():
            for cls in classes:
                grade_subjects = subjects_by_grade.get(cls.grade_level_id, [])
                if not grade_subjects:
                    skipped += 1
                    continue

                for subject in grade_subjects:
                    key = (cls.id, subject.id)

                    # If already assigned, update only the periods
                    if key in existing_keys:
                        periods = self._periods_for(subject)
                        updated += SubjectAssignment.objects.filter(
                            class_room=cls, subject=subject
                        ).update(periods_per_week=periods)
                        continue

                    # Pick a teacher
                    teacher = self._pick_teacher(
                        teachers=teachers,
                        subject=subject,
                        teacher_subject_load=teacher_subject_load,
                        reuse=reuse_teachers,
                        cursor_ref=[teacher_cursor],
                    )
                    # Update cursor (mutable trick)
                    teacher_cursor = self._cursor_after(
                        teacher, teachers, teacher_cursor
                    )

                    SubjectAssignment.objects.create(
                        teacher=teacher,
                        subject=subject,
                        class_room=cls,
                        periods_per_week=self._periods_for(subject),
                    )
                    teacher_subject_load[teacher.id].add(subject.id)
                    created += 1

        total_after = SubjectAssignment.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Created {created}, updated {updated}, skipped {skipped} classes "
            f"with no subjects. Total: {total_after}."
        ))
        self.stdout.write(
            f"Per teacher, spread across "
            f"{len(teacher_subject_load)} distinct teachers."
        )

    # ─── helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _periods_for(subject):
        """How many periods per week this subject should get, by band code."""
        for suffix, periods in PERIODS_BY_SUBJECT.items():
            if subject.code.endswith(suffix):
                return periods
        return 5

    def _pick_teacher(self, teachers, subject, teacher_subject_load, reuse, cursor_ref):
        """
        Return a teacher for (class, subject).

        If reuse is False, prefer a teacher who isn't already teaching this
        subject elsewhere. Fall back to the first teacher if none fit.
        """
        if reuse or len(teachers) == 0:
            return teachers[cursor_ref[0] % len(teachers)]

        # Find a teacher not already teaching this subject
        for offset in range(len(teachers)):
            idx = (cursor_ref[0] + offset) % len(teachers)
            candidate = teachers[idx]
            if subject.id not in teacher_subject_load[candidate.id]:
                return candidate

        # All teachers already teach this subject somewhere — recycle.
        return teachers[cursor_ref[0] % len(teachers)]

    @staticmethod
    def _cursor_after(teacher, teachers, current_cursor):
        """Advance the round-robin cursor past this teacher."""
        try:
            idx = teachers.index(teacher)
        except ValueError:
            return current_cursor + 1
        return (idx + 1) % len(teachers)
