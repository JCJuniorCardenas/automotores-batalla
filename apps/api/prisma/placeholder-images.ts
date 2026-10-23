import sharp from "sharp";

const VIEWS = ["Frente", "Lateral", "Trasera", "Interior"] as const;

const COLORS: Record<string, string> = {
  Blanco: "#e9e9ec", "Blanco Banchisa": "#ececef", "Blanco Polar": "#f2f2f4", Gris: "#8c9096",
  "Gris Silverstone": "#9a9da3", "Gris Oscuro": "#4b4f56", "Gris Nano": "#6f747b", Plata: "#b4b8be",
  Negro: "#1d1d20", "Negro Mythos": "#17171a", Rojo: "#b3262c", Azul: "#2a4f8f",
  "Naranja Atacama": "#d2691e",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** Imagen de ejemplo (1600x1000): silueta simple del auto en su color + rótulo "IMAGEN DE EJEMPLO". */
export async function placeholderImage(opts: { title: string; color?: string | null; view: number }) {
  const body = COLORS[opts.color ?? ""] ?? "#6d7480";
  const dark = luminance(body) < 0.45;
  const shift = [0, 40, -40, 0][opts.view % 4]!;
  const label = VIEWS[opts.view % 4];
  const interior = opts.view % 4 === 3;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f0e4"/><stop offset="1" stop-color="#d9d2c3"/></linearGradient></defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <rect y="720" width="1600" height="280" fill="#c9c2b3"/>
  ${
    interior
      ? `<circle cx="800" cy="520" r="230" fill="none" stroke="#222" stroke-width="46"/><circle cx="800" cy="520" r="52" fill="#222"/><rect x="560" y="640" width="480" height="40" rx="20" fill="#222"/>`
      : `<g transform="translate(${shift},0)">
    <path d="M250 650 L330 480 Q360 430 430 420 L780 410 Q880 405 940 470 L1050 520 Q1330 540 1360 640 L1360 700 L250 700 Z" fill="${body}" stroke="rgba(0,0,0,.35)" stroke-width="6"/>
    <path d="M400 480 L440 440 L760 432 L860 436 L940 500 Z" fill="${dark ? "#9fb6c8" : "#7f98ad"}" opacity=".85"/>
    <circle cx="500" cy="705" r="82" fill="#1a1a1a"/><circle cx="500" cy="705" r="40" fill="#bbb"/>
    <circle cx="1120" cy="705" r="82" fill="#1a1a1a"/><circle cx="1120" cy="705" r="40" fill="#bbb"/>
  </g>`
  }
  <text x="800" y="150" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#1b1b1b" text-anchor="middle">${esc(opts.title)}</text>
  <text x="800" y="215" font-family="Arial, sans-serif" font-size="36" fill="#444" text-anchor="middle">${label}</text>
  <rect x="540" y="880" width="520" height="64" rx="32" fill="#d32f2f"/>
  <text x="800" y="923" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">IMAGEN DE EJEMPLO · DEMO</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}
