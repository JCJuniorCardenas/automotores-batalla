import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Batalla" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 bg-surface">{children}</div>;
}
