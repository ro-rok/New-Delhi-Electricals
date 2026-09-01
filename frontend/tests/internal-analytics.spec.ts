import { expect, test, type Page } from '@playwright/test';

/**
 * Internal production-traffic exclusion.
 *
 * `?nde_internal=1` marks a browser as an internal test device; `?nde_internal=0`
 * clears it. Internal devices dispatch the same conversion taxonomy locally (so the
 * app keeps working and tests can observe it) but nothing reaches the production
 * Vercel dataset — neither custom events nor page views.
 *
 * The Playwright harness is served from 127.0.0.1, which the feature treats as a
 * local dev host, so ordinary-visitor cases seed the explicit opt-out (`'0'`) to
 * reproduce a real production visitor.
 */

const GUIDE = '/guides/rccb-explained';
const GUIDE_2 = '/guides/mcb-vs-mccb';
const ORIGIN = 'http://127.0.0.1:4173';
const CANONICAL = 'https://www.newdelhielectricals.com/guides/rccb-explained';
const CONVERSION_EVENTS = ['whatsapp_click', 'whatsapp_enquiry_start'];
const ALLOWED_PROP_KEYS = ['page_type', 'page_path', 'cta_location', 'item_count'];

/* eslint-disable @typescript-eslint/no-explicit-any */

async function installProbe(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__ndeConversion = [];
    w.__vaCalls = [];
    window.addEventListener('nde:conversion', (event) => {
      w.__ndeConversion.push((event as CustomEvent).detail);
    });
    // Claim Vercel's global before @vercel/analytics installs its queue, and keep a
    // reference to the registered beforeSend so page-analytics suppression is
    // observable even though the insights script never loads off-Vercel.
    w.va = (...args: unknown[]) => {
      w.__vaCalls.push(args);
      if (args[0] === 'beforeSend') w.__ndeBeforeSend = args[1];
    };
  });
}

async function seedProductionVisitor(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('nde_internal_analytics', '0');
    } catch {
      /* storage unavailable */
    }
  });
}

async function fireWhatsAppCta(page: Page) {
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForFunction(() => typeof (window as any).__ndeBeforeSend === 'function');
  const link = page.locator('main a[href^="https://wa.me/"]').first();
  await expect(link).toBeVisible();
  const popup = page.waitForEvent('popup');
  await link.click();
  await (await popup).close();
}

async function readProbe(page: Page) {
  return page.evaluate(() => {
    const w = window as any;
    const beforeSend = w.__ndeBeforeSend as ((event: unknown) => unknown) | undefined;
    return {
      conversion: (w.__ndeConversion ?? []) as Array<{
        name: string;
        properties: Record<string, unknown>;
        suppressed: boolean;
      }>,
      vaEventNames: ((w.__vaCalls ?? []) as unknown[][])
        .filter((call) => call[0] === 'event')
        .map((call) => (call[1] as { name?: string }).name),
      beforeSend: {
        pageview: beforeSend ? beforeSend({ type: 'pageview', url: location.href }) : 'no-fn',
        event: beforeSend ? beforeSend({ type: 'event', url: location.href }) : 'no-fn',
      },
      storedFlag: window.localStorage.getItem('nde_internal_analytics'),
      canonical: Array.from(document.querySelectorAll('link[rel="canonical"]')).map(
        (link) => (link as HTMLLinkElement).href,
      ),
      url: location.href,
    };
  });
}

test('1. an ordinary visitor dispatches conversion events and Vercel collection stays on', async ({ page }) => {
  await installProbe(page);
  await seedProductionVisitor(page);
  await page.goto(GUIDE);
  await fireWhatsAppCta(page);

  const probe = await readProbe(page);
  expect(probe.conversion.map((detail) => detail.name)).toEqual(CONVERSION_EVENTS);
  expect(probe.conversion.every((detail) => detail.suppressed === false)).toBe(true);
  expect(probe.vaEventNames).toEqual(CONVERSION_EVENTS);
  expect(probe.beforeSend.pageview).not.toBeNull();
  expect(probe.beforeSend.event).not.toBeNull();
});

test('2. ?nde_internal=1 persistently marks the device as internal', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('nde_internal_analytics'))).toBe('1');
});

test('3. the nde_internal parameter is stripped from the visible URL, other params kept', async ({ page }) => {
  await installProbe(page);

  await page.goto(`${GUIDE}?nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(() => page.url()).toBe(`${ORIGIN}${GUIDE}`);

  await page.goto(`${GUIDE}?utm_source=abc&nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(() => page.url()).toBe(`${ORIGIN}${GUIDE}?utm_source=abc`);
  expect(await page.evaluate(() => window.location.search)).toBe('?utm_source=abc');
});

test('4. an internal device suppresses custom conversion events and Vercel collection', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await fireWhatsAppCta(page);

  const probe = await readProbe(page);
  // Same taxonomy, not renamed — dispatched locally but flagged as withheld…
  expect(probe.conversion.map((detail) => detail.name)).toEqual(CONVERSION_EVENTS);
  expect(probe.conversion.every((detail) => detail.suppressed === true)).toBe(true);
  // …and never handed to Vercel, as a custom event or a page view.
  expect(probe.vaEventNames).toEqual([]);
  expect(probe.beforeSend.pageview).toBeNull();
  expect(probe.beforeSend.event).toBeNull();
});

test('5. internal state survives navigation and reload without the parameter', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();

  await page.goto(GUIDE_2);
  await fireWhatsAppCta(page);
  let probe = await readProbe(page);
  expect(probe.storedFlag).toBe('1');
  expect(probe.conversion.every((detail) => detail.suppressed === true)).toBe(true);

  await page.reload();
  await fireWhatsAppCta(page);
  probe = await readProbe(page);
  expect(probe.storedFlag).toBe('1');
  expect(probe.conversion.every((detail) => detail.suppressed === true)).toBe(true);
});

test('6. ?nde_internal=0 disables internal mode and is also stripped from the URL', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('nde_internal_analytics'))).toBe('1');

  await page.goto(`${GUIDE}?nde_internal=0`);
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('nde_internal_analytics'))).not.toBe('1');
  await expect.poll(() => page.url()).toBe(`${ORIGIN}${GUIDE}`);
});

test('7. conversion events resume for a device that has opted back out', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();
  await page.goto(`${GUIDE}?nde_internal=0`);
  await fireWhatsAppCta(page);

  const probe = await readProbe(page);
  expect(probe.conversion.every((detail) => detail.suppressed === false)).toBe(true);
  expect(probe.vaEventNames).toEqual(CONVERSION_EVENTS);
  expect(probe.beforeSend.event).not.toBeNull();
});

test('8. the canonical link is untouched by the parameter', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await expect(page.locator('h1')).toBeVisible();
  const probe = await readProbe(page);
  expect(probe.canonical).toEqual([CANONICAL]);
});

test('9. server-rendered HTML is unchanged and never contains the parameter', async ({ request }) => {
  const response = await request.get(GUIDE);
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect((html.match(/<link\s+rel="canonical"/gi) || []).length).toBe(1);
  expect(html).toContain(`<link rel="canonical" href="${CANONICAL}"`);
  expect((html.match(/<title(?:\s[^>]*)?>/gi) || []).length).toBe(1);
  expect(html).not.toMatch(/nde_internal/);
});

test('10. internal mode introduces no PII into storage, URL, or analytics payloads', async ({ page }) => {
  await installProbe(page);
  await page.goto(`${GUIDE}?nde_internal=1`);
  await fireWhatsAppCta(page);
  const probe = await readProbe(page);

  const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
  expect(storageKeys.filter((key) => key.includes('internal'))).toEqual(['nde_internal_analytics']);
  expect(['0', '1']).toContain(probe.storedFlag);

  for (const detail of probe.conversion) {
    for (const key of Object.keys(detail.properties)) {
      expect(ALLOWED_PROP_KEYS).toContain(key);
    }
    expect(String(detail.properties.page_path)).toBe(GUIDE);
  }

  const blob = JSON.stringify(probe);
  expect(blob).not.toMatch(/internal_test/);
  expect(blob).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  expect(blob).not.toMatch(/\d{10}/);
  expect(page.url()).not.toMatch(/nde_internal/);
});
