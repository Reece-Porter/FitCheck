"use client";

import { Fit } from "@/lib/types";
import { CAT_ICON } from "@/components/icons";
import SmartImage from "@/components/SmartImage";

/* A compact collage thumbnail of a saved fit, used in the day strips and the
   outfit picker. Optionally shows a remove (detach) button on hover. */
export default function FitThumb({
  fit,
  onRemove,
  onClick,
  label = true
}: {
  fit: Fit;
  onRemove?: () => void;
  onClick?: () => void;
  label?: boolean;
}) {
  const shots = fit.items.slice(0, 4);
  const n = Math.min(shots.length, 4) || 1;

  return (
    <div className="fit-thumb">
      <button
        type="button"
        className={"ft-collage n" + n}
        onClick={onClick}
        aria-label={onClick ? `Open ${fit.name}` : fit.name}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        {shots.length === 0 ? (
          <div className="cell">
            <div className="noimg">✦</div>
          </div>
        ) : (
          shots.map((it, i) => (
            <div className="cell" key={i}>
              <SmartImage src={it.image} alt="" width={140} fallback={<div className="noimg">{CAT_ICON[it.category] || "✦"}</div>} />
            </div>
          ))
        )}
        {onRemove && (
          <span
            className="ft-remove"
            role="button"
            aria-label="Remove outfit"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            ✕
          </span>
        )}
      </button>
      {label && <span className="ft-name">{fit.name}</span>}
    </div>
  );
}
