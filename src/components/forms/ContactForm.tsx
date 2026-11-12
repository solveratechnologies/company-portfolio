"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Wrench } from "lucide-react";
import { BUDGET_OPTIONS, SERVICE_OPTIONS, TIMELINE_OPTIONS, type ContactFieldErrors, type ContactResponse } from "@/types/contact";
import { validateContact } from "@/lib/validation";
import { FormField } from "./FormField";
import { SelectField } from "./SelectField";
import { SubmitButton } from "./SubmitButton";

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success" }
  | { state: "error"; message: string; notConfigured?: boolean };

const FIELD_ORDER = ["fullName", "email", "company", "website", "service", "budget", "timeline", "message", "consent"] as const;

function readForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  const get = (k: string) => (fd.get(k) as string | null) ?? "";
  return {
    fullName: get("fullName"),
    email: get("email"),
    company: get("company"),
    website: get("website"),
    service: get("service"),
    budget: get("budget"),
    timeline: get("timeline"),
    message: get("message"),
    consent: fd.get("consent") === "on",
    companyFax: get("hpTrapField"),
  };
}

export function ContactForm({ contactEmail }: { contactEmail?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number>(0);
  const submissionId = useRef<string>("");
  const sending = useRef(false);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });

  useEffect(() => {
    startedAt.current = Date.now();
    const param = new URLSearchParams(window.location.search).get("service");
    // Preselect a service when arriving from a service page (?service=…). The select is uncontrolled.
    const select = formRef.current?.querySelector<HTMLSelectElement>('select[name="service"]');
    if (select && param && (SERVICE_OPTIONS as readonly string[]).includes(param)) select.value = param;
  }, []);

  function focusFirstError(fieldErrors: ContactFieldErrors) {
    const first = FIELD_ORDER.find((k) => fieldErrors[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Synchronous guard: React state is stale within the same tick, so a fast double-click/Enter
    // could otherwise start two requests before `status` updates.
    if (sending.current || status.state === "submitting") return;

    const values = readForm(e.currentTarget);
    const result = validateContact({ ...values, startedAt: startedAt.current });
    if (!result.success) {
      setErrors(result.fieldErrors);
      setStatus({ state: "idle" });
      focusFirstError(result.fieldErrors);
      return;
    }

    setErrors({});
    setStatus({ state: "submitting" });
    sending.current = true;
    if (!submissionId.current) submissionId.current = crypto.randomUUID();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startedAt: startedAt.current, submissionId: submissionId.current }),
      });
      let data: ContactResponse | null = null;
      try {
        data = (await res.json()) as ContactResponse;
      } catch {
        data = null;
      }

      if (res.ok && data?.ok) {
        setStatus({ state: "success" });
        formRef.current?.reset();
        submissionId.current = "";
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }

      if (data && !data.ok && data.code === "validation" && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setStatus({ state: "idle" });
        focusFirstError(data.fieldErrors);
        return;
      }

      setStatus({
        state: "error",
        notConfigured: data && !data.ok ? data.code === "not_configured" : false,
        message:
          data && !data.ok
            ? data.message
            : "Something went wrong while sending your inquiry. Your details are still in the form — please try again.",
      });
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      setStatus({
        state: "error",
        message: "We couldn't reach the server. Please check your connection and try again — your details are still in the form.",
      });
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      sending.current = false;
    }
  }

  const pending = status.state === "submitting";
  const isDev = process.env.NODE_ENV !== "production";

  if (status.state === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card)] border border-mint/40 bg-mint-50 p-8 outline-none md:p-10">
        <CheckCircle2 aria-hidden className="size-10 text-mint" />
        <h3 className="mt-5 text-2xl font-semibold">Thank you — your inquiry has been sent.</h3>
        <p className="mt-3 max-w-lg leading-relaxed text-ink/75">
          We&apos;ve received your project details and will review them carefully. You can expect a reply to the email address you provided.
        </p>
        <button type="button" onClick={() => setStatus({ state: "idle" })} className="mt-6 text-sm font-medium text-brand-ink hover:text-brand-ink-hover">
          Send another inquiry
        </button>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby="form-required-note" className="flex flex-col gap-6">
      <p id="form-required-note" className="text-sm text-muted">
        Fields marked <span className="text-red-600">*</span> are required.
      </p>

      {errorCount > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>
            Please correct {errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`} below.
          </p>
        </div>
      )}

      {status.state === "error" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 outline-none">
          {status.notConfigured && isDev ? <Wrench aria-hidden className="mt-0.5 size-4 shrink-0" /> : <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />}
          <div>
            {status.notConfigured && isDev ? (
              <>
                <p className="font-semibold">Development notice: the contact form is not connected yet.</p>
                <p className="mt-1">
                  No message was sent. Set <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> and{" "}
                  <code className="rounded bg-amber-100 px-1">CONTACT_TO_EMAIL</code>, or <code className="rounded bg-amber-100 px-1">CONTACT_WEBHOOK_URL</code>, in{" "}
                  <code className="rounded bg-amber-100 px-1">.env.local</code>. See the README.
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

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="fullName" label="Full name" required autoComplete="name" error={errors.fullName} maxLength={120} />
        <FormField id="email" label="Business email" type="email" required autoComplete="email" inputMode="email" error={errors.email} placeholder="name@company.com" maxLength={200} />
        <FormField id="company" label="Company name" autoComplete="organization" error={errors.company} maxLength={120} />
        <FormField id="website" label="Website URL" type="text" inputMode="url" autoComplete="url" placeholder="example.com" error={errors.website} maxLength={200} />
      </div>

      <SelectField
        id="service"
        label="Service required"
        required
        options={SERVICE_OPTIONS}
        error={errors.service}
        placeholder="Choose a service"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField id="budget" label="Estimated budget" options={BUDGET_OPTIONS} error={errors.budget} placeholder="Select a range" hint="Helps us suggest a realistic scope." />
        <SelectField id="timeline" label="Project timeline" options={TIMELINE_OPTIONS} error={errors.timeline} placeholder="Select a timeline" />
      </div>

      <FormField
        id="message"
        label="Project description"
        required
        multiline
        rows={6}
        maxLength={5000}
        error={errors.message}
        hint="What are you trying to achieve? Mention any tools, systems or deadlines involved."
      />

      {/* Honeypot: hidden from people and assistive tech, attractive to bots. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        {/* Deliberately not named like a real field (fax, phone, ...): browser autofill would fill it and get real users flagged as bots. */}
        <label htmlFor="hp-trap-field">Leave this field empty</label>
        <input id="hp-trap-field" name="hpTrapField" type="text" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1 size-5 shrink-0 cursor-pointer rounded border-line accent-brand"
          />
          <label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed text-ink/80">
            I agree that Solvera Technologies may use these details to respond to my inquiry, as described in the{" "}
            <Link href="/privacy-policy" className="font-medium text-brand-ink underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .<span className="ml-1 text-red-600" aria-hidden>*</span>
          </label>
        </div>
        {errors.consent && (
          <p id="consent-error" className="ml-8 text-sm text-red-700">
            ⚠ {errors.consent}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton pending={pending}>Send Inquiry</SubmitButton>
        <p className="text-xs text-muted">We only use your details to respond to this inquiry.</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {pending ? "Sending your inquiry…" : ""}
      </p>
    </form>
  );
}
