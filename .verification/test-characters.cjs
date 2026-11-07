const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:4173/';
const errors = [], results = {};
const transforms = page => page.locator('.hero-char').evaluateAll(elements => elements.map(el => {
  const css = getComputedStyle(el), matrix = new DOMMatrix(css.transform);
  return { y: matrix.m42, scale: matrix.m11, rotationX: matrix.m23, opacity: Number(css.opacity), transform: css.transform };
}));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.addInitScript(() => sessionStorage.setItem('dario-intro-v1', '1'));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.hero-char')?.style.opacity === '0');
    results.entrance = await transforms(page);
    assert.equal(results.entrance.length, 19);
    assert(results.entrance.some(c => c.y > 0 && c.scale < 1 && c.rotationX < 0 && c.opacity < 1));
    await page.waitForTimeout(350);
    const stagger = await transforms(page);
    assert(stagger[0].y !== stagger[18].y, 'Letters have separate staggered states');
    assert((await page.locator('.hero-orbit svg').evaluate(el => el.getAnimations().length)) > 0);
    await page.screenshot({ path: '.verification/characters-entrance.png' });
    await page.waitForTimeout(2300);
    assert((await transforms(page)).every(c => c.opacity === 1 && c.transform === 'none'));
    await page.screenshot({ path: '.verification/characters-settled.png' });
    await page.locator('.hero-name').hover(); await page.waitForTimeout(150);
    results.hover = await transforms(page);
    assert(results.hover.some(c => c.y < -1), 'Verified center-out hover wave');
    await page.mouse.move(5, 5); await page.waitForTimeout(1000);
    assert((await transforms(page)).every(c => c.y === 0));
    const canvasFrame = () => page.locator('.hero-canvas').evaluate(canvas => canvas.toDataURL());
    const firstFrame = await canvasFrame(); await page.waitForTimeout(200);
    assert.notEqual(firstFrame, await canvasFrame(), 'Hero canvas updates');
    await page.evaluate(() => scrollTo(0, 400)); await page.waitForTimeout(1400);
    results.scroll = await page.locator('.hero-name').evaluate(el => {
      const m = new DOMMatrix(getComputedStyle(el).transform); return { scale: m.m11, y: m.m42, opacity: Number(getComputedStyle(el).opacity) };
    });
    assert(results.scroll.scale < 1 && results.scroll.y < 0 && results.scroll.opacity < 1);
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1400);
    assert.equal(await page.locator('.hero-name').evaluate(el => Number(getComputedStyle(el).opacity)), 1);

    await page.locator('#about').scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
    const flowFrame = () => page.locator('.flow-canvas').evaluate(canvas => canvas.toDataURL());
    const frame = await flowFrame(); await page.waitForTimeout(300);
    assert.notEqual(frame, await flowFrame(), 'Flow field draws visible trails');
    await page.screenshot({ path: '.verification/characters-about.png' });
    await page.locator('#skills').scrollIntoViewIfNeeded(); await page.waitForTimeout(1300);
    const stoppedFrame = await flowFrame(); await page.waitForTimeout(200);
    assert.equal(stoppedFrame, await flowFrame(), 'Flow pauses offscreen');
    const categories = { frontend: 7, tools: 3, backend: 5, additional: 6, all: 21 };
    for (const [category, count] of Object.entries(categories)) {
      await page.locator(`[data-skill-filter="${category}"]`).click();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.skill-row:not([hidden]) li').count(), count);
      assert.equal(await page.locator(`[data-skill-filter="${category}"]`).getAttribute('aria-pressed'), 'true');
      assert((await page.locator('#skill-status').innerText()).startsWith(`${count} technologies`));
      await page.waitForTimeout(1100);
      assert((await page.locator('.skill-row:not([hidden]) li').evaluateAll(items => items.map(el => getComputedStyle(el).opacity))).every(o => Number(o) === 1));
    }
    // Fast repeated changes must cancel prior contexts and leave the final selection visible.
    await page.evaluate(() => ['backend', 'tools', 'frontend'].forEach(c => document.querySelector(`[data-skill-filter="${c}"]`).click()));
    await page.waitForTimeout(1100);
    assert.equal(await page.locator('.skill-row:not([hidden]) li').count(), 7);
    await page.screenshot({ path: '.verification/characters-filter.png' });
    await page.locator('[data-skill-filter="all"]').click();
    await page.waitForTimeout(1500);
    await page.locator('[data-skill-filter="tools"]').focus();
    await page.keyboard.press('Space'); await page.waitForTimeout(900);
    assert.equal(await page.locator('.skill-row:not([hidden]) li').count(), 3);
    await page.locator('[data-skill-filter="all"]').click();
    // Resize the same running page, exercising teardown and recreation rather than reload.
    await page.setViewportSize({ width: 375, height: 812 }); await page.waitForTimeout(600);
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), false);
    await page.locator('[data-skill-filter="backend"]').click(); await page.waitForTimeout(1000);
    assert.equal(await page.locator('.skill-row:not([hidden]) li').count(), 5);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: '.verification/characters-mobile-filter.png' });
    await page.setViewportSize({ width: 1440, height: 950 }); await page.waitForTimeout(600);
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), true);
    await page.locator('[data-skill-filter="all"]').click();

    const corrections = await page.evaluate(() => {
      const matches = [...document.querySelectorAll('body *')].filter(el => el.children.length === 0 && /Saudi Arabia/i.test(el.textContent));
      return { matches: matches.map(el => ({ text: el.textContent, inHMR: el.closest('.timeline-item')?.querySelector('h3').textContent === 'Web/Software and IT Lead' })),
        meta: document.querySelector('meta[name="description"]').content };
    });
    assert.equal(corrections.matches.length, 1); assert(corrections.matches[0].inHMR); assert(!/Saudi/i.test(corrections.meta));
    results.content = corrections;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.documentElement.classList.contains('motion-off'));
    assert.equal(await page.locator('.flow-canvas').evaluate(el => getComputedStyle(el).display), 'none');
    assert((await transforms(page)).every(c => c.transform === 'none' && c.opacity === 1));
    await page.locator('[data-skill-filter="tools"]').click();
    assert.equal(await page.locator('.skill-row:not([hidden]) li').count(), 3);
    assert((await page.locator('.skill-row:not([hidden]) li').evaluateAll(items => items.map(el => getComputedStyle(el).opacity))).every(o => Number(o) === 1));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.documentElement.classList.contains('motion-enabled'));
    await page.evaluate(() => window.portfolioMotion.destroy());
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), false);
    assert.equal(await page.locator('.hero-orbit svg').evaluate(el => el.getAnimations().length), 0);
    assert((await transforms(page)).every(c => c.transform === 'none'));
    assert.deepEqual(errors, []);
    fs.writeFileSync('.verification/characters-results.json', JSON.stringify(results, null, 2));
    console.log('PASS character entrance/stagger, reference hover wave, reversible hero scrub, both canvases, offscreen pause, all filters/rapid switching, content corrections, live reduced motion and cleanup.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
