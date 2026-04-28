# Trove

Trove is the one-page storefront for the live Fawxzzy apps.

It keeps the catalog simple:

- grounded launch URLs only
- app-owned install flow only
- mobile-first CTA hierarchy surfaces the primary truthful action before long supporting copy
- inline screenshot rails on `/`
- no detail pages
- no repo-facing CTA clutter

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run smoke:lifeline
npm run verify
```

`npm run start` serves the static export from `out/` on port `3000` through the checked-in exact-port static server.
`npm run smoke:lifeline` serves the static export and checks `/`, `/healthz.json`, and `manifest.webmanifest`.

## Catalog contract

Update `src/data/apps.ts` when the storefront changes.

Each app entry now owns:

- grounded `liveUrl`
- optional `installUrl`
- remote icon source
- local screenshot rail entries
- short consumer-facing copy and tags

Install buttons are same-tab handoffs into the app's own origin. Trove appends
`?install=1` to the grounded install URL, or falls back to the grounded live URL
when a separate install URL is not available.

## Grounding live URLs

Do not guess app domains.

Current grounded URLs:

- Fitness: `https://fawxzzy-fitness-local.vercel.app`
- Mazer: `https://fawxzzy-mazer.vercel.app`

Grounding rule:

1. Use a real attached custom domain if Vercel confirms it.
2. Otherwise use the stable project `.vercel.app` production URL.
3. If neither exists, omit the live CTA.

`https://fitness.fawxzzy.com/` is intentionally not used.

## Icon sourcing

Trove does not keep repo-owned canonical app icons anymore.

Current icon sources:

- Fitness: `https://fawxzzy-fitness-local.vercel.app/app/icon-192.png`
- Mazer: `https://fawxzzy-mazer.vercel.app/icons/mazer-emblem.svg`

Those paths are owned by the app repos and stay in sync with the live apps.

## Screenshot refresh

Screenshots are committed under `public/apps/<slug>/screenshots/`.

Current capture sources:

- Fitness:
  - `/`
  - `/login`
  - `/signup`
- Mazer:
  - `/?content=core-only`
  - `/?content=core-only&mode=play`
  - `/?content=core-only&theme=ember`

Refresh workflow:

1. Capture from the live app origin when the public surface is available.
2. Fall back to a grounded local preview only if the live surface is unavailable.
3. Replace the screenshot files in the matching `public/apps/<slug>/screenshots/` folder.
4. Keep captions in `src/data/apps.ts` aligned with the captured routes.

Headless Edge was used for the current capture set.

## Static export

Trove is intentionally configured as a static export in `next.config.ts`.

Keep the catalog compatible with export:

- do not reintroduce dynamic app detail routes
- avoid server-only runtime behavior on `/`
- keep the catalog content build-time static

## Lifeline pilot

Wave 1 pilot cutover files live in:

- `.lifeline/trove.lifeline.yml`
- `.lifeline/wave1-deploy.manifest.json`
- `docs/lifeline-wave1-pilot.md`

Those files pin Trove to the current Lifeline runtime and deploy contract without widening Trove into a platform repo.

## Shared preview deploy lane

Pull requests now have a Trove-owned shared preview lane in GitHub Actions.

- `verify` stays the required gate and remains separate from deploy.
- The preview job builds and publishes a concrete GHCR image only for same-repo pull requests.
- Preview release metadata is derived from Lifeline `main` at workflow time using the merged Wave 1 release-target contract.
- The workflow targets the shared preview hostname `https://preview-trove.fawxzzy.com/`.
- The PR comment is updated in place with the preview URL, release id, artifact ref, and skipped or failed status when deployment cannot run.

Host prerequisites for the shared preview lane:

- Docker installed on the preview host
- Node available on the preview host for the bundled Lifeline Wave 1 release-engine modules
- SSH access configured through:
  - `LIFELINE_PREVIEW_HOST`
  - `LIFELINE_PREVIEW_USER`
  - `LIFELINE_PREVIEW_SSH_KEY`
- optional host hardening and registry overrides:
  - `LIFELINE_PREVIEW_KNOWN_HOSTS`
  - `LIFELINE_PREVIEW_STATE_ROOT`
  - `LIFELINE_PREVIEW_REGISTRY_USERNAME`
  - `LIFELINE_PREVIEW_REGISTRY_TOKEN`

Workflow-emitted deployment artifacts:

- preview-scoped deploy manifest
- Lifeline dry-run plan
- Lifeline release plan
- Lifeline release metadata

## Local-only files

Never commit:

- `.vercel/`
- `.env.local`
- `.env.production.local`
- pulled env files
- machine-local Vercel linkage state
