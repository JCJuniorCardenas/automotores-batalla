import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const DESCRIPTION = "Autos 0km y usados, permutas y consignaciones. Mirá el catálogo, simulá tu cuota y consultanos por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Autos 0km y usados`, template: `%s | ${SITE.name}` },
  description: DESCRIPTION,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "es_AR",
    title: `${SITE.name} | Autos 0km y usados`,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
