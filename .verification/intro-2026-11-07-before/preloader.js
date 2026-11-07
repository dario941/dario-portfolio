// Original greeting choreography. Arabic and Malayalam retain their shaping runs.
export function createIntroduction({ gsap, boot, onReveal }) {
  const overlay = document.querySelector('#intro');
  if (!boot || boot.dismissed || overlay.hidden) return null;
  const words = [...overlay.querySelectorAll('.intro-greeting')];
  const brand = overlay.querySelector('.intro-name');
  let resolveGreetings;
  let resolveExit;
  let stopped = false;
  let exitTimeline;
  const progress = { value: Number(overlay.dataset.progress) || 0 };
  let progressTween;
  const updateProgress = event => {
    progressTween?.kill();
    progressTween = gsap.to(progress, { value: event.detail, duration: .45, ease: 'power2.out',
      onUpdate: () => { overlay.querySelector('#intro-percent').textContent = String(Math.round(progress.value)); }
    });
  };
  window.addEventListener('portfolio:loading-progress', updateProgress);
  const greetingsDone = new Promise(resolve => { resolveGreetings = resolve; });
  const context = gsap.context(() => {}, overlay);
  let greetings;
  boot.extendDeadline(4200);
  context.add(() => {
    gsap.set(words, { autoAlpha: 0, yPercent: 70 });
    greetings = gsap.timeline({ onComplete: resolveGreetings });
    let position = 0;
    words.forEach((word, index) => {
      const dwell = index === 0 ? .3 : .25;
      greetings.call(() => {
        overlay.dataset.greeting = word.textContent;
        overlay.querySelector('#intro-greeting-number').textContent = String(index + 1).padStart(2, '0');
      }, [], position)
        .to(word, { autoAlpha: 1, yPercent: 0, duration: .18, ease: 'power3.out' }, position);
      if (index < words.length - 1) greetings.to(word,
        { autoAlpha: 0, yPercent: -60, duration: .12, ease: 'power2.in' }, position + dwell - .08);
      position += dwell;
    });
    greetings.to({}, { duration: .22 });
    gsap.fromTo('.intro-orbit', { scale: .9, opacity: 0, rotation: -35 },
      { scale: 1, opacity: 1, rotation: 20, duration: 2.3, ease: 'power2.out' });
  });
  return {
    async exit() {
      await greetingsDone;
      if (stopped || boot.dismissed) return;
      return new Promise(resolve => {
        resolveExit = resolve;
        context.add(() => {
          exitTimeline = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
          exitTimeline.to(words.at(-1), { yPercent: -80, autoAlpha: 0, duration: .17, ease: 'power2.in' }, 0)
            .set(brand, { autoAlpha: 1 }, .1)
            .fromTo(brand.children, { yPercent: 110, rotation: 5 },
              { yPercent: 0, rotation: 0, duration: .32, stagger: .025, ease: 'power4.out' }, .1)
            .to('.intro-center, .intro-top, .intro-bottom', { y: -20, opacity: 0, duration: .22, ease: 'power2.in' }, .53)
            .to('.intro-panel', { yPercent: -101, duration: .65, stagger: .07, ease: 'power4.inOut' }, .57)
            .to('.intro-track', { opacity: 0, duration: .15 }, .57)
            // The hero owns a separate context. Never nest its entire scene tree in
            // this short-lived intro, or reverting the curtain removes all scroll scenes.
            .call(() => context.ignore(onReveal), [], .94);
        });
      });
    },
    cancel() {
      stopped = true;
      window.removeEventListener('portfolio:loading-progress', updateProgress);
      progressTween?.kill();
      greetings?.kill(); exitTimeline?.kill();
      resolveGreetings(); resolveExit?.();
      context.revert();
    }
  };
}
