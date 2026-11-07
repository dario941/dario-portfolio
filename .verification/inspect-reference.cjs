const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  try {
    await page.goto('https://aitezaz.xyz/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    const initial = await page.evaluate(() => ({ title: document.title, chars: document.querySelectorAll('.hero-char').length,
      sections: [...document.querySelectorAll('section[id]')].map(el => ({ id: el.id, y: el.getBoundingClientRect().top + scrollY })),
      buttons: [...document.querySelectorAll('button')].map(el => el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 20) }));
    await page.screenshot({ path: '.verification/reference-current-hero.png' });
    await page.locator('h1').hover(); await page.waitForTimeout(150);
    initial.hover = await page.locator('.hero-char').evaluateAll(elements => elements.map(el => getComputedStyle(el).transform));
    for (const [name, selector] of [['about', '#about-section-wrapper'], ['skills', '#tech-stack'], ['services', '#services']]) {
      const target = page.locator(selector).first();
      if (await target.count()) { await target.scrollIntoViewIfNeeded(); await page.waitForTimeout(1600); await page.screenshot({ path: `.verification/reference-current-${name}.png` }); }
    }
    const backend = page.getByRole('button', { name: 'Backend & Real-Time', exact: true });
    if (await backend.count()) {
      await backend.click(); await page.waitForTimeout(900);
      initial.filtered = await page.locator('#tech-stack').innerText();
      await page.screenshot({ path: '.verification/reference-current-filter.png' });
    }
    fs.writeFileSync('.verification/reference-current.json', JSON.stringify(initial, null, 2));
    console.log(JSON.stringify(initial, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
