import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { legalStatus, type LegalPageKey } from "@/config/legal";
import { getContent } from "@/content";
import { staticRoutes } from "@/lib/routes";

const LEGAL_PAGES: Record<string, LegalPageKey> = { "/privacy-policy": "privacy", "/terms": "terms", "/cookie-policy": "cookie" };
const LEGAL_ROUTES: readonly string[] = Object.keys(LEGAL_PAGES);

/**
 * Lists only the intended public, indexable pages, as absolute URLs on the
 * configured site origin. API routes and error pages are never included.
 * Legal pages are included only once they are complete (see src/config/legal.ts);
 * until then they are served with `noindex` and omitted here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, projects, articles } = await getContent();
  const url = (path: string) => `${siteConfig.url}${path === "/" ? "" : path}`;
  const priority = (path: string) => (path === "/" ? 1 : LEGAL_ROUTES.includes(path) ? 0.3 : 0.8);

  // Each legal page is listed only once its own publication gate is open.
  const routes = staticRoutes.filter((path) => !(path in LEGAL_PAGES) || legalStatus(LEGAL_PAGES[path]).ready);

  return [
    ...routes.map((path) => ({ url: url(path), changeFrequency: "monthly" as const, priority: priority(path) })),
    ...services.map((s) => ({ url: url(s.href), changeFrequency: "monthly" as const, priority: 0.9 })),
    ...projects.map((p) => ({ url: url(`/work/${p.slug}`), changeFrequency: "yearly" as const, priority: 0.6 })),
    ...articles.map((a) => ({
      url: url(`/insights/${a.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
      ...(a.updatedAt || a.publishedAt ? { lastModified: new Date((a.updatedAt ?? a.publishedAt)!) } : {}),
    })),
  ];
}
