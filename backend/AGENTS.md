# Backend instructions

Scope changes to the Django service in this directory unless an API contract requires a
matching frontend change.

- Use the `necton_auth_env` Conda environment and Python 3.12.
- Run tests with `python manage.py test` from `backend/`.
- Use `DJANGO_*` and `DB_*` environment variables from `.env.example`.
- Preserve compatibility with the existing MariaDB `USER` table and password hashes.
- Keep role values aligned with `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_USER`, and `USER`.
- During signup, reuse the existing `company_id` for a case-insensitive matching
  `company_name`; creating a new company ID or changing that policy requires an explicit
  data-model decision.
- Do not create or alter production DB columns without an explicit migration decision.
- Keep authentication in secure cookies. Do not introduce browser-local auth tokens by
  default.
- New React-facing endpoints belong under `/api/` and return JSON.
- Existing templates are temporary compatibility UI; avoid adding new product UI there.
- See `../docs/ARCHITECTURE.md` for the API, session, legacy table, and deployment
  boundaries. Follow `../CONTRIBUTING.md` for Git Flow and verification commands.
