from unittest.mock import patch

from django.conf import settings
from django.core.management.base import CommandError
from django.test import SimpleTestCase

from .management.commands.run_e2e_server import Command


class E2EServerCommandSafetyTests(SimpleTestCase):
    @patch.dict(
        settings.DATABASES,
        {
            "default": {
                "ENGINE": "django.db.backends.mysql",
                "NAME": "ingest_data",
            }
        }
    )
    @patch(
        "accounts.management.commands.run_e2e_server.call_command"
    )
    def test_command_refuses_to_flush_non_e2e_database(self, call_command):
        with self.assertRaisesMessage(
            CommandError,
            "격리된 backend/e2e.sqlite3",
        ):
            Command().handle()

        call_command.assert_not_called()

    @patch.dict(
        settings.DATABASES,
        {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": settings.BASE_DIR / "e2e.sqlite3",
            }
        }
    )
    @patch(
        "accounts.management.commands.run_e2e_server.Path.is_symlink",
        return_value=True,
    )
    @patch(
        "accounts.management.commands.run_e2e_server.call_command"
    )
    def test_command_refuses_symlinked_e2e_database(
        self,
        call_command,
        _is_symlink,
    ):
        with self.assertRaisesMessage(
            CommandError,
            "격리된 backend/e2e.sqlite3",
        ):
            Command().handle()

        call_command.assert_not_called()
