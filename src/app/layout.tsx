import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter, Lato } from "next/font/google";
import "./globals.css";
import { SessionRestoreProvider } from "@/components/shared/SessionRestoreProvider";
import AppShell from "@/components/shared/AppShell";
import { siteName, siteDescription, siteUrl, siteLocale, defaultOgImage, ogImageWidth, ogImageHeight, twitterHandle } from "@/lib/seo";

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
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Pakistani Handcrafted Fashion`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  generator: "Next.js",
  applicationName: siteName,
  keywords: [
    "Pakistani fashion",
    "handcrafted clothing",
    "kurtas",
    "dupattas",
    "block print",
    "Ajrak",
    "Pakistani suits",
    "textile impressions",
    "Pakistani handcrafted fashion",
    "traditional Pakistani clothing",
    "Karachi fashion",
    "Pakistan textile",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
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
    title: siteName,
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: siteLocale,
    siteName: siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    images: [
      {
        url: defaultOgImage,
        width: ogImageWidth,
        height: ogImageHeight,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: twitterHandle,
    creator: twitterHandle,
    title: siteName,
    description: siteDescription,
    images: [defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8B4513",
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
