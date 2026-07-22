# Fitted — Outfit Builder

A small static website for building outfits from online shopping links. Paste
a product link (or an image URL), pull in the photo, and see a whole outfit
laid out together — then save your favourite looks, keep a wishlist, and get
brand & item recommendations based on what you've added.

Everything runs in the browser and is stored in `localStorage`, so there is no
backend and no build step — perfect for static hosting like GitHub Pages.

## Pages

| File | Contents |
| --- | --- |
| `index.html` | **Builder** — add items from shopping links/image URLs and compose an outfit grouped by category. |
| `fits.html` | **My Fits** — your saved outfits; open any to view the full look or load it back into the builder. |
| `wishlist.html` | **Wishlist** — individual pieces saved for later, with a running total. |
| `recommendations.html` | **For You** — brand and clothing recommendations tailored to the brands, categories and styles you've entered. |
| `app.js` | Application logic and the `localStorage` data layer. |
| `brands.js` | Curated brand & item library that powers the recommendations. |
| `style.css` | Shared styling for all pages. |

## How adding items works

- Displaying an image from another site works straight away — just paste the
  product photo's image URL (right-click the image → **Copy image address**).
- For a **product page link**, the app tries to auto-extract the photo, title
  and price using the page's Open Graph tags via public read-only CORS proxies.
  This is best-effort: if a proxy is unavailable or a site blocks it, paste the
  image URL manually and everything else still works.

## Viewing the site

No build step is required — open `index.html` in any web browser, or serve the
folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Notes

All data (outfits, wishlist, added items) lives in your browser's
`localStorage`, so it stays on your device and isn't shared between browsers.
The recommendation library in `brands.js` is a curated starting point, not a
live product feed.
