const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:5173/';
const label = process.argv[3] || 'dev';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.progressLog = [];
    new MutationObserver(records => {
      records.forEach(record => { if (record.target.id === 'intro' && record.attributeName === 'data-progress') window.progressLog.push(record.oldValue); });
    }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-progress'] });
  });
  await page.route(/(motion\.js|\/assets\/motion-)/, async route => { await new Promise(r => setTimeout(r, 650)); await route.continue(); });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: `.verification/${label}-intro.png` });
  await page.waitForFunction(() => window.portfolioBoot?.finished);
  assert.deepEqual(await page.evaluate(() => [...progressLog.filter(value => value !== null).map(Number), Number(document.querySelector('#intro').dataset.progress)]), [15,45,65,100]);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('dario-intro-v1')), '1');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('#intro').evaluate(el => el.hidden), true);
  await page.waitForFunction(() => window.portfolioBoot?.finished);
  const original = fs.readFileSync('.verification/index.before-characters.html', 'utf8');
  const changed = await page.evaluate(original => {
    const before = new DOMParser().parseFromString(original, 'text/html');
    const selectors = ['.hero-name','.hero-role','.hero-statement','.about-copy','.timeline','.services-grid','.skill-groups','#work-empty','.contact-heading','.contact-copy','.email-link'];
    const text = node => node.textContent.replace(/\s+/g, ' ').trim();
    return selectors.filter(selector => {
      const normalize = value => (selector === '.hero-name' ? value.replace(/\s/g, '') : value)
        .replace('a web developer based in Saudi Arabia, focused', 'a web developer focused')
        .replace('Based in Saudi Arabia', '')
        .replace('IT and Software Engineer', 'Web/Software and IT Lead').replace(/\s+/g, ' ').trim();
      return normalize(text(before.querySelector(selector))) !== normalize(text(document.querySelector(selector)));
    });
  }, original);
  assert.deepEqual(changed, [], 'Existing content changed');
  console.log(`PASS ${label}: actual 15/45/65/100 initialization milestones; intro once per session; original content preserved.`);
  await context.close();

  const blocked = await browser.newContext(); const stalled = await blocked.newPage();
  await stalled.route(/(motion\.js|\/assets\/motion-)/, route => new Promise(() => {}));
  await stalled.goto(base, { waitUntil: 'domcontentloaded' });
  await stalled.waitForFunction(() => document.querySelector('#intro').hidden, null, { timeout: 3500 });
  assert(await stalled.locator('html').evaluate(el => el.classList.contains('motion-failed')));
  await stalled.locator('.menu-toggle').click();
  assert.equal(await stalled.locator('#fullscreen-nav').evaluate(el => el.open), true);
  console.log(`PASS ${label}: stalled import releases intro independently and core navigation works.`);
  await blocked.close();

  const skippedContext = await browser.newContext(); const skipped = await skippedContext.newPage();
  await skipped.route(/(motion\.js|\/assets\/motion-)/, route => new Promise(() => {}));
  await skipped.goto(base, { waitUntil: 'domcontentloaded' });
  await skipped.locator('.intro-skip').click();
  assert.equal(await skipped.locator('#intro').evaluate(el => el.hidden), true);
  assert.equal(await skipped.locator('body').evaluate(el => el.classList.contains('menu-open')), false);
  console.log(`PASS ${label}: skip intro works without loading the motion library.`);
  await skippedContext.close(); await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
