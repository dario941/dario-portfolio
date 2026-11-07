import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createProjectHover } from './project-hover.js';

gsap.registerPlugin(ScrollTrigger);
let media;
let refresh;
function start() {
  if (media) return;
  media = gsap.matchMedia();
  media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 761px) and (hover: hover) and (pointer: fine)' }, context => {
    if (!context.conditions.motion) return;
    let lenis;
    let disposed = false;
    const controller = new AbortController();
    const tick = time => lenis?.raf(time * 1000);
    if (context.conditions.desktop) {
      lenis = new Lenis({ autoRaf: false, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
    }
    const playful = document.body.dataset.project === 'crizpo';
    document.querySelectorAll('[data-case-reveal]').forEach(element => {
      gsap.fromTo(element, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .75, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: element, start: 'top 95%', once: true } });
    });
    document.querySelectorAll('[data-case-image]').forEach(element => {
      gsap.fromTo(element, { clipPath: playful ? 'inset(8% 0 10% 0)' : 'inset(0 9% 0 0)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power3.out', clearProps: 'clipPath',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true } });
    });
    const hoverCleanup = context.conditions.desktop ? createProjectHover(document.body, gsap) : () => {};
    const update = () => {
      clearTimeout(refresh);
      refresh = setTimeout(() => { if (!disposed) { lenis?.resize(); ScrollTrigger.refresh(); } }, 100);
    };
    document.querySelectorAll('img').forEach(image => { if (!image.complete) image.addEventListener('load', update, { once: true, signal: controller.signal }); });
    document.fonts.ready.then(update);
    window.addEventListener('resize', update, { passive: true, signal: controller.signal });
    update();
    return () => {
      disposed = true; controller.abort(); clearTimeout(refresh); hoverCleanup();
      gsap.ticker.remove(tick); lenis?.off('scroll', ScrollTrigger.update); lenis?.destroy();
    };
  });
}
function stop() { media?.revert(); media = null; clearTimeout(refresh); }
start();
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', start);
if (import.meta.hot) import.meta.hot.dispose(() => {
  stop(); window.removeEventListener('pagehide', stop); window.removeEventListener('pageshow', start);
});
