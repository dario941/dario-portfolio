const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:4173/';
const records = [];
const projects = [
  { slug: 'crizpo', title: 'CRIZPO', number: '03', live: 'https://www.crizpoksa.com/' },
  { slug: 'ar-engineerings', title: 'AR Engineerings', number: '04', live: 'https://www.ar-eng.net/' }
];
const pause = (page, ms = 1050) => page.waitForTimeout(ms);
const noOverflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow');
const preview = page => page.locator('.project-preview');
const opacity = locator => locator.evaluate(element => Number(getComputedStyle(element).opacity));
async function sourceChecks(page) {
  const old = fs.readFileSync('.verification/works-before/index.html', 'utf8');
  const current = fs.readFileSync('index.html', 'utf8');
  const preserved = await page.evaluate(({ old, current }) => {
    const before = new DOMParser().parseFromString(old, 'text/html');
    const after = new DOMParser().parseFromString(current, 'text/html');
    return ['#intro', '.site-header', '#fullscreen-nav', '#home', '#about', '#experience', '#services', '#skills', '#contact', '.site-footer'].map(selector => ({ selector, same: before.querySelector(selector)?.outerHTML === after.querySelector(selector)?.outerHTML }));
  }, { old, current });
  assert(preserved.every(item => item.same), JSON.stringify(preserved));
  assert.equal(old.match(/<style>([\s\S]*?)<\/style>/)[1], current.match(/<style>([\s\S]*?)<\/style>/)[1], 'Existing design CSS unchanged');
  for (const file of ['preloader.js', 'preloader.css', 'fonts.css', 'tech-stack.js', 'tech-stack.css', 'flow-field.js', 'package.json', 'package-lock.json']) {
    assert.equal(fs.readFileSync(file, 'utf8'), fs.readFileSync('.verification/works-before/' + file, 'utf8'), `${file} unchanged`);
  }
  console.log('PASS source preservation: intro, hero, navbar, other sections, design tokens and dependencies');
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  const watch = page => { page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); }); };
  try {
    const startup = await browser.newPage(); watch(startup);
    await startup.addInitScript(() => {
      window.greetings = [];
      new MutationObserver(records => records.forEach(record => {
        if (record.target.id === 'intro' && record.attributeName === 'data-greeting') greetings.push(record.target.dataset.greeting);
      })).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-greeting'] });
    });
    await startup.goto(base, { waitUntil: 'domcontentloaded' });
    await startup.waitForFunction(() => window.portfolioBoot?.finished);
    assert.deepEqual(await startup.evaluate(() => greetings), ['Hello', 'Hola', 'Bonjour', 'Ciao', 'مرحبا', 'こんにちは', 'ನಮಸ್ಕಾರ', 'नमस्ते']);
    await sourceChecks(startup);
    await startup.close();

    for (const width of [320, 375, 768, 1024, 1440, 1920]) {
      const touch = width <= 768;
      const context = await browser.newContext({ viewport: { width, height: 950 }, isMobile: touch, hasTouch: touch });
      const page = await context.newPage(); watch(page);
      await page.goto(base + '#work', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.portfolioBoot?.finished && window.portfolioMotion);
      assert.equal(await page.locator('.project-card').count(), 2);
      assert(await page.locator('#work-empty').evaluate(element => element.hidden));
      for (const project of projects) {
        const card = page.locator(`.project-card[data-project="${project.slug}"]`);
        await card.scrollIntoViewIfNeeded(); await pause(page);
        assert.equal(await card.locator('h3').innerText(), project.title);
        assert((await card.locator('.project-category').innerText()).startsWith(project.number + ' /'));
        assert(await card.locator('img').evaluate(img => img.complete && img.naturalWidth === 1440 && img.loading === 'lazy' && !!img.alt));
        assert.equal(await card.locator('.project-media').evaluate(element => getComputedStyle(element).clipPath), 'none');
        await noOverflow(page);
        const live = card.locator('.project-links a[target="_blank"]');
        assert.equal(await live.evaluate(link => link.href), project.live);
        assert.equal(await live.getAttribute('rel'), 'noopener noreferrer');
        const action = card.locator('.project-action');
        assert((await action.boundingBox()).height >= 44);
        if (!touch) {
          await card.locator('h3').hover(); await pause(page, 520);
          assert((await opacity(preview(page))) > .98, 'Preview appears');
          assert.equal(await preview(page).getAttribute('data-project'), project.slug);
          const bounds = await preview(page).boundingBox();
          assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= 950, 'Preview stays inside viewport');
          assert.equal(await preview(page).evaluate(element => getComputedStyle(element).pointerEvents), 'none');
          await action.hover(); await pause(page, 300);
          assert((await opacity(preview(page))) < .01, 'Project links have no floating preview over them');
          assert.notEqual(await action.locator('svg').evaluate(element => getComputedStyle(element).transform), 'none', 'Motion animates the arrow');
          await card.locator('h3').hover(); await pause(page, 60);
          await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerleave')));
          await pause(page, 450);
          assert((await opacity(preview(page))) < .01, 'Interrupted preview cannot reappear');
          await card.locator('h3').hover(); await pause(page, 500);
          assert((await opacity(preview(page))) > .98, 'Re-entry works');
        } else assert.equal(await preview(page).evaluate(element => getComputedStyle(element).display), 'none');
        // A single click/tap opens the static detail route, and browser Back restores Work.
        await action.click(); await page.waitForURL(`**/projects/${project.slug}/`); await pause(page);
        assert((await page.locator('h1').innerText()).replace(/\s|\./g, '').toLowerCase() === project.title.replace(/\s/g, '').toLowerCase());
        assert.equal(await page.locator('.case-facts dd').count(), 4);
        assert((await page.locator('.case-facts').innerText()).includes('On-site client project'));
        for (const section of ['.case-cover', '.case-gallery', '.case-features', '.case-launch']) {
          await page.locator(section).scrollIntoViewIfNeeded(); await pause(page, 950); await noOverflow(page);
        }
        assert(await page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0 && !!img.alt)));
        assert.equal(await page.locator('.case-launch a').evaluate(link => link.href), project.live);
        assert.equal(await page.locator('.case-launch a').getAttribute('rel'), 'noopener noreferrer');
        assert.equal(await page.locator('html').evaluate(element => element.classList.contains('lenis')), !touch);
        await page.goBack({ waitUntil: 'networkidle' }); await pause(page, 500);
        assert.equal(await page.locator('.project-card').count(), 2);
        assert(await page.locator('#intro').evaluate(element => element.hidden));
      }
      records.push({ width, touch, cards: 2, detailPages: 2, overflow: false });
      await context.close();
      console.log(`PASS ${width}px: both projects, screenshots, links, details, touch/hover, history and layout`);
    }

    const keyboardContext = await browser.newContext();
    const keyboard = await keyboardContext.newPage(); watch(keyboard);
    await keyboard.goto(base + '#work'); await pause(keyboard, 1500);
    const action = keyboard.locator('[data-project="crizpo"] .project-action');
    await action.focus();
    assert.equal(await action.evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
    await keyboard.keyboard.press('Enter'); await keyboard.waitForURL('**/projects/crizpo/');
    await keyboard.locator('.case-back').focus(); await keyboard.keyboard.press('Enter'); await keyboard.waitForURL('**/#work');
    // Check actual popup routing without sending requests to the client sites.
    await keyboardContext.route('https://www.crizpoksa.com/**', route => route.fulfill({ status: 200, body: 'Link target verified' }));
    const popupPromise = keyboard.waitForEvent('popup');
    await keyboard.locator('[data-project="crizpo"] .project-links a[target="_blank"]').click();
    const popup = await popupPromise; await popup.waitForLoadState();
    assert.equal(popup.url(), projects[0].live); assert(await popup.evaluate(() => window.opener === null));
    await popup.close(); await keyboardContext.close();
    console.log('PASS keyboard navigation, visible focus, new-tab routing and opener isolation');

    const reduced = await browser.newContext({ reducedMotion: 'reduce' });
    const reducedPage = await reduced.newPage(); watch(reducedPage);
    for (const route of ['#work', 'projects/crizpo/', 'projects/ar-engineerings/']) {
      await reducedPage.goto(base + route, { waitUntil: 'networkidle' });
      await noOverflow(reducedPage);
      assert.equal(await reducedPage.locator('html').evaluate(element => element.classList.contains('lenis')), false);
      assert(await reducedPage.locator('[data-case-reveal]').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1')));
    }
    await reducedPage.emulateMedia({ reducedMotion: 'no-preference' }); await pause(reducedPage, 300);
    await reducedPage.emulateMedia({ reducedMotion: 'reduce' }); await pause(reducedPage, 100);
    assert.equal(await reducedPage.locator('html').evaluate(element => element.classList.contains('lenis')), false);
    assert(await reducedPage.locator('[data-case-image]').evaluateAll(elements => elements.every(element => getComputedStyle(element).clipPath === 'none')));
    await reduced.close();
    console.log('PASS reduced motion initially and when changed live; animation cleanup');

    const staticContext = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await staticContext.newPage();
    for (const project of projects) {
      await staticPage.goto(base + 'projects/' + project.slug + '/');
      assert(await staticPage.locator('h1').isVisible());
      assert(await staticPage.locator('.case-introduction a').isVisible());
    }
    await staticPage.goto(base + '#work'); assert.equal(await staticPage.locator('noscript a').count(), 2);
    await staticContext.close();
    assert.deepEqual(errors, [], 'No browser runtime or resource errors');
    fs.writeFileSync('.verification/client-project-results.json', JSON.stringify({ base, records, errors }, null, 2));
    console.log('PASS no-JavaScript reading/navigation; no runtime or resource errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
