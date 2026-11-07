const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const base=process.argv[2]||'http://127.0.0.1:4173/';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const results=[]; const errors=[];
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try {
  for(const width of [320,375,390,768,1024,1440,1920]) {
   const context=await browser.newContext({viewport:{width,height:950},isMobile:width<500,hasTouch:width<500,acceptDownloads:true});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
   await page.addInitScript(()=>sessionStorage.setItem('dario-intro-v1','1'));
   await page.goto(base,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portfolioBoot?.finished&&window.portfolioMotion);
   await page.waitForTimeout(2500);
   assert.equal(await page.locator('.hero-actions > a').count(),2);
   assert.equal(await page.locator('.hero-actions .hero-cta-label:not(.hero-cta-label--next)').allTextContents().then(a=>a.join(',')),'CONTACT,RESUME');
   assert.equal(await page.locator('.hero-char').count(),19);
   const hero=await page.evaluate(()=>({size:parseFloat(getComputedStyle(document.querySelector('.hero-name')).fontSize),wordSpacing:getComputedStyle(document.querySelector('.first-name')).wordSpacing,width:document.documentElement.scrollWidth,viewport:innerWidth,chars:[...document.querySelectorAll('.hero-char')].map(c=>c.getBoundingClientRect().toJSON()),pill:[...document.querySelectorAll('.hero-pill')].map(c=>c.getBoundingClientRect().toJSON())}));
   assert(hero.width<=width,`Overflow at ${width}`);
   assert(hero.chars.every(r=>r.left>=0&&r.right<=width),`Name clipped at ${width}`);
   assert(hero.pill.every(r=>r.height>=44&&r.right<=width),`CTA sizing ${width}`);
   await page.screenshot({path:`.verification/hero-tech-${width}.png`});
   const contact=page.locator('.hero-actions [href="#contact"]');
   if(width===1440){
    await contact.hover();await page.waitForTimeout(650);
    const hover=await contact.locator('.hero-cta-label').first().evaluate(e=>getComputedStyle(e).transform);assert.notEqual(hover,'none');
    await page.screenshot({path:'.verification/hero-cta-hover.png'});
    await page.mouse.move(10,10);await page.waitForTimeout(750);
    assert.equal(await contact.locator('.hero-cta-label').first().evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m42),0);
    await page.keyboard.press('Tab');await contact.focus();assert(await contact.evaluate(e=>e.matches(':focus-visible')));
    assert.notEqual(await contact.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   }
   const downloadPromise=page.waitForEvent('download');
   await page.locator('.hero-cta--resume').click();const download=await downloadPromise;
   assert.equal(download.suggestedFilename(),'Dario_Martin_Monteiro_Resume.pdf');
   assert.equal(hash(await download.path()),hash('public/Dario_Martin_Monteiro_Resume.pdf'));
   const target=await page.locator('#contact').evaluate(e=>Math.min(document.documentElement.scrollHeight-innerHeight,scrollY+e.getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)-24));
   await contact.click();await page.waitForTimeout(100);const midway=await page.evaluate(()=>scrollY);
   await page.waitForTimeout(1600);const end=await page.evaluate(()=>({y:scrollY,hash:location.hash,focus:document.activeElement.id}));
   assert.equal(end.hash,'#contact');assert.equal(end.focus,'contact');assert(Math.abs(end.y-target)<3,`Contact offset ${width}: ${end.y} vs ${target}`);
   assert(midway<end.y-10,`Contact should animate ${width}`);
   assert(await page.locator('a[href^="mailto:"]').evaluateAll(es=>es.every(e=>e.href==='mailto:dariomartinmonteiro@gmail.com')));
   assert.equal(await page.locator('.timeline-company').filter({hasText:'axndx'}).count(),1);
   const job=page.locator('.timeline-item').filter({hasText:'axndx'});assert((await job.innerText()).includes('Aug 2025 – Jul 2026'));
   await page.locator('#skills').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
   await page.locator('[data-skill-filter="frontend"]').click();await page.waitForTimeout(1500);
   assert.equal(await page.locator('.skill-row:not([hidden]) .tech-card').count(),11);
   assert.equal(await page.locator('#skill-status').innerText(),'11 technologies shown. Frontend.');
   for(const tech of ['tailwindcss','gsap','lenis','motion']) {
    const card=page.locator(`[data-tech="${tech}"]`);await card.scrollIntoViewIfNeeded();await page.waitForTimeout(500);
    assert(await card.isVisible());assert(await card.locator('img').evaluate(e=>e.complete&&e.naturalWidth>0),`Invalid icon: ${tech}`);
    if(width===1440){await card.hover();await page.waitForTimeout(800);await card.screenshot({path:`.verification/tech-${tech}-hover.png`});await page.mouse.move(10,10);}
   }
   await page.locator('.skill-row[data-skill-category="frontend"]').screenshot({path:`.verification/tech-frontend-${width}.png`});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===1440){
    await page.locator('[data-skill-filter="all"]').click();await page.waitForTimeout(1300);assert.equal(await page.locator('.skill-row:not([hidden]) .tech-card').count(),25);
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
    assert(await page.locator('html').evaluate(e=>e.classList.contains('motion-off')));
    assert(await page.locator('[data-tech="motion"] img').evaluate(e=>getComputedStyle(e).transform==='none'));
    await page.locator('[data-skill-filter="tools"]').click();assert.equal(await page.locator('.skill-row:not([hidden]) .tech-card').count(),3);
    await page.locator('[data-skill-filter="frontend"]').click();assert.equal(await page.locator('.skill-row:not([hidden]) .tech-card').count(),11);
   }
   results.push({width,hero,contact:{midway,...end},download:download.suggestedFilename()});console.log('PASS viewport',width);
   await context.close();
  }
  assert.deepEqual(errors,[]);
  for(const file of ['preloader.js','preloader.css','project-hover.js','projects.css','project-detail.js','project-detail.css','package.json','package-lock.json'])assert.equal(hash(file),hash('.verification/hero-tech-before/'+file),`Unexpected change: ${file}`);
  for(const slug of ['crizpo','ar-engineerings'])assert.equal(fs.readFileSync(`projects/${slug}/index.html`,'utf8'),fs.readFileSync(`.verification/hero-tech-before/${slug}.html`,'utf8').replaceAll('emaildarioo@gmail.com','dariomartinmonteiro@gmail.com'));
  fs.writeFileSync('.verification/hero-tech-results.json',JSON.stringify({results,errors},null,2));
  console.log('PASS preserved intro, projects, dependencies; no console errors/warnings');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
