/**
 * First-party INTERNAL TEST MODE.
 *
 * The owner regularly tests the live production site. Without an exclusion, that
 * QA traffic contaminates the conversion dataset (WhatsApp / quote / phone counts)
 * and Vercel page analytics. Visiting any page with `?nde_internal=1` persistently
 * marks this browser/device as internal; `?nde_internal=0` disables it again.
 *
 * Design constraints (see docs/seo/conversion-tracking.md):
 *  - no IP exclusion, no server state;
 *  - the query parameter is stripped from the visible URL immediately, so it never
 *    lingers, never becomes an SEO URL variant and is never captured by the
 *    page-view beacon;
 *  - the mode is never described to any analytics service (no `internal_test`
 *    property) — suppression happens before dispatch instead;
 *  - the stored value is a single non-PII flag.
 */

import type { BeforeSend } from '@vercel/analytics/react';

const STORAGE_KEY = 'nde_internal_analytics';
const QUERY_PARAM = 'nde_internal';
const ENABLED_VALUE = '1';
const DISABLED_VALUE = '0';

/** Local development hosts are never production analytics contexts. */
const NON_PRODUCTION_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/** Stored preference: `'1'` (internal), `'0'` (explicit production visitor) or `null`. */
function readStoredFlag(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * True when analytics and conversion events from this browser must NOT enter the
 * production dataset. An explicit stored preference always wins; otherwise local
 * development hosts default to internal. SSR-safe — always false without a window.
 */
export function isInternalAnalytics(): boolean {
  if (!hasWindow()) return false;
  const stored = readStoredFlag();
  if (stored === ENABLED_VALUE) return true;
  if (stored === DISABLED_VALUE) return false;
  return NON_PRODUCTION_HOSTS.has(window.location.hostname);
}

/**
 * `beforeSend` middleware for `<Analytics>`: cancels every Vercel page-view (and any
 * stray custom event) while this device is marked internal. This is the supported,
 * application-level way to exclude a browser from Vercel Web Analytics with no fork.
 */
export const vercelBeforeSend: BeforeSend = (event) => (isInternalAnalytics() ? null : event);

/**
 * Process `?nde_internal=1|0` once, on client startup. `1` marks this device
 * internal, `0` records an explicit opt-out; any other value only triggers URL
 * cleanup. The parameter is then removed from the visible URL with
 * `history.replaceState` (other params, the path and the hash are preserved), and a
 * single console line confirms a genuine state change — never on an ordinary load.
 *
 * The canonical link is derived from the route path elsewhere and is untouched here.
 */
export function applyInternalAnalyticsFlag(): void {
  if (!hasWindow()) return;

  let url: URL;
  try {
    url = new URL(window.location.href);
  } catch {
    return;
  }
  if (!url.searchParams.has(QUERY_PARAM)) return;

  const requested = url.searchParams.get(QUERY_PARAM);
  const wasInternal = readStoredFlag() === ENABLED_VALUE;

  try {
    if (requested === ENABLED_VALUE) {
      window.localStorage.setItem(STORAGE_KEY, ENABLED_VALUE);
      if (!wasInternal) {
        // eslint-disable-next-line no-console
        console.info('NDE internal analytics mode enabled — conversion events and Vercel page analytics are suppressed on this device.');
      }
    } else if (requested === DISABLED_VALUE) {
      window.localStorage.setItem(STORAGE_KEY, DISABLED_VALUE);
      if (wasInternal) {
        // eslint-disable-next-line no-console
        console.info('NDE internal analytics mode disabled — analytics collection resumes on this device.');
      }
    }
  } catch {
    // Storage unavailable (private mode / disabled cookies). URL cleanup still runs below.
  }

  url.searchParams.delete(QUERY_PARAM);
  const query = url.searchParams.toString();
  const cleaned = `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
  try {
    window.history.replaceState(window.history.state, '', cleaned);
  } catch {
    // replaceState can throw in sandboxed contexts; a leftover param is harmless.
  }
}
