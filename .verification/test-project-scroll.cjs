const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser=await chromium.launch({channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:950}});
  await page.goto('http://127.0.0.1:5173/#work',{waitUntil:'networkidle'});
  await page.waitForTimeout(1400);
  await page.evaluate(async()=>{
   const urls=performance.getEntriesByType('resource').map(r=>r.name);
   const {gsap}=await import(urls.find(url=>url.includes('/gsap.js?')));
   const {ScrollTrigger}=await import(urls.find(url=>url.includes('/gsap_ScrollTrigger.js?')));
   window.testMotion={gsap,ScrollTrigger};
  });
  const inspect=()=>page.evaluate(()=>({tickers:testMotion.gsap.ticker._listeners.filter(f=>f.name==='tick').length,scroll:scrollY,triggers:testMotion.ScrollTrigger.getAll().length,projects:testMotion.ScrollTrigger.getAll().filter(t=>t.trigger?.matches('.project-card')).map(t=>({slug:t.trigger.dataset.project,progress:t.progress}))}));
  const before=await inspect(); assert.equal(before.tickers,1);
  await page.mouse.wheel(0,650);await page.waitForTimeout(1500);
  const after=await inspect();assert(after.scroll>before.scroll+200);assert.notDeepEqual(after.projects,before.projects);
  assert.equal(after.tickers,1);
  await page.locator('[data-project="crizpo"] h3').hover();await page.waitForTimeout(500);
  const frames=await page.evaluate(()=>new Promise(resolve=>{
   const intervals=[];let previous=performance.now();
   function frame(now){intervals.push(now-previous);previous=now;if(intervals.length<90)requestAnimationFrame(frame);else resolve(intervals.slice(1).sort((a,b)=>a-b))}requestAnimationFrame(frame);
  }));
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
  const reduced=await inspect();assert.equal(reduced.tickers,0);assert.equal(reduced.triggers,0);
  assert(await page.locator('.project-title-motion, .project-action svg').evaluateAll(elements=>elements.every(element=>element.getAnimations().length===0)));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(700);
  assert.equal((await inspect()).tickers,1);
  await page.evaluate(()=>portfolioMotion.destroy());
  assert.equal((await inspect()).tickers,0);assert.equal((await inspect()).triggers,0);
  assert(await page.locator('.project-title-motion').evaluateAll(elements=>elements.every(element=>getComputedStyle(element).transform==='none')));
  const result={before,after,reduced,medianFrameMs:frames[Math.floor(frames.length*.5)],p95FrameMs:frames[Math.floor(frames.length*.95)]};
  fs.writeFileSync('.verification/project-scroll-results.json',JSON.stringify(result,null,2));
  console.log('PASS shared GSAP ticker, Lenis wheel scrolling, ScrollTrigger updates, Motion cleanup, reduced motion and teardown',JSON.stringify(result));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
