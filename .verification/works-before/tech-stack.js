/**
 * Tech motion enhances the existing accessible HTML filter; it never owns the data.
 * Reference studied: Aitezaz Portfolio / TechStack.tsx (MIT). Original DOM implementation.
 * Separate transform layers prevent entrance, idle float and pointer tilt from competing.
 */
export function createTechStack({ gsap, ScrollTrigger, onRefresh = () => {} }) {
  const root = document.querySelector('#skills');
  const groups = root.querySelector('.skill-groups');
  const rows = [...groups.querySelectorAll('.skill-row')];
  const cards = [...groups.querySelectorAll('.tech-card')];
  const compact = matchMedia('(max-width: 760px)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const abort = new AbortController();
  const context = gsap.context(() => {}, root);
  const entrances = new Set();
  const idle = new Map();
  const visible = new Set();
  const revealed = new Set();
  let transition;
  let pendingApply;
  let destroyed = false;
  let filtering = false;

  const on = (target, event, handler, options = {}) => target.addEventListener(event, handler, { ...options, signal: abort.signal });
  const track = targets => targets.forEach(target => { target.dataset.motion = ''; });
  const rowTargets = row => [...row.querySelectorAll('.skill-category, .tech-card')];

  function revealRow(row, immediate = false) {
    if (destroyed || row.hidden || revealed.has(row)) return;
    revealed.add(row);
    context.add(() => {
      const targets = rowTargets(row);
      const icons = [...row.querySelectorAll('.tech-icon-motion')];
      track(targets);
      const timeline = gsap.timeline({ onComplete: () => entrances.delete(timeline) });
      entrances.add(timeline);
      timeline.fromTo(targets, { y: compact ? 16 : 28, opacity: .12 }, {
        y: 0, opacity: 1, duration: .65, stagger: .045, ease: 'power3.out', clearProps: 'transform,opacity',
      }, 0);
      timeline.fromTo(icons, { rotation: -16, scale: .82 }, {
        rotation: 0, scale: 1, duration: .8, stagger: .045, ease: 'back.out(1.35)', clearProps: 'transform',
      }, .05);
      if (immediate) timeline.progress(1);
    });
  }

  function syncIdle() {
    idle.forEach((animation, card) => {
      const shouldPlay = !document.hidden && !filtering && visible.has(card)
        && !card.closest('.skill-row').hidden && !card.matches(':hover');
      shouldPlay ? animation.play() : animation.pause();
    });
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    syncIdle();
  }, { threshold: .15 });

  context.add(() => {
    rows.forEach(row => {
      ScrollTrigger.create({
        trigger: row, start: 'top 92%', once: true,
        onEnter: () => { if (!filtering) revealRow(row); },
      });
    });
    cards.forEach((card, index) => {
      const surface = card.querySelector('.tech-card-surface');
      const icon = card.querySelector('.tech-icon');
      const spin = card.querySelector('.tech-icon-motion');
      track([surface, icon, spin]);
      observer.observe(card);
      // Small staggered floats, not continuous full rotations; labels stay stationary.
      // Touch devices use scroll entrances only. Each idle tween is visibility-gated.
      if (finePointer) {
        idle.set(card, gsap.to(icon, {
          y: index % 2 ? -3 : 3, rotation: index % 3 ? 3 : -4,
          duration: 2.8 + (index % 5) * .37, delay: (index % 4) * .23,
          repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true,
        }));
        let box;
        const rotateX = gsap.quickTo(surface, 'rotationX', { duration: .4, ease: 'power3.out' });
        const rotateY = gsap.quickTo(surface, 'rotationY', { duration: .4, ease: 'power3.out' });
        gsap.set(surface, { transformPerspective: 700 });
        on(card, 'pointerenter', event => {
          if (event.pointerType !== 'mouse' || filtering) return;
          box = card.getBoundingClientRect();
          idle.get(card)?.pause();
          context.add(() => {
            gsap.to(surface, { y: -4, duration: .35, ease: 'power2.out', overwrite: 'auto' });
            gsap.to(spin, { rotation: 360, scale: 1.14, duration: .7, ease: 'power2.out', overwrite: true });
          });
        });
        on(card, 'pointermove', event => {
          if (!box || event.pointerType !== 'mouse' || filtering) return;
          const x = gsap.utils.clamp(0, 1, (event.clientX - box.left) / box.width);
          const y = gsap.utils.clamp(0, 1, (event.clientY - box.top) / box.height);
          rotateX((.5 - y) * 6); rotateY((x - .5) * 6);
          surface.style.setProperty('--pointer-x', `${x * 100}%`);
          surface.style.setProperty('--pointer-y', `${y * 100}%`);
        });
        on(card, 'pointerleave', () => {
          box = null; rotateX(0); rotateY(0);
          context.add(() => {
            gsap.to(surface, { y: 0, duration: .55, ease: 'back.out(1.4)', overwrite: 'auto' });
            gsap.to(spin, { rotation: 0, scale: 1, duration: .55, ease: 'power2.inOut', overwrite: true });
          });
          syncIdle();
        });
      }
    });
  });

  on(document, 'visibilitychange', syncIdle);
  on(root.querySelector('.skill-filters'), 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll('[data-skill-filter]')];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
  });

  function filter(apply) {
    if (destroyed) { apply(); return; }
    pendingApply = apply;
    transition?.kill();
    entrances.forEach(timeline => timeline.kill()); entrances.clear();
    filtering = true; syncIdle();
    const current = rows.filter(row => !row.hidden).flatMap(rowTargets);
    const oldHeight = groups.getBoundingClientRect().height;
    gsap.killTweensOf(current);
    context.add(() => {
      transition = gsap.timeline();
      transition.to(current, { opacity: 0, y: -8, duration: .15, ease: 'power2.in', overwrite: 'auto' })
        .call(() => {
          const commit = pendingApply; pendingApply = null;
          commit?.();
          const targets = rows.filter(row => !row.hidden).flatMap(rowTargets);
          rows.forEach(row => { if (!row.hidden) revealed.add(row); });
          gsap.set(groups, { clearProps: 'height' });
          const newHeight = groups.getBoundingClientRect().height;
          gsap.set(groups, { height: oldHeight, overflow: 'clip' });
          gsap.set(targets, { opacity: 0, y: compact ? 12 : 20 });
          gsap.set(cards.map(card => card.querySelector('.tech-icon-motion')), { clearProps: 'transform' });
          transition.to(groups, { height: newHeight, duration: .45, ease: 'power3.inOut' }, .15)
            .to(targets, { opacity: 1, y: 0, duration: .5, stagger: { each: .035, amount: Math.min(.32, targets.length * .035) }, ease: 'power3.out', clearProps: 'transform,opacity' }, .23)
            .call(() => {
              gsap.set(groups, { clearProps: 'height,overflow' });
              filtering = false; syncIdle(); onRefresh();
            });
        });
    });
  }

  return {
    filter,
    refresh: onRefresh,
    destroy() {
      if (destroyed) return;
      destroyed = true; abort.abort(); observer.disconnect();
      transition?.kill(); entrances.forEach(timeline => timeline.kill());
      idle.forEach(animation => animation.kill());
      context.revert();
      pendingApply?.(); pendingApply = null;
      // Interrupted filters can have captured an earlier filter's faded state.
      // The static/reduced-motion fallback must restore every owned layer explicitly.
      const owned = [...groups.querySelectorAll('.skill-category, .tech-card, .tech-card-surface, .tech-icon, .tech-icon-motion')];
      gsap.killTweensOf(owned);
      gsap.set(owned, { clearProps: 'transform,opacity,visibility' });
      groups.style.removeProperty('height'); groups.style.removeProperty('overflow');
      cards.forEach(card => {
        const surface = card.querySelector('.tech-card-surface');
        surface.style.removeProperty('--pointer-x'); surface.style.removeProperty('--pointer-y');
      });
    },
  };
}
