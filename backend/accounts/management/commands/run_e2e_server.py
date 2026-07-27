from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User


E2E_USER_EMAIL = "e2e-user@example.com"
E2E_SUPER_ADMIN_EMAIL = "e2e-super-admin@example.com"
E2E_USER_PASSWORD = "S3cure!Passphrase-7746"


def ensure_isolated_e2e_database():
    database = settings.DATABASES["default"]
    expected_name = (settings.BASE_DIR / "e2e.sqlite3").resolve()
    actual_name = Path(database["NAME"]).resolve()

    if (
        database["ENGINE"] != "django.db.backends.sqlite3"
        or actual_name != expected_name
    ):
        raise CommandError(
            "run_e2e_server는 격리된 backend/e2e.sqlite3에서만 "
            "실행할 수 있습니다."
        )


def create_e2e_user(*, email, nickname, role):
    user = User(
        email=email,
        nickname=nickname,
        role=role,
        company_id=1,
        company_name="E2E Company",
        status=User.STATUS_ACTIVE,
    )
    user.set_password(E2E_USER_PASSWORD)
    user.save()


class Command(BaseCommand):
    help = "Prepare the isolated E2E database and run the Django test server."

    def handle(self, *args, **options):
        ensure_isolated_e2e_database()
        call_command("migrate", interactive=False, verbosity=0)
        call_command("flush", interactive=False, verbosity=0)

        create_e2e_user(
            email=E2E_USER_EMAIL,
            nickname="E2E 사용자",
            role=User.ROLE_USER,
        )
        create_e2e_user(
            email=E2E_SUPER_ADMIN_EMAIL,
            nickname="E2E 최고 관리자",
            role=User.ROLE_SUPER_ADMIN,
        )

        call_command(
            "runserver",
            "127.0.0.1:8766",
            use_reloader=False,
        )
