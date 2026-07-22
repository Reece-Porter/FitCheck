import { Item } from "./types";

export function parsePrice(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

export function money(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "";
  return (
    "$" +
    n.toLocaleString(undefined, {
      minimumFractionDigits: n % 1 ? 2 : 0,
      maximumFractionDigits: 2
    })
  );
}

export function totalPrice(items: Item[]): number {
  return items.reduce((sum, it) => sum + (it.price || 0), 0);
}

export function hostname(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function safeUrl(u: string | undefined | null): string {
  if (!u) return "";
  try {
    const url = new URL(u, typeof window !== "undefined" ? window.location.href : "https://x.dev");
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    /* not a url */
  }
  return "";
}

export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
