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
