import Image from "next/image";
import { AppSection } from "@/components/catalog/app-section";
import { apps } from "@/data/apps";

export default function Home() {
  return (
    <main className="catalog-page">
      <div className="shell-container">
        <section className="hero surface-panel">
          <div className="hero__copy">
            <p className="eyebrow">Fawxzzy Trove</p>
            <h1 className="hero__title">
              One clean storefront for the live Fawxzzy apps that matter right
              now.
            </h1>
            <p className="hero__lede">
              Trove is a simple catalog again: grounded launch links, app-owned
              install flow, and real screenshots inline instead of detail-page
              detours.
            </p>

            <div className="hero__actions">
              <a className="catalog-button catalog-button--primary" href="#fitness">
                Browse apps
              </a>
              <a className="catalog-button catalog-button--secondary" href="#mazer">
                Jump to Mazer
              </a>
            </div>

            <div className="hero__chips">
              <span className="meta-chip">2 live apps</span>
              <span className="meta-chip">6 real screenshots</span>
              <span className="meta-chip">Icons sourced from app origins</span>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__stat surface-card">
              <span className="field-label">Open now</span>
              <strong>{apps.length}</strong>
              <p>Fitness and Mazer stay front-and-center with grounded launch links and current captures.</p>
            </div>

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

        <section className="catalog-index">
          {apps.map((app) => (
            <a className="catalog-index__item surface-card" href={`#${app.slug}`} key={app.slug}>
              <span className="field-label">{app.slug}</span>
              <strong>{app.name}</strong>
              <p>{app.tagline}</p>
            </a>
          ))}
        </section>

        <div className="catalog-stack">
          {apps.map((app, index) => (
            <AppSection app={app} index={index} key={app.slug} />
          ))}
        </div>

        <section className="catalog-footer surface-card">
          <p className="eyebrow">Grounded Catalog</p>
          <h2>Trove keeps the storefront tight.</h2>
          <p>
            Live URLs are grounded before they ship, install calls stay inside each
            app, and the catalog only carries screenshots that came from real app
            surfaces.
          </p>
        </section>
      </div>
    </main>
  );
}
