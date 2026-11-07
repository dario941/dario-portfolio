const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const output = 'public/projects';
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const manifest = { captured: '2026-11-07', images: [], evidence: {} };
  const capture = async (page, filename, url) => {
    const cdp = await page.context().newCDPSession(page);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'webp', quality: 86, captureBeyondViewport: false });
    const bytes = Buffer.from(data, 'base64');
    fs.writeFileSync(path.join(output, filename), bytes);
    const size = page.viewportSize();
    manifest.images.push({ file: filename, source: url, ...size, bytes: bytes.length });
    console.log(filename, size, bytes.length + ' bytes');
    await cdp.detach();
  };
  try {
    for (const [slug, url, selector] of [['crizpo', 'https://www.crizpoksa.com', '#broast'], ['ar-engineerings', 'https://www.ar-eng.net', '#services']]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(5000); await page.evaluate(() => document.fonts.ready);
      manifest.evidence[slug] = await page.evaluate(() => ({
        title: document.title,
        react: !!document.querySelector('#root')?.firstElementChild && Object.keys(document.querySelector('#root').firstElementChild).some(key => key.startsWith('__react')),
        scripts: [...document.scripts].map(s => s.src).filter(Boolean),
        languageControls: [...document.querySelectorAll('button, a')].filter(el => /العربية|عربي|Arabic/.test(el.textContent)).map(el => ({ tag: el.tagName, text: el.textContent, label: el.getAttribute('aria-label') })),
        whatsapp: [...document.querySelectorAll('a[href]')].map(a => a.href).filter(href => /wa.me|whatsapp/.test(href)),
        metadata: !!document.querySelector('meta[name="description"]'), structuredData: !!document.querySelector('script[type="application/ld+json"]')
      }));
      manifest.evidence[slug].status = response.status();
      manifest.evidence[slug].server = response.headers()['server'];
      await capture(page, `${slug}-desktop.webp`, page.url());
      await page.locator(selector).scrollIntoViewIfNeeded(); await page.waitForTimeout(1800);
      await capture(page, `${slug}-detail.webp`, page.url() + selector);
      await context.close();
      const mobile = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      const phone = await mobile.newPage();
      await phone.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await phone.waitForTimeout(5000); await phone.evaluate(() => document.fonts.ready);
      await capture(phone, `${slug}-mobile.webp`, phone.url());
      console.log(slug + ' evidence: ' + JSON.stringify(manifest.evidence[slug]));
      await mobile.close();
    }
    // Read the reference repository's project component names and source.
    const request = await browser.newContext();
    const treeResponse = await request.request.get('https://api.github.com/repos/aitezazdev/Portfolio/git/trees/main?recursive=1');
    if (treeResponse.ok()) {
      const tree = await treeResponse.json();
      const files = tree.tree.filter(file => /src\/.*(Projects|ProjectItem|ProjectCard|Magnetic|Cursor).*\.tsx$/.test(file.path));
      for (const file of files.slice(0, 6)) {
        const response = await request.request.get('https://raw.githubusercontent.com/aitezazdev/Portfolio/main/' + file.path);
        if (response.ok()) fs.writeFileSync('.verification/client-sites/reference-' + file.path.replaceAll('/', '-'), await response.text());
      }
      console.log('Reference sources: ' + files.map(file => file.path).join(', '));
    }
    await request.close();
    fs.writeFileSync(path.join(output, 'sources.json'), JSON.stringify(manifest, null, 2));
  } finally { await browser.close(); }
})();
