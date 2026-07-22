"use client";

import { useState } from "react";
import { Item } from "@/lib/types";
import { CAT_ICON } from "@/components/icons";
import { money, safeUrl, safeImageSrc } from "@/lib/format";

type Action = { key: string; label: string; glyph: string; danger?: boolean; onClick: () => void };

export default function PieceCard({ item, actions }: { item: Item; actions?: Action[] }) {
  const [broken, setBroken] = useState(false);
  const img = safeImageSrc(item.image);
  const showImg = img && !broken;

  return (
    <article className="piece fade-up">
      <div className="frame">
        {showImg ? (
          <img src={img} alt={item.name} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="noimg">{CAT_ICON[item.category] || "✦"}</div>
        )}
        {actions && actions.length > 0 && (
          <div className="acts">
            {actions.map((a) => (
              <button
                key={a.key}
                className={"icon-btn" + (a.danger ? " danger" : "")}
                title={a.label}
                aria-label={a.label}
                onClick={a.onClick}
              >
                {a.glyph}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="info">
        {item.brand ? <div className="brand">{item.brand}</div> : null}
        <div className="name">{item.name || "Untitled piece"}</div>
        <div className="row">
          <span className="price">{item.price != null ? money(item.price) : ""}</span>
          {safeUrl(item.url) ? (
            <a className="view" href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer">
              View
            </a>
          ) : (
            <span />
          )}
        </div>
      </div>
    </article>
  );
}
