import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import FcmDebugPanel from "@/components/fcm-debug-panel";
import { Providers } from "@/components/providers";
import FcmForegroundListener from "@/components/fcm-foreground-listener";
import { PwaRegister } from "@/components/pwa-register";
import { isFcmDebugEnabledOnServer } from "@/lib/fcm-debug-config";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_METADATA_BASE, SITE_NAME, SITE_OG_IMAGE, SITE_TITLE, SITE_URL } from "@/lib/site-config";
import "./globals.css";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ko-KR",
    description: SITE_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
  },
];

export const metadata: Metadata = {
  metadataBase: SITE_METADATA_BASE,
  title: {
    default: SITE_TITLE,
    template: "%s | 근요일",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_OG_IMAGE,
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#3182f6",
  viewportFit: "cover",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  const isFcmDebugEnabled = isFcmDebugEnabledOnServer();

  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
          type="application/ld+json"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__GUNYOIL_FCM_DEBUG__ = ${JSON.stringify(isFcmDebugEnabled)};`,
          }}
        />
        <link crossOrigin="" href="https://cdn.jsdelivr.net" rel="preconnect" />
        <link href="https://cdn.jsdelivr.net/gh/fonts-archive/Pretendard/subsets/Pretendard-dynamic-subset.css" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <FcmForegroundListener />
        <PwaRegister />
        {isFcmDebugEnabled ? <FcmDebugPanel /> : null}
      </body>
    </html>
  );
}
