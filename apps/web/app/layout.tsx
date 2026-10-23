import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const body = Barlow({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const display = Barlow_Condensed({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });

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
    <html lang="es-AR" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
