"""
Seed staff users for local testing.

    python manage.py seed_staff
    python manage.py seed_staff --wipe        # delete all seeded staff first
    python manage.py seed_staff --dry-run     # show what would happen

Idempotent: matched by phone number, so re-running doesn't duplicate.

Creates:
  - 1 headteacher
  - 1 deputy
  - 1 accountant
  - 1 admin (staff type, not Django superuser)
  - N teachers (default 12) with realistic Kenyan names
  - Assigns a subset as class teachers on the active year's classes

All seeded staff have phone numbers starting with "2547TEST" (so you can
identify and wipe them) and use their phone number as their password.
"""

import random
import uuid
from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from academics.models import ClassRoom
from core.models import User, UserRole
from school.models import AcademicYear


FIRST_NAMES_MALE = [
    "Peter", "John", "Daniel", "Michael", "Francis", "Patrick", "George",
    "Eric", "Felix", "Martin", "Alvin", "Ian", "Moses", "Simon", "Stephen",
    "Timothy", "Brian", "Kevin", "Dennis", "Victor", "Collins", "Samuel",
    "Joseph", "Anthony", "Emmanuel",
]

FIRST_NAMES_FEMALE = [
    "Mary", "Grace", "Faith", "Mercy", "Esther", "Cynthia", "Purity",
    "Anne", "Jane", "Alice", "Beatrice", "Catherine", "Diana", "Elizabeth",
    "Florence", "Gladys", "Hellen", "Irene", "Joyce", "Karen", "Lydia",
    "Nancy", "Naomi", "Ruth", "Winnie",
]

SURNAMES = [
    "Mwangi", "Otieno", "Wanjiru", "Kamau", "Ochieng", "Njoroge", "Mutua",
    "Omondi", "Kariuki", "Achieng", "Wafula", "Kipchoge", "Chebet", "Maina",
    "Nyong'o", "Kimani", "Onyango", "Wangari", "Barasa", "Karanja",
    "Muthoni", "Auma", "Ndung'u", "Wekesa", "Cheruiyot",
]

# Role distribution for the seeded teachers. The number here is how many of
# each role to create. Admins/head/deputy are always created once.
TEACHER_ROLE_COUNTS = {
    UserRole.TEACHER: 10,
    UserRole.CLASS_TEACHER: 3,   # will be assigned to a class below
    UserRole.HOD: 1,
}


class Command(BaseCommand):
    help = "Seed staff users for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--wipe", action="store_true",
            help="Delete every seeded staff member first.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Print the plan without writing.",
        )
        parser.add_argument(
            "--teachers", type=int, default=None,
            help="Override the number of plain teachers to create (default 10).",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]
        wipe = opts["wipe"]

        # ─── Wipe ────────────────────────────────────────────────────────
        if wipe and not dry_run:
            seeded = User.objects.filter(phone__startswith="2547TEST")
            n = seeded.count()
            seeded.delete()
            self.stdout.write(self.style.WARNING(f"Deleted {n} seeded staff."))

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))

        role_counts = dict(TEACHER_ROLE_COUNTS)
        if opts["teachers"] is not None:
            role_counts[UserRole.TEACHER] = opts["teachers"]

        plan = [
            (UserRole.HEADTEACHER, 1),
            (UserRole.DEPUTY, 1),
            (UserRole.ACCOUNTANT, 1),
            (UserRole.ADMIN, 1),
        ] + list(role_counts.items())

        if dry_run:
            for role, count in plan:
                self.stdout.write(f"  would create {count} × {role}")
            return

        created = 0
        created_by_id = {}

        with transaction.atomic():
            for role, count in plan:
                for i in range(count):
                    staff = self._create_staff(role, created)
                    if staff is None:
                        continue
                    created_by_id.setdefault(role, []).append(staff)
                    created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Created {created} staff. Total: {User.objects.filter(phone__startswith='2547TEST').count()}."
        ))

        # ─── Assign class teachers to some classes ──────────────────────
        self._assign_class_teachers(created_by_id, dry_run)

        self.stdout.write("")
        self.stdout.write("Login credentials (phone / phone):")
        for role, users in created_by_id.items():
            for u in users[:3]:  # show first 3 of each role
                self.stdout.write(f"  {u.role:15} {u.phone}  ({u.name})")
            if len(users) > 3:
                self.stdout.write(f"  ... and {len(users) - 3} more {role}")

    # ─── helpers ────────────────────────────────────────────────────────

    def _create_staff(self, role, index):
        """Create one staff user with a realistic name and unique phone."""
        gender = random.choice(["Male", "Female"])
        first = random.choice(
            FIRST_NAMES_MALE if gender == "Male" else FIRST_NAMES_FEMALE
        )
        last = random.choice(SURNAMES)
        name = f"{first} {last}"

        # Unique phone. Prefix marks it as seeded.
        for _ in range(20):  # retry on collision
            suffix = random.randint(1000000, 9999999)
            phone = f"2547TEST{suffix}"
            if not User.objects.filter(phone=phone).exists():
                break
        else:
            self.stdout.write(self.style.WARNING(f"  Could not find unique phone for {name}."))
            return None

        staff_id = f"STF-TEST-{uuid.uuid4().hex[:6].upper()}"
        designation = {
            UserRole.HEADTEACHER: "Head Teacher",
            UserRole.DEPUTY: "Deputy Principal",
            UserRole.ACCOUNTANT: "Accountant",
            UserRole.ADMIN: "Administrator",
            UserRole.HOD: "Head of Department",
            UserRole.CLASS_TEACHER: "Class Teacher",
            UserRole.TEACHER: "Teacher",
        }.get(role, "Staff")

        user = User.objects.create_user(
            phone=phone,
            password=phone,   # login with phone as both username and password
            name=name,
            email=f"{first.lower()}.{last.lower()}{index}@schoolwise.test",
            gender=gender,
            birth_date=date(random.randint(1975, 1995), random.randint(1, 12), random.randint(1, 28)),
            role=role,
            staff_id=staff_id,
            designation=designation,
            is_staff=True,
            is_active=True,
        )
        return user

    def _assign_class_teachers(self, created_by_id, dry_run):
        """Assign some CLASS_TEACHER users to classes in the active year."""
        year = AcademicYear.objects.filter(status="active").first()
        if not year:
            self.stdout.write(self.style.WARNING(
                "No active academic year — skipping class teacher assignments."
            ))
            return

        classes = list(ClassRoom.objects.filter(academic_year=year).order_by("name"))
        if not classes:
            self.stdout.write(self.style.WARNING(
                "No classes in the active year — skipping class teacher assignments."
            ))
            return

        candidates = created_by_id.get(UserRole.CLASS_TEACHER, [])
        if not candidates:
            # Fall back to using plain teachers if we don't have enough class teachers
            candidates = created_by_id.get(UserRole.TEACHER, [])

        if not candidates:
            return

        if dry_run:
            self.stdout.write(f"  would assign class teachers to {len(classes)} classes.")
            return

        assigned = 0
        with transaction.atomic():
            for cls in classes:
                if cls.class_teacher_id:
                    continue
                if not candidates:
                    break
                teacher = candidates[assigned % len(candidates)]
                cls.class_teacher = teacher
                cls.save(update_fields=["class_teacher"])
                assigned += 1

        self.stdout.write(self.style.SUCCESS(
            f"Assigned class teachers to {assigned} of {len(classes)} classes."
        ))
