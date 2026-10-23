import type { NextConfig } from "next";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // La API y las imágenes se sirven bajo el mismo origen que el sitio:
  // así las cookies de sesión (SameSite=Lax) funcionan sin CORS.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/media/:path*", destination: `${API}/media/:path*` },
    ];
  },
};

export default nextConfig;
