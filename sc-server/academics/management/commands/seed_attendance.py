"""
Seed attendance for every enrolled student, for the last N school days.

    python manage.py seed_attendance
    python manage.py seed_attendance --days 30
    python manage.py seed_attendance --absent-rate 0.15
    python manage.py seed_attendance --wipe

Idempotent: existing rows for a (student, date) are skipped, so re-running
only fills gaps.
"""

import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from academics.models import ClassRoom, Enrollment
from attendance.models import Attendance, AttendanceStatus, AbsenceReason, roster_for
from school.models import AcademicYear


class Command(BaseCommand):
    help = "Seed attendance records for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=20,
            help="Number of trailing school days to seed (default 20).",
        )
        parser.add_argument(
            "--absent-rate",
            type=float,
            default=0.10,
            help="Fraction of records that are absent (default 0.10).",
        )
        parser.add_argument("--late-rate", type=float, default=0.05)
        parser.add_argument("--excused-rate", type=float, default=0.02)
        parser.add_argument(
            "--wipe", action="store_true", help="Delete ALL attendance before seeding."
        )
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        year = AcademicYear.objects.filter(status="active").first()
        if not year:
            raise CommandError("No active academic year. Run seed_school first.")

        classes = list(ClassRoom.objects.filter(academic_year=year))
        if not classes:
            raise CommandError("No classes in the active year.")

        if opts["wipe"] and not opts["dry_run"]:
            n = Attendance.objects.count()
            Attendance.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {n} attendance rows."))

        # Build the list of school days to seed, going backwards from today.
        days = []
        d = date.today()
        while len(days) < opts["days"]:
            if d.weekday() < 5:  # Mon–Fri
                days.append(d)
            d -= timedelta(days=1)
        days.sort()  # oldest first

        if opts["dry_run"]:
            total = 0
            for cls in classes:
                total += len(roster_for(cls, days[-1]))
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN: would seed {total * len(days)} rows across "
                    f"{len(classes)} classes × {len(days)} days."
                )
            )
            return

        absent_rate = opts["absent_rate"]
        late_rate = opts["late_rate"]
        excused_rate = opts["excused_rate"]

        created = skipped = 0
        with transaction.atomic():
            for cls in classes:
                for day in days:
                    roster = roster_for(cls, day)
                    for e in roster:
                        student = e.student
                        if Attendance.objects.filter(
                            student=student, date=day
                        ).exists():
                            skipped += 1
                            continue

                        r = random.random()
                        if r < absent_rate:
                            status = AttendanceStatus.ABSENT
                            reason = random.choice(
                                [
                                    AbsenceReason.SICK,
                                    AbsenceReason.FAMILY,
                                    AbsenceReason.TRANSPORT,
                                    AbsenceReason.UNKNOWN,
                                ]
                            )
                        elif r < absent_rate + late_rate:
                            status = AttendanceStatus.LATE
                            reason = AbsenceReason.TRANSPORT
                        elif r < absent_rate + late_rate + excused_rate:
                            status = AttendanceStatus.EXCUSED
                            reason = random.choice(
                                [
                                    AbsenceReason.MEDICAL,
                                    AbsenceReason.SCHOOL_ACTIVITY,
                                ]
                            )
                        else:
                            status = AttendanceStatus.PRESENT
                            reason = ""

                        Attendance.objects.create(
                            student=student,
                            date=day,
                            status=status,
                            reason=reason,
                            class_room=cls,
                            academic_year=year,
                        )
                        created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {created} attendance rows, skipped {skipped} existing. "
                f"Days: {days[0]} → {days[-1]}."
            )
        )
