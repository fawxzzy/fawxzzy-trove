export type CatalogActionLabel = "Open app" | "Install";

export type CatalogAsset = {
  src: string;
  source: string;
};

export type CatalogScreenshot = {
  alt: string;
  caption: string;
  src: string;
  source: string;
};

type Accent = {
  from: string;
  glow: string;
  panel: string;
  to: string;
};

export type CatalogApp = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  liveUrl: string;
  installUrl: string | null;
  icon: CatalogAsset;
  tags: string[];
  accent: Accent;
  screenshots: CatalogScreenshot[];
};

export const apps: CatalogApp[] = [
  {
    name: "Fitness",
    slug: "fitness",
    tagline: "Training plans, workout logging, and session history in one mobile-first shell.",
    description:
      "Fitness is the structured daily app in the lineup: clean entry flow, focused habit tracking, and an installable PWA experience that stays on the app's own origin.",
    liveUrl: "https://fawxzzy-fitness-local.vercel.app",
    installUrl: "https://fawxzzy-fitness-local.vercel.app",
    icon: {
      src: "https://fawxzzy-fitness-local.vercel.app/app/icon-192.png",
      source: "fawxzzy-fitness public/app/icon-192.png via the live app origin",
    },
    tags: ["PWA", "Workouts", "History"],
    accent: {
      from: "#82ffd8",
      glow: "rgba(130, 255, 216, 0.42)",
      panel: "rgba(10, 30, 28, 0.88)",
      to: "#79c8ff",
    },
    screenshots: [
      {
        alt: "Fitness home surface",
        caption: "Home surface",
        src: "/apps/fitness/screenshots/home.png",
        source: "Headless Edge capture from https://fawxzzy-fitness-local.vercel.app on April 21, 2026",
      },
      {
        alt: "Fitness login screen",
        caption: "Login flow",
        src: "/apps/fitness/screenshots/login.png",
        source: "Headless Edge capture from https://fawxzzy-fitness-local.vercel.app/login on April 21, 2026",
      },
      {
        alt: "Fitness signup screen",
        caption: "Signup flow",
        src: "/apps/fitness/screenshots/signup.png",
        source: "Headless Edge capture from https://fawxzzy-fitness-local.vercel.app/signup on April 21, 2026",
      },
    ],
  },
  {
    name: "Mazer",
    slug: "mazer",
    tagline: "An atmospheric maze experience tuned for watch mode, play mode, and installable ambient play.",
    description:
      "Mazer is the game lane in the catalog: atmospheric, installable, and ready for public live play without sending people through a repo-tour detour.",
    liveUrl: "https://fawxzzy-mazer.vercel.app",
    installUrl: "https://fawxzzy-mazer.vercel.app",
    icon: {
      src: "https://fawxzzy-mazer.vercel.app/icons/mazer-emblem.svg",
      source: "fawxzzy-mazer public/icons/mazer-emblem.svg via the live app origin",
    },
    tags: ["Game", "Installable", "Ambient"],
    accent: {
      from: "#ffb36c",
      glow: "rgba(255, 179, 108, 0.36)",
      panel: "rgba(45, 21, 8, 0.88)",
      to: "#ff7462",
    },
    screenshots: [
      {
        alt: "Mazer watch mode",
        caption: "Watch mode",
        src: "/apps/mazer/screenshots/watch.png",
        source: "Headless Edge capture from https://fawxzzy-mazer.vercel.app on April 21, 2026",
      },
      {
        alt: "Mazer play mode",
        caption: "Play mode",
        src: "/apps/mazer/screenshots/play.png",
        source:
          "Headless Edge capture from https://fawxzzy-mazer.vercel.app/?content=core-only&mode=play on April 21, 2026",
      },
      {
        alt: "Mazer ember theme",
        caption: "Ember theme",
        src: "/apps/mazer/screenshots/theme-ember.png",
        source:
          "Headless Edge capture from https://fawxzzy-mazer.vercel.app/?content=core-only&theme=ember on April 21, 2026",
      },
    ],
  },
];

export function getAppBySlug(slug: string) {
  return apps.find((app) => app.slug === slug);
}
