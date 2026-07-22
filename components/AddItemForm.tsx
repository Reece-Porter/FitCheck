"use client";

import { useState, useRef, useEffect } from "react";
import { useBuilder, uid } from "@/lib/store";
import { fetchPreview, isImageUrl, getCustomProxy, setCustomProxy, Preview } from "@/lib/preview";
import { guessCategory } from "@/lib/categories";
import { parsePrice, safeUrl, hostname } from "@/lib/format";
import { Category } from "@/lib/types";
import { toast } from "@/components/Toast";

export default function AddItemForm() {
  const { add } = useBuilder();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; kind?: "err" | "ok" }>({ text: "" });
  const [showHelp, setShowHelp] = useState(false);
  const [proxy, setProxy] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = getCustomProxy();
    if (saved) setProxy(saved);
  }, []);

  async function runFetch() {
    const u = url.trim();
    if (!u) return setStatus({ text: "Paste a shopping link or image URL first.", kind: "err" });
    if (!safeUrl(u)) return setStatus({ text: "That doesn't look like a valid URL.", kind: "err" });

    setLoading(true);
    setShowHelp(false);
    setStatus({ text: "Fetching preview…" });
    const p = await fetchPreview(u);
    setLoading(false);

    if (p.image) {
      setPendingImage(p.image);
      setPreview(p);
      if (!name && p.title) setName(p.title.slice(0, 80));
      if (!price && p.price) setPrice(String(parsePrice(p.price) ?? ""));
      if (!cat) setCat(guessCategory((p.title || "") + " " + u));
      setStatus({ text: "Preview loaded — tidy up the details and add it.", kind: "ok" });
    } else if (isImageUrl(u)) {
      setPendingImage(u);
      setPreview({ image: u, title: null, price: null, site: hostname(u) });
      setStatus({ text: "Using the pasted image URL.", kind: "ok" });
    } else {
      setPendingImage(null);
      setShowHelp(true);
      setStatus({
        text: p.blocked
          ? `${hostname(u) || "This shop"} blocks automated photo fetching. Here's the quick way around it:`
          : "Couldn't auto-load a photo from that link. Here's the quick way to add it:",
        kind: "err"
      });
    }
  }

  function saveProxy() {
    setCustomProxy(proxy);
    toast(proxy.trim() ? "Custom proxy saved" : "Custom proxy cleared");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = url.trim();
    const image = pendingImage || (isImageUrl(u) ? u : "");
    const finalName = name.trim();
    if (!image && !finalName) {
      return setStatus({ text: "Add at least an image (fetch a link) or a name.", kind: "err" });
    }
    add({
      id: uid(),
      name: finalName || "Untitled piece",
      brand: brand.trim(),
      category: (cat || guessCategory(finalName + " " + u)) as Category,
      price: parsePrice(price),
      image: safeUrl(image),
      url: safeUrl(u),
      at: Date.now()
    });
    setUrl("");
    setName("");
    setBrand("");
    setPrice("");
    setCat("");
    setPreview(null);
    setPendingImage(null);
    setShowHelp(false);
    setStatus({ text: "" });
    urlRef.current?.focus();
    toast("Added to your outfit");
  }

  return (
    <aside className="compose">
      <h3>Add a piece</h3>
      <p className="sub">Paste a link — we&rsquo;ll pull in the photo automatically.</p>
      <form onSubmit={onSubmit} autoComplete="off">
        <div className="field">
          <label htmlFor="f-url">Shopping link or image URL</label>
          <div className="url-row">
            <input
              id="f-url"
              ref={urlRef}
              className="input"
              type="url"
              placeholder="https://store.com/product…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runFetch();
                }
              }}
            />
            <button type="button" className="btn sm" onClick={runFetch} disabled={loading}>
              {loading ? <span className="spinner" /> : "Fetch"}
            </button>
          </div>
          <p className="hint">Works on most shops. Big retailers that block bots (Urban Outfitters, ASOS…) need the image trick below.</p>
        </div>

        {showHelp && (
          <div className="fetch-help">
            <strong>Add it from the photo instead — works on any shop:</strong>
            <ol>
              <li>Right-click the product photo → <em>“Copy image address”</em>.</li>
              <li>Paste it in the box above and press <em>Fetch</em> (or just click away).</li>
              <li>Fill in the name, brand &amp; price, then <em>Add to outfit</em>.</li>
            </ol>
            <p>
              Want big shops to just work?{" "}
              <button type="button" className="linkish" onClick={() => setAdvOpen(true)}>
                Set up a fetch proxy
              </button>{" "}
              (one-time, see the README).
            </p>
          </div>
        )}

        {preview?.image && (
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.image} alt="preview" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")} />
            <div className="pmeta">
              <strong>{preview.title || "Image found"}</strong>
              {preview.site ? <span>{preview.site}</span> : null}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="f-name">Item name</label>
          <input id="f-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Oversized cotton tee" />
        </div>

        <div className="field-2">
          <div className="field">
            <label htmlFor="f-brand">Brand</label>
            <input id="f-brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="COS" />
          </div>
          <div className="field">
            <label htmlFor="f-price">Price</label>
            <input id="f-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="45" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="f-cat">Category</label>
          <select id="f-cat" className="select" value={cat} onChange={(e) => setCat(e.target.value as Category | "")}>
            <option value="">Auto-detect</option>
            <option value="headwear">Headwear</option>
            <option value="outerwear">Outerwear</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="footwear">Footwear</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>

        {status.text ? <p className={"status" + (status.kind ? " " + status.kind : "")}>{status.text}</p> : <p className="status" />}

        <button type="submit" className="btn accent block">
          Add to outfit
        </button>

        <details className="advanced" open={advOpen}>
          <summary>Advanced · custom fetch proxy</summary>
          <p className="hint">
            Paste your own proxy URL (e.g. a Cloudflare Worker — see the README) to fetch photos from shops that
            block the public proxies. It should accept <code>?url=</code>. Leave blank to use the defaults.
          </p>
          <div className="url-row">
            <input
              className="input"
              type="url"
              placeholder="https://your-proxy.workers.dev"
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
            />
            <button type="button" className="btn sm ghost" onClick={saveProxy}>
              Save
            </button>
          </div>
        </details>
      </form>
    </aside>
  );
}
