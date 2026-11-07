const { chromium } = require('C:/Users/DARIO/AppData/Local/Temp/dario-reference-audit-f24c4121c7e7404e9941bcb6ebd6fac6/qa/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:5173/';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(base);
    await page.waitForFunction(() => window.portfolioMotion && window.portfolioBoot.finished);
    await page.evaluate(() => document.querySelector('#skills').scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(1600);
    const labels = await page.locator('#skills .tech-label').allTextContents();
    assert.equal(labels.length, 21);
    assert.equal(await page.locator('#skills img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0)), true);
    await page.screenshot({ path: '.verification/master-tech-desktop.png' });
    const visible = async () => page.locator('.skill-row:not([hidden]) .tech-card').count();
    const clean = async () => {
      await page.waitForTimeout(1600);
      assert.equal(await page.locator('#skill-groups').evaluate(el => el.style.height), '');
      const bad = await page.locator('.skill-row:not([hidden]) .tech-card, .skill-row:not([hidden]) .skill-category').evaluateAll(items => items.filter(el => Number(getComputedStyle(el).opacity) < .99 || getComputedStyle(el).visibility === 'hidden').map(el => el.textContent.trim()));
      assert.deepEqual(bad, []);
    };
    for (const [category, count] of [['frontend',7],['tools',3],['backend',5],['additional',6],['all',21]]) {
      await page.locator(`[data-skill-filter="${category}"]`).click();
      await clean();
      assert.equal(await visible(),count);
    }
    console.log('PASS all five filters, local SVGs, visible final content');
    for (const gap of [35, 180, 330]) {
      for (const category of ['frontend','tools','additional','backend','all']) {
        await page.locator(`[data-skill-filter="${category}"]`).evaluate(el => el.click());
        await page.waitForTimeout(gap);
      }
      await clean(); assert.equal(await visible(),21);
    }
    console.log('PASS rapid filter interruption before/during/after layout changes');
    for (const card of await page.locator('#skills .tech-card').all()) {
      await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(160);
      await card.hover(); await page.waitForTimeout(160);
      const transform = await card.locator('.tech-icon-motion').evaluate(el => getComputedStyle(el).transform);
      assert.notEqual(transform,'none');
      await page.mouse.move(1,1);
      await card.locator('.tech-icon-motion').evaluate(el => new Promise((resolve, reject) => {
        const start = performance.now();
        function inspect() {
          const m = new DOMMatrix(getComputedStyle(el).transform);
          if (Math.abs(m.a-1)<.01 && Math.abs(m.d-1)<.01 && Math.abs(m.b)<.01 && Math.abs(m.c)<.01) return resolve();
          if (performance.now()-start>2000) return reject(new Error(`${el.closest('.tech-card').textContent}: did not return to rest (${getComputedStyle(el).transform})`));
          requestAnimationFrame(inspect);
        }
        inspect();
      }));
      const resting = await card.locator('.tech-icon-motion').evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return {a:m.a,b:m.b,c:m.c,d:m.d}; });
      assert.ok(Math.abs(resting.a-1)<.01 && Math.abs(resting.d-1)<.01 && Math.abs(resting.b)<.01 && Math.abs(resting.c)<.01);
    }
    console.log('PASS every icon rotates on hover and returns to rest');
    for (const y of [0,4000,8000,1200,5500,0,4500]) { await page.evaluate(y => scrollTo({top:y,behavior:'instant'}),y); await page.waitForTimeout(80); }
    await page.evaluate(() => document.querySelector('#skills').scrollIntoView({behavior:'instant'}));
    await clean();
    await page.locator('[data-skill-filter="backend"]').click();
    await page.waitForTimeout(60);
    await page.emulateMedia({reducedMotion:'reduce'});
    await clean(); assert.equal(await visible(),5);
    assert.equal(await page.locator('.tech-card-surface,.tech-icon,.tech-icon-motion').evaluateAll(els => els.every(el => getComputedStyle(el).transform === 'none')),true);
    await page.locator('[data-skill-filter="all"]').click(); assert.equal(await visible(),21);
    console.log('PASS reduced motion mid-filter commits latest selection and clears transforms');
    await page.emulateMedia({reducedMotion:'no-preference'}); await clean();
    await page.locator('[data-skill-filter="tools"]').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.skillFilter),'backend');
    await page.keyboard.press('Enter'); await clean(); assert.equal(await visible(),5);
    await page.locator('[data-skill-filter="all"]').click(); await clean();
    for (const width of [320,375,430,768,1024,1440,1920]) {
      await page.setViewportSize({width,height:1000}); await page.waitForTimeout(700);
      await page.evaluate(() => document.querySelector('#skills').scrollIntoView({behavior:'instant'})); await page.waitForTimeout(500);
      const layout = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth>innerWidth, cards:[...document.querySelectorAll('.tech-card')].some(el=>{const b=el.getBoundingClientRect();return b.left<0||b.right>innerWidth+1;})}));
      assert.equal(layout.overflow,false); assert.equal(layout.cards,false);
      if ([320,375,768,1440].includes(width)) await page.screenshot({path:`.verification/master-tech-${width}.png`});
    }
    console.log('PASS keyboard controls and all seven widths');
    const touch = await browser.newPage({viewport:{width:375,height:812},hasTouch:true,isMobile:true});
    await touch.goto(base);
    await touch.waitForFunction(() => window.portfolioMotion && window.portfolioBoot.finished);
    await touch.evaluate(() => document.querySelector('#skills').scrollIntoView({behavior:'instant'}));
    await touch.locator('[data-skill-filter="additional"]').tap();
    await touch.waitForTimeout(1300);
    assert.equal(await touch.locator('.skill-row:not([hidden]) .tech-card').count(),6);
    assert.equal(await touch.locator('.tech-icon').evaluateAll(els => els.every(el => getComputedStyle(el).transform === 'none')),true);
    assert.equal(await touch.locator('.cursor-ring').evaluate(el => { const style=getComputedStyle(el); return style.display === 'none' || Number(style.opacity) === 0; }),true);
    await touch.close();
    console.log('PASS real touch context filtering, no idle/hover or custom cursor');
    assert.deepEqual(errors,[]);
    fs.writeFileSync('.verification/master-tech-results.json',JSON.stringify({passed:true,base,labels,errors},null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
