import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import User

# Update the main admin user with some sample data
admin = User.objects.filter(phone="0712345678").first()
if admin:
    admin.first_name = "Super"
    admin.last_name = "Admin"
    admin.gender = "Male"
    admin.birth_date = "1990-01-01"
    admin.save()
    print("Updated admin user profile.")
else:
    print("Admin user not found.")
