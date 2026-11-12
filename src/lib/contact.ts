import "server-only";
import nodemailer from "nodemailer";
import type { ContactData } from "./validation";
import { formatBookingDate, type BookingData } from "./booking-validation";

/**
 * Delivery for project inquiries.
 *
 * Supported providers (configure ONE in .env.local; if several are set the order is 1, 2, 3):
 *   1. Resend email API  — RESEND_API_KEY + CONTACT_TO_EMAIL (+ CONTACT_FROM_EMAIL)
 *   2. SMTP (nodemailer) — SMTP_USER + SMTP_PASS + CONTACT_TO_EMAIL (+ SMTP_HOST, SMTP_PORT,
 *      CONTACT_FROM_EMAIL). Defaults to Gmail (smtp.gmail.com:465) with an App Password.
 *   3. Generic webhook   — CONTACT_WEBHOOK_URL (+ optional CONTACT_WEBHOOK_SECRET)
 *      Works with n8n, Make, Zapier, GoHighLevel inbound webhooks, or your own CRM endpoint.
 *      The URL must be https (plain http is accepted only for localhost test receivers).
 *
 * If nothing is configured, deliverInquiry() reports "not_configured" and the
 * API returns 503. The form never shows a success state unless the provider
 * confirmed acceptance with a 2xx response.
 *
 * Logging policy: only the provider name, an HTTP status code or an error class
 * name (and a short error code such as EAUTH) is ever logged. Request bodies, names, emails,
 * messages, SMTP responses and secrets are never logged.
 */

export type DeliveryProvider = "resend" | "smtp" | "webhook" | "none";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** https only; http is allowed for loopback hosts so a local mock receiver can be used in tests. */
export function isAllowedWebhookUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function getDeliveryProvider(env: NodeJS.ProcessEnv = process.env): DeliveryProvider {
  if (env.RESEND_API_KEY && env.CONTACT_TO_EMAIL) return "resend";
  if (env.SMTP_USER && env.SMTP_PASS && env.CONTACT_TO_EMAIL) return "smtp";
  if (isAllowedWebhookUrl(env.CONTACT_WEBHOOK_URL)) return "webhook";
  return "none";
}

export type DeliveryResult = { ok: true } | { ok: false; reason: "not_configured" | "delivery_failed" };

const DELIVERY_TIMEOUT_MS = 10_000;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** What gets delivered. Project inquiries and booking requests share the same providers and safeguards. */
type OutboundMessage = {
  kind: "project_inquiry" | "booking_request";
  subject: string;
  heading: string;
  rows: [string, string][];
  replyTo: string;
  /** Client-generated id, used as the provider idempotency key. */
  id?: string;
  /** Extra JSON fields for the webhook provider. */
  webhookPayload: Record<string, unknown>;
};

function inquiryMessage(data: ContactData): OutboundMessage {
  const { companyFax: _honeypot, startedAt: _startedAt, ...payload } = data;
  void _honeypot;
  void _startedAt;
  return {
    kind: "project_inquiry",
    subject: `New inquiry: ${data.service} — ${data.fullName}`,
    heading: "New project inquiry",
    rows: [
      ["Name", data.fullName],
      ["Email", data.email],
      ["Company", data.company ?? "—"],
      ["Website", data.website ?? "—"],
      ["Service", data.service],
      ["Budget", data.budget ?? "—"],
      ["Timeline", data.timeline ?? "—"],
      ["Project description", data.message],
    ],
    replyTo: data.email,
    id: data.submissionId,
    webhookPayload: payload,
  };
}

function bookingMessage(data: BookingData): OutboundMessage {
  const { companyFax: _honeypot, startedAt: _startedAt, ...payload } = data;
  void _honeypot;
  void _startedAt;
  return {
    kind: "booking_request",
    subject: `New booking request: ${formatBookingDate(data.date)} — ${data.fullName}`,
    heading: "New booking request",
    rows: [
      ["Requested date", `${formatBookingDate(data.date)} (${data.date})`],
      ["Name", data.fullName],
      ["Email", data.email],
      ["Company", data.company ?? "—"],
    ],
    replyTo: data.email,
    id: data.submissionId,
    webhookPayload: payload,
  };
}

/** Only a 2xx from the provider counts as accepted. Never log the response body. */
function accepted(provider: DeliveryProvider, res: Response): DeliveryResult {
  if (res.status >= 200 && res.status < 300) return { ok: true };
  console.error("[contact] Provider did not accept the inquiry", { provider, status: res.status });
  return { ok: false, reason: "delivery_failed" };
}

/** Plain-text and HTML bodies. Every visitor-supplied value is escaped in the HTML version. */
function buildEmailBody(msg: OutboundMessage) {
  const rows = msg.rows;
  const html = `<h2>${escapeHtml(msg.heading)}</h2><table cellpadding="6">${rows
    .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return { html, text };
}

/** Header values must be a single line: strip CR/LF so a visitor cannot inject extra headers. */
function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function splitRecipients(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Optional CC copy of every email (CONTACT_CC_EMAIL, comma-separated). Email providers only. */
function ccRecipients(env: NodeJS.ProcessEnv) {
  return env.CONTACT_CC_EMAIL ? splitRecipients(env.CONTACT_CC_EMAIL) : [];
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "TimeoutError" })), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

async function sendWithResend(msg: OutboundMessage, env: NodeJS.ProcessEnv): Promise<DeliveryResult> {
  const { html, text } = buildEmailBody(msg);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(msg.id ? { "Idempotency-Key": msg.id } : {}),
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || "Solvera Website <onboarding@resend.dev>",
      to: splitRecipients(env.CONTACT_TO_EMAIL!),
      ...(ccRecipients(env).length > 0 ? { cc: ccRecipients(env) } : {}),
      reply_to: msg.replyTo,
      subject: msg.subject,
      html,
      text,
    }),
    redirect: "manual",
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });
  return accepted("resend", res);
}

/**
 * SMTP through nodemailer. Counts as delivered only when the SMTP server accepted the message for
 * every recipient (no rejected addresses). Gmail: use an App Password, never the account password.
 */
async function sendWithSmtp(msg: OutboundMessage, env: NodeJS.ProcessEnv): Promise<DeliveryResult> {
  const { html, text } = buildEmailBody(msg);
  const port = Number(env.SMTP_PORT) || 465;
  const recipients = splitRecipients(env.CONTACT_TO_EMAIL!);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port,
    // 465 uses TLS from the first byte; any other port must upgrade with STARTTLS or the send fails.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: DELIVERY_TIMEOUT_MS,
    greetingTimeout: DELIVERY_TIMEOUT_MS,
    socketTimeout: DELIVERY_TIMEOUT_MS,
    // The message body never needs to read local files or fetch remote URLs.
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const info = await withTimeout(
      transport.sendMail({
        from: env.CONTACT_FROM_EMAIL || env.SMTP_USER,
        to: recipients,
        ...(ccRecipients(env).length > 0 ? { cc: ccRecipients(env) } : {}),
        replyTo: msg.replyTo,
        subject: oneLine(msg.subject),
        text,
        html,
      }),
      DELIVERY_TIMEOUT_MS,
    );
    if (info.accepted.length > 0 && info.rejected.length === 0) return { ok: true };
    console.error("[contact] SMTP server did not accept every recipient", { provider: "smtp" });
    return { ok: false, reason: "delivery_failed" };
  } finally {
    transport.close();
  }
}

async function sendToWebhook(msg: OutboundMessage, env: NodeJS.ProcessEnv): Promise<DeliveryResult> {
  const res = await fetch(env.CONTACT_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.CONTACT_WEBHOOK_SECRET ? { "X-Webhook-Secret": env.CONTACT_WEBHOOK_SECRET } : {}),
      ...(msg.id ? { "Idempotency-Key": msg.id } : {}),
    },
    body: JSON.stringify({ type: msg.kind, receivedAt: new Date().toISOString(), ...msg.webhookPayload }),
    // Do not follow redirects: that could forward personal data and the secret to another host.
    redirect: "manual",
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });
  return accepted("webhook", res);
}

export function deliverInquiry(data: ContactData, env: NodeJS.ProcessEnv = process.env): Promise<DeliveryResult> {
  return deliver(inquiryMessage(data), env);
}

/** A call booking request (date + name, email, company). Same providers, timeouts and logging policy as inquiries. */
export function deliverBooking(data: BookingData, env: NodeJS.ProcessEnv = process.env): Promise<DeliveryResult> {
  return deliver(bookingMessage(data), env);
}

async function deliver(msg: OutboundMessage, env: NodeJS.ProcessEnv): Promise<DeliveryResult> {
  const provider = getDeliveryProvider(env);
  if (provider === "none") {
    if (env.CONTACT_WEBHOOK_URL && !isAllowedWebhookUrl(env.CONTACT_WEBHOOK_URL)) {
      console.error("[contact] CONTACT_WEBHOOK_URL is not a valid https URL; inquiries cannot be delivered.");
    }
    return { ok: false, reason: "not_configured" };
  }
  try {
    if (provider === "resend") return await sendWithResend(msg, env);
    if (provider === "smtp") return await sendWithSmtp(msg, env);
    return await sendToWebhook(msg, env);
  } catch (error) {
    // Timeouts, DNS, TLS and login failures. Log only the error class and a short code such as
    // EAUTH — never the message, which can echo server responses or addresses (personal data).
    const name = typeof (error as { name?: unknown } | null)?.name === "string" ? (error as { name: string }).name : "unknown";
    const rawCode = (error as { code?: unknown } | null)?.code;
    const code = typeof rawCode === "string" && /^[A-Z0-9_]{2,24}$/.test(rawCode) ? rawCode : undefined;
    console.error("[contact] Delivery request failed", { provider, error: name, ...(code ? { code } : {}) });
    return { ok: false, reason: "delivery_failed" };
  }
}

/* ------------------------------------------------------------------ */
/* Client identification                                               */
/* ------------------------------------------------------------------ */

export const PER_CLIENT_LIMIT = 5;
/** Shared flood backstop used when no trusted client-IP header is configured. */
export const UNATTRIBUTED_LIMIT = 20;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/**
 * Identify the client for rate limiting without trusting spoofable headers.
 *
 * `X-Forwarded-For` / `X-Real-IP` sent by a browser or script can be anything, so they are
 * ignored unless you name, in CONTACT_CLIENT_IP_HEADER, the header your own reverse proxy / CDN
 * sets (and overwrites) on every request — e.g. `cf-connecting-ip`, `x-real-ip`,
 * `x-vercel-forwarded-for`, or `x-forwarded-for`. For `x-forwarded-for` the right-most entry
 * (appended by the nearest trusted proxy) is used; for other headers the value is used as-is.
 *
 * When the variable is unset, all requests share one flood-protection bucket with a higher
 * limit. That cannot be bypassed by spoofing, but one abuser can exhaust it for everyone, so
 * configure the header in production.
 */
export function resolveClientKey(headers: Headers, env: NodeJS.ProcessEnv = process.env): { key: string; limit: number } {
  const name = env.CONTACT_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (name) {
    const raw = headers.get(name);
    if (raw) {
      const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
      const candidate = (name === "x-forwarded-for" ? parts[parts.length - 1] : parts[0]) ?? "";
      if (candidate && candidate.length <= 64 && /^[0-9a-fA-F:.[\]]+$/.test(candidate)) {
        return { key: `ip:${candidate}`, limit: PER_CLIENT_LIMIT };
      }
    }
  }
  return { key: "unattributed", limit: UNATTRIBUTED_LIMIT };
}

/* ------------------------------------------------------------------ */
/* Rate limiting (pluggable store)                                     */
/* ------------------------------------------------------------------ */

/**
 * Storage backend for rate limiting. The default is an in-memory store, which is
 * per server instance only — on serverless or multi-instance hosting, counters are not
 * shared, so limits are only approximate. For production, implement this interface on a
 * shared store you choose (Redis, Postgres, your platform's KV, …) and register it once at
 * startup with `setRateLimitStore()` (for example from `instrumentation.ts`). No specific
 * paid service or dependency is required.
 */
export interface RateLimitStore {
  /** Record one request for `key` and return how many requests (including this one) fall in the current window. */
  hit(key: string, windowMs: number, now: number): Promise<number> | number;
  /** Optional: clear all state (used by tests). */
  reset?(): void;
}

export function createMemoryRateLimitStore(): RateLimitStore {
  const hits = new Map<string, number[]>();
  return {
    hit(key, windowMs, now) {
      const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      list.push(now);
      hits.set(key, list);
      if (hits.size > 5000) {
        for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        if (hits.size > 5000) hits.clear();
      }
      return list.length;
    },
    reset: () => hits.clear(),
  };
}

let rateLimitStore: RateLimitStore = createMemoryRateLimitStore();
let usingDefaultStore = true;
let warnedAboutMemoryStore = false;

export function setRateLimitStore(store: RateLimitStore) {
  rateLimitStore = store;
  usingDefaultStore = false;
}

export async function isRateLimited(key: string, limit = PER_CLIENT_LIMIT, now = Date.now()): Promise<boolean> {
  if (process.env.NODE_ENV === "production" && usingDefaultStore && !warnedAboutMemoryStore) {
    warnedAboutMemoryStore = true;
    console.warn("[contact] Rate limiting uses per-instance memory. Register a shared store with setRateLimitStore() for multi-instance hosting.");
  }
  try {
    return (await rateLimitStore.hit(key, RATE_LIMIT_WINDOW_MS, now)) > limit;
  } catch {
    // A failing shared store must not take the contact form down; the other protections still apply.
    console.error("[contact] Rate-limit store unavailable; allowing request.");
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Duplicate-submission protection (per instance)                      */
/* ------------------------------------------------------------------ */

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const delivered = new Map<string, number>();
const inProgress = new Set<string>();

export type SubmissionClaim = "claimed" | "duplicate" | "in_progress";

/**
 * Claim a client-generated submission id before delivering.
 * - "duplicate": this id was already delivered successfully (retry after a lost response).
 * - "in_progress": another request with this id is being delivered right now (double-click / race).
 * Requests without an id cannot be de-duplicated and are always "claimed".
 */
export function claimSubmission(id: string | undefined, now = Date.now()): SubmissionClaim {
  if (!id) return "claimed";
  for (const [k, t] of delivered) if (now - t > DUPLICATE_WINDOW_MS) delivered.delete(k);
  if (delivered.has(id)) return "duplicate";
  if (inProgress.has(id)) return "in_progress";
  inProgress.add(id);
  return "claimed";
}

/** Call when delivery was confirmed (remembers the id) or failed (frees it so the user can retry). */
export function finishSubmission(id: string | undefined, delivered_: boolean, now = Date.now()) {
  if (!id) return;
  inProgress.delete(id);
  if (delivered_) delivered.set(id, now);
}

export function resetContactProtection() {
  rateLimitStore.reset?.();
  delivered.clear();
  inProgress.clear();
}
