import json
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import (
    BACKEND_SESSION_KEY,
    HASH_SESSION_KEY,
    SESSION_KEY,
)
from django.db import IntegrityError, OperationalError
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from .models import User
from .views import AUTH_EMAIL_SESSION_KEY


class AuthApiTestMixin:
    password = "S3cure!Passphrase-7746"
    signup_data = {
        "email": "new-admin@example.com",
        "password": password,
        "password_confirm": password,
        "nickname": "관리자",
        "phone": "01012345678",
        "company": "Necton",
    }

    def create_user(self, **overrides):
        user = User(
            email=overrides.get("email", "admin@example.com"),
            nickname=overrides.get("nickname", "관리자"),
            role=overrides.get("role", User.ROLE_USER),
            status=overrides.get("status", User.STATUS_ACTIVE),
            company_id=overrides.get("company_id", 1),
            company_name=overrides.get("company_name", "Necton"),
        )
        user.set_password(overrides.get("password", self.password))
        user.save()
        return user

    def post_json(self, client, url, payload, *, csrf_token=None):
        headers = {}
        if csrf_token:
            headers["HTTP_X_CSRFTOKEN"] = csrf_token
        return client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            **headers,
        )

    def get_csrf_token(self, client):
        response = client.get(reverse("auth_api:csrf"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("csrftoken", client.cookies)
        return response.json()["csrfToken"]

    def login(self, client, user, *, csrf_token=None):
        return self.post_json(
            client,
            reverse("auth_api:login"),
            {"email": user.email, "password": self.password},
            csrf_token=csrf_token,
        )


class AuthApiContractTests(AuthApiTestMixin, TestCase):
    def test_auth_api_routes_are_namespaced_under_api(self):
        self.assertEqual(reverse("auth_api:csrf"), "/api/auth/csrf/")
        self.assertEqual(reverse("auth_api:signup"), "/api/auth/signup/")
        self.assertEqual(reverse("auth_api:login"), "/api/auth/login/")
        self.assertEqual(reverse("auth_api:logout"), "/api/auth/logout/")
        self.assertEqual(reverse("auth_api:me"), "/api/auth/me/")

    def test_csrf_endpoint_returns_json_token_and_cookie(self):
        response = self.client.get(reverse("auth_api:csrf"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertTrue(response.json()["csrfToken"])
        self.assertIn("csrftoken", response.cookies)

    @override_settings(
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
    )
    def test_https_cookie_flags_are_applied_to_csrf_and_session(self):
        user = self.create_user()
        client = Client(enforce_csrf_checks=True)
        csrf_response = client.get(reverse("auth_api:csrf"))
        csrf_token = csrf_response.json()["csrfToken"]

        login_response = self.login(
            client,
            user,
            csrf_token=csrf_token,
        )

        self.assertTrue(csrf_response.cookies["csrftoken"]["secure"])
        self.assertEqual(
            csrf_response.cookies["csrftoken"]["samesite"],
            "Lax",
        )
        session_cookie = login_response.cookies[settings.SESSION_COOKIE_NAME]
        self.assertTrue(session_cookie["secure"])
        self.assertTrue(session_cookie["httponly"])
        self.assertEqual(session_cookie["samesite"], "Lax")

    def test_unknown_api_paths_return_json_404_instead_of_redirecting(self):
        for path in ("/api", "/api/", "/api/not-found/"):
            with self.subTest(path=path):
                response = self.client.get(path)

                self.assertEqual(response.status_code, 404)
                self.assertEqual(
                    response.headers["Content-Type"],
                    "application/json",
                )
                self.assertEqual(
                    response.json()["detail"],
                    "요청한 API를 찾을 수 없습니다.",
                )

    def test_unsupported_methods_return_json_405_with_allow_header(self):
        requests = (
            ("get", reverse("auth_api:signup"), "POST"),
            ("get", reverse("auth_api:login"), "POST"),
            ("get", reverse("auth_api:logout"), "POST"),
            ("post", reverse("auth_api:me"), "GET"),
        )

        csrf_client = Client(enforce_csrf_checks=True)
        csrf_token = self.get_csrf_token(csrf_client)

        for method, url, allowed in requests:
            with self.subTest(url=url):
                if method == "post":
                    response = self.post_json(
                        csrf_client,
                        url,
                        {},
                        csrf_token=csrf_token,
                    )
                else:
                    response = self.client.get(url)

                self.assertEqual(response.status_code, 405)
                self.assertEqual(response.headers["Allow"], allowed)
                self.assertEqual(
                    response.headers["Content-Type"],
                    "application/json",
                )

    def test_malformed_json_returns_json_400(self):
        response = self.client.post(
            reverse("auth_api:login"),
            data="{",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "요청 본문이 올바른 JSON이 아닙니다.",
        )

    def test_json_integer_over_parser_limit_returns_json_400(self):
        oversized_integer = "1" * 5000

        response = self.client.post(
            reverse("auth_api:login"),
            data=f'{{"value": {oversized_integer}}}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.json()["detail"],
            "요청 본문이 올바른 JSON이 아닙니다.",
        )

    @override_settings(DATA_UPLOAD_MAX_MEMORY_SIZE=32)
    def test_oversized_request_body_returns_json_413(self):
        response = self.post_json(
            self.client,
            reverse("auth_api:login"),
            {"email": "admin@example.com", "password": self.password},
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.json()["detail"],
            "요청 본문이 너무 큽니다.",
        )

    def test_non_object_json_returns_json_400(self):
        response = self.post_json(
            self.client,
            reverse("auth_api:login"),
            ["admin@example.com", self.password],
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["detail"],
            "요청 본문은 JSON 객체여야 합니다.",
        )

    def test_non_json_content_type_returns_json_415(self):
        response = self.client.post(
            reverse("auth_api:login"),
            data="email=admin@example.com",
            content_type="text/plain",
        )

        self.assertEqual(response.status_code, 415)
        self.assertEqual(response.headers["Content-Type"], "application/json")

    def test_template_csrf_failure_keeps_default_html_response(self):
        client = Client(enforce_csrf_checks=True)

        response = client.post(
            reverse("accounts:login"),
            {"email": "admin@example.com", "password": self.password},
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            response.headers["Content-Type"].startswith("text/html")
        )


class SignUpApiTests(AuthApiTestMixin, TestCase):
    def test_signup_creates_user_without_logging_in(self):
        response = self.post_json(
            self.client,
            reverse("auth_api:signup"),
            self.signup_data
            | {
                "email": "NEW-ADMIN@EXAMPLE.COM",
                "role": "ADMIN",
                "status": "I",
                "user_id": 9999,
            },
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get()
        self.assertEqual(user.email, "new-admin@example.com")
        self.assertTrue(user.check_password(self.password))
        self.assertEqual(user.role, User.ROLE_USER)
        self.assertEqual(user.status, User.STATUS_ACTIVE)
        self.assertNotEqual(user.pk, 9999)
        self.assertEqual(user.phone, "01012345678")
        self.assertEqual(user.company_id, 1)
        self.assertEqual(user.company_name, "Necton")
        self.assertNotIn(SESSION_KEY, self.client.session)

        payload = response.json()
        self.assertEqual(
            payload["detail"],
            "회원가입이 완료되었습니다. 로그인해 주세요.",
        )
        self.assertEqual(
            set(payload["user"]),
            {"id", "email", "nickname", "role"},
        )

    def test_signup_reuses_company_id_for_existing_company_name(self):
        self.create_user(
            email="existing@example.com",
            company_id=27,
            company_name="Necton",
        )

        response = self.post_json(
            self.client,
            reverse("auth_api:signup"),
            self.signup_data,
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email=self.signup_data["email"])
        self.assertEqual(user.company_id, 27)
        self.assertEqual(user.company_name, "Necton")

    def test_signup_assigns_next_company_id_for_new_company_name(self):
        self.create_user(
            email="existing@example.com",
            company_id=27,
            company_name="Other Company",
        )

        response = self.post_json(
            self.client,
            reverse("auth_api:signup"),
            self.signup_data,
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email=self.signup_data["email"])
        self.assertEqual(user.company_id, 28)
        self.assertEqual(user.company_name, "Necton")

    def test_signup_returns_field_errors_for_invalid_input(self):
        response = self.post_json(
            self.client,
            reverse("auth_api:signup"),
            self.signup_data | {"password_confirm": "DifferentPass-7746"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"]["password_confirm"],
            ["비밀번호가 일치하지 않습니다."],
        )
        self.assertFalse(User.objects.exists())

    def test_signup_rejects_duplicate_email_case_insensitively(self):
        self.create_user(email="New-Admin@Example.com")

        response = self.post_json(
            self.client,
            reverse("auth_api:signup"),
            self.signup_data,
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"]["email"],
            ["이미 가입된 이메일입니다."],
        )
        self.assertEqual(User.objects.count(), 1)

    def test_signup_handles_duplicate_email_race(self):
        with patch(
            "accounts.api_views.SignUpForm.save",
            side_effect=IntegrityError("simulated duplicate"),
        ):
            response = self.post_json(
                self.client,
                reverse("auth_api:signup"),
                self.signup_data,
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"]["email"],
            ["이미 가입된 이메일입니다."],
        )

    def test_signup_returns_503_when_database_is_unavailable(self):
        with patch(
            "accounts.api_views.SignUpForm.is_valid",
            side_effect=OperationalError("simulated database failure"),
        ):
            response = self.post_json(
                self.client,
                reverse("auth_api:signup"),
                self.signup_data,
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertFalse(User.objects.exists())

    def test_signup_returns_503_when_database_save_fails(self):
        with patch(
            "accounts.api_views.SignUpForm.save",
            side_effect=OperationalError("simulated database failure"),
        ):
            response = self.post_json(
                self.client,
                reverse("auth_api:signup"),
                self.signup_data,
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertFalse(User.objects.exists())


class LoginApiTests(AuthApiTestMixin, TestCase):
    def test_login_sets_session_flushes_old_data_and_rotates_csrf(self):
        user = self.create_user(
            email="Admin@Example.com",
            role=User.ROLE_SUPER_USER,
        )
        client = Client(enforce_csrf_checks=True)
        session = client.session
        session["pre_login_value"] = "remove-me"
        session.save()
        client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key
        csrf_token = self.get_csrf_token(client)
        old_csrf_cookie = client.cookies["csrftoken"].value

        response = self.post_json(
            client,
            reverse("auth_api:login"),
            {"email": "ADMIN@example.COM", "password": self.password},
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(
            response.json()["user"],
            {
                "id": user.pk,
                "email": user.email,
                "nickname": user.nickname,
                "role": User.ROLE_SUPER_USER,
            },
        )
        self.assertTrue(response.json()["csrfToken"])
        self.assertNotEqual(
            client.cookies["csrftoken"].value,
            old_csrf_cookie,
        )
        self.assertNotIn("pre_login_value", client.session)
        self.assertEqual(client.session[SESSION_KEY], str(user.pk))
        self.assertIn(BACKEND_SESSION_KEY, client.session)
        self.assertIn(HASH_SESSION_KEY, client.session)
        self.assertEqual(client.session[AUTH_EMAIL_SESSION_KEY], user.email)
        self.assertTrue(
            response.cookies[settings.SESSION_COOKIE_NAME]["httponly"]
        )

    def test_wrong_password_missing_email_and_inactive_user_match(self):
        active_user = self.create_user()
        inactive_user = self.create_user(
            email="inactive@example.com",
            status="I",
        )
        attempts = (
            {"email": active_user.email, "password": "wrong-password"},
            {"email": "missing@example.com", "password": self.password},
            {"email": inactive_user.email, "password": self.password},
        )
        responses = []

        for credentials in attempts:
            with self.subTest(email=credentials["email"]):
                response = self.post_json(
                    self.client,
                    reverse("auth_api:login"),
                    credentials,
                )
                self.assertEqual(response.status_code, 401)
                self.assertNotIn(SESSION_KEY, self.client.session)
                responses.append(response.json())

        self.assertEqual(responses[0], responses[1])
        self.assertEqual(responses[1], responses[2])
        self.assertEqual(
            responses[0]["errors"]["non_field_errors"],
            ["이메일 또는 비밀번호가 올바르지 않습니다."],
        )

    def test_missing_email_runs_dummy_password_hash(self):
        with patch(
            "accounts.backends.User.set_password",
            autospec=True,
        ) as set_password:
            response = self.post_json(
                self.client,
                reverse("auth_api:login"),
                {"email": "missing@example.com", "password": self.password},
            )

        self.assertEqual(response.status_code, 401)
        set_password.assert_called_once()
        self.assertEqual(set_password.call_args.args[1], self.password)

    def test_login_returns_400_for_invalid_email_shape(self):
        response = self.post_json(
            self.client,
            reverse("auth_api:login"),
            {"email": "not-an-email", "password": self.password},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json()["errors"])

    def test_login_returns_503_when_database_is_unavailable(self):
        with patch(
            "accounts.backends.EmailBackend.authenticate",
            side_effect=OperationalError("simulated database failure"),
        ):
            response = self.post_json(
                self.client,
                reverse("auth_api:login"),
                {"email": "admin@example.com", "password": self.password},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertNotIn(SESSION_KEY, self.client.session)


class MeApiTests(AuthApiTestMixin, TestCase):
    def test_me_returns_anonymous_state_without_401(self):
        response = self.client.get(reverse("auth_api:me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"authenticated": False, "user": None},
        )

    def test_me_returns_minimal_authenticated_user(self):
        user = self.create_user(role=User.ROLE_SUPER_USER)
        self.login(self.client, user)

        response = self.client.get(reverse("auth_api:me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "authenticated": True,
                "user": {
                    "id": user.pk,
                    "email": user.email,
                    "nickname": user.nickname,
                    "role": User.ROLE_SUPER_USER,
                },
            },
        )
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_me_rejects_session_after_user_is_deactivated(self):
        user = self.create_user()
        self.login(self.client, user)
        user.status = "I"
        user.save(update_fields=["status"])

        response = self.client.get(reverse("auth_api:me"))

        self.assertEqual(
            response.json(),
            {"authenticated": False, "user": None},
        )
        self.assertNotIn(SESSION_KEY, self.client.session)

        user.status = User.STATUS_ACTIVE
        user.save(update_fields=["status"])
        reactivated_response = self.client.get(reverse("auth_api:me"))
        self.assertEqual(
            reactivated_response.json(),
            {"authenticated": False, "user": None},
        )

    def test_me_flushes_session_after_password_change(self):
        user = self.create_user()
        self.login(self.client, user)
        user.set_password("New!Passphrase-7746")
        user.save(update_fields=["password"])

        response = self.client.get(reverse("auth_api:me"))

        self.assertEqual(
            response.json(),
            {"authenticated": False, "user": None},
        )
        self.assertNotIn(SESSION_KEY, self.client.session)

    def test_me_returns_503_when_database_is_unavailable(self):
        user = self.create_user()
        self.login(self.client, user)

        with patch(
            "accounts.backends.EmailBackend.get_user",
            side_effect=OperationalError("simulated database failure"),
        ):
            response = self.client.get(reverse("auth_api:me"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["Content-Type"], "application/json")


class LogoutApiTests(AuthApiTestMixin, TestCase):
    def test_logout_clears_session_and_rotates_csrf(self):
        user = self.create_user()
        client = Client(enforce_csrf_checks=True)
        csrf_token = self.get_csrf_token(client)
        login_response = self.login(
            client,
            user,
            csrf_token=csrf_token,
        )
        login_csrf_cookie = client.cookies["csrftoken"].value

        response = self.post_json(
            client,
            reverse("auth_api:logout"),
            {},
            csrf_token=login_response.json()["csrfToken"],
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {key: response.json()[key] for key in ("authenticated", "user")},
            {"authenticated": False, "user": None},
        )
        self.assertTrue(response.json()["csrfToken"])
        self.assertNotEqual(
            client.cookies["csrftoken"].value,
            login_csrf_cookie,
        )
        self.assertNotIn(SESSION_KEY, client.session)
        self.assertEqual(
            client.get(reverse("auth_api:me")).json(),
            {"authenticated": False, "user": None},
        )

    def test_logout_is_idempotent_for_anonymous_client(self):
        client = Client(enforce_csrf_checks=True)
        csrf_token = self.get_csrf_token(client)

        response = self.post_json(
            client,
            reverse("auth_api:logout"),
            {},
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["authenticated"])

    def test_logout_does_not_query_user(self):
        user = self.create_user()
        self.login(self.client, user)

        with patch(
            "accounts.backends.EmailBackend.get_user",
            side_effect=OperationalError("must not be called"),
        ) as get_user:
            response = self.post_json(
                self.client,
                reverse("auth_api:logout"),
                {},
            )

        self.assertEqual(response.status_code, 200)
        get_user.assert_not_called()


class AuthApiCsrfTests(AuthApiTestMixin, TestCase):
    def test_unsafe_auth_endpoints_reject_missing_csrf_as_json(self):
        client = Client(enforce_csrf_checks=True)
        requests = (
            (reverse("auth_api:signup"), self.signup_data),
            (
                reverse("auth_api:login"),
                {"email": "admin@example.com", "password": self.password},
            ),
            (reverse("auth_api:logout"), {}),
        )

        for url, payload in requests:
            with self.subTest(url=url):
                response = self.post_json(client, url, payload)

                self.assertEqual(response.status_code, 403)
                self.assertEqual(
                    response.headers["Content-Type"],
                    "application/json",
                )
                self.assertEqual(
                    response.json()["detail"],
                    "CSRF 검증에 실패했습니다.",
                )
                self.assertEqual(response.headers["Cache-Control"], "no-store")

        self.assertFalse(User.objects.exists())

    def test_invalid_csrf_header_is_rejected_as_json(self):
        client = Client(enforce_csrf_checks=True)
        self.get_csrf_token(client)

        response = self.post_json(
            client,
            reverse("auth_api:login"),
            {"email": "admin@example.com", "password": self.password},
            csrf_token="invalid-token",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.headers["Content-Type"], "application/json")
        self.assertEqual(
            response.json()["detail"],
            "CSRF 검증에 실패했습니다.",
        )

    def test_exact_api_path_uses_json_csrf_failure(self):
        client = Client(enforce_csrf_checks=True)

        response = self.post_json(client, "/api", {})

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.headers["Content-Type"], "application/json")

    def test_valid_csrf_header_reaches_login_validation(self):
        client = Client(enforce_csrf_checks=True)
        csrf_token = self.get_csrf_token(client)

        response = self.post_json(
            client,
            reverse("auth_api:login"),
            {"email": "missing@example.com", "password": self.password},
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 401)
        self.assertIn("non_field_errors", response.json()["errors"])
