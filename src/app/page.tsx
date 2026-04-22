import Image from "next/image";
import { ActionLink } from "@/components/catalog/action-link";
import { AppSection } from "@/components/catalog/app-section";
import { apps } from "@/data/apps";
import { getAppActions } from "@/lib/catalog";

export default function Home() {
  return (
    <main className="catalog-page">
      <div className="shell-container">
        <section className="hero surface-panel">
          <div className="hero__copy">
            <div className="hero__intro">
              <p className="eyebrow">Fawxzzy Trove</p>
              <h1 className="hero__title">Live Fawxzzy apps.</h1>
            </div>

            <div className="hero__actions">
              <a className="catalog-button catalog-button--primary" href="#catalog">
                Browse apps
              </a>
              <a className="catalog-button catalog-button--secondary" href="#fitness">
                See screenshots
              </a>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__art">
              <Image
                alt="Trove brand artwork"
                height={940}
                src="/brand/trove-orbit.svg"
                unoptimized
                width={940}
              />
            </div>
          </div>
        </section>

        <section className="catalog-index" id="catalog">
          {apps.map((app) => {
            const actions = getAppActions(app);

            return (
              <article className="catalog-index__item surface-card" key={app.slug}>
                <div className="catalog-index__top">
                  <div className="catalog-index__header">
                    <strong>{app.name}</strong>
                    <a className="catalog-index__anchor" href={`#${app.slug}`}>
                      Screenshots
                    </a>
                  </div>

                  <div className="catalog-index__actions">
                    {actions.map((action) => (
                      <ActionLink action={action} key={`${app.slug}-${action.label}`} />
                    ))}
                  </div>

                  <div className="catalog-index__summary">
                    <p>{app.tagline}</p>
                  </div>
                </div>

                <div className="catalog-index__meta">
                  {app.tags.map((tag) => (
                    <span className="meta-chip" key={`${app.slug}-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <div className="catalog-stack">
          {apps.map((app, index) => (
            <AppSection app={app} index={index} key={app.slug} />
          ))}
        </div>
      </div>
    </main>
  );
}
