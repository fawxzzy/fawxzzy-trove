# Fawxzzy-Trove Repo Rules

Scope
- Applies to `C:\ATLAS\repos\fawxzzy-trove`.

Purpose
- Trove is the catalog layer for Fawxzzy applications.
- Keep this repo metadata-driven, install-honest, and lightweight.
- Trove links users into each app's own origin or detail page. It must not fake cross-origin PWA install prompts.

Rules
- Read the relevant App Router guidance in `node_modules/next/dist/docs/01-app/` before making framework-level changes.
- Keep app-catalog truth centralized in `src/data/apps.ts`.
- Only publish live URLs when they are grounded by local stack evidence.
- Treat install behavior as content plus routing, not as a synthetic browser install API.
- Use the ATLAS branding pipeline outputs that sync into `public/`; do not create repo-owned canonical app icons.

Verification
- Run `npm run verify` before claiming completion.
