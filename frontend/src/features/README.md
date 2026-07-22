# features

User-facing interactions that change data or app state (e.g. `auth-login`,
`comment-add`, `theme-toggle`). Each feature is a slice with its own `ui`,
`model`, and `api` segments as needed. Features may use `entities` and
`shared`, never `widgets`, `pages`, or other `features`.
