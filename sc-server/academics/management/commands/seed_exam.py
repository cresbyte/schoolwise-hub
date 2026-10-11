"""
Create a test exam for the current year and one class's marks.

    python manage.py seed_exam
    python manage.py seed_exam --exam-name "End of Term 2" --term 2
"""

import random
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from academics.models import ClassRoom, Enrollment, Subject
from core.models import User
from exams.models import Exam, ExamComment, ExamSubject, Mark
from school.models import AcademicYear, GradeLevel, Term


class Command(BaseCommand):
    help = "Seed one exam with subjects and marks for testing."

    def add_arguments(self, parser):
        parser.add_argument("--exam-name", default="End of Term Test")
        parser.add_argument("--term", type=int, default=None)
        parser.add_argument("--wipe", action="store_true")

    def handle(self, *args, **opts):
        year = AcademicYear.objects.filter(status="active").first()
        if not year:
            raise CommandError("No active academic year.")
        term = (
            Term.objects.filter(academic_year=year, number=opts["term"]).first()
            if opts["term"]
            else Term.objects.filter(academic_year=year, is_current=True).first()
        )
        if not term:
            raise CommandError("No term found.")

        admin = User.objects.filter(role="admin").first()
        if opts["wipe"]:
            Exam.objects.filter(academic_year=year).delete()
            self.stdout.write(self.style.WARNING("Wiped existing exams."))

        with transaction.atomic():
            exam, _ = Exam.objects.get_or_create(
                name=opts["exam_name"],
                academic_year=year,
                term=term,
                defaults={
                    "start_date": term.start_date,
                    "end_date": term.end_date,
                    "status": Exam.Status.DRAFT,
                    "created_by": admin,
                },
            )
            self.stdout.write(f"Exam: {exam}")

            # Pick grade levels that have classes in this year
            grades = sorted(
                {c.grade_level_id for c in ClassRoom.objects.filter(academic_year=year)}
            )
            grade_objs = GradeLevel.objects.filter(name__in=grades)
            exam.grade_levels.set(grade_objs)
            self.stdout.write(f"Grades: {', '.join(grades)}")

            # Add subjects per grade
            created = 0
            for g in grades:
                for s in Subject.objects.filter(grade_levels__name=g):
                    obj, was = ExamSubject.objects.get_or_create(
                        exam=exam,
                        grade_level_id=g,
                        subject=s,
                        defaults={
                            "max_mark": 100,
                            "grading_scale": s.grading_scale or [],
                        },
                    )
                    if was:
                        created += 1
            self.stdout.write(f"Exam subjects created: {created}")

            # Open for marks
            exam.status = Exam.Status.OPEN
            exam.save(update_fields=["status"])

            # Enter marks for every enrolled student
            mark_count = 0
            for es in ExamSubject.objects.filter(exam=exam).select_related("subject"):
                students = Enrollment.objects.filter(
                    class_room__academic_year=year,
                    class_room__grade_level_id=es.grade_level_id,
                    status=Enrollment.Status.ACTIVE,
                ).values_list("student_id", flat=True)
                for sid in students:
                    score = Decimal(str(random.randint(35, 98)))
                    g, points = es.compute_grade(score)
                    Mark.objects.update_or_create(
                        exam_subject=es,
                        student_id=sid,
                        defaults={
                            "score": score,
                            "grade": g or "",
                            "points": points,
                            "comment": es.default_comment_for(score),
                            "entered_by": admin,
                        },
                    )
                    mark_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Entered {mark_count} marks. Exam status: {exam.status}."
                )
            )
