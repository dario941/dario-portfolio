const {chromium}=require('playwright');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const context=await browser.newContext();
 for(const [name,url] of [['tailwindcss','https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/tailwindcss/tailwindcss-original.svg'],['motion','https://motion.dev/favicon.svg']]){
  const response=await context.request.get(url);if(!response.ok())throw Error(`${url}: ${response.status()}`);
  const body=await response.text();if(!body.includes('<svg'))throw Error('Not SVG');fs.writeFileSync(`public/icons/${name}.svg`,body);console.log(name,body.length);
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
