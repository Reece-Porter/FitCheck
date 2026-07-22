import { hostname, safeUrl } from "./format";

export interface Preview {
  image: string | null;
  title: string | null;
  price: string | null;
  site: string;
}

export function isImageUrl(u: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(u || "");
}

/* Reading a product page's HTML from another origin needs CORS, so we route
   through public read-only proxies as a best effort. Displaying the resulting
   <img> never needs CORS. If every proxy fails the user just pastes an image
   URL directly and the rest of the flow still works. */
const PROXIES: ((u: string) => string)[] = [
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
  (u) => "https://corsproxy.io/?url=" + encodeURIComponent(u),
  (u) => "https://thingproxy.freeboard.io/fetch/" + u
];

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

  for (const build of PROXIES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(build(url), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const html = await res.text();
      if (!html || html.length < 30) continue;

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
  return out;
}
