import type { Metadata } from "next";

// Applies to the whole /ops subtree: never index, never follow, never cache.
// Belt-and-braces with robots.txt (which disallows /ops) and the auth gate.
export const metadata: Metadata = {
  title: "Ops",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function OpsRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-canvas text-ink">{children}</div>;
}
