/** Display helpers for the school portal. Europe/London throughout. */

export function hours(minutes: number): string {
  if (!minutes) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((pence || 0) / 100);
}

export function time(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" })
    : "";
}

// Built by hand rather than with toLocaleDateString: Node's and the browser's
// ICU data disagree on separators ("Mon 5 Oct" vs "Mon, 5 Oct", "Sep" vs
// "Sept"), and a server-rendered page whose dates change on hydration throws.
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** YYYY-MM-DD of an instant, in London. */
export function londonDateOf(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** "Mon 5 Oct" from a YYYY-MM-DD calendar date. */
export function day(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]} ${d} ${MONTHS[m! - 1]}`;
}

/** "Oct" from a YYYY-MM-DD calendar date. */
export function monthShort(date: string): string {
  return MONTHS[Number(date.slice(5, 7)) - 1]!;
}

/** "5 October 2026" from a YYYY-MM-DD date or an ISO instant. */
export function longDate(value: string): string {
  const date = value.length === 10 ? value : londonDateOf(value);
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS_LONG[m! - 1]} ${y}`;
}

/** "5 Oct" from an ISO instant or a YYYY-MM-DD date. */
export function shortDate(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length !== 10 && !Number.isFinite(Date.parse(value))) return "";
  const date = value.length === 10 ? value : londonDateOf(value);
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m! - 1]}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

export function londonToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function mondayOf(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

export function sortCode(code: string | null | undefined): string {
  return code ? code.replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3") : "";
}
