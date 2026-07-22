"use client";

import { Fit } from "@/lib/types";
import { CAT_ICON } from "@/components/icons";
import { money, totalPrice, formatDate, safeUrl } from "@/lib/format";

function Cell({ image, category }: { image: string; category: string }) {
  const img = safeUrl(image);
  return (
    <div className="cell">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" loading="lazy" onError={(e) => ((e.currentTarget.style.display = "none"))} />
      ) : (
        <div className="noimg">{CAT_ICON[category as keyof typeof CAT_ICON] || "✦"}</div>
      )}
    </div>
  );
}

export default function FitCard({
  fit,
  onOpen,
  onReview,
  onDelete
}: {
  fit: Fit;
  onOpen: () => void;
  onReview: () => void;
  onDelete: () => void;
}) {
  const shots = fit.items.slice(0, 4);
  const n = Math.min(shots.length, 4);

  return (
    <article className="fit fade-up">
      <button className={"collage n" + n} onClick={onOpen} aria-label={`View ${fit.name}`} style={{ padding: 0, border: "1px solid var(--ink)", cursor: "pointer" }}>
        {shots.map((it, i) => (
          <Cell key={i} image={it.image} category={it.category} />
        ))}
        {fit.review ? (
          <span className="score-chip">
            {fit.review.score}
            <small>/100</small>
          </span>
        ) : null}
      </button>
      <div className="body">
        <h3>{fit.name}</h3>
        <div className="meta">
          {fit.items.length} pieces · {formatDate(fit.at)}
        </div>
        {fit.review && fit.review.stars > 0 ? (
          <div className="stars" aria-label={`${fit.review.stars} out of 5`}>
            {"★".repeat(fit.review.stars)}
            <span style={{ color: "var(--line-strong)" }}>{"★".repeat(5 - fit.review.stars)}</span>
          </div>
        ) : null}
        <div className="foot">
          <span className="price">{money(totalPrice(fit.items))}</span>
          <span className="links">
            <button className="text-link" onClick={onReview}>Style Check</button>
            <button className="text-link" onClick={onOpen}>View</button>
            <button className="icon-btn danger" title="Delete fit" aria-label="Delete fit" onClick={onDelete} style={{ width: 28, height: 28, fontSize: "0.8rem" }}>
              ✕
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}
