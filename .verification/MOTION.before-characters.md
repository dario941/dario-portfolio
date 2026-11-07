# Portfolio motion inventory

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
components, artwork, text and branding are not incorporated. Implementations here
are original vanilla JavaScript adaptations of the following techniques.

| Reference area / source | Observed technique | Dario implementation |
| --- | --- | --- |
| SmoothScrollProvider | Lenis driven by GSAP ticker; ScrollTrigger updates; font/load refresh; touch bypass | One shared GSAP ticker for Lenis, particles and cursor; desktop only smoothing; native anchors/history retained |
| GlobalPreloader | Font/load readiness, percentage, multilingual words, curved exit; includes timed minimum | DARIO mask, actual completed initialization milestones, no minimum wait, session scope, skip action, independent fail-open deadline |
| HomeBanner / AnimateHeading | SplitText character transforms, perspective, stagger and masking | Original lightweight word masks; staged name/role/CTA entrance; no SplitText dependency |
| HomeScrollOrchestrator | Sticky hero, scrubbed opacity/scale/translation into About | Unpinned hero typography drift; contrasting decorative boundary flattens with scroll |
| AmbientGeometry / FlowField | Canvas nodes/edges, pointer influence, DPR cap, resize and visibility observers | Bounded constellation, local neighbor connections, limited DPR, lower mobile count/rate, paused offscreen/hidden |
| Navbar | Sliding panel with quadratic SVG edge, link staggers, animated dividers | Fullscreen native dialog, vertical SVG curve reveal, staggered routes, focus restoration and Escape |
| CustomCursor / Magnetic | Delayed ring, immediate dot, hover states, pointer attraction | Shared-ticker ring/dot, small contextual label, bounded child-only magnetic motion; native cursor retained |
| AboutMe / ScrollWordReveal | Scrubbed word contrast and editorial headings; staggered experience | Readable paragraph translation, masked headings, growing timeline line, active markers and staged entry content |
| Services | Desktop stacked pinning | Preserve existing grid; sequential card entries, 2-degree hover tilt, number/icon motion; no pinning |
| TechStack | Category transitions and individual technology motion | Row-level staged entry and compact label staggers; verified skills unchanged |
| CurvedSectionDivider | Scroll-responsive curve height | SVG curve in reserved boundary space; no changing layout heights |
| Projects | Clipped image reveals, scaled images, staggered metadata, floating preview | Reusable card initializer and MutationObserver; image clip/parallax, text reveal, desktop cursor preview; no sample projects |
| MarqueeStrip | Continuous ticker translation with scroll-velocity boost | Single decorative strip before contact, bounded velocity response; pause control and offscreen pause |
| Contact / Footer | Large text choreography, interactive CTA, staged final elements | Line masks, magnetic CTA, subtle background wash, footer reveal and native back-to-top |

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
forest-green/off-white palette. GSAP reveals the masked words over 1.6 seconds each
with a restrained 0.08-second stagger, 45px initial translation and 0.94 initial scale.
Desktop hero ScrollTrigger scrub is 1.0; mobile keeps native scrolling without the
desktop parallax. Motion's `motion/mini` entry point fades the orbit SVG through
native Web Animations, on a separate element/property from GSAP. Its animation is
cancelled on preference changes, motion pause, responsive rebuild and module cleanup.
All unrelated sections retain the completed animation system.

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
