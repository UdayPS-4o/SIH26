# Materials (`/materials`)

## What It Does
A document/learning-materials library for SOC analysts — browsable by category, searchable, with view and download actions.

## Data Flow
- **HTTP API** — `GET /api/materials` returns the full materials catalogue (title, category, description, file URL, tags). `GET /api/materials/:id` fetches a single material.
- **Local state** — `searchQuery`, `selectedCategory`, `selectedMaterial` (for detail modal), `viewMode` (grid/list).
- **No WebSocket involvement** — materials are static content; no live updates expected.
- **Download action** — constructs a `<a download>` link pointing to the API-returned file URL.

## What Is Real
- Materials catalogue comes from the backend API — titles, categories, descriptions, file paths.
- Category filter chips operate on the real API response data.
- Search/filter narrows the real materials array client-side.
- Material detail modal renders full metadata (title, description, tags, file size, last updated) from API.
- Download button links to the real file URL returned by the API.
- View-mode toggle (grid/list) is functional client-side CSS class switching.

## What Is Fake
| Aspect | How |
|---|---|
| Material thumbnails | Placeholder SVG icons per category; no real document preview images. |
| File size formatting | Client-side `formatBytes()` utility; accurate but computed, not from server. |
| "Popular" / "New" badges | Hardcoded boolean flags on material objects (`isPopular: true`). |
| Default category list | `["All", "Training", "Guides", "Reports", "Policies", "Tools"]` hardcoded in component. |
| Total count badge | Derived from `materials.length`; real count but not server-paginated. |

## Verdict
~80% real. The content catalogue, metadata, and download links are all API-driven. Thumbnails and badge flags are cosmetic placeholders.
