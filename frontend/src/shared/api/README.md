# shared/api

Base API client setup (fetch wrapper, CSRF/cookie handling for the Django
backend, request/response types shared across slices). Concrete endpoints
live in the `entities`/`features` that use them, not here.
