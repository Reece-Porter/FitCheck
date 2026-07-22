import { Category } from "./types";

export interface CategoryDef {
  id: Category;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "headwear", label: "Headwear", icon: "◠" },
  { id: "outerwear", label: "Outerwear", icon: "❖" },
  { id: "top", label: "Tops", icon: "▽" },
  { id: "bottom", label: "Bottoms", icon: "‖" },
  { id: "footwear", label: "Footwear", icon: "◇" },
  { id: "accessory", label: "Accessories", icon: "○" }
];

export const CAT_LABEL: Record<Category, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.label }),
  {} as Record<Category, string>
);

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  headwear: ["hat", "cap", "beanie", "bucket", "headband", "visor"],
  outerwear: [
    "jacket", "coat", "hoodie", "parka", "puffer", "fleece", "blazer",
    "cardigan", "overshirt", "gilet", "vest", "windbreaker", "trench"
  ],
  top: [
    "shirt", "tee", "t-shirt", "top", "polo", "knit", "sweater", "jumper",
    "sweatshirt", "blouse", "tank", "crewneck", "crew"
  ],
  bottom: [
    "jeans", "trouser", "pant", "short", "chino", "skirt", "jogger",
    "cargo", "denim", "legging"
  ],
  footwear: [
    "shoe", "sneaker", "boot", "trainer", "loafer", "sandal", "heel",
    "footwear", "runner", "550", "990", "samba"
  ],
  accessory: [
    "bag", "belt", "watch", "scarf", "sunglass", "glove", "wallet", "tote",
    "necklace", "ring", "sock", "tie", "cardholder"
  ]
};

export function guessCategory(text: string): Category {
  const t = (text || "").toLowerCase();
  for (const cat of CATEGORIES) {
    if ((CATEGORY_KEYWORDS[cat.id] || []).some((k) => t.includes(k))) {
      return cat.id;
    }
  }
  return "top";
}
