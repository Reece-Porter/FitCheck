import { BRAND_CATALOG, ITEM_SUGGESTIONS, Brand, Suggestion } from "./brands";
import { matchCategory } from "./categories";
import { Category } from "./types";

export interface SearchResult {
  query: string;
  category: Category | null;
  styles: string[];
  items: Suggestion[];
  brands: Brand[];
}

/* The full style vocabulary used across the catalogue, so we can detect style
   words a shopper types ("smart", "streetwear", "minimal"…). */
const STYLE_VOCAB: string[] = Array.from(
  new Set(
    [...BRAND_CATALOG.flatMap((b) => b.styles), ...ITEM_SUGGESTIONS.flatMap((s) => s.styles)]
  )
);

// A few everyday synonyms mapped onto the catalogue's style tags.
const STYLE_SYNONYMS: Record<string, string[]> = {
  formal: ["smart", "formal"],
  work: ["workwear", "smart"],
  office: ["smart"],
  gym: ["sporty", "athleisure"],
  running: ["sporty"],
  street: ["streetwear"],
  vintage: ["grunge", "denim"],
  outdoors: ["outdoor"],
  luxe: ["luxury", "elevated"],
  basic: ["basics", "minimal"],
  plain: ["minimal", "basics"]
};

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function detectStyles(tokens: string[]): string[] {
  const found = new Set<string>();
  tokens.forEach((tok) => {
    if (STYLE_VOCAB.includes(tok)) found.add(tok);
    (STYLE_SYNONYMS[tok] || []).forEach((s) => found.add(s));
  });
  return Array.from(found);
}

export function searchCatalog(raw: string): SearchResult {
  const query = (raw || "").trim();
  if (!query) return { query, category: null, styles: [], items: [], brands: [] };

  const tokens = tokenize(query);
  const category = matchCategory(query);
  const styles = detectStyles(tokens);

  // ---- Items ----
  const scoredItems = ITEM_SUGGESTIONS.map((s) => {
    const name = s.name.toLowerCase();
    const hay = `${name} ${s.brand} ${s.category} ${s.styles.join(" ")}`.toLowerCase();
    let score = 0;
    tokens.forEach((tok) => {
      if (name.includes(tok)) score += 4;
      else if (hay.includes(tok)) score += 2;
    });
    if (category && s.category === category) score += 3;
    styles.forEach((st) => {
      if (s.styles.includes(st)) score += 2;
    });
    return { s, score };
  }).filter((x) => x.score > 0);

  scoredItems.sort((a, b) => b.score - a.score);
  let items = scoredItems.map((x) => x.s);

  // Fall back to the detected category if nothing scored on tokens.
  if (items.length === 0 && category) {
    items = ITEM_SUGGESTIONS.filter((s) => s.category === category);
  }
  items = items.slice(0, 12);

  // ---- Brands ----
  const scoredBrands = BRAND_CATALOG.map((b) => {
    const hay = `${b.name} ${b.desc} ${b.styles.join(" ")}`.toLowerCase();
    let score = 0;
    tokens.forEach((tok) => {
      if (b.name.toLowerCase().includes(tok)) score += 5;
      else if (hay.includes(tok)) score += 2;
    });
    if (category && b.categories.includes(category)) score += 3;
    styles.forEach((st) => {
      if (b.styles.includes(st)) score += 2;
    });
    // Brands that actually make the recommended items get a nudge.
    if (items.some((it) => it.brand === b.name)) score += 2;
    return { b, score };
  }).filter((x) => x.score > 0);

  scoredBrands.sort((a, b) => b.score - a.score);
  const brands = scoredBrands.map((x) => x.b).slice(0, 8);

  return { query, category, styles, items, brands };
}

/** External search URL for a raw description (Google Shopping). */
export function shoppingSearchUrl(query: string): string {
  return "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(query);
}

/** External search URL for a specific piece at a specific brand. */
export function findAtBrandUrl(brand: string, name: string): string {
  return "https://www.google.com/search?q=" + encodeURIComponent(`${brand} ${name}`);
}
