import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# Since settings.py is under config/ settings, BASE_DIR points to the root directory (sc-server).
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-d2ebh277b#xb!o%0z+n2)toz3o=o^_4_ygq1(16-j0tu27dugq")

DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "primapi.cresbyte.com",
    "primrose.cresbyte.com",
    "72.62.182.26",
    "*",
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    # Local apps
    "core",
    "academics",
    "exams",
    "attendance",
    "apps.payroll",
    "apps.messaging",
    "apps.notifications",
    "apps.website",
    "fees",
    "school",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # must be first
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "core.User"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/min",
        "password_reset": "10/hour",
        "password_reset_confirm": "20/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "core.serializers.CustomTokenObtainPairSerializer",
}

# Database settings
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# CORS & CSRF Settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://72.62.182.26:8082",
    "https://primrose.cresbyte.com",
    "https://primapi.cresbyte.com",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://72.62.182.26:8082",
    "https://primrose.cresbyte.com",
    "https://primapi.cresbyte.com",
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

# Email Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.zoho.com")
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "peter@cresbyte.com")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "n_Hxqv8k")
EMAIL_TIMEOUT = 10

# Zoho rejects mail where "from" differs from the logged-in address
DEFAULT_FROM_EMAIL = f"Shule Smart <{EMAIL_HOST_USER}>"
SERVER_EMAIL = EMAIL_HOST_USER

# Reverse Proxy / SSL configuration
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ── M-Pesa Daraja ──────────────────────────────────────────────────────────
MPESA_BASE_URL = "https://sandbox.safaricom.co.ke"
MPESA_CONSUMER_KEY = "AYbVQZbEGbPOhmRbnRsOhsTl30Y8xYM3TVuJQuh6E3AaJrE1"
MPESA_CONSUMER_SECRET = (
    "D5qB6Lx6xUFtKmzzFl0DA8wUxX4x24AdGLZWOlG0lDoIX7hrxbgD0PRWSGU0Xuxe"
)
MPESA_SHORTCODE = "174379"
MPESA_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
MPESA_CALLBACK_URL = "https://33df-102-0-28-188.ngrok-free.app/api/fees/mpesa/callback/"
# ────────────────────────────────────────────────────────────────────────────
