import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('text=Season Revenue', { timeout: 20000 });
await page.waitForTimeout(2000);

if (errors.length) console.log('ERRORS:', errors);

// Hero (above fold) — light
await page.screenshot({ path: '/tmp/ledyard-hero.png', fullPage: false });

// Scroll to show KPIs + insights
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/ledyard-kpis.png', fullPage: false });

// Full page light
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/ledyard-light-full.png', fullPage: true });

// Dark hero
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/ledyard-dark-hero.png', fullPage: false });

// Heatmap section
await page.evaluate(() => window.scrollTo(0, 2800));
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/ledyard-heatmap.png', fullPage: false });

await browser.close();
console.log('done — errors:', errors.length);
