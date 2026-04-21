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
