export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a year for display, handling BCE years */
function formatYear(year) {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return String(year);
}

/** Format a date into display string: "Jun 6, 1944", "Jun 1944", "1944", or "500 BCE" */
export function formatDate(year, month, day) {
  if (!year && year !== 0) return "";
  const yearStr = formatYear(year);
  if (month && day) return `${MONTHS[month - 1]} ${day}, ${yearStr}`;
  if (month) return `${MONTHS[month - 1]} ${yearStr}`;
  return yearStr;
}

/** Format an event's start date */
export function formatEventDate(event) {
  return formatDate(event.year, event.month, event.day);
}

/** Format an event's full date range: "Jun 6, 1944 – Aug 15, 1945" or just start date */
export function formatEventDateRange(event) {
  const start = formatEventDate(event);
  if (!event.endYear) return start;
  const end = formatDate(event.endYear, event.endMonth, event.endDay);
  return `${start} \u2013 ${end}`;
}

/** Compare two events by full date (year, month, day). Returns negative if a < b. */
export function compareEventDates(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  const am = a.month || 0;
  const bm = b.month || 0;
  if (am !== bm) return am - bm;
  const ad = a.day || 0;
  const bd = b.day || 0;
  return ad - bd;
}

/** Convert a date to a fractional year for timeline positioning (e.g. June 15, 1944 → ~1944.45) */
export function dateToFractionalYear(year, month, day) {
  if (!year && year !== 0) return null;
  let frac = year;
  if (month) {
    frac += (month - 1) / 12;
    if (day) frac += (day - 1) / 365;
  }
  return frac;
}

/** Get fractional year for event start */
export function eventStartFraction(event) {
  return dateToFractionalYear(event.year, event.month, event.day);
}

/** Get fractional year for event end (returns null if no end date) */
export function eventEndFraction(event) {
  if (!event.endYear) return null;
  return dateToFractionalYear(event.endYear, event.endMonth, event.endDay);
}

/** Max valid days in a given month/year */
export function maxDaysInMonth(month, year) {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}
