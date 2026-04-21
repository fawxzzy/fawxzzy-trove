import type { CatalogActionLabel, CatalogApp } from "@/data/apps";

export type CatalogAction = {
  label: CatalogActionLabel;
  href: string | null;
  kind: "external" | "disabled";
  emphasis: "primary" | "secondary";
};

export function getAppActions(app: CatalogApp) {
  const actions: CatalogAction[] = [
    {
      label: "Open app",
      href: app.liveUrl,
      kind: "external",
      emphasis: "primary",
    },
  ];

  if (app.installUrl) {
    actions.push({
      label: "Install in app",
      href: app.installUrl,
      kind: "external",
      emphasis: "secondary",
    });
  }

  return actions;
}
