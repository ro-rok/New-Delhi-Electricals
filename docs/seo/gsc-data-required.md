# Google Search Console Data Status and Required Export

## Status

**GSC DATA UNAVAILABLE — STILL PENDING AS OF 2026-09-01 (Prompt 5, Day 0).**

Nothing here is fabricated. No clicks, impressions, CTR, average-position or URL-Inspection value
appears anywhere in `docs/seo/` unless it came from a real export.

### What changed at Day 0: the property is almost certainly already verified

Previous prompts recorded "no GSC connector" and stopped there. A DNS check on 2026-09-01 found a
live verification token on the apex domain:

```
newdelhielectricals.com  TXT  "google-site-verification=0D5sMkb9kvf4guCF1nvGSIyrYR7FxkzCCX8hQsELSHs"
```

That token verifies a **Domain property**, not a URL-prefix property. Two consequences:

1. **Use the Domain property `newdelhielectricals.com`** when exporting. It aggregates www and
   non-www, http and https, into one dataset. A URL-prefix property for
   `https://www.newdelhielectricals.com/` would silently exclude any data attributed to the other
   three variants and would understate the baseline.
2. **The blocker is access, not setup.** Someone holds this property. The export below can be
   produced today by whoever owns that Google account.

Confirmed alongside it at Day 0: the site has no `gtag.js`, no GTM container and no GA4
measurement ID. Conversion analytics runs entirely through Vercel Analytics custom events
(`frontend/src/lib/conversionTracking.ts`). Requests for "GA4 data" cannot be met; ask for the
Vercel Analytics events view instead.

## Exact export needed

Export **Google Search Console → Performance → Search results** for:
1. Last 28 days
2. Previous 28 days comparison
3. Last 3 months
4. Last 6 months (optional but useful)

For each period export:

### Queries
- Query
- Clicks
- Impressions
- CTR
- Position

### Pages
- Page
- Clicks
- Impressions
- CTR
- Position

Also export or screenshot:
- Countries (India)
- Devices
- Search appearance where material
- Page indexing summary
- submitted sitemap status

CSV exports are enough. Once present, merge them into the SEMrush master rather than replacing SEMrush metrics.

## GSC opportunity rules to apply

- Position 4–10 + high impressions → immediate title/content/internal-link optimization
- Position 11–20 → strong near-term expansion candidates
- High impressions + low CTR → title/meta/SERP-intent review
- Same query across multiple URLs → cannibalization analysis
- Commercial query with no matching commercial landing page → page-map candidate
- Product pages with sustained zero impressions after sufficient recrawl time → indexability review
