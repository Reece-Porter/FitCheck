/* Date helpers for the Trip Planner. Everything works on local "YYYY-MM-DD"
   strings and parses them into local dates (never via Date.parse of the bare
   string, which would treat them as UTC and shift the day across timezones). */

export function parseDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayKey(): string {
  return toKey(new Date());
}

/** Every date from start to end inclusive (capped to a sane length). */
export function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  const s = parseDay(start);
  const e = parseDay(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return out;
  const cur = new Date(s);
  let guard = 0;
  while (cur <= e && guard < 400) {
    out.push(toKey(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return out;
}

export function tripLength(start: string, end: string): number {
  return eachDay(start, end).length;
}

/** "Mon 24 Aug" */
export function fmtDayLabel(date: string): string {
  const d = parseDay(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function weekday(date: string): string {
  const d = parseDay(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { weekday: "long" });
}

export function dayOfMonth(date: string): string {
  const d = parseDay(date);
  return isNaN(d.getTime()) ? "" : String(d.getDate());
}

export function monthShort(date: string): string {
  const d = parseDay(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { month: "short" });
}

/** "24 Aug – 7 Sep 2025" (drops the repeated year/month where sensible). */
export function fmtRange(start: string, end: string): string {
  const s = parseDay(start);
  const e = parseDay(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const sPart = s.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameYear ? undefined : "numeric"
  });
  const ePart = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${sPart} – ${ePart}`;
}
