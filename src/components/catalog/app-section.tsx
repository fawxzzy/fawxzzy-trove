import Image from "next/image";
import type { CSSProperties } from "react";
import type { CatalogApp } from "@/data/apps";
import { getAppActions } from "@/lib/catalog";
import { ActionLink } from "@/components/catalog/action-link";

type AppSectionProps = {
  app: CatalogApp;
  index: number;
};

export function AppSection({ app, index }: AppSectionProps) {
  const actions = getAppActions(app);
  const evidence = app.installUrl
    ? [
        "Open the live app or begin install on the app's own origin.",
        "The icon and screenshots stay grounded to the shipped surface.",
      ].join(" ")
    : [
        "Open the live app from its grounded origin.",
        "The icon and screenshots stay grounded to the shipped surface.",
      ].join(" ");

  return (
    <section className="catalog-section" id={app.slug}>
      <div className="catalog-section__copy surface-panel">
        <div
          className="catalog-section__glow"
          style={
            {
              "--section-from": app.accent.from,
              "--section-glow": app.accent.glow,
              "--section-panel": app.accent.panel,
              "--section-to": app.accent.to,
            } as CSSProperties
          }
        />

        <div className="catalog-section__eyebrow">
          <span className="eyebrow">App {String(index + 1).padStart(2, "0")}</span>
          <span className="meta-chip">{app.slug}</span>
        </div>

        <div className="catalog-section__body">
          <div className="catalog-section__header">
            <div className="catalog-section__title">
              <Image
                alt={`${app.name} icon`}
                className="catalog-section__icon"
                height={72}
                src={app.icon.src}
                unoptimized
                width={72}
              />
              <div>
                <h2>{app.name}</h2>
                <p>{app.tagline}</p>
              </div>
            </div>

            <div className="catalog-section__actions">
              {actions.map((action) => (
                <ActionLink action={action} key={`${app.slug}-${action.label}`} />
              ))}
            </div>
          </div>

          <div className="catalog-section__support">
            <p className="catalog-section__description">{app.description}</p>

            <div className="catalog-section__meta">
              <div className="catalog-section__tags">
                {app.tags.map((tag) => (
                  <span className="meta-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <p className="catalog-section__evidence">{evidence}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog-rail">
        <div className="catalog-rail__header">
          <div>
            <p className="eyebrow">Screenshots</p>
            <h3>Real app surfaces, inline on the catalog</h3>
          </div>
          <p>
            Captured from the live app origin so the rail reads like a storefront,
            not a placeholder deck.
          </p>
        </div>

        <div className="catalog-rail__track">
          {app.screenshots.map((shot) => (
            <figure className="shot-card" key={shot.src}>
              <div className="shot-card__frame">
                <Image
                  alt={shot.alt}
                  className="shot-card__image"
                  height={1024}
                  priority={index === 0}
                  src={shot.src}
                  width={1440}
                />
              </div>
              <figcaption>
                <span>{shot.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
