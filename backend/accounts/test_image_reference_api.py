import hashlib
import json
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import Client, TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import (
    FeatureGroup,
    FeatureType,
    FeatureValue,
    ImageReference,
    User,
)


class ImageReferenceApiTests(TransactionTestCase):
    password = "S3cure!Passphrase-7746"
    reset_sequences = True

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(FeatureGroup)
            schema_editor.create_model(FeatureType)
            schema_editor.create_model(FeatureValue)
            schema_editor.create_model(ImageReference)

    @classmethod
    def tearDownClass(cls):
        with connection.schema_editor() as schema_editor:
            schema_editor.delete_model(ImageReference)
            schema_editor.delete_model(FeatureValue)
            schema_editor.delete_model(FeatureType)
            schema_editor.delete_model(FeatureGroup)
        super().tearDownClass()

    def setUp(self):
        ImageReference.objects.all().delete()
        FeatureValue.objects.all().delete()
        FeatureType.objects.all().delete()
        FeatureGroup.objects.all().delete()
        self.image_directory = TemporaryDirectory()
        self.settings_override = override_settings(
            BDM_IMAGE_ROOT=self.image_directory.name
        )
        self.settings_override.enable()

        self.group = FeatureGroup.objects.create(
            feature_group_id=FeatureGroup.DOCUMENT_IMAGE_ID,
            feature="Document Image",
            description="문서 이미지 정보",
        )
        self.feature_type = FeatureType.objects.create(
            feature_group=self.group,
            feature="Logo",
            description="기관 로고",
            physical_type="Raster image",
            semantic_role="Organization identity",
        )
        self.feature_value = FeatureValue.objects.create(
            feature_group=self.group,
            feature_type=self.feature_type,
            feature_type_name=self.feature_type.feature,
            feature="국가안보기관로고",
            description="국가안보기관 로고",
            c_weight=40,
            s_weight=80,
            o_weight=10,
        )

    def tearDown(self):
        self.settings_override.disable()
        self.image_directory.cleanup()
        super().tearDown()

    def create_user(self, *, role=User.ROLE_SUPER_ADMIN):
        user = User(
            email=f"{role.lower()}@example.com",
            nickname="관리자",
            role=role,
            status=User.STATUS_ACTIVE,
            company_id=7,
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

    def image_bytes(self, image_format="PNG", *, animated=False):
        buffer = BytesIO()
        first = Image.new("RGB", (8, 8), "#4f607e")
        if animated:
            second = Image.new("RGB", (8, 8), "#ffffff")
            first.save(
                buffer,
                format=image_format,
                save_all=True,
                append_images=[second],
                duration=100,
                loop=0,
            )
        else:
            first.save(buffer, format=image_format)
        return buffer.getvalue()

    def upload(
        self,
        client,
        csrf_token,
        *,
        content=None,
        filename="기관 로고.png",
        description="국가안보기관 공식 로고",
        value_id=None,
    ):
        content = content or self.image_bytes()
        return client.post(
            reverse("auth_api:image-references"),
            data={
                "valueId": value_id or self.feature_value.pk,
                "description": description,
                "image": SimpleUploadedFile(
                    filename,
                    content,
                    content_type="application/octet-stream",
                ),
            },
            HTTP_X_CSRFTOKEN=csrf_token,
        )

    def test_routes_are_under_settings_api(self):
        self.assertEqual(
            reverse("auth_api:image-references"),
            "/api/settings/image-references/",
        )
        self.assertEqual(
            reverse("auth_api:image-reference-detail", args=[8]),
            "/api/settings/image-references/8/",
        )
        self.assertEqual(
            reverse("auth_api:image-reference-file", args=[8]),
            "/api/settings/image-references/8/file/",
        )

    def test_upload_derives_provenance_hash_and_relative_path(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        content = self.image_bytes()

        response = self.upload(
            client,
            csrf_token,
            content=content,
        )

        self.assertEqual(response.status_code, 201)
        image_reference = ImageReference.objects.get()
        digest = hashlib.sha256(content).hexdigest()
        registered_at = timezone.localtime(
            image_reference.regist_date
        )
        expected_path = Path(
            "7",
            str(self.feature_value.pk),
            f"{registered_at:%Y}",
            f"{registered_at:%m}",
            f"{digest}.png",
        )
        self.assertEqual(image_reference.user_id, user.pk)
        self.assertEqual(image_reference.company_id, 7)
        self.assertEqual(
            image_reference.feature_value_id,
            self.feature_value.pk,
        )
        self.assertEqual(
            image_reference.image_origin_name,
            "기관 로고.png",
        )
        self.assertEqual(image_reference.image_name, f"{digest}.png")
        self.assertEqual(
            image_reference.image_path,
            expected_path.as_posix(),
        )
        self.assertTrue(
            (Path(self.image_directory.name) / expected_path).is_file()
        )
        self.assertNotIn(
            self.image_directory.name,
            json.dumps(response.json(), ensure_ascii=False),
        )

    def test_list_and_file_response_only_return_active_images(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        upload_response = self.upload(client, csrf_token)
        image_id = upload_response.json()["item"]["id"]

        list_response = client.get(
            reverse("auth_api:image-references"),
            {"valueId": self.feature_value.pk},
        )
        file_response = client.get(
            reverse("auth_api:image-reference-file", args=[image_id])
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(
            list_response.json()["pagination"]["totalItems"],
            1,
        )
        self.assertEqual(
            list_response.json()["items"][0]["fileUrl"],
            f"/api/settings/image-references/{image_id}/file/",
        )
        self.assertEqual(file_response.status_code, 200)
        self.assertEqual(file_response["Content-Type"], "image/png")
        self.assertEqual(
            b"".join(file_response.streaming_content),
            self.image_bytes(),
        )

    def test_active_duplicate_is_rejected_and_inactive_is_reactivated(self):
        first_user = self.create_user()
        client, csrf_token = self.login_client(first_user)
        content = self.image_bytes()
        first_response = self.upload(
            client,
            csrf_token,
            content=content,
        )
        image_id = first_response.json()["item"]["id"]

        duplicate_response = self.upload(
            client,
            csrf_token,
            content=content,
            filename="다른 이름.png",
        )
        self.assertEqual(duplicate_response.status_code, 409)
        self.assertEqual(ImageReference.objects.count(), 1)

        delete_response = client.delete(
            reverse(
                "auth_api:image-reference-detail",
                args=[image_id],
            ),
            data=json.dumps({}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(delete_response.status_code, 200)
        image_reference = ImageReference.objects.get(pk=image_id)
        stored_file = (
            Path(self.image_directory.name)
            / image_reference.image_path
        )
        stored_file.write_bytes(b"corrupted")

        reactivated_response = self.upload(
            client,
            csrf_token,
            content=content,
            filename="재등록 이름.png",
            description="재등록 설명",
        )
        self.assertEqual(reactivated_response.status_code, 200)
        self.assertTrue(reactivated_response.json()["reactivated"])
        image_reference = ImageReference.objects.get()
        self.assertEqual(image_reference.pk, image_id)
        self.assertEqual(image_reference.user_id, first_user.pk)
        self.assertEqual(
            image_reference.image_origin_name,
            "기관 로고.png",
        )
        self.assertEqual(image_reference.description, "재등록 설명")
        self.assertEqual(
            image_reference.use_yn,
            ImageReference.USE_ACTIVE,
        )
        self.assertEqual(stored_file.read_bytes(), content)

    def test_description_can_be_updated_and_delete_is_soft(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        image_id = self.upload(
            client,
            csrf_token,
        ).json()["item"]["id"]
        image_reference = ImageReference.objects.get(pk=image_id)
        stored_file = (
            Path(self.image_directory.name)
            / image_reference.image_path
        )

        update_response = client.patch(
            reverse(
                "auth_api:image-reference-detail",
                args=[image_id],
            ),
            data=json.dumps({"description": "수정된 설명"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(
            update_response.json()["item"]["description"],
            "수정된 설명",
        )

        delete_response = client.delete(
            reverse(
                "auth_api:image-reference-detail",
                args=[image_id],
            ),
            data=json.dumps({}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(delete_response.status_code, 200)
        image_reference.refresh_from_db()
        self.assertEqual(
            image_reference.use_yn,
            ImageReference.USE_INACTIVE,
        )
        self.assertTrue(stored_file.is_file())
        self.assertEqual(
            client.get(
                reverse(
                    "auth_api:image-reference-file",
                    args=[image_id],
                )
            ).status_code,
            404,
        )

    def test_invalid_extension_mismatch_and_animation_are_rejected(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        cases = (
            ("기관 로고.txt", self.image_bytes(), "image"),
            (
                "기관 로고.png",
                self.image_bytes("JPEG"),
                "image",
            ),
            (
                "기관 로고.gif",
                self.image_bytes("GIF", animated=True),
                "image",
            ),
        )
        for filename, content, error_field in cases:
            with self.subTest(filename=filename):
                response = self.upload(
                    client,
                    csrf_token,
                    content=content,
                    filename=filename,
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn(
                    error_field,
                    response.json()["errors"],
                )
        self.assertFalse(ImageReference.objects.exists())
        self.assertEqual(
            list(Path(self.image_directory.name).iterdir()),
            [],
        )

    def test_decompression_bomb_warning_is_rejected(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        with patch.object(Image, "MAX_IMAGE_PIXELS", 32):
            response = self.upload(client, csrf_token)

        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.json()["errors"])
        self.assertFalse(ImageReference.objects.exists())

    def test_non_document_image_value_is_rejected(self):
        other_group = FeatureGroup.objects.create(
            feature="Document Form",
            description="문서 형식",
        )
        other_type = FeatureType.objects.create(
            feature_group=other_group,
            feature="Security Document",
            description="보안 문서",
        )
        other_value = FeatureValue.objects.create(
            feature_group=other_group,
            feature_type=other_type,
            feature_type_name=other_type.feature,
            feature="국가안보계획",
        )
        user = self.create_user()
        client, csrf_token = self.login_client(user)

        response = self.upload(
            client,
            csrf_token,
            value_id=other_value.pk,
        )

        self.assertEqual(response.status_code, 409)
        self.assertFalse(ImageReference.objects.exists())

    def test_image_reference_requires_super_admin_and_csrf(self):
        anonymous_client = Client(enforce_csrf_checks=True)
        anonymous_response = self.upload(anonymous_client, "")
        self.assertEqual(anonymous_response.status_code, 401)

        user = self.create_user(role=User.ROLE_USER)
        client, csrf_token = self.login_client(user)
        forbidden_response = self.upload(client, csrf_token)
        self.assertEqual(forbidden_response.status_code, 403)

        super_admin = self.create_user()
        csrf_client, _ = self.login_client(
            super_admin,
            enforce_csrf_checks=True,
        )
        csrf_response = self.upload(csrf_client, "")
        self.assertEqual(csrf_response.status_code, 403)

    def test_image_file_requires_super_admin(self):
        super_admin = self.create_user()
        super_admin_client, csrf_token = self.login_client(super_admin)
        image_id = self.upload(
            super_admin_client,
            csrf_token,
        ).json()["item"]["id"]
        file_url = reverse(
            "auth_api:image-reference-file",
            args=[image_id],
        )

        anonymous_response = self.client.get(file_url)
        regular_user = self.create_user(role=User.ROLE_USER)
        regular_client, _ = self.login_client(regular_user)
        forbidden_response = regular_client.get(file_url)
        allowed_response = super_admin_client.get(file_url)

        self.assertEqual(anonymous_response.status_code, 401)
        self.assertEqual(forbidden_response.status_code, 403)
        self.assertEqual(allowed_response.status_code, 200)
        self.assertEqual(
            b"".join(allowed_response.streaming_content),
            self.image_bytes(),
        )

    def test_feature_value_with_image_history_cannot_be_deleted(self):
        user = self.create_user()
        client, csrf_token = self.login_client(user)
        image_id = self.upload(
            client,
            csrf_token,
        ).json()["item"]["id"]
        client.delete(
            reverse(
                "auth_api:image-reference-detail",
                args=[image_id],
            ),
            data=json.dumps({}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        response = client.delete(
            reverse(
                "auth_api:feature-value-detail",
                args=[self.feature_value.pk],
            ),
            data=json.dumps({}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 409)
        self.assertTrue(
            FeatureValue.objects.filter(
                pk=self.feature_value.pk
            ).exists()
        )
