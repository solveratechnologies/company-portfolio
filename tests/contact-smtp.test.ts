import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";
import { getDeliveryProvider, resetContactProtection } from "@/lib/contact";

// nodemailer is mocked: these tests never open a network connection or send a real email.
const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), close: vi.fn(), createTransport: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));

const body = (overrides: Record<string, unknown> = {}) => ({
  fullName: "Jane Doe",
  email: "jane@company.com",
  service: "Business Automation",
  message: "We would like to automate our appointment reminders.",
  consent: true,
  startedAt: Date.now() - 10_000,
  submissionId: crypto.randomUUID(),
  ...overrides,
});

function request(payload: unknown) {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(payload),
  });
}

describe("SMTP delivery (nodemailer)", () => {
  const env = { ...process.env };
  beforeEach(() => {
    resetContactProtection();
    for (const key of ["RESEND_API_KEY", "CONTACT_WEBHOOK_URL", "CONTACT_WEBHOOK_SECRET", "CONTACT_CLIENT_IP_HEADER", "CONTACT_FROM_EMAIL", "SMTP_HOST", "SMTP_PORT"]) {
      delete process.env[key];
    }
    process.env.SMTP_USER = "sender@gmail.com";
    process.env.SMTP_PASS = "app-password-value";
    process.env.CONTACT_TO_EMAIL = "owner@example.com";
    mocks.sendMail.mockReset();
    mocks.close.mockReset();
    mocks.createTransport.mockReset();
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail, close: mocks.close });
  });
  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("is chosen when SMTP credentials and a recipient are set, and not when one is missing", () => {
    const envOf = (values: Record<string, string>) => ({ NODE_ENV: "test", ...values }) as NodeJS.ProcessEnv;
    expect(getDeliveryProvider(envOf({ SMTP_USER: "a@gmail.com", SMTP_PASS: "x", CONTACT_TO_EMAIL: "b@example.com" }))).toBe("smtp");
    expect(getDeliveryProvider(envOf({ SMTP_USER: "a@gmail.com", CONTACT_TO_EMAIL: "b@example.com" }))).toBe("none");
    expect(getDeliveryProvider(envOf({ SMTP_USER: "a@gmail.com", SMTP_PASS: "x" }))).toBe("none");
    // Resend keeps priority when both are configured.
    expect(getDeliveryProvider(envOf({ RESEND_API_KEY: "k", SMTP_USER: "a@gmail.com", SMTP_PASS: "x", CONTACT_TO_EMAIL: "b@example.com" }))).toBe("resend");
  });

  it("sends through Gmail by default and reports success only after the server accepts the message", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: ["owner@example.com"], rejected: [] });
    const res = await POST(request(body()));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const options = mocks.createTransport.mock.calls[0][0];
    expect(options).toMatchObject({ host: "smtp.gmail.com", port: 465, secure: true, requireTLS: false });
    expect(options.auth).toEqual({ user: "sender@gmail.com", pass: "app-password-value" });
    expect(options.connectionTimeout).toBe(10_000);

    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.from).toBe("sender@gmail.com");
    expect(mail.to).toEqual(["owner@example.com"]);
    expect(mail.replyTo).toBe("jane@company.com");
    expect(mail.subject).toBe("New inquiry: Business Automation — Jane Doe");
    expect(mail.text).toContain("appointment reminders");
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("supports several recipients, a custom From and a STARTTLS port", async () => {
    process.env.CONTACT_TO_EMAIL = "owner@example.com, team@example.com";
    process.env.CONTACT_FROM_EMAIL = "Solvera Website <sender@gmail.com>";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    mocks.sendMail.mockResolvedValue({ accepted: ["owner@example.com", "team@example.com"], rejected: [] });
    const res = await POST(request(body()));
    expect(res.status).toBe(200);
    expect(mocks.createTransport.mock.calls[0][0]).toMatchObject({ host: "smtp.example.com", port: 587, secure: false, requireTLS: true });
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.to).toEqual(["owner@example.com", "team@example.com"]);
    expect(mail.from).toBe("Solvera Website <sender@gmail.com>");
  });

  it("escapes visitor input in the HTML body", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: ["owner@example.com"], rejected: [] });
    await POST(request(body({ message: "<script>alert(1)</script> please call me" })));
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("keeps the subject on one line even if the visitor puts a line break in their name", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: ["owner@example.com"], rejected: [] });
    const res = await POST(request(body({ fullName: "Jane\r\nBcc: attacker@example.com" })));
    if (res.status === 200) {
      expect(mocks.sendMail.mock.calls[0][0].subject).not.toMatch(/[\r\n]/);
    } else {
      // Validation may reject such a name outright, which is equally safe.
      expect(res.status).toBe(422);
      expect(mocks.sendMail).not.toHaveBeenCalled();
    }
  });

  it("returns 502 when the server rejects a recipient", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ["owner@example.com"] });
    const res = await POST(request(body()));
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("delivery_failed");
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("returns 502 on a login failure and never logs personal data, the password or the server message", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sendMail.mockRejectedValue(
      Object.assign(new Error("Invalid login: 535 5.7.8 sender@gmail.com app-password-value jane@company.com"), { name: "Error", code: "EAUTH" }),
    );
    const res = await POST(request(body()));
    expect(res.status).toBe(502);
    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).toContain("EAUTH");
    expect(logged).not.toContain("app-password-value");
    expect(logged).not.toContain("jane@company.com");
    expect(logged).not.toContain("sender@gmail.com");
    expect(logged).not.toContain("appointment reminders");
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("gives up after 10 seconds when the SMTP server hangs", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sendMail.mockImplementation(() => new Promise(() => {}));
    const pending = POST(request(body()));
    await vi.advanceTimersByTimeAsync(10_001);
    const res = await pending;
    expect(res.status).toBe(502);
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("does not send the same submission twice", async () => {
    mocks.sendMail.mockResolvedValue({ accepted: ["owner@example.com"], rejected: [] });
    const payload = body();
    await POST(request(payload));
    const second = await POST(request(payload));
    expect(second.status).toBe(200);
    expect(mocks.sendMail).toHaveBeenCalledOnce();
  });
});
