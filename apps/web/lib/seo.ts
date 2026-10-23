import type { PublicSettings } from "@batalla/shared";
import { SITE } from "./site";

export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${SITE.url}${path}`);

/**
 * AutoDealer (schema.org) a partir de la configuración del panel.
 * Solo incluye lo que está cargado: nada de dirección, teléfono o email inventados.
 */
export function autoDealerJsonLd(contact: PublicSettings["contact"]) {
  const hasAddress = Boolean(contact.address || contact.city);
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE.url}/#dealer`,
    name: SITE.name,
    url: SITE.url,
    description: "Concesionaria de autos 0km y usados. Permutas y consignaciones.",
    telephone: contact.phone || `+${contact.whatsapp}`,
    ...(contact.email && { email: contact.email }),
    ...(hasAddress && {
      address: {
        "@type": "PostalAddress",
        ...(contact.address && { streetAddress: contact.address }),
        ...(contact.city && { addressLocality: contact.city }),
        addressCountry: "AR",
      },
    }),
    sameAs: [SITE.instagramUrl],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
