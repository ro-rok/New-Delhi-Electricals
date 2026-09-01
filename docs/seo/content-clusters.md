# Content Clusters

Prompt 4. Written 2026-09-01.

Every cluster is built around a commercial page that is **live in production today**. No cluster
targets a rejected or deferred hub. Verified against the production catalogue API on 2026-09-01
(1,986 active records) and against `docs/seo/semrush-content-opportunities.csv`.

Route family: `/guides/<slug>`, with a server-rendered index at `/guides`.

---

## Cluster A — Wires & cables

**Primary commercial parent:** `/category/wires-cables`
**Secondary money pages:** `/brand/polycab/wires-cables`, `/brand/finolex/wires-cables`

Catalogue depth backing this cluster: 24 house-wire records — Finolex FR (0.75–6 sq mm) and FRLS
(10–35 sq mm), Polycab FR-LSH (0.75–16 sq mm), all single-core copper, PVC, 1100 V, in 90 m,
100 m, 200 m and 300 m coils.

| Guide | Status | Primary keyword | Vol | KD |
|---|---|---|---:|---:|
| [/guides/best-wire-for-house-wiring](https://www.newdelhielectricals.com/guides/best-wire-for-house-wiring) | Published | which wire is best for house wiring | 590 | 7 |
| [/guides/genuine-finolex-wire](https://www.newdelhielectricals.com/guides/genuine-finolex-wire) | Published | finolex wire original | 140 | 14 |
| FR / FRLS / FR-LSH insulation reference | Deferred to week 2 | why are electric wires coated with pvc | 720 | 21 |

The house-wiring guide absorbs the whole five-query intent cluster (`which wire is best…`,
`which company wire is best…`, `which is the best wire…`, `…in india`, `which cable is best…`),
which SEMrush shows is one intent at 590/590/590/480/170 volume. **One guide, not five.**

The insulation guide is deferred deliberately: the house-wiring guide already answers the
insulation-grade decision at buying depth, so a second URL only earns its place if it goes
materially deeper (compound chemistry, standards, high-rise specification practice). Publishing
it thin would cannibalise a stronger page.

---

## Cluster B — Circuit protection

**Primary commercial parent:** `/category/circuit-protection`
**Secondary money pages:** none — Prompt 3 correctly rejected `/brand/havells/circuit-protection`,
and no guide links to it.

Catalogue depth backing this cluster: 132 Lauritz Knudsen Tripper records — 32 MCBs (6–63 A,
C curve, 1–4 pole), 18 RCCBs (25/40/63 A × 30/100/300 mA), 48 RCBOs, 9 isolators (40/63/100 A),
12 ACCLs, 8 three-phase ACCLs, 5 modular changeovers.

| Guide | Status | Primary keyword | Vol | KD |
|---|---|---|---:|---:|
| [/guides/mcb-vs-mccb](https://www.newdelhielectricals.com/guides/mcb-vs-mccb) | Published | what is the difference between mcb and mccb | 210 | 10 |
| [/guides/how-to-choose-mcb-for-home](https://www.newdelhielectricals.com/guides/how-to-choose-mcb-for-home) | Published | which mcb is best for home | 210 | 9 |
| [/guides/rccb-explained](https://www.newdelhielectricals.com/guides/rccb-explained) | Published | what is rccb in electrical | 480 | 21 |

Two merge decisions, both taken on live SERP evidence rather than by default:

- **`which mcb is best for 1.5 ton ac` (110 / KD 15) merged into the MCB selection guide.**
  The ranking results for the AC query are either full MCB selection guides that answer it in a
  section (including Lauritz Knudsen's own) or thin single-answer FAQ pages. The task is the same
  task — pick a rating for a circuit — so it is a prominent section, not a second URL.
- **`how rccb works` (110 / KD 12) merged into the RCCB guide.** SERPs for `what is rccb in
  electrical` and `how rccb works` return the same explainer pages. Splitting them would create
  two pages competing for one intent.

An honest constraint recorded here: **the catalogue contains no MCCBs.** The MCB vs MCCB guide
says so plainly and offers to quote against a specification rather than implying stock.

---

## Cluster C — Switches & sockets

**Primary commercial parent:** `/category/switches-sockets`
**Money pages:** `/brand/anchor/switches-sockets`, `/brand/havells/switches-sockets`

**No guide published, and none scheduled without new evidence.**

Every switch and socket keyword in `semrush-keyword-master.csv` is commercial or navigational and
already routes to a live money page: `anchor switches` (22,200), `havells switches` (4,400),
`modular switches` (2,900), `anchor switch price` (2,900), `anchor modular switches` (2,400),
`modular switch price` (1,600), `switches and sockets` (8,100). Prompt 2 surfaced **no verified
informational query** in this cluster.

Writing a switch guide now would mean inventing a topic to fill a cluster, which Phase 5 of the
brief explicitly forbids. Week 3 of the calendar carries a keyword/SERP research task to test one
hypothesis — module-count and plate planning for a room schedule — against real demand. If the
demand is not there, the cluster stays content-free and the money pages carry it.

---

## Cluster D — Water heaters

**Primary commercial parent:** `/category/geysers`
**Status: not started, and correctly so.**

`which is the best water heater in india` has 260 volume at KD 22, but the catalogue holds
**exactly one geyser record** (Havells Carlo 5 L, 3000 W). A buying guide pointing at a
one-product category converts nothing and invites a thin-content assessment of the category page
itself. Revisit when the catalogue carries a real range.

Note for the record: the commercial category route is `/category/geysers`, **not**
`/category/geysers-water-heaters`. `/category/water-heaters` 301s to it in `vercel.json`. Any
future content in this cluster must link to `/category/geysers`.

---

## Cluster hygiene rules

1. One primary commercial parent per guide, and it must be a route the build actually generates.
   `npm run test:seo` fails the build if a guide links a path with no generated document.
2. A query variation is not an article. Merge unless live SERPs show distinct page types.
3. No guide may link to `/brand/havells/wires-cables`, `/brand/havells/circuit-protection`,
   `/brand/havells/water-heaters`, `/category/wires-cables/house-wires`, or any Gurgaon/Noida
   location page. None of these exist.
4. A cluster with no verified informational demand gets no content.
