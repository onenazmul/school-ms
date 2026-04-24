// lib/utils/format.ts

/**
 * Formats a number as BDT currency using South Asian comma notation.
 * e.g. 210000 → "৳2,10,000"
 */
export function formatBDT(amount: number): string {
  const formatted = amount.toLocaleString("en-IN");
  return `৳${formatted}`;
}

/**
 * Formats an ISO date string as "DD MMM YYYY".
 * e.g. "2026-01-15" → "15 Jan 2026"
 */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats an ISO datetime string as "DD MMM YYYY, HH:MM".
 */
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
