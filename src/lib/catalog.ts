import type { CatalogActionLabel, CatalogApp } from "@/data/apps";

export type CatalogAction = {
  label: CatalogActionLabel;
  href: string | null;
  kind: "external" | "disabled";
  emphasis: "primary" | "secondary";
  navigation: "same-tab" | "new-tab";
};

const INSTALL_INTENT_PARAM = "install";
const INSTALL_INTENT_VALUE = "1";

function buildInstallHref(installUrl: string | null, liveUrl: string) {
  const sourceUrl = installUrl ?? liveUrl;

  try {
    const url = new URL(sourceUrl);
    url.searchParams.set(INSTALL_INTENT_PARAM, INSTALL_INTENT_VALUE);
    return url.toString();
  } catch {
    return sourceUrl;
  }
}

export function getAppActions(app: CatalogApp) {
  const actions: CatalogAction[] = [
    {
      label: "Install",
      href: buildInstallHref(app.installUrl, app.liveUrl),
      kind: "external",
      emphasis: "primary",
      navigation: "new-tab",
    },
    {
      label: "Open app",
      href: app.liveUrl,
      kind: "external",
      emphasis: "secondary",
      navigation: "new-tab",
    },
  ];

  return actions;
}
