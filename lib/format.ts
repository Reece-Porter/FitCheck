import { Item } from "./types";

export function parsePrice(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

export function money(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "";
  return (
    "£" +
    n.toLocaleString("en-GB", {
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

/* Like safeUrl but also permits inline data:image URLs, used for photos that
   were dropped, pasted or uploaded (and stored as base64). Never use this for
   links the user will navigate to — only for <img src>. */
export function safeImageSrc(u: string | undefined | null): string {
  if (!u) return "";
  if (/^data:image\//i.test(u)) return u;
  return safeUrl(u);
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
