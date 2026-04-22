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

        <div className="catalog-stack" id="catalog">
          {apps.map((app, index) => (
            <AppSection app={app} index={index} key={app.slug} />
          ))}
        </div>
      </div>
    </main>
  );
}
