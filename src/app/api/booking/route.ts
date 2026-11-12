import { NextResponse, type NextRequest } from "next/server";
import { looksLikeSpam } from "@/lib/validation";
import { validateBooking } from "@/lib/booking-validation";
import { claimSubmission, deliverBooking, finishSubmission, isRateLimited, resolveClientKey } from "@/lib/contact";
import type { BookingResponse } from "@/types/booking";

const MAX_BODY_BYTES = 5_000;

function json(body: BookingResponse, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Booking requests: same safeguards as /api/contact (origin check, rate limit, honeypot, duplicate protection, honest delivery). */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return json({ ok: false, code: "bad_request", message: "Invalid request origin." }, 403);
  }

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, code: "bad_request", message: "Expected a JSON request body." }, 415);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, code: "bad_request", message: "Your request is too long. Please shorten it and try again." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, code: "bad_request", message: "The request could not be read. Please try again." }, 400);
  }

  const client = resolveClientKey(req.headers);
  if (await isRateLimited(client.key, client.limit)) {
    return json({ ok: false, code: "rate_limited", message: "You've sent several requests in a short time. Please wait a few minutes and try again." }, 429);
  }

  const result = validateBooking(body);
  if (!result.success) {
    return json({ ok: false, code: "validation", message: "Please correct the highlighted fields.", fieldErrors: result.fieldErrors }, 422);
  }
  const data = result.data;

  if (looksLikeSpam(data)) {
    return json({ ok: false, code: "spam", message: "We couldn't verify this request. Please wait a moment and try again." }, 400);
  }

  const claim = claimSubmission(data.submissionId);
  if (claim === "duplicate") return json({ ok: true }, 200);
  if (claim === "in_progress") {
    return json({ ok: false, code: "in_progress", message: "Your booking is already being sent. Please wait a moment." }, 409);
  }

  let delivery: Awaited<ReturnType<typeof deliverBooking>> = { ok: false, reason: "delivery_failed" };
  try {
    delivery = await deliverBooking(data);
  } finally {
    finishSubmission(data.submissionId, delivery.ok);
  }

  if (!delivery.ok) {
    if (delivery.reason === "not_configured") {
      return json(
        { ok: false, code: "not_configured", message: "Our booking calendar is temporarily unavailable, and your request was not sent. Please try again later." },
        503,
      );
    }
    return json({ ok: false, code: "delivery_failed", message: "We couldn't send your booking right now. Your details are still here — please try again shortly." }, 502);
  }

  return json({ ok: true }, 200);
}

export function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed." }, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}
