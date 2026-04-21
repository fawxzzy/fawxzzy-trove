import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ActionLink } from "@/components/catalog/action-link";
import { apps, getAppBySlug, getInstallStrategyLabel, getStatusMeta } from "@/data/apps";
import { getDetailActions } from "@/lib/catalog";

type AppPageProps = PageProps<"/apps/[slug]">;

export async function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    return {
      title: "App not found",
    };
  }

  return {
    title: app.name,
    description: `${app.description} Install strategy: ${getInstallStrategyLabel(
      app.installStrategy,
    )}.`,
  };
}

export default async function AppDetailPage({ params }: AppPageProps) {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    notFound();
  }

  const status = getStatusMeta(app.status);
  const actions = getDetailActions(app);
  const relatedApps = apps.filter((candidate) => candidate.slug !== app.slug).slice(0, 2);

  return (
    <main className="pb-16 pt-6 md:pb-24 md:pt-8">
      <div className="shell-container">
        <div className="mb-4">
          <Link className="meta-chip" href="/">
            Back to catalog
          </Link>
        </div>

        <section className="surface-panel rounded-[34px] px-5 py-5 md:px-8 md:py-7">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="status-pill"
                  style={{ backgroundColor: status.tone }}
                >
                  {status.label}
                </span>
                <span className="meta-chip">
                  {getInstallStrategyLabel(app.installStrategy)}
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="section-title text-text">{app.name}</h1>
                <p className="max-w-2xl text-base leading-8 text-muted">
                  {app.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag) => (
                  <span className="meta-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <ActionLink action={action} key={`${app.slug}-${action.label}`} />
                ))}
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-[28px] border border-[color:rgb(var(--stroke)/0.12)] p-5"
              style={{
                background: `linear-gradient(140deg, ${app.accent.from} 0%, ${app.accent.to} 100%)`,
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_42%,rgba(2,6,11,0.24))]" />
              <div className="relative flex h-full min-h-[18rem] flex-col justify-between">
                <div className="rounded-[22px] border border-white/14 bg-black/14 p-3 backdrop-blur-sm">
                  <Image
                    src={app.icon}
                    alt={`${app.name} icon`}
                    width={64}
                    height={64}
                  />
                </div>
                <div className="self-end rounded-[24px] border border-white/14 bg-black/14 p-2 backdrop-blur-sm">
                  <Image
                    src={app.heroImage}
                    alt={`${app.name} artwork`}
                    width={360}
                    height={220}
                    className="rounded-[18px]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface-card rounded-[30px] p-5">
            <p className="eyebrow">Platforms</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Where this surface fits
            </h2>
            <div className="hairline my-5" />
            <div className="space-y-3 text-sm text-muted">
              <p>{app.platforms.join(" • ")}</p>
              <p>
                App slug: <span className="font-mono text-text">{app.slug}</span>
              </p>
            </div>
          </div>

          <div className="surface-card rounded-[30px] p-5" id="install">
            <p className="eyebrow">Install Strategy</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {getInstallStrategyLabel(app.installStrategy)}
            </h2>
            <div className="hairline my-5" />
            <div className="space-y-3 text-sm leading-7 text-muted">
              {app.installNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-card rounded-[30px] p-5">
            <p className="eyebrow">Grounded Evidence</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Why Trove shows this state
            </h2>
            <div className="hairline my-5" />
            <ul className="space-y-3 text-sm leading-7 text-muted">
              {app.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="surface-card rounded-[30px] p-5">
            <p className="eyebrow">Nearby Surfaces</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Other apps in Trove
            </h2>
            <div className="hairline my-5" />
            <div className="space-y-3">
              {relatedApps.map((related) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-[color:rgb(var(--stroke)/0.12)] bg-[color:rgb(var(--panel-strong)/0.7)] px-4 py-3 transition hover:border-[color:rgb(var(--stroke)/0.24)]"
                  href={`/apps/${related.slug}`}
                  key={related.slug}
                >
                  <div>
                    <div className="font-medium text-text">{related.name}</div>
                    <div className="text-sm text-muted">{related.description}</div>
                  </div>
                  <span className="meta-chip">View</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
