const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const browser=await chromium.launch({channel:'chrome'});
 const results=[];
 try {
  const probe=await browser.newPage();const userAgent=(await probe.evaluate(()=>navigator.userAgent)).replace('HeadlessChrome','Chrome');await probe.close();
  for(const [name,url,button] of [['CRIZPO','https://www.crizpoksa.com','Switch to Arabic'],['AR Engineerings','https://www.ar-eng.net','عربي']]) {
   const context=await browser.newContext({userAgent,viewport:{width:1440,height:1000}});
   const page=await context.newPage();const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.getByRole('button',{name:button,exact:true}).waitFor({state:'visible',timeout:20000});
   const title=await page.title();await page.getByRole('button',{name:button,exact:true}).click();await page.waitForTimeout(800);
   const language=await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,arabic:/[\u0600-\u06ff]/.test(document.querySelector('h1')?.textContent||'')}));
   results.push({name,url:page.url(),status:response.status(),title,language});
   await context.close();
  }
  fs.writeFileSync('.verification/client-live-link-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
