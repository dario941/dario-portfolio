const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:4173/';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  for (const width of (process.argv[3] === 'focused' ? [] : [320,375,430,768,1024,1440,1920])) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 500, hasTouch: width < 500 });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.portfolioBoot?.finished);
    await page.waitForTimeout(1900);
    const layout = await page.evaluate(() => {
      const first = document.querySelector('.first-name'), last = document.querySelector('.last-name');
      const words = [...first.querySelectorAll('.motion-word')].map(el => ({ top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom }));
      return { first: first.textContent, last: last.textContent, words, lastTop: last.getBoundingClientRect().top,
        width: innerWidth, scroll: document.documentElement.scrollWidth,
        headingWidth: document.querySelector('h1').clientWidth, headingScroll: document.querySelector('h1').scrollWidth,
        paper: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
        forest: getComputedStyle(document.documentElement).getPropertyValue('--forest').trim(),
        motionFailed: document.documentElement.classList.contains('motion-failed') };
    });
    assert.equal(layout.first, 'DARIO MARTIN'); assert.equal(layout.last, 'MONTEIRO');
    assert(Math.abs(layout.words[0].top - layout.words[1].top) < 1);
    assert(layout.lastTop > layout.words[0].top);
    assert(layout.scroll <= layout.width); assert(layout.headingScroll <= layout.headingWidth + 2, JSON.stringify(layout));
    assert.equal(layout.paper, '#f2f1e9'); assert.equal(layout.forest, '#192f26'); assert.equal(layout.motionFailed, false);
    if ([375,1440].includes(width)) await page.screenshot({ path: `.verification/final-hero-${width}.png` });
    if (width === 1440) {
      const previous = fs.readFileSync('.verification/index.before-hero.html', 'utf8');
      assert.deepEqual(await page.evaluate(previous => {
        const doc = new DOMParser().parseFromString(previous, 'text/html');
        const selectors = ['#about','#experience','#services','#skills','#work','#contact'];
        return selectors.filter(selector => doc.querySelector(selector).textContent.replace(/\s+/g,' ') !== document.querySelector(selector).textContent.replace(/\s+/g,' '));
      }, previous), []);
      await page.locator('.menu-toggle').click(); await page.waitForTimeout(750);
      await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('#fullscreen-nav').open);
      assert.equal(await page.evaluate(() => document.activeElement.className), 'menu-toggle');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.documentElement.classList.contains('motion-off'));
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), false);
    assert.equal(await page.locator('.hero-orbit svg').evaluate(el => el.getAnimations().length), 0);
    assert.equal(await page.locator('.hero-name .motion-word').first().evaluate(el => getComputedStyle(el).transform), 'none');
    console.log(`PASS hero ${width}px: two lines, no overflow, palette, reduced-motion cleanup.`);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => sessionStorage.setItem('dario-intro-v1', '1'));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const word = document.querySelector('.hero-name .motion-word');
    return word && word.style.transform && Number(getComputedStyle(word).opacity) < 1;
  });
  const initial = await page.evaluate(() => {
    const word = document.querySelector('.hero-name .motion-word');
    const matrix = new DOMMatrix(getComputedStyle(word).transform);
    return { y: matrix.m42, scale: matrix.m11,
      miniAnimations: document.querySelector('.hero-orbit svg').getAnimations().length };
  });
  assert(initial.y > 0 && initial.y <= 45); assert(initial.scale >= .94 && initial.scale < 1); assert(initial.miniAnimations > 0);
  await page.waitForTimeout(250);
  assert((await page.locator('.hero-name .motion-word').first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)) < initial.y);
  await page.evaluate(() => window.portfolioMotion.destroy());
  assert.equal(await page.locator('.hero-orbit svg').evaluate(el => el.getAnimations().length), 0);
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), false);
  assert.equal(await page.locator('.hero-name .motion-word').first().evaluate(el => getComputedStyle(el).transform), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS live GSAP reveal, native Motion accent, and interrupted-animation teardown:', initial);
  await context.close(); await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
