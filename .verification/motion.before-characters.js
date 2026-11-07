import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { animate } from 'motion/mini';

// Original motion system. See MOTION.md for reference research and motion policy.
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const html = document.documentElement;
const boot = window.portfolioBoot;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reduced.matches;
const desktop = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)');
const compact = matchMedia('(max-width: 760px)');
const listeners = new AbortController();
const signal = listeners.signal;
const motionButton = $('.motion-toggle');
let paused = false;
let destroyed = false;
let sceneContext;
let projectContexts = new Map();
let lenis;
let menuTimeline;
let introTimeline;
let heroTimeline;
let heroAccentAnimation;
let ambient;
let hoverCleanup = () => {};
let resizeTimer;
let refreshTimer;
let tickerAttached = false;
let introPlayed = false;
let marqueePosition = 0;
let marqueeWidth = 0;
let marqueeVisible = false;
let marqueeVelocity = 0;
let lastTick = 0;
let pointerSeen = false;
let hoveredControl = null;
let previewCard = null;
let hoverNeedsUpdate = false;
const pointer = { x: 0, y: 0, ringX: 0, ringY: 0 };
const ring = $('.cursor-ring');
const dot = $('.cursor-dot');
const preview = $('.project-preview');
const marquee = $('.marquee-track');
const ringX = gsap.quickSetter(ring, 'x', 'px');
const ringY = gsap.quickSetter(ring, 'y', 'px');
const dotX = gsap.quickSetter(dot, 'x', 'px');
const dotY = gsap.quickSetter(dot, 'y', 'px');
const previewX = gsap.quickSetter(preview, 'x', 'px');
const previewY = gsap.quickSetter(preview, 'y', 'px');
const enabled = () => !prefersReducedMotion && !paused && !destroyed && !html.classList.contains('motion-failed');
const listen = (target, event, handler, options = {}) => target.addEventListener(event, handler, { ...options, signal });
const mark = element => { if (element) element.dataset.motion = ''; return element; };
const markAll = elements => elements.map(mark);
const settle = promise => new Promise(resolve => {
  const timeout = setTimeout(() => resolve(false), 1100);
  Promise.resolve(promise).then(() => { clearTimeout(timeout); resolve(true); }, () => { clearTimeout(timeout); resolve(false); });
});

boot?.mark('libraries', 'Motion engine ready');

function maskWords(element) {
  if (!element || element.dataset.split === 'true') return;
  element.dataset.split = 'true';
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.textContent.trim() && !node.parentElement.closest('svg, a, [aria-hidden="true"]')
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(word => {
      if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
      const mask = document.createElement('span');
      mask.className = 'motion-mask';
      const inner = document.createElement('span');
      inner.className = 'motion-word';
      inner.textContent = word;
      mark(inner); mask.append(inner); fragment.append(mask);
    });
    node.replaceWith(fragment);
  });
}

function reveal(element, targets = [element], options = {}) {
  const items = markAll(targets.filter(Boolean));
  if (!items.length) return;
  // Create the from-state only when entry actually occurs. Unvisited content stays readable.
  ScrollTrigger.create({
    trigger: element, start: 'top 94%', once: true,
    onEnter: () => sceneContext?.add(() => {
      gsap.fromTo(items,
        { y: compact.matches ? 18 : 32, opacity: .12, ...options.from },
        { y: 0, opacity: 1, duration: compact.matches ? .55 : .8, stagger: .07,
          ease: 'power3.out', clearProps: 'transform,opacity,visibility', ...options.to });
    })
  });
}

function revealHeading(heading) {
  const words = $$('.motion-word', heading);
  if (!words.length) return;
  ScrollTrigger.create({
    trigger: heading, start: 'top 94%', once: true,
    onEnter: () => sceneContext?.add(() => gsap.fromTo(words,
      { yPercent: 110, rotation: compact.matches ? 0 : 3 },
      { yPercent: 0, rotation: 0, duration: .85, stagger: .06, ease: 'power4.out', clearProps: 'transform' }))
  });
}

function drawDividers() {
  $$('.experience-header, .skills-header, .hero-foot, .contact-details, .work-empty, .about-detail').forEach(element => {
    element.classList.add('draw-divider');
    gsap.fromTo(element, { '--line-progress': 0 }, {
      '--line-progress': 1, duration: 1, ease: 'power2.inOut',
      scrollTrigger: { trigger: element, start: 'top 90%', once: true }
    });
  });
}

function playHero() {
  if (introPlayed || !enabled() || scrollY > 80) return;
  introPlayed = true;
  sceneContext.add(() => {
    const words = $$('.hero-name .motion-word');
    heroTimeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
    heroTimeline.fromTo(words, { y: 45, scale: .94, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, stagger: .08, duration: 1.6, clearProps: 'transform,opacity' }, 0)
      .fromTo(markAll($$('.hero-role, .hero-statement')), { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: .7, stagger: .09, clearProps: 'transform,opacity' }, .22)
      .fromTo(markAll($$('.hero-actions > a')), { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: .6, stagger: .08, clearProps: 'transform,opacity' }, .4);
  });
  // Motion mini uses native WAAPI for the accent only; GSAP owns text and scroll.
  // Separate elements/properties avoid two engines competing over one transform.
  heroAccentAnimation = animate($('.hero-orbit svg'), { opacity: [.2, 1] },
    { duration: 1.6, ease: [.22, 1, .36, 1] });
}

function buildScenes() {
  hoverCleanup();
  ambient?.destroy(); ambient = null;
  projectContexts.forEach(context => context.revert()); projectContexts.clear();
  sceneContext?.revert(); sceneContext = null;
  heroTimeline?.kill();
  heroAccentAnimation?.cancel(); heroAccentAnimation = null;
  if (lenis) { lenis.off('scroll', ScrollTrigger.update); lenis.destroy(); lenis = null; }
  detachTicker();
  gsap.set([ring, dot, preview], { opacity: 0, clearProps: 'transform' });
  hoveredControl = null; previewCard = null; pointerSeen = false;
  $$('.timeline-item').forEach(item => item.classList.remove('is-active'));
  html.classList.toggle('motion-off', !enabled());
  html.classList.toggle('motion-enabled', enabled());
  motionButton.hidden = false;
  motionButton.disabled = reduced.matches;
  motionButton.setAttribute('aria-pressed', String(paused || reduced.matches));
  motionButton.textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  if (!enabled()) {
    gsap.set(marquee, { clearProps: 'transform' });
    boot?.dismiss();
    return;
  }

  if (desktop.matches && !navigator.connection?.saveData) {
    lenis = new Lenis({ autoRaf: false, duration: .85, smoothWheel: true, syncTouch: false,
      anchors: false, stopInertiaOnNavigate: true, prevent: node => node.closest?.('#fullscreen-nav') });
    lenis.on('scroll', ScrollTrigger.update);
    if ($('#fullscreen-nav').open) lenis.stop();
  }

  sceneContext = gsap.context(() => {});
  sceneContext.add(() => {
    const hero = $('#home');
    if (!compact.matches) {
      const first = mark($('.first-name'));
      const last = mark($('.last-name'));
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.0 } })
        .to(first, { xPercent: -3, y: -30, ease: 'none' }, 0)
        .to(last, { xPercent: 2, y: 18, ease: 'none' }, 0)
        .to(mark($('.hero-orbit')), { rotation: 32, y: 80, scale: .88, ease: 'none' }, 0);
      gsap.to(mark($('.about-geometry')), { yPercent: 18, rotation: 15, ease: 'none',
        scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: .6 } });
      gsap.fromTo(mark($('.about-copy .body-copy')), { y: 24, opacity: .65 }, { y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.about-copy', start: 'top 85%', end: 'top 30%', scrub: .4 } });
    }
    gsap.to($('.motion-boundary path'), { attr: { d: 'M0 0Q50 0 100 0V100H0Z' }, ease: 'none',
      scrollTrigger: { trigger: '.motion-boundary', start: 'top bottom', end: 'top 25%', scrub: .4 } });
    $$('h2').forEach(revealHeading);
    reveal($('.about-copy .lead'));
    reveal($('.about-detail'), [...$('.about-detail').children]);
    if (compact.matches) reveal($('.about-copy .body-copy'));
    drawDividers();

    gsap.fromTo($('.timeline'), { '--timeline-progress': 0 }, { '--timeline-progress': 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 65%', end: 'bottom 65%', scrub: .35 } });
    $$('.timeline-item').forEach(item => {
      ScrollTrigger.create({ trigger: item, start: 'top 70%', end: 'bottom 25%', toggleClass: 'is-active' });
      reveal(item, [...item.children], { from: { x: compact.matches ? 0 : 22 }, to: { x: 0, stagger: .09 } });
    });
    $$('.service-card').forEach((card, index) => {
      reveal(card, $$('.service-number, .service-icon, h3, p, .service-tags', card), {
        from: { x: compact.matches ? 0 : index % 2 ? 16 : -16 }, to: { x: 0, stagger: .065 }
      });
    });
    $$('.skill-row').forEach(row => {
      reveal(row, [$('h3', row)]);
      reveal(row, $$('.skill-list li', row), { from: { y: 14, scale: .97 }, to: { scale: 1, stagger: .045, duration: .5 } });
    });
    reveal($('.skills-intro'));
    gsap.to(mark($('.work-mark')), { rotation: 80, ease: 'none',
      scrollTrigger: { trigger: '#work', start: 'top bottom', end: 'bottom top', scrub: .65 } });
    reveal($('#work-empty'), [...$('#work-empty').children]);
    reveal($('.contact-details'), [...$('.contact-details').children]);
    gsap.to($('.contact-wash'), { opacity: .65, ease: 'none',
      scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'top 25%', scrub: .6 } });
    reveal($('.footer-top'), [...$('.footer-top').children], { from: { y: 15 }, to: { stagger: .08 } });
    ScrollTrigger.create({ trigger: '.motion-strip', start: 'top bottom', end: 'bottom top',
      onUpdate: self => { marqueeVelocity = Math.min(75, Math.abs(self.getVelocity()) * .015); } });
  });
  syncProjects();
  hoverCleanup = installHover();
  ambient = createConstellation();
  marqueeWidth = $('.marquee-copy').getBoundingClientRect().width;
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
  lastTick = 0;
  gsap.ticker.add(tick); tickerAttached = true;
  scheduleRefresh();
}

function initializeProject(card) {
  if (projectContexts.has(card) || !enabled()) return;
  const media = $('.project-media', card);
  const image = $('img', card);
  const details = [...card.children].find(child => child !== media);
  const context = gsap.context(() => {}, card);
  context.add(() => {
    ScrollTrigger.create({ trigger: card, start: 'top 92%', once: true, onEnter: () => context.add(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (media && !media.hidden) {
        tl.fromTo(mark(media), { clipPath: 'inset(12% 0 88% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: .9, clearProps: 'clipPath' });
      }
      if (details) tl.fromTo(markAll([...details.children]), { y: 24, opacity: .1 },
        { y: 0, opacity: 1, duration: .7, stagger: .08, clearProps: 'transform,opacity' }, .15);
    }) });
    if (image && desktop.matches) gsap.fromTo(mark(image), { scale: 1.035, yPercent: -1.5 }, {
      scale: 1.035, yPercent: 1.5, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: .5 }
    });
  });
  projectContexts.set(card, context);
  if (image && !image.complete) image.addEventListener('load', scheduleRefresh, { once: true, signal });
}

function syncProjects() {
  projectContexts.forEach((context, card) => { if (!card.isConnected) { context.revert(); projectContexts.delete(card); } });
  $$('.project-card').forEach(initializeProject);
}

function installHover() {
  if (!desktop.matches) return () => {};
  const controller = new AbortController();
  const targets = [];
  const on = (element, name, handler) => element.addEventListener(name, handler, { signal: controller.signal });
  $$('.service-card').forEach(card => {
    let box;
    const rotationX = gsap.quickTo(card, 'rotationX', { duration: .35, ease: 'power2.out' });
    const rotationY = gsap.quickTo(card, 'rotationY', { duration: .35, ease: 'power2.out' });
    targets.push(card); gsap.set(card, { transformPerspective: 1000 });
    on(card, 'pointerenter', () => { box = card.getBoundingClientRect(); });
    on(card, 'pointermove', event => {
      if (!box || event.pointerType !== 'mouse') return;
      rotationX(gsap.utils.clamp(-2, 2, -(event.clientY - box.top - box.height / 2) / box.height * 4));
      rotationY(gsap.utils.clamp(-2, 2, (event.clientX - box.left - box.width / 2) / box.width * 4));
    });
    on(card, 'pointerleave', () => { rotationX(0); rotationY(0); });
  });
  $$('.hero-actions .button, .contact-arrow, .menu-toggle').forEach(control => {
    const child = $('svg, .menu-lines', control);
    if (!child) return;
    let box;
    const x = gsap.quickTo(child, 'x', { duration: .3, ease: 'power3.out' });
    const y = gsap.quickTo(child, 'y', { duration: .3, ease: 'power3.out' });
    targets.push(child);
    on(control, 'pointerenter', () => { box = control.getBoundingClientRect(); });
    on(control, 'pointermove', event => {
      if (!box || event.pointerType !== 'mouse') return;
      x(gsap.utils.clamp(-6, 6, (event.clientX - box.left - box.width / 2) * .12));
      y(gsap.utils.clamp(-6, 6, (event.clientY - box.top - box.height / 2) * .12));
    });
    on(control, 'pointerleave', () => { x(0); y(0); });
  });
  return () => { controller.abort(); gsap.killTweensOf(targets); gsap.set(targets, { clearProps: 'transform' }); };
}

function createConstellation() {
  const canvas = $('.hero-canvas');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return null;
  const mobile = !desktop.matches;
  const particles = Array.from({ length: mobile ? 14 : 42 }, (_, index) => ({
    x: (index * .61803398875) % 1, y: (index * .381966 + .13) % 1, seed: index * 1.7
  }));
  let width = 1, height = 1, left = 0, top = 0, visible = false, lastDraw = 0;
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height; left = box.left; top = box.top + scrollY;
    const dpr = mobile ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 });
  observer.observe(canvas);
  resize();
  return {
    draw(time) {
      if (!visible || document.hidden || $('#fullscreen-nav').open || time - lastDraw < (mobile ? .05 : .032)) return;
      lastDraw = time;
      context.clearRect(0, 0, width, height);
      const mx = pointer.x - left, my = pointer.y + scrollY - top;
      const points = particles.map(p => {
        let x = p.x * width + Math.sin(time * .16 + p.seed) * 12;
        let y = p.y * height + Math.cos(time * .12 + p.seed) * 12;
        if (!mobile && pointerSeen) {
          const dx = x - mx, dy = y - my, distance = Math.hypot(dx, dy);
          if (distance < 150 && distance > 0) { const force = (1 - distance / 150) * 12; x += dx / distance * force; y += dy / distance * force; }
        }
        return { x, y };
      });
      context.lineWidth = .65;
      points.forEach((point, i) => {
        context.fillStyle = 'rgba(86,116,74,.5)';
        context.beginPath(); context.arc(point.x, point.y, 1.5, 0, Math.PI * 2); context.fill();
        for (let j = i + 1; j < Math.min(points.length, i + 8); j++) {
          const other = points[j], distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < 190) { context.strokeStyle = `rgba(86,116,74,${(1 - distance / 190) * .22})`; context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(other.x, other.y); context.stroke(); }
        }
      });
    },
    destroy() { observer.disconnect(); sizeObserver.disconnect(); context.clearRect(0, 0, width, height); }
  };
}

function updateHover() {
  hoverNeedsUpdate = false;
  const hit = document.elementFromPoint(pointer.x, pointer.y);
  const control = hit?.closest('a, button');
  if (control !== hoveredControl) {
    hoveredControl = control;
    $('.cursor-ring span').textContent = control ? (control.matches('button') ? '·' : '↗') : '';
    gsap.to(ring, { scale: control ? 1.6 : 1, duration: .25, overwrite: 'auto' });
  }
  const card = hit?.closest('.project-card');
  const image = card && $('.project-media img', card);
  // Preview is contextual to project text; never obscure the actual thumbnail or a link.
  const nextPreview = image?.complete && image.naturalWidth && !hit.closest('.project-media, a, button') ? card : null;
  if (nextPreview !== previewCard) {
    previewCard = nextPreview;
    if (nextPreview) $('.project-preview img').src = image.currentSrc || image.src;
    gsap.to(preview, { opacity: nextPreview ? 1 : 0, scale: nextPreview ? 1 : .96, duration: .25, overwrite: 'auto' });
  }
}

function tick(time) {
  if (document.hidden || !enabled()) return;
  const dt = lastTick ? Math.min(.05, time - lastTick) : .016;
  lastTick = time;
  lenis?.raf(time * 1000);
  ambient?.draw(time);
  if (marqueeVisible && !$('#fullscreen-nav').open && marqueeWidth) {
    marqueePosition = (marqueePosition + (desktop.matches ? 22 : 14) * dt + marqueeVelocity * dt) % marqueeWidth;
    gsap.set(marquee, { x: -marqueePosition });
    marqueeVelocity *= Math.exp(-4 * dt);
  }
  if (!desktop.matches || !pointerSeen || $('#fullscreen-nav').open) return;
  const factor = 1 - Math.exp(-15 * dt);
  pointer.ringX += (pointer.x - pointer.ringX) * factor;
  pointer.ringY += (pointer.y - pointer.ringY) * factor;
  ringX(pointer.ringX); ringY(pointer.ringY); dotX(pointer.x); dotY(pointer.y);
  if (hoverNeedsUpdate) updateHover();
  if (previewCard) {
    previewX(Math.max(12, Math.min(innerWidth - 280, pointer.ringX + 26)));
    previewY(Math.max(12, Math.min(innerHeight - 200, pointer.ringY - 80)));
  }
}
function detachTicker() { if (tickerAttached) gsap.ticker.remove(tick); tickerAttached = false; }

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { if (!destroyed) { lenis?.resize(); ScrollTrigger.refresh(); marqueeWidth = $('.marquee-copy').getBoundingClientRect().width; } }, 100);
}

function menu(open) {
  menuTimeline?.kill();
  const dialog = $('#fullscreen-nav');
  const path = $('.menu-shape path');
  const links = $$('.overlay-links a');
  if (!enabled()) {
    gsap.set([dialog, path, ...links, $('.menu-bottom')], { clearProps: 'all' });
    path.setAttribute('d', 'M0 0H100V100Q50 100 0 100Z');
    return Promise.resolve();
  }
  return new Promise(resolve => {
    dialog.style.background = 'transparent';
    menuTimeline = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
    if (open) {
      menuTimeline.fromTo(path, { attr: { d: 'M0 0H100V0Q50 0 0 0Z' } },
        { attr: { d: 'M0 0H100V70Q50 135 0 70Z' }, duration: .27, ease: 'power2.in' }, 0)
        .to(path, { attr: { d: 'M0 0H100V100Q50 100 0 100Z' }, duration: .38, ease: 'power3.out' }, .27)
        .fromTo(links, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .045, duration: .55, ease: 'power4.out' }, .12)
        .fromTo($('.menu-bottom'), { opacity: 0 }, { opacity: 1, duration: .3 }, .3);
    } else {
      menuTimeline.to(links, { yPercent: -28, opacity: 0, stagger: .015, duration: .22, ease: 'power2.in' }, 0)
        .to($('.menu-bottom'), { opacity: 0, duration: .2 }, 0)
        .to(path, { attr: { d: 'M0 0H100V0Q50 0 0 0Z' }, duration: .42, ease: 'power3.inOut' }, .06);
    }
  });
}

async function finishIntro() {
  if (!enabled() || boot?.dismissed) { boot?.complete(); playHero(); return; }
  await new Promise(resolve => {
    introTimeline = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
    introTimeline.to($('.intro-name'), { y: -24, opacity: 0, duration: .24, ease: 'power2.in' }, 0)
      .to($('#intro'), { yPercent: -100, borderRadius: '0 0 35% 35%', duration: .48, ease: 'power3.inOut' }, .04);
  });
  boot?.complete();
  playHero();
}

function destroy() {
  if (destroyed) return;
  destroyed = true;
  listeners.abort();
  detachTicker(); ambient?.destroy(); hoverCleanup();
  projectObserver.disconnect(); visibilityObserver.disconnect();
  clearTimeout(refreshTimer); clearTimeout(resizeTimer);
  sceneContext?.revert(); projectContexts.forEach(context => context.revert());
  menuTimeline?.kill(); introTimeline?.kill(); heroTimeline?.kill();
  heroAccentAnimation?.cancel(); heroAccentAnimation = null;
  lenis?.destroy();
  gsap.killTweensOf([ring, dot, preview]);
  gsap.set([ring, dot, preview], { opacity: 0 });
  html.classList.remove('motion-enabled'); html.classList.add('motion-off');
  boot?.dismiss();
}

window.portfolioMotion = { menu, destroy };
// Native anchors, back/forward and keyboard scrolling retain browser ownership.
listen(window, 'portfolio:navigate', () => { if (lenis) lenis.scrollTo(scrollY, { immediate: true }); });
listen(window, 'portfolio:menu', event => {
  if (event.detail.open) { lenis?.stop(); gsap.set([ring, dot, preview], { opacity: 0 }); }
  else { lenis?.start(); if (lenis) lenis.scrollTo(scrollY, { immediate: true }); }
});
const syncNative = () => requestAnimationFrame(() => { if (!destroyed && lenis) lenis.scrollTo(scrollY, { immediate: true }); ScrollTrigger.update(); });
listen(window, 'popstate', syncNative);
listen(window, 'hashchange', syncNative);
listen(window, 'pageshow', () => { scheduleRefresh(); syncNative(); });
listen(window, 'scroll', () => { hoverNeedsUpdate = true; }, { passive: true });
listen(window, 'pointermove', event => {
  if (!enabled() || !desktop.matches || event.pointerType !== 'mouse') return;
  pointer.x = event.clientX; pointer.y = event.clientY;
  if (!pointerSeen) { pointer.ringX = pointer.x; pointer.ringY = pointer.y; }
  pointerSeen = true; hoverNeedsUpdate = true;
  if (!$('#fullscreen-nav').open) gsap.set([ring, dot], { opacity: 1 });
}, { passive: true });
listen(document, 'pointerleave', () => { pointerSeen = false; gsap.set([ring, dot, preview], { opacity: 0 }); });
listen(document, 'visibilitychange', () => { lastTick = 0; if (!document.hidden) scheduleRefresh(); });
listen(window, 'resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(scheduleRefresh, 180); }, { passive: true });
listen(motionButton, 'click', () => { paused = !paused; buildScenes(); });
listen(reduced, 'change', event => {
  prefersReducedMotion = event.matches;
  introTimeline?.kill(); menuTimeline?.kill(); boot?.dismiss(); buildScenes();
  if ($('#fullscreen-nav').open) menu(true);
});
listen(desktop, 'change', buildScenes);
listen(compact, 'change', buildScenes);
listen(window, 'portfolio:intro-dismissed', () => {
  if (introTimeline?.isActive()) introTimeline.progress(1);
  if (sceneContext) playHero();
});

const visibilityObserver = new IntersectionObserver(entries => { marqueeVisible = entries[0].isIntersecting; }, { threshold: 0 });
visibilityObserver.observe($('.motion-strip'));
const projectObserver = new MutationObserver(() => { syncProjects(); scheduleRefresh(); });
projectObserver.observe($('#project-list'), { childList: true });

try {
  const fontsReady = await settle(document.fonts?.ready);
  if (!destroyed) {
    boot?.mark('fonts', fontsReady ? 'Typography ready' : 'Fallback typography ready');
    $$('.hero-name, h2').forEach(maskWords);
    buildScenes();
    boot?.mark('scenes', 'Ready to explore');
    await finishIntro();
    document.fonts?.ready.then(() => { if (!destroyed) scheduleRefresh(); });
  }
} catch (error) {
  destroy(); boot?.dismiss(true);
  console.warn('Motion initialization failed; static portfolio restored.', error);
}
if (import.meta.hot) import.meta.hot.dispose(destroy);
