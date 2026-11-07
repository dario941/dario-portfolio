const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({channel:'chrome'});
 try {
  for(const width of [1440,375]) {
   const context=await browser.newContext({viewport:{width,height:950},isMobile:width<500,hasTouch:width<500});
   const page=await context.newPage(); const errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto('http://127.0.0.1:5173/#work',{waitUntil:'networkidle'});
   await page.waitForTimeout(1600);
   for(const slug of ['crizpo','ar-engineerings']) {
    const card=page.locator(`[data-project="${slug}"]`);
    await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
    await page.screenshot({path:`.verification/works-${slug}-${width}.png`});
    if(width===1440) {
     await card.locator('h3').hover();await page.waitForTimeout(600);
     await page.screenshot({path:`.verification/works-${slug}-hover.png`});
     console.log(slug,await page.locator('.project-preview').evaluate(e=>({opacity:getComputedStyle(e).opacity,box:e.getBoundingClientRect().toJSON(),src:e.querySelector('img').src})));
    }
    await page.goto(`http://127.0.0.1:5173/projects/${slug}/`,{waitUntil:'networkidle'});
    await page.waitForTimeout(1100);
    await page.screenshot({path:`.verification/case-${slug}-${width}-top.png`});
    await page.locator('.case-gallery').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);
    await page.screenshot({path:`.verification/case-${slug}-${width}-gallery.png`});
    console.log('detail',width,slug,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>({src:i.getAttribute('src'),ok:i.complete&&i.naturalWidth>0})),lenis:document.documentElement.classList.contains('lenis')})));
    await page.goto('http://127.0.0.1:5173/#work',{waitUntil:'networkidle'});await page.waitForTimeout(1300);
   }
   console.log('errors',width,errors);
   await context.close();
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
