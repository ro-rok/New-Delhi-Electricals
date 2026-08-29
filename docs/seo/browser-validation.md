# Browser Validation

Run npm run test:browser from frontend after a production build. The Playwright suite serves dist with the test-only static server and tests Home, Switches & Sockets, Havells, one generated Havells product and one generated Finolex product.

For each representative route it checks JavaScript-disabled server content, JavaScript-enabled hydration, H1/title/canonical parity, internal links, console hydration/root-replacement diagnostics and uncaught page errors.

Latest local result (2026-08-29): 15 passed; hydration mismatches 0; root replacement warnings 0; page errors 0. The suite also verifies mobile navigation, cart persistence, product variants, a WhatsApp handoff without sending a message, and exact non-PII conversion dispatch. Production browser validation on the same five SSR routes found no console errors or warnings and confirmed H1/canonical/schema parity.
