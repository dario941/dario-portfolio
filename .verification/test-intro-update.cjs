const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.argv[2] || 'http://127.0.0.1:5173/';
const label = process.argv[3] || 'intro-update-dev';
const expected = ['Hello', 'Hola', 'Bonjour', 'Ciao', 'مرحبا', 'こんにちは', 'ನಮಸ್ಕಾರ', 'नमस्ते'];
const before = path.join(__dirname, 'intro-2026-11-07-before');
const near = (actual, wanted, tolerance, message) => assert(Math.abs(actual - wanted) <= tolerance, `${message}: ${actual} versus ${wanted}`);

async function observe(page) {
  await page.addInitScript(() => {
    window.introAudit = { greetings: [], frames: [], milestones: [], shifts: 0, shiftDetails: [] };
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput && !window.portfolioBoot?.finished && entry.sources.some(source => source.node?.closest?.('#intro'))) {
          const sources = entry.sources.filter(source => source.node?.closest?.('#intro'));
          const movement = Math.max(...sources.map(source => Math.abs(source.currentRect.top - source.previousRect.top)));
          introAudit.shifts = Math.max(introAudit.shifts, movement);
          introAudit.shiftDetails.push({ at: entry.startTime, movement, sources: sources.map(source => source.node.outerHTML.slice(0, 150)) });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new MutationObserver(records => {
      const intro = document.querySelector('#intro');
      if (!intro) return;
      for (const record of records) {
        if (record.target !== intro) continue;
        if (record.attributeName === 'data-greeting') introAudit.greetings.push({ text: intro.dataset.greeting, at: performance.now() });
        if (record.attributeName === 'data-progress') introAudit.milestones.push(Number(intro.dataset.progress));
        if (record.attributeName === 'hidden' && intro.hidden) introAudit.end = performance.now();
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['hidden', 'data-greeting', 'data-progress'] });
    document.addEventListener('DOMContentLoaded', () => {
      const intro = document.querySelector('#intro');
      const step = () => {
        if (intro.hidden) return;
        const greeting = [...intro.querySelectorAll('.intro-greeting')].find(word => getComputedStyle(word).opacity > .98);
        const rect = greeting?.getBoundingClientRect();
        const bounds = intro.querySelector('.intro-greetings').getBoundingClientRect();
        introAudit.frames.push({
          at: performance.now(), percent: Number(document.querySelector('#intro-percent').textContent),
          greeting: greeting?.textContent,
          fits: !rect || (rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1),
          centered: !rect || Math.abs(rect.left + rect.width / 2 - (bounds.left + bounds.width / 2)) < 1,
          brand: getComputedStyle(intro.querySelector('.intro-name')).visibility === 'visible',
          cleared: [...intro.querySelectorAll('.intro-panel')].every(panel => panel.getBoundingClientRect().bottom <= 0),
          heroInk: [...document.querySelectorAll('.hero-char, .nav-shell > .brand')].some(element => Number(getComputedStyle(element).opacity) > .05),
          covered: [...intro.querySelectorAll('.intro-panel')].every(panel => panel.getBoundingClientRect().bottom >= innerHeight - 1)
        });
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
}

async function timelineAudit(page) {
  await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(r => r.name).find(url => url.includes('/gsap.js?'));
    if (!url) return; // Production uses the bundled GSAP instance; measure wall time there.
    const { gsap } = await import(url);
    const effective = animation => animation.duration() / animation.timeScale();
    const timelines = () => gsap.globalTimeline.getChildren().filter(animation => animation.getChildren);
    const targets = timeline => timeline.getChildren().flatMap(animation => animation.targets?.() || []);
    const greeting = timelines().find(timeline => targets(timeline).some(target => target.matches?.('.intro-greeting')));
    introAudit.greetingDuration = effective(greeting);
    introAudit.secondCue = greeting.getChildren().filter(animation => animation.duration() === 0)[1].startTime() / greeting.timeScale();
    introAudit.greetingFade = effective(greeting.getChildren().find(animation => animation.targets?.().some(target => target.matches?.('.intro-greeting')))) / greeting.timeScale();
    introAudit.orbitDuration = effective(gsap.getTweensOf('.intro-orbit')[0]);
    const poll = () => {
      const exit = timelines().find(timeline => targets(timeline).some(target => target.matches?.('.intro-panel')));
      if (exit) {
        introAudit.exitDuration = effective(exit);
        introAudit.revealOffset = exit.getChildren().find(animation => animation.vars.onComplete && animation.duration() === 0)?.startTime();
      } else if (!portfolioBoot.finished) requestAnimationFrame(poll);
    };
    poll();
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = [];
  try {
    if (base.includes(':5173')) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await observe(page);
      await page.route(base, route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(before, 'index.html'), 'utf8') }));
      for (const file of ['preloader.js', 'preloader.css', 'fonts.css']) {
        await page.route(new RegExp('/' + file.replace('.', '\\.') + '(?:\\?.*)?$'), route => route.fulfill({ contentType: file.endsWith('.js') ? 'text/javascript' : 'text/css', body: fs.readFileSync(path.join(before, file), 'utf8') }));
      }
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#intro').dataset.greeting);
      await timelineAudit(page);
      await page.waitForFunction(() => portfolioBoot.finished);
      const audit = await page.evaluate(() => introAudit);
      near(audit.greetingDuration + audit.exitDuration, 3.24, 1e-6, 'Original GSAP duration');
      await context.close();
      console.log('PASS baseline: original GSAP intro is exactly 3.24 seconds');
    }
    for (const [width, height] of [[320, 740], [375, 812], [768, 1024], [1440, 950], [812, 375]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await observe(page);
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#intro').dataset.greeting);
      await timelineAudit(page);
      if (width === 375 || width === 1440) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument');
        for (const lang of ['ja', 'kn', 'hi']) {
          await page.waitForFunction(lang => document.querySelector('#intro').dataset.greeting === document.querySelector(`.intro-greeting[lang="${lang}"]`).textContent, lang, { polling: 'raf' });
          await page.waitForTimeout(150);
          const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `.intro-greeting[lang="${lang}"]` });
          const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
          assert(fonts.some(font => font.isCustomFont && font.glyphCount > 0), `Local Noto glyphs actually render for ${lang}`);
          await page.screenshot({ path: `.verification/${label}-${width}-${lang}.png` });
        }
      }
      await page.waitForFunction(() => portfolioBoot.finished);
      const audit = await page.evaluate(() => introAudit);
      assert.deepEqual(audit.greetings.map(greeting => greeting.text), expected, 'Exact greeting sequence');
      assert.equal(new Set(expected).size, expected.length);
      // Scene initialization can delay the first rendered frame. Use the second
      // greeting as the clock anchor while GSAP verifies the exact authored ratio.
      const elapsed = audit.end - audit.greetings[1].at + (audit.secondCue || (.3 * 1.55 / 1.8 * 1.4)) * 1000;
      near(elapsed, 4536, 70, 'Full intro wall time');
      if (audit.greetingDuration) {
        near(audit.greetingDuration, 1.95 * 1.4, 1e-6, 'Greeting timing');
        near(audit.greetingFade, .18 * 1.4, 1e-6, 'Greeting fades also slow by exactly 40%');
        near(audit.exitDuration, 1.29 * 1.4, 1e-6, 'DARIO and curtain timing');
        near(audit.orbitDuration, 2.3 * 1.4, 1e-6, 'Orbit timing');
        near((audit.greetingDuration + audit.exitDuration) / 3.24, 1.4, 1e-6, 'Exact duration ratio');
      }
      assert(audit.frames.every(frame => frame.fits && frame.centered), 'Greetings fit and stay centered');
      for (const text of expected) assert(audit.frames.some(frame => frame.greeting === text), `Greeting becomes fully visible: ${text}`);
      assert(audit.frames.some(frame => frame.brand), 'DARIO is revealed');
      assert(audit.frames.some(frame => !frame.covered), 'Curtain animates out');
      assert(audit.frames.every(frame => !frame.cleared || frame.heroInk), 'Hero is visible when curtains clear; no blank handoff');
      assert(audit.frames.every((frame, index, frames) => !index || frame.percent >= frames[index - 1].percent), 'Loading counter never jumps backwards');
      assert.equal(audit.frames.at(-1).percent, 100, 'Loading counter finishes before exit');
      assert(audit.shifts <= 1, `No intro vertical layout shifts: ${JSON.stringify(audit.shiftDetails)}`);
      assert.deepEqual(errors, [], 'No runtime or resource errors');
      await page.waitForTimeout(1800);
      const final = await page.evaluate(original => {
        const prior = new DOMParser().parseFromString(original, 'text/html');
        const normalize = node => node.textContent.replace(/\s+/g, '').trim();
        return {
          contentUnchanged: ['.site-header', 'main', '.site-footer'].every(selector => normalize(document.querySelector(selector)) === normalize(prior.querySelector(selector))),
          inert: [...document.querySelectorAll('.site-header, main, .site-footer')].some(element => element.inert),
          locked: document.documentElement.classList.contains('intro-active'),
          heroVisible: getComputedStyle(document.querySelector('.hero-name')).opacity === '1',
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          fonts: ['Noto Sans JP', 'Noto Sans Kannada', 'Noto Sans Devanagari'].map(font => document.fonts.check(`400 36px "${font}"`))
        };
      }, fs.readFileSync(path.join(before, 'index.html'), 'utf8'));
      assert(final.contentUnchanged && final.heroVisible && !final.inert && !final.locked && !final.overflow);
      assert(final.fonts.every(Boolean), 'All three local fonts loaded');
      if (width === 375 || width === 1440) await page.screenshot({ path: `.verification/${label}-${width}-hero.png` });
      results.push({ width, height, milliseconds: elapsed, greetingDuration: audit.greetingDuration, exitDuration: audit.exitDuration, shifts: audit.shifts, frames: audit.frames.length, final });
      await page.reload({ waitUntil: 'domcontentloaded' });
      assert(await page.locator('#intro').evaluate(element => element.hidden), 'Repeat visits skip intro');
      await context.close();
      console.log(`PASS ${label} ${width}x${height}: all 8 greetings, duration, fonts, bounds, progress and hero`);
    }
    for (const action of ['skip', 'escape', 'reduced-motion', 'live-reduced-motion', 'failed-import', 'stalled-import']) {
      const context = await browser.newContext({ reducedMotion: action === 'reduced-motion' ? 'reduce' : 'no-preference' });
      const page = await context.newPage();
      if (action === 'failed-import') await page.route(/(motion\.js|\/assets\/motion-)/, route => route.abort());
      if (action === 'stalled-import') await page.route(/(motion\.js|\/assets\/motion-)/, () => new Promise(() => {}));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      if (action === 'skip') await page.locator('.intro-skip').click();
      if (action === 'escape') await page.keyboard.press('Escape');
      if (action === 'live-reduced-motion') { await page.waitForTimeout(400); await page.emulateMedia({ reducedMotion: 'reduce' }); }
      await page.waitForFunction(() => document.querySelector('#intro').hidden);
      assert(!(await page.locator('html').evaluate(element => element.classList.contains('intro-active'))));
      await context.close();
      console.log(`PASS ${label}: ${action}`);
    }
    fs.writeFileSync(`.verification/${label}-results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
