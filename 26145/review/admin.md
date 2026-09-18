# Admin (`/admin`)

## What It Does
An administration panel for managing users, system settings, and viewing audit logs — with role-based access and configuration forms.

## Data Flow
- **HTTP API** — `GET /api/admin/settings`, `GET /api/admin/users`, `GET /api/admin/audit-log` for reading. `PUT /api/admin/settings`, `POST /api/admin/users`, `DELETE /api/admin/users/:id` for mutations.
- **Local state** — `activeTab` (Settings/Users/Audit), `settings` object, `users` array, `auditLog` array, `isSaving`, `toast`.
- **No WebSocket** — admin data is configuration/log data, not live-feed.
- **Form handling** — controlled inputs with `onChange` handlers; "Save" button sends PUT/POST to API.

## What Is Real
- System settings (thresholds, notification preferences, retention policies) come from API and are persisted via PUT.
- User list (name, email, role, lastActive) from API; delete action calls real API endpoint.
- Audit log entries (action, user, timestamp, IP) from API.
- Tab switching renders real data per section.
- Form validation (required fields, email format) runs client-side before API submission.
- Toast notifications reflect actual API success/error responses.

## What Is Fake
| Aspect | How |
|---|---|
| Role definitions | Hardcoded enum (`["admin", "analyst", "viewer"]`) not fetched from API. |
| Settings field schemas | Static JS objects defining form fields (`{ key: "alertThreshold", label: "Alert Threshold", type: "number" }`). |
| Avatar initials | Computed from user.name via `name.split(" ").map(n => n[0]).join("")`. |
| Audit-log pagination | Client-side slice of the full array; not server-paginated. |
| Default settings values | Hardcoded fallback object used before API responds. |

## Verdict
~80% real. Settings, users, and audit log are API-driven with real CRUD operations. Hardcoded role enums, form schemas, and client-side pagination reduce the score.
