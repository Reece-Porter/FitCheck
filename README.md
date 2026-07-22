# Fitted — Outfit Builder & Style Check

An editorial outfit-building app. Pull clothing photos in from any shop by
pasting a link, compose a whole look you can see together, save your fits and
wishlist, get brand & item recommendations, and run an editorial **Style
Check** that scores and critiques any outfit.

Built with **Next.js (App Router) + React + TypeScript**. Everything is stored
in the browser's `localStorage`, so there's no backend — the app is exported as
a fully static site.

## Pages

| Route | What it is |
| --- | --- |
| `/` | **Build** — add items from shopping links/image URLs and compose an outfit grouped by category. |
| `/fits` | **My Fits** — your saved outfits in an editorial grid; open, review, load back into the builder, or delete. |
| `/wishlist` | **Wishlist** — individual pieces saved for later, with a running total. |
| `/for-you` | **For You** — brand and clothing recommendations tuned to the brands, categories and styles you've entered. |
| `/style-check` | **Style Check** — a computed style score (0–100), an editorial critique, and your own star rating + notes. |

## Design

- **Type** — Bodoni Moda (display serif) paired with Inter (body/UI).
- **Palette** — warm off-black ink, ivory/cream paper, a single vermilion
  accent, with gold reserved for star ratings.
- **Layout** — magazine-style asymmetric grids, oversized display headings,
  generous negative space, tasteful hover/transition motion.

The design system lives in `app/globals.css`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Build a static export:

```bash
npm run build    # outputs to ./out
```

### Deploying to GitHub Pages (project site)

A project site is served from a sub-path (e.g. `/Pool-table-rules`), so build
with a base path:

```bash
NEXT_PUBLIC_BASE_PATH=/Pool-table-rules npm run build
```

Then publish the `out/` directory (for example with the included
`.github/workflows/deploy.yml`, after setting **Settings → Pages → Source** to
**GitHub Actions**). For a user/custom-domain site served from the root, omit
`NEXT_PUBLIC_BASE_PATH`.

## How adding items works

- Displaying a photo from another site works straight away — paste the product
  image URL (right-click the photo → **Copy image address**).
- Or add a photo directly: **drop** an image onto the drop zone, **paste** one
  from the clipboard (Ctrl/Cmd+V — including "Copy image" or a screenshot), or
  click to **browse**. Dropped/pasted images are downscaled and stored inline,
  so this works even for shops that block automated fetching.
- For a **product page link**, the app tries to auto-extract the photo, title
  and price from the page's Open Graph tags via public read-only CORS proxies.
  This is best-effort: if a proxy is unavailable or a site blocks it, paste the
  image URL manually and everything else still works.

### Full retailer support (optional proxy)

Big retailers (Urban Outfitters, ASOS, Nike, SSENSE…) run bot protection that
blocks the free public proxies, so their product links can't be auto-fetched.
To make them work, deploy your own tiny fetch proxy — a **free Cloudflare
Worker** — and point the app at it:

1. Sign in at <https://dash.cloudflare.com> → **Workers & Pages → Create → Worker**.
2. Replace the starter code with [`worker/product-proxy.js`](worker/product-proxy.js) and click **Deploy**.
3. Copy the worker URL (e.g. `https://fitted-proxy.you.workers.dev`).
4. In the app: **Build → Advanced · custom fetch proxy**, paste the URL and **Save**.
   (The proxy is stored in your browser; it's also settable at build time via the
   `NEXT_PUBLIC_PRODUCT_PROXY` env var.)

The app will then try your proxy first and fall back to the public ones. Even
with a proxy, the most aggressively protected sites may still block automated
fetching — the manual "copy image address" route always works.

## Notes

All data (outfits, wishlist, added items, reviews) lives in your browser's
`localStorage`, so it stays on your device. Recommendations and the Style Check
run entirely client-side from a curated brand library in `lib/brands.ts` — a
starting point, not a live product feed.
