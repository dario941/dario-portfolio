    // Core navigation stays independent of GSAP/Lenis so a failed import is usable.
    document.body.classList.add('app-ready');
    const menuButton = document.querySelector('.menu-toggle');
    const menuDialog = document.getElementById('fullscreen-nav');
    const mainNavigation = document.getElementById('navigation');
    const sectionIds = ['home', 'about', 'services', 'skills', 'work', 'contact'];
    const sections = sectionIds.map(id => document.getElementById(id));
    let closingMenu = false;
    let restoreMenuFocus = null;
    let scrollFrame = 0;

    const notifyMenu = open => window.dispatchEvent(new CustomEvent('portfolio:menu', { detail: { open } }));
    function openMenu() {
      if (menuDialog.open || closingMenu) return;
      window.portfolioBoot?.dismiss();
      restoreMenuFocus = document.activeElement;
      menuDialog.showModal();
      document.body.classList.add('menu-open');
      menuButton.setAttribute('aria-expanded', 'true');
      notifyMenu(true);
      window.portfolioMotion?.menu(true);
    }
    async function closeMenu(destination = null) {
      if (!menuDialog.open || closingMenu) return;
      closingMenu = true;
      // The native dialog remains modal throughout its exit, including keyboard focus.
      await Promise.race([
        Promise.resolve(window.portfolioMotion?.menu(false)),
        new Promise(resolve => setTimeout(resolve, 650))
      ]).catch(() => {});
      menuDialog.close();
      document.body.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
      closingMenu = false;
      notifyMenu(false);
      if (destination) {
        if (location.hash !== destination) location.hash = destination;
        else document.getElementById(destination.slice(1))?.scrollIntoView();
        focusDestination(destination);
      } else if (restoreMenuFocus?.isConnected) restoreMenuFocus.focus({ preventScroll: true });
    }
    function focusDestination(hash) {
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    menuButton.addEventListener('click', openMenu);
    menuDialog.querySelector('.menu-close').addEventListener('click', () => closeMenu());
    menuDialog.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
    menuDialog.addEventListener('close', () => {
      document.body.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
      notifyMenu(false);
    });
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const hash = link.getAttribute('href');
      if (!document.getElementById(hash.slice(1))) return;
      window.portfolioBoot?.dismiss();
      window.dispatchEvent(new Event('portfolio:navigate'));
      if (menuDialog.contains(link)) { event.preventDefault(); closeMenu(hash); }
      else focusDestination(hash); // Preserve native anchor navigation and history.
    });
    function updateNavigation() {
      let current = 'home';
      for (const section of sections) if (section.getBoundingClientRect().top <= Math.min(innerHeight * .35, 240)) current = section.id;
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 8) current = 'contact';
      document.querySelectorAll('#navigation a, .overlay-links a').forEach(link => {
        if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      document.querySelector('.site-header').classList.toggle('is-scrolled', scrollY > 60);
      const distance = document.documentElement.scrollHeight - innerHeight;
      document.querySelector('.scroll-progress').style.transform = `scaleX(${distance > 0 ? Math.max(0, Math.min(1, scrollY / distance)) : 0})`;
      scrollFrame = 0;
    }
    const queueNavigation = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation); };
    window.addEventListener('scroll', queueNavigation, { passive: true });
    window.addEventListener('resize', queueNavigation, { passive: true });
    window.addEventListener('pageshow', queueNavigation);
    updateNavigation();
    document.getElementById('copyright-year').textContent = String(new Date().getFullYear());

    // Real completed milestones; fonts may settle to their fallback after a deadline.
    const intro = document.getElementById('intro');
    const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
    let introSeen = false;
    try { introSeen = sessionStorage.getItem('dario-intro-v1') === '1'; } catch {}
    const shouldIntro = !introSeen && !reducedPreference.matches && !location.hash && scrollY < 40;
    let dismissed = !shouldIntro;
    let finished = false;
    let introWatchdog;
    const completedMilestones = new Set();
    const weights = { dom: 15, libraries: 30, fonts: 20, scenes: 35 };
    window.portfolioBoot = {
      started: performance.now(),
      get dismissed() { return dismissed; },
      get finished() { return finished; },
      mark(name, label) {
        completedMilestones.add(name);
        const progress = [...completedMilestones].reduce((total, key) => total + (weights[key] || 0), 0);
        document.getElementById('intro-percent').textContent = String(progress);
        document.querySelector('.intro-track').style.transform = `scaleX(${progress / 100})`;
        document.getElementById('intro-stage').textContent = label;
        intro.dataset.progress = String(progress);
      },
      dismiss(failed = false) {
        dismissed = true;
        finished = true;
        intro.hidden = true;
        clearTimeout(introWatchdog);
        if (failed) document.documentElement.classList.add('motion-failed');
        if (intro.contains(document.activeElement)) document.querySelector('.brand').focus({ preventScroll: true });
        window.dispatchEvent(new Event('portfolio:intro-dismissed'));
      },
      complete() {
        try { sessionStorage.setItem('dario-intro-v1', '1'); } catch {}
        this.dismiss();
      }
    };
    if (shouldIntro) {
      intro.hidden = false;
      introWatchdog = setTimeout(() => window.portfolioBoot.dismiss(true), 2500);
    }
    window.portfolioBoot.mark('dom', 'Interface ready');
    intro.querySelector('.intro-skip').addEventListener('click', () => window.portfolioBoot.dismiss());
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !intro.hidden) window.portfolioBoot.dismiss(); });
    document.addEventListener('focusin', event => { if (!intro.hidden && !intro.contains(event.target)) window.portfolioBoot.dismiss(); });
    reducedPreference.addEventListener('change', event => { if (event.matches) window.portfolioBoot.dismiss(); });
