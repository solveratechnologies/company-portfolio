import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";
import { resetContactProtection } from "@/lib/contact";

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

function request(payload: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}

describe("POST /api/contact", () => {
  const env = { ...process.env };
  beforeEach(() => {
    resetContactProtection();
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.CONTACT_WEBHOOK_URL;
    delete process.env.CONTACT_WEBHOOK_SECRET;
    delete process.env.CONTACT_CLIENT_IP_HEADER;
  });
  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  it("returns 422 with field errors for invalid data", async () => {
    const res = await POST(request(body({ email: "nope" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.fieldErrors.email).toBeDefined();
  });

  it("never reports success when no delivery provider is configured", async () => {
    const res = await POST(request(body()));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("not_configured");
  });

  it("rejects honeypot submissions", async () => {
    const res = await POST(request(body({ companyFax: "spam" })));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("spam");
  });

  it("rejects cross-origin requests", async () => {
    const res = await POST(request(body(), { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("rejects malformed JSON", async () => {
    const res = await POST(request("{not json"));
    expect(res.status).toBe(400);
  });

  it("delivers to the webhook and returns success only after a 2xx", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await POST(request(body()));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const sent = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(sent.companyFax).toBeUndefined();
    expect(sent.email).toBe("jane@company.com");
  });

  it("returns 502 when the provider fails", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("err", { status: 500 }));
    const res = await POST(request(body()));
    expect(res.status).toBe(502);
  });

  it("does not deliver the same submission twice", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));
    const payload = body();
    await POST(request(payload));
    const second = await POST(request(payload));
    expect(second.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rate limits repeated submissions from one client (trusted IP header configured)", async () => {
    process.env.CONTACT_CLIENT_IP_HEADER = "x-real-ip";
    const headers = { "x-real-ip": "203.0.113.9" };
    let last: Response | undefined;
    for (let i = 0; i < 6; i++) last = await POST(request(body(), headers));
    expect(last!.status).toBe(429);
    // A different client is not affected.
    const other = await POST(request(body(), { "x-real-ip": "203.0.113.10" }));
    expect(other.status).not.toBe(429);
  });

  it("does not let a spoofed X-Forwarded-For bypass the limit when no trusted header is configured", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 21; i++) last = await POST(request(body({ email: "nope" }), { "x-forwarded-for": `198.51.100.${i}` }));
    expect(last!.status).toBe(429);
  });

  it("uses the right-most X-Forwarded-For entry when that header is configured as trusted", async () => {
    process.env.CONTACT_CLIENT_IP_HEADER = "x-forwarded-for";
    // The left-most value is attacker-controlled and changes; the right-most is added by the trusted proxy.
    let last: Response | undefined;
    for (let i = 0; i < 6; i++) last = await POST(request(body(), { "x-forwarded-for": `1.2.3.${i}, 203.0.113.50` }));
    expect(last!.status).toBe(429);
  });

  it("returns 502 and never leaks personal data to the logs when the provider times out", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    process.env.CONTACT_WEBHOOK_SECRET = "super-secret-value";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(request(body()));
    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("delivery_failed");
    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).toContain("TimeoutError");
    expect(logged).not.toContain("jane@company.com");
    expect(logged).not.toContain("appointment reminders");
    expect(logged).not.toContain("super-secret-value");
  });

  it("does not treat a redirect as accepted and does not follow it", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://elsewhere.example" } }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(request(body()));
    expect(res.status).toBe(502);
    expect(fetchMock.mock.calls[0][1]!.redirect).toBe("manual");
  });

  it("refuses a non-https webhook URL (secret/PII would travel in clear text)", async () => {
    process.env.CONTACT_WEBHOOK_URL = "http://hooks.example.com/inquiry";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(request(body()));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a plain-http loopback webhook for local test receivers", async () => {
    process.env.CONTACT_WEBHOOK_URL = "http://127.0.0.1:4010/inquiry";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await POST(request(body()));
    expect(res.status).toBe(200);
  });

  it("delivers once when the same submission arrives concurrently, and reports it as in progress", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    let release!: (r: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise<Response>((resolve) => (release = resolve)));
    const payload = body();
    const first = POST(request(payload));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const second = await POST(request(payload));
    expect(second.status).toBe(409);
    expect((await second.json()).code).toBe("in_progress");
    release(new Response("ok", { status: 200 }));
    expect((await first).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("allows a retry with the same submission id after a failed delivery", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example.com/inquiry";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("err", { status: 500 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const payload = body();
    expect((await POST(request(payload))).status).toBe(502);
    expect((await POST(request(payload))).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
