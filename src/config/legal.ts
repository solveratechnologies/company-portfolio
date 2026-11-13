/**
 * Owner-supplied legal facts.
 *
 * The privacy policy, terms and cookie policy need facts only the business owner can provide. Nothing here is
 * invented: the values below were supplied by the owner (`OWNER_FACTS`), and any of them can be overridden
 * with a server environment variable (see .env.example) without touching code.
 *
 * Each legal page has its own publication gate. A page is "ready" only when every fact it needs is present AND
 * its owner review flag is set. Until then that page
 *   - shows a visible "template" notice,
 *   - is served with `noindex`, and
 *   - is left out of sitemap.xml.
 * Once ready it becomes indexable automatically.
 *
 * This is a publication gate, not a statement of legal compliance. Have the final text reviewed by qualified
 * counsel for the jurisdictions you serve.
 *
 * Environment values are read at build/prerender time, so set them in the build environment.
 */

export type LegalPageKey = "privacy" | "terms" | "cookie";

export interface LegalFacts {
  entityName?: string;
  registeredAddress?: string;
  /** Governing law for the Terms. */
  jurisdiction?: string;
  /** City and country whose courts hear disputes about website use (Terms). */
  courtsLocation?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  privacyEmail?: string;
  /** Published business phone number (optional: the line is left out when empty). */
  phone?: string;
  /** Retention periods used in the privacy policy's retention table. */
  retentionInquiries?: string;
  retentionClients?: string;
  retentionMarketing?: string;
  retentionAnalytics?: string;
  retentionRecruitment?: string;
  retentionProspects?: string;
  retentionLogs?: string;
  retentionRecordings?: string;
  /** Country the business operates from (Section 16). */
  primaryCountry?: string;
  /** What the business actually does about advertising, sale/sharing and sensitive data (Sections 15 and 22). */
  advertisingStatement?: string;
  saleSharingStatement?: string;
  sensitiveStatement?: string;
  /** Optional: only shown when a representative or Data Protection Officer has actually been appointed. */
  euRepresentative?: string;
  ukRepresentative?: string;
  dpo?: string;
}

/** Facts supplied by the business owner. Empty = not supplied yet. */
export const OWNER_FACTS: LegalFacts = {
  entityName: "Solvera Technologies",
  registeredAddress: "Rawalpindi, Pakistan",
  effectiveDate: "1 November 2026",
  lastUpdated: "1 November 2026",
  privacyEmail: "info@solveratechnologies.com",
  phone: "+92 325 5580945",
  retentionInquiries: "12 months after the last contact",
  retentionClients: "3 years",
  retentionMarketing: "12 months of inactivity",
  retentionAnalytics: "6 months",
  retentionRecruitment: "6 months",
  retentionProspects: "12 months after the last meaningful interaction",
  retentionLogs: "6 months",
  retentionRecordings: "Not currently retained; where enabled for a client project, as set by that project’s agreement",
  primaryCountry: "Pakistan",
  advertisingStatement:
    "We do not currently use website pixels, audience tools, remarketing platforms, or lead-data exchanges, and we do not engage in targeted advertising.",
  saleSharingStatement: "We do not sell or share personal information, as those terms are defined under applicable privacy laws.",
  sensitiveStatement:
    "We do not collect sensitive personal information through our Website or use it for purposes that would give rise to a right to limit its use.",
  jurisdiction: "Islamic Republic of Pakistan",
  courtsLocation: "Rawalpindi, Pakistan",
  // euRepresentative / ukRepresentative / dpo: none appointed
};

/** Which pages the owner has confirmed were reviewed by qualified counsel. */
export const OWNER_REVIEWED: Record<LegalPageKey, boolean> = {
  privacy: true,
  terms: true,
  cookie: false,
};

type FactSpec = { key: keyof LegalFacts; env: string; description: string; pages: readonly LegalPageKey[] };

/** Every fact, the environment variable that can override it, and the pages that cannot be published without it. */
export const LEGAL_REQUIRED: readonly FactSpec[] = [
  { key: "entityName", env: "LEGAL_ENTITY_NAME", description: "Registered legal business name", pages: ["privacy", "terms"] },
  { key: "registeredAddress", env: "LEGAL_REGISTERED_ADDRESS", description: "Registered business address", pages: ["privacy", "terms"] },
  { key: "jurisdiction", env: "LEGAL_JURISDICTION", description: "Governing law / jurisdiction for the Terms", pages: ["terms"] },
  { key: "courtsLocation", env: "LEGAL_COURTS_LOCATION", description: "City and country of the courts for website-use disputes", pages: ["terms"] },
  { key: "effectiveDate", env: "LEGAL_EFFECTIVE_DATE", description: "Effective date of the policies (for example 1 March 2027)", pages: ["privacy", "terms", "cookie"] },
  { key: "lastUpdated", env: "LEGAL_LAST_UPDATED", description: "Date the privacy policy and terms were last revised", pages: ["privacy", "terms"] },
  { key: "privacyEmail", env: "LEGAL_PRIVACY_EMAIL", description: "Verified privacy and business contact email", pages: ["privacy", "terms"] },
  { key: "retentionInquiries", env: "LEGAL_RETENTION_INQUIRIES", description: "Retention: general inquiries", pages: ["privacy"] },
  { key: "retentionClients", env: "LEGAL_RETENTION_CLIENTS", description: "Retention: active client records, kept after the engagement ends", pages: ["privacy"] },
  { key: "retentionMarketing", env: "LEGAL_RETENTION_MARKETING", description: "Retention: marketing subscriptions, inactivity period", pages: ["privacy"] },
  { key: "retentionAnalytics", env: "LEGAL_RETENTION_ANALYTICS", description: "Retention: analytics information", pages: ["privacy"] },
  { key: "retentionRecruitment", env: "LEGAL_RETENTION_RECRUITMENT", description: "Retention: recruitment applications, kept after the decision", pages: ["privacy"] },
  { key: "retentionProspects", env: "LEGAL_RETENTION_PROSPECTS", description: "Retention: prospective-client information", pages: ["privacy"] },
  { key: "retentionLogs", env: "LEGAL_RETENTION_LOGS", description: "Retention: website and security logs", pages: ["privacy"] },
  { key: "retentionRecordings", env: "LEGAL_RETENTION_RECORDINGS", description: "Retention: call recordings and transcripts", pages: ["privacy"] },
  { key: "primaryCountry", env: "LEGAL_PRIMARY_COUNTRY", description: "Primary operating country", pages: ["privacy"] },
  { key: "advertisingStatement", env: "LEGAL_ADVERTISING_STATEMENT", description: "Statement of actual advertising practices", pages: ["privacy"] },
  { key: "saleSharingStatement", env: "LEGAL_SALE_SHARING_STATEMENT", description: "Statement of actual sale/sharing status", pages: ["privacy"] },
  { key: "sensitiveStatement", env: "LEGAL_SENSITIVE_STATEMENT", description: "Statement of sensitive personal information practices", pages: ["privacy"] },
];

/** Optional facts: shown when set, left out when empty. */
const OPTIONAL_ENV: readonly { key: keyof LegalFacts; env: string }[] = [
  { key: "phone", env: "LEGAL_PHONE" },
  { key: "euRepresentative", env: "LEGAL_EU_REPRESENTATIVE" },
  { key: "ukRepresentative", env: "LEGAL_UK_REPRESENTATIVE" },
  { key: "dpo", env: "LEGAL_DPO" },
];

function clean(value: string | undefined) {
  const v = value?.trim();
  return v ? v : undefined;
}

export function readLegalFacts(env: NodeJS.ProcessEnv = process.env, defaults: LegalFacts = OWNER_FACTS): LegalFacts {
  const facts: LegalFacts = {};
  for (const { key, env: name } of [...LEGAL_REQUIRED, ...OPTIONAL_ENV]) {
    facts[key] = clean(env[name]) ?? clean(defaults[key]);
  }
  return facts;
}

export function legalStatus(
  page: LegalPageKey,
  env: NodeJS.ProcessEnv = process.env,
  owner: { facts: LegalFacts; reviewed: Record<LegalPageKey, boolean> } = { facts: OWNER_FACTS, reviewed: OWNER_REVIEWED },
) {
  const facts = readLegalFacts(env, owner.facts);
  const missing: string[] = LEGAL_REQUIRED.filter((item) => item.pages.includes(page) && !facts[item.key]).map((item) => item.env);
  // LEGAL_COUNSEL_REVIEWED=true confirms every page at once; otherwise each page uses its own recorded review.
  const reviewed = clean(env.LEGAL_COUNSEL_REVIEWED)?.toLowerCase() === "true" || owner.reviewed[page];
  if (!reviewed) missing.push("LEGAL_COUNSEL_REVIEWED");
  return { facts, missing, ready: missing.length === 0 };
}

/** Returns the fact, or a visible bracketed placeholder while it is still unknown. */
export function fact(value: string | undefined, placeholder: string) {
  return value ?? `[${placeholder}]`;
}
