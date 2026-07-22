import { Item, Category } from "./types";
import { BRAND_CATALOG } from "./brands";
import { CAT_LABEL } from "./categories";
import { cap } from "./format";

export interface CritiqueNote {
  tone: "good" | "tip" | "warn";
  text: string;
}

export interface Critique {
  score: number; // 0–100
  grade: string;
  headline: string;
  styles: string[];
  present: Category[];
  missing: Category[];
  notes: CritiqueNote[];
}

const CORE: Category[] = ["top", "bottom", "footwear"];
const BONUS: Category[] = ["outerwear", "headwear", "accessory"];

const BRAND_STYLES = new Map(BRAND_CATALOG.map((b) => [b.name.toLowerCase(), b.styles]));

function grade(score: number): { grade: string; headline: string } {
  if (score >= 88) return { grade: "Editor's Pick", headline: "A cover-worthy look — considered, complete and confident." };
  if (score >= 74) return { grade: "Runway Ready", headline: "Polished and cohesive. This one's ready to be seen." };
  if (score >= 58) return { grade: "Strong Look", headline: "A solid outfit with real point of view — a tweak or two from great." };
  if (score >= 40) return { grade: "In Progress", headline: "The bones are here. Style it out and it'll sing." };
  return { grade: "Just Started", headline: "Early days — build the look out and check back." };
}

export function critique(items: Item[]): Critique {
  const present = Array.from(new Set(items.map((i) => i.category)));
  const missingCore = CORE.filter((c) => !present.includes(c));
  const missing = [...CORE, ...BONUS].filter((c) => !present.includes(c));

  // --- Coverage: the three core pieces carry the most weight ---
  const coreScore = ((CORE.length - missingCore.length) / CORE.length) * 55;
  const bonusPresent = BONUS.filter((c) => present.includes(c)).length;
  const bonusScore = Math.min(bonusPresent, 3) * 8; // up to 24

  // --- Cohesion: how consistent the styling is across the labels used ---
  const styleCount = new Map<string, number>();
  let branded = 0;
  for (const it of items) {
    const styles = BRAND_STYLES.get((it.brand || "").trim().toLowerCase());
    if (styles) {
      branded++;
      styles.forEach((s) => styleCount.set(s, (styleCount.get(s) || 0) + 1));
    }
  }
  const styles = [...styleCount.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  let cohesionScore = 10; // neutral baseline
  if (branded >= 2) {
    const top = Math.max(...styleCount.values());
    cohesionScore = Math.round((top / branded) * 21); // up to 21
  }

  let score = Math.round(coreScore + bonusScore + cohesionScore);
  if (items.length === 0) score = 0;
  score = Math.max(0, Math.min(100, score));

  const { grade: g, headline } = grade(score);

  // --- Editorial notes ---
  const notes: CritiqueNote[] = [];

  if (items.length === 0) {
    notes.push({ tone: "tip", text: "Add a few pieces to your outfit, then run the Style Check." });
    return { score, grade: g, headline, styles, present, missing, notes };
  }

  if (missingCore.length === 0) {
    notes.push({ tone: "good", text: "Head-to-toe and grounded — top, bottom and footwear all accounted for." });
  } else {
    notes.push({
      tone: "warn",
      text: `A finished look needs its foundation. You're missing ${missingCore
        .map((c) => CAT_LABEL[c].toLowerCase())
        .join(" and ")}.`
    });
  }

  if (present.includes("outerwear")) {
    notes.push({ tone: "good", text: "The layer of outerwear adds depth and a sense of season." });
  } else {
    notes.push({ tone: "tip", text: "A jacket or overshirt would add a layer of intrigue." });
  }

  if (present.includes("accessory") || present.includes("headwear")) {
    notes.push({ tone: "good", text: "Accessories do the finishing — nice attention to the details." });
  } else {
    notes.push({ tone: "tip", text: "Finish with an accessory — a bag, cap or belt sharpens the whole thing." });
  }

  if (branded >= 2 && styles.length) {
    if (cohesionScore >= 16) {
      notes.push({ tone: "good", text: `A disciplined, cohesive palette — clearly a ${cap(styles[0])} sensibility.` });
    } else {
      notes.push({
        tone: "tip",
        text: `You're mixing ${styles.slice(0, 2).map(cap).join(" and ")}. Bold — just make sure one voice leads.`
      });
    }
  }

  const heavy = mostCrowdedCategory(items);
  if (heavy && heavy.count >= 4) {
    notes.push({
      tone: "tip",
      text: `That's a lot of ${CAT_LABEL[heavy.cat].toLowerCase()} (${heavy.count}). Edit down to let the hero pieces breathe.`
    });
  }

  return { score, grade: g, headline, styles, present, missing, notes };
}

function mostCrowdedCategory(items: Item[]): { cat: Category; count: number } | null {
  const counts = new Map<Category, number>();
  items.forEach((i) => counts.set(i.category, (counts.get(i.category) || 0) + 1));
  let best: { cat: Category; count: number } | null = null;
  counts.forEach((count, cat) => {
    if (!best || count > best.count) best = { cat, count };
  });
  return best;
}
