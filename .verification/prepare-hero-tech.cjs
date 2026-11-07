const fs=require('node:fs');
const paths=['index.html','projects/crizpo/index.html','projects/ar-engineerings/index.html','.verification/generate-case-pages.py'];
for(const path of paths){if(!fs.existsSync(path))continue;fs.writeFileSync(path,fs.readFileSync(path,'utf8').replaceAll('emaildarioo@gmail.com','dariomartinmonteiro@gmail.com'));}
let html=fs.readFileSync('index.html','utf8');
const cards=[['tailwindcss','Tailwind CSS'],['gsap','GSAP'],['lenis','Lenis'],['motion','Motion']].map(([tech,label])=>`            <li class="tech-card" data-tech="${tech}"><div class="tech-card-surface"><span class="tech-icon" aria-hidden="true"><span class="tech-icon-motion"><img src="/icons/${tech}.svg" alt="" width="40" height="40" loading="lazy" decoding="async"></span></span><span class="tech-label">${label}</span></div></li>`).join('\n');
const index=html.indexOf('          </ul>',html.indexOf('data-skill-category="frontend"'));
if(!html.includes('data-tech="tailwindcss"'))html=html.slice(0,index)+cards+'\n'+html.slice(index);
fs.writeFileSync('index.html',html);
const inspected=JSON.parse(fs.readFileSync('.verification/tech-asset-inspection.json','utf8'));
const gsapLayers=inspected.find(x=>x.name==='gsap').svgs;
const gsap=gsapLayers[1].html.replace('</svg>',gsapLayers[2].html.match(/<path\b[^>]*>[\s\S]*?<\/path>/g).join('')+'</svg>').replaceAll('#FFFCE1','#163a28');
fs.writeFileSync('public/icons/gsap.svg',gsap);
const lenis=inspected.find(x=>x.name==='lenis');
fs.writeFileSync('public/icons/lenis.svg',lenis.svgs[2].html.replace(/ class="[^"]*"/g,'').replace('fill="black"','fill="#163a28"'));
console.log('Updated content, four cards and captured official GSAP/Lenis SVG marks.');
