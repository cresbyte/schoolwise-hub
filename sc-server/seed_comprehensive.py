import os
import django
import requests
from decimal import Decimal
from django.core.files.base import ContentFile
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import User
from apps.staff.models import Staff

def download_avatar(url, filename):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return ContentFile(response.content, name=filename)
    except Exception as e:
        print(f"Failed to download {url}: {e}")
    return None

def seed():
    # Define users from mockData.ts
    mock_users = [
        { "id": "usr-1", "name": "Daniel Kamau", "email": "principal@primroseacademy.ac.ke", "phone": "0712345678", "role": "admin", "staffId": "stf-1", "password": "admin123" },
        { "id": "usr-2", "name": "Joseph Mutua", "email": "deputy@primroseacademy.ac.ke", "phone": "0711234567", "role": "headteacher", "staffId": "stf-11", "password": "head123" },
        { "id": "usr-3", "name": "John Mutua", "email": "j.kivuva@primroseacademy.ac.ke", "phone": "0722345678", "role": "class_teacher", "staffId": "stf-3", "password": "teacher123" },
        { "id": "usr-4", "name": "Agnes Njoki", "email": "accounts@primroseacademy.ac.ke", "phone": "0733456789", "role": "accountant", "staffId": "stf-6", "password": "accounts123" },
        { "id": "usr-5", "name": "Stephen Kamau", "email": "parent.kamau@gmail.com", "phone": "0744567890", "role": "parent", "password": "parent123" },
        { "id": "usr-6", "name": "Lucy Mwangi", "email": "parent.mwangi@gmail.com", "phone": "0755123456", "role": "parent", "password": "parent456" },
        { "id": "usr-7", "name": "Alice Wanjiku", "email": "a.wanjiku@primroseacademy.ac.ke", "phone": "0766123401", "role": "teacher", "staffId": "stf-7", "password": "teacher123" },
        { "id": "usr-8", "name": "Peter Omondi", "email": "p.omondi@primroseacademy.ac.ke", "phone": "0766123402", "role": "teacher", "staffId": "stf-8", "password": "teacher123" },
        { "id": "usr-9", "name": "Mary Atieno", "email": "m.atieno@primroseacademy.ac.ke", "phone": "0766123403", "role": "teacher", "staffId": "stf-9", "password": "teacher123" },
        { "id": "usr-10", "name": "David Kiprono", "email": "d.kiprono@primroseacademy.ac.ke", "phone": "0766123404", "role": "teacher", "staffId": "stf-10", "password": "teacher123" },
        { "id": "usr-11", "name": "Sarah Nekesa", "email": "s.nekesa@primroseacademy.ac.ke", "phone": "0766123405", "role": "teacher", "staffId": "stf-12", "password": "teacher123" },
        { "id": "usr-12", "name": "James Njoroge", "email": "j.njoroge@primroseacademy.ac.ke", "phone": "0766123406", "role": "teacher", "staffId": "stf-13", "password": "teacher123" },
        { "id": "usr-13", "name": "Grace Nduta", "email": "g.nduta@primroseacademy.ac.ke", "phone": "0766123407", "role": "teacher", "staffId": "stf-14", "password": "teacher123" },
        { "id": "usr-14", "name": "Michael Odhiambo", "email": "m.odhiambo@primroseacademy.ac.ke", "phone": "0766123408", "role": "teacher", "staffId": "stf-15", "password": "teacher123" },
        { "id": "usr-15", "name": "Jane Wambui", "email": "j.wambui@primroseacademy.ac.ke", "phone": "0766123409", "role": "teacher", "staffId": "stf-16", "password": "teacher123" },
        { "id": "usr-16", "name": "Samuel Kipkemboi", "email": "s.kipkemboi@primroseacademy.ac.ke", "phone": "0766123410", "role": "teacher", "staffId": "stf-17", "password": "teacher123" },
    ]

    # Define staff details from mockData.ts
    mock_staff = {
        "stf-1": { "staff_id": "STF-001", "first": "Daniel", "last": "Kamau", "gender": "Male", "designation": "Principal", "salary": 85000, "id_number": "28701202" },
        "stf-11": { "staff_id": "STF-011", "first": "Joseph", "last": "Mutua", "gender": "Male", "designation": "Deputy Principal", "salary": 65000, "id_number": "28701211" },
        "stf-3": { "staff_id": "STF-003", "first": "John", "last": "Mutua", "gender": "Male", "designation": "Mathematics Teacher", "salary": 45000, "id_number": "28701203" },
        "stf-6": { "staff_id": "STF-006", "first": "Agnes", "last": "Njoki", "gender": "Female", "designation": "Accountant", "salary": 38000, "id_number": "28701206" },
        "stf-7": { "staff_id": "STF-007", "first": "Alice", "last": "Wanjiku", "gender": "Female", "designation": "English Teacher", "salary": 40000, "id_number": "28701207" },
        "stf-8": { "staff_id": "STF-008", "first": "Peter", "last": "Omondi", "gender": "Male", "designation": "Science Teacher", "salary": 41000, "id_number": "28701208" },
        "stf-9": { "staff_id": "STF-009", "first": "Mary", "last": "Atieno", "gender": "Female", "designation": "Kiswahili Teacher", "salary": 39000, "id_number": "28701209" },
        "stf-10": { "staff_id": "STF-010", "first": "David", "last": "Kiprono", "gender": "Male", "designation": "History Teacher", "salary": 42000, "id_number": "28701210" },
        "stf-12": { "staff_id": "STF-012", "first": "Sarah", "last": "Nekesa", "gender": "Female", "designation": "Geography Teacher", "salary": 40500, "id_number": "28701212" },
        "stf-13": { "staff_id": "STF-013", "first": "James", "last": "Njoroge", "gender": "Male", "designation": "Physics Teacher", "salary": 43000, "id_number": "28701213" },
        "stf-14": { "staff_id": "STF-014", "first": "Grace", "last": "Nduta", "gender": "Female", "designation": "Biology Teacher", "salary": 41500, "id_number": "28701214" },
        "stf-15": { "staff_id": "STF-015", "first": "Michael", "last": "Odhiambo", "gender": "Male", "designation": "Chemistry Teacher", "salary": 44000, "id_number": "28701215" },
        "stf-16": { "staff_id": "STF-016", "first": "Jane", "last": "Wambui", "gender": "Female", "designation": "CRE Teacher", "salary": 39500, "id_number": "28701216" },
        "stf-17": { "staff_id": "STF-017", "first": "Samuel", "last": "Kipkemboi", "gender": "Male", "designation": "Agriculture Teacher", "salary": 40000, "id_number": "28701217" },
    }

    for u_data in mock_users:
        user, created = User.objects.get_or_create(
            phone=u_data["phone"],
            defaults={
                "email": u_data["email"],
                "name": u_data["name"],
                "role": u_data["role"],
                "is_active": True,
            }
        )
        if created or user:
            user.set_password(u_data["password"])
            # Split name if not set
            names = u_data["name"].split(" ")
            user.first_name = names[0]
            user.last_name = names[-1]
            user.gender = "Male" if "Mr." in u_data["name"] else "Female"
            user.save()
            print(f"{'Created' if created else 'Updated'} user: {user.phone}")

        # If user has a staff profile
        if "staffId" in u_data and u_data["staffId"] in mock_staff:
            s_data = mock_staff[u_data["staffId"]]
            staff, s_created = Staff.objects.get_or_create(
                user=user,
                defaults={
                    "staff_id": s_data["staff_id"],
                    "designation": s_data["designation"],
                    "joining_date": "2023-01-10",
                    "id_number": s_data["id_number"],
                }
            )
            
            # Additional details from the mkStaff logic in mockData.ts
            staff.first_name = s_data["first"] # Fallback if needed, though we use user.first_name
            staff.basic_salary = Decimal(str(s_data["salary"]))
            staff.status = "active"
            staff.contract_type = "permanent"
            staff.kra_pin = f"A0{u_data['phone'][-8:]}Z"
            
            # Download avatar
            avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.first_name}_{user.last_name}"
            avatar_file = download_avatar(avatar_url, f"{user.id}_avatar.svg")
            if avatar_file:
                staff.photo = avatar_file
                
            staff.save()
            print(f"  {'Created' if s_created else 'Updated'} staff profile: {staff.staff_id}")

if __name__ == "__main__":
    seed()
