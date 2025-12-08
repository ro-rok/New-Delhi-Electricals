# New Delhi Electricals – Product Hero Drop-in

Assumptions: the app already uses React 18 + Tailwind + next-themes + Framer Motion; images can be swapped later with CDN assets; pricing in INR by default.

## Files added
- `frontend/src/components/ProductHero.tsx` – Apple-inspired hero with variants, GSAP reveal, Framer Motion micro-interactions, mobile sticky CTA, accessible swatches, and plate grid.
- `frontend/src/hooks/useLenis.ts` – Lenis smooth scroll hook.
- `frontend/tailwind.config.ts` – brand palette (`newdelhi`) already wired for `darkMode: "class"`.

## How to use
1) Install deps:  
   `cd frontend && npm i lenis gsap framer-motion`
2) Ensure Tailwind is compiled (already configured). Palette keys: `newdelhi-500`, `newdelhi-900`, `newdelhi-accent`.
3) Wrap your app with `ThemeProvider` from `next-themes` (already in the project) and ensure `class` is applied to `<html>` or `<body>`.
4) Drop the component:
```tsx
import ProductHero from "@/components/ProductHero";
import type { Product } from "@/components/ProductHero";
import useLenis from "@/hooks/useLenis";

const Page = () => {
  useLenis();
  return <ProductHero product={exampleProduct} initialVariant="white-1m" />;
};
```

## Example product payload
```json
{
  "sku": "NDE-PLATE-001",
  "name": "Aeris Modular Plate",
  "brand": "New Delhi Electrics",
  "description": "Premium modular cover plates with grid/no-grid options.",
  "shortDescription": "Ultra-slim, precision milled plates with tactile finish.",
  "media": {
    "images": [
      { "url": "https://via.placeholder.com/960x1200.png?text=Snow+1M", "alt": "Snow white 1M plate", "color": "Snow", "moduleSize": "1M" },
      { "url": "https://via.placeholder.com/960x1200.png?text=Onyx+2M", "alt": "Onyx black 2M plate", "color": "Onyx", "moduleSize": "2M" },
      { "url": "https://via.placeholder.com/960x1200.png?text=Sand+3M", "alt": "Sand stone 3M plate", "color": "Sand", "moduleSize": "3M" }
    ]
  },
  "pricing": { "mrp": 1299, "selling_price": 999, "currency": "INR" },
  "datasheetUrl": "https://example.com/datasheet.pdf",
  "variants": [
    { "id": "white-1m", "label": "Snow", "color": "#f5f7fb", "swatch": "#f5f7fb", "moduleSize": "1M", "plateOption": "grid frame", "sku": "NDE-PLATE-001-1M-WH", "imageIndex": 0 },
    { "id": "onyx-2m", "label": "Onyx", "color": "#0f172a", "swatch": "#0f172a", "moduleSize": "2M", "plateOption": "no grid frame", "sku": "NDE-PLATE-001-2M-BK", "imageIndex": 1 },
    { "id": "sand-3m", "label": "Sandstone", "color": "#d7c7b3", "swatch": "#d7c7b3", "moduleSize": "3M", "plateOption": "grid frame", "sku": "NDE-PLATE-001-3M-SD", "imageIndex": 2 }
  ],
  "plates": [
    { "id": "p1", "title": "Snow · 1M", "moduleCount": 1, "moduleSizeLabel": "1M", "color": "Snow", "modules": [{ "label": "1M", "count": 1 }], "image": "https://via.placeholder.com/600x400.png?text=Snow+1M" },
    { "id": "p2", "title": "Onyx · 2M", "moduleCount": 2, "moduleSizeLabel": "2M", "color": "Onyx", "modules": [{ "label": "1M", "count": 2 }], "image": "https://via.placeholder.com/600x400.png?text=Onyx+2M" },
    { "id": "p3", "title": "Sand · 3M", "moduleCount": 3, "moduleSizeLabel": "3M", "color": "Sandstone", "modules": [{ "label": "1M", "count": 2 }, { "label": "2M", "count": 1 }], "image": "https://via.placeholder.com/600x400.png?text=Sand+3M" }
  ],
  "specs": {
    "material": "Matte polycarbonate + aluminum spine",
    "dimensions": "86 x 86 x 6 mm",
    "module_size": "1M / 2M / 3M / 4M",
    "color": "Snow / Onyx / Sand"
  },
  "catalogSource": { "product_family": "Plates", "variant": ["Snow", "Onyx", "Sand"] }
}
```

## Notes
- Replace placeholder URLs with CDN product images; `srcSet` and `sizes` are supported on each image entry.
- GSAP ScrollTrigger is registered inside `ProductHero` for the hero image reveal; animations stay transform/opacity-only to avoid jank.
- All interactive elements are keyboard-focusable with visible outlines; thumbnails expose `aria-pressed`.