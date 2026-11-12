import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/booking/route";
import { resetContactProtection } from "@/lib/contact";
import { formatBookingDate, parseIsoDate, validateBooking } from "@/lib/booking-validation";
import { getContactMode } from "@/config/contact-mode";
import { BOOKING_SLOTS, formatSlotRange, isSlotTaken, takenSlots } from "@/lib/booking-slots";

// nodemailer is mocked: these tests never open a network connection or send a real email.
const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));

const DAY = 24 * 60 * 60 * 1000;
const isoIn = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

/** The first slot on `date` that is not already taken. */
const freeTime = (date: string) => BOOKING_SLOTS.find((t) => !isSlotTaken(date, t))!;
const takenTime = (date: string) => BOOKING_SLOTS.find((t) => isSlotTaken(date, t))!;
/** A bookable day (3–60 days out) that has at least one taken slot, so the tests never depend on today's date. */
const dayWithTakenSlot = () => Array.from({ length: 58 }, (_, i) => isoIn(i + 3)).find((d) => takenSlots(d).size > 0)!;

const body = (overrides: Record<string, unknown> = {}) => ({
  date: isoIn(7),
  time: freeTime((overrides.date as string | undefined) ?? isoIn(7)),
  fullName: "Jane Doe",
  email: "jane@company.com",
  company: "Acme Ltd",
  startedAt: Date.now() - 10_000,
  submissionId: crypto.randomUUID(),
  ...overrides,
});

function request(payload: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/booking", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

describe("validateBooking", () => {
  it("accepts a future date with name and email; company is optional", () => {
    const result = validateBooking({ date: isoIn(3), time: freeTime(isoIn(3)), fullName: "Jane Doe", email: "jane@company.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.company).toBeUndefined();
  });

  it("requires a real 30-minute slot, and refuses a slot that is already taken", () => {
    const date = dayWithTakenSlot();
    const base = { date, fullName: "Jane Doe", email: "jane@company.com" };
    for (const time of [undefined, "", "09:00", "10:15", "18:00", "25:00", "noon"]) {
      const result = validateBooking({ ...base, time });
      expect(result.success, String(time)).toBe(false);
      if (!result.success) expect(result.fieldErrors.time).toBeDefined();
    }
    const taken = validateBooking({ ...base, time: takenTime(date) });
    expect(taken.success).toBe(false);
    if (!taken.success) expect(taken.fieldErrors.time).toMatch(/already taken/i);
  });

  it("rejects missing, invalid, past and too-distant dates", () => {
    for (const date of [undefined, "", "2026-02-31", "18/11/2026", isoIn(-5), isoIn(400)]) {
      const result = validateBooking({ date, time: freeTime(String(date)), fullName: "Jane Doe", email: "jane@company.com" });
      expect(result.success, String(date)).toBe(false);
      if (!result.success) expect(result.fieldErrors.date).toBeDefined();
    }
  });

  it("requires a name and a valid email", () => {
    const result = validateBooking({ date: isoIn(3), time: freeTime(isoIn(3)), fullName: "J", email: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.fullName).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    }
  });

  it("formats dates without shifting the day across time zones", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
    expect(formatBookingDate("2026-11-18")).toBe("Wednesday, November 18, 2026");
  });
});

describe("getContactMode", () => {
  it("defaults to the booking calendar and only switches to the form when asked", () => {
    const env = (value?: string) => ({ NODE_ENV: "test", ...(value === undefined ? {} : { CONTACT_MODE: value }) }) as NodeJS.ProcessEnv;
    expect(getContactMode(env())).toBe("booking");
    expect(getContactMode(env(""))).toBe("booking");
    expect(getContactMode(env("nonsense"))).toBe("booking");
    expect(getContactMode(env("booking"))).toBe("booking");
    expect(getContactMode(env("form"))).toBe("form");
    expect(getContactMode(env(" FORM "))).toBe("form");
  });
});

describe("POST /api/booking", () => {
  const env = { ...process.env };
  beforeEach(() => {
    resetContactProtection();
    for (const key of ["RESEND_API_KEY", "CONTACT_WEBHOOK_URL", "CONTACT_WEBHOOK_SECRET", "CONTACT_CLIENT_IP_HEADER", "CONTACT_FROM_EMAIL", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "CONTACT_TO_EMAIL", "CONTACT_CC_EMAIL"]) {
      delete process.env[key];
    }
    mocks.sendMail.mockReset();
    mocks.close.mockReset();
    mocks.createTransport.mockReset();
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail, close: mocks.close });
  });
  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  function useSmtp() {
    process.env.SMTP_USER = "sender@gmail.com";
    process.env.SMTP_PASS = "app-password-value";
    process.env.CONTACT_TO_EMAIL = "owner@example.com";
    mocks.sendMail.mockResolvedValue({ accepted: ["owner@example.com"], rejected: [] });
  }

  it("returns 422 with field errors for invalid data", async () => {
    const res = await POST(request(body({ email: "nope", date: isoIn(-3) })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.fieldErrors.email).toBeDefined();
    expect(json.fieldErrors.date).toBeDefined();
  });

  it("never reports success when no delivery provider is configured", async () => {
    const res = await POST(request(body()));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("not_configured");
  });

  it("rejects honeypot and instant submissions", async () => {
    const bot = await POST(request(body({ companyFax: "spam" })));
    expect(bot.status).toBe(400);
    const fast = await POST(request(body({ startedAt: Date.now() })));
    expect(fast.status).toBe(400);
  });

  it("sends to CONTACT_TO_EMAIL and CCs CONTACT_CC_EMAIL when set, and omits cc otherwise", async () => {
    useSmtp();
    process.env.CONTACT_TO_EMAIL = "info@example.com";
    await POST(request(body()));
    expect(mocks.sendMail.mock.calls[0][0]).not.toHaveProperty("cc");

    resetContactProtection();
    process.env.CONTACT_CC_EMAIL = "copy@example.com, second@example.com";
    await POST(request(body({ submissionId: "11111111-1111-4111-8111-111111111111" })));
    const mail = mocks.sendMail.mock.calls[1][0];
    expect(mail.to).toEqual(["info@example.com"]);
    expect(mail.cc).toEqual(["copy@example.com", "second@example.com"]);
  });

  it("refuses a time slot that is already taken, so the calendar cannot be bypassed", async () => {
    useSmtp();
    const date = dayWithTakenSlot();
    const res = await POST(request(body({ date, time: takenTime(date) })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("validation");
    expect(json.fieldErrors.time).toMatch(/already taken/i);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("rejects cross-origin posts and non-JSON bodies", async () => {
    expect((await POST(request(body(), { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(request(body(), { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(request("{not json"))).status).toBe(400);
  });

  it("emails the team the date, name, email and company, and reports success only after acceptance", async () => {
    useSmtp();
    const date = isoIn(10);
    const res = await POST(request(body({ date })));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.to).toEqual(["owner@example.com"]);
    expect(mail.replyTo).toBe("jane@company.com");
    const time = freeTime(date);
    expect(mail.subject).toMatch(new RegExp(`^New booking request: ${formatBookingDate(date)}, \\d{1,2}:\\d{2} [AP]M PKT — Jane Doe$`));
    expect(mail.text).toContain(`Requested date: ${formatBookingDate(date)} (${date})`);
    expect(mail.text).toContain(`Requested time: ${formatSlotRange(time)} Pakistan Standard Time (PKT, UTC+5)`);
    expect(mail.text).toContain("Name: Jane Doe");
    expect(mail.text).toContain("Email: jane@company.com");
    expect(mail.text).toContain("Company: Acme Ltd");
    expect(mail.html).toContain("New booking request");
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("books in PKT and also shows the visitor's local time when their time zone is sent", async () => {
    useSmtp();
    // A day on which the 13:00 PKT slot is free (13:00 PKT = 17:00 in Tokyo, which has no daylight saving).
    const date = Array.from({ length: 40 }, (_, i) => isoIn(i + 10)).find((d) => !isSlotTaken(d, "13:00"))!;
    const res = await POST(request(body({ date, time: "13:00", timeZone: "Asia/Tokyo" })));
    expect(res.status).toBe(200);
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.subject).toContain("1:00 PM PKT");
    expect(mail.text).toContain("Requested time: 1:00 PM – 1:30 PM Pakistan Standard Time (PKT, UTC+5)");
    expect(mail.text).toMatch(/Visitor's local time: .*5:00 PM – 5:30 PM \(Asia\/Tokyo, GMT\+9\)/);
  });

  it("ignores an unknown time zone instead of failing or echoing it", async () => {
    useSmtp();
    const res = await POST(request(body({ timeZone: "Not/AZone\nBcc: x@evil.test" })));
    expect(res.status).toBe(200);
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.text).not.toContain("Visitor's local time");
    expect(mail.text).not.toContain("evil.test");
  });

  it("escapes visitor input in the HTML body and keeps the subject on one line", async () => {
    useSmtp();
    const res = await POST(request(body({ fullName: "<script>alert(1)</script> Jane", company: "<b>x</b>" })));
    expect(res.status).toBe(200);
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("returns 502 when the provider rejects the message", async () => {
    useSmtp();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ["owner@example.com"] });
    const res = await POST(request(body()));
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("delivery_failed");
  });

  it("does not send the same submission twice", async () => {
    useSmtp();
    const payload = body();
    await POST(request(payload));
    const second = await POST(request(payload));
    expect(second.status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledOnce();
  });

  it("posts a booking_request to the webhook provider", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/in";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const payload = body();
    const res = await POST(request(payload));
    expect(res.status).toBe(200);
    const sent = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(sent).toMatchObject({ type: "booking_request", date: payload.date, time: payload.time, fullName: "Jane Doe", email: "jane@company.com", company: "Acme Ltd" });
    expect(sent.companyFax).toBeUndefined();
    expect(sent.startedAt).toBeUndefined();
    expect(sent.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/);
  });
});
