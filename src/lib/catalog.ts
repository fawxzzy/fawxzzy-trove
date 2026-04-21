import type { CatalogApp } from "@/data/apps";

export type CatalogAction = {
  label: string;
  href: string | null;
  kind: "internal" | "external" | "disabled";
  emphasis: "primary" | "secondary" | "ghost";
};

function detailHref(app: CatalogApp) {
  return `/apps/${app.slug}`;
}

export function getCardActions(app: CatalogApp) {
  const primary: CatalogAction = app.appUrl
    ? {
        label: "Open app",
        href: app.appUrl,
        kind: "external",
        emphasis: "primary",
      }
    : app.status === "coming-soon"
      ? {
          label: "Coming soon",
          href: null,
          kind: "disabled",
          emphasis: "primary",
        }
      : {
          label: "View details",
          href: detailHref(app),
          kind: "internal",
          emphasis: "primary",
        };

  const secondary: CatalogAction[] = [];

  if (app.installStrategy === "install-in-app") {
    secondary.push({
      label: "Install in app",
      href: `${detailHref(app)}#install`,
      kind: "internal",
      emphasis: "secondary",
    });
  }

  if (app.repoUrl) {
    secondary.push({
      label: "Source repo",
      href: app.repoUrl,
      kind: "external",
      emphasis: "ghost",
    });
  }

  return { primary, secondary };
}

export function getDetailActions(app: CatalogApp) {
  const actions: CatalogAction[] = [];

  if (app.appUrl) {
    actions.push({
      label: "Open app",
      href: app.appUrl,
      kind: "external",
      emphasis: "primary",
    });
  }

  if (app.installStrategy === "install-in-app" && app.appUrl) {
    actions.push({
      label: "Install in app",
      href: app.appUrl,
      kind: "external",
      emphasis: "secondary",
    });
  } else if (!app.appUrl) {
    actions.push({
      label: app.installStrategy === "coming-soon" ? "Coming soon" : "View details",
      href: app.installStrategy === "coming-soon" ? null : detailHref(app),
      kind: app.installStrategy === "coming-soon" ? "disabled" : "internal",
      emphasis: "secondary",
    });
  }

  if (app.repoUrl) {
    actions.push({
      label: "Source repo",
      href: app.repoUrl,
      kind: "external",
      emphasis: "ghost",
    });
  }

  if (actions.length === 0) {
    actions.push({
      label: "Coming soon",
      href: null,
      kind: "disabled",
      emphasis: "primary",
    });
  }

  return actions;
}
