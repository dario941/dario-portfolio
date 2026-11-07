const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});const errors=[];
 try {
  const page=await browser.newPage({viewport:{width:1440,height:950}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.audit={greetings:[],handoff:[]};
   new MutationObserver(records=>{for(const r of records)if(r.target.id==='intro'&&r.attributeName==='data-greeting')audit.greetings.push(r.target.dataset.greeting)}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-greeting']});
   document.addEventListener('DOMContentLoaded',()=>{const frame=()=>{const intro=document.querySelector('#intro');if(intro.hidden)return;const panels=[...intro.querySelectorAll('.intro-panel')];if(panels.length&&panels.every(panel=>panel.getBoundingClientRect().bottom<innerHeight*.6))audit.handoff.push([...document.querySelectorAll('.hero-char,.nav-shell > .brand')].some(e=>Number(getComputedStyle(e).opacity)>.05));requestAnimationFrame(frame)};requestAnimationFrame(frame)});
  });
  await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#intro').dataset.greeting);
  const durations=await page.evaluate(async()=>{
   const urls=performance.getEntriesByType('resource').map(r=>r.name);const {gsap}=await import(urls.find(u=>u.includes('/gsap.js?')));const {ScrollTrigger}=await import(urls.find(u=>u.includes('/gsap_ScrollTrigger.js?')));window.auditMotion={gsap,ScrollTrigger};
   const timelines=()=>gsap.globalTimeline.getChildren().filter(t=>t.getChildren);
   const has=(t,s)=>t.getChildren().some(a=>a.targets?.().some(e=>e.matches?.(s)));
   const greeting=timelines().find(t=>has(t,'.intro-greeting'));
   const greetingDuration=greeting.duration()/greeting.timeScale();
   const exitDuration=await new Promise(resolve=>{const check=()=>{const t=timelines().find(t=>has(t,'.intro-panel'));if(t)resolve(t.duration()/t.timeScale());else requestAnimationFrame(check)};check()});
   return{greetingDuration,exitDuration};
  });
  assert(Math.abs((durations.greetingDuration+durations.exitDuration)/3.24-1.4)<1e-6);
  await page.waitForFunction(()=>portfolioBoot.finished);await page.waitForTimeout(2300);
  const intro=await page.evaluate(()=>audit);assert.deepEqual(intro.greetings,['Hello','Hola','Bonjour','Ciao','مرحبا','こんにちは','ನಮಸ್ಕಾರ','नमस्ते']);assert(intro.handoff.length>0&&intro.handoff.every(Boolean));
  const keys=['tailwindcss','gsap','lenis','motion'];
  await page.locator('[data-tech="motion"]').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
  const profiles=await page.evaluate(keys=>keys.map(key=>{const icon=document.querySelector(`[data-tech="${key}"] .tech-icon`);const t=auditMotion.gsap.getTweensOf(icon).find(t=>t.repeat()===-1);return{key,duration:t.duration(),x:t.vars.x||0,y:t.vars.y||0,rotation:t.vars.rotation||0,paused:t.paused()}}),keys);
  assert.equal(new Set(profiles.map(p=>p.duration)).size,4);
  assert(profiles.every(p=>!p.paused));
  await page.locator('[data-tech="motion"]').hover();await page.waitForTimeout(100);
  assert(await page.locator('[data-tech="motion"] img').evaluate(e=>e.getAnimations().length>0),'Motion owns a spring on the image layer');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);
  assert(await page.locator('[data-tech="motion"] img').evaluate(e=>e.getAnimations().length===0&&getComputedStyle(e).transform==='none'));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(300);
  await page.locator('.hero-cta').first().scrollIntoViewIfNeeded();await page.locator('.hero-cta').first().hover();await page.waitForTimeout(100);
  await page.evaluate(()=>portfolioMotion.destroy());
  const cleanup=await page.evaluate(()=>({tickers:auditMotion.gsap.ticker._listeners.filter(f=>f.name==='tick').length,triggers:auditMotion.ScrollTrigger.getAll().length,hero:[...document.querySelectorAll('.hero-pill,.hero-cta-ripple')].map(e=>({transform:getComputedStyle(e).transform,animations:e.getAnimations().length})),idle:auditMotion.gsap.getTweensOf([...document.querySelectorAll('.tech-icon')]).length}));
  assert.equal(cleanup.tickers,0);assert.equal(cleanup.triggers,0);assert.equal(cleanup.idle,0);assert(cleanup.hero.every(e=>e.transform==='none'&&e.animations===0));assert.deepEqual(errors,[]);
  fs.writeFileSync('.verification/hero-tech-motion-results.json',JSON.stringify({durations,intro,profiles,cleanup,errors},null,2));
  console.log('PASS intro 4.536s / exact 1.4x, all greetings, hero handoff; four distinct animations, Motion spring, reduced-motion cleanup, single ticker and teardown');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
