# Keyword Clusters and Opportunity Model

## Opportunity Score / 100

This is a **derived strategy score**, not a SEMrush metric.

Weights:

| Factor | Weight |
|---|---:|
| Business relevance | 20 |
| Commercial intent | 15 |
| Conversion likelihood | 15 |
| Existing authority/current rank | 10 |
| Search volume | 10 |
| Keyword difficulty / rankability | 10 |
| SERP opportunity | 10 |
| Implementation effort | 5 |
| Delhi NCR/local fit | 5 |

Volume is deliberately capped at 10/100 so a high-volume vanity query cannot dominate a high-value local quotation query.

## P0 cluster — Finolex wires & cables

**Recommended owner:** `/brand/finolex/wires-cables`

Core evidence:
- Finolex wire price — 3,600 / KD 17
- Finolex wire price list — 1,600 / KD 14
- Finolex wire dealer in Delhi — 110 / KD 12
- Finolex electrical wire — 260 / KD 18
- Current NDE ranking: `finolex dealers in delhi` at #29 on `/brand/finolex`

SERP evidence for `finolex wire dealer in delhi`: manufacturer/directories dominate, but Shree Anant's dedicated Finolex wire page ranks #5. This is a realistic specialist-page model.

Do **not** create separate dealer, price, price-list, cable and Delhi URLs. One strong range hub should own the cluster.

## P0 cluster — Polycab wires & cables

**Recommended owner:** `/brand/polycab/wires-cables`

Core evidence:
- Polycab wire price — 12,100 / KD 22
- Polycab wire price list — 8,100 / KD 19
- Polycab wire dealer in Delhi — 110 / KD 15
- Polycab house wire — 480 / KD 18

SERP evidence: local/specialist provider pages rank #2, #3, #7 and #10 for `polycab wire dealer in delhi`, so this is not a manufacturer-only SERP.

## P0 cluster — Havells wires & cables

**Recommended owner:** `/brand/havells/wires-cables`

Core evidence:
- Havells wire — 9,900 / KD 27
- Havells wire price — 2,400 / KD 26
- Havells wire price list — 2,900 / KD 30
- Havells wire dealer in Delhi — 20 (low volume but high local conversion fit)

## P0 cluster — Anchor switches & sockets

**Recommended owner:** `/brand/anchor/switches-sockets`

Core evidence:
- Anchor switches — 22,200 / KD 31
- Anchor modular switches — 2,400 / KD 30
- Anchor sockets — 880 / KD 23
- Anchor switch price — 2,900 / KD 28

Important: generic `anchor in delhi` is ambiguous and polluted by presenter/news-anchor intent. Target explicit electrical product terms.

## P0/P1 cluster — Circuit protection

**Existing owner first:** `/category/circuit-protection`

Core evidence:
- RCCB — 27,100 / KD 21
- RCCB price — 9,900 / KD 21
- MCB — 40,500 / KD 45
- MCB price — 9,900 / KD 36

Because RCCB is substantially easier than MCB, strengthen the existing circuit-protection page around RCCB/MCB taxonomy first. A dedicated RCCB child page can be created later if inventory depth and GSC query separation justify it.

### Havells circuit protection
Proposed owner: `/brand/havells/circuit-protection`

- Havells MCB — 2,900 / KD 31
- Havells MCB price — 720 / KD 20
- Havells MCB 32 amp price — 1,600 / KD 22; competitor Shree Anant ranks #14

## P1 cluster — Switches & sockets

**Existing owner:** `/category/switches-sockets`

- Modular switches — 2,900 / KD 29
- Modular switch price — 1,600 / KD 23
- Switches and sockets — 8,100 / KD 36

Keep generic modular-switch intent on the existing category in sprint one; do not split merely for keyword matching.

### Havells switches
Proposed owner: `/brand/havells/switches-sockets`
- Havells switches — 4,400 / KD 31
- Havells modular switches — 590 / KD 23

## P1 cluster — Water heaters

**Existing owner:** `/category/geysers-water-heaters`

- Water heater — 22,200 / KD 31
- Geyser — 201,000 / KD 34

Head-term volume is huge but broad. Do not let it outrank higher-converting wire/dealer work.

### Havells water heaters
Proposed owner: `/brand/havells/water-heaters`
- Havells water heater — 12,100 / KD 30
- Havells geyser — 18,100 / KD 34

## P1 cluster — Local Delhi/NCR

**Existing owner:** `/`

- Electrical shops in Delhi — 590 / KD 21
- Electrical company in Delhi — 320 / KD 23; NDE #46
- Electrical dealers near me — 210 / KD 30
- Electrical wholesalers near me — 4,400 / KD 32; Shree Anant #10

The homepage should own shop/dealer/wholesale/local intent. Do not create separate synonym pages.

## Location-page thresholds

- **Gurgaon:** 260 / KD 24 → conditional page
- **Noida:** 110 / KD 28 → conditional page
- **Ghaziabad:** 50 → hub mention first
- **Faridabad:** 20 → hub mention first
- **Gurugram exact:** 0 → do not duplicate Gurgaon page

## Patterns verified by SEMrush

Patterns with actual demand:
1. `[brand] wire price`
2. `[brand] wire price list`
3. `[brand] wire dealer in delhi`
4. `[brand] dealer in delhi` — especially Havells
5. `[brand] modular switches`
6. `[brand] mcb price`
7. `[product type] price`
8. `best [product] for house/home`
9. `electrical shops in [city]`
10. `electrical wholesalers near me`

Patterns **not** supported strongly enough for sprint-one page multiplication:
- `[brand] authorised dealer delhi` as a standalone page
- generic `modular switches dealer delhi`
- Lauritz Knudsen × MCB/circuit-protection pages
- every city × every brand
- Gurugram duplicate pages

## Factual-language guardrail

The business handoff says **authorised dealer**. Several valuable keywords use **distributor**. Do not optimize copy to claim “distributor” unless that appointment is separately verified. Search demand never overrides factual accuracy.
