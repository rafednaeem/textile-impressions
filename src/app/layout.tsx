import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter, Lato } from "next/font/google";
import "./globals.css";
import { SessionRestoreProvider } from "@/components/shared/SessionRestoreProvider";
import AppShell from "@/components/shared/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Textile Impressions — Pakistani Handcrafted Fashion",
    template: "%s — Textile Impressions",
  },
  description:
    "Discover handcrafted Pakistani fashion — kurtas, dupattas, suits, co-ords, and accessories. Premium quality, traditional craftsmanship.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "Textile Impressions",
    capable: true,
    statusBarStyle: "default",
  },
  other: { "theme-color": "#8B4513" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorantGaramond.variable} ${lato.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionRestoreProvider>
          <AppShell>{children}</AppShell>
        </SessionRestoreProvider>
      </body>
    </html>
  );
}
