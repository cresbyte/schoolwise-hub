"""
Seed 50 test students (plus parents and enrollments) for local testing.

    python manage.py seed_students
    python manage.py seed_students --wipe       # delete all test students first
    python manage.py seed_students --count 100  # change the total

Idempotent: re-running doesn't duplicate students (matched by admission number).

Distributes students across the grades that have classes in the active year.
Requires: at least one active AcademicYear, GradeLevels, and ClassRooms for
the active year.
"""

import random
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from academics.models import ClassRoom, Enrollment
from core.models import ParentRelationship, Student, User, UserRole
from school.models import AcademicYear, GradeLevel

# ─── Name pools ─────────────────────────────────────────────────────────

FIRST_NAMES_MALE = [
    "Brian",
    "Kevin",
    "Dennis",
    "Victor",
    "Collins",
    "Samuel",
    "Peter",
    "John",
    "Joseph",
    "Daniel",
    "Michael",
    "Anthony",
    "Francis",
    "Patrick",
    "Emmanuel",
    "George",
    "Eric",
    "Felix",
    "Martin",
    "Alvin",
    "Ian",
    "Moses",
    "Simon",
    "Stephen",
    "Timothy",
]

FIRST_NAMES_FEMALE = [
    "Mary",
    "Grace",
    "Faith",
    "Mercy",
    "Esther",
    "Cynthia",
    "Purity",
    "Anne",
    "Jane",
    "Alice",
    "Beatrice",
    "Catherine",
    "Diana",
    "Elizabeth",
    "Florence",
    "Gladys",
    "Hellen",
    "Irene",
    "Joyce",
    "Karen",
    "Lydia",
    "Nancy",
    "Naomi",
    "Ruth",
    "Winnie",
]

SURNAMES = [
    "Mwangi",
    "Otieno",
    "Wanjiru",
    "Kamau",
    "Ochieng",
    "Njoroge",
    "Mutua",
    "Omondi",
    "Kariuki",
    "Achieng",
    "Wafula",
    "Kipchoge",
    "Chebet",
    "Maina",
    "Nyong'o",
    "Kimani",
    "Onyango",
    "Wangari",
    "Barasa",
    "Karanja",
    "Muthoni",
    "Auma",
    "Ndung'u",
    "Wekesa",
    "Cheruiyot",
]

# Relative frequency of grades. Adjust if your school has different structure.
GRADE_WEIGHTS = {
    "PP1": 8,
    "PP2": 8,
    "Grade 1": 12,
    "Grade 2": 12,
    "Grade 3": 10,
    # Add more grades if you seed them in your ClassRooms.
}


class Command(BaseCommand):
    help = "Seed N test students with parents and enrollments for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=50,
            help="How many students to create (default 50).",
        )
        parser.add_argument(
            "--wipe",
            action="store_true",
            help="Delete every student whose admission number starts with 'TEST-' "
            "before seeding.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print the plan without writing anything.",
        )

    def handle(self, *args, **opts):
        count = opts["count"]
        dry_run = opts["dry_run"]

        year = AcademicYear.objects.filter(status="active").first()
        if not year:
            raise CommandError(
                "No active academic year. Activate one before seeding students."
            )

        classes = list(
            ClassRoom.objects.filter(academic_year=year)
            .select_related("grade_level")
            .order_by("grade_level__order", "stream")
        )
        if not classes:
            raise CommandError(
                f"No classes in the active year ({year.name}). "
                "Create at least one class before seeding students."
            )

        # Filter classes to grades in GRADE_WEIGHTS. If none match, use all.
        weighted_classes = [c for c in classes if c.grade_level_id in GRADE_WEIGHTS]
        if not weighted_classes:
            weighted_classes = classes
            self.stdout.write(
                self.style.WARNING(
                    "No classes match the grade weights. Using all classes evenly."
                )
            )

        # Build a weighted pool: [(class_room, weight), ...]
        pool = [(c, GRADE_WEIGHTS.get(c.grade_level_id, 5)) for c in weighted_classes]
        weights = [w for _, w in pool]

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))
            self.stdout.write(f"Active year: {year.name}")
            self.stdout.write(f"Classes: {len(weighted_classes)}")
            for c in weighted_classes:
                self.stdout.write(f"  {c.name} (grade {c.grade_level_id})")
            self.stdout.write(f"Would create {count} students.")
            return

        if opts["wipe"]:
            test_students = Student.objects.filter(admission_number__startswith="TEST-")
            n = test_students.count()
            test_students.delete()
            self.stdout.write(
                self.style.WARNING(f"Deleted {n} existing test students.")
            )

        created_students = 0
        created_parents = 0
        created_enrollments = 0
        skipped = 0

        with transaction.atomic():
            for i in range(count):
                # Pick a class from the weighted pool
                class_room = random.choices(pool, weights=weights, k=1)[0][0]
                admission_number = f"TEST-{year.name}-{i + 1:04d}"

                if Student.objects.filter(admission_number=admission_number).exists():
                    skipped += 1
                    continue

                gender = random.choice(["Male", "Female"])
                first_name = random.choice(
                    FIRST_NAMES_MALE if gender == "Male" else FIRST_NAMES_FEMALE
                )
                last_name = random.choice(SURNAMES)
                birth_year = 2024 - int(class_room.grade_level.order or 5)
                date_of_birth = f"{birth_year}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"

                student = Student.objects.create(
                    id=uuid.uuid4().hex,
                    first_name=first_name,
                    last_name=last_name,
                    admission_number=admission_number,
                    gender=gender,
                    date_of_birth=date_of_birth,
                    grade_level=class_room.grade_level_id,
                    class_room=class_room,
                    admission_date=year.start_date,
                    status="active",
                    home_location=f"Nairobi, {random.choice(['Westlands', 'Karen', 'Eastleigh', 'Kasarani', 'Langata'])}",
                    nemis_number=f"NEMIS-{random.randint(100000, 999999)}",
                )
                created_students += 1

                # Create one parent per student
                parent_phone = f"2547{random.randint(10000000, 99999999)}"
                parent = User.objects.filter(phone=parent_phone).first()
                if not parent:
                    parent = User.objects.create_user(
                        phone=parent_phone,
                        name=f"{random.choice(SURNAMES)} Family",
                        role=UserRole.PARENT,
                        password=parent_phone,  # initial password = phone
                    )
                    created_parents += 1

                ParentRelationship.objects.create(
                    student=student,
                    parent=parent,
                    relationship=random.choice(["father", "mother", "guardian"]),
                )

                # Enroll in the active year
                Enrollment.objects.create(
                    student=student,
                    class_room=class_room,
                    academic_year=year,
                    enrolled_on=year.start_date,
                    status=Enrollment.Status.ACTIVE,
                )
                created_enrollments += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {created_students} students, "
                f"{created_parents} parents, {created_enrollments} enrollments. "
                f"Skipped {skipped} existing."
            )
        )
