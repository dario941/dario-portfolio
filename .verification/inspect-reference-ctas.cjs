const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const browser=await chromium.launch({channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('https://aitezaz.xyz/',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(5000);
  const links=await page.locator('a').evaluateAll(links=>links.filter(a=>/RESUME|CONTACT/i.test(a.textContent)&&a.getBoundingClientRect().top<1000).map(a=>({text:a.innerText,href:a.getAttribute('href'),html:a.outerHTML})));
  console.log(JSON.stringify(links,null,2));
  const measurements=[];
  for(const term of ['Contact','Resume']) {
   const candidates=page.locator('a.rounded-full,button.rounded-full').filter({hasText:new RegExp(term,'i')});
   let link;
   for(let i=0;i<await candidates.count();i++){const e=candidates.nth(i);const box=await e.boundingBox();if(box&&box.y<1000&&box.height>40&&box.height<150){link=e;break}}
   if(!link)continue;
   const state=()=>link.evaluate(el=>({html:el.outerHTML,box:el.getBoundingClientRect().toJSON(),styles:[el,...el.querySelectorAll('*')].map(e=>{const s=getComputedStyle(e);return{tag:e.tagName,class:e.getAttribute('class'),text:e.childElementCount?undefined:e.textContent,position:s.position,width:s.width,height:s.height,font:s.font,padding:s.padding,gap:s.gap,border:s.border,borderRadius:s.borderRadius,color:s.color,background:s.backgroundColor,transform:s.transform,overflow:s.overflow,transition:s.transition}}),animations:el.getAnimations({subtree:true}).map(a=>({timing:a.effect.getTiming(),keyframes:a.effect.getKeyframes()}))}));
   const item={name:term,rest:await state()};await page.screenshot({path:`.verification/reference-${term.toLowerCase()}-rest.png`});
   await link.hover();await page.waitForTimeout(120);item.hoverEarly=await state();
   await page.waitForTimeout(500);item.hover=await state();await page.screenshot({path:`.verification/reference-${term.toLowerCase()}-hover.png`});
   await page.mouse.move(10,10);await page.waitForTimeout(120);item.outEarly=await state();await page.waitForTimeout(600);item.out=await state();measurements.push(item);
  }
  fs.writeFileSync('.verification/reference-cta-inspection.json',JSON.stringify(measurements,null,2));
  const request=await browser.newContext();
  const tree=await (await request.request.get('https://api.github.com/repos/aitezazdev/Portfolio/git/trees/main?recursive=1')).json();
  const files=tree.tree.filter(f=>/src\/.*(Button|Banner|Hero|globals).*\.(tsx|css)$/.test(f.path));
  for(const f of files.slice(0,12)){const r=await request.request.get('https://raw.githubusercontent.com/aitezazdev/Portfolio/main/'+f.path);if(r.ok())fs.writeFileSync('.verification/reference-cta-'+f.path.replaceAll('/','-'),await r.text())}
  console.log('Sources:',files.map(f=>f.path));await request.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
