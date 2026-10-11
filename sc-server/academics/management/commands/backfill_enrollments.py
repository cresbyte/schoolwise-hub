from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from academics.models import Enrollment
from core.models import Student
from school.services import get_current_period


class Command(BaseCommand):
    help = "Create an active enrollment for every student without one."

    def handle(self, *args, **options):
        year, _term = get_current_period()
        if not year:
            self.stdout.write(
                self.style.ERROR("No active academic year. Activate one first.")
            )
            return

        created = skipped = 0
        with transaction.atomic():
            for student in Student.objects.filter(status="active"):
                if not student.class_room:
                    skipped += 1
                    continue
                if student.class_room.academic_year_id != year.id:
                    # Class belongs to a different year — skip and warn.
                    self.stdout.write(
                        self.style.WARNING(
                            f"  {student} is in {student.class_room.name} "
                            f"({student.class_room.academic_year.name}), not {year.name}."
                        )
                    )
                    skipped += 1
                    continue

                _, was_created = Enrollment.objects.get_or_create(
                    student=student,
                    academic_year=year,
                    defaults={
                        "class_room": student.class_room,
                        "enrolled_on": student.admission_date
                        or student.created_at.date(),
                        "status": Enrollment.Status.ACTIVE,
                    },
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1

        self.stdout.write(
            self.style.SUCCESS(f"Done. Created {created}, skipped {skipped}.")
        )
