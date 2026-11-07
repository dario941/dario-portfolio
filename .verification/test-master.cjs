const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:4173/';
const results = [];
const report = (name, detail) => { results.push({ name, detail }); console.log('PASS', name, detail || ''); };
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const errors = [];
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      window.greetings = [];
      new MutationObserver(records => records.forEach(record => {
        if (record.target.id === 'intro' && record.attributeName === 'data-greeting') window.greetings.push(record.target.dataset.greeting);
      })).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-greeting'] });
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#intro').dataset.greeting === 'Bonjour', null, { polling: 10 });
    assert(await page.locator('main').evaluate(e => e.inert));
    await page.mouse.wheel(0, 600);
    assert.equal(await page.evaluate(() => scrollY), 0, 'Scroll must remain locked during intro');
    await page.screenshot({ path: '.verification/master-intro-desktop.png' });
    await page.waitForFunction(() => document.querySelector('#intro').dataset.greeting === 'നമസ്കാരം', null, { polling: 10 });
    await page.waitForTimeout(120);
    await page.screenshot({ path: '.verification/master-intro-malayalam.png' });
    await page.waitForFunction(() => window.portfolioBoot?.finished);
    const startup = await page.evaluate(() => ({ words: greetings, duration: performance.now() - portfolioBoot.started,
      locked: document.documentElement.classList.contains('intro-active'), inert: document.querySelector('main').inert,
      failed: document.documentElement.classList.contains('motion-failed'), progress: document.querySelector('#intro').dataset.progress }));
    console.log('Startup measurements', JSON.stringify(startup), 'Errors', errors);
    assert.deepEqual(startup.words, ['Hello', 'Hola', 'Bonjour', 'Ciao', 'مرحبا', 'Namaste', 'നമസ്കാരം']);
    assert.equal(startup.locked, false); assert.equal(startup.inert, false); assert.equal(startup.failed, false);
    assert.equal(startup.progress, '100'); assert(startup.duration < 4300);
    report('Seven-greeting introduction', startup);
    await page.waitForTimeout(2000);
    const fonts = await page.evaluate(() => [...document.fonts].map(f => ({ family: f.family, status: f.status })));
    assert(fonts.every(f => f.status === 'loaded'), JSON.stringify(fonts));
    await page.screenshot({ path: '.verification/master-hero-desktop.png' });
    report('Local typography', fonts);
    const original = fs.readFileSync('.verification/master-before.html', 'utf8');
    const preservation = await page.evaluate(original => {
      const before = new DOMParser().parseFromString(original, 'text/html');
      const normalize = text => text.replace(/\s+/g, ' ').trim();
      const selectors = ['.hero-role', '.hero-statement', '.about-copy', '.timeline', '.services-grid', '#work-empty', '.contact-heading', '.contact-copy', '.email-link'];
      return {
        changed: selectors.filter(s => normalize(before.querySelector(s).textContent) !== normalize(document.querySelector(s).textContent)),
        oldSkills: [...before.querySelectorAll('#skills .skill-list li')].map(el => el.textContent),
        skills: [...document.querySelectorAll('.tech-label')].map(el => el.textContent),
        oldLinks: [...before.querySelectorAll('main a, nav a, footer a')].map(a => a.getAttribute('href')),
        links: [...document.querySelectorAll('main a, nav a, footer a')].map(a => a.getAttribute('href')),
      };
    }, original);
    assert.deepEqual(preservation.changed, []); assert.deepEqual(preservation.skills, preservation.oldSkills);
    assert.deepEqual(preservation.links, preservation.oldLinks);
    report('Content preserved', 'All 21 original skill labels, experience/services/contact copy, and navigation/project links unchanged.');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(await page.locator('#intro').evaluate(e => e.hidden));
    await page.waitForFunction(() => portfolioBoot.finished);
    report('Session persistence', 'Refresh does not replay the introduction.');
    assert.deepEqual(errors, []);
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true });
    const mp = await mobile.newPage();
    await mp.goto(base, { waitUntil: 'domcontentloaded' });
    await mp.waitForFunction(() => document.querySelector('#intro').dataset.greeting === 'നമസ്കാരം', null, { polling: 10 });
    await mp.waitForTimeout(100);
    await mp.screenshot({ path: '.verification/master-intro-320.png' });
    const scriptBox = await mp.locator('.intro-greeting[lang="ml"]').boundingBox();
    assert(scriptBox.x >= 0 && scriptBox.x + scriptBox.width <= 320, JSON.stringify(scriptBox));
    await mp.waitForFunction(() => portfolioBoot.finished);
    assert.equal(await mp.evaluate(() => document.documentElement.classList.contains('lenis')), false);
    await mobile.close(); report('320px preloader', 'Complete Malayalam text fits; touch keeps native scrolling.');

    const stalled = await browser.newContext(); const sp = await stalled.newPage();
    await sp.route(/\/assets\/motion-/, () => new Promise(() => {}));
    await sp.goto(base, { waitUntil: 'domcontentloaded' });
    await sp.waitForFunction(() => portfolioBoot.finished, null, { timeout: 3300 });
    assert(await sp.locator('#intro').evaluate(e => e.hidden));
    assert.equal(await sp.locator('main').evaluate(e => e.inert), false);
    assert.equal(await sp.evaluate(() => document.documentElement.classList.contains('intro-active')), false);
    await stalled.close(); report('Stalled import', 'Independent 2.5s deadline releases overlay, scroll lock and content.');

    const skip = await browser.newContext(); const kp = await skip.newPage();
    await kp.goto(base, { waitUntil: 'domcontentloaded' });
    await kp.locator('.intro-skip').click();
    assert(await kp.locator('#intro').evaluate(e => e.hidden));
    assert.equal(await kp.locator('main').evaluate(e => e.inert), false);
    await kp.reload({ waitUntil: 'domcontentloaded' });
    assert(await kp.locator('#intro').evaluate(e => e.hidden));
    await skip.close(); report('Skip', 'Immediate dismissal and session persistence.');

    const reduced = await browser.newContext({ reducedMotion: 'reduce' }); const rp = await reduced.newPage();
    await rp.goto(base, { waitUntil: 'networkidle' });
    assert(await rp.locator('#intro').evaluate(e => e.hidden));
    assert.equal(await rp.locator('main').evaluate(e => e.inert), false);
    await rp.locator('[data-skill-filter="tools"]').click();
    assert.equal(await rp.locator('.skill-row:visible').count(), 1);
    await reduced.close(); report('Reduced motion', 'No intro, no inert content, instant functional filtering.');
    fs.writeFileSync('.verification/master-results.json', JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
