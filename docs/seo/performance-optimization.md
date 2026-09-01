# Performance Optimization — Prompt 3.5

Money-page performance cleanup on top of the Prompt 3 deployment. Scope was
limited to the performance regressions verified during Prompt 3 validation. No
SEO architecture work, no page redesign, no removal of crawlable content.

- Work date: 2026-09-01 (Asia/Calcutta)
- Baseline commit: `6a15881` (Prompt 3 production)
- Delivered commits: `c4ba08a` (images + bundle), `a374bf3` (SSR asset paths)
- Catalogue source: production API, `https://new-delhi-electricals.onrender.com`

---

## 1. Cause

### 1.1 Cloudinary masters delivered untransformed (the 29 s LCP)

`ProductCard` rendered the catalogue image through `LazyImage` and passed the
**same full-size URL as both `src` and `placeholder`**:

```tsx
<LazyImage
  src={product.images[0]}
  placeholder={product.images[0]}   // <- the master, again
/>
```

The `placeholder` `<img>` inside `LazyImage` is *not* gated by the
IntersectionObserver — it renders on first paint for every card. So every
product card fetched its full catalogue master immediately, and the lazy loader
protected nothing.

The catalogue stores raw Cloudinary masters with no transformation segment:

```
https://res.cloudinary.com/dl4ld36qn/image/upload/v1767338212/catalog-products/xcevans18jsqrlh6tpx7.jpg
```

Measured across all 243 unique Cloudinary catalogue images: **20.40 MB** of
masters, 0 of them carrying `f_auto`, `q_auto` or a width.

`Wires & Cables` holds the four heaviest images in the entire catalogue. Only 4
of its 24 products have imagery, and those four are the worst offenders:

| Public ID | Master bytes | Master dimensions |
| --- | ---: | --- |
| `bymbc8zffsmoxpzeubab.jpg` | 3.71 MB | — |
| `xcevans18jsqrlh6tpx7.jpg` | 3.14 MB | 3072 x 4096 |
| `ybec6wugburkxdfu6wom.jpg` | 3.02 MB | — |
| `c4qx6pbamgbmpxfiq2hw.jpg` | 1.69 MB | 2802 x 3308 |

Confirmed in a mobile browser against the pre-change production build: those
images had intrinsic sizes of **2802 x 3308** and **3072 x 4096** and were being
painted into a **148 x 148 CSS px** box — a 19-27x oversample.

That is the whole ~29 s LCP. No other category came close, because every other
category's masters happen to be small (`Circuit Protection` masters are ~298 x
355).

### 1.2 GSAP loaded on every commercial route

`CinematicVideoHero` already imported GSAP dynamically and correctly. The leak
was in `vite.config.ts`:

```ts
"animation-vendor": ["framer-motion", "gsap", "lenis"],
```

`framer-motion` is statically imported by nearly every page, so `animation-vendor`
is always an eager chunk. Naming `gsap` in the same manual chunk overrode the
dynamic import and pulled GSAP core into that eager chunk — so every category,
brand and commercial-hub route downloaded and parsed the cinematic animation
engine it never uses. `lenis` was listed too and is imported by no shipped
component at all.

Verified against the pre-change build: `/category/wires-cables.html` preloaded
`animation-vendor-BtO7QV4S.js` at 186.48 KB, and that chunk contained GSAP tokens.

### 1.3 Homepage video preloaded at 1440p for everyone

`<video preload="auto">` on `/ndehero_1440p_seek.mp4` — a 14.74 MB, 2560 x 1440,
all-intra encode. All-intra is required for the **desktop** frame-by-frame scrub.
But:

- mobile (`innerWidth < 768`) never scrubs; it autoplays a muted loop
- reduced-motion never plays at all

Both were paying for an encode they cannot use, in competition with LCP resources.
A 720p standard-GOP encode of the same footage (`/ndehero.mp4`, 11.48 MB) was
already sitting in `public/`.

### 1.4 SSR and client builds wrote assets to different directories

Found while validating image integrity, and **pre-existing** — reproduced on the
Prompt 3 deployment before any change on this branch.

`rollupOptions` was gated behind `!isSsrBuild`, so `assetFileNames` applied to the
client build only. The client wrote `/assets/jpg/foo-HASH.jpg`; the SSR bundle —
which produces the prerendered HTML — referenced `/assets/foo-HASH.jpg`. Same
file, same hash, wrong directory. Five statically imported images 404'd in
production on the homepage and every brand page:

```
/assets/hero-premium-CqHmq5bG.jpg           (homepage PremiumHero)
/assets/product-switch-premium-CiIb7vO0.jpg
/assets/product-mcb-premium-Cda1kirv.jpg    (brand pages, FeaturedProducts)
/assets/product-wire-premium-CEX-7KkW.jpg
/assets/product-light-premium-DG5crhWS.jpg
```

---

## 2. Implementation

### 2.1 `src/lib/imageUrl.ts` (new)

Centralised Cloudinary delivery helper. Rewrites `/image/upload/` URLs to
`f_auto,q_auto,w_N,c_limit` derivatives and builds `srcset`.

`c_limit` never upscales past the master, so small masters are not blown up.

Safety rules, all enforced and tested:

- only `res.cloudinary.com` is rewritten
- only the **unsigned** `/image/upload/` delivery path — signed (`s--sig--`),
  authenticated, private, fetch, video and raw delivery pass through untouched,
  because injecting a transformation into a signed URL invalidates the signature
- already-transformed URLs pass through, so the helper is idempotent
- non-Cloudinary hosts, relative backend paths, `data:` URIs, empty and null
  values pass through unchanged

The catalogue does contain non-Cloudinary imagery, which is why this matters:
`smartshop.lk-ea.com` (5), `jayceeonline.com` (6), `cdn.moglix.com` (2),
`m.media-amazon.com` (1), `havells.com` (1), plus 10 backend-relative paths.

**Verification:** 18 URL-shape cases pass, including every signed/private/video/
third-party form and idempotence. All 243 catalogue images were then expanded
across every width the helper can emit — **1,944 derivative URLs, 0 non-200**.

### 2.2 Responsive delivery at each render site

| Site | Fallback width | `srcset` | `sizes` | Loading |
| --- | ---: | --- | --- | --- |
| `ProductCard` (grids) | 480 | 160-640 | `(min-width:1024px) 280px, (min-width:768px) 33vw, 50vw` | lazy; first row eager |
| Product gallery (LCP) | 960 | 320-1280 | `(min-width:1024px) 620px, 92vw` | eager, `fetchpriority="high"` on frame 0 |
| Similar products | 320 | 160-640 | `(min-width:1024px) 260px, (min-width:640px) 40vw, 85vw` | lazy |
| Brand featured collection | 640 | 160-640 | `(min-width:1024px) 420px, (min-width:640px) 45vw, 92vw` | lazy |
| Compare tiles | 320 | 160-640 | `(min-width:768px) 240px, 45vw` | lazy |
| Cart line item (96 px) | 192 | — | — | lazy |
| Shortlist row (64 px) | 128 | — | — | lazy |

Every one carries explicit `width`/`height`, so nothing reflows on load.

### 2.3 `LazyImage`

- the blur-up `placeholder` is now a **32 px** thumbnail (~1 KB), not the master
- passes through `srcSet`, `sizes`, `width`, `height`, `loading`, `decoding`
- `loading="eager"` bypasses the observer gate entirely so a genuine LCP
  candidate is in the first paint and stays discoverable
- `fetchpriority` is emitted as a raw DOM attribute (React 18 does not
  camelCase-map it, and framer-motion's `motion.img` types omit it)

Only the **first row** of a category grid (`idx < 4`) and the **first product
gallery frame** are eager. No group of product images is preloaded.

### 2.4 GSAP unbundled

```ts
"animation-vendor": ["framer-motion"],
```

GSAP is no longer named in any manual chunk, so Rollup honours
`CinematicVideoHero`'s dynamic import and emits it as async-only chunks. `lenis`
was dropped from the list; it is imported nowhere.

### 2.5 Homepage hero — conservative only, no redesign

`preload` starts at `"none"`; each branch of the effect arms it for the source it
actually wants:

| Path | Source | `preload` | Behaviour |
| --- | --- | --- | --- |
| Desktop | `/ndehero_1440p_seek.mp4` (unchanged) | `auto` | full scroll-scrub, unchanged |
| Mobile `<768px` | `/ndehero.mp4` (720p) | `auto` | autoplay loop, as before |
| Reduced motion | `/ndehero.mp4` | `metadata` | metadata only, then `currentTime = 0.04` to decode and paint the same single still frame as before |

The mobile source swap happens in the effect, not in JSX, so server and client
render identical markup and hydration stays clean. Source is assigned **before**
`preload` — the reverse order makes the browser start fetching the 1440p master
and throw it away. Verified: mobile and reduced-motion now issue exactly one
`.mp4` request, for the 720p file.

Not changed, deliberately: the 1440p all-intra desktop encode, the scrub timing,
the preloader, the text stages, the vignette. Re-encoding is documented in
section 6 rather than performed — no `ffmpeg` in this environment, and it would
alter the owner's visual design.

### 2.6 SSR asset paths

`rollupOptions` now always applies, with an SSR-specific output that keeps
`entryFileNames: "[name].js"` (`generate-seo.js` imports
`dist/server/entry-server.js` by that name) and shares the client's
`assetFileNames`.

---

## 3. Network budget — `/category/wires-cables`

Measured in a real Chromium at 412 x 823, DPR 2, mobile UA, full load + 6 s
settle. Before = live production at `6a15881`; after = live production at
`a374bf3`.

| | Before | After | Delta |
| --- | ---: | ---: | ---: |
| HTML | 130.6 KB | 130.8 KB | +0.2 KB |
| JS | 900.5 KB | 833.8 KB | **-66.7 KB** |
| CSS | 141.1 KB | 141.1 KB | — |
| **Images** | **4,939.4 KB** | **3.6 KB** | **-4,935.8 KB (-99.93 %)** |
| **Total** | **6.098 MB** | **1.213 MB** | **-4.885 MB (-80.1 %)** |
| Requests | 16 | 16 | — |
| **Largest image** | **3,210.8 KB** | **2.4 KB** | **-99.93 %** |

Catalogue-wide, across all 243 unique Cloudinary images:

| | Bytes | Largest single image |
| --- | ---: | ---: |
| Masters (before) | 20.40 MB | 3.71 MB |
| `f_auto,q_auto,w_640,c_limit` | 2.40 MB | 107 KB |
| `f_auto,q_auto,w_480,c_limit` | 1.00 MB | 65 KB |
| `f_auto,q_auto,w_320,c_limit` | 0.90 MB | 32 KB |
| 32 px blur-up placeholders | 113 KB | 2.4 KB |

Homepage total byte weight: **15.19 MB -> 11.93 MB** (720p mobile video).

Other routes, before -> after total transfer:

| Route | Before | After |
| --- | ---: | ---: |
| `/category/circuit-protection` | 1.487 MB | 1.338 MB |
| `/brand/finolex` | 1.239 MB | 1.174 MB |
| `/brand/polycab/wires-cables` | 1.182 MB | 1.117 MB |

`/brand/finolex` image bytes rose from 11.6 KB to ~156 KB because its four hero
images were 404ing before and now actually load. That is a correct trade.

---

## 4. JavaScript loading changes

| Chunk | Before | After |
| --- | ---: | ---: |
| `animation-vendor` | 186.48 KB / 66.13 KB gz | **116.20 KB / 38.48 KB gz** |
| GSAP core | inside `animation-vendor`, eager everywhere | **69.94 KB / 27.55 KB gz, async-only** |
| `ScrollTrigger` | 43.14 KB, already async | 43.14 KB, unchanged |
| Eager route JS | 900.5 KB | **833.8 KB** |

Eager script tags per route, verified on live production:

| Route | Scripts | GSAP present |
| --- | ---: | --- |
| `/` | 8 | yes — the only route that uses it |
| `/category/wires-cables` | 6 | no |
| `/category/circuit-protection` | 6 | no |
| `/brand/finolex` | 6 | no |
| `/brand/polycab/wires-cables` | 6 | no |

Not attempted, by design: any React architecture rewrite. `framer-motion` is
statically imported by ~45 components; unpicking that is a separate piece of work
and is listed in section 6.

---

## 5. Visual quality

Masters and derivatives rendered side by side at the true card size
(148 CSS px, DPR 2):

- product images remain sharp and legible; no visible compression artefacts at
  `w_480` or `w_320`
- aspect ratios unchanged — `c_limit` preserves them and never upscales
- 0 broken images and 0 image 4xx/5xx across `/category/wires-cables`,
  `/category/circuit-protection`, `/category/plates`, a product page and the
  homepage on live production
- CLS 0.000 on every route in the Lighthouse median-of-3

A note on measurement: reading `naturalWidth` on an `<img>` that has a
`w`-descriptor `srcset` returns the **density-corrected** intrinsic size, not the
delivered pixel size. On the live grid that reads as `205 x 243`; re-decoding the
exact same `currentSrc` standalone returns `480 x 567`. Delivery is 480 px into a
148 CSS px slot — comfortably oversampled at DPR 2, not upscaled.

Product-page delivery, verified live on
`/anchor/1-module-cover-plate-aqua-green-color-finish`:

| Element | Transform | `fetchpriority` | `loading` |
| --- | --- | --- | --- |
| Main gallery | `w_960,c_limit` | `high` | eager |
| Similar products x4 | `w_640,c_limit` | — | `lazy` |

---

## 6. Remaining issues

### P1 — render-blocking resources are now the entire LCP cost

With images off the critical path, LCP is **pure render delay**:

| Route | TTFB | Load delay | Load time | **Render delay** | LCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/brand/polycab/wires-cables` | 638 ms | 0 ms | 0 ms | **3,750 ms** | 4.39 s |
| `/category/wires-cables` | 648 ms | 0 ms | 0 ms | **3,926 ms** | 4.57 s |

Load delay and load time are **0 ms** — images are no longer involved. The render
delay is render-blocking resources, estimated by Lighthouse at 1,450-1,680 ms:

- `https://fonts.googleapis.com/css2?family=Inter:...` — **844-883 ms**, a
  cross-origin blocking stylesheet, and the single largest item
- `/assets/css/index-*.css` — 150-156 ms, 20 KB gzip, ~17 KB of it unused

Fixing this is the highest-value next performance action: self-host or
`preconnect` the font, and split or inline critical CSS. It is a different class
of change from this prompt's brief and was not attempted here.

### P1 — `framer-motion` is eagerly imported by ~45 components

`animation-vendor` is still 116 KB (38 KB gz) on every route, and Lighthouse
attributes ~35 KB of unused JavaScript to it on hub routes. Reducing it means
route-splitting `framer-motion` usage — a real refactor, explicitly out of scope
for this prompt.

### P2 — homepage video is still 11.48 MB on mobile

Mobile now gets 720p instead of 1440p, but 11.48 MB is a large autoplay asset
and the homepage's LCP element is the video itself. Options, none taken because
they alter the owner's visual design and no `ffmpeg` is available here:

- re-encode the mobile loop shorter or at a lower bitrate
- add a poster frame so LCP resolves on an image instead of the video
- gate autoplay on `navigator.connection.saveData` / `effectiveType`

Also, `public/` still ships four encodes totalling ~55 MB
(`ndehero.mp4`, `ndehero-seek.mp4`, `ndehero_1440p_web.mp4`,
`ndehero_1440p_seek.mp4`). Two are now referenced. Deleting the other two is a
deploy-size win only — no user-facing transfer change — and is the owner's call.

### P2 — pre-existing `hub-anchor-switches` browser-test failure

`npm run test:browser` reports 14/15. The failure is a catalogue data tie, not a
code defect: two Anchor SKUs differ only by a `-b` suffix
(`16ax-1-way-switch-with-indicator-200w-sbl-load-1m` and the same slug with
`-b`) and sort non-deterministically between the build-time prerender snapshot
and the live API, so one link differs after hydration. Reproduced identically on
unmodified `6a15881`.

### P2 — 29 pre-existing TypeScript errors

`npx tsc --noEmit -p tsconfig.app.json` reports 29 errors, all pre-existing and
all in files untouched by this work (`EditProductModal`, `analytics`,
`PlatesBulkImageModal`, `ProductFamilyFilter`, and others). Count and per-file
distribution are byte-identical before and after this change set. There is still
no configured typecheck script.
