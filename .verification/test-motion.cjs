const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.addInitScript(() => {
    window.layoutShifts = [];
    new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) window.layoutShifts.push(e.value); })).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portfolioBoot?.finished);
  await page.waitForTimeout(1200);
  const matrixBefore = await page.locator('.first-name').evaluate(el => getComputedStyle(el).transform);
  await page.mouse.move(500, 500);
  await page.mouse.wheel(0, 500);
  const positions = [];
  for (let i = 0; i < 20; i++) { await page.waitForTimeout(60); positions.push(await page.evaluate(() => scrollY)); }
  assert(positions.every((value, i) => i === 0 || value >= positions[i - 1] - 1), 'Competing scroll updates');
  assert(Math.abs(positions.at(-1) - 500) <= 3, `Scroll target drift: ${positions}`);
  assert.notEqual(await page.locator('.first-name').evaluate(el => getComputedStyle(el).transform), matrixBefore);
  await page.locator('#navigation a[href="#services"]').click();
  await page.waitForTimeout(1100);
  const card = page.locator('.service-card').first();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .3);
  await page.waitForTimeout(400);
  assert.notEqual(await card.evaluate(el => getComputedStyle(el).transform), 'none');
  await page.mouse.move(10, 10); await page.waitForTimeout(600);
  await page.locator('.menu-toggle').click();
  const lockedAt = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 800); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => scrollY), lockedAt);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#fullscreen-nav').open);
  await page.locator('#navigation a[href="#home"]').click(); await page.waitForTimeout(800);
  await page.mouse.move(500, 400); await page.waitForTimeout(350);
  const cursor = await page.locator('.cursor-dot').evaluate(el => {
    const box = el.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  });
  assert(Math.abs(cursor.x - 500) < 1 && Math.abs(cursor.y - 400) < 1);
  const cls = await page.evaluate(() => layoutShifts.reduce((a, b) => a + b, 0));
  const result = { wheelPositions: positions, localChromiumLayoutShiftSum: cls, tests: ['wheel convergence', 'scrubbed hero transform', 'desktop card tilt', 'dialog scroll lock', 'cursor coordinates'] };
  fs.writeFileSync('.verification/motion-measurements.json', JSON.stringify(result, null, 2));
  console.log('PASS production motion:', JSON.stringify(result));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
