from django.db import migrations, models


TABLE_NAME = "USER"


def _column_names(schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        description = connection.introspection.get_table_description(
            cursor,
            TABLE_NAME,
        )
    return {column.name.lower() for column in description}


def align_company_fields(apps, schema_editor):
    del apps
    columns = _column_names(schema_editor)
    table = schema_editor.quote_name(TABLE_NAME)
    company_id = schema_editor.quote_name("company_id")
    company_name = schema_editor.quote_name("company_name")
    legacy_company = schema_editor.quote_name("company")
    company_id_added = "company_id" not in columns

    with schema_editor.connection.cursor() as cursor:
        if company_id_added:
            cursor.execute(
                f"ALTER TABLE {table} "
                f"ADD COLUMN {company_id} integer NOT NULL DEFAULT 1"
            )
        if "company_name" not in columns:
            cursor.execute(
                f"ALTER TABLE {table} "
                f"ADD COLUMN {company_name} varchar(255) NULL"
            )
        if "company" in columns:
            cursor.execute(
                f"UPDATE {table} "
                f"SET {company_name} = {legacy_company} "
                f"WHERE {company_name} IS NULL"
            )

        if company_id_added:
            cursor.execute(
                f"SELECT DISTINCT {company_name} "
                f"FROM {table} "
                f"WHERE {company_name} IS NOT NULL "
                f"AND TRIM({company_name}) <> '' "
                f"ORDER BY {company_name}"
            )
            companies = []
            seen = set()
            for (value,) in cursor.fetchall():
                normalized = value.strip().casefold()
                if normalized not in seen:
                    seen.add(normalized)
                    companies.append(value.strip())

            for next_id, value in enumerate(companies, start=1):
                cursor.execute(
                    f"UPDATE {table} "
                    f"SET {company_id} = %s "
                    f"WHERE LOWER(TRIM({company_name})) = LOWER(%s)",
                    [next_id, value],
                )


def restore_legacy_company(apps, schema_editor):
    del apps
    columns = _column_names(schema_editor)
    table = schema_editor.quote_name(TABLE_NAME)
    company = schema_editor.quote_name("company")
    company_name = schema_editor.quote_name("company_name")

    with schema_editor.connection.cursor() as cursor:
        if "company" not in columns:
            cursor.execute(
                f"ALTER TABLE {table} "
                f"ADD COLUMN {company} varchar(255) NULL"
            )
        if "company_name" in columns:
            cursor.execute(
                f"UPDATE {table} SET {company} = {company_name}"
            )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_feature_models"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    align_company_fields,
                    restore_legacy_company,
                ),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name="user",
                    name="company",
                ),
                migrations.AddField(
                    model_name="user",
                    name="company_id",
                    field=models.IntegerField(),
                ),
                migrations.AddField(
                    model_name="user",
                    name="company_name",
                    field=models.CharField(
                        blank=True,
                        max_length=255,
                        null=True,
                    ),
                ),
            ],
        ),
    ]
