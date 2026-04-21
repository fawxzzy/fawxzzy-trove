# Trove

Trove is the app-catalog layer for the Fawxzzy stack. It presents grounded app metadata, links users into each app's own origin, and keeps install guidance truthful for independent PWAs.

## Product rule

Trove does not trigger another app's browser install prompt. The install surface belongs to the app the user is currently visiting, so Trove only does three things:

- link to the app when a grounded live URL exists
- explain install strategy on each app detail page
- keep unknown or non-live apps in a safe non-live state

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
npm run verify
```

## CI

GitHub Actions runs on pushes to `main` and pull requests targeting `main`.

The workflow installs with `npm ci` and then runs:

- `npm run lint`
- `npm run build`
- `npm run verify`

## Vercel operator notes

Trove is prepared for a local-first Vercel CLI workflow. The repo keeps Git-triggered Vercel deploys disabled in `vercel.json`, and `_stack` already points at the approved Trove preview, prebuilt, and production command surfaces.

### Manual binding steps

Linking Trove to a real Vercel project is still manual:

```bash
pnpm dlx vercel --cwd . link --yes --project <name-or-id> --scope <team>
pnpm dlx vercel --cwd . open
```

Pulling local Vercel project settings and environment variables is also manual:

```bash
pnpm dlx vercel --cwd . pull
pnpm dlx vercel --cwd . pull .env.production.local --environment=production
```

### After linking

Once the repo is linked to the correct Vercel project, the approved operator path stays in `_stack`:

- `pnpm run trove:verify`
- `pnpm run trove:deploy:preview`
- `pnpm run trove:build:vercel`
- `pnpm run trove:deploy:prebuilt`
- `pnpm run trove:deploy:prod`
- `pnpm run trove:deploy:prebuilt:prod`

### Never commit local Vercel state

Keep these local-only:

- `.vercel/`
- `.env.local`
- `.env.production.local`
- any pulled env files, tokens, or machine-local project linkage state

### Where grounded URLs belong

- Do not commit ad hoc preview URLs from one-off deploys.
- Once Trove has a real stack-managed public hostname or preview hostname contract, record that in the stack topology source of truth first.
- For Atlas-managed public environment hints, `_stack` already treats `repos/fawxzzy-atlas/docs/LIFELINE_TOPOLOGY_MANIFEST.json` as the read-only topology contract.
- Trove should only expose grounded app URLs in `src/data/apps.ts` after that upstream stack evidence exists.

## Editing the catalog

Edit `src/data/apps.ts` to add or update apps.

Each entry supports:

- `name`
- `slug`
- `description`
- `icon`
- `heroImage`
- `status`
- `appUrl`
- `repoUrl`
- `tags`
- `accent`
- `platforms`
- `installStrategy`
- `installNotes`
- `featured`
- grounded evidence notes used to keep live claims honest

## CTA model

Trove exposes only truthful states:

- `Open app` when a grounded app URL exists
- `Install in app` when the app owns the install flow and Trove can explain or route into it honestly
- `View details` when more context is needed or the app is not publicly reachable
- `Source repo` when a grounded repo remote exists
- `Coming soon` when there is no safe live destination yet

## Placeholder values that still need future binding

- Mazer currently has grounded repo truth and local install evidence, but no grounded public production URL in local stack files.
- Stream has grounded repo-local product doctrine, but no grounded public URL or Git remote in local stack files.
- Trove is scaffolded for later Vercel/project binding, but this pass does not perform live deployment or secret linkage.
