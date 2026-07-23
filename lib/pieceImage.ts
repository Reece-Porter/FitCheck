import { Category } from "./types";

/* The curated recommendation catalogue has no live product feed, so we show a
   representative, keyword-matched photo for each piece via LoremFlickr (a free
   keyworded image service). A per-name "lock" keeps the same photo for a given
   item across renders. These route through SmartImage, so they get resized and
   fall back to a placeholder glyph if the image service is ever unavailable. */

const CATEGORY_KEYWORD: Record<Category, string> = {
  headwear: "hat",
  outerwear: "coat",
  top: "shirt",
  bottom: "trousers",
  footwear: "shoes",
  accessory: "bag"
};

// Most specific first, so "Slim Chino Trousers" → trousers, "Penny Loafers" → loafers.
const NOUNS = [
  "trench", "overcoat", "coat", "blazer", "bomber", "gilet", "puffer", "fleece",
  "jacket", "cardigan", "hoodie", "sweatshirt", "sweater", "knit", "polo", "tee",
  "shirt", "jeans", "trousers", "chinos", "chino", "shorts", "skirt", "cargo",
  "trainers", "sneakers", "loafers", "boots", "shoes", "beanie", "cap", "hat",
  "tote", "bag", "belt", "scarf", "sunglasses", "wallet"
];

export function pieceImage(name: string, category: Category): string {
  const n = (name || "").toLowerCase();
  const keyword = NOUNS.find((x) => n.includes(x)) || CATEGORY_KEYWORD[category] || "clothing";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const lock = h % 100000;
  return `https://loremflickr.com/440/560/${keyword}?lock=${lock}`;
}
