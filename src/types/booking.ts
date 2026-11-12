export interface BookingPayload {
  /** Chosen day, `YYYY-MM-DD` (calendar date, no time zone). */
  date: string;
  fullName: string;
  email: string;
  company?: string;
  /** Honeypot — must stay empty. */
  companyFax?: string;
  /** Time the calendar was rendered (ms epoch), used to reject instant bot submissions. */
  startedAt?: number;
  /** Client-generated id to prevent duplicate deliveries. */
  submissionId?: string;
}

export type BookingFieldErrors = Partial<Record<keyof BookingPayload, string>>;

export type BookingResponse =
  | { ok: true }
  | {
      ok: false;
      code: "validation" | "rate_limited" | "not_configured" | "delivery_failed" | "spam" | "bad_request" | "in_progress";
      message: string;
      fieldErrors?: BookingFieldErrors;
    };
