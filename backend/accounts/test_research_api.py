import json
from datetime import date, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.db import OperationalError, connection
from django.test import Client, TransactionTestCase, override_settings
from django.urls import reverse

from .models import Document, User


class ResearchApiTests(TransactionTestCase):
    password = "S3cure!Passphrase-7746"
    reset_sequences = True

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(Document)

    @classmethod
    def tearDownClass(cls):
        with connection.schema_editor() as schema_editor:
            schema_editor.delete_model(Document)
        super().tearDownClass()

    def setUp(self):
        Document.objects.all().delete()
        self.document_directory = TemporaryDirectory()
        self.settings_override = override_settings(
            RESEARCH_DOCUMENT_ROOT=self.document_directory.name
        )
        self.settings_override.enable()

    def tearDown(self):
        self.settings_override.disable()
        self.document_directory.cleanup()
        super().tearDown()

    def create_user(self, *, role=User.ROLE_USER):
        user = User(
            email=f"{role.lower()}-{User.objects.count()}@example.com",
            nickname="연구자",
            role=role,
            status=User.STATUS_ACTIVE,
            company_id=7,
            company_name="Necton",
        )
        user.set_password(self.password)
        user.save()
        return user

    def login_client(self, user):
        client = Client()
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
        return client

    def create_document(
        self,
        *,
        category="O",
        title="연구개발 시행계획",
        production_date=date(2025, 12, 18),
        body_file_path=None,
        other_file_paths=None,
    ):
        return Document.objects.create(
            cso_classification=category,
            title=title,
            ordering_agency="해양수산부",
            department="해양정책과",
            production_date=production_date,
            body_file_path=body_file_path,
            other_file_paths=other_file_paths,
        )

    def test_routes_are_under_research_api(self):
        self.assertEqual(
            reverse("auth_api:research-document-summary"),
            "/api/research/documents/summary/",
        )
        self.assertEqual(
            reverse("auth_api:research-documents"),
            "/api/research/documents/",
        )
        self.assertEqual(
            reverse("auth_api:research-document-body-file", args=[8]),
            "/api/research/documents/8/files/body/",
        )
        self.assertEqual(
            reverse(
                "auth_api:research-document-other-file",
                args=[8, 1],
            ),
            "/api/research/documents/8/files/other/1/",
        )

    def test_login_is_required_for_every_endpoint(self):
        document = self.create_document(
            body_file_path="files/body.pdf",
            other_file_paths="files/other.xlsx",
        )
        urls = [
            reverse("auth_api:research-document-summary"),
            reverse("auth_api:research-documents") + "?category=O",
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            ),
            reverse(
                "auth_api:research-document-other-file",
                args=[document.pk, 0],
            ),
        ]

        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(Client().get(url).status_code, 401)

    def test_all_authenticated_roles_can_read_summary(self):
        self.create_document()

        for role in (
            User.ROLE_USER,
            User.ROLE_ORG_USER,
            User.ROLE_ORG_ADMIN,
            User.ROLE_SUPER_ADMIN,
        ):
            with self.subTest(role=role):
                client = self.login_client(self.create_user(role=role))
                response = client.get(
                    reverse("auth_api:research-document-summary")
                )
                self.assertEqual(response.status_code, 200)

    def test_summary_counts_only_o_s_c_documents(self):
        for category, count in (("O", 3), ("S", 2), ("C", 1)):
            for index in range(count):
                self.create_document(
                    category=category,
                    title=f"{category} 문서 {index}",
                )
        self.create_document(category="UNKNOWN")
        client = self.login_client(self.create_user())

        response = client.get(
            reverse("auth_api:research-document-summary")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"totalItems": 6, "counts": {"O": 3, "S": 2, "C": 1}},
        )

    def test_list_is_filtered_ordered_and_paginated_by_thirty(self):
        base_date = date(2025, 12, 31)
        for index in range(32):
            self.create_document(
                category="O",
                title=f"공개 문서 {index + 1:02d}",
                production_date=base_date - timedelta(days=index),
            )
        self.create_document(category="S", title="민감 문서")
        client = self.login_client(self.create_user())

        first_response = client.get(
            reverse("auth_api:research-documents"),
            {"category": "O", "page": 1},
        )
        second_response = client.get(
            reverse("auth_api:research-documents"),
            {"category": "O", "page": 2},
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(len(first_response.json()["items"]), 30)
        self.assertEqual(
            first_response.json()["items"][0]["title"],
            "공개 문서 01",
        )
        self.assertEqual(
            first_response.json()["pagination"],
            {
                "page": 1,
                "pageSize": 30,
                "totalItems": 32,
                "totalPages": 2,
            },
        )
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(len(second_response.json()["items"]), 2)

    def test_list_returns_metadata_filenames_and_safe_urls_only(self):
        document = self.create_document(
            body_file_path="mohw/report/본문 계획.pdf",
            other_file_paths=(
                "mohw/report/예산 현황.xlsx|mohw/report/참고 자료.hwp"
            ),
        )
        client = self.login_client(self.create_user())

        response = client.get(
            reverse("auth_api:research-documents"),
            {"category": "O"},
        )

        self.assertEqual(response.status_code, 200)
        item = response.json()["items"][0]
        self.assertEqual(item["title"], "연구개발 시행계획")
        self.assertEqual(item["orderingAgency"], "해양수산부")
        self.assertEqual(item["department"], "해양정책과")
        self.assertEqual(item["productionDate"], "2025-12-18")
        self.assertEqual(item["bodyFile"]["name"], "본문 계획.pdf")
        self.assertEqual(
            [file["name"] for file in item["otherFiles"]],
            ["예산 현황.xlsx", "참고 자료.hwp"],
        )
        serialized = json.dumps(response.json(), ensure_ascii=False)
        self.assertNotIn("mohw/report", serialized)
        self.assertIn(f"/documents/{document.pk}/files/body/", serialized)

    def test_list_preserves_null_metadata_and_ignores_empty_file_entries(self):
        Document.objects.create(
            cso_classification="O",
            title=None,
            ordering_agency=None,
            department=None,
            production_date=None,
            body_file_path=None,
            other_file_paths=" | ",
        )
        client = self.login_client(self.create_user())

        response = client.get(
            reverse("auth_api:research-documents"),
            {"category": "O"},
        )

        self.assertEqual(response.status_code, 200)
        item = response.json()["items"][0]
        self.assertIsNone(item["title"])
        self.assertIsNone(item["orderingAgency"])
        self.assertIsNone(item["department"])
        self.assertIsNone(item["productionDate"])
        self.assertIsNone(item["bodyFile"])
        self.assertEqual(item["otherFiles"], [])

    def test_invalid_category_and_page_are_rejected(self):
        client = self.login_client(self.create_user())
        url = reverse("auth_api:research-documents")

        invalid_category = client.get(url, {"category": "X"})
        missing_category = client.get(url)
        invalid_page = client.get(url, {"category": "O", "page": "zero"})
        zero_page = client.get(url, {"category": "O", "page": 0})
        negative_page = client.get(url, {"category": "O", "page": -1})

        self.assertEqual(invalid_category.status_code, 400)
        self.assertIn("category", invalid_category.json()["errors"])
        self.assertEqual(missing_category.status_code, 400)
        self.assertIn("category", missing_category.json()["errors"])
        self.assertEqual(invalid_page.status_code, 400)
        self.assertIn("page", invalid_page.json()["errors"])
        self.assertEqual(zero_page.status_code, 400)
        self.assertEqual(negative_page.status_code, 400)

    def test_category_is_normalized_and_empty_list_has_stable_pagination(self):
        client = self.login_client(self.create_user())

        response = client.get(
            reverse("auth_api:research-documents"),
            {"category": " o ", "page": 1},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"], [])
        self.assertEqual(
            response.json()["pagination"],
            {
                "page": 1,
                "pageSize": 30,
                "totalItems": 0,
                "totalPages": 1,
            },
        )

    def test_out_of_range_page_is_clamped_to_last_page(self):
        self.create_document()
        client = self.login_client(self.create_user())

        response = client.get(
            reverse("auth_api:research-documents"),
            {"category": "O", "page": 99},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["pagination"]["page"], 1)

    def test_body_pdf_is_streamed_inline(self):
        relative_path = Path("mohw", "report", "본문 계획.pdf")
        target = Path(self.document_directory.name) / relative_path
        target.parent.mkdir(parents=True)
        target.write_bytes(b"pdf-content")
        document = self.create_document(
            body_file_path=relative_path.as_posix()
        )
        client = self.login_client(self.create_user())

        response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response["Content-Disposition"].startswith("inline"))
        self.assertEqual(response["Cache-Control"], "private, no-store")
        self.assertEqual(response["X-Content-Type-Options"], "nosniff")
        self.assertEqual(
            b"".join(response.streaming_content),
            b"pdf-content",
        )

    def test_ingested_document_tree_is_streamed_from_configured_root(self):
        relative_path = Path(
            "000",
            "000",
            "036",
            "692",
            "36692",
            "original",
            "36624799_결재문서본문.hwpx",
        )
        target = Path(self.document_directory.name) / relative_path
        target.parent.mkdir(parents=True)
        target.write_bytes(b"ingested-document-content")
        document = self.create_document(
            body_file_path=relative_path.as_posix()
        )
        client = self.login_client(self.create_user())

        response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            b"".join(response.streaming_content),
            b"ingested-document-content",
        )

    def test_other_office_file_is_downloaded_by_index(self):
        relative_paths = [
            Path("mohw", "report", "참고.pdf"),
            Path("mohw", "report", "예산.xlsx"),
        ]
        for index, relative_path in enumerate(relative_paths):
            target = Path(self.document_directory.name) / relative_path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(f"file-{index}".encode())
        document = self.create_document(
            other_file_paths="|".join(
                path.as_posix() for path in relative_paths
            )
        )
        client = self.login_client(self.create_user())

        response = client.get(
            reverse(
                "auth_api:research-document-other-file",
                args=[document.pk, 1],
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertEqual(b"".join(response.streaming_content), b"file-1")

    def test_missing_file_root_path_and_index_return_clear_errors(self):
        document = self.create_document(
            body_file_path="missing.pdf",
            other_file_paths="first.pdf",
        )
        client = self.login_client(self.create_user())

        missing_file = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            )
        )
        missing_index = client.get(
            reverse(
                "auth_api:research-document-other-file",
                args=[document.pk, 2],
            )
        )
        with override_settings(RESEARCH_DOCUMENT_ROOT=None):
            missing_root = client.get(
                reverse(
                    "auth_api:research-document-body-file",
                    args=[document.pk],
                )
            )

        self.assertEqual(missing_file.status_code, 404)
        self.assertEqual(missing_index.status_code, 404)
        self.assertEqual(missing_root.status_code, 503)

    def test_files_outside_o_s_c_classifications_are_not_exposed(self):
        relative_path = Path("unclassified", "draft.pdf")
        target = Path(self.document_directory.name) / relative_path
        target.parent.mkdir(parents=True)
        target.write_bytes(b"draft")
        document = self.create_document(
            category="UNKNOWN",
            body_file_path=relative_path.as_posix(),
            other_file_paths=relative_path.as_posix(),
        )
        client = self.login_client(self.create_user())

        body_response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            )
        )
        other_response = client.get(
            reverse(
                "auth_api:research-document-other-file",
                args=[document.pk, 0],
            )
        )

        self.assertEqual(body_response.status_code, 404)
        self.assertEqual(other_response.status_code, 404)

    def test_missing_document_and_body_pointer_return_not_found(self):
        document = self.create_document(body_file_path=None)
        client = self.login_client(self.create_user())

        missing_document = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk + 999],
            )
        )
        missing_pointer = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            )
        )

        self.assertEqual(missing_document.status_code, 404)
        self.assertEqual(missing_pointer.status_code, 404)

    def test_absolute_and_backslash_paths_are_rejected(self):
        absolute = self.create_document(body_file_path="/etc/passwd")
        backslash = self.create_document(
            body_file_path="mohw\\report\\secret.pdf"
        )
        client = self.login_client(self.create_user())

        absolute_response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[absolute.pk],
            )
        )
        backslash_response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[backslash.pk],
            )
        )

        self.assertEqual(absolute_response.status_code, 404)
        self.assertEqual(backslash_response.status_code, 404)

    def test_unknown_file_type_uses_attachment_and_binary_content_type(self):
        relative_path = Path("mohw", "report", "archive.custom")
        target = Path(self.document_directory.name) / relative_path
        target.parent.mkdir(parents=True)
        target.write_bytes(b"binary")
        document = self.create_document(
            body_file_path=relative_path.as_posix()
        )
        client = self.login_client(self.create_user())

        response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[document.pk],
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["Content-Type"],
            "application/octet-stream",
        )
        self.assertIn("attachment", response["Content-Disposition"])

    def test_traversal_and_symlink_escape_are_rejected(self):
        outside_directory = TemporaryDirectory()
        self.addCleanup(outside_directory.cleanup)
        outside_file = Path(outside_directory.name) / "secret.pdf"
        outside_file.write_bytes(b"secret")
        link_path = Path(self.document_directory.name) / "link.pdf"
        link_path.symlink_to(outside_file)
        traversal = self.create_document(body_file_path="../secret.pdf")
        symlink = self.create_document(body_file_path="link.pdf")
        client = self.login_client(self.create_user())

        traversal_response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[traversal.pk],
            )
        )
        symlink_response = client.get(
            reverse(
                "auth_api:research-document-body-file",
                args=[symlink.pk],
            )
        )

        self.assertEqual(traversal_response.status_code, 404)
        self.assertEqual(symlink_response.status_code, 404)

    def test_database_errors_are_returned_as_service_unavailable(self):
        client = self.login_client(self.create_user())
        with patch.object(
            Document.objects,
            "aggregate",
            side_effect=OperationalError("database unavailable"),
        ):
            response = client.get(
                reverse("auth_api:research-document-summary")
            )

        self.assertEqual(response.status_code, 503)

    def test_only_get_is_allowed(self):
        client = self.login_client(self.create_user())

        response = client.post(
            reverse("auth_api:research-document-summary")
        )

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response["Allow"], "GET")
