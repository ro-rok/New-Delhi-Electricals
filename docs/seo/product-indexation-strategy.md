# Product Indexation Strategy

## Finding

The catalogue contains roughly 1,954 canonical product pages, but SEMrush currently sees only one product URL with a keyword ranking in the top 100:

- `/havells/hdmi-socket-1m-white`
- query `nl90053nm01w`
- position 55
- volume 110
- KD 20

This proves **some exact-model pages have genuine search value**, but it does not justify indexing every SKU.

Competitor evidence points the other way: Shree Anant gets ~77% of its estimated traffic from one strong electrical-wire family page, while dedicated family pages such as Finolex wire also perform. Family/category architecture should therefore be the indexation backbone.

## Recommended 3-tier rule

### Tier A — Index
Index when the product has:
- unique canonical identity
- unique model/SKU or meaningful product name
- useful, non-duplicated technical specifications
- real image/media
- valid brand + category
- crawlable internal links from a commercial hub
- a plausible exact-model/specification search use case
- active/current catalogue status

### Tier B — Conditional index
Meaningful variants may remain separate when the variation changes search intent, for example:
- wire sq mm / core / insulation family
- MCB ampere / pole / curve
- RCCB current/sensitivity/pole
- switch module/function
- geyser/water-heater capacity

Do not collapse technically distinct products merely because descriptions are templated.

### Tier C — Consolidate / canonicalize / noindex
Candidates:
- colour/finish-only variants with no distinct search demand
- duplicate or near-duplicate product names/specs
- pages missing useful technical attributes
- duplicate canonical collisions
- inactive/obsolete records
- pages that are fully substitutable by a stronger family hub

## Product Indexability Score / 100

| Factor | Weight |
|---|---:|
| Canonical uniqueness | 15 |
| Unique technical specification content | 20 |
| Exact model/search evidence | 20 |
| Active/current catalogue state | 15 |
| Internal-link prominence | 10 |
| Commercial value | 10 |
| Media/content completeness | 10 |

Suggested rule:
- **70–100:** index
- **50–69:** conditional; improve or monitor
- **<50:** consolidate/noindex unless GSC provides counter-evidence

## GSC refinement

Do not mass-noindex based solely on SEMrush. Once reliable post-render GSC data is available:
- keep products receiving relevant impressions/clicks
- inspect zero-impression products after sufficient recrawl time
- consolidate only when a better family/category URL satisfies the same intent

A 60–90 day observation window is a sensible operational checkpoint, not a Google rule.

## Canonical collisions

The previously identified ~36 active records with canonical collisions should be fixed, but a collision fix does not automatically earn indexation. Each record still needs to satisfy the quality rule above.
