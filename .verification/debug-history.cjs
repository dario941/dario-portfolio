const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({channel:'chrome'});
 for(const port of [5173,4173]) {
  const p=await b.newPage({viewport:{width:1440,height:950}});
  await p.addInitScript(()=>{
   window.events=[];
   for(const type of ['pageshow','hashchange','popstate']) addEventListener(type,()=>{events.push([type,performance.now(),scrollY,location.hash]);});
  });
  await p.goto(`http://127.0.0.1:${port}/#about`,{waitUntil:'networkidle'});await p.waitForTimeout(2600);
  const initial=await p.evaluate(()=>({y:scrollY,about:document.querySelector('#about').getBoundingClientRect().top+scrollY,events}));
  await p.locator('#navigation a[href="#contact"]').click();await p.waitForTimeout(800);
  const contact=await p.evaluate(()=>({y:scrollY,hash:location.hash}));
  await p.goBack();const ys=[];for(let i=0;i<15;i++){await p.waitForTimeout(100);ys.push(await p.evaluate(()=>scrollY));}
  console.log(JSON.stringify({port,initial,contact,ys,final:await p.evaluate(()=>({events,about:document.querySelector('#about').getBoundingClientRect().top+scrollY,hash:location.hash,active:document.activeElement.id}))}));
  await p.close();
 } await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
