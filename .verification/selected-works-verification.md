# Selected Works — 7 November 2026

## Delivered

- Added CRIZPO (03) and AR Engineerings (04) to the existing project array and alternating renderer. The pre-change array was empty; no earlier project entries were removed.
- Added static case studies at `/projects/crizpo/` and `/projects/ar-engineerings/`, included in the Vite production build through `vite.config.mjs`.
- Captured six actual desktop/mobile screenshots from the client websites and encoded them as WebP. Total: 481,458 bytes. Capture sources and dimensions are recorded in `public/projects/sources.json`.
- Reused the existing GSAP project contexts, ScrollTrigger, Lenis integration, cursor tracking and preview element. CRIZPO has a restrained scale/rotation reveal; AR Engineerings has a horizontal reveal. Motion springs animate title and arrow feedback on separate elements from GSAP.
- Main-page preview motion uses the existing ticker; case studies use one scroll controller per document. Context teardown cancels Motion animations, GSAP tweens and event listeners, and invalidates pending preview decode completions.
- Retained static screenshots on touch devices, keyboard links, reduced-motion support and no-JavaScript access to the case studies.

## Preservation

Source comparisons confirm the intro, main hero, navbar, other sections, original inline design CSS, intro timing/fonts, technology section, flow field, dependency manifest and lockfile are unchanged. The hero timeline, scene builder, constellation and intro-completion functions are byte-identical to the saved source.

The project rendering additions are backward compatible with existing image, technology, live URL and GitHub fields. The generic dynamically inserted project fixture still passes its regression checks.

## Verification

- `npm run build`: passed, including both detail-page entry points.
- `node --check motion.js`, `project-hover.js`, `project-detail.js`: passed. The project has no configured lint script.
- `.verification/test-client-projects.cjs`: production passed at 320, 375, 768 (touch tablet), 1024, 1440 and 1920px. Covers both projects, image loading, links, card reveal completion, viewport bounds, pointer interruption/re-entry, single-tap navigation, detail pages, browser Back, keyboard focus/Enter, new-tab opener isolation, reduced motion and no-JavaScript reading.
- `.verification/test-project-scroll.cjs`: passed. One main ticker, Lenis wheel scroll, advancing project ScrollTrigger progress, zero remaining triggers/tickers after teardown and no surviving Motion animations after reduced-motion activation.
- `.verification/test-interruptions.cjs`: passed. Pointer exit, preview re-entry, dynamic project removal and interrupted menu teardown.
- `.verification/test-browser.cjs` focused regression: passed. All sections, scroll scenes, motion toggle, navigation/history, dynamic projects, failed module fallback and no-JavaScript navigation.
- Browser errors: none in portfolio development/production checks.
- Visual inspection: desktop/mobile project cards, both preview styles, case-study headings and desktop/mobile galleries. Geometry checks cover all six viewport widths.
- A headless desktop sample measured approximately 6.9ms median / 7.1ms p95 frame intervals during preview display. This is an environment-specific diagnostic, not a physical-device FPS guarantee. Physical devices, Safari and Firefox were not tested.

## Live website verification and sources

- [CRIZPO](https://www.crizpoksa.com/): the actual site renders; Arabic switches the document to `lang="ar"`, `dir="rtl"`. Its main document returns HTTP 403, including on a second browser check. This is an existing response from the client server, outside this portfolio change.
- [AR Engineerings](https://www.ar-eng.net/): HTTP 200; Arabic/RTL switch works.
- React was verified from each site's rendered root. AR Engineerings serves through Cloudflare and loads its analytics beacon. Other client technologies are limited to HTML, CSS and JavaScript; no backend or unverified framework claims were added.
- Project descriptions, roles, on-site delivery and feature claims come from the user's brief; no testimonials, results or performance statistics were invented.
- [Reference portfolio](https://aitezaz.xyz/) and [public repository](https://github.com/aitezazdev/Portfolio): reviewed `Projects.tsx`, `CustomCursor.tsx` and `Magnetic.tsx`, plus the live hover interaction. The implementation extends this portfolio's own controllers; no React components or reference project content were copied.

Screenshots and machine-readable reports are in `.verification/`; pre-change files are in `.verification/works-before/`.
