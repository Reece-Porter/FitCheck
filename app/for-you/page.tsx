"use client";

import { useMemo } from "react";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import { useCatalog, useWishlist, useFits, useBuilder } from "@/lib/store";
import { BRAND_CATALOG, ITEM_SUGGESTIONS, Brand, Suggestion } from "@/lib/brands";
import { CATEGORIES, CAT_LABEL } from "@/lib/categories";
import { CAT_ICON } from "@/components/icons";
import SmartImage from "@/components/SmartImage";
import { pieceImage } from "@/lib/pieceImage";
import { safeUrl, cap } from "@/lib/format";
import { Category } from "@/lib/types";

export default function ForYouPage() {
  const catalog = useCatalog();
  const { items: wishlist } = useWishlist();
  const { fits } = useFits();
  const { items: builder } = useBuilder();

  const model = useMemo(() => {
    const fitItems = fits.flatMap((f) => f.items);
    const all = [
      ...catalog.map((c) => ({ brand: c.brand, category: c.category })),
      ...wishlist.map((w) => ({ brand: w.brand, category: w.category as string })),
      ...fitItems.map((i) => ({ brand: i.brand, category: i.category as string })),
      ...builder.map((i) => ({ brand: i.brand, category: i.category as string }))
    ];

    const brandCount: Record<string, number> = {};
    const catCount: Record<string, number> = {};
    all.forEach((it) => {
      if (it.brand) brandCount[it.brand.trim().toLowerCase()] = (brandCount[it.brand.trim().toLowerCase()] || 0) + 1;
      if (it.category) catCount[it.category] = (catCount[it.category] || 0) + 1;
    });

    const styleScore: Record<string, number> = {};
    BRAND_CATALOG.forEach((b) => {
      const w = brandCount[b.name.toLowerCase()];
      if (w) b.styles.forEach((s) => (styleScore[s] = (styleScore[s] || 0) + w));
    });

    const usedBrands = Object.keys(brandCount);
    const hasSignal = usedBrands.length > 0 || Object.keys(styleScore).length > 0;
    const missingCats = CATEGORIES.map((c) => c.id).filter((id) => !catCount[id]);

    const match = (styles: string[]) => styles.reduce((n, s) => n + (styleScore[s] || 0), 0);

    // --- brands ---
    let brandRecs: { brand: Brand; score: number }[];
    if (hasSignal) {
      brandRecs = BRAND_CATALOG.filter((b) => !brandCount[b.name.toLowerCase()])
        .map((b) => ({ brand: b, score: match(b.styles) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      if (brandRecs.length < 6) {
        const have = new Set(brandRecs.map((x) => x.brand.name));
        BRAND_CATALOG.forEach((b) => {
          if (brandRecs.length < 6 && !have.has(b.name) && !brandCount[b.name.toLowerCase()]) {
            brandRecs.push({ brand: b, score: 0 });
            have.add(b.name);
          }
        });
      }
    } else {
      brandRecs = BRAND_CATALOG.slice(0, 8).map((b) => ({ brand: b, score: 0 }));
    }

    // --- items ---
    let itemRecs: { item: Suggestion; score: number }[];
    if (hasSignal) {
      itemRecs = ITEM_SUGGESTIONS.map((s) => {
        let score = match(s.styles);
        if (missingCats.includes(s.category)) score += 5;
        return { item: s, score };
      })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    } else {
      itemRecs = ITEM_SUGGESTIONS.slice(0, 8).map((s) => ({ item: s, score: 0 }));
    }

    const topStyles = Object.entries(styleScore)
      .sort((a, b) => b[1] - a[1])
      .map((e) => e[0]);

    return { hasSignal, brandRecs, itemRecs, missingCats, usedBrands, topStyles, analysed: all.length };
  }, [catalog, wishlist, fits, builder]);

  const { hasSignal, brandRecs, itemRecs, missingCats, usedBrands, topStyles, analysed } = model;

  return (
    <div className="wrap">
      <PageHead
        index="№ 04 — The Edit"
        title={
          <>
            For <span className="serif-italic">You</span>
          </>
        }
        lede="Brands and pieces chosen from what you've added — your go-to labels, the styles you lean toward, and the gaps worth filling."
      />

      <div className="ledger">
        <div className="cell">
          <div className="num">{analysed}</div>
          <div className="lbl">Items analysed</div>
        </div>
        <div className="cell">
          <div className="num">{usedBrands.length}</div>
          <div className="lbl">Brands you've used</div>
        </div>
        <div className="cell">
          <div className="num">{topStyles.length ? cap(topStyles[0]) : "—"}</div>
          <div className="lbl">Your top vibe</div>
        </div>
      </div>

      <p className="rec-note">
        {hasSignal ? (
          <>
            <strong>Tailored to you.</strong> Based on your{" "}
            {topStyles.length ? <em>{topStyles.slice(0, 3).map(cap).join(", ")}</em> : "entries"} leanings
            {missingCats.length ? (
              <>
                {" "}
                — and we noticed your outfits are light on{" "}
                <em>{missingCats.map((c) => CAT_LABEL[c as Category]).join(", ")}</em>, so we've
                suggested pieces to fill the gaps.
              </>
            ) : (
              "."
            )}
          </>
        ) : (
          <>
            <strong>Just getting started?</strong> Add a few pieces with brands in the{" "}
            <Link href="/" style={{ borderBottom: "1px solid currentColor" }}>builder</Link> and these
            picks retune to your taste. For now, here are some editor favourites.
          </>
        )}
      </p>

      <section className="rec-section">
        <div className="head">
          <span className="idx">i.</span>
          <h2>Brands you&rsquo;ll love</h2>
        </div>
        <p className="lead">Labels that match the styles you gravitate toward.</p>
        <div className="brand-grid">
          {brandRecs.map(({ brand, score }) => {
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
                  {score > 0 ? <span className="chip match">Your style</span> : <span className="chip">{brand.price} · editor pick</span>}
                  <a className="shop-link" href={safeUrl(brand.url)} target="_blank" rel="noopener noreferrer">
                    Shop ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rec-section">
        <div className="head">
          <span className="idx">ii.</span>
          <h2>Pieces to complete the wardrobe</h2>
        </div>
        <p className="lead">Suggestions to round out your outfits — especially the categories you&rsquo;re missing.</p>
        <div className="sugg-grid">
          {itemRecs.map(({ item }) => {
            const gap = missingCats.includes(item.category);
            return (
              <article className="sugg fade-up" key={item.name}>
                <div className="frame">
                  <SmartImage src={pieceImage(item.name, item.category)} alt={item.name} width={440} fallback={<div className="noimg">{CAT_ICON[item.category]}</div>} />
                </div>
                <div className="info">
                  <div className="brand">{item.brand}</div>
                  <div className="name">{item.name}</div>
                  <div className="tags">
                    <span className="chip">{CAT_LABEL[item.category]}</span>
                    {gap ? <span className="chip gap">Fills a gap</span> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
