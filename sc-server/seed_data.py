import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.staff.models import Staff

def seed():
    # 1. Ensure User exists
    user, created = User.objects.get_or_create(
        phone="0712345678",
        defaults={
            "name": "Luka Developer",
            "role": "admin",
            "is_staff": True,
            "is_superuser": True
        }
    )
    
    if created:
        user.set_password("admin123")
    
    user.first_name = "Luka"
    user.last_name = "Developer"
    user.gender = "Male"
    user.birth_date = "1995-05-15"
    user.save()
    
    # 2. Ensure Staff profile exists
    staff, created = Staff.objects.get_or_create(
        user=user,
        defaults={
            "staff_id": "STF-001",
            "designation": "Principal",
            "joining_date": "2023-01-01",
            "id_number": "28701202",
        }
    )
    
    staff.staff_id = "STF-001" # Ensure format is correct
    staff.designation = "Principal"
    staff.department = "Administration"
    staff.specialization = "Mathematics & Physics"
    staff.status = "active"
    staff.contract_type = "permanent"
    staff.nssf_number = "NSSF-998877"
    staff.nhif_number = "NHIF-112233"
    staff.shif_number = "SHIF-556677"
    staff.kra_pin = "A001234567Z"
    staff.basic_salary = Decimal("120000.00")
    staff.save()
    
    print(f"Successfully seeded data for {user.phone}")
    print(f"User: {user.first_name} {user.last_name}")
    print(f"Staff ID: {staff.staff_id}")

if __name__ == "__main__":
    seed()
