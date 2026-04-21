import { AppCard } from "@/components/catalog/app-card";
import { apps, getFeaturedApps, getOtherApps } from "@/data/apps";

const featuredApps = getFeaturedApps();
const otherApps = getOtherApps();

export default function Home() {
  return (
    <main className="pb-16 pt-6 md:pb-24 md:pt-8">
      <div className="shell-container">
        <section className="surface-panel hero-mesh rounded-[34px] px-5 py-6 md:px-8 md:py-8">
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <p className="eyebrow">Fawxzzy Stack Catalog</p>
              <div className="max-w-3xl space-y-4">
                <h1 className="section-title text-text">
                  Trove routes people into each app&apos;s real surface without
                  pretending one PWA can install another.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted md:text-lg">
                  Live apps open on their own origin. Install guidance stays on
                  the detail page when that is the truthful thing to do.
                  Unknown deployment URLs stay non-live until the stack declares
                  them.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="meta-chip">Independent app origins</span>
                <span className="meta-chip">Metadata-driven registry</span>
                <span className="meta-chip">ATLAS-root grounded URLs</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="surface-card rounded-[26px] p-4">
                <div className="field-label">Catalog apps</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                  {apps.length}
                </div>
                <p className="mt-2 text-sm text-muted">
                  Live, proof, and incubating surfaces from the current stack.
                </p>
              </div>
              <div className="surface-card rounded-[26px] p-4">
                <div className="field-label">Grounded live origins</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                  {apps.filter((app) => app.appUrl).length}
                </div>
                <p className="mt-2 text-sm text-muted">
                  Only URLs backed by local topology or stack evidence.
                </p>
              </div>
              <div className="surface-card rounded-[26px] p-4">
                <div className="field-label">Install rule</div>
                <div className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                  App owns prompt
                </div>
                <p className="mt-2 text-sm text-muted">
                  Trove links into install flow. It never fakes cross-origin
                  browser prompts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-text">
                Current stack picks
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted">
              Featured cards are grounded by local stack evidence. If a live URL
              is unknown, Trove keeps the surface honest instead of guessing.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {featuredApps.map((app) => (
              <AppCard app={app} key={app.slug} />
            ))}
          </div>
        </section>

        <section className="mt-12" id="catalog">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Registry</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-text">
                Grounded registry, not guessed launch links
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted">
              Each detail page carries the install strategy, evidence notes, and
              source links needed to keep future edits aligned.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {otherApps.map((app) => (
              <AppCard app={app} key={app.slug} />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-panel rounded-[30px] px-5 py-5 md:px-6">
            <p className="eyebrow">Install Truth</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">
              The card model stays honest by design.
            </h2>
            <div className="hairline my-5" />
            <div className="space-y-4 text-sm leading-7 text-muted">
              <p>
                `Open app` only appears when Trove has a grounded live URL.
              </p>
              <p>
                `Install in app` points users to the app-owned install surface
                or install guidance. Trove never tries to impersonate another
                origin&apos;s browser prompt.
              </p>
              <p>
                `View details` carries the truth for incubating apps and any
                product whose public route is not yet declared in the stack.
              </p>
            </div>
          </div>

          <div className="surface-card rounded-[30px] px-5 py-5 md:px-6">
            <p className="eyebrow">Source of truth</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">
              One metadata surface drives the catalog.
            </h2>
            <div className="hairline my-5" />
            <p className="field-copy text-sm">
              Update the catalog by editing `src/data/apps.ts`. Home cards,
              detail pages, status chips, and CTA states all derive from that
              single typed registry.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
