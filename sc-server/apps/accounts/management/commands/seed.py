from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.school.models import School
from apps.staff.models import Staff
from apps.academics.models import ClassRoom, Subject
from apps.students.models import Student
from apps.accounts.models import UserRole
import random
from datetime import date, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = "Seed database with realistic mock data matching the frontend."

    def handle(self, *args, **options):
        self.stdout.write("Clearing existing data...")
        Student.objects.all().delete()
        Staff.objects.all().delete()
        ClassRoom.objects.all().delete()
        Subject.objects.all().delete()
        User.objects.all().delete()
        School.objects.all().delete()
        
        self.stdout.write("Seeding data...")
        
        # 1. School
        school, _ = School.objects.get_or_create(
            name="Primrose Private Academy",
            defaults={
                "motto": "Knowledge · Integrity · Excellence",
                "address": "Milimani Road, Nakuru Town",
                "phone": "0712345678",
                "email": "info@primroseacademy.ac.ke",
                "website": "www.primroseacademy.ac.ke",
                "current_term": 2,
                "current_year": 2026,
                "academic_system": "CBC",
                "paybill_number": "522533"
            }
        )

        # 2. Subjects
        subjects_data = [
            ("Mathematics", "MATH"), ("English", "ENG"), ("Kiswahili", "KISW"),
            ("Science", "SCI"), ("Social Studies", "SOC"), ("CRE", "CRE"),
            ("Physical Education", "PE"), ("Art & Craft", "ART")
        ]
        subjects = {}
        for name, code in subjects_data:
            subjects[code], _ = Subject.objects.get_or_create(code=code, defaults={"name": name})

        # 3. Users & Staff
        # Credentials from frontend
        credentials = {
            "0712345678": ("admin123", "Mr. Daniel Kamau", UserRole.ADMIN, "stf-1", "Principal"),
            "0711234567": ("head123", "Mr. Joseph Mwangangi Mutua", UserRole.HEADTEACHER, "stf-11", "Deputy Principal"),
            "0722345678": ("teacher123", "Mr. John Mutua", UserRole.CLASS_TEACHER, "stf-3", "Mathematics Teacher"),
            "0733456789": ("accounts123", "Ms. Agnes Njoki", UserRole.ACCOUNTANT, "stf-6", "Accountant"),
        }

        staff_objects = {}
        for phone, (pwd, name, role, staff_id, designation) in credentials.items():
            user, created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    "name": name,
                    "role": role,
                    "is_staff": True if role != UserRole.PARENT else False
                }
            )
            if created:
                user.set_password(pwd)
                user.save()
            
            # Create Staff Profile
            staff_profile, _ = Staff.objects.get_or_create(
                user=user,
                defaults={
                    "staff_id": staff_id,
                    "designation": designation,
                    "joining_date": date(2023, 1, 1),
                    "id_number": str(random.randint(20000000, 39999999)),
                    "basic_salary": 45000 if role == UserRole.CLASS_TEACHER else 85000 if role == UserRole.ADMIN else 40000
                }
            )
            staff_objects[staff_id] = staff_profile

        # 4. Classes
        classes_data = [
            ("cls-1", "PP1 A", "PP1", "stf-2"),
            ("cls-2", "PP2 A", "PP2", "stf-10"),
            ("cls-3", "Grade 4 A", "Grade 4", "stf-7"),
            ("cls-4", "Grade 6 A", "Grade 6", "stf-7"),
            ("cls-6", "Form 1 A", "Form 1", "stf-3"),
        ]
        
        class_objects = {}
        for cid, name, level, teacher_id in classes_data:
            # Note: We might need more staff for the teacher links
            teacher = staff_objects.get(teacher_id)
            if not teacher:
                # Create dummy staff for missing ones
                u, _ = User.objects.get_or_create(
                    phone=f"07{random.randint(10000000, 99999999)}",
                    defaults={"name": f"Teacher {teacher_id}", "role": UserRole.CLASS_TEACHER}
                )
                teacher, _ = Staff.objects.get_or_create(
                    user=u,
                    defaults={"staff_id": teacher_id, "designation": "Teacher", "joining_date": date(2023, 1, 1), "id_number": str(random.randint(10000000, 99999999))}
                )
                staff_objects[teacher_id] = teacher

            classroom, _ = ClassRoom.objects.get_or_create(
                name=name,
                defaults={
                    "grade_level": level,
                    "class_teacher": teacher
                }
            )
            class_objects[cid] = classroom

        # 5. Parents & Students
        parents_data = [
            ("0744567890", "parent123", "Mr. Stephen Kamau", ["std-1", "std-3"]),
            ("0755123456", "parent456", "Mrs. Lucy Mwangi", ["std-4"]),
        ]
        
        students_data = [
            ("std-1", "ADM-2026-0001", "Amina Kamau", "female", "Grade 4", "cls-3"),
            ("std-3", "ADM-2026-0003", "Christine Mwangi", "female", "Grade 6", "cls-4"),
            ("std-4", "ADM-2026-0004", "Dennis Rotich", "male", "Grade 6", "cls-4"),
        ]

        # Create Students first
        student_objects = {}
        for sid, adm, name, gender, level, cid in students_data:
            student, _ = Student.objects.get_or_create(
                id=sid,
                defaults={
                    "name": name,
                    "admission_number": adm,
                    "gender": gender,
                    "grade_level": level,
                    "class_room": class_objects.get(cid),
                    "date_of_birth": date(2015, 1, 1)
                }
            )
            student_objects[sid] = student

        # Create Parents and link
        for phone, pwd, name, child_ids in parents_data:
            parent_user, created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    "name": name,
                    "role": UserRole.PARENT,
                }
            )
            if created:
                parent_user.set_password(pwd)
                parent_user.save()
            
            for cid in child_ids:
                if cid in student_objects:
                    student_objects[cid].guardians.add(parent_user)

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
