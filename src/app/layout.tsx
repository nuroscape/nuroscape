import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  axes: ["SOFT", "WONK"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nuroscape — Évaluation TDAH",
    template: "%s | Nuroscape",
  },
  description:
    "Une évaluation cliniquement informée pour comprendre si le TDAH fait partie de votre histoire.",
  keywords: ["TDAH", "ADHD", "évaluation", "auto-évaluation", "diagnostic", "neurodivergent"],
  authors: [{ name: "Nuroscape" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Nuroscape",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F5EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1C24" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
