# Frontend instructions

Scope changes to the React client in this directory unless an API contract requires a
matching backend change.

- Use React, Vite, TypeScript, and Tailwind CSS v4.
- Prefer Tailwind utility classes for new UI and keep shared theme values in the global
  Tailwind CSS theme instead of scattering hard-coded values.
- Run `npm run lint` and `npm run build` before shipping.
- Call the backend through relative `/api/` URLs. Do not hard-code EC2 IPs or ports.
- Use cookie-based sessions with CSRF protection. Do not store passwords or session
  credentials in localStorage.
- Keep components and styling in `frontend/`; do not add React assets to Django templates.
- Keep FSD dependencies flowing downward: `app` → `pages` → `widgets` → `features` →
  `entities` → `shared`. A lower layer must not import a higher layer.
- Pages compose screens. Put rendering in `ui/`, state and event behavior in `model/`
  custom hooks, and endpoint calls in `api/`. Do not move form state or API requests back
  into page components.
- See `../docs/ARCHITECTURE.md` for the auth and FSD boundaries. Follow
  `../CONTRIBUTING.md` for Git Flow and verification commands.
