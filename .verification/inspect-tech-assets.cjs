const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 try {
  const results=[];
  for(const [name,url] of [['gsap','https://gsap.com/brand/'],['motion','https://motion.dev/'],['lenis','https://lenis.darkroom.engineering/']]) {
   const page=await browser.newPage();
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   results.push({name,url,assets:await page.locator('img,link[rel*=icon],a[href$=".svg"]').evaluateAll(es=>es.map(e=>({tag:e.tagName,src:e.src||e.href,alt:e.alt}))),svgs:await page.locator('svg').evaluateAll(es=>es.slice(0,12).map(e=>({html:e.outerHTML,parent:e.parentElement.outerHTML.slice(0,400)})))});
   await page.close();
  }
  fs.writeFileSync('.verification/tech-asset-inspection.json',JSON.stringify(results,null,2));
  console.log(results.map(r=>({name:r.name,assets:r.assets}))); 
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
