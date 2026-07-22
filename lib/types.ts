export type Category =
  | "headwear"
  | "outerwear"
  | "top"
  | "bottom"
  | "footwear"
  | "accessory";

export interface Item {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number | null;
  image: string;
  url: string;
  at: number;
}

export interface Review {
  /** Algorithmic style score, 0–100. */
  score: number;
  /** The user's own star rating, 1–5 (0 = not rated). */
  stars: number;
  notes: string;
  at: number;
}

export interface Fit {
  id: string;
  name: string;
  items: Item[];
  at: number;
  review?: Review;
}

/** A lightweight record of every item ever added — powers recommendations. */
export interface CatalogEntry {
  brand: string;
  category: Category | "";
  price: number | null;
  name: string;
  at: number;
}
