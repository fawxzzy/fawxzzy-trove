import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trove",
    template: "%s | Trove",
  },
  description:
    "Trove is the grounded catalog layer for Fawxzzy applications, with truthful open and install routes for independent PWAs.",
  applicationName: "Trove",
  manifest: "/manifest.webmanifest",
  keywords: [
    "Trove",
    "Fawxzzy",
    "ATLAS",
    "PWA catalog",
    "app launcher",
  ],
  appleWebApp: {
    capable: true,
    title: "Trove",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/app/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Trove",
    description:
      "A grounded catalog for Fawxzzy apps with truthful open and install paths.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trove",
    description:
      "A grounded catalog for Fawxzzy apps with truthful open and install paths.",
  },
};

export const viewport: Viewport = {
  themeColor: "#060c15",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
