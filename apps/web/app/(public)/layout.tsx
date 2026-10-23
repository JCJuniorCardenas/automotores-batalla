import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSettings } from "@/lib/api";
import { autoDealerJsonLd } from "@/lib/seo";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { contact } = await getSettings();
  return (
    <>
      <JsonLd data={autoDealerJsonLd(contact)} />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
