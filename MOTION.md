# Portfolio motion inventory

## Completed delta — character choreography refinement

Source checked at the same commit recorded below. Keep completed navigation,
Lenis, preloader, timeline, service grid, cursor, marquee and project discovery.
Implemented these differences without replacing their architecture:

- HomeBanner: per-character perspective entrance, 0.026s stagger, center-out hover
  wave (-9%, 0.22s up / 0.5s down, 0.016s stagger), coordinated supporting elements.
  Retain the requested 45px / 0.94 start, 1.6s entrance and 1.0 scroll scrub.
- HomeScrollOrchestrator: scale/translation into About, adapted without sticky pinning.
- ScrollWordReveal: scrub the existing short About lead word by word; keep body readable.
- FlowField: adapt its trigonometric vector field, age-faded trails and pointer force
  to an About canvas, sharing the existing GSAP ticker. Preserve MIT attribution.
- TechStack: real category controls, animated switching and 0.05s technology staggers,
  using the existing four categories and all 21 verified technology labels.
- Services: draw accent rules during entry; retain the existing grid and tilt.
- Projects: add masked title choreography to the existing insertion/removal system.
- globals.css: restrained static film grain, matching the reference's actual behavior.
- Content: remove location labels outside HMR and use the user-specified HMR title.
- Verify actual character states, hover wave, filters, canvases, teardown, production
  navigation and the six requested viewport sizes, including reduced motion (results below).

## Existing surface and constraints

Finished personal portfolio; visitors learn Dario's focus, review verified background,
then follow the work/contact anchors. Preserve content, palette, section order, empty
project array and existing Vite scripts. Main mobile action remains email contact.
Use vanilla DOM enhancement; essential HTML is visible before JavaScript initializes.
Risks: clipped display type, delayed reading, inaccessible overlays, competing scroll
loops, desktop effects leaking onto touch, hidden content after an interrupted reveal.

## Reference research — 4 November 2026

Studied https://aitezaz.xyz/ (live HTML) and https://github.com/aitezazdev/Portfolio
at commit `e8b729ee314ab3beabf0fc8ef5d0e19d755e3be8`.
The repository is MIT-licensed (copyright 2026 Aitezaz Sikandar). Its React/Next
application, artwork, text and branding are not incorporated. The flow-field equations
and hero hover wave are adapted with the full MIT notice in
`public/THIRD-PARTY-NOTICES.txt`, which Vite copies into production output.
The other effects are original vanilla DOM implementations of the following techniques.

| Reference area / source | Observed technique | Dario implementation |
| --- | --- | --- |
| SmoothScrollProvider | Lenis driven by GSAP ticker; ScrollTrigger updates; font/load refresh; touch bypass | One shared GSAP ticker for Lenis, particles and cursor; desktop only smoothing; native anchors/history retained |
| GlobalPreloader | Font/load readiness, percentage, multilingual words, curved exit; includes timed minimum | DARIO mask, actual completed initialization milestones, no minimum wait, session scope, skip action, independent fail-open deadline |
| HomeBanner / AnimateHeading | SplitText character transforms, perspective, stagger and masking; verified center-out hover wave | 19 individually masked hero characters; 45px rise, 0.94 scale, -65° X rotation, 1.6s back.out(1.15), 0.026s stagger; source-matched hover wave; one coordinated intro timeline |
| HomeScrollOrchestrator | Sticky hero, scrubbed opacity/scale/translation into About | Unpinned hero scale to 0.95, upward travel and gradual dimming, line drift; scrub 1.0; curve boundary flattens with scroll |
| AmbientGeometry | Velocity-based canvas nodes, friction, edge bounce and pointer repulsion | Retained bounded 42-node / 14-node constellation with sinusoidal drift and pointer repulsion; restrained palette; not an exact physics clone |
| FlowField | Three trigonometric noise terms, directional velocity, age-faded particle trails, 130px pointer force | About field adapted to 140 desktop / 28 touch particles; delta-time physics and transparent trails; shared ticker at 30/20 updates per second; visibility and DPR caps |
| Navbar | Sliding panel with quadratic SVG edge, link staggers, animated dividers | Fullscreen native dialog, vertical SVG curve reveal, staggered routes, focus restoration and Escape |
| CustomCursor / Magnetic | Delayed ring, immediate dot, hover states, pointer attraction | Shared-ticker ring/dot, small contextual label, bounded child-only magnetic motion; native cursor retained |
| AboutMe / ScrollWordReveal | Scrubbed word contrast and editorial headings; staggered experience | Short lead scrubs word opacity, 8px rise and 0.94 scale with 0.05 stagger; body remains intact; masked headings, growing timeline line, active markers and staged entry content |
| Services | Desktop stacked pinning | Preserve existing grid; sequential card entries, 2-degree hover tilt, number/icon motion; no pinning |
| TechStack | Category filtering and scrubbed titles/cards; 0.05 staggers; icon hover | Five accessible filter controls for all/four existing categories; native HTML filtering, cancellable GSAP transitions, card staggers and text-chip hover; all 21 verified labels retained, no imported logos |
| CurvedSectionDivider | Scroll-responsive curve height | SVG curve in reserved boundary space; no changing layout heights |
| Projects | Clipped image reveals, scaled images, staggered metadata, floating preview | Reusable card initializer and MutationObserver; image clip/parallax, masked perspective title reveals, metadata entrance, desktop cursor preview; no sample projects |
| MarqueeStrip | Continuous ticker translation with scroll-velocity boost | Single decorative strip before contact, bounded velocity response; pause control and offscreen pause |
| Contact / Footer | Large text choreography, interactive CTA, staged final elements | Line masks, magnetic CTA, subtle background wash, footer reveal and native back-to-top |
| globals.css | Fixed 0.035-opacity SVG turbulence texture (static) | Original static grain at 0.025 opacity; no extra animation loop or pointer interception |

Live Chromium inspection was performed at the hero, About, Services and TechStack;
category filtering and the hero hover wave were exercised. Screenshots and actual
character matrices are in `.verification/reference-current-*`. The browser reached
the live site even though the web text-fetch tool could not open its home page.

## Motion contract

- Intro completion derives from DOM, module, font/fallback and scene initialization.
- No time-based simulated download percentage. Fail open after 2.5 seconds; skip is immediate.
- Entries generally run 0.55–0.9 seconds with `power3.out` / `power4.out`; section scrubs
  use short catch-up (0.35–0.65). Pointer attraction is bounded to 6px and tilt to 2 degrees.
- Reading content never requires finishing an exit animation. No essential text is scrubbed to zero opacity.
- Desktop: Lenis, pointer field, cursor, tilt, magnetic CTA and restrained parallax.
- Touch/compact: native scroll, shorter entries, fewer particles, no cursor, tilt or preview.
- Reduced motion or the visible motion toggle: static content, no smoothing/canvas/marquee;
  immediate navigation, all reveal transforms reverted. Preference changes apply live.
- Only GSAP's ticker drives continuous effects. ResizeObserver updates geometry; IntersectionObserver
  gates ambient work. Module/HMR teardown removes observers, timelines and listeners.
- SVG curve animation is limited to the hero boundary and the navigation transition.
- Native anchor hashes, keyboard scrolling and browser history are retained. Lenis synchronizes
  on navigation; only the open navigation dialog locks the background.
- Build verification must include production bundled modules, reduced motion, failed modules,
  empty and inserted project states, first/repeat intro, mobile menu and overflow checks.

## Editing future work

The `projects` array stays in `index.html`, with its existing field documentation.
Cards rendered there are discovered automatically. Inserting additional `.project-card`
nodes also initializes motion; removing them tears down their animation context.
Actual project images are the only preview source. No fabricated work is displayed.

## Hero refinement

The hero uses two typographic lines: **DARIO MARTIN / MONTEIRO**, retaining the
forest-green/off-white palette. GSAP reveals 19 independently transformed characters
over 1.6 seconds each, with a 0.026-second stagger, 45px initial translation and 0.94
initial scale. Perspective rotation and a small overshoot add kinetic character.
The full name stays the h1 accessible label; word groups and explicit line wrappers
prevent unwanted wrapping. Navigation, eyebrow, body, CTAs and scroll prompt share
the same entrance timeline. The hover wave only runs after that entrance settles.
Desktop hero ScrollTrigger scrub is 1.0; mobile keeps native scrolling without the
desktop parallax. Motion's `motion/mini` entry point fades the orbit SVG through
native Web Animations, on a separate element/property from GSAP. Its animation is
cancelled on preference changes, motion pause, responsive rebuild and module cleanup.
Other completed systems remain intact. Skill filter DOM updates live in the core
inline script, so category controls still work with failed imports or reduced motion.
Their own GSAP context is reverted before every switch, preference change or teardown.

## Content correction

The HMR role is exactly **Web/Software and IT Lead**. Its company, dates, location
and responsibilities remain intact. The only website copy mentioning Saudi Arabia
is the HMR company/location line. Hero, menu, About, contact and meta-description
location references were removed. Siemens, education, services, technology labels,
contact details and the empty project array are unchanged. The original supplied
PDF is retained as a source document without rewriting its historical contents.

## Verification completed

- `npm run dev`: serves the portfolio successfully (HTTP 200).
- `npm run build`: successful; `npm run preview` serves the bundled production site.
- Chromium: 320, 375, 430, 768, 1024, 1440 and 1920px; two-line hero,
  no heading/page overflow, original colors, touch/native scrolling and menu focus.
- Development and production: section entries, timeline progress, empty work,
  in-memory future-project insertion/removal and preview, anchors/back history,
  intro readiness milestones, once-per-session behavior, skip and stalled-import fallback.
- Reduced motion: initial and live preferences, visible content, Lenis teardown,
  GSAP cleanup and cancellation of the native Motion accent animation.
- Live desktop/compact resize: Lenis removed and restored at the breakpoint.
- No JavaScript: original content and baseline navigation remain available.
- Hero refinement: browser comparison confirms other section content is unchanged;
  live transforms and interrupted-animation teardown verified in the production bundle.
- No browser runtime errors in the passing checks. No real-device FPS claim is made;
  Safari, Firefox and physical-device performance are not covered by these Chromium tests.

Dependencies: GSAP 3.15.1 (including ScrollTrigger), Lenis 1.3.27, Motion 14.9.1
(`motion/mini` only), and the existing Vite 8.3.5. No React application is introduced.
The workspace is not a Git repository; no commit, push or publication was performed.

## Resume audit — 5 November 2026

Recovered the completed requirements from this inventory, the source, and existing
verification snapshots. All recorded animation features were already present.
GSAP/ScrollTrigger, Lenis, Motion mini and Vite were installed; no dependencies,
HTML, content, styles, flow-field code or animation timings were changed.

Fixed two reproduced interruption bugs in `motion.js`:

- Pointer exit now cancels pending cursor/preview tweens and resets hover state.
  A project preview returns correctly when the pointer re-enters the same card;
  an interrupted fade cannot make the preview reappear outside the page.
- Module teardown restores the menu's complete static background and visible links
  when it interrupts the opening animation. Native close/focus behavior remains intact.

Added `.verification/test-interruptions.cjs`; production checks pass for fade
cancellation, pointer re-entry, project removal and interrupted menu teardown.
`npm run build` passes. Existing production browser checks pass their functional
assertions at 320, 375, 430, 768, 1024, 1440 and 1920px, including navigation,
history, reduced motion, dynamic projects, failed imports and no JavaScript.
Startup milestones, repeat visits, skip and stalled-import checks also pass.
Character, hover, canvas, filter and teardown functional assertions pass.

Verification limitation: the general browser and character suites exit nonzero at
their final console-error assertion because this environment blocks the existing
Google Fonts stylesheet with `net::ERR_NETWORK_ACCESS_DENIED`. A separate request
probe confirmed the failing URL is `fonts.googleapis.com`; no application runtime
exceptions were reported. Desktop/mobile screenshots were inspected with fallback
fonts. New screenshots use the `resume-` prefix, preserving previous artifacts.
The pre-edit motion source is retained in `.verification/motion.before-resume-2026-11-05.js`.

## Selected Works — 7 November 2026

The project array now contains the owner's two delivered client websites: CRIZPO
(03) and AR Engineerings (04). Earlier empty-array notes describe the previous
state. Keep both entries and append future projects through the existing renderer.

Project-specific reveals extend the existing GSAP contexts and shared ticker.
Motion springs in `project-hover.js` own title/arrow feedback on separate elements
from GSAP's magnetic link movement. Stale preview decode completions are ignored,
viewport bounds are measured on entry/resize, and touch/reduced-motion users retain static
images and native links. Hero, intro, navigation and other section timelines remain
unchanged.

The two static case-study documents under `projects/` share `project-detail.css`
and `project-detail.js`. `vite.config.mjs` includes both routes in the production
build. Each document has its own single Lenis/GSAP lifecycle, with native scrolling
on touch and cleanup on media changes/page exit. No new dependencies were added.

Actual WebP screenshots and provenance live in `public/projects/`. Full checks,
source preservation and the CRIZPO server's HTTP 403 response are documented in
`.verification/selected-works-verification.md`.
