import { animate } from 'motion/mini';
import { spring } from 'motion';

// GSAP moves the inner link; Motion animates its arrow and the title on separate
// elements. No competing transform owners, global listeners, or extra RAF loop.
export function createProjectHover(root, gsap) {
  const controller = new AbortController();
  const animations = new Map();
  const magneticTargets = [];
  const playful = root.dataset.project === 'crizpo';
  const on = (element, event, handler) => element?.addEventListener(event, handler, { signal: controller.signal });
  const move = (element, transform) => {
    if (!element) return;
    animations.get(element)?.stop();
    animations.set(element, animate(element, { transform }, { type: spring, duration: .45, bounce: playful ? .18 : .04 }));
  };
  const title = root.querySelector('.project-title-motion');
  on(root, 'pointerenter', event => { if (event.pointerType === 'mouse') move(title, `translateX(${playful ? 4 : 2}px)`); });
  on(root, 'pointerleave', () => move(title, 'translateX(0px)'));
  on(title, 'focus', () => move(title, 'translateX(3px)'));
  on(title, 'blur', () => move(title, 'translateX(0px)'));
  root.querySelectorAll('.project-action').forEach(link => {
    const inner = link.querySelector('.project-link-motion');
    const arrow = link.querySelector('svg');
    if (!inner) return;
    magneticTargets.push(inner);
    const x = gsap.quickTo(inner, 'x', { duration: .25, ease: 'power3.out' });
    const y = gsap.quickTo(inner, 'y', { duration: .25, ease: 'power3.out' });
    let box;
    on(link, 'pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      box = link.getBoundingClientRect(); move(arrow, 'translate(3px, -3px)');
    });
    on(link, 'pointermove', event => {
      if (!box || event.pointerType !== 'mouse') return;
      x(gsap.utils.clamp(-4, 4, (event.clientX - box.left - box.width / 2) * .12));
      y(gsap.utils.clamp(-3, 3, (event.clientY - box.top - box.height / 2) * .12));
    });
    on(link, 'pointerleave', () => { box = null; x(0); y(0); move(arrow, 'translate(0px, 0px)'); });
    on(link, 'focus', () => move(arrow, 'translate(3px, -3px)'));
    on(link, 'blur', () => move(arrow, 'translate(0px, 0px)'));
  });
  return () => {
    controller.abort();
    animations.forEach((animation, element) => { animation.cancel(); element.style.removeProperty('transform'); });
    animations.clear();
    gsap.killTweensOf(magneticTargets);
    gsap.set(magneticTargets, { clearProps: 'transform' });
  };
}
