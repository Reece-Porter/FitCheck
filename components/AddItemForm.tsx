"use client";

import { useState, useRef, useEffect } from "react";
import { useBuilder, uid } from "@/lib/store";
import { fetchPreview, isImageUrl, getCustomProxy, setCustomProxy, Preview } from "@/lib/preview";
import { guessCategory } from "@/lib/categories";
import { parsePrice, safeUrl, safeImageSrc, hostname } from "@/lib/format";
import { readImageFile } from "@/lib/image";
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
  const [dragging, setDragging] = useState(false);
  const [proxy, setProxy] = useState("");
  const [advOpen, setAdvOpen] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = getCustomProxy();
    if (saved) setProxy(saved);
  }, []);

  /* ---- shared helpers for drop / paste / browse ---- */
  function useImageSrc(src: string, label: string) {
    const safe = safeImageSrc(src);
    if (!safe) {
      setStatus({ text: "That didn't look like a usable image.", kind: "err" });
      return;
    }
    setPendingImage(safe);
    setPreview({ image: safe, title: null, price: null, site: label });
    setShowHelp(false);
    setStatus({ text: "Image added — fill in the name, brand & price, then add it.", kind: "ok" });
  }

  async function useImageFile(file: File) {
    setStatus({ text: "Processing image…" });
    try {
      const data = await readImageFile(file);
      setPendingImage(data);
      setPreview({ image: data, title: null, price: null, site: "your image" });
      setShowHelp(false);
      setStatus({ text: "Image added — fill in the name, brand & price, then add it.", kind: "ok" });
    } catch {
      setStatus({ text: "Couldn't read that image. Try a JPG, PNG or WEBP.", kind: "err" });
    }
  }

  // Paste anywhere on the page while building: grab an image off the clipboard.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            useImageFile(file);
            return;
          }
        }
      }
      // otherwise let a pasted URL land in the link box as normal
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dt = e.dataTransfer;
    const file = Array.from(dt.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      useImageFile(file);
      return;
    }
    // Dragged straight from another browser tab → an image URL / <img> markup.
    const html = dt.getData("text/html");
    const uri = dt.getData("text/uri-list") || dt.getData("text/plain");
    let src = "";
    if (html) {
      const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) src = m[1];
    }
    if (!src && uri) src = uri.trim();
    if (src) useImageSrc(src, hostname(src) || "dragged image");
    else setStatus({ text: "Couldn't find an image in what you dropped.", kind: "err" });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) useImageFile(file);
    e.target.value = "";
  }

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
          ? `${hostname(u) || "This shop"} blocks automated photo fetching. Add the photo directly instead:`
          : "Couldn't auto-load a photo from that link. Add the photo directly instead:",
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
      return setStatus({ text: "Add a photo (fetch, drop or paste one) or at least a name.", kind: "err" });
    }
    add({
      id: uid(),
      name: finalName || "Untitled piece",
      brand: brand.trim(),
      category: (cat || guessCategory(finalName + " " + u)) as Category,
      price: parsePrice(price),
      image: safeImageSrc(image),
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
      <p className="sub">Two ways in — paste a link, or add the photo itself.</p>
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
          <p className="hint works-with">
            <strong>Works well with</strong> Uniqlo · COS · Arket · Levi&rsquo;s · Nike · Zara · Ralph Lauren — and most shops.
          </p>
        </div>

        <div className="or-div">
          <span>or add the photo directly</span>
        </div>

        {/* Drop / paste / browse an image directly — an equal first-class path */}
        <div
          className={"dropzone" + (dragging ? " drag" : "")}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragging) setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
        >
          <span className="dz-ico">⬍</span>
          <span>
            <strong>Drop</strong> or <strong>paste</strong> an image here, or <u>browse</u>
          </span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        </div>

        {showHelp && (
          <div className="fetch-help">
            <strong>Add it from the photo — works on any shop:</strong>
            <ol>
              <li>Right-click the product photo → <em>“Copy image”</em>, then <em>paste</em> it into the box above.</li>
              <li>Or drag the photo straight from the shop into the drop area.</li>
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
              <strong>{preview.title || "Image ready"}</strong>
              {preview.site ? <span>{preview.site}</span> : null}
              <button
                type="button"
                className="linkish"
                style={{ display: "block", marginTop: "0.25rem", fontSize: "0.78rem" }}
                onClick={() => {
                  setPreview(null);
                  setPendingImage(null);
                }}
              >
                Remove image
              </button>
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
