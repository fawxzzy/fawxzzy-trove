import Image from "next/image";
import { AmbientFitnessBackground } from "@/components/ambient/ambient-fitness-background";
import { AppSection } from "@/components/catalog/app-section";
import { apps } from "@/data/apps";

export default function Home() {
  return (
    <main className="catalog-page app-theme-sage">
      <AmbientFitnessBackground
        intensity="high"
        particleCount={18}
        pulseEnabled
        palette={{
          base: "#070C0A",
          glow: "#7F977C",
          glowStrong: "#A4B5A3",
          wisp: "#5C725D",
          particle: "#CFD8D0",
          warm: "#1C2420",
        }}
      />
      <div className="shell-container">
        <section className="hero surface-panel">
          <div className="hero__copy">
            <div className="hero__intro">
              <p className="eyebrow">Fawxzzy Trove</p>
              <div className="hero__art hero__art--inline">
                <Image
                  alt="Trove fox mark"
                  height={1280}
                  src="/brand/trove-foxmark.png"
                  unoptimized
                  width={1280}
                />
              </div>
            </div>

            <div className="hero__actions">
              <a className="catalog-button catalog-button--primary" href="#catalog">
                Browse
              </a>
            </div>
          </div>
        </section>

        <div className="catalog-stack" id="catalog">
          {apps.map((app) => (
            <AppSection app={app} key={app.slug} />
          ))}
        </div>
      </div>
    </main>
  );
}
