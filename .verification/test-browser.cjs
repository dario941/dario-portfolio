const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:5173/';
const label = process.argv[3] || 'dev';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
const report = (name, detail) => { results.push({ name, detail }); console.log('PASS', name, detail || ''); };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const newPage = async (width = 1440, options = {}) => {
    const context = await browser.newContext({ viewport: { width, height: 950 }, ...options });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    return { context, page };
  };
  const ready = async page => {
    await page.waitForFunction(() => window.portfolioMotion && window.portfolioBoot?.finished);
    await page.waitForTimeout(2400); // 1.6s character entrance + 0.026s stagger and supporting sequence.
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('motion-failed')), false);
  };
  const assertVisible = async page => {
    const hidden = await page.locator('main [data-motion]').evaluateAll(elements => elements.filter(el => {
      const style = getComputedStyle(el), box = el.getBoundingClientRect();
      return box.bottom > 100 && box.top < innerHeight && (Number(style.opacity) < .08 || style.visibility === 'hidden');
    }).map(el => el.className));
    assert.deepEqual(hidden, [], 'Essential motion targets left hidden');
  };

  for (const width of (process.argv[4] === 'focused' ? [] : [320, 375, 430, 768, 1024, 1440, 1920])) {
    const mobile = width <= 430;
    const { page, context } = await newPage(width, mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {});
    await page.goto(base, { waitUntil: 'networkidle' });
    await ready(page);
    assert.equal(await page.locator('#intro').evaluate(el => el.hidden), true);
    assert.equal(await page.locator('#intro').getAttribute('data-progress'), '100');
    assert.equal(await page.locator('.project-card').count(), 2);
    assert.equal(await page.locator('#work-empty').isVisible(), false);
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
      lenis: document.documentElement.classList.contains('lenis'),
      headingOverflow: [...document.querySelectorAll('h1,h2,h3')].filter(h => h.scrollWidth > h.clientWidth + 2).map(h => h.id || h.textContent)
    }));
    assert(layout.scroll <= layout.width, JSON.stringify(layout));
    assert.deepEqual(layout.headingOverflow, [], 'Heading overflow');
    if (mobile) assert.equal(layout.lenis, false);
    await assertVisible(page);
    if ([375, 1440].includes(width)) await page.screenshot({ path: `.verification/${label}-hero-${width}.png` });

    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(800);
    assert.equal(await page.locator('#fullscreen-nav').evaluate(el => el.open), true);
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.querySelector('#fullscreen-nav').contains(document.activeElement)));
    if ([375, 1440].includes(width)) await page.screenshot({ path: `.verification/${label}-menu-${width}.png` });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#fullscreen-nav').open);
    assert.equal(await page.evaluate(() => document.activeElement.className), 'menu-toggle');
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('menu-open')), false);
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(750);
    await page.locator('.overlay-links a[href="#work"]').click();
    await page.waitForFunction(() => location.hash === '#work' && !document.querySelector('#fullscreen-nav').open);
    await page.waitForTimeout(900);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'work');
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('menu-open')), false);
    await assertVisible(page);
    await page.locator('.back-top').click();
    await page.waitForFunction(() => scrollY < 150, null, { timeout: 5000 });
    assert((await page.evaluate(() => scrollY)) < 150);
    report(`${label} ${width}px`, 'no page/heading overflow; intro; client work; menu; Escape; focus; anchor; back-to-top');
    await context.close();
  }

  const { page, context } = await newPage();
  await page.goto(base, { waitUntil: 'networkidle' }); await ready(page);
  for (const id of ['about', 'experience', 'services', 'skills', 'work', 'contact']) {
    await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
    await page.waitForTimeout(1200);
    await assertVisible(page);
    await page.screenshot({ path: `.verification/${label}-${id}.png` });
  }
  assert.equal(await page.locator('.timeline').evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue('--timeline-progress'))), 1);
  await page.locator('.motion-toggle').click();
  assert(await page.locator('html').evaluate(el => el.classList.contains('motion-off')));
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), false);
  await page.locator('.motion-toggle').click();
  assert(await page.locator('html').evaluate(el => el.classList.contains('motion-enabled')));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-off'));
  assert(await page.locator('html').evaluate(el => el.classList.contains('motion-off')));
  assert.equal(await page.locator('.motion-toggle').isDisabled(), true);
  assert.equal(await page.locator('html').evaluate(el => el.classList.contains('lenis')), false);
  await assertVisible(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-enabled'));
  assert(await page.locator('html').evaluate(el => el.classList.contains('motion-enabled')));
  await page.goto(base + '#about', { waitUntil: 'networkidle' }); await ready(page);
  assert.equal(new URL(page.url()).hash, '#about');
  const aboutY = await page.evaluate(() => scrollY);
  await page.locator('#navigation a[href="#contact"]').click();
  await page.waitForTimeout(800);
  await page.goBack(); await page.waitForTimeout(800);
  assert.equal(new URL(page.url()).hash, '#about');
  const restoredAboutY = await page.evaluate(() => scrollY);
  assert(Math.abs(restoredAboutY - aboutY) < 50, JSON.stringify({ aboutY, restoredAboutY,
    aboutTop: await page.locator('#about').evaluate(el => el.getBoundingClientRect().top + scrollY) }));
  report(`${label} full scroll`, 'all sections visible, timeline progress, motion toggle, live preference changes, hash/back history');

  // Project fixture exists only in the isolated test DOM, never in delivered content.
  await page.evaluate(() => {
    document.querySelector('#work-empty').hidden = true;
    const list = document.querySelector('#project-list'); list.hidden = false;
    const card = document.createElement('article'); card.className = 'project-card'; card.id = 'verification-project';
    card.innerHTML = '<div class="project-media"><img width="800" height="500" alt="Test-only image" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'500\'%3E%3Crect width=\'800\' height=\'500\' fill=\'%23c3d8a7\'/%3E%3C/svg%3E"></div><div><h3>In-memory verification fixture</h3><p>Renderer verification</p><a href="https://example.test">View</a></div>';
    list.append(card); card.scrollIntoView();
  });
  await page.waitForTimeout(1400);
  await assertVisible(page);
  assert.equal(await page.locator('#verification-project .project-media').evaluate(el => getComputedStyle(el).clipPath), 'none');
  assert.equal(await page.locator('#verification-project h3 .motion-word').count(), 3);
  await page.locator('#verification-project h3').hover(); await page.waitForTimeout(450);
  assert(Number(await page.locator('.project-preview').evaluate(el => getComputedStyle(el).opacity)) > .9);
  await page.evaluate(() => document.querySelector('#verification-project').remove());
  report(`${label} future projects`, 'dynamic insertion, clipped image reveal, text, desktop preview, removal');
  await context.close();

  const reducedContext = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce', hasTouch: true, isMobile: true });
  const rp = await reducedContext.newPage();
  await rp.goto(base, { waitUntil: 'networkidle' }); await ready(rp);
  assert(await rp.locator('html').evaluate(el => el.classList.contains('motion-off')));
  assert.equal(await rp.locator('#intro').evaluate(el => el.hidden), true);
  await rp.locator('.menu-toggle').click(); await rp.keyboard.press('Escape');
  await rp.waitForFunction(() => !document.querySelector('#fullscreen-nav').open);
  await reducedContext.close();
  report(`${label} reduced initial state`, 'static content and immediate navigation');

  const failContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const fp = await failContext.newPage();
  await fp.route(/(motion\.js|\/assets\/motion-)/, route => route.abort());
  await fp.goto(base, { waitUntil: 'networkidle' });
  await fp.waitForTimeout(2800);
  assert.equal(await fp.locator('#intro').evaluate(el => el.hidden), true);
  assert(await fp.locator('html').evaluate(el => el.classList.contains('motion-failed')));
  await fp.locator('.menu-toggle').click();
  assert.equal(await fp.locator('#fullscreen-nav').evaluate(el => el.open), true);
  await fp.keyboard.press('Escape');
  await fp.waitForFunction(() => !document.querySelector('#fullscreen-nav').open);
  await assertVisible(fp);
  await failContext.close();
  report(`${label} failed module`, 'preloader fails open, HTML readable, navigation still works');

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 812 } });
  const np = await noJs.newPage(); await np.goto(base);
  assert.equal(await np.locator('#intro').evaluate(el => el.hidden), true);
  assert.equal(await np.locator('#navigation a[href="#about"]').isVisible(), true);
  await noJs.close(); report(`${label} no JavaScript`, 'content and anchor navigation available');
  assert.deepEqual(errors, [], 'Browser console or runtime errors');
  await browser.close();
  fs.writeFileSync(`.verification/${label}-results.json`, JSON.stringify(results, null, 2));
  console.log(`COMPLETE: ${results.length} checks; no console/runtime errors.`);
})().catch(error => { console.error(error); process.exit(1); });
