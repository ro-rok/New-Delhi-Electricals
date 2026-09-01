# Editorial Guidelines

For everything published under `/guides`. Written during Prompt 4, 2026-09-01.

---

## 1. Why a guide exists

Every guide must do at least one of these, and say which in its manifest entry:

1. Capture useful informational demand from someone who is about to buy.
2. Support a commercial page that is **live in production**.
3. Answer the question asked immediately before a purchase decision.
4. Build topical authority for a category we actually stock.
5. Strengthen internal links toward money pages.
6. Serve electricians, contractors, builders, architects or homeowners specifically.
7. Be useful enough that someone would link to it without being asked.

A guide published for freshness, for word count, or to fill a cluster fails all seven. Do not
publish it.

**Commercial SEO outranks informational SEO.** Content exists to feed the catalogue, not to
compete with it for attention.

---

## 2. Voice

Write as an experienced Delhi electrical dealer who also knows the products technically and is
giving a customer a straight answer across the counter.

**Do:**
- Lead with the answer. The reader gets it before scrolling.
- Use the trade's actual words — sq mm, coil, module width, curve, poles, sensitivity, board
  schedule, bill of quantities — and define them the first time.
- Say what you do not know or do not stock.
- Give the reasoning behind a number, so the reader knows when the number is wrong for them.
- Be willing to say a decision does not matter much. "The brand is the least consequential
  choice" is more useful than a brand ranking.
- Let dry humour happen if it happens. Do not install it.

**Do not:**
- Write listicle padding ("In this article we will explore…").
- Hedge everything into uselessness. Give the answer, then the caveat.
- Use superlatives you cannot support.
- Repeat the keyword. If the article is about the thing, the words appear naturally.
- Pad to a target length. There is no word count.

---

## 3. What may never be fabricated

Not once, not as an example, not as an illustration:

customer stories · sales figures · project histories · years in business · test results ·
research or studies · reviews or testimonials · statistics · manufacturer claims · certifications
or awards · endorsements · stock availability · delivery promises · brand superiority

When first-hand business knowledge would materially improve a section, insert the marker inline
and keep writing:

```
[EXPERT INPUT NEEDED: <exactly what is needed, and where it should come from>]
```

The marker ships. It is honest, it is visible, and it is a work item on the calendar. A guess
dressed as a fact is not.

Two markers are currently open: the RCCB residual-current type, and the current Finolex on-pack
verification mechanism.

---

## 4. Safety — non-negotiable

Electrical content becomes dangerous when it reads as installation instructions.

**Never publish** step-by-step procedures for: working on live conductors · modifying or wiring a
distribution board · installing or replacing a breaker, RCCB or RCBO · mains connections ·
testing an energised circuit · earthing installation.

**Do publish:** product selection · what a specification means · how to read a rating · planning
and quantities · comparisons · what to have ready for a quotation.

Every guide that touches an installed device carries a visible safety callout stating that
installation and testing is work for a licensed electrician. `GuideView` renders a
`tone: 'safety'` callout with a distinct left border for exactly this.

When a device is misbehaving, the guidance is always "this is information about a fault, get it
looked at" — never "here is how to make the symptom stop".

---

## 5. Catalogue evidence

Guides earn their credibility from real products.

- Quote real SKUs, real specifications and current catalogue list prices.
- Every product path must resolve to a generated page. The SEO test fails the build otherwise.
- Label prices as **catalogue list price** and say the quoted price depends on quantity.
- Never claim stock, availability or a delivery time.
- Say plainly when we do not carry something. The MCB vs MCCB guide states that the catalogue
  holds no MCCBs; that honesty is worth more than the sale it appears to cost.

**Verify before every publish and every refresh.** Prices and slugs change. There is a check for
this in week 4 of the calendar; run it whenever a guide is edited:

```js
// verify each catalogue block against the production API before republishing
```

---

## 6. Structure

Required, in order:

1. **SEO title** — the search-facing title, in the manifest.
2. **Meta description** — what the page actually answers, ~155 characters.
3. **H1** — the human title. May differ from the SEO title. Keep under 110 characters, because
   the Article schema headline is validated against that limit.
4. **Standfirst** — the answer, in one paragraph, before anything else.
5. **Sections** — `id` + `heading`, rendered as `<h2>`, minimum three, listed in an on-page
   contents nav.
6. **A decision table** where a comparison is genuinely being made. Tables scroll horizontally
   inside their own container; the page never scrolls sideways.
7. **A catalogue block** with real products.
8. **A safety callout** where installation is anywhere near the subject.
9. **FAQs** — only questions people actually ask, answered properly. Visible, and **never emitted
   as `FAQPage` schema**; the SEO test fails a guide that emits it.
10. **CTA** — one block, at the end. See §8.
11. **Sources** — real, checkable references. `rel="noreferrer nofollow"`.
12. **Related guides** and **the commercial pages covered**.

Available blocks: `h3` · `p` · `list` (ordered or not) · `table` (columns, rows, optional caption
and note) · `callout` (`safety` or `note`) · `catalogue`.

Inline links use `[label](/path)` inside any prose string. Internal paths render as router links;
external URLs open in a new tab. This is the **only** inline syntax — no Markdown parser ships to
the browser.

---

## 7. Internal linking

- **Exactly one primary commercial parent per guide.** It is declared in the manifest, rendered in
  the article, and enforced by the SEO test.
- Secondary money pages are linked in context, where the sentence earns them.
- Link within the prose, not only in a link block at the end.
- **Anchors must be descriptive and varied.** "how to check a Finolex coil is genuine", not
  "click here" and not the same exact-match phrase five times.
- Commercial pages link back to their guides through `GuideLinkCards`, which renders **nothing**
  when no guide genuinely applies. An empty state is correct; filler links are not.
- **Never link a route that does not exist.** Specifically never:
  `/brand/havells/wires-cables` · `/brand/havells/circuit-protection` ·
  `/brand/havells/water-heaters` · `/category/wires-cables/house-wires` · any Gurgaon or Noida
  page. Water heaters are at `/category/geysers`, not `/category/geysers-water-heaters`.

---

## 8. CTAs

One CTA block per guide, at the end, offering three routes: WhatsApp with a pre-filled context
message, the commercial parent, and a quotation request.

Helpful, not aggressive. No WhatsApp button after every section. No urgency, no scarcity, no
discount language. The reader who is not ready to buy should still find the page worth reading —
that reader is the one who links to it.

WhatsApp links must carry `data-cta-location="guide_<slug>"` so the conversion event is
attributable. Guides report `page_type: 'guide'`.

---

## 9. Schema

`Article` + `BreadcrumbList` per guide. Only these properties, all truthful:

`headline` · `description` · `datePublished` · `dateModified` · `author` · `publisher` ·
`mainEntityOfPage`

- **Author and publisher are the Organization**, New Delhi Electricals. No human author is
  invented. If a named author becomes real, use the real person.
- **Dates are real.** `datePublished` is when it went live; `dateModified` changes only when the
  content actually changed. Never touch a date to look fresh.
- **No `image`** unless a real, relevant image exists on the page.
- **No `FAQPage`.** Visible FAQs without FAQ schema is a deliberate choice.
- **No rating, review or aggregateRating.** Ever.
- Prompt 1's Product schema policy is untouched by any of this.

---

## 10. Images

Use an image only when it carries information a sentence cannot.

Order of preference: real catalogue product images → a simple original diagram → a comparison
graphic → informative stock photography. Decorative photography added to satisfy a checklist is
not on the list.

The current batch ships **zero images**, on purpose: every comparison here is better as a table,
which costs nothing, causes no layout shift and reads correctly in a screen reader.

If an image is added it must have: real alt text describing the content, explicit `width` and
`height`, `loading="lazy"` below the fold, responsive delivery through the existing Cloudinary
pipeline, and no multi-megabyte master.

---

## 11. Performance

The content system stays light. Guides must not load GSAP, the cinematic homepage video, or
catalogue components, and must not add Framer Motion for decoration.

The architectural rule that keeps this true:

- `src/content/guides/manifest.ts` — titles and commercial parents. Safe to import anywhere.
- `src/content/guides/index.ts` — the article prose. **Import from the server entry and from
  `GuidePage`'s dynamic import only.** A static import from a shared component puts every article
  into the entry bundle of every route; measured, that was +22.2 kB gzip sitewide.
- The prerendered document carries the article inside its route data, so a search landing
  hydrates with no fetch and no flash.

Before shipping a guide, confirm on a guide route: no GSAP request, no `.mp4`, no catalogue API
call, CLS ≤ 0.1, no horizontal overflow at 390 px. The browser suite asserts all of these.

---

## 12. Indexation

Only finished guides get indexed. A guide is indexable **if and only if** it is in
`GUIDE_SUMMARIES`. Everything follows from that: prerender, sitemap, `index, follow`.

A draft stays out of the manifest. There is no draft state that produces a live thin page.

Never index: drafts, placeholders, empty cluster pages, tag archives, author archives, date
archives, internal search. None of these exist and none should be created.

---

## 13. Publishing checklist

- [ ] The guide does at least one of the seven jobs in §1, and it is obvious which
- [ ] One live commercial parent, declared in the manifest
- [ ] Standfirst answers the question before any scrolling
- [ ] Every catalogue SKU, price and path verified against the production API today
- [ ] No fabricated claim; any gap carries an `[EXPERT INPUT NEEDED]` marker
- [ ] Safety callout present where installation is anywhere near the subject
- [ ] No installation, panel or live-testing procedure anywhere in the text
- [ ] Internal links resolve; anchors are descriptive and varied
- [ ] One CTA block, restrained, with `data-cta-location`
- [ ] Sources are real and checkable
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build && npm run test:seo` — 0 failures
- [ ] `npm run test:browser` — no new failures
- [ ] Added to `content-implemented.md` with its keyword, SERP evidence and catalogue evidence
