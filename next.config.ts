import type { NextConfig } from "next";

/**
 * Servicio Python de la demo ERP:
 * - En Vercel, /api/erp lo sirve la función api/erp.py (no hace falta reescritura).
 * - En local (npm run dev) o en otro alojamiento, se reenvía a ERP_SERVICE_URL.
 */
const erpServiceUrl = process.env.ERP_SERVICE_URL ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8001" : undefined);

const securityHeaders = [
  // Solo se permite incrustar DexLab; nadie puede incrustar el portfolio.
  {
    key: "Content-Security-Policy",
    value: "frame-src https://pokedex-ia-nu.vercel.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return erpServiceUrl ? [{ source: "/api/erp", destination: `${erpServiceUrl}/api/erp` }] : [];
  },
};

export default nextConfig;
