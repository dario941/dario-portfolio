const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:5173/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const failures = [], errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.portfolioBoot?.finished && window.portfolioMotion);
    await page.waitForTimeout(2400);
    // Fixture stays in the browser; the portfolio's project array remains empty.
    await page.evaluate(() => {
      document.querySelector('#work-empty').hidden = true;
      const list = document.querySelector('#project-list'); list.hidden = false;
      list.innerHTML = '<article class="project-card"><div class="project-media"><img width="800" height="500" alt="Test fixture" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'500\'%3E%3Crect width=\'800\' height=\'500\' fill=\'%23c3d8a7\'/%3E%3C/svg%3E"></div><div><h3>Preview lifecycle fixture</h3><p>Temporary verification content</p></div></article>';
      list.scrollIntoView();
    });
    await page.waitForTimeout(1500);
    const previewOpacity = () => page.locator('.project-preview').evaluate(el => Number(getComputedStyle(el).opacity));
    await page.locator('.project-card h3').hover();
    await page.waitForTimeout(350);
    assert((await previewOpacity()) > .9, 'Fixture preview opens');

    await page.mouse.move(1, 1);
    await page.waitForTimeout(300);
    await page.locator('.project-card h3').hover();
    await page.waitForTimeout(60);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerleave')));
    await page.waitForTimeout(350);
    if ((await previewOpacity()) > .01) failures.push('Preview fade continues after pointer exit');
    else console.log('PASS pointer exit cancels preview fade');
    await page.locator('.project-card h3').hover();
    await page.waitForTimeout(350);
    if ((await previewOpacity()) < .9) failures.push('Preview does not return after pointer re-entry');
    else console.log('PASS preview pointer re-entry');

    // Re-establish the preview, then remove its card without moving the pointer.
    await page.mouse.move(1, 1);
    await page.locator('.project-card h3').hover();
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      const list = document.querySelector('#project-list');
      list.style.minHeight = `${list.getBoundingClientRect().height}px`;
      document.querySelector('.project-card').remove();
    });
    await page.waitForTimeout(350);
    if ((await previewOpacity()) > .01) failures.push('Removed project leaves a stale preview visible');
    else console.log('PASS project removal clears preview');

    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(60);
    await page.evaluate(() => window.portfolioMotion.destroy());
    const menu = await page.locator('#fullscreen-nav').evaluate(el => ({
      open: el.open,
      background: getComputedStyle(el).backgroundColor,
      visibleLinks: [...el.querySelectorAll('.overlay-links a')].every(link => Number(getComputedStyle(link).opacity) === 1),
      shape: el.querySelector('path').getAttribute('d')
    }));
    if (!menu.visibleLinks || menu.shape !== 'M0 0H100V100Q50 100 0 100Z') failures.push('Interrupted menu teardown leaves incomplete navigation: ' + JSON.stringify(menu));
    else console.log('PASS interrupted menu restores static navigation');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#fullscreen-nav').open);
    assert.deepEqual(errors, [], 'Runtime errors');
    assert.deepEqual(failures, [], 'Animation interruption regressions');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
