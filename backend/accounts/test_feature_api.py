import json

from django.test import Client, TransactionTestCase
from django.db import connection
from django.urls import reverse

from .models import FeatureGroup, FeatureType, FeatureValue, User


class FeatureManagementApiTests(TransactionTestCase):
    password = "S3cure!Passphrase-7746"
    reset_sequences = True

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(FeatureGroup)
            schema_editor.create_model(FeatureType)
            schema_editor.create_model(FeatureValue)

    @classmethod
    def tearDownClass(cls):
        with connection.schema_editor() as schema_editor:
            schema_editor.delete_model(FeatureValue)
            schema_editor.delete_model(FeatureType)
            schema_editor.delete_model(FeatureGroup)
        super().tearDownClass()

    def setUp(self):
        FeatureValue.objects.all().delete()
        FeatureType.objects.all().delete()
        FeatureGroup.objects.all().delete()

    def create_user(self, *, role=User.ROLE_SUPER_ADMIN):
        user = User(
            email=f"{role.lower()}@example.com",
            nickname="관리자",
            role=role,
            status=User.STATUS_ACTIVE,
            company_id=1,
            company_name="Necton",
        )
        user.set_password(self.password)
        user.save()
        return user

    def login_client(self, user, *, enforce_csrf_checks=False):
        client = Client(enforce_csrf_checks=enforce_csrf_checks)
        csrf_response = client.get(reverse("auth_api:csrf"))
        response = client.post(
            reverse("auth_api:login"),
            data=json.dumps(
                {"email": user.email, "password": self.password}
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_response.json()["csrfToken"],
        )
        self.assertEqual(response.status_code, 200)
        return client, response.json()["csrfToken"]

    def request_json(
        self,
        client,
        method,
        url,
        payload,
        *,
        csrf_token=None,
    ):
        headers = {}
        if csrf_token:
            headers["HTTP_X_CSRFTOKEN"] = csrf_token
        return getattr(client, method)(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            **headers,
        )

    def create_group(self, **overrides):
        return FeatureGroup.objects.create(
            feature=overrides.get("feature", "Document Form"),
            description=overrides.get(
                "description",
                "문서의 종류와 형식을 나타내는 정보",
            ),
        )

    def create_type(self, group, **overrides):
        return FeatureType.objects.create(
            feature_group=group,
            feature=overrides.get("feature", "Security Document"),
            description=overrides.get("description", "보안 문서"),
            note=overrides.get("note"),
        )

    def create_value(self, group, feature_type, **overrides):
        return FeatureValue.objects.create(
            feature_group=group,
            feature_type=feature_type,
            feature_type_name=feature_type.feature,
            feature=overrides.get("feature", "국가안보계획"),
            description=overrides.get(
                "description",
                "국가안보 정책 및 대응 계획",
            ),
            c_weight=overrides.get("c_weight", 100),
            s_weight=overrides.get("s_weight", 20),
            o_weight=overrides.get("o_weight", 0),
        )

    def test_routes_are_under_super_admin_settings_api(self):
        self.assertEqual(
            reverse("auth_api:feature-groups"),
            "/api/settings/feature-groups/",
        )
        self.assertEqual(
            reverse("auth_api:feature-group-detail", args=[7]),
            "/api/settings/feature-groups/7/",
        )
        self.assertEqual(
            reverse("auth_api:feature-types"),
            "/api/settings/feature-types/",
        )
        self.assertEqual(
            reverse("auth_api:feature-type-detail", args=[8]),
            "/api/settings/feature-types/8/",
        )
        self.assertEqual(
            reverse("auth_api:feature-values"),
            "/api/settings/feature-values/",
        )
        self.assertEqual(
            reverse("auth_api:feature-value-detail", args=[9]),
            "/api/settings/feature-values/9/",
        )

    def test_anonymous_and_non_super_admin_users_are_rejected(self):
        anonymous_response = self.client.get(
            reverse("auth_api:feature-groups")
        )
        self.assertEqual(anonymous_response.status_code, 401)

        user = self.create_user(role=User.ROLE_USER)
        client, _ = self.login_client(user)
        response = client.get(reverse("auth_api:feature-groups"))

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json()["detail"],
            "SUPER_ADMIN 권한이 필요합니다.",
        )

    def test_unsafe_requests_require_csrf(self):
        user = self.create_user()
        client, _ = self.login_client(
            user,
            enforce_csrf_checks=True,
        )

        response = self.request_json(
            client,
            "post",
            reverse("auth_api:feature-groups"),
            {"feature": "Document Form", "description": "문서 형식"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json()["detail"],
            "CSRF 검증에 실패했습니다.",
        )
        self.assertFalse(FeatureGroup.objects.exists())

    def test_group_crud(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        collection_url = reverse("auth_api:feature-groups")

        create_response = self.request_json(
            client,
            "post",
            collection_url,
            {
                "feature": " Document Form ",
                "description": " 문서 형식 ",
            },
            csrf_token=csrf_token,
        )

        self.assertEqual(create_response.status_code, 201)
        group_id = create_response.json()["item"]["id"]
        self.assertEqual(
            create_response.json()["item"]["feature"],
            "Document Form",
        )

        list_response = client.get(collection_url)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()["items"]), 1)

        detail_url = reverse(
            "auth_api:feature-group-detail",
            args=[group_id],
        )
        update_response = self.request_json(
            client,
            "patch",
            detail_url,
            {"description": "수정된 설명"},
            csrf_token=csrf_token,
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(
            update_response.json()["item"]["description"],
            "수정된 설명",
        )

        delete_response = self.request_json(
            client,
            "delete",
            detail_url,
            {},
            csrf_token=csrf_token,
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(FeatureGroup.objects.exists())

    def test_group_requires_name_and_description(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        response = self.request_json(
            client,
            "post",
            reverse("auth_api:feature-groups"),
            {"feature": " ", "description": ""},
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            set(response.json()["errors"]),
            {"feature", "description"},
        )

    def test_types_are_filtered_by_group_and_created_under_selection(self):
        group = self.create_group()
        other_group = self.create_group(feature="Document Image")
        self.create_type(group, feature="Administrative Document")
        self.create_type(other_group, feature="Visual Object")
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        collection_url = reverse("auth_api:feature-types")

        list_response = client.get(
            collection_url,
            {"groupId": group.pk},
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            [item["feature"] for item in list_response.json()["items"]],
            ["Administrative Document"],
        )

        create_response = self.request_json(
            client,
            "post",
            collection_url,
            {
                "groupId": group.pk,
                "feature": "Security Document",
                "description": "보안 문서",
                "note": "",
            },
            csrf_token=csrf_token,
        )

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(
            create_response.json()["item"]["groupId"],
            group.pk,
        )
        self.assertIsNone(create_response.json()["item"]["note"])

    def test_value_creation_derives_group_and_type_name(self):
        group = self.create_group()
        feature_type = self.create_type(group)
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        response = self.request_json(
            client,
            "post",
            reverse("auth_api:feature-values"),
            {
                "typeId": feature_type.pk,
                "feature": "국가안보계획",
                "description": "국가안보 정책 및 대응 계획",
                "cWeight": 100,
                "sWeight": 20,
                "oWeight": 0,
                "groupId": 999,
                "featureType": "변조된 이름",
            },
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 201)
        feature_value = FeatureValue.objects.get()
        self.assertEqual(feature_value.feature_group_id, group.pk)
        self.assertEqual(feature_value.feature_type_id, feature_type.pk)
        self.assertEqual(
            feature_value.feature_type_name,
            feature_type.feature,
        )

    def test_value_list_is_paginated_eight_at_a_time(self):
        group = self.create_group()
        feature_type = self.create_type(group)
        for index in range(9):
            self.create_value(
                group,
                feature_type,
                feature=f"보안 문서 {index + 1}",
            )
        user = self.create_user()
        client, _ = self.login_client(user)
        url = reverse("auth_api:feature-values")

        first_page = client.get(url, {"typeId": feature_type.pk, "page": 1})
        second_page = client.get(url, {"typeId": feature_type.pk, "page": 2})

        self.assertEqual(len(first_page.json()["items"]), 8)
        self.assertEqual(len(second_page.json()["items"]), 1)
        self.assertEqual(
            first_page.json()["pagination"],
            {
                "page": 1,
                "pageSize": 8,
                "totalItems": 9,
                "totalPages": 2,
            },
        )

    def test_type_rename_updates_denormalized_value_names(self):
        group = self.create_group()
        feature_type = self.create_type(group)
        self.create_value(group, feature_type)
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        response = self.request_json(
            client,
            "patch",
            reverse(
                "auth_api:feature-type-detail",
                args=[feature_type.pk],
            ),
            {"feature": "Security Documents"},
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            FeatureValue.objects.get().feature_type_name,
            "Security Documents",
        )

    def test_parent_deletion_is_blocked_while_children_exist(self):
        group = self.create_group()
        feature_type = self.create_type(group)
        self.create_value(group, feature_type)
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        group_response = self.request_json(
            client,
            "delete",
            reverse(
                "auth_api:feature-group-detail",
                args=[group.pk],
            ),
            {},
            csrf_token=csrf_token,
        )
        type_response = self.request_json(
            client,
            "delete",
            reverse(
                "auth_api:feature-type-detail",
                args=[feature_type.pk],
            ),
            {},
            csrf_token=csrf_token,
        )

        self.assertEqual(group_response.status_code, 409)
        self.assertEqual(type_response.status_code, 409)
        self.assertTrue(FeatureGroup.objects.filter(pk=group.pk).exists())
        self.assertTrue(
            FeatureType.objects.filter(pk=feature_type.pk).exists()
        )

    def test_value_update_and_delete(self):
        group = self.create_group()
        feature_type = self.create_type(group)
        feature_value = self.create_value(group, feature_type)
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        detail_url = reverse(
            "auth_api:feature-value-detail",
            args=[feature_value.pk],
        )

        update_response = self.request_json(
            client,
            "patch",
            detail_url,
            {
                "description": "수정된 설명",
                "cWeight": None,
                "sWeight": 40,
                "oWeight": 5,
            },
            csrf_token=csrf_token,
        )

        self.assertEqual(update_response.status_code, 200)
        self.assertIsNone(update_response.json()["item"]["cWeight"])
        self.assertEqual(update_response.json()["item"]["sWeight"], 40)

        delete_response = self.request_json(
            client,
            "delete",
            detail_url,
            {},
            csrf_token=csrf_token,
        )
        self.assertEqual(delete_response.status_code, 200)
        self.assertFalse(FeatureValue.objects.exists())

    def test_weights_must_fit_the_database_tinyint_range(self):
        group = self.create_group()
        feature_type = self.create_type(group)
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        response = self.request_json(
            client,
            "post",
            reverse("auth_api:feature-values"),
            {
                "typeId": feature_type.pk,
                "feature": "국가안보계획",
                "cWeight": 128,
            },
            csrf_token=csrf_token,
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("cWeight", response.json()["errors"])
