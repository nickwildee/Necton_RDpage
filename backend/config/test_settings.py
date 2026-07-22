import os
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from .settings import env_bool


class EnvironmentBooleanTests(SimpleTestCase):
    variable_name = "NECTON_TEST_BOOLEAN"

    def test_missing_value_uses_default(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop(self.variable_name, None)

            self.assertTrue(env_bool(self.variable_name, True))
            self.assertFalse(env_bool(self.variable_name, False))

    def test_true_values_are_accepted(self):
        for value in ("1", "true", "YES", " on "):
            with self.subTest(value=value):
                with patch.dict(
                    os.environ,
                    {self.variable_name: value},
                    clear=False,
                ):
                    self.assertTrue(env_bool(self.variable_name, False))

    def test_false_values_are_accepted(self):
        for value in ("0", "false", "NO", " off "):
            with self.subTest(value=value):
                with patch.dict(
                    os.environ,
                    {self.variable_name: value},
                    clear=False,
                ):
                    self.assertFalse(env_bool(self.variable_name, True))

    def test_invalid_value_fails_closed(self):
        with patch.dict(
            os.environ,
            {self.variable_name: "enabled"},
            clear=False,
        ):
            with self.assertRaisesMessage(
                ImproperlyConfigured,
                "NECTON_TEST_BOOLEAN 환경변수는 true 또는 false여야 합니다.",
            ):
                env_bool(self.variable_name, False)
