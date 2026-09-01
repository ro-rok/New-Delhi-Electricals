import { track } from '@vercel/analytics/react';
import { isInternalAnalytics } from './internalAnalytics';

export type ConversionEvent =
  | 'whatsapp_click'
  | 'whatsapp_enquiry_start'
  | 'quote_enquiry_start'
  | 'quote_enquiry_submit'
  | 'quote_enquiry_handoff'
  | 'contact_form_submit'
  | 'phone_click';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function getPageType(pathname = typeof window === 'undefined' ? '/' : window.location.pathname): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/category/')) return 'category';
  // /brand/<brand>/<hub> is a commercial hub; /brand/<brand> stays a brand page.
  if (pathname.startsWith('/brand/')) return pathname.split('/').filter(Boolean).length === 3 ? 'commercial-hub' : 'brand';
  // /guides/<slug> would otherwise fall through to the two-segment product rule.
  if (pathname === '/guides') return 'guides-index';
  if (pathname.startsWith('/guides/')) return 'guide';
  if (pathname === '/search') return 'search';
  if (pathname === '/cart') return 'cart';
  if (pathname.split('/').filter(Boolean).length === 2) return 'product';
  return pathname.split('/').filter(Boolean)[0] || 'other';
}

export function trackConversion(name: ConversionEvent, properties: EventProperties = {}): void {
  if (typeof window === 'undefined') return;
  const event = {
    page_type: getPageType(),
    page_path: window.location.pathname,
    ...properties,
  };
  const suppressed = isInternalAnalytics();
  // A local, side-effect-free hook lets browser tests verify the shared analytics
  // contract without relying on Vercel ingestion. `suppressed` is true when this is
  // an internal test device and the event was withheld from the production dataset.
  window.dispatchEvent(new CustomEvent('nde:conversion', { detail: { name, properties: event, suppressed } }));
  // Internal QA/testing traffic never enters the production conversion dataset: the
  // event is not renamed or re-tagged, it is simply not sent.
  if (suppressed) return;
  track(name, event);
}
