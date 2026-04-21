import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trove",
    short_name: "Trove",
    description:
      "A grounded catalog for Fawxzzy applications with truthful open and install routes.",
    start_url: "/",
    display: "standalone",
    background_color: "#060c15",
    theme_color: "#060c15",
    icons: [
      {
        src: "/app/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/app/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
