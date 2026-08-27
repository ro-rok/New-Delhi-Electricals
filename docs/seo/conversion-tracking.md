# Conversion Tracking

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
- For office/admin traffic in production, configure the analytics property or downstream reporting to exclude known internal test sessions or network traffic. No stable office IP was available in the repository, so no IP value was invented.
- Admin paths are tagged `X-Robots-Tag: noindex, nofollow, noarchive`; this is indexation control, not analytics filtering.
- Keep test submissions visibly labelled in the backend inquiry workflow so business reporting can exclude them without sending test identity through analytics parameters.
