import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const productionOnlyHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const cspDirectives = [
  "default-src 'self'",
  // unsafe-eval required for Next.js dev (hot reload) — removed in production
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // img-src locked to known origins + data URIs
  "img-src 'self' data: blob: https://avatars.githubusercontent.com",
  "font-src 'self' data:",
  // connect-src allows http for local dev servers (Inngest :8288, etc.)
  isDev
    ? "connect-src 'self' http://localhost:* https:"
    : "connect-src 'self' https:",
  "frame-ancestors 'none'",
];

const baseHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

const securityHeaders = isDev
  ? baseHeaders
  : [...baseHeaders, ...productionOnlyHeaders];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
