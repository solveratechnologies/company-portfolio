import { expect, test, type Page } from "@playwright/test";
import { staticRoutes } from "../src/lib/routes";
import { projects } from "../src/data/projects";
import { articles } from "../src/data/articles";
import { services } from "../src/data/services";
import { legalStatus } from "../src/config/legal";

const allRoutes = [
  ...staticRoutes,
  ...services.map((s) => s.href),
  ...projects.map((p) => `/work/${p.slug}`),
  ...articles.map((a) => `/insights/${a.slug}`),
];

// Must match the origin the production build was created with (NEXT_PUBLIC_SITE_URL is inlined at build time).
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
const LEGAL_PAGES = { "/privacy-policy": "privacy", "/terms": "terms", "/cookie-policy": "cookie" } as const;
const LEGAL_ROUTES = Object.keys(LEGAL_PAGES) as (keyof typeof LEGAL_PAGES)[];
// Each legal page has its own publication gate (src/config/legal.ts).
const legalReady = (route: string) => (route in LEGAL_PAGES ? legalStatus(LEGAL_PAGES[route as keyof typeof LEGAL_PAGES]).ready : true);
const indexableRoutes = allRoutes.filter((route) => legalReady(route));

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

test.describe("every route", () => {
  for (const route of allRoutes) {
    test(`${route} renders without errors or horizontal overflow`, async ({ page }) => {
      const errors = trackErrors(page);
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test("titles and descriptions are unique", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop");
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const route of allRoutes) {
    await page.goto(route);
    const title = await page.title();
    const desc = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(titles.has(title), `duplicate title on ${route} and ${titles.get(title)}`).toBe(false);
    expect(descriptions.has(desc), `duplicate description on ${route}`).toBe(false);
    titles.set(title, route);
    descriptions.set(desc, route);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  }
});

test("unknown slugs return the not-found page", async ({ page }) => {
  for (const path of ["/work/nope", "/insights/nope", "/this-does-not-exist"]) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/different path/i);
  }
});

test("sitemap and robots use the configured origin and list only public, indexable pages", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = indexableRoutes.map((route) => `${ORIGIN}${route === "/" ? "" : route}`);
  expect([...locs].sort()).toEqual([...expected].sort());
  expect(new Set(locs).size, "sitemap has duplicate URLs").toBe(locs.length);
  for (const loc of locs) expect(loc.startsWith(`${ORIGIN}`), `${loc} is not on the configured origin`).toBe(true);
  if (!ORIGIN.includes("localhost")) expect(xml).not.toContain("localhost");
  for (const route of LEGAL_ROUTES) {
    if (legalReady(route)) expect(xml).toContain(`<loc>${ORIGIN}${route}</loc>`);
    else expect(xml).not.toContain(`<loc>${ORIGIN}${route}</loc>`);
  }

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  expect(robots).not.toMatch(/^Host:/im);
  expect(robots).toContain("Disallow: /api/");
});

for (const route of allRoutes) {
  test(`${route} has complete, consistent Open Graph and Twitter metadata`, async ({ page }) => {
    test.skip(test.info().project.name !== "desktop");
    const meta = (selector: string) => page.locator(selector).first().getAttribute("content");
    await page.goto(route);
    const title = await page.title();
    const description = await meta('meta[name="description"]');
    expect(await meta('meta[property="og:title"]'), `og:title on ${route}`).toBe(title);
    expect(await meta('meta[name="twitter:title"]'), `twitter:title on ${route}`).toBe(title);
    expect(await meta('meta[property="og:description"]'), `og:description on ${route}`).toBe(description);
    expect(await meta('meta[name="twitter:description"]'), `twitter:description on ${route}`).toBe(description);
    expect(await meta('meta[name="twitter:card"]'), `twitter:card on ${route}`).toBe("summary_large_image");
    const ogImage = await meta('meta[property="og:image"]');
    expect(ogImage, `og:image on ${route}`).toBe(`${ORIGIN}/opengraph-image`);
    expect(await meta('meta[name="twitter:image"]'), `twitter:image on ${route}`).toBe(`${ORIGIN}/opengraph-image`);
    expect(await meta('meta[property="og:image:width"]'), `og:image:width on ${route}`).toBe("1200");
    expect(await meta('meta[property="og:image:height"]'), `og:image:height on ${route}`).toBe("630");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, `canonical on ${route}`).toBe(`${ORIGIN}${route === "/" ? "" : route}`);
    expect(await meta('meta[property="og:url"]'), `og:url on ${route}`).toBe(canonical);
    expect(title.length, `title length on ${route}`).toBeLessThanOrEqual(70);
  });
}

test("a legal page is noindex with a template notice until its own facts are supplied and reviewed", async ({ page }) => {
  for (const route of LEGAL_ROUTES) {
    await page.goto(route);
    if (legalReady(route)) {
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
      await expect(page.getByText(/Template notice/)).toHaveCount(0);
    } else {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.getByText(/Template notice/)).toBeVisible();
    }
  }
});

test("the contents list highlights the section currently on screen", async ({ page }) => {
  await page.goto("/privacy-policy");
  test.skip(!legalReady("/privacy-policy"), "privacy policy is still gated");
  const current = page.locator("nav a[aria-current='location']");
  await expect(current).toHaveCount(0);
  for (const [id, label] of [["data-retention", "14. Data Retention"], ["contact-us", "26. Contact Us"]]) {
    await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ behavior: "instant" }), id);
    await expect(current).toHaveText(label);
  }
});

test("terms and conditions show all 32 sections, the governing law and the closing lines", async ({ page }) => {
  await page.goto("/terms");
  test.skip(!legalReady("/terms"), "terms are still gated");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Terms and Conditions");
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(32);
  await expect(page.getByText("Islamic Republic of Pakistan")).toBeVisible();
  await expect(page.getByText(/\[[^\]]*to be (completed|added|confirmed)\]/)).toHaveCount(0);
  await expect(page.getByText("All Rights Reserved")).toBeVisible();
});

test("privacy policy shows the owner's details, all 31 sections and both tables", async ({ page }) => {
  await page.goto("/privacy-policy");
  test.skip(!legalReady("/privacy-policy"), "privacy policy is still gated");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy Policy");
  await expect(page.getByText("Rawalpindi, Pakistan").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "info@solveratechnologies.com" }).first()).toHaveAttribute("href", "mailto:info@solveratechnologies.com");
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveCount(31);
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(page.getByText(/\[[^\]]*to be (completed|added|confirmed)\]/)).toHaveCount(0);
  await expect(page.getByText("All Rights Reserved")).toBeVisible();
});

test("security headers are present and the framework is not advertised", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-frame-options"]).toBe("DENY");
  const csp = h["content-security-policy"] ?? h["content-security-policy-report-only"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).not.toMatch(/\*/);
  expect(h["x-powered-by"]).toBeUndefined();
});

// #f27222 (brand) is 2.73:1 on the page background and #d35a12 (brand-600) is 3.1-4.0:1, so they are only
// acceptable for large text (>= 24px, or >= 18.66px bold; WCAG needs 3:1). Small text must use text-brand-ink.
for (const route of allRoutes) {
  test(`${route} renders no small text in the low-contrast bright orange`, async ({ page }) => {
    test.skip(test.info().project.name !== "desktop");
    await page.goto(route);
    const offenders = await page.evaluate(() => {
      const low = new Set(["rgb(242, 114, 34)", "rgb(211, 90, 18)"]);
      const found: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.trim();
        const el = node.parentElement;
        if (!text || !el) continue;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden" || rect.width <= 1 || rect.height <= 1) continue;
        if (!low.has(style.color)) continue;
        const size = parseFloat(style.fontSize);
        const bold = parseInt(style.fontWeight, 10) >= 700;
        if (size >= 24 || (size >= 18.66 && bold)) continue;
        found.push(`<${el.tagName.toLowerCase()}> "${text.slice(0, 40)}" ${style.fontSize}`);
      }
      return found;
    });
    expect(offenders, `low-contrast orange text on ${route}`).toEqual([]);
  });
}

test("services carousel has a keyboard-operable Pause/Play control", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop");
  await page.goto("/");
  const region = page.getByRole("region", { name: /Services\. Showing/ });
  await region.scrollIntoViewIfNeeded();
  const toggle = page.getByRole("button", { name: "Pause automatic rotation of services" });
  const status = () => region.locator("p[id]").first().textContent();
  await toggle.focus();
  await page.keyboard.press("Enter");
  const play = page.getByRole("button", { name: "Start automatic rotation of services" });
  await expect(play).toBeVisible();
  // Move the pointer and focus away: the user's pause must persist.
  await page.mouse.move(5, 5);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const before = await status();
  await page.waitForTimeout(4500);
  expect(await status()).toBe(before);
  await play.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Pause automatic rotation of services" })).toBeVisible();
});

test("services carousel does not auto-rotate with prefers-reduced-motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const region = page.getByRole("region", { name: /Services\. Showing/ });
  await region.scrollIntoViewIfNeeded();
  const status = () => region.locator("p[id]").first().textContent();
  const before = await status();
  await page.waitForTimeout(4500);
  expect(await status()).toBe(before);
  await expect(page.getByRole("button", { name: /automatic rotation of services/ })).toHaveCount(0);
  await context.close();
});

test.describe("desktop navigation", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop"));

  test("services dropdown works with mouse and keyboard", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Services" });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("link", { name: /AI Solutions/ }).first()).toBeVisible();
    await trigger.click();
    await page.mouse.click(10, 600);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Business Automation/ }).click();
    await expect(page).toHaveURL(/\/services\/business-automation$/);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("header CTA and logo navigate", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("banner").getByRole("link", { name: "Book a free demo" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await page.getByRole("banner").getByRole("link", { name: /Home/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("homepage service cards open the right pages", async ({ page }) => {
    for (const [index, s] of services.entries()) {
      await page.goto("/");
      await page.locator(`#services-overview-title`).scrollIntoViewIfNeeded();
      // The carousel auto-rotates and pauses while the pointer rests on it, so bring each service
      // forward with the carousel's own "Next service" button instead of waiting on timing.
      for (let i = 0; i < index; i++) await page.getByRole("button", { name: "Next service" }).click();
      await page.locator(`main a[href="${s.href}"]`).filter({ hasText: "Learn More" }).click();
      await expect(page).toHaveURL(new RegExp(`${s.href}$`));
    }
  });
});

test.describe("mobile navigation", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "mobile"));

  test("opens, locks scroll, expands services, closes on Escape and after navigation", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await dialog.getByRole("button", { name: "Services" }).click();
    await dialog.getByRole("link", { name: "Digital Marketing" }).click();
    await expect(page).toHaveURL(/\/services\/digital-marketing$/);
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });
});

test("portfolio filter updates results without reload", async ({ page }) => {
  await page.goto("/work");
  await page.evaluate(() => ((window as unknown as { __marker: boolean }).__marker = true));
  const group = page.getByRole("group", { name: "Project categories" });
  await group.getByRole("button", { name: /AI Solutions/ }).click();
  const expected = projects.filter((p) => p.category === "AI Solutions").length;
  await expect(page.locator('main a[href^="/work/"]')).toHaveCount(expected);
  expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBe(true);
  await expect(page).toHaveURL(/category=AI\+Solutions/);
});

test("case study shows correct data", async ({ page }) => {
  const p = projects[1];
  await page.goto(`/work/${p.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.title);
  await expect(page.getByText(p.problem)).toBeVisible();
});

test("article shows calculated reading time and table of contents", async ({ page }) => {
  const a = articles[0];
  await page.goto(`/insights/${a.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(a.title);
  await expect(page.getByText(/min read/).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();
});

// The Contact page shows either the booking calendar (CONTACT_MODE=booking, the
// default) or the inquiry form (CONTACT_MODE=form). Each test runs only for the
// mode the server is actually in.
test("booking calendar: pick a date, then enter details", async ({ page }) => {
  // Never send a real email from a test.
  let posted: Record<string, unknown> | null = null;
  await page.route("**/api/booking", async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto("/contact");
  test.skip((await page.getByRole("grid").count()) === 0, "Contact page is in form mode");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/choose a date/i).first()).toBeVisible();

  await page.locator("[aria-current=date]").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  // A time is required too. Taken slots are blurred and disabled; only a free one can be picked.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /choose a time/i })).toBeVisible();
  await expect(page.locator("[data-time][disabled]").first()).toBeVisible();
  await expect(page.locator("[data-time][disabled]").first()).toHaveClass(/blur/);
  await page.locator("[data-time]:not([disabled])").first().click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: /confirm booking/i }).click();
  await expect(page.getByLabel(/^name/i)).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel(/^name/i).fill("Jane Doe");
  await page.getByLabel(/^email/i).fill("jane@company.com");
  await page.getByLabel(/company name/i).fill("Acme Ltd");
  await page.waitForTimeout(2600); // honest user typing time (spam check)
  await page.getByRole("button", { name: /confirm booking/i }).click();
  await expect(page.getByText(/booking request has been sent/i)).toBeVisible();
  expect(posted).toMatchObject({ time: expect.stringMatching(/^\d{2}:(00|30)$/), fullName: "Jane Doe", email: "jane@company.com", company: "Acme Ltd" });
});

test("contact form validates and never fakes success", async ({ page }) => {
  await page.goto("/contact?service=AI%20Solutions");
  test.skip((await page.getByRole("grid").count()) > 0, "Contact page is in booking mode");
  await expect(page.getByLabel(/service required/i)).toHaveValue("AI Solutions");
  await page.getByRole("button", { name: /send inquiry/i }).click();
  await expect(page.getByLabel(/full name/i)).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel(/full name/i).fill("Jane Doe");
  await page.getByLabel(/business email/i).fill("jane@company.com");
  await page.getByLabel(/project description/i).fill("We want an assistant that answers customer questions.");
  await page.getByLabel(/I agree/i).check();
  await page.waitForTimeout(2600); // honest user typing time (spam check)
  await page.getByRole("button", { name: /send inquiry/i }).click();
  // No provider is configured in tests: the API must refuse rather than pretend.
  await expect(page.locator("form").getByRole("alert")).toContainText(/unavailable|not connected/i);
  await expect(page.getByText(/has been sent/i)).toHaveCount(0);
  await expect(page.getByLabel(/full name/i)).toHaveValue("Jane Doe");
});

test("FAQ accordion toggles", async ({ page }) => {
  await page.goto("/faq");
  const q = page.getByRole("button", { name: /What kinds of businesses/ });
  await q.click();
  await expect(q).toHaveAttribute("aria-expanded", "true");
  await q.click();
  await expect(q).toHaveAttribute("aria-expanded", "false");
});
