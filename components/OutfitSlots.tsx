"use client";

import { Item } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import PieceCard from "@/components/PieceCard";

type ActionsFor = (item: Item) => { key: string; label: string; glyph: string; danger?: boolean; onClick: () => void }[];

export default function OutfitSlots({ items, actionsFor }: { items: Item[]; actionsFor?: ActionsFor }) {
  const groups = CATEGORIES.map((c) => ({
    cat: c,
    items: items.filter((i) => i.category === c.id)
  })).filter((g) => g.items.length > 0);

  return (
    <div className="board">
      {groups.map((g, idx) => (
        <section className="slot" key={g.cat.id}>
          <div className="slot-head">
            <span className="num">{String(idx + 1).padStart(2, "0")}</span>
            <h3>{g.cat.label}</h3>
            <span className="line" />
            <span className="n">
              {g.items.length} {g.items.length === 1 ? "piece" : "pieces"}
            </span>
          </div>
          <div className="pieces">
            {g.items.map((it) => (
              <PieceCard key={it.id} item={it} actions={actionsFor ? actionsFor(it) : undefined} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
