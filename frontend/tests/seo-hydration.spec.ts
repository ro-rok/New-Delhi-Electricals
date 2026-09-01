import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const screenshots = join(process.cwd(), '..', 'docs', 'seo', 'browser-validation');
mkdirSync(screenshots, { recursive: true });

const routes = [
  { name: 'home', path: '/', schemas: ['LocalBusiness'] },
  { name: 'category-switches-sockets', path: '/category/switches-sockets', schemas: ['BreadcrumbList'] },
  { name: 'brand-havells', path: '/brand/havells', schemas: ['BreadcrumbList'] },
  { name: 'product-havells', path: '/havells/2-channel-dimmer-2m-grey', schemas: ['Product', 'BreadcrumbList'] },
  { name: 'product-finolex', path: '/finolex/finolex-fr-0-75-sqmm-300m-house-wire', schemas: ['Product', 'BreadcrumbList'] },
  { name: 'hub-polycab-wires', path: '/brand/polycab/wires-cables', schemas: ['BreadcrumbList', 'ItemList'] },
  { name: 'hub-finolex-wires', path: '/brand/finolex/wires-cables', schemas: ['BreadcrumbList', 'ItemList'] },
  { name: 'hub-anchor-switches', path: '/brand/anchor/switches-sockets', schemas: ['BreadcrumbList', 'ItemList'] },
] as const;
const hubPaths = ['/brand/polycab/wires-cables', '/brand/finolex/wires-cables', '/brand/anchor/switches-sockets'];

const hydrationPattern = /hydration failed|hydration mismatch|text content did not match|expected server html|server html was replaced|an error occurred during hydration/i;
const catalogueApi = 'https://new-delhi-electricals.onrender.com/api/';

async function fulfillCatalogueRequest(route: Route) {
  const response = await route.fetch();
  await route.fulfill({
    response,
    headers: { ...response.headers(), 'access-control-allow-origin': '*' },
  });
}

async function allowCatalogueApi(page: Page) {
  await page.route(`${catalogueApi}**`, fulfillCatalogueRequest);
}

async function pageFacts(page: Page) {
  return page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    mainText: document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 800) || '',
    breadcrumb: document.querySelector('nav[aria-label*="breadcrumb" i], [aria-label="Breadcrumb"]')?.textContent?.replace(/\s+/g, ' ').trim() || '',
    canonical: document.querySelectorAll('link[rel="canonical"]').length === 1 ? document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || '' : '',
    titleCount: document.querySelectorAll('title').length,
    descriptionCount: document.querySelectorAll('meta[name="description"]').length,
    canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
    robots: document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content || '',
    schemaTypes: [...document.querySelectorAll<HTMLScriptElement>('script[data-seo-schema], script[type="application/ld+json"]')]
      .flatMap((script) => { try { const schema = JSON.parse(script.textContent || '{}'); return Array.isArray(schema) ? schema.map((item) => item['@type']) : [schema['@type']]; } catch { return ['INVALID']; } })
      .filter(Boolean).sort(),
    significantLinks: [...document.querySelectorAll('main a[href]')].filter((link) => (link.textContent || '').trim().length > 2).length,
    productLinks: [...document.querySelectorAll('main a[href*="/"]')]
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => Boolean(href && /^\/(?!category|brand|cart|shortlist|compare|contact|about|services|faq)/.test(href)))
      .filter((href, index, values) => values.indexOf(href) === index)
      .slice(0, 20),
    productCards: document.querySelectorAll('main [class*="grid"] a[href]').length,
    rootTextLength: document.getElementById('root')?.textContent?.trim().length || 0,
    rootHtmlLength: document.getElementById('root')?.innerHTML.length || 0,
    oldShell: Boolean(document.querySelector('.seo-static-shell')),
    cls: performance.getEntriesByType('layout-shift').filter((entry: PerformanceEntry & { hadRecentInput?: boolean }) => !entry.hadRecentInput).reduce((total: number, entry: PerformanceEntry & { value?: number }) => total + (entry.value || 0), 0),
    lcp: performance.getEntriesByType('largest-contentful-paint').at(-1)?.startTime || null,
  }));
}

async function jsOffFacts(context: BrowserContext, path: string, screenshotName: string) {
  const page = await context.newPage();
  await page.goto(path, { waitUntil: 'load' });
  await page.screenshot({ path: join(screenshots, `${screenshotName}-a-js-off.png`), fullPage: true });
  const facts = await pageFacts(page);
  await page.close();
  return facts;
}

async function delayedHydrationPage(context: BrowserContext, path: string, screenshotName: string) {
  const page = await context.newPage();
  let releaseScripts!: () => void;
  const scriptsReleased = new Promise<void>((resolve) => { releaseScripts = resolve; });
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(catalogueApi)) apiRequests.push(request.url());
  });
  await page.route('**/*', async (route) => {
    if (route.request().url().startsWith(catalogueApi)) {
      await fulfillCatalogueRequest(route);
      return;
    }
    if (route.request().resourceType() === 'script') await scriptsReleased;
    await route.continue();
  });
  const messages: string[] = [];
  const errors: string[] = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path, { waitUntil: 'commit' });
  await expect(page.locator('h1')).toBeVisible();
  await page.evaluate(() => { (window as Window & { __ndePreHydrationH1?: Element | null }).__ndePreHydrationH1 = document.querySelector('h1'); });
  await page.screenshot({ path: join(screenshots, `${screenshotName}-b-immediate.png`), fullPage: true });
  const immediate = await pageFacts(page);
  releaseScripts();
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: join(screenshots, `${screenshotName}-c-hydrated.png`), fullPage: true });
  const settled = await pageFacts(page);
  const h1Persisted = await page.evaluate(() => (window as Window & { __ndePreHydrationH1?: Element | null }).__ndePreHydrationH1 === document.querySelector('h1'));
  return { page, immediate, settled, h1Persisted, messages, errors, apiRequests };
}

for (const route of routes) {
  test(`${route.name}: prerendered content hydrates in place`, async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const staticFacts = await jsOffFacts(noJs, route.path, route.name);
    await noJs.close();
    expect(staticFacts.h1).not.toBe('');
    expect(staticFacts.rootTextLength).toBeGreaterThan(100);
    expect(staticFacts.titleCount).toBe(1);
    expect(staticFacts.descriptionCount).toBe(1);
    expect(staticFacts.canonicalCount).toBe(1);
    expect(staticFacts.canonical).toBe(`https://www.newdelhielectricals.com${route.path === '/' ? '/' : route.path}`);
    expect(staticFacts.oldShell).toBeFalsy();
    expect(staticFacts.schemaTypes).toEqual(expect.arrayContaining(route.schemas));

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const result = await delayedHydrationPage(context, route.path, route.name);
    try {
      expect(result.immediate.h1).toBe(staticFacts.h1);
      expect(result.settled.h1).toBe(staticFacts.h1);
      expect(result.settled.mainText).toContain(staticFacts.h1);
      expect(result.settled.canonical).toBe(staticFacts.canonical);
      expect(result.settled.titleCount).toBe(1);
      expect(result.settled.descriptionCount).toBe(1);
      expect(result.settled.canonicalCount).toBe(1);
      expect(result.settled.schemaTypes).toEqual(staticFacts.schemaTypes);
      expect([...result.settled.productLinks].sort()).toEqual([...staticFacts.productLinks].sort());
      const reorderedProducts = result.settled.productLinks.filter((href, index) => href !== staticFacts.productLinks[index]).length;
      expect(reorderedProducts).toBeLessThanOrEqual(Math.ceil(staticFacts.productLinks.length * 0.25));
      expect(result.settled.rootTextLength).toBeGreaterThan(100);
      expect(result.settled.oldShell).toBeFalsy();
      expect(result.h1Persisted).toBeTruthy();
      expect(result.messages.filter((message) => hydrationPattern.test(message))).toEqual([]);
      expect(result.errors.filter((message) => hydrationPattern.test(message))).toEqual([]);
      expect(result.settled.cls).toBeLessThanOrEqual(0.1);
    } finally {
      await result.page.close();
      await context.close();
    }
  });
}

test('hydrated navigation, cart, mobile navigation, and WhatsApp CTA remain usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await allowCatalogueApi(page);
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await page.getByRole('link', { name: /switches & sockets/i }).first().click();
  await expect(page).toHaveURL(/\/category\/switches-sockets/);
  const productLink = page.locator('main a[href^="/"]').filter({ has: page.locator('h3') }).first();
  await expect(productLink).toBeVisible();
  await productLink.click();
  await expect(page.locator('h1')).toBeVisible();
  await page.getByRole('button', { name: /add to cart/i }).click();
  await expect(page.getByRole('button', { name: /in cart/i })).toBeVisible();
  const whatsappButton = page.getByRole('button', { name: /enquire on whatsapp/i });
  await expect(whatsappButton).toBeVisible();
  const popupPromise = page.waitForEvent('popup');
  await whatsappButton.click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toMatch(/wa\.me|api\.whatsapp\.com/);
  await popup.close();
  await page.goBack();
  await page.goForward();
  await expect(page.locator('h1')).toBeVisible();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await expect(errors).toEqual([]);
});

test('mobile navigation opens and closes after hydration', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Toggle menu' });
  await menu.click();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
  await menu.click();
  await expect(page.getByRole('link', { name: 'About' })).toBeHidden();
  await context.close();
});
for (const route of hubPaths) {
  test(`commercial hub ${route} keeps its enquiry paths and breadcrumb without JS`, async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await noJs.newPage();
    await page.goto(route, { waitUntil: 'load' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(1);
    await expect(page.locator('main a[href^="https://wa.me/"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/cart"]').first()).toBeVisible();
    await expect(page.locator('main a[href^="/"]').filter({ hasText: /.{3,}/ }).first()).toBeVisible();
    await noJs.close();
  });
}

test('commercial hub is usable on a mobile viewport without horizontal overflow', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/brand/anchor/switches-sockets');
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await context.close();
});

test('commercial hub WhatsApp handoff carries hub context and fires each event once', async ({ page }) => {
  await allowCatalogueApi(page);
  await page.addInitScript(() => {
    (window as Window & { __ndeConversionEvents?: unknown[] }).__ndeConversionEvents = [];
    window.addEventListener('nde:conversion', (event) => (window as Window & { __ndeConversionEvents?: unknown[] }).__ndeConversionEvents!.push((event as CustomEvent).detail));
  });
  await page.goto('/brand/polycab/wires-cables');
  await expect(page.locator('h1')).toBeVisible();
  const link = page.locator('main a[href^="https://wa.me/"]').first();
  expect(decodeURIComponent((await link.getAttribute('href')) || '')).toContain('Polycab');
  const popup = page.waitForEvent('popup');
  await link.click();
  await (await popup).close();
  const events = await page.evaluate(() => (window as Window & { __ndeConversionEvents?: Array<{ name: string; properties: Record<string, unknown> }> }).__ndeConversionEvents || []);
  expect(events.map((event) => event.name)).toEqual(['whatsapp_click', 'whatsapp_enquiry_start']);
  expect(events[0].properties.page_type).toBe('commercial-hub');
});
