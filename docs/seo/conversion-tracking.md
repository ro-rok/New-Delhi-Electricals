# Conversion Tracking

## 2026-08-29 production validation status

Production browser hydration completed without errors. The exact event-dispatch contract was exercised by the 15-test browser suite without sending a customer enquiry or WhatsApp message: generic WhatsApp is `whatsapp_click` then `whatsapp_enquiry_start`; cart quotation handoff is `quote_enquiry_start`, `whatsapp_click`, `whatsapp_enquiry_start`, `quote_enquiry_handoff`; telephone is `phone_click`. The assertions reject PII, query text and WhatsApp-message contents. This proves application dispatch, not Vercel account ingestion; account-level ingestion remains unverified.

## Implemented analytics layer

`frontend/src/lib/conversionTracking.ts` sends named custom events through the existing `@vercel/analytics` integration. `frontend/src/App.tsx` uses one capturing click listener, registered once, to classify WhatsApp and telephone CTAs. This avoids event duplication from React rerenders and covers CTA components that open WhatsApp imperatively.

The following events are implemented:

- `whatsapp_click`: a WhatsApp CTA was activated.
- `whatsapp_enquiry_start`: the WhatsApp enquiry flow was started.
- `quote_enquiry_start`: the contact or cart quotation form was submitted for validation/processing.
- `quote_enquiry_submit`: a validated contact enquiry was accepted by the API or the cart quotation was handed off to WhatsApp.
- `contact_form_submit`: the contact API returned success.
- `phone_click`: a `tel:` link was activated.

## Parameters

Every event includes:

- `page_type`: home, category, brand, product, search, cart or another route-derived type.
- `page_path`: pathname only; query strings and message content are excluded.

CTA events may include `cta_location`. Cart quotation events include `item_count`. No form values are passed.

The implementation deliberately does not send names, email addresses, telephone numbers, physical addresses, form messages, WhatsApp message text or other PII.

## Event locations

- Global CTA listener: `frontend/src/App.tsx`.
- Shared event wrapper: `frontend/src/lib/conversionTracking.ts`.
- Contact form start/success: `frontend/src/pages/ContactPage.tsx`.
- Cart quotation start/handoff: `frontend/src/pages/CartPage.tsx`.
- Vercel page-view script: `frontend/src/App.tsx`.

## Verification

The production build resolves `track` from the installed `@vercel/analytics/react` package. Event properties are restricted by TypeScript to scalar values supported by Vercel Analytics.

Vercel Analytics does not send production events while running in its development mode. After deployment, use the Vercel Analytics event debugger and activate each CTA once. Confirm one `whatsapp_click` and one `whatsapp_enquiry_start` per WhatsApp activation, and confirm that no form field values appear in payloads.

## Internal and development traffic

- Development builds are not production analytics traffic under the package's automatic mode.
- Admin paths are tagged `X-Robots-Tag: noindex, nofollow, noarchive`; this is indexation control, not analytics filtering.
- Keep test submissions visibly labelled in the backend inquiry workflow so business reporting can exclude them without sending test identity through analytics parameters.

## Internal test mode (persistent, first-party, no IP exclusion)

Added 2026-09-01. The owner tests the live site regularly; without an exclusion that QA
traffic inflates the WhatsApp, quote and phone counts and the Vercel page/session numbers.
IP exclusion is deliberately not used — there is no stable office IP and it would not follow
the owner between networks.

### How the owner enables it

Visit any page on the live site with `?nde_internal=1`, for example:

```
https://www.newdelhielectricals.com/?nde_internal=1
```

That browser is now marked internal **persistently** — the setting is stored as
`localStorage["nde_internal_analytics"] = "1"` and survives navigation, reload and browser
restarts. It must be done once per browser/device the owner tests from (and again if site
data is cleared). The developer console prints a one-line confirmation
(`NDE internal analytics mode enabled …`) only when the state actually changes.

### How to disable it

Visit any page with `?nde_internal=0`:

```
https://www.newdelhielectricals.com/?nde_internal=0
```

This writes `localStorage["nde_internal_analytics"] = "0"` (an explicit "normal visitor"
marker) and normal collection resumes immediately on that browser. Clearing the site's
local storage also removes the flag.

### What is excluded while internal mode is active

| Data | Excluded? | Mechanism |
|---|---|---|
| `whatsapp_click`, `whatsapp_enquiry_start`, `quote_enquiry_start`, `quote_enquiry_submit`, `quote_enquiry_handoff`, `contact_form_submit`, `phone_click` | **Yes** | `trackConversion` in `frontend/src/lib/conversionTracking.ts` checks `isInternalAnalytics()` and returns before calling Vercel `track()`. The event is **not** renamed and **not** re-tagged (`internal_test` is never sent); it simply never enters the production dataset. A local `nde:conversion` DOM event still fires with `suppressed: true` so the app and the browser tests can see what would have been sent. |
| Vercel page views / sessions | **Yes** | `<Analytics beforeSend={vercelBeforeSend}>` in `frontend/src/App.tsx`. `vercelBeforeSend` returns `null` for every event while internal mode is active, which is the vendor-supported way to cancel collection — no fork, no patched client. |
| `localhost` / `127.0.0.1` | Treated as internal automatically | `isInternalAnalytics()` returns `true` on those hosts unless the browser holds an explicit `"0"`. Production hosts are never auto-excluded. |

### Can Vercel page analytics also be excluded?

**Yes.** `@vercel/analytics` v2 exposes a `beforeSend` prop on `<Analytics>` that runs for
page views and custom events and cancels the event when it returns `null`. This is a
documented, first-party hook, so Vercel page/session analytics for internal browsers is
excluded cleanly at the application level with no custom fork or fragile workaround.

### URL, canonical and SEO safety

`applyInternalAnalyticsFlag()` runs once in `frontend/src/main.tsx` before React mounts. It
reads `?nde_internal`, updates the stored flag, then removes **only** that parameter with
`history.replaceState`, preserving the path, any other query parameters and the hash. The
parameter therefore never reaches the page-view beacon, never appears in a shared/visible
URL, never becomes an alternate SEO URL, and never touches the canonical link (which is
derived from the route path in the prerendered HTML and is unchanged). SSR output is
untouched — the helper is client-only and guarded by `typeof window`.

### GSC independence

Google Search Console reports impressions, clicks and indexation from Google's own crawl and
SERP data. It is unaffected by this flag, by `localStorage`, or by anything in the analytics
layer, and continues to report the site exactly as before.

### Tests

`frontend/tests/internal-analytics.spec.ts` covers: ordinary visitor dispatches and Vercel
stays on; `?nde_internal=1` stores the flag; the parameter is stripped (other params kept);
internal visitor suppresses custom events and Vercel collection; the state survives
navigation and reload; `?nde_internal=0` clears it; normal collection resumes; the canonical
stays clean; SSR HTML is unchanged and never contains the parameter; no PII enters storage,
the URL or any payload.
