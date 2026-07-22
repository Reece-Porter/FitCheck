import { hostname, safeUrl } from "./format";

export interface Preview {
  image: string | null;
  title: string | null;
  price: string | null;
  site: string;
  /** True when the page was reached but looked like a bot-block / challenge. */
  blocked?: boolean;
}

export function isImageUrl(u: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(u || "");
}

/** localStorage key holding an optional user-supplied fetch proxy base URL. */
export const PROXY_KEY = "fitted:proxy";

export function getCustomProxy(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(PROXY_KEY) || "").trim();
}

export function setCustomProxy(url: string): void {
  if (typeof window === "undefined") return;
  const v = (url || "").trim();
  if (v) window.localStorage.setItem(PROXY_KEY, v);
  else window.localStorage.removeItem(PROXY_KEY);
}

/* A proxy is a function that turns a target URL into a fetchable URL. We try
   the user's own proxy first (a Cloudflare Worker they deploy — see
   worker/product-proxy.js), then a build-time env proxy, then free public
   proxies as a best-effort. Reading a page's HTML from another origin needs
   CORS, which is why a proxy is involved at all; displaying the resulting
   <img> never does. */
function buildProxy(base: string): (u: string) => string {
  const b = base.trim();
  if (b.includes("{url}")) return (u) => b.replace("{url}", encodeURIComponent(u));
  return (u) => b + (b.includes("?") ? "&" : "?") + "url=" + encodeURIComponent(u);
}

function proxies(): ((u: string) => string)[] {
  const list: ((u: string) => string)[] = [];
  const custom = getCustomProxy();
  if (/^https?:\/\//i.test(custom)) list.push(buildProxy(custom));
  const env = process.env.NEXT_PUBLIC_PRODUCT_PROXY;
  if (env && /^https?:\/\//i.test(env)) list.push(buildProxy(env));
  // Public best-effort fallbacks.
  list.push((u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u));
  list.push((u) => "https://corsproxy.io/?url=" + encodeURIComponent(u));
  list.push((u) => "https://thingproxy.freeboard.io/fetch/" + u);
  return list;
}

/** Heuristic: does this HTML look like an anti-bot challenge rather than a product page? */
function looksBlocked(html: string): boolean {
  const head = html.slice(0, 4000).toLowerCase();
  return (
    head.includes("just a moment") ||
    head.includes("attention required") ||
    head.includes("access denied") ||
    head.includes("/cdn-cgi/challenge") ||
    head.includes("px-captcha") ||
    head.includes("please enable javascript and cookies") ||
    head.includes("request unsuccessful. incapsula")
  );
}

function metaFrom(doc: Document, keys: string[]): string | null {
  for (const k of keys) {
    const node = doc.querySelector(
      `meta[property="${k}"], meta[name="${k}"], meta[itemprop="${k}"]`
    ) as HTMLMetaElement | null;
    if (node && node.content) return node.content.trim();
  }
  return null;
}

export async function fetchPreview(rawUrl: string): Promise<Preview> {
  const url = safeUrl(rawUrl);
  const out: Preview = { image: null, title: null, price: null, site: hostname(url) };
  if (!url) return out;
  if (isImageUrl(url)) {
    out.image = url;
    return out;
  }

  let sawBlock = false;

  for (const build of proxies()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(build(url), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const html = await res.text();
      if (!html || html.length < 30) continue;
      if (looksBlocked(html)) {
        sawBlock = true;
        continue;
      }

      const doc = new DOMParser().parseFromString(html, "text/html");

      let img = metaFrom(doc, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src", "image"]);
      if (img) {
        try {
          img = safeUrl(new URL(img, url).href);
        } catch {
          /* leave as-is */
        }
      }

      const title =
        metaFrom(doc, ["og:title", "twitter:title"]) ||
        (doc.querySelector("title")?.textContent?.trim() ?? null);

      const price = metaFrom(doc, ["product:price:amount", "og:price:amount", "price", "twitter:data1"]);

      out.image = img || out.image;
      out.title = title || out.title;
      out.price = price || out.price;
      out.site = metaFrom(doc, ["og:site_name"]) || out.site;

      if (out.image) return out;
    } catch {
      /* try next proxy */
    }
  }

  out.blocked = sawBlock;
  return out;
}
