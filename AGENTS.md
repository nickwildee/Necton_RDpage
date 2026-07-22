# Repository instructions

This repository contains two independently runnable projects:

- `backend/`: Django authentication server
- `frontend/`: React web client

Read and follow the nearest nested `AGENTS.md` before changing a project. Keep each
project's dependencies, environment variables, tests, and deployment commands inside
that project. Do not commit secrets or `.env` files.

Before changing code, read `CONTRIBUTING.md` and `docs/ARCHITECTURE.md`, then inspect
the current branch, `git status`, and recent log. Normal work branches from `develop`
and returns to `develop` through a pull request. Do not commit directly to `develop` or
`main`. Only verified releases move from `develop` to `main` through a pull request.

Keep the requested scope narrow. Do not add speculative auth, deployment, or product
features during a demo-focused task. Preserve unrelated user changes and do not modify
the separate crawler repository or stop/replace an existing EC2 service unless the
current task explicitly includes deployment and replacement verification.

Do not remove the existing Django templates until the React replacement has matching
login, signup, logout, and error behavior with verified tests.

Authentication uses Django session cookies and CSRF on same-origin relative `/api/`
requests. Do not introduce JWT or localStorage credentials unless explicitly requested.
The only role values are `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_USER`, and `USER`. Hiding a
frontend menu is not authorization; Django must protect every privileged API.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool.
When in doubt, invoke the skill.

- Product ideas/brainstorming: `/office-hours`
- Strategy/scope: `/plan-ceo-review`
- Architecture: `/plan-eng-review`
- Bugs/errors: `/investigate`
- QA/testing: `/qa` or `/qa-only`
- Code review: `/review`
- Visual polish: `/design-review`
- Ship/deploy/PR: `/ship` or `/land-and-deploy`
