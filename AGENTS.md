# Repository instructions

This repository contains two independently runnable projects:

- `backend/`: Django authentication server
- `frontend/`: React web client

Read and follow the nearest nested `AGENTS.md` before changing a project. Keep each
project's dependencies, environment variables, tests, and deployment commands inside
that project. Do not commit secrets or `.env` files.

Do not remove the existing Django templates until the React replacement has matching
login, signup, logout, and error behavior with verified tests.

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
