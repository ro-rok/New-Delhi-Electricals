# Keyword clusters and commercial-intent boundaries

## Validation legend

- **A — Proven:** GSC impressions/clicks available. None yet; raw GSC export is unavailable.
- **B — Adjacent:** closely matches actual NDE categories/brands.
- **C — Competitor validated:** dedicated competitor positioning exists.
- **D — SERP validated:** commercial/local or relevant information SERP observed.
- **E — Hypothesis:** plausible but insufficient evidence; do not use alone to create a page.

## Priority clusters

| Cluster | Included searches | Intent | Validation | Page owner | Pattern confidence |
| --- | --- | --- | --- | --- | --- |
| Delhi NCR wires/cables | electrical wires supplier Delhi, cable supplier Delhi, bulk wire quote | Local commercial | B/C/D | `/category/wires-cables` | Strong |
| Polycab wires | Polycab wire dealer Delhi, Polycab cable supplier Delhi | Local commercial | B/C/D | `/brand/polycab` → possible distinct page only if proven | Strong |
| Finolex wires | Finolex wire dealer Delhi, Finolex wire supplier Delhi | Local commercial | B/D | `/brand/finolex` → possible distinct page only if proven | Moderate |
| Circuit protection | MCB dealer Delhi, RCCB supplier Delhi, RCBO quotation | Local commercial / transactional | B/D | `/category/circuit-protection` | Strong |
| Modular switches | modular switches Delhi, switches and sockets supplier | Local commercial / transactional | B/C/D | `/category/switches-sockets` | Strong |
| Plates and boxes | modular switch plates, mounting boxes, grid frames | Transactional | B | `/category/plates`, `/category/boxes` | Moderate |
| LK/Anchor/Havells catalogue | `[brand] switches`, `[brand] electrical products`, `[brand] dealer Delhi` | Commercial investigation | B; D varies by brand | Relevant brand page | Moderate |
| Geysers | water heater/ geyser catalogue, capacity enquiry | Transactional | B | `/category/geysers` | Moderate |
| Wire buying guidance | best wire for house wiring, wire grade/size questions | Informational commercial investigation | C/D | Reviewed guide → wires category | Strong |
| Protection buying guidance | MCB vs RCCB, MCB rating, RCCB selection | Informational commercial investigation | D | Reviewed guide → circuit protection | Strong |

## Pattern decisions

| Pattern | Decision | Reason |
| --- | --- | --- |
| `[brand] dealer Delhi` | Moderate | Strong commercial fit, but validate NDE’s exact right to make authorisation claims and distinguish from brand-page intent. |
| `[brand] authorised dealer Delhi` | Moderate | Use only with manufacturer evidence; never make an unsupported assertion for SEO. |
| `[brand] [category] Delhi` | Moderate | Strongest for Polycab/Finolex wires; needs GSC or distinct-SERP proof before a new URL. |
| `[category] dealer/supplier/wholesaler Delhi` | Strong | Local SERPs show first-party sellers and directories; existing categories should own this first. |
| `[category] price` | Reject as a page pattern | A single stable price page is risky if pricing changes or SERP intent is product-list/comparison; use product/category prices where accurate. |
| `[product] for home` | Moderate | Better as a buyer guide plus category CTA than a commercial landing page. |
| `[brand] × [category] × [city]` | Reject | Excessive near-duplicate doorway risk without distinct demand and fulfilment proof. |

## Cannibalisation rules

- A brand page owns brand-only intent; a category page owns generic product-category intent.
- A brand × category page can exist only after evidence proves a distinct query set, product depth and non-duplicative content.
- A product page owns exact SKU/model intent. It should be linked from category and brand pages, not replicated in landing-page copy.
- One Delhi NCR location proposition is preferable to a city-template matrix.
