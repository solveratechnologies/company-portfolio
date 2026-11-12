import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingCalendar } from "@/components/forms/BookingCalendar";
import { formatBookingDate, toIsoDate } from "@/lib/booking-validation";
import { formatLocalRange, visitorSlotsForLocalDate, type VisitorSlot } from "@/lib/booking-slots";

type User = ReturnType<typeof userEvent.setup>;

/** The calendar shows times in the browser's own time zone, so the tests do too. */
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Karachi";

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });

/** Local `YYYY-MM-DD` for `days` from today. Starts days out, so no slot is ever "already past" whatever the time zone. */
function dayIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

const slotsOn = (iso: string) => visitorSlotsForLocalDate(iso, tz);
const label = (slot: VisitorSlot) => formatLocalRange(slot.startMs, tz);
const firstFree = (iso: string) => slotsOn(iso).find((s) => !s.taken)!;

/** A day (2–60 days out) that has at least one taken slot. */
const dayWithTakenSlot = () => Array.from({ length: 59 }, (_, i) => dayIso(i + 2)).find((d) => slotsOn(d).some((s) => s.taken))!;

/** Opens the right month, then clicks the day. */
async function pickDay(user: User, iso: string) {
  // Days of other months are not rendered, so page forward until the day is on screen (targets are always ahead).
  for (let i = 0; i < 4 && !screen.queryByRole("button", { name: formatBookingDate(iso) }); i++) {
    await user.click(screen.getByRole("button", { name: /next month/i }));
  }
  await user.click(screen.getByRole("button", { name: formatBookingDate(iso) }));
}

/** Picks a day and its first free slot; returns what was picked. */
async function pickDayAndTime(user: User, iso = dayIso(3)) {
  await pickDay(user, iso);
  const slot = firstFree(iso);
  await user.click(screen.getByRole("button", { name: label(slot) }));
  return { iso, slot };
}

describe("BookingCalendar", () => {
  afterEach(() => vi.restoreAllMocks());

  it("starts on the date step with past days disabled and no time slots yet", () => {
    const { container } = render(<BookingCalendar />);
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument();
    expect(screen.getByText(/pick a date to see the available times/i)).toBeInTheDocument();
    expect(container.querySelector("[data-slot]")).toBeNull();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.getMonth() === new Date().getMonth()) {
      expect(screen.getByRole("button", { name: formatBookingDate(toIsoDate(yesterday)) })).toBeDisabled();
    }
    expect(screen.getByRole("button", { name: /previous month/i })).toBeDisabled();
  });

  it("will not continue until a date is chosen", async () => {
    const user = userEvent.setup();
    render(<BookingCalendar />);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a date/i);
    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument();
  });

  it("shows the visitor's time zone and 30-minute slots in one list after a date is chosen, and will not continue until one is picked", async () => {
    const user = userEvent.setup();
    const { container } = render(<BookingCalendar />);
    const iso = dayIso(3);
    await pickDay(user, iso);

    expect(screen.getByText(new RegExp(tz.replace("/", "\\/")))).toBeInTheDocument();
    const buttons = container.querySelectorAll("[data-slot]");
    expect(buttons).toHaveLength(slotsOn(iso).length);
    // One column: every slot is in the same scrollable group.
    const group = screen.getByRole("group", { name: /available times/i });
    expect(group.className).toMatch(/overflow-y-auto/);
    expect(group.querySelectorAll("[data-slot]")).toHaveLength(buttons.length);

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a time/i);
    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument();
  });

  it("shows taken slots blurred and disabled, and lets the visitor pick a free one", async () => {
    const user = userEvent.setup();
    render(<BookingCalendar />);
    const iso = dayWithTakenSlot();
    await pickDay(user, iso);

    for (const slot of slotsOn(iso).filter((s) => s.taken)) {
      const button = screen.getByRole("button", { name: `${label(slot)}, already taken` });
      expect(button).toBeDisabled();
      expect(button.className).toMatch(/blur/);
    }

    const free = screen.getByRole("button", { name: label(firstFree(iso)) });
    expect(free).toBeEnabled();
    expect(free.className).not.toMatch(/blur/);
    await user.click(free);
    expect(free).toHaveAttribute("aria-pressed", "true");
  });

  it("clears the chosen time when another date is chosen", async () => {
    const user = userEvent.setup();
    const { container } = render(<BookingCalendar />);
    await pickDayAndTime(user, dayIso(3));
    expect(container.querySelectorAll("[data-slot][aria-pressed=true]")).toHaveLength(1);

    await pickDay(user, dayIso(4));
    expect(container.querySelectorAll("[data-slot][aria-pressed=true]")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a time/i);
  });

  it("keeps the honeypot out of reach of address autofill and sends it empty on the first attempt", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse());
    const user = userEvent.setup();
    const { container } = render(<BookingCalendar />);
    await pickDayAndTime(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // A honeypot named like an address field (company, fax, phone...) gets filled by browser autofill,
    // which made the first real booking be rejected as spam.
    const trap = container.querySelector<HTMLInputElement>("form input[aria-hidden], form [aria-hidden] input");
    expect(trap).not.toBeNull();
    expect(`${trap!.name} ${trap!.id}`).not.toMatch(/company|fax|phone|name|email|address/i);

    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email/i), "jane@company.com");
    await user.type(screen.getByLabelText(/company name/i), "Acme Ltd");
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));
    expect(JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string).companyFax).toBe("");
  });

  it("asks for name, email and company on the next step, then sends the PKT slot and the visitor's zone, and confirms only after a 200", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse());
    const user = userEvent.setup();
    render(<BookingCalendar />);

    const { slot } = await pickDayAndTime(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(label(slot)))).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();

    // Invalid details never reach the server.
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^name/i)).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email/i), "jane@company.com");
    await user.type(screen.getByLabelText(/company name/i), "Acme Ltd");
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/booking");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      // The slot is always sent as its business-zone (PKT) date and time...
      date: slot.date,
      time: slot.time,
      // ...with the visitor's own zone, so the email can show their local time too.
      timeZone: tz,
      fullName: "Jane Doe",
      email: "jane@company.com",
      company: "Acme Ltd",
    });
    expect(await screen.findByText(/booking request has been sent/i)).toBeInTheDocument();
  });

  it("keeps the details and never shows success when delivery fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, code: "not_configured", message: "Unavailable" }), { status: 503, headers: { "content-type": "application/json" } }),
    );
    const user = userEvent.setup();
    render(<BookingCalendar />);
    await pickDayAndTime(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email/i), "jane@company.com");
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(screen.queryByText(/has been sent/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Jane Doe");
  });

  it("lets the visitor go back and change the date or time without losing what they typed", async () => {
    const user = userEvent.setup();
    render(<BookingCalendar />);
    await pickDayAndTime(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    await user.click(screen.getByRole("button", { name: /change date or time/i }));
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Jane Doe");
  });
});
