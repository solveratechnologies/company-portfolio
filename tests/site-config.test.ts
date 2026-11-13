import { describe, expect, it } from "vitest";
import { resolveSiteUrl, SiteUrlError } from "@/config/site-url";
import { legalStatus, LEGAL_REQUIRED } from "@/config/legal";
import { pageMetadata, socialImage } from "@/lib/seo";
import { metadata as homeMetadata } from "@/app/page";

describe("resolveSiteUrl", () => {
  it("falls back to localhost only outside production", () => {
    expect(resolveSiteUrl(undefined, "development")).toBe("http://localhost:3000");
    expect(resolveSiteUrl("", "test")).toBe("http://localhost:3000");
  });

  it("fails the production build when the origin is missing", () => {
    expect(() => resolveSiteUrl(undefined, "production")).toThrow(SiteUrlError);
    expect(() => resolveSiteUrl("   ", "production")).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });

  it("normalizes a valid https origin and strips the trailing slash", () => {
    expect(resolveSiteUrl("https://www.example.com/", "production")).toBe("https://www.example.com");
    expect(resolveSiteUrl("https://Example.com", "production")).toBe("https://example.com");
  });

  it("rejects relative, non-https, pathful and credentialed values", () => {
    expect(() => resolveSiteUrl("example.com", "production")).toThrow(SiteUrlError);
    expect(() => resolveSiteUrl("http://example.com", "production")).toThrow(/https/);
    expect(() => resolveSiteUrl("https://example.com/blog", "production")).toThrow(/origin only/);
    expect(() => resolveSiteUrl("https://example.com?x=1", "production")).toThrow(/origin only/);
    expect(() => resolveSiteUrl("https://user:pw@example.com", "production")).toThrow(/credentials/);
  });

  it("accepts plain http only for loopback hosts", () => {
    expect(resolveSiteUrl("http://localhost:3100", "production")).toBe("http://localhost:3100");
    expect(resolveSiteUrl("http://127.0.0.1:3100", "production")).toBe("http://127.0.0.1:3100");
  });
});

describe("pageMetadata", () => {
  it("includes the shared 1200x630 social image for Open Graph and Twitter", () => {
    const meta = pageMetadata({ title: "About", description: "About us.", path: "/about" });
    expect(meta.openGraph?.images).toEqual([socialImage]);
    expect(socialImage.width).toBe(1200);
    expect(socialImage.height).toBe(630);
    expect(meta.twitter?.images).toEqual([socialImage.url]);
  });

  it("keeps the homepage social title and description identical to the document metadata", () => {
    expect(homeMetadata.title).toEqual({ absolute: homeMetadata.openGraph?.title });
    expect(homeMetadata.twitter?.title).toBe(homeMetadata.openGraph?.title);
    expect(homeMetadata.openGraph?.description).toBe(homeMetadata.description);
    expect(homeMetadata.twitter?.description).toBe(homeMetadata.description);
    expect(homeMetadata.openGraph?.images).toEqual([socialImage]);
  });

  it("marks noIndex pages as noindex", () => {
    const meta = pageMetadata({ title: "X", description: "Y", path: "/x", noIndex: true });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("legalStatus", () => {
  const env = (values: Record<string, string> = {}) => values as unknown as NodeJS.ProcessEnv;
  /** An owner with nothing supplied and nothing reviewed, so the gate itself is what is tested. */
  const nobody = { facts: {}, reviewed: { privacy: false, terms: false, cookie: false } };
  const supply = (page: "privacy" | "terms" | "cookie") =>
    Object.fromEntries(LEGAL_REQUIRED.filter((r) => r.pages.includes(page)).map((r) => [r.env, "value"]));

  it("a page is not ready until every fact it needs and its review flag are set", () => {
    expect(legalStatus("privacy", env(), nobody).ready).toBe(false);
    expect(legalStatus("privacy", env(supply("privacy")), nobody).missing).toEqual(["LEGAL_COUNSEL_REVIEWED"]);
    expect(legalStatus("privacy", env({ ...supply("privacy"), LEGAL_COUNSEL_REVIEWED: "true" }), nobody).ready).toBe(true);
  });

  it("each page has its own gate: another page's facts do not open it", () => {
    const reviewed = env({ LEGAL_COUNSEL_REVIEWED: "true" });
    expect(legalStatus("cookie", env({ ...reviewed, LEGAL_EFFECTIVE_DATE: "1 March 2027" }), nobody).ready).toBe(true);
    expect(legalStatus("terms", env({ ...reviewed, LEGAL_EFFECTIVE_DATE: "1 March 2027" }), nobody).ready).toBe(false);
    expect(legalStatus("terms", env({ LEGAL_COUNSEL_REVIEWED: "true", ...supply("terms") }), nobody).ready).toBe(true);
    expect(legalStatus("privacy", env({ ...reviewed, LEGAL_EFFECTIVE_DATE: "1 March 2027" }), nobody).ready).toBe(false);
    // Terms' own facts (governing law, courts) do not open the privacy page.
    expect(legalStatus("privacy", env({ ...reviewed, LEGAL_JURISDICTION: "x", LEGAL_COURTS_LOCATION: "y" }), nobody).ready).toBe(false);
  });

  it("uses the owner's recorded facts and per-page review, and an environment value overrides a recorded fact", () => {
    // Privacy and Terms are complete and reviewed; Cookie still needs a review.
    expect(legalStatus("privacy", env()).ready).toBe(true);
    expect(legalStatus("terms", env()).ready).toBe(true);
    expect(legalStatus("terms", env({ LEGAL_JURISDICTION: "   " })).facts.jurisdiction).toBe("Islamic Republic of Pakistan");
    expect(legalStatus("cookie", env()).missing).toEqual(["LEGAL_COUNSEL_REVIEWED"]);
    expect(legalStatus("privacy", env({ LEGAL_PRIVACY_EMAIL: "privacy@example.com" })).facts.privacyEmail).toBe("privacy@example.com");
    expect(legalStatus("privacy", env({ LEGAL_PRIVACY_EMAIL: "   " })).facts.privacyEmail).toBe("info@solveratechnologies.com");
  });
});
