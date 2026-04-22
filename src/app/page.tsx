import Image from "next/image";
import { AppSection } from "@/components/catalog/app-section";
import { apps } from "@/data/apps";

export default function Home() {
  return (
    <main className="catalog-page">
      <div className="shell-container">
        <section className="hero surface-panel">
          <div className="hero__copy">
            <div className="hero__intro">
              <p className="eyebrow">Fawxzzy Trove</p>
              <h1 className="hero__title">
                One clean storefront for the live Fawxzzy apps that matter right
                now.
              </h1>
            </div>

            <div className="hero__actions">
              <a className="catalog-button catalog-button--primary" href="#catalog">
                Browse live apps
              </a>
              <a className="catalog-button catalog-button--secondary" href="#fitness">
                See live proof
              </a>
            </div>

            <div className="hero__body readable-column">
              <p className="hero__lede">
                Trove keeps the launch path honest and easy to scan: truthful
                app actions first, supporting context second, and real
                screenshots inline instead of detail-page detours.
              </p>

              <div className="hero__chips">
                <span className="meta-chip">2 live apps</span>
                <span className="meta-chip">6 real screenshots</span>
                <span className="meta-chip">Icons sourced from app origins</span>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__stat surface-card">
              <span className="field-label">Open now</span>
              <strong>{apps.length}</strong>
              <p>
                Fitness and Mazer stay centered, launch-ready, and grounded by
                current captures from the live app surfaces.
              </p>
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

        <div className="catalog-stack" id="catalog">
          {apps.map((app, index) => (
            <AppSection app={app} index={index} key={app.slug} />
          ))}
        </div>
      </div>
    </main>
  );
}
