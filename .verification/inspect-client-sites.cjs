const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  fs.mkdirSync('.verification/client-sites', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [name, url] of [['crizpo', 'https://www.crizpoksa.com'], ['ar-engineerings', 'https://www.ar-eng.net'], ['reference', 'https://aitezaz.xyz/']]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(6500);
        const info = await page.evaluate(() => ({
          url: location.href, title: document.title, text: document.body.innerText.slice(0, 18000),
          links: [...document.querySelectorAll('a[href]')].map(a => ({ text: a.textContent.trim().slice(0, 70), href: a.href })).filter(a => a.text),
          sections: [...document.querySelectorAll('section[id]')].map(s => ({ id: s.id, y: s.getBoundingClientRect().top + scrollY, text: s.innerText.slice(0, 120) })),
          scripts: [...document.scripts].map(s => s.src).filter(Boolean),
          videos: [...document.querySelectorAll('video')].map(v => ({ src: v.currentSrc, ready: v.readyState, time: v.currentTime, paused: v.paused })),
          metadata: [...document.querySelectorAll('meta[name],meta[property]')].map(m => ({ name: m.name || m.getAttribute('property'), content: m.content })),
          jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent.slice(0, 4000))
        }));
        info.status = response?.status();
        await page.screenshot({ path: `.verification/client-sites/${name}-initial.png` });
        if (name === 'reference') {
          const projects = page.locator('#projects');
          if (await projects.count()) {
            await projects.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
            await page.screenshot({ path: '.verification/client-sites/reference-projects.png' });
            info.projects = await projects.evaluate(e => ({ text: e.innerText, html: e.outerHTML.slice(0, 22000) }));
            const first = projects.locator('a').first();
            if (await first.count()) { await first.hover(); await page.waitForTimeout(500); await page.screenshot({ path: '.verification/client-sites/reference-hover.png' }); }
          }
        }
        fs.writeFileSync(`.verification/client-sites/${name}.json`, JSON.stringify(info, null, 2));
        console.log(JSON.stringify({ name, status: info.status, title: info.title, text: info.text.slice(0, 2200), sections: info.sections, videos: info.videos }));
      } catch (error) { console.log(name + ': ' + error.message); }
      await page.close();
    }
  } finally { await browser.close(); }
})();
