from .settings import *  # noqa: F403


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "e2e.sqlite3",  # noqa: F405
    }
}

DEBUG = True
SECRET_KEY = "django-insecure-e2e-only"
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
BDM_IMAGE_ROOT = str(BASE_DIR / ".e2e-images")  # noqa: F405
