# Backend instructions

Scope changes to the Django service in this directory unless an API contract requires a
matching frontend change.

- Use the `necton_auth_env` Conda environment and Python 3.12.
- Run tests with `python manage.py test` from `backend/`.
- Use `DJANGO_*` and `DB_*` environment variables from `.env.example`.
- Preserve compatibility with the existing MariaDB `USER` table and password hashes.
- Do not create or alter production DB columns without an explicit migration decision.
- Keep authentication in secure cookies. Do not introduce browser-local auth tokens by
  default.
- New React-facing endpoints belong under `/api/` and return JSON.
- Existing templates are temporary compatibility UI; avoid adding new product UI there.
