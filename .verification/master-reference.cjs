const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const width of [1440, 375]) {
      const context = await browser.newContext({ viewport: { width, height: 950 }, ...(width === 375 ? {isMobile: true, hasTouch: true, deviceScaleFactor: 2} : {}) });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('https://aitezaz.xyz/', {waitUntil: 'domcontentloaded', timeout: 45000});
      await page.waitForTimeout(5000);
      const result = {width, title: await page.title(), errors};
      await page.screenshot({path: `.verification/master-reference-hero-${width}.png`});
      result.sections = await page.locator('section[id]').evaluateAll(els => els.map(el => ({id: el.id, y: el.getBoundingClientRect().top + scrollY})));
      result.hero = await page.locator('h1').innerText();
      if (width === 1440) {
        await page.locator('h1').hover();
        await page.waitForTimeout(120);
        result.hover = await page.locator('.hero-char').evaluateAll(els => els.map(el => getComputedStyle(el).transform));
      }
      const stack = page.locator('#tech-stack');
      await stack.scrollIntoViewIfNeeded();
      await page.evaluate(() => { const el=document.querySelector('#tech-stack'); window.__lenis?.scrollTo(el,{immediate: true}); if(!window.__lenis) el.scrollIntoView(); });
      await page.waitForTimeout(1800);
      await page.screenshot({path: `.verification/master-reference-stack-${width}.png`});
      result.tech = await stack.innerText();
      result.overflow = await page.evaluate(() => ({width: innerWidth, scrollWidth: document.documentElement.scrollWidth}));
      const backend = page.getByRole('button',{name:'Backend & Real-Time',exact:true});
      await backend.click();
      await page.waitForTimeout(900);
      result.filtered = await stack.innerText();
      await page.screenshot({path: `.verification/master-reference-filter-${width}.png`});
      if(width === 1440) {
        const card = stack.locator('.tech-item').first();
        await card.hover();
        await page.waitForTimeout(280);
        result.iconHover = await card.locator('img').evaluate(el=>getComputedStyle(el).transform);
        await page.waitForTimeout(600);
        result.iconSettled = await card.locator('img').evaluate(el=>getComputedStyle(el).transform);
      }
      results.push(result);
      await context.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync('.verification/master-reference-results.json', JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
