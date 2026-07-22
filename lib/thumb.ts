/* Turn a full-size remote image URL into a small, resized preview by routing it
   through wsrv.nl — a free image CDN that fetches server-side (so it also fixes
   many hotlink-blocked shop images) and returns a compact webp. Local data:
   images are already downscaled, so they're returned untouched. */
export function thumbUrl(url: string, width = 600): string {
  if (!url || /^data:/i.test(url)) return url;
  if (!/^https?:\/\//i.test(url)) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=82&we`;
}
