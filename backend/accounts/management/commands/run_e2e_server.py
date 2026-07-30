import os
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from accounts.models import (
    FeatureGroup,
    FeatureType,
    FeatureValue,
    ImageReference,
    User,
)


E2E_USER_EMAIL = "e2e-user@example.com"
E2E_SUPER_ADMIN_EMAIL = "e2e-super-admin@example.com"
E2E_USER_PASSWORD = "S3cure!Passphrase-7746"


def ensure_isolated_e2e_database():
    database = settings.DATABASES["default"]
    expected_name = settings.BASE_DIR / "e2e.sqlite3"
    actual_name = Path(database["NAME"])

    if (
        database["ENGINE"] != "django.db.backends.sqlite3"
        or os.path.abspath(actual_name) != os.path.abspath(expected_name)
        or actual_name.is_symlink()
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


def recreate_feature_tables():
    models = (
        FeatureGroup,
        FeatureType,
        FeatureValue,
        ImageReference,
    )
    existing_tables = set(connection.introspection.table_names())

    with connection.schema_editor() as schema_editor:
        for model in reversed(models):
            if model._meta.db_table in existing_tables:
                schema_editor.delete_model(model)
        for model in models:
            schema_editor.create_model(model)


def create_e2e_features():
    group = FeatureGroup.objects.create(
        feature_group_id=FeatureGroup.DOCUMENT_IMAGE_ID,
        feature="Document Image",
        description="문서에 포함된 시각적 객체 및 이미지 정보",
    )
    feature_type = FeatureType.objects.create(
        feature_group=group,
        feature_type_id=4,
        feature="Logo",
        description="문서에 포함된 기관 로고",
        physical_type="Raster image",
        semantic_role="Organization identity",
    )
    FeatureValue.objects.create(
        feature_group=group,
        feature_type=feature_type,
        feature_value_id=11,
        feature_type_name=feature_type.feature,
        feature="국가안보기관로고",
        description="국가안보실, 대통령경호처 등 관련 기관",
        c_weight=40,
        s_weight=80,
        o_weight=10,
    )


class Command(BaseCommand):
    help = "Prepare the isolated E2E database and run the Django test server."

    def handle(self, *args, **options):
        ensure_isolated_e2e_database()
        call_command("migrate", interactive=False, verbosity=0)
        call_command("flush", interactive=False, verbosity=0)
        recreate_feature_tables()

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
        create_e2e_features()

        call_command(
            "runserver",
            "127.0.0.1:8766",
            use_reloader=False,
        )
