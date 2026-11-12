import { describe, expect, it } from "vitest";
import {
  BOOKING_SLOTS,
  formatSlotRange,
  formatSlotTime,
  isSlotPast,
  isSlotTaken,
  isValidSlot,
  formatLocalDate,
  formatLocalRange,
  formatLocalTime,
  isValidTimeZone,
  localDateKey,
  slotStartMs,
  slotsForDate,
  takenSlots,
  timeZoneShortName,
  visitorSlotsForLocalDate,
} from "@/lib/booking-slots";

describe("booking slots", () => {
  it("offers 30-minute slots from 10:00 AM to the last start at 5:30 PM", () => {
    expect(BOOKING_SLOTS).toHaveLength(16);
    expect(BOOKING_SLOTS[0]).toBe("10:00");
    expect(BOOKING_SLOTS[1]).toBe("10:30");
    expect(BOOKING_SLOTS.at(-1)).toBe("17:30");
    expect(isValidSlot("17:30")).toBe(true);
    expect(isValidSlot("18:00")).toBe(false);
    expect(isValidSlot("10:15")).toBe(false);
  });

  it("formats slots for people", () => {
    expect(formatSlotTime("10:00")).toBe("10:00 AM");
    expect(formatSlotTime("12:30")).toBe("12:30 PM");
    expect(formatSlotTime("17:30")).toBe("5:30 PM");
    expect(formatSlotRange("11:30")).toBe("11:30 AM – 12:00 PM");
    expect(formatSlotRange("17:30")).toBe("5:30 PM – 6:00 PM");
  });

  it("shows the same taken slots every time for a date, and always leaves some free", () => {
    let takenSomewhere = false;
    for (let i = 0; i < 120; i++) {
      const date = new Date(Date.UTC(2026, 10, 12 + i)).toISOString().slice(0, 10);
      const first = [...takenSlots(date)].join();
      expect([...takenSlots(date)].join()).toBe(first);
      expect(BOOKING_SLOTS.length - takenSlots(date).size).toBeGreaterThanOrEqual(4);
      if (takenSlots(date).size > 0) takenSomewhere = true;
      for (const t of takenSlots(date)) expect(isSlotTaken(date, t)).toBe(true);
    }
    expect(takenSomewhere).toBe(true);
  });

  it("knows when a slot has already started in Pakistan time (UTC+5)", () => {
    // 10:00 PKT on 2026-11-12 is 05:00 UTC.
    expect(isSlotPast("2026-11-12", "10:00", new Date("2026-11-12T04:59:59Z"))).toBe(false);
    expect(isSlotPast("2026-11-12", "10:00", new Date("2026-11-12T05:00:00Z"))).toBe(true);
    expect(isSlotPast("2026-11-13", "10:00", new Date("2026-11-12T12:00:00Z"))).toBe(false);
  });

  it("converts a slot into the visitor's own time zone", () => {
    const ten = slotStartMs("2026-11-14", "10:00")!; // 05:00 UTC
    expect(new Date(ten).toISOString()).toBe("2026-11-14T05:00:00.000Z");
    expect(formatLocalTime(ten, "Asia/Karachi")).toBe("10:00 AM");
    expect(formatLocalTime(ten, "Asia/Tokyo")).toBe("2:00 PM");
    expect(formatLocalTime(ten, "America/Los_Angeles")).toBe("9:00 PM"); // the evening before
    expect(localDateKey(ten, "America/Los_Angeles")).toBe("2026-11-13");
    expect(formatLocalRange(ten, "Asia/Tokyo")).toBe("2:00 PM – 2:30 PM");
    expect(formatLocalDate(ten, "America/Los_Angeles")).toBe("Friday, November 13, 2026");
    expect(timeZoneShortName(ten, "Asia/Tokyo")).toBe("GMT+9");
    expect(isValidTimeZone("Asia/Tokyo")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });

  it("lists, for the visitor's own calendar day, the slots that fall on it (earliest first)", () => {
    const now = new Date("2026-11-01T00:00:00Z");

    const karachi = visitorSlotsForLocalDate("2026-11-14", "Asia/Karachi", now);
    expect(karachi).toHaveLength(16);
    expect(karachi[0]).toMatchObject({ date: "2026-11-14", time: "10:00" });

    const tokyo = visitorSlotsForLocalDate("2026-11-14", "Asia/Tokyo", now);
    expect(tokyo).toHaveLength(16);
    expect(formatLocalTime(tokyo[0].startMs, "Asia/Tokyo")).toBe("2:00 PM");

    // Los Angeles is 13 hours behind: its Saturday runs from 13:00 PKT Saturday to 12:30 PKT Sunday.
    const la = visitorSlotsForLocalDate("2026-11-14", "America/Los_Angeles", now);
    expect(la).toHaveLength(16);
    expect(la[0]).toMatchObject({ date: "2026-11-14", time: "13:00" });
    expect(la.at(-1)).toMatchObject({ date: "2026-11-15", time: "12:30" });
    expect(la.map((s) => s.startMs)).toEqual([...la.map((s) => s.startMs)].sort((a, b) => a - b));
    for (const s of la) expect(s.taken).toBe(isSlotTaken(s.date, s.time));
  });

  it("leaves out slots that have already started", () => {
    const now = new Date("2026-11-14T08:10:00Z"); // 1:10 PM PKT
    const slots = visitorSlotsForLocalDate("2026-11-14", "Asia/Karachi", now);
    expect(slots[0]).toMatchObject({ date: "2026-11-14", time: "13:30" });
  });

  it("hides slots that have already started today and keeps the rest", () => {
    const now = new Date("2026-11-12T08:10:00Z"); // 1:10 PM PKT
    const times = slotsForDate("2026-11-12", now).map((s) => s.time);
    expect(times[0]).toBe("13:30");
    expect(times).not.toContain("13:00");
    expect(slotsForDate("2026-11-13", now)).toHaveLength(16);
    expect(slotsForDate("2026-11-12", new Date("2026-11-12T13:00:00Z"))).toHaveLength(0);
  });
});
