// The outer anchor keeps a stable hit area; only its inner pill moves on hover.
export function createHeroActions(gsap) {
  const controller = new AbortController();
  const root = document.querySelector('.hero-actions');
  const context = gsap.context(() => {}, root);
  const on = (el, event, handler) => el.addEventListener(event, handler, { signal: controller.signal });
  root.querySelectorAll('.hero-cta').forEach(link => {
    const pill = link.querySelector('.hero-pill');
    const ripple = link.querySelector('.hero-cta-ripple');
    let box;
    context.add(() => {
      const x = gsap.quickTo(pill, 'x', { duration: .4, ease: 'power2.out' });
      const y = gsap.quickTo(pill, 'y', { duration: .4, ease: 'power2.out' });
      on(link, 'pointerenter', event => {
        if (event.pointerType !== 'mouse') return;
        box = link.getBoundingClientRect();
        const left = event.clientX - box.left, top = event.clientY - box.top;
        const scale = Math.hypot(Math.max(left, box.width - left), Math.max(top, box.height - top)) / 50;
        context.add(() => {
          gsap.set(ripple, { left, top, scale: 0, opacity: 1 });
          gsap.to(ripple, { scale, opacity: .6, duration: .6, ease: 'power2.out', overwrite: true });
        });
      });
      on(link, 'pointermove', event => {
        if (!box || event.pointerType !== 'mouse') return;
        x((event.clientX - box.left - box.width / 2) * .35);
        y((event.clientY - box.top - box.height / 2) * .35);
      });
      on(link, 'pointerleave', () => {
        box = null;
        x.tween.pause(); y.tween.pause();
        context.add(() => {
          gsap.to(pill, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)', overwrite: 'auto' });
          gsap.to(ripple, { scale: 0, opacity: 0, duration: .5, ease: 'power2.out', overwrite: true });
        });
      });
    });
  });
  return () => { controller.abort(); context.revert(); };
}
