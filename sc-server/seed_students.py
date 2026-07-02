import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import User
from apps.academics.models import ClassRoom
from apps.students.models import Student

def seed():
    print("Seeding Classes...")
    classes_data = [
        {"id": "cls-1", "name": "PP1 A", "grade_level": "PP1", "stream": "A", "curriculum": "CBC", "capacity": 30, "room": "B1", "academic_year": 2026},
        {"id": "cls-2", "name": "PP2 A", "grade_level": "PP2", "stream": "A", "curriculum": "CBC", "capacity": 32, "room": "B2", "academic_year": 2026},
        {"id": "cls-3", "name": "Grade 4 A", "grade_level": "Grade 4", "stream": "A", "curriculum": "CBC", "capacity": 40, "room": "C1", "academic_year": 2026},
        {"id": "cls-4", "name": "Grade 6 A", "grade_level": "Grade 6", "stream": "A", "curriculum": "CBC", "capacity": 38, "room": "C2", "academic_year": 2026},
        {"id": "cls-5", "name": "Grade 8 A", "grade_level": "Grade 8", "stream": "A", "curriculum": "CBC", "capacity": 35, "room": "C3", "academic_year": 2026},
        {"id": "cls-6", "name": "Form 1 A", "grade_level": "Form 1", "stream": "A", "curriculum": "844", "capacity": 45, "room": "D1", "academic_year": 2026},
        {"id": "cls-7", "name": "Form 2 A", "grade_level": "Form 2", "stream": "A", "curriculum": "844", "capacity": 45, "room": "D2", "academic_year": 2026},
        {"id": "cls-8", "name": "Form 4 A", "grade_level": "Form 4", "stream": "A", "curriculum": "844", "capacity": 40, "room": "D4", "academic_year": 2026},
    ]

    for c_data in classes_data:
        ClassRoom.objects.update_or_create(
            id=c_data["id"],
            defaults={
                "name": c_data["name"],
                "grade_level": c_data["grade_level"],
                "stream": c_data["stream"],
                "curriculum": c_data["curriculum"],
                "capacity": c_data["capacity"],
                "room": c_data["room"],
                "academic_year": c_data["academic_year"],
            }
        )
    print(f"Seeded {len(classes_data)} classes.")

    print("Seeding Students...")
    # Named students from mockData.ts
    named_students = [
        ["std-1", "ADM-2026-0001", "Amina", "Wanjiru", "Kamau", "Female", "cls-3"],
        ["std-2", "ADM-2026-0002", "Brian", "Otieno", "Odhiambo", "Male", "cls-7"],
        ["std-3", "ADM-2026-0003", "Christine", "Njeri", "Mwangi", "Female", "cls-8"],
        ["std-4", "ADM-2026-0004", "Dennis", "Kipchoge", "Rotich", "Male", "cls-4"],
        ["std-5", "ADM-2026-0005", "Esther", "Adhiambo", "Were", "Female", "cls-1"],
        ["std-6", "ADM-2023-0018", "Francis", "Muthomi", "Njogu", "Male", "cls-6"],
        ["std-7", "ADM-2026-0007", "Grace", "Wambui", "Ndungu", "Female", "cls-5"],
        ["std-8", "ADM-2022-0031", "Hassan", "Musa", "Abdi", "Male", "cls-8"],
        ["std-9", "ADM-2026-0009", "Irene", "Chebet", "Kiptoo", "Female", "cls-3"],
        ["std-10", "ADM-2023-0022", "James", "Njoroge", "Muigai", "Male", "cls-7"],
        ["std-11", "ADM-2026-0011", "Kelvin", "Waweru", "Thuo", "Male", "cls-4"],
        ["std-12", "ADM-2021-0045", "Lydia", "Muthoni", "Kinyua", "Female", "cls-8"],
        ["std-13", "ADM-2026-0013", "Martin", "Ochieng", "Otieno", "Male", "cls-2"],
        ["std-14", "ADM-2023-0028", "Nancy", "Wairimu", "Mwangi", "Female", "cls-6"],
        ["std-15", "ADM-2026-0015", "Oliver", "Kimani", "Njuguna", "Male", "cls-3"],
    ]

    # Sample data for generation (matching mockData.ts)
    FIRST_NAMES_M = ["Brian", "Dennis", "Francis", "Hassan", "James", "Kelvin", "Martin", "Oliver", "Peter", "Samuel"]
    FIRST_NAMES_F = ["Amina", "Christine", "Esther", "Grace", "Irene", "Lydia", "Nancy", "Purity", "Rose", "Sharon"]
    LAST_NAMES = ["Kamau", "Odhiambo", "Mwangi", "Rotich", "Were", "Njogu", "Ndungu", "Abdi", "Kiptoo", "Muigai"]
    LOCATIONS = ["Milimani", "Section 58", "Kiamunyi", "London", "Free Area"]

    import random
    random.seed(20260611)

    students_list = []
    for s_data in named_students:
        students_list.append(s_data)
    
    for i in range(16, 41):
        gender = "Male" if random.random() > 0.5 else "Female"
        first = random.choice(FIRST_NAMES_M if gender == "Male" else FIRST_NAMES_F)
        other = random.choice(["Wambui", "Otieno", "Njeri", "Kipchoge", "Adhiambo"])
        last = random.choice(LAST_NAMES)
        class_id = random.choice([c["id"] for c in classes_data])
        adm = f"ADM-2026-{i:04d}"
        students_list.append([f"std-{i}", adm, first, other, last, gender, class_id])

    for s_info in students_list:
        sid, adm, first, other, last, gender, cid = s_info
        classroom = ClassRoom.objects.get(id=cid)
        
        # Parent fields (matching mockData.ts logic)
        father_name = f"Mr. {random.choice(['Stephen', 'Joseph', 'Patrick'])} {last}"
        mother_name = f"Mrs. {random.choice(['Jane', 'Lucy', 'Catherine'])} {last}"
        primary_name = father_name if random.random() > 0.5 else mother_name
        
        Student.objects.update_or_create(
            id=sid,
            defaults={
                "first_name": first,
                "last_name": last,
                "other_name": other,
                "admission_number": adm,
                "gender": gender,
                "date_of_birth": "2012-05-15", # Placeholder or logical
                "grade_level": classroom.grade_level,
                "class_room": classroom,
                "curriculum": classroom.curriculum,
                "admission_date": "2026-01-10",
                "status": "active",
                "boarding_status": "boarding" if random.random() > 0.7 else "day",
                "fee_balance": Decimal(random.choice(["0.00", "3500.00", "12500.00", "18000.00", "-2000.00"])),
                "father_name": father_name,
                "father_phone": f"07{random.randint(10000000, 99999999)}",
                "mother_name": mother_name,
                "mother_phone": f"07{random.randint(10000000, 99999999)}",
                "primary_contact_name": primary_name,
                "primary_contact_phone": f"07{random.randint(10000000, 99999999)}",
                "home_location": random.choice(LOCATIONS),
            }
        )
    print(f"Seeded {len(students_list)} students.")

    # Link parents to users if they exist
    parent_user = User.objects.filter(role="parent").first()
    if parent_user:
        # Link 3 students to usr-5 (Stephen Kamau) to match mockData.ts
        s1 = Student.objects.filter(id="std-1").first()
        s3 = Student.objects.filter(id="std-3").first()
        s7 = Student.objects.filter(id="std-7").first()
        if s1: s1.guardians.add(parent_user)
        if s3: s3.guardians.add(parent_user)
        if s7: s7.guardians.add(parent_user)
        print(f"Linked students std-1, std-3, std-7 to parent {parent_user.phone}")

if __name__ == "__main__":
    seed()
