import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organisations",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function OrganisationsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-canvas text-ink">{children}</div>;
}
