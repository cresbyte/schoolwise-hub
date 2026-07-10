import os
import sys

# Set up the path to your project
# Replace 'luka' if your cPanel username is different on Namecheap
# But usually, it's relative to the home directory.
sys.path.insert(0, os.path.dirname(__file__))

# Set the Django settings module
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"

# Import the WSGI application
from config.wsgi import application
