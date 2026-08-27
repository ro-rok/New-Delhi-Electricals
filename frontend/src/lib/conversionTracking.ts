import { track } from '@vercel/analytics/react';

export type ConversionEvent =
  | 'whatsapp_click'
  | 'whatsapp_enquiry_start'
  | 'quote_enquiry_start'
  | 'quote_enquiry_submit'
  | 'contact_form_submit'
  | 'phone_click';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function getPageType(pathname = window.location.pathname): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/category/')) return 'category';
  if (pathname.startsWith('/brand/')) return 'brand';
  if (pathname === '/search') return 'search';
  if (pathname === '/cart') return 'cart';
  if (pathname.split('/').filter(Boolean).length === 2) return 'product';
  return pathname.split('/').filter(Boolean)[0] || 'other';
}

export function trackConversion(name: ConversionEvent, properties: EventProperties = {}): void {
  track(name, {
    page_type: getPageType(),
    page_path: window.location.pathname,
    ...properties,
  });
}
