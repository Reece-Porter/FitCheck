/* Curated brand & item catalogue used to power the Recommendations page.
   Recommendations are ranked against the styles, categories and brands the
   user has actually entered elsewhere on the site, so this is a starting
   library rather than a live store. */

window.BRAND_CATALOG = [
  {
    name: "Uniqlo",
    desc: "Clean, affordable everyday basics and LifeWear staples.",
    styles: ["minimal", "casual", "basics"],
    categories: ["top", "bottom", "outerwear"],
    price: "$",
    url: "https://www.uniqlo.com"
  },
  {
    name: "COS",
    desc: "Modern, architectural minimalism with elevated basics.",
    styles: ["minimal", "smart", "elevated"],
    categories: ["top", "bottom", "outerwear"],
    price: "$$",
    url: "https://www.cos.com"
  },
  {
    name: "Arket",
    desc: "Considered Scandinavian wardrobe essentials.",
    styles: ["minimal", "casual", "elevated"],
    categories: ["top", "bottom", "outerwear", "accessory"],
    price: "$$",
    url: "https://www.arket.com"
  },
  {
    name: "Carhartt WIP",
    desc: "Workwear-rooted streetwear built to last.",
    styles: ["streetwear", "workwear", "casual"],
    categories: ["outerwear", "bottom", "top"],
    price: "$$",
    url: "https://www.carhartt-wip.com"
  },
  {
    name: "Stüssy",
    desc: "Original street & surf culture graphics and staples.",
    styles: ["streetwear", "casual"],
    categories: ["top", "outerwear", "headwear"],
    price: "$$",
    url: "https://www.stussy.com"
  },
  {
    name: "Nike",
    desc: "Performance and lifestyle footwear and sportswear.",
    styles: ["sporty", "streetwear", "athleisure"],
    categories: ["footwear", "top", "bottom"],
    price: "$$",
    url: "https://www.nike.com"
  },
  {
    name: "Adidas",
    desc: "Iconic three-stripe sportswear and terrace sneakers.",
    styles: ["sporty", "streetwear", "athleisure"],
    categories: ["footwear", "top", "bottom"],
    price: "$$",
    url: "https://www.adidas.com"
  },
  {
    name: "New Balance",
    desc: "Cult running-heritage sneakers with everyday comfort.",
    styles: ["sporty", "casual", "streetwear"],
    categories: ["footwear"],
    price: "$$",
    url: "https://www.newbalance.com"
  },
  {
    name: "Dr. Martens",
    desc: "Durable, rebellious leather boots and shoes.",
    styles: ["grunge", "streetwear", "smart"],
    categories: ["footwear"],
    price: "$$",
    url: "https://www.drmartens.com"
  },
  {
    name: "Levi's",
    desc: "The original denim — jeans, jackets and trucker staples.",
    styles: ["casual", "denim", "americana"],
    categories: ["bottom", "outerwear"],
    price: "$$",
    url: "https://www.levi.com"
  },
  {
    name: "Aimé Leon Dore",
    desc: "Elevated New York sportswear with a preppy edge.",
    styles: ["elevated", "streetwear", "smart"],
    categories: ["top", "outerwear", "headwear"],
    price: "$$$",
    url: "https://www.aimeleondore.com"
  },
  {
    name: "Percival",
    desc: "Playful British menswear with a smart-casual twist.",
    styles: ["smart", "casual", "elevated"],
    categories: ["top", "outerwear"],
    price: "$$",
    url: "https://www.percival.co"
  },
  {
    name: "Reiss",
    desc: "Tailored, contemporary smart wear for occasions.",
    styles: ["smart", "elevated", "formal"],
    categories: ["top", "outerwear", "bottom"],
    price: "$$$",
    url: "https://www.reiss.com"
  },
  {
    name: "Ralph Lauren",
    desc: "Timeless preppy Americana and polo staples.",
    styles: ["preppy", "smart", "americana"],
    categories: ["top", "outerwear", "accessory"],
    price: "$$$",
    url: "https://www.ralphlauren.com"
  },
  {
    name: "Patagonia",
    desc: "Rugged, sustainable outdoor and fleece layers.",
    styles: ["outdoor", "casual", "sustainable"],
    categories: ["outerwear", "top"],
    price: "$$",
    url: "https://www.patagonia.com"
  },
  {
    name: "The North Face",
    desc: "Technical outerwear that crossed into streetwear.",
    styles: ["outdoor", "streetwear", "sporty"],
    categories: ["outerwear"],
    price: "$$",
    url: "https://www.thenorthface.com"
  },
  {
    name: "Acne Studios",
    desc: "Contemporary Scandi luxury with bold minimalism.",
    styles: ["minimal", "elevated", "luxury"],
    categories: ["top", "bottom", "accessory"],
    price: "$$$$",
    url: "https://www.acnestudios.com"
  },
  {
    name: "Everlane",
    desc: "Radically transparent, sustainable modern basics.",
    styles: ["minimal", "sustainable", "basics"],
    categories: ["top", "bottom", "footwear"],
    price: "$$",
    url: "https://www.everlane.com"
  },
  {
    name: "Ganni",
    desc: "Playful, responsible Scandinavian ready-to-wear.",
    styles: ["elevated", "playful", "sustainable"],
    categories: ["top", "bottom", "outerwear"],
    price: "$$$",
    url: "https://www.ganni.com"
  },
  {
    name: "Vans",
    desc: "Skate-born canvas sneakers and off-the-wall style.",
    styles: ["streetwear", "grunge", "casual"],
    categories: ["footwear"],
    price: "$",
    url: "https://www.vans.com"
  },
  {
    name: "Champion",
    desc: "Heavyweight hoodies and athletic heritage wear.",
    styles: ["sporty", "streetwear", "athleisure"],
    categories: ["top", "bottom"],
    price: "$",
    url: "https://www.champion.com"
  },
  {
    name: "Mango",
    desc: "On-trend, accessible smart and occasion wear.",
    styles: ["smart", "elevated", "casual"],
    categories: ["top", "bottom", "outerwear", "accessory"],
    price: "$$",
    url: "https://shop.mango.com"
  }
];

/* Sample items surfaced as "you might also want" suggestions, tagged so they
   can fill gaps in a user's outfit (e.g. suggest footwear when they only have
   tops). Images are omitted intentionally — cards render with a placeholder
   and link straight to the brand. */
window.ITEM_SUGGESTIONS = [
  { name: "Oversized Cotton Tee", brand: "COS", category: "top", styles: ["minimal", "basics"], price: "$$" },
  { name: "Relaxed Selvedge Jeans", brand: "Levi's", category: "bottom", styles: ["denim", "casual"], price: "$$" },
  { name: "New Balance 550", brand: "New Balance", category: "footwear", styles: ["streetwear", "sporty"], price: "$$" },
  { name: "Detroit Workwear Jacket", brand: "Carhartt WIP", category: "outerwear", styles: ["workwear", "streetwear"], price: "$$$" },
  { name: "Ribbed Beanie", brand: "Carhartt WIP", category: "headwear", styles: ["streetwear", "casual"], price: "$" },
  { name: "Merino Crew Knit", brand: "Uniqlo", category: "top", styles: ["minimal", "smart"], price: "$" },
  { name: "Tailored Wool Trousers", brand: "Reiss", category: "bottom", styles: ["smart", "formal"], price: "$$$" },
  { name: "Leather Chelsea Boots", brand: "Dr. Martens", category: "footwear", styles: ["smart", "grunge"], price: "$$" },
  { name: "Retro Nuptse Puffer", brand: "The North Face", category: "outerwear", styles: ["outdoor", "streetwear"], price: "$$$" },
  { name: "Canvas Tote Bag", brand: "Everlane", category: "accessory", styles: ["minimal", "sustainable"], price: "$" },
  { name: "Piqué Polo Shirt", brand: "Ralph Lauren", category: "top", styles: ["preppy", "smart"], price: "$$$" },
  { name: "Classic Bucket Hat", brand: "Stüssy", category: "headwear", styles: ["streetwear", "casual"], price: "$$" },
  { name: "Fleece Snap-T Pullover", brand: "Patagonia", category: "outerwear", styles: ["outdoor", "casual"], price: "$$" },
  { name: "Old Skool Sneakers", brand: "Vans", category: "footwear", styles: ["streetwear", "grunge"], price: "$" },
  { name: "Reverse Weave Hoodie", brand: "Champion", category: "top", styles: ["sporty", "athleisure"], price: "$" },
  { name: "Leather Card Holder", brand: "Acne Studios", category: "accessory", styles: ["minimal", "luxury"], price: "$$$" }
];
