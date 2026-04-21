export type AppStatus = "live" | "local-proof" | "incubating" | "coming-soon";

export type InstallStrategy =
  | "install-in-app"
  | "open-only"
  | "details-only"
  | "coming-soon";

type Accent = {
  from: string;
  to: string;
  glow: string;
};

export type CatalogApp = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  heroImage: string;
  status: AppStatus;
  appUrl: string | null;
  repoUrl: string | null;
  tags: string[];
  accent: Accent;
  platforms: string[];
  installStrategy: InstallStrategy;
  installNotes: string[];
  featured: boolean;
  evidence: string[];
};

export const apps: CatalogApp[] = [
  {
    name: "Fawxzzy Fitness",
    slug: "fitness",
    description:
      "Workout logging, routine planning, and session tracking in a mobile-first application shell.",
    icon: "/apps/fitness-icon.svg",
    heroImage: "/apps/fitness-hero.svg",
    status: "live",
    appUrl: "https://fitness.fawxzzy.com",
    repoUrl: "https://github.com/fawxzzy/fawxzzy-fitness.git",
    tags: ["Wellness", "PWA", "Tracking"],
    accent: {
      from: "#47d7c4",
      to: "#63c4ff",
      glow: "rgb(115 255 227 / 0.46)",
    },
    platforms: ["Web", "iPhone", "Android"],
    installStrategy: "install-in-app",
    installNotes: [
      "Open Fitness on its own origin to use the browser's real install flow.",
      "Trove never proxies or simulates the browser install prompt for another app.",
    ],
    featured: true,
    evidence: [
      "Production hostname is grounded by repos/fawxzzy-atlas/docs/LIFELINE_TOPOLOGY_MANIFEST.json.",
      "Repository remote is grounded by stack.lock.yaml.",
    ],
  },
  {
    name: "Mazer",
    slug: "mazer",
    description:
      "A Phaser-based maze experience with installability proof work and repo-owned visual verification.",
    icon: "/apps/mazer-icon.svg",
    heroImage: "/apps/mazer-hero.svg",
    status: "local-proof",
    appUrl: null,
    repoUrl: "https://github.com/fawxzzy/fawxzzy-mazer.git",
    tags: ["Games", "Phaser", "Installability"],
    accent: {
      from: "#a58cff",
      to: "#ff7a72",
      glow: "rgb(214 160 255 / 0.42)",
    },
    platforms: ["Web", "Desktop", "Touch"],
    installStrategy: "details-only",
    installNotes: [
      "The app has its own install surface, but no public production origin is declared in the local stack files yet.",
      "Use Trove for status and repo discovery until a grounded live URL exists.",
    ],
    featured: true,
    evidence: [
      "Current product doctrine and install behavior are grounded by repos/fawxzzy-mazer/README.md.",
      "Repository remote is grounded by stack.lock.yaml.",
    ],
  },
  {
    name: "Fawxzzy Stream",
    slug: "stream",
    description:
      "A live-streaming control plane for operators, overlays, and reusable broadcast state.",
    icon: "/apps/stream-icon.svg",
    heroImage: "/apps/stream-hero.svg",
    status: "incubating",
    appUrl: null,
    repoUrl: null,
    tags: ["Streaming", "Operator", "Control Plane"],
    accent: {
      from: "#5dcfff",
      to: "#47d7c4",
      glow: "rgb(120 214 255 / 0.42)",
    },
    platforms: ["Web", "OBS", "Operator"],
    installStrategy: "coming-soon",
    installNotes: [
      "This lane is still incubating and does not expose a grounded public origin in local stack files.",
      "Treat it as a tracked future surface rather than a live install target.",
    ],
    featured: false,
    evidence: [
      "Purpose and current phase are grounded by repos/fawxzzy-stream/README.md.",
      "No public hostname or Git remote is declared for this repo in the current stack files.",
    ],
  },
];

export function getAppBySlug(slug: string) {
  return apps.find((app) => app.slug === slug);
}

export function getFeaturedApps() {
  return apps.filter((app) => app.featured);
}

export function getOtherApps() {
  return apps.filter((app) => !app.featured);
}

export function getStatusMeta(status: AppStatus) {
  switch (status) {
    case "live":
      return {
        label: "Live",
        tone: "rgb(var(--accent) / 0.18)",
      };
    case "local-proof":
      return {
        label: "Local Proof",
        tone: "rgb(var(--warning) / 0.18)",
      };
    case "incubating":
      return {
        label: "Incubating",
        tone: "rgb(var(--accent-strong) / 0.18)",
      };
    case "coming-soon":
      return {
        label: "Coming Soon",
        tone: "rgb(var(--stroke) / 0.18)",
      };
  }
}

export function getInstallStrategyLabel(strategy: InstallStrategy) {
  switch (strategy) {
    case "install-in-app":
      return "Install in app";
    case "open-only":
      return "Open app";
    case "details-only":
      return "View details";
    case "coming-soon":
      return "Coming soon";
  }
}
