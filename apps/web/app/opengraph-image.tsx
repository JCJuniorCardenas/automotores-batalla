import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} - Autos 0km y usados`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen social por defecto (home, catálogo, contacto). Provisoria: reemplazar con el logo real del cliente.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#111111",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              background: "#f6f0e4",
              color: "#d32f2f",
              fontSize: 90,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            B
          </div>
          <div style={{ fontSize: 76, fontWeight: 800 }}>{SITE.name}</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, color: "#c9a227" }}>0km · Usados · Permutas · Consignaciones</div>
        <div style={{ marginTop: 16, fontSize: 32, color: "#cccccc" }}>{SITE.instagramHandle}</div>
      </div>
    ),
    size,
  );
}
