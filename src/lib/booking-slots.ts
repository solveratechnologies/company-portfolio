/**
 * Time slots for the booking calendar. Shared by the client (what is shown) and the server (what is accepted),
 * so a slot the calendar shows as taken can never be booked by calling the API directly.
 *
 * Slots are 30 minutes long, 10:00 AM – 6:00 PM in the business time zone (Pakistan Standard Time, UTC+5, no DST).
 */

export const SLOT_MINUTES = 30;
const DAY_START_MINUTES = 10 * 60;
const DAY_END_MINUTES = 18 * 60;

/** Business time zone: fixed UTC+5 offset (Pakistan has no daylight saving time). */
const TZ_OFFSET_MINUTES = 5 * 60;
export const BOOKING_TZ_LABEL = "PKT";
export const BOOKING_TZ_NAME = "Pakistan Standard Time (PKT, UTC+5)";

/**
 * Share of slots shown as already taken. There is no calendar or database behind the form yet, so the taken
 * slots are a fixed, repeatable pattern per date (not live availability). Replace `takenSlots` with a real
 * lookup (Google Calendar, a database...) to make this live.
 */
const TAKEN_PERCENT = 30;
/** Every day keeps at least this many free slots. */
const MIN_FREE_SLOTS = 4;

const pad = (n: number) => String(n).padStart(2, "0");

/** `["10:00", "10:30", ... "17:30"]` — the start time of every bookable slot. */
export const BOOKING_SLOTS: readonly string[] = Array.from({ length: (DAY_END_MINUTES - DAY_START_MINUTES) / SLOT_MINUTES }, (_, i) => {
  const minutes = DAY_START_MINUTES + i * SLOT_MINUTES;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
});

export function isValidSlot(time: string): boolean {
  return BOOKING_SLOTS.includes(time);
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** `"14:30"` → `"2:30 PM"`. */
export function formatSlotTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

/** `"14:30"` → `"2:30 PM – 3:00 PM"`. */
export function formatSlotRange(time: string): string {
  return `${formatSlotTime(time)} – ${formatSlotTime(fromMinutes(toMinutes(time) + SLOT_MINUTES))}`;
}

/** FNV-1a: small, fast, and identical on the server and in the browser. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const takenCache = new Map<string, ReadonlySet<string>>();

/** The slots on `date` (`YYYY-MM-DD`) that are already taken. */
export function takenSlots(date: string): ReadonlySet<string> {
  const cached = takenCache.get(date);
  if (cached) return cached;
  const taken = new Set(BOOKING_SLOTS.filter((t) => hash(`${date}|${t}`) % 100 < TAKEN_PERCENT));
  // Never let a day look fully booked: free the earliest taken slots until enough are open.
  for (const t of BOOKING_SLOTS) {
    if (BOOKING_SLOTS.length - taken.size >= MIN_FREE_SLOTS) break;
    taken.delete(t);
  }
  if (takenCache.size > 400) takenCache.clear();
  takenCache.set(date, taken);
  return taken;
}

export function isSlotTaken(date: string, time: string): boolean {
  return takenSlots(date).has(time);
}

/** The UTC instant (ms) at which the slot `time` on the business-zone date `date` starts; null if either is invalid. */
export function slotStartMs(date: string, time: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || !isValidSlot(time)) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return Date.UTC(y, m - 1, d, 0, toMinutes(time) - TZ_OFFSET_MINUTES);
}

/** True when the slot has already started in the business time zone. */
export function isSlotPast(date: string, time: string, now: Date = new Date()): boolean {
  const start = slotStartMs(date, time);
  return start !== null && start <= now.getTime();
}

// --- The visitor's own time zone -------------------------------------------------------------------------------
// Slots are fixed instants (10:00 AM – 6:00 PM PKT). The calendar shows them in the visitor's time zone, and the
// booking is still sent to the server as the PKT date + time, so availability is the same for everyone.

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { ...options, timeZone });
    formatterCache.set(key, f);
  }
  return f;
}

/** Newer ICU versions use a narrow no-break space before AM/PM; normalise it to a normal space. */
const plain = (s: string) => s.replace(/\s/g, " ");

/** The calendar date (`YYYY-MM-DD`) of an instant in `timeZone`. */
export function localDateKey(ms: number, timeZone: string): string {
  const parts = formatter(timeZone, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(ms);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** `"3:00 PM"` in `timeZone`. */
export function formatLocalTime(ms: number, timeZone: string): string {
  return plain(formatter(timeZone, { hour: "numeric", minute: "2-digit" }).format(ms));
}

/** `"3:00 PM – 3:30 PM"` in `timeZone`. */
export function formatLocalRange(ms: number, timeZone: string): string {
  return `${formatLocalTime(ms, timeZone)} – ${formatLocalTime(ms + SLOT_MINUTES * 60_000, timeZone)}`;
}

/** `"Friday, November 13, 2026"` in `timeZone`. */
export function formatLocalDate(ms: number, timeZone: string): string {
  return formatter(timeZone, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(ms);
}

/** Short offset label such as `"GMT+5"` or `"PST"` for `timeZone` at that instant. */
export function timeZoneShortName(ms: number, timeZone: string): string {
  return formatter(timeZone, { timeZoneName: "short" }).formatToParts(ms).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

export type VisitorSlot = {
  /** Business-zone (PKT) date + time: this is what is sent to the server. */
  date: string;
  time: string;
  startMs: number;
  taken: boolean;
};

const shiftIso = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * The slots that start on the visitor's calendar day `localDate`, in the visitor's `timeZone`, earliest first.
 * Slots that have already started are left out. Because the business day (PKT) and the visitor's day can differ,
 * a visitor's day may include slots from the neighbouring PKT days.
 */
export function visitorSlotsForLocalDate(localDate: string, timeZone: string, now: Date = new Date()): VisitorSlot[] {
  const result: VisitorSlot[] = [];
  for (const date of [shiftIso(localDate, -1), localDate, shiftIso(localDate, 1)]) {
    for (const time of BOOKING_SLOTS) {
      const startMs = slotStartMs(date, time);
      if (startMs === null || startMs <= now.getTime()) continue;
      if (localDateKey(startMs, timeZone) !== localDate) continue;
      result.push({ date, time, startMs, taken: isSlotTaken(date, time) });
    }
  }
  return result.sort((a, b) => a.startMs - b.startMs);
}

/** The slots a visitor can still pick on `date`: not in the past (each flagged as taken or free). */
export function slotsForDate(date: string, now: Date = new Date()): { time: string; taken: boolean }[] {
  return BOOKING_SLOTS.filter((t) => !isSlotPast(date, t, now)).map((time) => ({ time, taken: isSlotTaken(date, time) }));
}
