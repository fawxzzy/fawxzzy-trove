import Image from "next/image";
import type { CSSProperties } from "react";
import { getInstallStrategyLabel, getStatusMeta, type CatalogApp } from "@/data/apps";
import { getCardActions } from "@/lib/catalog";
import { ActionLink } from "@/components/catalog/action-link";

type AppCardProps = {
  app: CatalogApp;
};

export function AppCard({ app }: AppCardProps) {
  const status = getStatusMeta(app.status);
  const actions = getCardActions(app);
  const accentStyle = {
    "--accent-glow": app.accent.glow,
  } as CSSProperties;

  return (
    <article className="surface-card group flex h-full flex-col rounded-[30px] p-4 md:p-5">
      <div className="card-accent" style={accentStyle} />
      <div className="relative overflow-hidden rounded-[24px] border border-[color:rgb(var(--stroke)/0.12)]">
        <div
          className="absolute inset-0 opacity-85"
          style={{
            background: `linear-gradient(135deg, ${app.accent.from} 0%, ${app.accent.to} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_40%,rgba(2,6,11,0.22))]" />
        <div className="relative aspect-[16/10] px-5 py-5">
          <div className="absolute right-4 top-4">
            <span
              className="status-pill"
              style={{ backgroundColor: status.tone }}
            >
              {status.label}
            </span>
          </div>
          <div className="flex h-full items-end justify-between gap-4">
            <div className="rounded-[20px] border border-white/16 bg-black/12 p-3 backdrop-blur-sm">
              <Image
                src={app.icon}
                alt={`${app.name} icon`}
                width={56}
                height={56}
                priority={app.featured}
              />
            </div>
            <Image
              src={app.heroImage}
              alt={`${app.name} catalog artwork`}
              width={184}
              height={128}
              className="w-[10.5rem] rounded-[18px] border border-white/14 shadow-2xl"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-text">
              {app.name}
            </h3>
            <p className="mt-1 text-sm text-muted">{app.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="meta-chip">{getInstallStrategyLabel(app.installStrategy)}</span>
          {app.tags.map((tag) => (
            <span className="meta-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted">
          <div>
            <div className="field-label">Platforms</div>
            <p className="mt-1">{app.platforms.join(" • ")}</p>
          </div>
          <div>
            <div className="field-label">Status</div>
            <p className="mt-1">{status.label}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <ActionLink action={actions.primary} />
          {actions.secondary.map((action) => (
            <ActionLink action={action} key={`${app.slug}-${action.label}`} />
          ))}
        </div>
      </div>
    </article>
  );
}
