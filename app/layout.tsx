import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Newdryve — Book Driving Lessons in Norwich · DBS-Verified Instructors",
    template: "%s · Newdryve",
  },
  description:
    "Book driving lessons in Norwich in 60 seconds. Verified, DBS-checked instructors, real-time availability for the next 14 days. Pay by card, bank transfer, or cash. iOS app + web dashboard.",
  applicationName: "Newdryve",
  generator: "Next.js",
  keywords: [
    "driving lessons Norwich",
    "driving instructor Norwich",
    "book driving lessons UK",
    "DBS verified driving instructor",
    "intensive driving course Norwich",
    "automatic driving lessons Norwich",
    "manual driving lessons Norwich",
    "pass plus Norwich",
    "mock driving test Norwich",
    "Newdryve",
    "driving school app UK",
  ],
  authors: [{ name: "Newdryve", url: SITE_URL }],
  creator: "Newdryve",
  publisher: "Newdryve",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-GB": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Newdryve",
    title: "Newdryve — Book Driving Lessons in Norwich in 60 Seconds",
    description:
      "Verified, DBS-checked instructors. Real-time availability for the next 14 days. Pay by card, bank transfer, or cash. No phone tag.",
    url: "/",
    locale: "en_GB",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Newdryve — Book Driving Lessons in Norwich",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@newdryve",
    creator: "@newdryve",
    title: "Newdryve — Book Driving Lessons in Norwich in 60 Seconds",
    description:
      "Verified, DBS-checked driving instructors near you. Real-time availability. Pay by card, bank transfer, or cash.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
  classification: "Driving lessons booking platform",
  appleWebApp: {
    capable: true,
    title: "Newdryve",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "geo.region": "GB-NFK",
    "geo.placename": "Norwich",
    "geo.position": "52.6309;1.2974",
    ICBM: "52.6309, 1.2974",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0EDF0" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A14" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-dm-sans)]">{children}</body>
    </html>
  );
}
