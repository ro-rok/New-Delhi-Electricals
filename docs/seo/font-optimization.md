# Font & Render-Blocking Optimization — Prompt 3.6

A deliberately small pass to bank the render-blocking win left over from Prompt
3.5. No image work, no JavaScript refactor, no Framer Motion changes, no
homepage/cinematic changes.

- Work date: 2026-09-01 (Asia/Calcutta)
- Baseline commit: `bd2e0b2` (end of Prompt 3.5)
- Delivered: `34c6d1a` (self-hosted Inter), `5bb3a04` + `e1793e7` (immutable asset caching)
- Prior context: [performance-optimization.md](performance-optimization.md)

---

## 1. Font audit (Phase 1)

| Item | Finding |
| --- | --- |
| Families | **Inter only.** One reference, in `src/index.css` line 1. |
| Reference form | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');` |
| Requested weights | 300, 400, 500, 600, 700, 800 |
| Styles | normal only — no italic requested, none used |
| `font-display` | `swap` — already correct |
| Preconnect / dns-prefetch / preload | **None anywhere in the document** |
| Tailwind stack | `sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif']` |

Weight usage counted across the codebase (Tailwind classes plus inline
`fontWeight`):

| Weight | Class | Usages | Requested? |
| ---: | --- | ---: | --- |
| 200 | `font-extralight` | 4 | no — fell back to 300 |
| 300 | `font-light` | 18 | yes |
| 400 | `font-normal` | 10 + 1 inline | yes |
| 500 | `font-medium` | 191 + 2 inline | yes |
| 600 | `font-semibold` | 180 + 1 inline | yes |
| 700 | `font-bold` | 73 + 2 inline | yes |
| 800 | `font-extrabold` | **0** | yes — **unused** |

### Why the `@import` was the problem

A CSS `@import` is only discovered after the importing stylesheet has
downloaded *and* parsed. First render was therefore gated on a fully
serialized chain with two cold cross-origin connections:

```
HTML -> /assets/css/index-*.css -> fonts.googleapis.com -> fonts.gstatic.com
```

Lighthouse attributed **844–883 ms** to the `fonts.googleapis.com` hop alone —
the largest single render blocker once images were off the LCP path.

### What Google was actually serving

Verified rather than assumed. The `css2` response contains **42 `@font-face`
declarations (7 subsets × 6 weights) but only 7 distinct URLs** — one *variable*
woff2 per subset, referenced by six discrete `font-weight` declarations all
pointing at the same file. Browsers fetched 2 of them:

| Subset | Bytes | Why it is needed |
| --- | ---: | --- |
| latin | 48,256 | body text |
| latin-ext | 85,068 | contains ₹ (U+20B9) — every page that prints a price |

This also explains why `font-extralight` (200) rendered as 300: 200 matches no
declaration, so CSS font matching selects the nearest lower face.

---

## 2. Preconnect (Phase 2)

Not applicable in the delivered solution — Google Fonts is no longer externally
hosted, so there is no third-party origin left to preconnect to. Preconnect
would have been the fallback had self-hosting been rejected.

---

## 3. Request reduction (Phase 3)

Weight **800 removed** (0 usages). No italic or extra family was ever requested.
Removing 800 changes no bytes, because the underlying file is a variable font —
it removes one declaration, not a download.

---

## 4. Self-hosting decision (Phase 4) — **DONE**

| Criterion | Assessment |
| --- | --- |
| Licensing | Inter is **SIL Open Font License 1.1** — self-hosting permitted. License vendored at `src/assets/fonts/Inter-OFL.txt`. |
| Legitimate source | `@fontsource-variable/inter` v5.3.0, the official Fontsource distribution of Google's Inter. Not a random download. |
| Exactness | Fontsource's `files/inter-{latin,latin-ext}-wght-normal.woff2` are **48,256 B and 85,068 B — byte-identical in size to what Google was serving**. |
| Simplicity | Two files vendored, two `@font-face` rules, one `@import` deleted. |
| Typography regression | **None** — verified numerically, see §6. |

Implementation, in `src/index.css`:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
  src: url('./assets/fonts/inter-latin-wght-normal.woff2') format('woff2-variations');
  unicode-range: /* latin */;
}
/* second identical rule for latin-ext */
```

Notes on the choices:

- **`font-weight: 300 700` range.** Reproduces the previous rendering exactly:
  300–700 resolve to their true instance; 200 (`font-extralight`, 4 usages)
  falls outside the range and clamps to 300, which is what Google's discrete
  declarations already did; 800 is dropped as unused.
- **Family name kept as `Inter`,** not Fontsource's `Inter Variable`, so the
  Tailwind config and every existing reference work unchanged.
- **`font-display: swap` retained.**
- **Only latin + latin-ext shipped.** Italic and the cyrillic/greek/vietnamese
  subsets are not vendored — the site renders none of them.
- **No preload added.** The LCP element is text; `swap` paints it immediately in
  the fallback, and preloading would only contend with the render-blocking CSS.
  Fonts are now same-origin on an already-open connection, so the marginal gain
  does not justify the contention. `@font-face` count drops from 42 to 2.

Vite emits them hashed and same-origin:

```
/assets/woff2/inter-latin-wght-normal-Dx4kXJAl.woff2       48,256 B
/assets/woff2/inter-latin-ext-wght-normal-DO1Apj_S.woff2   85,068 B
```

**0 references to `fonts.googleapis.com` or `fonts.gstatic.com` remain in any
built artifact** (CSS, `index.html`, or any of the 1,972 prerendered routes).

---

## 5. Asset caching — pre-existing defect found and fixed

While validating font delivery, every hashed build asset was found to be served
with Vercel's default:

```
Cache-Control: public, max-age=0, must-revalidate
```

All 48 files under `/assets` carry a content hash (40 js, 5 jpg, 2 woff2, 1
css; **0 unhashed**), which is exactly the precondition for immutable caching.
JS, CSS, images and the new fonts were all being revalidated on every
navigation.

Added to `vercel.json`:

```json
{ "source": "/assets/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
```

> **Gotcha worth recording:** the first attempt (`5bb3a04`) edited the
> repo-root `vercel.json`, but the Vercel project's Root Directory is
> `frontend`, so **`frontend/vercel.json` is the file actually read**. The two
> are maintained as identical copies; `e1793e7` syncs them. Verified by
> requesting a fresh, uncached path under `/assets` and seeing the old header.

Verified live:

| Path | Cache-Control |
| --- | --- |
| `/assets/woff2/inter-latin-wght-normal-*.woff2` | `public, max-age=31536000, immutable` |
| `/assets/woff2/inter-latin-ext-wght-normal-*.woff2` | `public, max-age=31536000, immutable` |
| `/assets/css/index-*.css` | `public, max-age=31536000, immutable` |
| `/assets/js/react-vendor-*.js` | `public, max-age=31536000, immutable` |
| `/assets/jpg/hero-premium-*.jpg` | `public, max-age=31536000, immutable` |
| `/`, `/category/wires-cables`, `/sitemap.xml`, `/robots.txt` | `public, max-age=0, must-revalidate` (correctly unchanged) |

---

## 6. Typography verification (Phases 5, 10)

Typography was verified **numerically, not by eye**. A reference string was
measured at 48px across weights 200–700, on production (Google Fonts) before
the change and on the self-hosted build after:

| Route | 200 | 300 | 400 | 500 | 600 | 700 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/category/wires-cables` — before **and** after | 681.55 | 681.55 | 695.38 | 702.94 | 710.34 | 717.83 |
| `/` — before **and** after | 683.31 | 683.31 | 696.08 | 703.17 | 710.09 | 717.11 |

Identical to two decimal places at every weight, desktop and mobile. Note
`200 === 300`, confirming the clamp behaves exactly as before.

Live check across 7 routes × 2 viewports (14 combinations): `/`,
`/category/wires-cables`, `/category/circuit-protection`, `/brand/finolex`,
`/brand/polycab/wires-cables`, `/brand/anchor/switches-sockets`, and a product
page.

- both woff2 files return **200**, **0 font 404s**, 0 4xx/5xx of any kind
- `Inter` is applied — never stuck on the fallback
- ₹ renders on every catalogue page; `/` correctly loads **only** the latin
  subset (no ₹ on that page), same as the Google Fonts behaviour
- `@font-face` entries: 42 → 2
- no missing glyphs, no FOIT (`swap` retained)

---

## 7. Main CSS (Phase 6)

Investigated; **no trivial fix exists, so nothing was changed** — as the phase
instructs.

- No duplicate or accidental stylesheet imports. `src/main.tsx` imports
  `./index.css` and nothing else imports CSS.
- `src/App.css` exists but is **imported by nothing and contributes 0 bytes** to
  the bundle (verified: none of its selectors appear in the built CSS). It is
  leftover Vite scaffold — dead source, not a performance cost.
- The ~18 KB of unused CSS is Tailwind utility output in a single shared bundle
  serving all 1,972 routes. Reducing it means route-level CSS splitting or
  critical-CSS extraction, both explicitly out of scope.

The CSS bundle is now the only render-blocking resource: 130.03 KB raw,
**20.63 KB gzip**.

---

## 8. Results (Phase 11)

### Render-blocking — the primary question

| Route | Before | After | Blocking resources |
| --- | ---: | ---: | --- |
| `/category/wires-cables` | 1,680 ms | **660–692 ms** | `fonts.googleapis.com` (883 ms) + CSS → **CSS only** |
| `/brand/polycab/wires-cables` | 1,450 ms | **685–710 ms** | `fonts.googleapis.com` (844 ms) + CSS → **CSS only** |

**`fonts.googleapis.com` no longer appears in the render-blocking audit at all.**

### LCP phase breakdown

| Route | Phase | Before | After |
| --- | --- | ---: | ---: |
| `/brand/polycab/wires-cables` | Render delay | 3,750 ms | **2,523 ms** (−1,227 ms) |
| `/category/wires-cables` | Render delay | 3,926 ms | **3,421 ms** (−505 ms) |
| `/category/wires-cables` | FCP | 3.96 s | **2.89 s** (−1.07 s) |

Load delay and load time remain 0 ms — images stay off the critical path.

### Mobile Lighthouse

Before = Prompt 3.5 production, median of 3. After = this pass, median of 3
(median of 5 for the two starred routes). SEO **100 on every route, before and
after**.

| Route | Perf | LCP | CLS | TBT | Speed Index |
| --- | --- | --- | --- | --- | --- |
| `/` | 70 → 68 | 4.69 → **3.98 s** | 0 → 0 | 93 → *noisy* | 6.00 → 5.88 s |
| `/category/wires-cables` * | 69 → 67 | 4.54 → **4.03 s** | 0 → 0 | 225 → 535 ms | 5.16 → **4.46 s** |
| `/category/circuit-protection` | 66 → 66 | 4.54 → **4.22 s** | 0 → 0 | 315 → *noisy* | 5.22 → **3.90 s** |
| `/brand/finolex` | 72 → 65 | 4.53 → **4.23 s** | 0 → 0 | 0 → *noisy* | 5.19 → **4.23 s** |
| `/brand/polycab/wires-cables` * | 75 → **78** | 4.39 → **3.30 s** | 0 → 0.158 | 0 → 187 ms | 3.94 → **3.03 s** |

**LCP improved on every single route**, in every measurement round, by
0.32–1.09 s.

> **Measurement caveat, stated plainly.** The host was heavily contended during
> this session (31 concurrent node/chrome processes belonging to the user's own
> browser, which was not touched). TBT and the Performance score swung wildly
> between identical runs — e.g. `/brand/finolex` TBT of [4867, 1253, 8591] ms
> and `/` of [6358, 2577, 3269] ms. Those figures measure the host, not the
> site, and the Performance-score column should **not** be read as a regression.
> The two starred rows were re-measured once the machine settled and show tight
> spreads (wires-cables TBT [371, 535, 495, 705, 628]). LCP, FCP and
> render-blocking savings were stable across every round and are the metrics
> this pass targeted. The PageSpeed Insights API was tried as a
> contention-free cross-check but its keyless daily quota was exhausted.

---

## 9. Deferred / remaining

### P1 — font-swap CLS on commercial hub routes

Diagnosed here, **not fixed** (see below).

| Route | CLS | Shift |
| --- | ---: | --- |
| `/brand/polycab/wires-cables` | 0.1584 | single shift at 5,431 ms |
| `/brand/anchor/switches-sockets` | 0.0709 | single shift at 2,896 ms |
| `/category/wires-cables` | 0.0027 | negligible |

**Confirmed cause:** blocking all `.woff2` requests drives CLS to **0** on both
hubs. It is the `font-display: swap` reflow — text laid out in the fallback,
then re-laid out in Inter, moving `SECTION.mt-10`, `A.rounded-lg` and
`DIV.mt-6.flex` down by 32–94 px.

**This is pre-existing, not introduced here.** The same magnitudes appear in
earlier data: `/brand/anchor/switches-sockets` measured **0.071 in the Prompt
3.5 _before_ run** (on Google Fonts), and 0.158 appeared on the Polycab hub in a
Prompt 3.5 after-run. What changed is consistency: fonts now arrive sooner, so
the swap lands inside the measurement window more reliably. That also means it
is more likely to affect real users, which is why it is P1 rather than P2.

**Why it was not fixed here.** The remedy is a metric-matched fallback
`@font-face`, and Phase 5 says not to spend significant time on metric
overrides. The measurement shows why it is not a one-liner — Inter needs a
different `size-adjust` per platform fallback:

| Fallback | Width @100px | `size-adjust` to match Inter |
| --- | ---: | ---: |
| Inter (target) | 3697.56 | — |
| Arial / Helvetica / `sans-serif` | 3512.94 | **105.26 %** |
| Segoe UI | 3448.34 | **107.23 %** |
| Roboto / `-apple-system` / BlinkMacSystemFont | 3231.49 | **114.42 %** |

Inter metrics for the override: ascent 97, descent 24 (at 100px).
A correct fix needs a fallback face pinned via `local()` so the platform cannot
substitute a differently-metricked font, then verification that vertical rhythm
is unchanged. That is a focused follow-up, and the numbers above make it a
short one.

### P1 — carried forward from Prompt 3.5

- **Main CSS is now the only render blocker** (660–710 ms, 20.63 KB gzip, ~18 KB
  unused). Needs route-level CSS splitting or critical-CSS extraction.
- **`framer-motion` is statically imported by ~45 components**, keeping
  `animation-vendor` (116 KB / 38 KB gz) eager on every route; Lighthouse
  attributes ~35 KB of unused JS to it. **Explicitly deferred by Phase 7** — it
  is a real route-splitting refactor, not a small pass.
- 29 pre-existing TypeScript errors; still no typecheck release gate.

### P2 — carried forward

- Homepage mobile video is 11.48 MB and is the homepage LCP element.
- Pre-existing `hub-anchor-switches` browser-test failure (two Anchor SKUs
  differing only by a `-b` suffix tie in sort order).
- `src/App.css` is dead Vite scaffold and can be deleted whenever convenient.
