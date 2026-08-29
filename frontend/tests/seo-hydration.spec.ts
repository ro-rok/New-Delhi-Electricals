import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const dist = path.resolve(import.meta.dirname, '..', 'dist');
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.newdelhielectricals\.com([^<]*)<\/loc>/g)].map(match => match[1] || '/');
const productPath = (brand: string) => paths.find(item => item.startsWith(`/${brand}/`));
const routeFile = (route: string) => path.join(dist, route === '/' ? 'index.html' : `${route.replace(/^\//, '')}.html`);
const routeData = (route: string): Record<string, unknown> => {
  const source = fs.readFileSync(routeFile(route), 'utf8');
  const match = source.match(/window\.__NDE_INITIAL_ROUTE_DATA__=(.*?)<\/script>/);
  if (!match) throw new Error(`Missing initial route data for ${route}`);
  return JSON.parse(match[1].replace(/;\s*$/, ''));
};
const variantPath = paths.find(route => {
  const options = routeData(route).variantOptions;
  return Array.isArray(options) && options.length > 0;
});
const routes = [
  ['Home', '/'], ['Category', '/category/switches-sockets'], ['Brand', '/brand/havells'],
  ['Havells product', productPath('havells')], ['Finolex product', productPath('finolex')],
] as const;

async function settle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(750);
}

function observeBrowser(page: import('@playwright/test').Page, issues: string[]) {
  page.on('console', message => {
    if (/hydration|did not match|replace/i.test(message.text())) issues.push(message.text());
  });
  page.on('pageerror', error => issues.push(error.message));
}

for (const [name, route] of routes) test(`${name} has SSR content and hydrates without React replacement`, async ({ browser, baseURL }) => {
  expect(route, `${name} route must exist in the generated sitemap`).toBeTruthy();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${baseURL}${route}`);
  const staticH1 = await staticPage.locator('h1').innerText();
  const staticTitle = await staticPage.title();
  const staticBreadcrumb = await staticPage.locator('nav[aria-label="Breadcrumb"]').allInnerTexts();
  await noJs.close();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const marker = window as Window & { __ndeInitialRoot?: Element };
    new MutationObserver(() => {
      if (!marker.__ndeInitialRoot) marker.__ndeInitialRoot = document.getElementById('root') || undefined;
    }).observe(document, { childList: true, subtree: true });
  });
  const issues: string[] = [];
  observeBrowser(page, issues);
  await page.goto(`${baseURL}${route}`);
  await settle(page);
  await expect(page.locator('h1')).toHaveText(staticH1);
  await expect(page).toHaveTitle(staticTitle);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  expect(await page.locator('nav[aria-label="Breadcrumb"]').allInnerTexts()).toEqual(staticBreadcrumb);
  await expect(page.locator('main a')).not.toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __ndeInitialRoot?: Element }).__ndeInitialRoot === document.getElementById('root'))).toBe(true);
  expect(issues).toEqual([]);
  await context.close();
});

for (const [name, route] of routes) test(`${name} cumulative layout shift stays within the release budget`, async ({ page, baseURL }, testInfo) => {
  expect(route, `${name} route must exist in the generated sitemap`).toBeTruthy();
  await page.addInitScript(() => {
    (window as Window & { __ndeCls?: number }).__ndeCls = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (!entry.hadRecentInput) (window as Window & { __ndeCls?: number }).__ndeCls! += entry.value || 0;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`${baseURL}${route}`);
  await settle(page);
  const cls = await page.evaluate(() => (window as Window & { __ndeCls?: number }).__ndeCls || 0);
  await testInfo.attach('cls.json', { body: JSON.stringify({ route, cls }), contentType: 'application/json' });
  console.log(`CLS ${name} (${route}): ${cls}`);
  expect(cls, `${name} CLS`).toBeLessThanOrEqual(0.1);
});

test('mobile navigation opens, closes, and routes to a category', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const issues: string[] = [];
  observeBrowser(page, issues);
  await page.goto(`${baseURL}/`);
  await settle(page);
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  await expect(toggle).toBeVisible();
  await toggle.click();
  const categoryLink = page.locator('header nav').getByRole('link', { name: 'Shop' });
  await expect(categoryLink).toBeVisible();
  await categoryLink.click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByRole('heading', { name: 'Build Your Complete Electrical Setup' })).toBeVisible();
  await expect(categoryLink).toBeHidden();
  expect(issues).toEqual([]);
});

test('product can be added to cart and cart remains functional after hydration', async ({ page, baseURL }) => {
  const route = productPath('havells');
  expect(route).toBeTruthy();
  const issues: string[] = [];
  observeBrowser(page, issues);
  await page.goto(`${baseURL}${route}`);
  await settle(page);
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByRole('button', { name: 'In Cart' })).toBeVisible();
  await page.getByRole('link', { name: 'View Cart', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
  const product = routeData(route!).product as { name: string };
  await expect(page.getByText(product.name)).toBeVisible();
  expect(issues).toEqual([]);
});

test('current catalogue variant selects a real product route and keeps cart actions available', async ({ page, baseURL }) => {
  test.skip(!variantPath, 'VARIANT TEST: NOT APPLICABLE — no suitable current catalogue record');
  const issues: string[] = [];
  observeBrowser(page, issues);
  await page.goto(`${baseURL}${variantPath}`);
  await settle(page);
  const option = page.locator('[data-variant-sku]').first();
  const expectedPath = await option.getAttribute('href');
  await expect(option).toBeVisible();
  await option.click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByRole('button', { name: /Add to Cart|In Cart/ })).toBeVisible();
  expect(issues).toEqual([]);
});

test('product WhatsApp handoff carries product context without a real message', async ({ page, baseURL }) => {
  const route = productPath('havells');
  expect(route).toBeTruthy();
  const issues: string[] = [];
  observeBrowser(page, issues);
  await page.goto(`${baseURL}${route}`);
  await settle(page);
  const link = page.getByRole('link', { name: 'Enquire on WhatsApp' });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^https:\/\/wa\.me\/919654102758\?text=/);
  expect(decodeURIComponent(href!)).toContain((routeData(route!).product as { sku: string }).sku);
  const popup = page.waitForEvent('popup');
  await link.click();
  await (await popup).close();
  expect(issues).toEqual([]);
});

test('conversion dispatches are exact and contain no form/query values', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    (window as Window & { __ndeConversionEvents?: unknown[] }).__ndeConversionEvents = [];
    window.addEventListener('nde:conversion', event => (window as Window & { __ndeConversionEvents?: unknown[] }).__ndeConversionEvents!.push((event as CustomEvent).detail));
  });
  const route = productPath('havells');
  expect(route).toBeTruthy();
  await page.goto(`${baseURL}${route}`);
  await settle(page);
  const productPopup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Enquire on WhatsApp' }).click();
  await (await productPopup).close();
  let events = await page.evaluate(() => (window as Window & { __ndeConversionEvents?: Array<{ name: string; properties: Record<string, unknown> }> }).__ndeConversionEvents || []);
  expect(events.map(event => event.name)).toEqual(['whatsapp_click', 'whatsapp_enquiry_start']);

  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await page.getByRole('link', { name: 'View Cart', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
  await page.getByRole('button', { name: 'Proceed to Enquire' }).click();
  await page.getByLabel(/^Name/).fill('Test Person');
  await page.getByLabel(/^Business Name/).fill('Test Company');
  await page.getByLabel(/^WhatsApp Number/).fill('9876543210');
  const quotePopup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Send Enquiry' }).click();
  await (await quotePopup).close();
  events = await page.evaluate(() => (window as Window & { __ndeConversionEvents?: Array<{ name: string; properties: Record<string, unknown> }> }).__ndeConversionEvents || []);
  expect(events.map(event => event.name)).toEqual(['whatsapp_click', 'whatsapp_enquiry_start', 'quote_enquiry_start', 'whatsapp_click', 'whatsapp_enquiry_start', 'quote_enquiry_handoff']);
  expect(JSON.stringify(events)).not.toMatch(/Test Person|Test Company|9876543210|search|query/i);
});
