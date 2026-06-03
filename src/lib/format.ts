const _audWhole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const _audCents = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a number as AUD. Cents shown only when showCents=true or amount has cents. */
export function formatAUD(amount: number | null | undefined, showCents = false): string {
  if (amount == null) return "POA";
  const hasCents = amount % 1 !== 0;
  return hasCents || showCents ? _audCents.format(amount) : _audWhole.format(amount);
}

/** Compact AUD: $1.2k, $3.4M etc. For stat cards. */
export function formatAUDCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return formatAUD(amount);
}

const _dateFmt = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const _timeFmt = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatDateAU(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return _dateFmt.format(d);
}

export function formatTimeAU(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return _timeFmt.format(d);
}

/** "1 item" / "2 items" */
export function plural(n: number, singular: string, pluralForm?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${pluralForm ?? singular + "s"}`;
}

/** Convert E.164 AU number to display format: +61412345678 → 0412 345 678 */
export function formatPhoneAU(e164: string | null | undefined): string {
  if (!e164) return "";
  if (!e164.startsWith("+61")) return e164;
  const local = "0" + e164.slice(3);
  if (local.startsWith("04")) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return `(${local.slice(0, 2)}) ${local.slice(2, 6)} ${local.slice(6)}`;
}
