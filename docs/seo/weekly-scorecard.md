# Weekly Scorecard

Measurement framework created during Prompt 4, 2026-09-01.

> ## GSC DATA PENDING
>
> Google Search Console is not connected to this research environment. **No click, impression,
> CTR, position or index-coverage figure in this document is filled in, and none may be
> estimated, inferred or back-calculated.** See `gsc-data-required.md` for the export needed.
>
> Every cell below is either a real measurement or `PENDING`. There is no third option.

---

## Measurement access — verified 2026-09-01

The state of each data source, checked rather than assumed. A source that is not connected
produces `PENDING` rows below, never an estimate.

| Source | Status | Evidence | What it unblocks |
|---|---|---|---|
| **Google Search Console** | Property almost certainly **verified**, but **not readable from this environment** | `google-site-verification=0D5sMkb9kvf4guCF1nvGSIyrYR7FxkzCCX8hQsELSHs` is live as a TXT record on the apex domain. That is a **Domain property** (`sc-domain:newdelhielectricals.com`), covering www + non-www, http + https | Clicks, impressions, CTR, position, indexation, URL Inspection — all `PENDING` |
| **GA4** | **Not installed** | No `gtag.js`, no GTM container, no `G-` measurement ID anywhere in `frontend/` | Nothing. There is no GA4 to read |
| **Analytics (actual)** | **Vercel Analytics + custom events, live** | `@vercel/analytics` v2 in `frontend/package.json`; events dispatched from `frontend/src/lib/conversionTracking.ts` | WhatsApp / quote / phone conversion counts — readable in the Vercel dashboard, not from this environment |
| **Internal test-traffic exclusion** | **Live (2026-09-01)** | Persistent first-party flag `localStorage["nde_internal_analytics"]`; `?nde_internal=1` on to enable, `?nde_internal=0` to disable. Suppresses all seven conversion events **and** Vercel page/session analytics for that browser (`frontend/src/lib/internalAnalytics.ts`) | The owner's own QA visits stop inflating WhatsApp / quote / phone counts and Vercel page views. No IP exclusion. See `conversion-tracking.md` |
| **SEMrush** | **No API key present**; prior exports are on disk | `docs/seo/semrush-*.csv`, India desktop, 2026-08-30 | Position tracking requires the owner's logged-in session |
| **Google Business Profile** | **Not readable**; public presence unconfirmed from here | A **Mappls/MapmyIndia** listing exists at *30, Ground Floor, Maharishi Dayanand Marg, Corner Market* — note "30" vs the site's "30 A" | GBP audit requires owner sign-in |

**The single highest-value unblock is a Search Console export.** Everything in the ranking and
indexation half of this scorecard stays `PENDING` until it arrives.

---

## How to use this

One row per week, added on the same weekday each time. Fill only what you can measure. A week
where most cells read `PENDING` is a normal week early on and should be recorded as such rather
than padded.

Two rules that matter more than the numbers:

1. **Impressions are not a result.** A rise in impressions for queries that will never buy from a
   Delhi dealer is noise. Non-brand *commercial* impressions and enquiries are the signal.
2. **Do not read a trend from fewer than four readings.** New URLs move erratically for weeks.

---

## Primary metrics — the ones that pay

| Metric | Source | Cadence | Notes |
|---|---|---|---|
| Organic clicks | GSC | Weekly | `PENDING` |
| Non-brand organic clicks | GSC | Weekly | Exclude "new delhi electricals" and misspellings. `PENDING` |
| Commercial-page clicks | GSC, filtered to `/category/*`, `/brand/*` | Weekly | The money-page number. `PENDING` |
| **WhatsApp enquiries started** | `whatsapp_enquiry_start` conversion event | Weekly | **Measurable now** |
| WhatsApp clicks by page type | `whatsapp_click`, split by `page_type` | Weekly | Now split into `home`, `category`, `brand`, `commercial-hub`, `product`, **`guide`**, `guides-index` |
| Quotation starts | `quote_enquiry_start` | Weekly | Measurable now |
| Quotation submits | `quote_enquiry_submit` | Weekly | Measurable now |
| Contact form submits | `contact_form_submit` | Weekly | Measurable now |
| Phone clicks | `phone_click` | Weekly | Measurable now |

All nine conversion rows above exclude the owner's own test traffic: any browser marked with
`?nde_internal=1` is dropped from both the custom events and Vercel page analytics before
dispatch (`conversion-tracking.md` → "Internal test mode"). This is device-level, not IP-level,
so the owner must enable it once per browser used for QA. GSC is independent of this and is
unaffected.

## Secondary metrics — leading indicators

| Metric | Source | Cadence | Notes |
|---|---|---|---|
| Keywords in top 20 | GSC / SEMrush | Weekly | `PENDING` for GSC; SEMrush baseline 22 keywords (2026-08-30) |
| Keywords in top 10 | GSC / SEMrush | Weekly | SEMrush baseline: 1 |
| Keywords in top 3 | GSC / SEMrush | Weekly | SEMrush baseline: 1 |
| Commercial landing pages gaining impressions | GSC | Weekly | `PENDING` |
| Guide organic sessions | Analytics | Weekly | Zero until indexed |
| Guide → commercial-page click-through | Analytics | Weekly | Does the content actually feed the catalogue? |
| Indexed quality pages | GSC coverage | Weekly | `PENDING`. Generated indexable routes: **1,978** |
| New referring domains | SEMrush / manual log | Weekly | Baseline **40** (2026-08-30). Count only domains passing the quality filter in `link-building-opportunities.md` |
| Guides published | Repo | Weekly | **5** at Prompt 4 release |
| Outreach sent / replied / linked | Manual log | Weekly | Three separate numbers; the third is the only one that counts |

---

## Weekly log

| Week | Date | Organic clicks | Non-brand clicks | Commercial clicks | WhatsApp starts | Quote starts | Quote submits | Top 20 | Top 10 | Top 3 | Indexed | New RDs | Guides live | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Baseline | 2026-08-30 | PENDING | PENDING | PENDING | — | — | — | 22 | 1 | 1 | PENDING | 40 (total) | 0 | SEMrush baseline before Prompt 4. Organic traffic estimate ~50/mo, Authority Score 7 |
| Day 0 | 2026-09-01 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | 5 | Prompt 4 released 22:57 IST **today**. Guides have been live for hours, not days — zero GSC data is the expected and correct reading, not a failure. Crawlability verified: `checkpoints/day-0.md`, 18/18 watchlist URLs 200 / self-canonical / indexable / in sitemap; 1,978 sitemap URLs live, all www |
| 1 | | PENDING | PENDING | PENDING | | | | | | | PENDING | | 5 | Day-7 review |
| 2 | | | | | | | | | | | | | | |
| 3 | | | | | | | | | | | | | | |
| 4 | | | | | | | | | | | | | | |

---

## Crawlability checkpoint log

Produced by `npm run seo:checkpoint -- --label day-N` (in `frontend/`), which crawls the strategic
watchlist as Googlebot and writes `docs/seo/checkpoints/day-N.{json,md}`.

This measures **crawlability and on-page state**, which is verifiable without Search Console. It
does **not** measure indexation — that column stays `PENDING` until a GSC export exists. Do not
let a clean checkpoint be mistaken for "Google has indexed the pages".

| Checkpoint | Date | Watchlist URLs OK | Sitemap URLs | Problems |
|---|---|---|---:|---|
| Day 0 | 2026-09-01 | 18 / 18 | 1,978 | None |
| Day 7 | | | | |
| Day 14 | | | | |
| Day 21 | | | | |
| Day 30 | | | | |

Two thin pages noted at Day 0, recorded for observation only — **no action until GSC shows
whether they receive impressions**: `/category/geysers` (165 SSR words) and `/brand/finolex`
(464). Both are indexable and internally linked; thinness is only a problem if the data says so.

---

## Guide-level tracking

One row per guide, filled once each is indexed. Ranking columns stay `PENDING` until GSC exists.

| Guide | Primary keyword | Vol | KD | Position | Impressions | Clicks | Sessions | → commercial clicks | WhatsApp starts |
|---|---|---:|---:|---|---|---|---|---|---|
| `/guides/best-wire-for-house-wiring` | which wire is best for house wiring | 590 | 7 | PENDING | PENDING | PENDING | | | |
| `/guides/genuine-finolex-wire` | finolex wire original | 140 | 14 | PENDING | PENDING | PENDING | | | |
| `/guides/mcb-vs-mccb` | what is the difference between mcb and mccb | 210 | 10 | PENDING | PENDING | PENDING | | | |
| `/guides/how-to-choose-mcb-for-home` | which mcb is best for home | 210 | 9 | PENDING | PENDING | PENDING | | | |
| `/guides/rccb-explained` | what is rccb in electrical | 480 | 21 | PENDING | PENDING | PENDING | | | |

Total addressable volume across the five primary keywords: **1,630/month**, plus roughly 1,350
from merged secondary variants. That is a ceiling, not a forecast, and it is recorded here so
nobody later mistakes it for a projection.

---

## Backlink log

| Week | Referring domains | New this week | Domain acquired | Type | Target page | How |
|---|---:|---:|---|---|---|---|
| Baseline | 40 | — | — | — | — | SEMrush, 2026-08-30 |

Competitor benchmark, same date: Shree Anant 120 · Entergy 68 · Ankit 154 · Debak 154.

Do not treat catching up on count as the goal. Shree Anant takes ~3,083 visits from 120 domains
while Ankit takes ~63 from 154 — relevance and page architecture do the work, not volume.

---

## Review questions — ask these monthly, not weekly

1. Are commercial pages gaining non-brand impressions, or only the guides?
2. Do guide readers reach a commercial page, and do any of them enquire?
3. Which guide converts best per session, and what does that say about what to write next?
4. Did any outreach turn into a link, or only into a sent message?
5. Is anything ranking for a query that will never buy from a Delhi dealer? If so, stop feeding it.
6. Is any catalogue price quoted in a guide now out of date?

---

## What must never appear in this document

- An estimated, modelled or inferred GSC figure presented as a measurement.
- A ranking or traffic improvement claimed before four readings support it.
- A backlink counted before the live link has been verified on the page.
- Impression growth reported as success without the commercial and enquiry columns beside it.
