# Production Validation

Date: not performed

## Deployment

- Status: blocked before deployment.
- Evaluated commit: `a94f126da1afc4bc5279759e579ed119f998531a`.
- Reason: final local release gate failed; see `pre-deployment-validation.md`.

## Unperformed checks

The following are intentionally unrecorded rather than inferred from old production: HTTP status/redirect matrix, raw SSR HTML, hydration parity, browser API/CORS, sitemap, robots, canonicals, schema, Lighthouse, image audit, conversion events, GA4 network integration, Search Console baseline and post-deployment URL inspection.

## Remaining P0

- Restore a reproducible dependency install and pass build plus SEO tests.
- Provide the required browser validation command and suite, then pass hydration and parity checks.
- Remove the static-shell generation and stale repository catalogue fallback, or provide the approved genuine React SSR implementation that replaces them.

## Remaining P1

- Verify Vercel Production build/root/output configuration and whether Production environment variables override the repository `.env.production` values.
- Obtain Search Console access for baseline capture, sitemap submission, and representative URL inspection.
