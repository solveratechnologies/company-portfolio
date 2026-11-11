import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy (static, no nonces).
 *
 * This site is statically prerendered, and nonce-based CSP would force every page
 * to render dynamically (see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 * We therefore use the documented "without nonces" policy:
 *
 * - script-src 'unsafe-inline': required for Next.js's inline hydration/bootstrap
 *   scripts in statically generated pages. This is the main trade-off; it is
 *   mitigated by `object-src 'none'`, `base-uri 'self'`, no third-party script origins,
 *   and no user-generated HTML anywhere on the site.
 * - style-src 'unsafe-inline': required for React `style={{ }}` attributes used by
 *   the carousels and visual components.
 * - 'unsafe-eval' is NOT present in production (only in `next dev`, as Next.js documents).
 * - No wildcards. If analytics, fonts or embeds are added later, add only the exact origins.
 *
 * Set CSP_REPORT_ONLY=true at build/start time to ship the policy as
 * Content-Security-Policy-Report-Only while evaluating a change.
 *
 * HSTS, HTTP→HTTPS and www/apex redirects belong to the hosting layer and are
 * intentionally not set here (they cannot be verified on a local http server).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const cspHeaderName =
  process.env.CSP_REPORT_ONLY === "true" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

const securityHeaders = [
  { key: cspHeaderName, value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Features the site does not use are denied outright.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Legacy clickjacking protection; CSP frame-ancestors is the modern equivalent.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework in responses.
  poweredByHeader: false,
  // Next 16 caches optimized images for 4 hours by default. While developing, keep it short so a
  // replaced file in /public shows up on refresh. Production keeps the default.
  images: process.env.NODE_ENV === "development" ? { minimumCacheTTL: 1 } : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
