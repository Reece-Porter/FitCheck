/**
 * Fitted — product-page fetch proxy (Cloudflare Worker)
 * ----------------------------------------------------
 * A tiny, free proxy that lets Fitted read product pages from shops that block
 * the public CORS proxies (Urban Outfitters, ASOS, Nike, SSENSE, …). It fetches
 * the target page with browser-like headers and returns it with permissive CORS
 * so the app can parse the Open Graph photo/title/price.
 *
 * Deploy (no CLI needed):
 *   1. Sign in at https://dash.cloudflare.com  →  Workers & Pages  →  Create  →  Worker.
 *   2. Replace the starter code with this file, click "Deploy".
 *   3. Copy the worker URL (looks like https://fitted-proxy.<you>.workers.dev).
 *   4. In Fitted → Build → "Advanced · custom fetch proxy", paste that URL and Save.
 *
 * Usage:  GET https://your-worker.workers.dev/?url=<encoded product URL>
 *
 * Note: this only reads publicly available pages. Keep it for personal use.
 */

const ALLOWED_METHODS = "GET, OPTIONS";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": ALLOWED_METHODS,
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400"
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Upgrade-Insecure-Requests": "1"
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: CORS });
    }

    const target = new URL(request.url).searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url= parameter", { status: 400, headers: CORS });
    }

    let dest;
    try {
      dest = new URL(target);
    } catch {
      return new Response("Invalid url", { status: 400, headers: CORS });
    }
    if (dest.protocol !== "http:" && dest.protocol !== "https:") {
      return new Response("Only http(s) URLs are allowed", { status: 400, headers: CORS });
    }

    try {
      const upstream = await fetch(dest.toString(), {
        headers: BROWSER_HEADERS,
        redirect: "follow",
        cf: { cacheTtl: 300, cacheEverything: true }
      });

      const contentType = upstream.headers.get("content-type") || "text/html; charset=utf-8";
      const body = await upstream.arrayBuffer();

      return new Response(body, {
        status: upstream.status,
        headers: { ...CORS, "content-type": contentType, "cache-control": "public, max-age=300" }
      });
    } catch (err) {
      return new Response("Upstream fetch failed: " + (err && err.message), { status: 502, headers: CORS });
    }
  }
};
