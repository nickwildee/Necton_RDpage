# Frontend instructions

Scope changes to the React client in this directory unless an API contract requires a
matching backend change.

- Use React, Vite, and TypeScript.
- Run `npm run lint` and `npm run build` before shipping.
- Call the backend through relative `/api/` URLs. Do not hard-code EC2 IPs or ports.
- Use cookie-based sessions with CSRF protection. Do not store passwords or session
  credentials in localStorage.
- Keep components and styling in `frontend/`; do not add React assets to Django templates.
