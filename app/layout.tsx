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
    default: "Newdryve · Early Access · Driving Lessons in Norwich",
    template: "%s · Newdryve",
  },
  description:
    "Newdryve is an early-access driving-lesson platform launching in Norwich. Apply as a learner or as an ADI-qualified instructor to join the first cohort.",
  applicationName: "Newdryve",
  generator: "Next.js",
  keywords: [
    "driving lessons Norwich",
    "driving instructor Norwich",
    "Norwich driving school",
    "ADI instructor Norwich",
    "early access driving app",
    "Newdryve",
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
    title: "Newdryve · Early Access in Norwich",
    description:
      "We're building a faster way to find an ADI-qualified driving instructor in Norwich. Apply for early access as a learner or instructor.",
    url: "/",
    locale: "en_GB",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Newdryve · Early Access in Norwich",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@newdryve",
    creator: "@newdryve",
    title: "Newdryve · Early Access in Norwich",
    description:
      "We're building a faster way to book driving lessons in Norwich. Apply for early access as a learner or instructor.",
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
      className={`${dmSans.variable} h-full antialiased`} // Add the font variable to the HTML element
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-dm-sans)]">{children}</body>
    </html>
  );
}
