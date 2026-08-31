# SEMrush snapshot and data-access record

Captured: 2026-08-28 (Asia/Kolkata)  
Database: India (`in`)  
Target: `newdelhielectricals.com`

## Preserved verified metrics

| Metric | Value | Source / scope |
| --- | ---: | --- |
| Semrush Rank | 1,374,538 | Domain Overview `domain_rank`, India database |
| Ranking organic keywords | 22 | Semrush estimate, India database |
| Estimated organic traffic | 50/month | Semrush estimate, **not** analytics or GSC clicks |
| Estimated organic traffic cost | 10 | Semrush estimate; currency/unit not supplied by the connector output |
| Keywords in positions 1–3 | 1 | Semrush estimate |
| Keywords in positions 4–10 | 0 | Semrush estimate |
| Keywords in positions 11–20 | 1 | Semrush estimate |
| Keywords in positions 21–30 | 7 | Semrush estimate |
| Keywords in positions 31–40 | 4 | Semrush estimate |
| Keywords in positions 41–50 | 6 | Semrush estimate |
| Commercial-intent positions | 7 | Semrush estimate |
| Transactional-intent positions | 8 | Semrush estimate |
| Informational-intent positions | 5 | Semrush estimate |
| Local-pack keywords | 13 | Semrush estimate; this is a SERP-feature count, not a local ranking or map-pack placement |
| Shopping-ad keywords | 0 | Semrush estimate |
| Authority Score | 7 | Backlink Analytics overview |
| Backlinks | 43 | Backlink Analytics overview |
| Referring domains | 34 | Backlink Analytics overview |
| Follow / nofollow backlinks | 19 / 22 | Backlink Analytics overview |

## Queries that could not be retrieved

The Semrush connector accepted the account but returned `ERROR 132 :: API UNITS BALANCE IS ZERO` for:

- Organic Research (ranking keyword and landing-page export)
- Organic Competitors
- Keyword Gap
- Keyword Magic / broad match, phrase match, related terms, questions, keyword difficulty and CPC exports
- Projects list

Consequently this repository contains **no invented volume, KD, CPC, ranking-keyword, competitor-traffic or keyword-gap values**. The Premium web subscription and connector API units are separate access paths; the in-app browser session was also signed out, so it could not be used as a substitute.

## Phase 2 connector check — 2026-08-28

Phase 2 research was started after the account dashboard showed a **Standard API balance of 90 units**. The connector was retested immediately:

- `domain_rank` succeeded and returned the same live India snapshot preserved above.
- `resource_organic` (25 rows) failed with `403 / ERROR 132 / API UNITS BALANCE IS ZERO`.
- Prior Organic Competitors calls returned the same error.

The discrepancy means the connected Semrush app is not currently spending from the API account shown in the dashboard (or its credentials/balance cache are stale). Do not treat the dashboard balance as evidence that this connector can execute research until a paid research endpoint succeeds.

View available Semrush API-unit options at <https://www.semrush.com/mcp-access>.

## Google Search Console status

`docs/seo/seo-baseline.md` records that the property was connected on 2026-08-27 but performance history and an accessible export were insufficient. No GSC query/page data is present in the workspace or exposed through a connector. Therefore there are no defensible GSC quick wins, cannibalisation findings, CTR calculations, index coverage statistics or query-to-page mappings yet.

## Exact rerun procedure when data is available

1. Export 16 months of GSC Performance by **query + page**, Web, India; also export pages, countries and devices separately. Save the unmodified files under `docs/seo/source-data/gsc/` with the date in the filename.
2. Run Organic Research for the root domain (India, desktop and mobile): export the top 100 keywords and all positions 4–20 with keyword, position, previous position, volume, KD, CPC, intent, traffic, URL and SERP features.
3. Run Keyword Magic in India for each seed in the brief, including broad, phrase, related and questions. Export the filtered result sets and add them to the master CSV rather than overwriting source files.
4. Run Organic Competitors, then Keyword Gap against the three most relevant local competitors, with missing and weak keywords split apart.
5. Replace only the `unavailable` cells in `semrush-keyword-master.csv`; retain this snapshot as the dated baseline.
