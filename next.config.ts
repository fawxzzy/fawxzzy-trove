import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fawxzzy-fitness-local.vercel.app",
      },
      {
        protocol: "https",
        hostname: "fawxzzy-mazer.vercel.app",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
