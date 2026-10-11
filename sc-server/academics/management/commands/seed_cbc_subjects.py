"""
Seed the CBC subjects for a Kenyan school.

    python manage.py seed_cbc_subjects
    python manage.py seed_cbc_subjects --wipe        # delete all first
    python manage.py seed_cbc_subjects --dry-run     # show what would change

Idempotent: running it twice updates existing rows (keyed by code) instead of
creating duplicates. Safe to re-run after CBC updates the syllabus.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from school.models import GradeLevel
from academics.models import Subject

# Structure: (name, code, [grades], is_core, learning_area)
CBC_SUBJECTS = [
    # ----------------------------------------------------------------
    # Pre-Primary (PP1, PP2)
    # ----------------------------------------------------------------
    ("Language Activities", "LANG-PP", ["PP1", "PP2"], True, "languages"),
    ("Mathematical Activities", "MATH-PP", ["PP1", "PP2"], True, "mathematics"),
    ("Environmental Activities", "ENV-PP", ["PP1", "PP2"], True, "sciences"),
    ("Psychomotor & Creative Activities", "PSY-PP", ["PP1", "PP2"], True, "creative"),
    ("Religious Activities", "REL-PP", ["PP1", "PP2"], False, "religious"),

    # ----------------------------------------------------------------
    # Lower Primary (Grade 1–3)
    # ----------------------------------------------------------------
    ("English Activities", "ENG-L", ["Grade 1", "Grade 2", "Grade 3"], True, "languages"),
    ("Kiswahili Activities", "KIS-L", ["Grade 1", "Grade 2", "Grade 3"], True, "languages"),
    ("Mathematics", "MATH-L", ["Grade 1", "Grade 2", "Grade 3"], True, "mathematics"),
    ("Environmental Activities", "ENV-L", ["Grade 1", "Grade 2", "Grade 3"], True, "sciences"),
    ("Creative Activities", "CRE-L", ["Grade 1", "Grade 2", "Grade 3"], True, "creative"),
    ("Religious Education", "RE-L", ["Grade 1", "Grade 2", "Grade 3"], False, "religious"),
    ("Indigenous Language", "IND-L", ["Grade 1", "Grade 2", "Grade 3"], False, "languages"),

    # ----------------------------------------------------------------
    # Upper Primary (Grade 4–6)
    # ----------------------------------------------------------------
    ("English", "ENG-U", ["Grade 4", "Grade 5", "Grade 6"], True, "languages"),
    ("Kiswahili", "KIS-U", ["Grade 4", "Grade 5", "Grade 6"], True, "languages"),
    ("Mathematics", "MATH-U", ["Grade 4", "Grade 5", "Grade 6"], True, "mathematics"),
    ("Science & Technology", "SCI-U", ["Grade 4", "Grade 5", "Grade 6"], True, "sciences"),
    ("Social Studies", "SST-U", ["Grade 4", "Grade 5", "Grade 6"], True, "social_sciences"),
    ("Agriculture", "AGR-U", ["Grade 4", "Grade 5", "Grade 6"], True, "technical"),
    ("Creative Arts", "CRA-U", ["Grade 4", "Grade 5", "Grade 6"], True, "creative"),
    ("Religious Education", "RE-U", ["Grade 4", "Grade 5", "Grade 6"], False, "religious"),
    ("Indigenous Language", "IND-U", ["Grade 4", "Grade 5", "Grade 6"], False, "languages"),
    ("Foreign Language", "FOR-U", ["Grade 4", "Grade 5", "Grade 6"], False, "languages"),

    # ----------------------------------------------------------------
    # Junior School (Grade 7–9)
    # ----------------------------------------------------------------
    ("English", "ENG-J", ["Grade 7", "Grade 8", "Grade 9"], True, "languages"),
    ("Kiswahili / KSL", "KIS-J", ["Grade 7", "Grade 8", "Grade 9"], True, "languages"),
    ("Mathematics", "MATH-J", ["Grade 7", "Grade 8", "Grade 9"], True, "mathematics"),
    ("Integrated Science", "SCI-J", ["Grade 7", "Grade 8", "Grade 9"], True, "sciences"),
    ("Health Education", "HE-J", ["Grade 7", "Grade 8", "Grade 9"], True, "life_skills"),
    ("Social Studies", "SST-J", ["Grade 7", "Grade 8", "Grade 9"], True, "social_sciences"),
    ("Religious Education", "RE-J", ["Grade 7", "Grade 8", "Grade 9"], False, "religious"),
    ("Business Studies", "BUS-J", ["Grade 7", "Grade 8", "Grade 9"], True, "social_sciences"),
    ("Agriculture", "AGR-J", ["Grade 7", "Grade 8", "Grade 9"], True, "technical"),
    ("Pre-Technical Studies", "PRE-J", ["Grade 7", "Grade 8", "Grade 9"], True, "technical"),
    ("Creative Arts & Sports", "CAS-J", ["Grade 7", "Grade 8", "Grade 9"], True, "creative"),
    ("Life Skills Education", "LSE-J", ["Grade 7", "Grade 8", "Grade 9"], True, "life_skills"),
    ("Foreign / Indigenous Language", "LAN-J", ["Grade 7", "Grade 8", "Grade 9"], False, "languages"),

    # ----------------------------------------------------------------
    # Senior School (Grade 10–12) — pathway-aware, kept here so schools
    # can enable them when they start offering senior grades.
    # ----------------------------------------------------------------
    ("English", "ENG-S", ["Grade 10", "Grade 11", "Grade 12"], True, "languages"),
    ("Kiswahili", "KIS-S", ["Grade 10", "Grade 11", "Grade 12"], True, "languages"),
    ("Mathematics", "MATH-S", ["Grade 10", "Grade 11", "Grade 12"], True, "mathematics"),
    ("Biology", "BIO-S", ["Grade 10", "Grade 11", "Grade 12"], False, "sciences"),
    ("Chemistry", "CHEM-S", ["Grade 10", "Grade 11", "Grade 12"], False, "sciences"),
    ("Physics", "PHY-S", ["Grade 10", "Grade 11", "Grade 12"], False, "sciences"),
    ("General Science", "GSC-S", ["Grade 10", "Grade 11", "Grade 12"], False, "sciences"),
    ("History & Citizenship", "HIS-S", ["Grade 10", "Grade 11", "Grade 12"], False, "social_sciences"),
    ("Geography", "GEO-S", ["Grade 10", "Grade 11", "Grade 12"], False, "social_sciences"),
    ("Christian Religious Education", "CRE-S", ["Grade 10", "Grade 11", "Grade 12"], False, "religious"),
    ("Islamic Religious Education", "IRE-S", ["Grade 10", "Grade 11", "Grade 12"], False, "religious"),
    ("Hindu Religious Education", "HRE-S", ["Grade 10", "Grade 11", "Grade 12"], False, "religious"),
    ("Business Studies", "BUS-S", ["Grade 10", "Grade 11", "Grade 12"], False, "social_sciences"),
    ("Agriculture", "AGR-S", ["Grade 10", "Grade 11", "Grade 12"], False, "technical"),
    ("Computer Studies", "CMP-S", ["Grade 10", "Grade 11", "Grade 12"], False, "technical"),
    ("Home Science", "HSC-S", ["Grade 10", "Grade 11", "Grade 12"], False, "technical"),
    ("Art & Design", "ART-S", ["Grade 10", "Grade 11", "Grade 12"], False, "creative"),
    ("Music & Dance", "MUS-S", ["Grade 10", "Grade 11", "Grade 12"], False, "creative"),
    ("Physical Education", "PE-S", ["Grade 10", "Grade 11", "Grade 12"], False, "creative"),
    ("Theatre & Film", "THF-S", ["Grade 10", "Grade 11", "Grade 12"], False, "creative"),
    ("Kenya Sign Language", "KSL-S", ["Grade 10", "Grade 11", "Grade 12"], False, "languages"),
    ("Indigenous Language", "IND-S", ["Grade 10", "Grade 11", "Grade 12"], False, "languages"),
    ("Foreign Language", "FOR-S", ["Grade 10", "Grade 11", "Grade 12"], False, "languages"),
]


class Command(BaseCommand):
    help = "Seed the CBC subjects per grade level. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--wipe", action="store_true", help="Delete all subjects first."
        )
        parser.add_argument(
            "--dry-run", action="store_true", help="Preview without writing."
        )

    def handle(self, *args, **options):
        wipe = options["wipe"]
        dry_run = options["dry_run"]

        # Build a name → GradeLevel map once
        name_to_grade = {g.name: g for g in GradeLevel.objects.all()}
        if not name_to_grade:
            self.stdout.write(
                self.style.ERROR("No GradeLevel rows exist. Create grades first.")
            )
            return

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))

        created = updated = 0

        with transaction.atomic():
            if wipe:
                count = Subject.objects.count()
                if not dry_run:
                    Subject.objects.all().delete()
                self.stdout.write(self.style.WARNING(f"Deleted {count} subject(s)."))

            for name, code, grades, is_core, area in CBC_SUBJECTS:
                missing = [g for g in grades if g not in name_to_grade]
                if dry_run:
                    self.stdout.write(
                        f"  [{code}] {name} — grades: {grades} (missing: {missing})"
                    )
                    continue

                subject, was_created = Subject.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": name,
                        "is_core": is_core,
                        "learning_area": area,
                    },
                )
                grade_objs = [name_to_grade[g] for g in grades if g in name_to_grade]
                subject.grade_levels.set(grade_objs)

                if was_created:
                    created += 1
                else:
                    updated += 1

                if missing:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  {code}: skipped missing grades {missing}"
                        )
                    )

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done. Created {created}, updated {updated}, total {Subject.objects.count()}."
                )
            )
