from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class UserCompanyFieldsMigrationTests(TransactionTestCase):
    migrate_from = [("accounts", "0001_initial")]
    migrate_to = [("accounts", "0003_user_company_fields")]

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_from)
        old_apps = executor.loader.project_state(self.migrate_from).apps
        old_user = old_apps.get_model("accounts", "User")
        old_user.objects.create(
            email="migration@example.com",
            password="hashed-password",
            company="Necton",
        )

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        self.apps = executor.loader.project_state(self.migrate_to).apps

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDown()

    def test_company_data_is_preserved_in_new_fields(self):
        user = self.apps.get_model("accounts", "User").objects.get(
            email="migration@example.com",
        )

        self.assertEqual(user.company_id, 1)
        self.assertEqual(user.company_name, "Necton")
