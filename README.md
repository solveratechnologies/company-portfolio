# Solvera Technologies — Website

Marketing and lead-generation website for **Solvera Technologies**: web development, AI solutions, business automation and digital marketing.

Built with **Next.js 16 (App Router, Cache Components)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Lucide** icons and **Zod** validation. No animation library — motion uses CSS (including scroll-driven animations) plus one tiny `IntersectionObserver` component.

---

## Quick start

```bash
# Node.js 20.9+ to run the site; the test toolchain (Vitest 5 / jsdom) needs Node 20.19+ or 22.12+
npm install
cp .env.example .env.local   # then fill in values (see Configuration)
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm test` | Unit/component tests (Vitest + Testing Library) |
| `npm run test:e2e` | End-to-end tests (Playwright; builds must exist — run `npm run build` first) |
| `npm run check` | Lint + typecheck + unit tests + build |

For Playwright, install a browser once with `npx playwright install chromium`.

---

## Configuration

All variables are documented in [`.env.example`](./.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **Yes, for production builds** | The single authoritative public origin (`https://www.your-domain.com`, no path). Drives canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph and JSON-LD. `next build` **fails with an explicit error** if it is missing or not https (plain `http` is accepted only for `localhost`/`127.0.0.1`). Only in development does it fall back to `http://localhost:3000`. It is inlined at build time, so set it in the build environment. |
| `LEGAL_*` (6 facts) + `LEGAL_COUNSEL_REVIEWED` | Before indexing legal pages | Owner-supplied legal facts. Until all are set the privacy/terms/cookie pages are `noindex`, show a template notice and are left out of the sitemap. See [Legal pages](#legal-pages). |
| `CONTACT_CLIENT_IP_HEADER` | Recommended in production | Name of the header **your own proxy/CDN** sets with the real client IP. Without it, client-sent `X-Forwarded-For` is ignored. |
| `CSP_REPORT_ONLY` | No | `true` ships the CSP as `Content-Security-Policy-Report-Only`. |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `_PHONE` / `_ADDRESS` | No | Verified contact details. Hidden everywhere when empty. |
| `NEXT_PUBLIC_SOCIAL_LINKS` | No | Verified social profiles, comma-separated `Label|https://…` pairs, e.g. `X|https://x.com/you,Facebook|https://facebook.com/you,Instagram|https://instagram.com/you,LinkedIn|https://linkedin.com/company/you`. The footer shows an icon for X/Twitter, Facebook, Instagram and LinkedIn (any other label shows as a text pill). Only profiles you list are shown; hidden when empty. Restart the dev server after changing it. |
| `RESEND_API_KEY` + `CONTACT_TO_EMAIL` (+ `CONTACT_FROM_EMAIL`) | One delivery option | Email delivery of inquiries via Resend. |
| `SMTP_USER` + `SMTP_PASS` + `CONTACT_TO_EMAIL` (+ `SMTP_HOST`, `SMTP_PORT`, `CONTACT_FROM_EMAIL`) | One delivery option | Email delivery over SMTP with nodemailer. Defaults to Gmail (`smtp.gmail.com`, port 465). `SMTP_PASS` is a Gmail **App Password** (needs 2-Step Verification), never the account password. Server-side only. If several options are set, the order is Resend, then SMTP, then webhook. Gmail has its own daily sending limit; check Google's current limits. |
| `CONTACT_WEBHOOK_URL` (+ `CONTACT_WEBHOOK_SECRET`) | One delivery option | POSTs inquiries as JSON to n8n, Make, Zapier, GoHighLevel or a CRM endpoint. |

### Booking calendar or inquiry form (`CONTACT_MODE`)

The Contact page shows one of two things in its main card, chosen by `CONTACT_MODE`:

- `booking` (default): a date-picker booking calendar. Step 1 picks a date (today to 90 days ahead), step 2 collects name, email and an optional company name. The request is emailed through the same delivery settings as the inquiry form (`POST /api/booking`).
- `form`: the original project inquiry form.

Set it in `.env.local` and restart the dev server (or rebuild), since it is read on the server. The booking and inquiry flows share `CONTACT_TO_EMAIL` and the Resend/SMTP/webhook settings.

### Contact form

`POST /api/contact` (`src/app/api/contact/route.ts`):

- Server-side validation with the same Zod schema the client uses (`src/lib/validation.ts`).
- Same-origin check, 20 KB body limit, honeypot field, minimum fill time, rate limiting (below) and duplicate-submission protection via a client-generated `submissionId` (also sent as the `Idempotency-Key` to Resend and the webhook). A retry of an already-delivered id is acknowledged without sending again; a concurrent request with the same id gets `409 in_progress`; a failed delivery frees the id so the visitor can retry.
- Returns `200` **only** after the provider answers with a 2xx. With no provider configured it returns `503 not_configured`; provider errors, redirects and the 10-second timeout return `502 delivery_failed` — **it never shows a fake success**.
- The webhook URL must be `https` (plain `http` is accepted only for `localhost` test receivers); redirects are never followed, so personal data and the secret cannot be forwarded to another host.
- Logs contain only the provider name, an HTTP status code or an error class (for example `TimeoutError`). Names, emails, messages and secrets are never logged.

**Webhook payload** (`CONTACT_WEBHOOK_URL`):

```json
{
  "type": "project_inquiry",
  "receivedAt": "2026-01-01T12:00:00.000Z",
  "fullName": "…", "email": "…", "company": "…", "website": "https://…",
  "service": "AI Solutions", "budget": "…", "timeline": "…",
  "message": "…", "consent": true, "submissionId": "uuid"
}
```

#### Rate limiting and client identification

- **Client IP:** `X-Forwarded-For` / `X-Real-IP` sent by a browser or script are spoofable, so they are **ignored** unless you name the header your own proxy/CDN sets in `CONTACT_CLIENT_IP_HEADER` (for example `cf-connecting-ip`, `x-real-ip`, `x-vercel-forwarded-for`, or `x-forwarded-for`, where the right-most entry is used). Each trusted client gets 5 requests per 10 minutes. With no header configured, all visitors share one flood-protection bucket (20 per 10 minutes) that cannot be bypassed by spoofing but can be exhausted by one abuser — configure the header in production.
- **Shared store:** the default store is in-memory, i.e. **per server instance**; on serverless or multi-instance hosting the counters are not shared and the limits are only approximate (a warning is logged once in production). `src/lib/contact.ts` exports a small `RateLimitStore` interface (`hit(key, windowMs, now)`); implement it on any shared store you already run (Redis, Postgres, your platform's KV…) and register it once at startup with `setRateLimitStore()`, for example from `instrumentation.ts`. No paid service or extra dependency is required by the app. The duplicate-submission memory is also per instance; provider idempotency keys cover the cross-instance case. A CAPTCHA (for example Cloudflare Turnstile) is a further option if abuse appears.

### Legal pages

`/privacy-policy`, `/terms` and `/cookie-policy` are **templates** and contain no invented facts. They stay `noindex`, are excluded from `sitemap.xml` and show a visible "Template notice" until **all** of the following are set (server environment, build time) and `LEGAL_COUNSEL_REVIEWED=true`:

| Variable | Fact the owner must supply |
| --- | --- |
| `LEGAL_ENTITY_NAME` | Registered legal business name |
| `LEGAL_REGISTERED_ADDRESS` | Registered business address |
| `LEGAL_JURISDICTION` | Governing law / jurisdiction for the Terms |
| `LEGAL_EFFECTIVE_DATE` | Effective date of the policies |
| `LEGAL_RETENTION_PERIOD` | How long inquiry data is kept |
| `LEGAL_SERVICE_PROVIDERS` | Providers that process inquiry data (email/webhook, hosting) |
| `LEGAL_COUNSEL_REVIEWED` | `true` only after qualified counsel approved the final text |

The gate is a publication control, **not** legal advice or a compliance certification. If analytics, advertising tags or cookies are added later, update the cookie policy text first.

### Security headers

`next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy` and a Content-Security-Policy, and disables `X-Powered-By`. The CSP is static (no nonces, so pages stay statically prerendered): no `unsafe-eval` in production, no wildcards and no third-party origins, but `script-src`/`style-src` need `'unsafe-inline'` for Next.js bootstrap scripts and React inline styles. Add exact origins to the policy if you introduce analytics or embeds. **HSTS, HTTP→HTTPS and `www`/apex redirects belong to the hosting layer** and are not set or verified by this repository.

---

## Routes

**15 primary pages**

| # | Page | Route |
| --- | --- | --- |
| 1 | Home (12 sections) | `/` |
| 2 | About | `/about` |
| 3 | Services overview | `/services` |
| 4 | Web Development | `/services/web-development` |
| 5 | AI Solutions | `/services/ai-solutions` |
| 6 | Business Automation | `/services/business-automation` |
| 7 | Digital Marketing | `/services/digital-marketing` |
| 8 | Custom Software Solutions | `/solutions` |
| 9 | Industries | `/industries` (deep links: `/industries#real-estate`) |
| 10 | Portfolio (with filters) | `/work` (shareable: `/work?category=AI+Solutions`) |
| 11 | Process | `/process` |
| 12 | Insights | `/insights` |
| 13 | Contact | `/contact` (preselect: `/contact?service=AI%20Solutions`) |
| 14 | FAQ | `/faq` |
| 15 | Careers | `/careers` |

**Supporting routes:** `/work/[slug]`, `/insights/[slug]`, `/privacy-policy`, `/terms`, `/cookie-policy`, custom `not-found`, `error`, `loading` states, `/api/contact`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/icon.svg`.

`src/proxy.ts` returns a true **404** for unknown project/article slugs (streamed pages otherwise commit a `200` status before `notFound()` runs).

---

## Project structure

```
src/
  app/                 Routes (App Router), metadata, sitemap, robots, OG image, API
  components/
    layout/            Header, DesktopNavigation, ServicesDropdown, MobileNavigation, Footer, ScrollToTop
    sections/          Homepage sections + FinalCTA
    services/          ServiceCard, ServiceHero, ServiceFeatureGrid, ServiceFAQ, ServiceBlocks
    portfolio/         ProjectCard, ProjectGrid, ProjectFilters, CaseStudyLayout
    insights/          ArticleCard, ArticleGrid, TableOfContents, RelatedArticles, ShareControls
    forms/             ContactForm, FormField, SelectField, SubmitButton
    ui/                Button, Container, SectionHeading, Badge, Accordion, AnimatedSection, Breadcrumbs, PageHero, …
    visuals/           Original code-drawn mockups, hero composition, workflow diagrams, article covers
  data/                Typed content: services, projects, articles, industries, process, faqs, navigation, testimonials
  lib/                 seo, validation, contact delivery, utils, routes
  types/               Service, Project, Article, Contact types
  hooks/               useScrollProgress
  config/site.ts       Site name, URL, verified contact/social (from env)
tests/                 Vitest unit/component tests
e2e/                   Playwright end-to-end tests
```

Server Components are the default; `"use client"` is limited to the header/navigation, accordion, filters, article grid, table of contents, share controls, contact form, scroll-to-top and `InView`.

---

## Editing content

All content lives in typed files under `src/data/` — no layout changes needed.

- **Projects** (`projects.ts`): every current entry is a labeled **Concept Project** or **Internal Prototype**. To add real client work, use `status: "client"`; only then is the `results` field rendered. Add real screenshots to `public/images/projects/` and set `cover.image` — `next/image` is used automatically.
- **Articles** (`articles.ts`): `publishedAt` is intentionally empty. Set an ISO date when an article is actually published — dates and `datePublished` JSON-LD appear automatically. Reading time is calculated from the content.
- **Testimonials** (`testimonials.ts`): empty, so the homepage shows "What You Can Expect". Add only genuine, client-approved quotes.
- **Careers** (`app/careers/page.tsx` → `openPositions`): empty; the page says no roles are open.
- **Legal pages** are templates with a visible notice — they must be completed and reviewed by counsel.

---

## Design system

Tokens are defined in `src/app/globals.css` (`@theme`): `ink #101820`, `paper #F7F8FA`, `brand #2D6AE3`, `mint #38B98A`, `muted #667085`, `line #E5E7EB`; fluid type scale (`text-display`, `text-title`, `text-heading`, `text-card`, `text-lead`); Geist Sans/Mono (self-hosted via `next/font`).

**Motion**
- Hero entrance: CSS keyframes (`.enter`), no JavaScript required.
- Scroll reveal: CSS scroll-driven animations on `[data-reveal]` (≥768px, supporting browsers). Content is never hidden behind JavaScript; unsupported browsers simply show it.
- Continuous animations (hero connections, workflow nodes) pause off-screen via `InView`.
- `prefers-reduced-motion` disables all of the above.

---

## Quality checks (last run)

Run on 27 October 2026 on Node 22 (see the Node requirement above), Chromium only:

- `npm run check` (lint, typecheck, unit tests, production build): passes
- `npm test`: 51 unit/component tests passing (validation, contact API and delivery hardening, site-origin and legal-page gating, filtering, reading time, accordion, filters, contact form)
- `npm run test:e2e`: 150 passing, 68 skipped by design (desktop-only or mobile-only tests), 0 failing — every route renders with one `h1`, no console errors and no horizontal overflow; unique titles/descriptions; canonical, Open Graph and Twitter images on every route; real 404s; sitemap/robots; security headers; legal pages `noindex`; carousel Pause/Play and reduced motion; dropdown, mobile menu, filters, and contact form validation with no fake success
- Not rerun: Lighthouse, Firefox, Safari and a screen reader. Earlier Lighthouse numbers in this file were removed because they predate the current code. Measure again on the production host. Details: `reports/portfolio-qa-fix-report.md`.

---

## Still to configure before launch

1. `NEXT_PUBLIC_SITE_URL` — the production https origin (the production build refuses to run without it).
2. A contact delivery provider (Resend, SMTP **or** an https webhook), tested end to end on staging.
3. Verified contact details and social links (optional).
4. `CONTACT_CLIENT_IP_HEADER` and, on serverless/multi-instance hosting, a shared rate-limit store / CAPTCHA.
5. Legal pages: the `LEGAL_*` facts and counsel review (see [Legal pages](#legal-pages)) — until then they are `noindex`.
5a. Hosting layer: HTTPS/TLS, HSTS, HTTP→HTTPS and `www`/apex redirects, CDN caching.
6. Real project screenshots, verified client work and approved testimonials, when available.
7. Article publication dates once published.
8. Analytics (GA4/GTM) and a consent banner if required — update the Cookie Policy accordingly.
9. Newsletter signup — intentionally omitted until a real subscription backend exists.
