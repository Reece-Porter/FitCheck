import { Item } from "./types";
import { uid } from "./store";

/* A ready-made outfit so a first-time visitor can see the app working — full
   category coverage with real brands (so recommendations and the style check
   have something to chew on). Photos are lightweight inline SVGs so the sample
   always loads, with no network needed. */

function tile(label: string, sub: string, c1: string, c2: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
    `<rect width='600' height='800' fill='url(#g)'/>` +
    `<text x='40' y='735' font-family='Georgia, serif' font-size='44' fill='rgba(255,255,255,0.94)'>${label}</text>` +
    `<text x='42' y='772' font-family='Arial, sans-serif' font-size='20' letter-spacing='3' fill='rgba(255,255,255,0.72)'>${sub.toUpperCase()}</text>` +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export function sampleOutfit(): Item[] {
  const now = Date.now();
  const data = [
    { name: "Ribbed Beanie", brand: "Carhartt WIP", category: "headwear", price: 22, c1: "#6b4f3a", c2: "#3f2d1f", sub: "Carhartt" },
    { name: "Wool Overcoat", brand: "COS", category: "outerwear", price: 190, c1: "#b7a184", c2: "#8a7358", sub: "COS" },
    { name: "Merino Crew Knit", brand: "Uniqlo", category: "top", price: 40, c1: "#cbb98f", c2: "#a58f63", sub: "Uniqlo" },
    { name: "Selvedge Jeans", brand: "Levi's", category: "bottom", price: 98, c1: "#3f5878", c2: "#25344a", sub: "Levi's" },
    { name: "Suede Runners", brand: "New Balance", category: "footwear", price: 120, c1: "#9a9488", c2: "#6f6a5f", sub: "New Balance" },
    { name: "Leather Tote", brand: "Everlane", category: "accessory", price: 145, c1: "#a9713f", c2: "#7c4f27", sub: "Everlane" }
  ] as const;

  return data.map((d, i) => ({
    id: uid(),
    name: d.name,
    brand: d.brand,
    category: d.category as Item["category"],
    price: d.price,
    image: tile(d.name, d.sub, d.c1, d.c2),
    url: "",
    at: now + i
  }));
}
