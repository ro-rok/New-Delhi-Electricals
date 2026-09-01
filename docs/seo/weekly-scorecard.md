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
| 1 | | PENDING | PENDING | PENDING | | | | | | | PENDING | | 5 | Prompt 4 release week |
| 2 | | | | | | | | | | | | | | |
| 3 | | | | | | | | | | | | | | |
| 4 | | | | | | | | | | | | | | |

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
