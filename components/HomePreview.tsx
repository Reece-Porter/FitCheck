"use client";

import { useMemo, useState } from "react";
import { sampleOutfit } from "@/lib/sample";
import { critique } from "@/lib/styleScore";
import { money, totalPrice } from "@/lib/format";
import { CAT_ICON } from "@/components/icons";
import SmartImage from "@/components/SmartImage";

const TONE_MARK: Record<string, string> = { good: "✓", tip: "→", warn: "!" };

/* Shown on the empty Build page so a first-time visitor sees the payoff — a
   finished example look and the Style Check it earns — before building. */
export default function HomePreview({ onLoad }: { onLoad: () => void }) {
  const example = useState(() => sampleOutfit())[0];
  const result = useMemo(() => critique(example), [example]);

  return (
    <div className="home-preview">
      <div className="hp-look">
        <span className="kicker">A finished look</span>
        <div className="hp-strip">
          {example.map((it) => (
            <div className="hp-thumb" key={it.id}>
              <SmartImage src={it.image} alt={it.name} width={200} fallback={<div className="noimg">{CAT_ICON[it.category]}</div>} />
            </div>
          ))}
        </div>
        <p className="hp-meta">
          {example.length} pieces · {money(totalPrice(example))} — head to toe, seen together.
        </p>
        <button className="btn accent" onClick={onLoad}>
          Load this sample outfit
        </button>
      </div>

      <div className="hp-verdict">
        <span className="grade">{result.grade}</span>
        <div className="dial">
          <span className="score">{result.score}</span>
          <span className="out">/100</span>
        </div>
        <p className="headline">{result.headline}</p>
        <ul className="hp-notes">
          {result.notes.slice(0, 3).map((n, i) => (
            <li className={n.tone} key={i}>
              <span className="tone">{TONE_MARK[n.tone]}</span>
              {n.text}
            </li>
          ))}
        </ul>
        <span className="hp-caption">This is a Style Check — every look gets one.</span>
      </div>
    </div>
  );
}
