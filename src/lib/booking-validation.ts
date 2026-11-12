import { z } from "zod";
import type { BookingFieldErrors } from "@/types/booking";

/** How far ahead a call can be requested. */
export const BOOKING_MAX_DAYS_AHEAD = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` for a local calendar date (what the visitor sees in the calendar). */
export function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parses `YYYY-MM-DD` as a pure calendar date (UTC midnight). Returns null for anything else, including 2026-02-31. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

/** Human readable, e.g. "Tuesday, November 18, 2026". Works for any `YYYY-MM-DD`; returns the input if it is invalid. */
export function formatBookingDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * Earliest and latest selectable days. The server cannot know the visitor's time zone, so it accepts one day of slack on each
 * side of "today" in UTC; the calendar itself disables past days using the visitor's own local date.
 */
export function bookingWindow(now = new Date()) {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { min: todayUtc - DAY_MS, max: todayUtc + (BOOKING_MAX_DAYS_AHEAD + 1) * DAY_MS };
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const bookingSchema = z.object({
  date: z
    .string({ error: "Please choose a date for your call." })
    .trim()
    .superRefine((value, ctx) => {
      const date = parseIsoDate(value);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Please choose a date for your call." });
        return;
      }
      const { min, max } = bookingWindow();
      if (date.getTime() < min) ctx.addIssue({ code: "custom", message: "That date has already passed. Please choose another day." });
      else if (date.getTime() > max) ctx.addIssue({ code: "custom", message: `Please choose a date within the next ${BOOKING_MAX_DAYS_AHEAD} days.` });
    }),
  fullName: z
    .string({ error: "Please enter your name." })
    .trim()
    .min(2, "Please enter your name.")
    .max(120, "Please keep this under 120 characters."),
  email: z
    .string({ error: "Please enter your email." })
    .trim()
    .min(1, "Please enter your email.")
    .max(200, "Please keep this under 200 characters.")
    .pipe(z.email("Please enter a valid email address, like name@company.com.")),
  company: optionalText(120),
  companyFax: z.string().optional(),
  startedAt: z.number().optional(),
  submissionId: z.string().max(100).optional(),
});

export type BookingData = z.output<typeof bookingSchema>;

export function validateBooking(input: unknown):
  | { success: true; data: BookingData }
  | { success: false; fieldErrors: BookingFieldErrors } {
  const result = bookingSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: BookingFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof BookingFieldErrors | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}
