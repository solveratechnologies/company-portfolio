import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingCalendar } from "@/components/forms/BookingCalendar";
import { formatBookingDate, toIsoDate } from "@/lib/booking-validation";

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });

/** The enabled day button for today (always selectable, always in the first rendered month). */
const todayButton = () => screen.getByRole("button", { name: formatBookingDate(toIsoDate(new Date())) });

describe("BookingCalendar", () => {
  afterEach(() => vi.restoreAllMocks());

  it("starts on the date step with past days disabled", () => {
    render(<BookingCalendar />);
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^name/i)).not.toBeInTheDocument();
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

  it("keeps the honeypot out of reach of address autofill and sends it empty on the first attempt", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse());
    const user = userEvent.setup();
    const { container } = render(<BookingCalendar />);
    await user.click(todayButton());
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

  it("asks for name, email and company on the next step, then confirms only after a 200", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(okResponse());
    const user = userEvent.setup();
    render(<BookingCalendar />);

    await user.click(todayButton());
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
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
      date: toIsoDate(new Date()),
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
    await user.click(todayButton());
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email/i), "jane@company.com");
    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(screen.queryByText(/has been sent/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Jane Doe");
  });

  it("lets the visitor go back and change the date without losing what they typed", async () => {
    const user = userEvent.setup();
    render(<BookingCalendar />);
    await user.click(todayButton());
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(screen.getByLabelText(/^name/i), "Jane Doe");
    await user.click(screen.getByRole("button", { name: /change date/i }));
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Jane Doe");
  });
});
