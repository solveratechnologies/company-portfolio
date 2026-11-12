"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, Wrench } from "lucide-react";
import { BOOKING_MAX_DAYS_AHEAD, formatBookingDate, toIsoDate, validateBooking } from "@/lib/booking-validation";
import { formatLocalRange, formatLocalTime, slotStartMs, timeZoneShortName, visitorSlotsForLocalDate } from "@/lib/booking-slots";
import type { BookingFieldErrors, BookingResponse } from "@/types/booking";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { FormField } from "./FormField";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Step = "date" | "details" | "success";

/** DOM name of the honeypot input. Deliberately not address-like, so autofill never touches it. */
const HONEYPOT_FIELD = "hpTrapField";
type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "error"; message: string; notConfigured?: boolean };

type Details = { fullName: string; email: string; company: string };

/** The clock never needs a subscription: the calendar is simply re-read on each render. */
const subscribeNever = () => () => {};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Same day-of-month in another month, clamped (Jan 31 + 1 month = Feb 28/29). */
function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
}

function fromIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function BookingCalendar({ contactEmail }: { contactEmail?: string }) {
  // "Today" comes from the visitor's clock: null on the server and during hydration, the local date afterwards.
  const todayKey = useSyncExternalStore(
    subscribeNever,
    () => toIsoDate(new Date()),
    () => null,
  );
  const today = todayKey ? fromIso(todayKey) : null;
  // The visitor's time zone (null on the server and during hydration).
  const timeZone = useSyncExternalStore(
    subscribeNever,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi",
    () => null,
  );
  // The current minute, used to hide time slots that have already started today. Stable within a minute.
  const nowMinute = useSyncExternalStore(
    subscribeNever,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  const [viewMonthState, setViewMonth] = useState<Date | null>(null);
  const viewMonth = viewMonthState ?? (today ? startOfMonth(today) : null);
  const [selected, setSelected] = useState<string | null>(null);
  // The chosen slot as the server knows it: the business-zone (PKT) date + time. Shown to the visitor in their own time zone.
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("date");
  const [errors, setErrors] = useState<BookingFieldErrors>({});
  const [details, setDetails] = useState<Details>({ fullName: "", email: "", company: "" });
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const formRef = useRef<HTMLFormElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const detailsHeadingRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const submissionId = useRef("");
  const sending = useRef(false);
  const pendingFocus = useRef(false);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Move DOM focus to the day chosen with the keyboard, after the (possibly new) month has rendered.
  useEffect(() => {
    if (!pendingFocus.current || !focusIso) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusIso}"]`)?.focus();
  }, [focusIso, viewMonth]);

  const slotMs = selectedSlot ? slotStartMs(selectedSlot.date, selectedSlot.time) : null;

  if (step === "success" && selected && slotMs !== null && timeZone) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card)] border border-mint/40 bg-mint-50 p-8 outline-none md:p-10">
        <CheckCircle2 aria-hidden className="size-10 text-mint" />
        <h3 className="mt-5 text-2xl font-semibold">Thank you — your booking request has been sent.</h3>
        <p className="mt-3 max-w-lg leading-relaxed text-ink/75">
          We&apos;ve received your request for <strong className="font-semibold text-ink">{formatBookingDate(selected)}</strong> at{" "}
          <strong className="font-semibold text-ink">
            {formatLocalRange(slotMs, timeZone)} ({timeZone})
          </strong>
          . We&apos;ll email {details.email ? <strong className="font-semibold text-ink">{details.email}</strong> : "you"} to confirm.
        </p>
        <button
          type="button"
          onClick={() => {
            setStep("date");
            setSelected(null);
            setSelectedSlot(null);
            setFocusIso(null);
            setDetails({ fullName: "", email: "", company: "" });
            setStatus({ state: "idle" });
            setErrors({});
            submissionId.current = "";
            startedAt.current = Date.now();
          }}
          className="mt-6 text-sm font-medium text-brand-ink hover:text-brand-ink-hover"
        >
          Book another time
        </button>
      </div>
    );
  }

  if (!today || !viewMonth || nowMinute === null || !timeZone) {
    return (
      <div aria-busy="true" className="min-h-[24rem] rounded-2xl border border-line bg-paper p-6 text-sm text-muted">
        Loading calendar…
      </div>
    );
  }

  const minDate = today;
  const maxDate = addDays(today, BOOKING_MAX_DAYS_AHEAD);
  const todayIso = toIsoDate(today);
  const isEnabled = (d: Date) => d >= minDate && d <= maxDate;

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const lead = viewMonth.getDay();
  // Weeks of seven cells; null pads the first and last week.
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const prevDisabled = startOfMonth(minDate) >= viewMonth;
  const nextDisabled = startOfMonth(maxDate) <= viewMonth;

  // Exactly one day is in the tab order (roving tabindex): the keyboard-focused day, else the selection, else today.
  const sameMonth = (d: Date) => d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
  let tabbable = fromIso(focusIso ?? selected ?? todayIso);
  if (!sameMonth(tabbable) || !isEnabled(tabbable)) {
    tabbable = new Date(viewMonth);
    while (sameMonth(tabbable) && !isEnabled(tabbable)) tabbable = addDays(tabbable, 1);
  }
  const tabbableIso = toIsoDate(tabbable);

  function goToMonth(delta: number) {
    setViewMonth(addMonths(viewMonth!, delta));
    setFocusIso(null);
  }

  function moveFocus(next: Date) {
    const clamped = next < minDate ? minDate : next > maxDate ? maxDate : next;
    pendingFocus.current = true;
    setFocusIso(toIsoDate(clamped));
    setViewMonth(startOfMonth(clamped));
  }

  function onDayKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, day: Date) {
    const rowStart = addDays(day, -day.getDay());
    const rowEnd = addDays(rowStart, 6);
    const targets: Record<string, Date> = {
      ArrowLeft: addDays(day, -1),
      ArrowRight: addDays(day, 1),
      ArrowUp: addDays(day, -7),
      ArrowDown: addDays(day, 7),
      Home: rowStart,
      End: rowEnd,
      PageUp: addMonths(day, -1),
      PageDown: addMonths(day, 1),
    };
    const next = targets[e.key];
    if (!next) return;
    e.preventDefault();
    moveFocus(next);
  }

  const now = new Date(nowMinute * 60_000);
  const daySlots = selected ? visitorSlotsForLocalDate(selected, timeZone, now) : [];
  const zoneName = timeZoneShortName(now.getTime(), timeZone);

  function chooseDate(iso: string) {
    // A time belongs to the day it was picked on, so changing the day always clears it.
    if (iso !== selected) setSelectedSlot(null);
    setSelected(iso);
    setFocusIso(iso);
    setErrors({});
  }

  function chooseTime(slot: { date: string; time: string }) {
    setSelectedSlot(slot);
    setErrors({});
  }

  function continueToDetails() {
    if (!selected) {
      setErrors({ date: "Please choose a date for your call." });
      return;
    }
    if (!selectedSlot) {
      setErrors({ time: "Please choose a time for your call." });
      return;
    }
    setErrors({});
    setStep("details");
    requestAnimationFrame(() => detailsHeadingRef.current?.focus());
  }

  function readDetails(form: HTMLFormElement): Details & { companyFax: string } {
    const fd = new FormData(form);
    const get = (k: string) => ((fd.get(k) as string | null) ?? "").trim();
    return { fullName: get("fullName"), email: get("email"), company: get("company"), companyFax: get(HONEYPOT_FIELD) };
  }

  function backToDate() {
    if (formRef.current) {
      const { fullName, email, company } = readDetails(formRef.current);
      setDetails({ fullName, email, company });
    }
    setErrors({});
    setStatus({ state: "idle" });
    setStep("date");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current || status.state === "submitting" || !selected || !selectedSlot || !timeZone) return;

    const values = readDetails(e.currentTarget);
    setDetails({ fullName: values.fullName, email: values.email, company: values.company });
    // The server books in PKT: send the slot's PKT date + time, plus the visitor's zone for their local time in the email.
    const payload = { date: selectedSlot.date, time: selectedSlot.time, timeZone, ...values, startedAt: startedAt.current };
    const result = validateBooking(payload);
    if (!result.success) {
      setErrors(result.fieldErrors);
      setStatus({ state: "idle" });
      if (result.fieldErrors.date || result.fieldErrors.time) setStep("date");
      else formRef.current?.querySelector<HTMLElement>(`[name="${(["fullName", "email", "company"] as const).find((k) => result.fieldErrors[k]) ?? ""}"]`)?.focus();
      return;
    }

    setErrors({});
    setStatus({ state: "submitting" });
    sending.current = true;
    if (!submissionId.current) submissionId.current = crypto.randomUUID();

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, submissionId: submissionId.current }),
      });
      let data: BookingResponse | null = null;
      try {
        data = (await res.json()) as BookingResponse;
      } catch {
        data = null;
      }

      if (res.ok && data?.ok) {
        setStep("success");
        setStatus({ state: "idle" });
        submissionId.current = "";
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }

      if (data && !data.ok && data.code === "validation" && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setStatus({ state: "idle" });
        if (data.fieldErrors.date || data.fieldErrors.time) {
          // The chosen time is no longer available: drop it so the visitor picks another.
          if (data.fieldErrors.time) setSelectedSlot(null);
          setStep("date");
        }
        return;
      }

      setStatus({
        state: "error",
        notConfigured: data && !data.ok ? data.code === "not_configured" : false,
        message:
          data && !data.ok ? data.message : "Something went wrong while sending your booking. Your details are still here — please try again.",
      });
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      setStatus({ state: "error", message: "We couldn't reach the server. Please check your connection and try again — your details are still here." });
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      sending.current = false;
    }
  }

  const pending = status.state === "submitting";
  const isDev = process.env.NODE_ENV !== "production";
  const stepNumber = step === "date" ? 1 : 2;

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted" aria-live="polite">
        Step {stepNumber} of 2 · {step === "date" ? "Choose a date & time" : "Your details"}
      </p>

      {step === "date" && (
        <div className="flex flex-col gap-5">
          {/* Container queries: calendar on the left and times on the right once the card is wide enough, stacked otherwise. */}
          <div className="@container">
          <div className="grid gap-4 @lg:grid-cols-[minmax(0,1fr)_11.5rem]">
          <div className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                disabled={prevDisabled}
                aria-label="Previous month"
                className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <h3 aria-live="polite" className="text-base font-semibold sm:text-lg">
                {monthLabel}
              </h3>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                disabled={nextDisabled}
                aria-label="Next month"
                className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>

            <div role="grid" aria-label={`Choose a date, ${monthLabel}`} ref={gridRef} className="mt-4">
              <div role="row" className="grid grid-cols-7 text-center text-xs font-medium text-muted">
                {WEEKDAYS.map((d) => (
                  <span key={d} role="columnheader" className="py-2">
                    {d}
                  </span>
                ))}
              </div>
              {weeks.map((week, w) => (
                <div key={w} role="row" className="grid grid-cols-7 gap-y-1">
                  {week.map((day, i) => {
                    if (!day) return <span key={`blank-${i}`} role="gridcell" />;
                    const iso = toIsoDate(day);
                    const enabled = isEnabled(day);
                    const isSelected = iso === selected;
                    return (
                      <span key={iso} role="gridcell" className="flex justify-center">
                        <button
                          type="button"
                          data-date={iso}
                          disabled={!enabled}
                          tabIndex={iso === tabbableIso ? 0 : -1}
                          aria-pressed={isSelected}
                          aria-label={formatBookingDate(iso)}
                          aria-current={iso === todayIso ? "date" : undefined}
                          onClick={() => chooseDate(iso)}
                          onKeyDown={(e) => onDayKeyDown(e, day)}
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full text-sm transition-colors sm:size-11",
                            enabled ? "cursor-pointer text-ink hover:bg-brand-50" : "cursor-not-allowed text-ink/30",
                            iso === todayIso && !isSelected && "ring-1 ring-brand/60",
                            isSelected && "bg-brand font-semibold text-ink hover:bg-brand",
                          )}
                        >
                          {day.getDate()}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Times: one column, scrolls on its own. Beside the calendar it is exactly as tall as the calendar. */}
          <div className="relative rounded-2xl border border-line bg-paper">
            <div className="flex flex-col p-4 @lg:absolute @lg:inset-0">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Clock aria-hidden className="size-4 text-brand" />
                Choose a time
              </h3>
              <p className="mt-1 text-xs text-muted">
                30-minute calls · {zoneName} ({timeZone})
              </p>

              {!selected ? (
                <p className="mt-4 text-sm text-ink/75">Pick a date to see the available times.</p>
              ) : daySlots.length === 0 ? (
                <p className="mt-4 text-sm text-ink/75">No times are left on this day. Please choose another date.</p>
              ) : (
                <div
                  role="group"
                  aria-label={`Available times on ${formatBookingDate(selected)}`}
                  className="mt-3 flex max-h-72 min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 @lg:max-h-none @lg:flex-1"
                >
                  {daySlots.map((slot) => {
                    const key = `${slot.date}T${slot.time}`;
                    const range = formatLocalRange(slot.startMs, timeZone);
                    const isChosen = selectedSlot?.date === slot.date && selectedSlot.time === slot.time;
                    return (
                      <button
                        key={key}
                        type="button"
                        data-time={slot.time}
                        data-slot={key}
                        disabled={slot.taken}
                        aria-pressed={isChosen}
                        aria-label={slot.taken ? `${range}, already taken` : range}
                        title={slot.taken ? "Already taken" : undefined}
                        onClick={() => chooseTime({ date: slot.date, time: slot.time })}
                        className={cn(
                          "h-11 w-full shrink-0 rounded-xl border text-sm font-medium transition-colors",
                          slot.taken
                            ? "cursor-not-allowed select-none border-line bg-ink/[0.04] text-ink/50 opacity-60 blur-[2px]"
                            : isChosen
                              ? "border-brand bg-brand text-ink"
                              : "border-line bg-white text-ink hover:border-brand hover:bg-brand-50",
                        )}
                      >
                        {formatLocalTime(slot.startMs, timeZone)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>
          </div>

          {errors.date && (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700">
              <span aria-hidden>⚠</span>
              {errors.date}
            </p>
          )}

          {errors.time && (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-red-700">
              <span aria-hidden>⚠</span>
              {errors.time}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-ink/80" aria-live="polite">
              <CalendarDays aria-hidden className="size-4 shrink-0 text-brand" />
              {selected ? (
                <span className="font-medium">
                  {formatBookingDate(selected)}
                  {slotMs !== null ? ` · ${formatLocalTime(slotMs, timeZone)} ${zoneName}` : ""}
                </span>
              ) : (
                <span className="text-muted">No date selected yet</span>
              )}
            </p>
            <Button size="lg" arrow onClick={continueToDetails}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "details" && selected && slotMs !== null && (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
            <p className="flex items-center gap-2 text-sm">
              <CalendarDays aria-hidden className="size-4 shrink-0 text-brand" />
              <span className="font-medium">
                {formatBookingDate(selected)} · {formatLocalRange(slotMs, timeZone)} ({zoneName})
              </span>
            </p>
            <button type="button" onClick={backToDate} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink hover:text-brand-ink-hover">
              <ArrowLeft aria-hidden className="size-3.5" /> Change date or time
            </button>
          </div>

          <h3 ref={detailsHeadingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
            Tell us who&apos;s booking
          </h3>

          {Object.keys(errors).length > 0 && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>Please correct the highlighted {Object.keys(errors).length === 1 ? "field" : "fields"} below.</p>
            </div>
          )}

          {status.state === "error" && (
            <div ref={statusRef} tabIndex={-1} role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 outline-none">
              {status.notConfigured && isDev ? <Wrench aria-hidden className="mt-0.5 size-4 shrink-0" /> : <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />}
              <div>
                {status.notConfigured && isDev ? (
                  <>
                    <p className="font-semibold">Development notice: bookings are not connected yet.</p>
                    <p className="mt-1">
                      No request was sent. Booking requests use the same delivery settings as the contact form: set <code className="rounded bg-amber-100 px-1">CONTACT_TO_EMAIL</code>{" "}
                      with <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> or <code className="rounded bg-amber-100 px-1">SMTP_USER</code>/
                      <code className="rounded bg-amber-100 px-1">SMTP_PASS</code>, or <code className="rounded bg-amber-100 px-1">CONTACT_WEBHOOK_URL</code>, in{" "}
                      <code className="rounded bg-amber-100 px-1">.env.local</code>.
                    </p>
                  </>
                ) : (
                  <>
                    <p>{status.message}</p>
                    {contactEmail && (
                      <p className="mt-1">
                        You can also email us at{" "}
                        <a className="font-medium underline" href={`mailto:${contactEmail}`}>
                          {contactEmail}
                        </a>
                        .
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <FormField id="fullName" label="Name" required autoComplete="name" error={errors.fullName} maxLength={120} defaultValue={details.fullName} />
            <FormField
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="name@company.com"
              error={errors.email}
              maxLength={200}
              defaultValue={details.email}
            />
            <FormField id="company" label="Company name" autoComplete="organization" error={errors.company} maxLength={120} defaultValue={details.company} />
          </div>

          {/*
            Honeypot: hidden from people and assistive tech, attractive to bots. Its name and label must NOT
            look like an address field (e.g. "company"): browser autofill would fill it from the saved
            profile and the server would then reject a real person as a bot.
          */}
          <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
            <input
              id={HONEYPOT_FIELD}
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={pending}
              aria-disabled={pending}
              className="group/btn inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-medium text-ink transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-75"
            >
              {pending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Confirm booking"
              )}
            </button>
            <p className="text-xs text-muted">We only use your details to arrange this call.</p>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {pending ? "Sending your booking request…" : ""}
          </p>
        </form>
      )}
    </div>
  );
}
