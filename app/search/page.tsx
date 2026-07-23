"use client";

import { useMemo, useState } from "react";
import PageHead from "@/components/PageHead";
import { searchCatalog, shoppingSearchUrl, findAtBrandUrl } from "@/lib/search";
import { CAT_LABEL } from "@/lib/categories";
import { CAT_ICON } from "@/components/icons";
import SmartImage from "@/components/SmartImage";
import { pieceImage } from "@/lib/pieceImage";
import { cap, safeUrl } from "@/lib/format";

const EXAMPLES = [
  "black wool coat",
  "white leather trainers",
  "oversized hoodie",
  "linen shirt",
  "smart trousers",
  "streetwear cap"
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const result = useMemo(() => searchCatalog(q), [q]);
  const hasQuery = q.trim().length > 0;
  const nothing = hasQuery && result.items.length === 0 && result.brands.length === 0;

  return (
    <div className="wrap">
      <PageHead
        index="№ 07 — The Search"
        title={
          <>
            <span className="serif-italic">Search</span>
          </>
        }
        lede="Describe anything you're after — “black wool coat”, “white leather trainers”, “smart linen shirt” — and get pieces, brands and shops to find it."
      />

      <div className="search-bar">
        <span className="search-ico" aria-hidden="true">⌕</span>
        <input
          className="search-input"
          type="search"
          autoFocus
          placeholder="Describe a piece of clothing…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {hasQuery && (
          <button className="search-clear" onClick={() => setQ("")} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      {!hasQuery ? (
        <div className="search-hint">
          <span className="kicker">Try</span>
          <div className="ex-chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="ex-chip" onClick={() => setQ(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="search-read">
            <span>
              Showing results for <strong>“{result.query}”</strong>
            </span>
            {(result.category || result.styles.length > 0) && (
              <span className="read-tags">
                {result.category && <span className="chip">{CAT_LABEL[result.category]}</span>}
                {result.styles.slice(0, 3).map((s) => (
                  <span className="chip" key={s}>
                    {cap(s)}
                  </span>
                ))}
              </span>
            )}
          </div>

          {result.items.length > 0 && (
            <section className="rec-section">
              <div className="head">
                <span className="idx">i.</span>
                <h2>Recommended pieces</h2>
              </div>
              <div className="sugg-grid">
                {result.items.map((item) => (
                  <article className="sugg fade-up" key={item.name + item.brand}>
                    <div className="frame">
                      <SmartImage src={pieceImage(item.name, item.category)} alt={item.name} width={440} fallback={<div className="noimg">{CAT_ICON[item.category]}</div>} />
                    </div>
                    <div className="info">
                      <div className="brand">{item.brand}</div>
                      <div className="name">{item.name}</div>
                      <div className="tags">
                        <span className="chip">{CAT_LABEL[item.category]}</span>
                        <span className="chip">{item.price}</span>
                      </div>
                      <a className="shop-link" style={{ marginTop: "0.6rem", display: "inline-block" }} href={findAtBrandUrl(item.brand, item.name)} target="_blank" rel="noopener noreferrer">
                        Find it ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {result.brands.length > 0 && (
            <section className="rec-section">
              <div className="head">
                <span className="idx">ii.</span>
                <h2>Brands to try</h2>
              </div>
              <div className="brand-grid">
                {result.brands.map((brand) => {
                  const initial = (brand.name.match(/[A-Za-z]/)?.[0] || "F").toUpperCase();
                  return (
                    <article className="brand-card fade-up" key={brand.name}>
                      <div className="top">
                        <div>
                          <h3>{brand.name}</h3>
                          <div className="cats">{brand.categories.map((c) => CAT_LABEL[c]).join(" · ")}</div>
                        </div>
                        <div className="mono">{initial}</div>
                      </div>
                      <p className="desc">{brand.desc}</p>
                      <div className="foot">
                        <span className="chip">{brand.price}</span>
                        <a className="shop-link" href={safeUrl(brand.url)} target="_blank" rel="noopener noreferrer">
                          Shop ↗
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rec-section shops-out">
            <div className="head">
              <span className="idx">{nothing ? "i." : "iii."}</span>
              <h2>Search the shops</h2>
            </div>
            <p className="lead">
              {nothing
                ? "No direct matches in our library — but you can search the shops for it directly:"
                : "Take your search straight to the shelves, then paste anything you like into the Builder."}
            </p>
            <a className="btn accent" href={shoppingSearchUrl(result.query)} target="_blank" rel="noopener noreferrer">
              Search Google Shopping for “{result.query}” ↗
            </a>
          </section>
        </>
      )}
    </div>
  );
}
