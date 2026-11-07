# Reference audit — 5 November 2026

Public source: https://github.com/aitezazdev/Portfolio

Live reference: https://aitezaz.xyz/

Exact source commit: `e8b729ee314ab3beabf0fc8ef5d0e19d755e3be8`.

Independent research checkout: `C:/Users/DARIO/AppData/Local/Temp/dario-reference-audit-f24c4121c7e7404e9941bcb6ebd6fac6`.

## Findings before implementation

The portfolio in the working directory is a Vite application enhanced with vanilla
DOM modules, GSAP, ScrollTrigger, Lenis and Motion mini. It is not a React project.
The existing architecture already contains most section, canvas, cursor, and hero
effects. The principal gaps are multilingual preloader choreography and the plain
technology labels. Preserve existing content and architecture.

| Feature / source | Actual reference implementation | Existing portfolio and action |
| --- | --- | --- |
| `shared/GlobalPreloader.tsx`, `app/ClientLayout.tsx` | 380ms first greeting then 280ms subsequent greetings; 1.4s minimum / 3.2s cap; fonts/load readiness mixed with synthetic progress; vertical curved exit; session flag and completion event | Existing readiness milestones, session guard, skip and deadline are stronger. Add the requested seven greetings and brand beat around these safeguards. Do not port synthetic download progress or unconditional scroll-to-top. |
| `sections/HomeBanner.tsx` | SplitText characters, perspective 900, rotateX -70, yPercent 125, 0.026 stagger; center-out hover wave with -9% rise; layered supporting timeline | Existing independently masked Dario characters, hierarchy, wave, supporting timeline and scroll depths should be retained. Check preloader handoff and font loading. |
| `home/HomeScrollOrchestrator.tsx` | Sticky hero fades/scales to 0.95 with 1.2 scrub; pointer events and ambient work disabled after 85% | Existing unpinned transition is appropriate for content and mobile access. No extra pinning needed. |
| `sections/TechStack.tsx` | Editorial sans/italic title; 1/3 category headings and counts, 2/3 technology grid; 4 columns desktop/2 mobile; 0.05 stagger, scrubbed entries; 360° hover spin and 1.1 scale | Add local authentic logos for named technologies, oversized categories/counts, responsive cards and serif accent. Add bounded tilt/idle motion, cancellable filter exit/layout/entry. Replace repeated scrub dimming with once-only entry. Retain actual 21 labels, not reference skills. |
| `providers/SmoothScrollProvider.tsx` | Lenis on GSAP ticker, milliseconds conversion, ScrollTrigger.update, fonts/load refresh, touch bypass and full teardown | Already present; preserve a single shared system. |
| `ui/AnimateHeading.tsx`, `ui/ScrollWordReveal.tsx` | Perspective character heading reveal, short rules, scrubbed word contrast/translation | Existing masked headings, short About lead word reveal and dividers serve same purpose. Preserve readable body paragraphs. |
| `sections/AboutMe.tsx` | Flow-field background, staggered credentials, timed dots/connectors, SVG path drawing | Existing About field, heading, timeline progress/markers, staged dates and roles retained. |
| `sections/Services.tsx` | Desktop cards pin and stack; mobile remains normal flow | Existing interactive grid fits this portfolio; preserve dividers, card entries, tilt and pointer light rather than introducing scroll-jacking. |
| `sections/Projects.tsx` | Desktop text rows + delayed floating image reel and VIEW cursor; mobile clipped image reveal; details via Next routes | Existing project discovery/initialization/teardown and masked title/media/parallax are appropriate. Current source project array is empty: retain truthful coming-soon state. Do not fabricate screenshots or project links. |
| `app/providers.tsx` | Two sequential full-viewport route curtains with scroll lock/restore, route completion callbacks | No route framework in current site; retain native anchors/history. Do not add Next transition router. |
| `shared/CustomCursor.tsx`, `ui/Magnetic.tsx` | Immediate dot, interpolated trailing ring, view/drag/copy text; magnetic inner target with elastic return; coarse pointer bypass | Existing shared-ticker cursor and child-only bounded magnetism retained. Recheck hover interruption and reduced motion. |
| `canvas/FlowField.tsx` | Three trigonometric field terms, age-faded trails, 130px pointer repulsion, 220/40 particles, DPR 1.5/1, visibility gate | Existing lighter 140/28 particle adaptation with shared ticker and delta-time physics is preferable. Full original MIT notice is already present. |
| `canvas/AmbientGeometry.tsx` | 90/18 nodes, velocity/friction, edge bounce, pointer repulsion, distance connections, offscreen/visibility suspension | Existing bounded 42/14 constellation is appropriate. |
| `sections/Contact.tsx`, `shared/Footer.tsx` | Character headings, card and CTA stagger, copy/email/form feedback, footer reveal | Preserve Dario email actions and existing magnetic CTA/footer sequence; no extra form/service needed. |
| `app/globals.css`, `lib/motion.ts` | Space Grotesk + Instrument Serif + Geist; static grain opacity .035; named power/cubic/elastic easing tokens | Preserve Manrope/DM Sans and cream/forest/sage. A restrained italic accent complements rather than replaces established typography. |

## Live inspection

Chrome inspected at 1440×950 and 375×950 (touch emulation on compact).
Hero entrance/hover, technology category switching and spinning icons exercised.
Both viewports reported no application runtime exceptions or horizontal overflow.
The desktop hovered icon produced a rotated intermediate matrix and settled at
scale 1.1, confirming the source behavior. The mobile stack uses two columns and
keeps all controls touch-accessible. The live desktop project floating image preview
was also observed. Screenshots and measured results use the
`.verification/master-reference-*` prefix.

Ordinary sandbox networking denied the live request; authorized escalated research
download and browser invocation succeeded. Playwright is installed only in the
temporary checkout's `qa/node_modules`, not as an application dependency.

## Attribution

The source LICENSE is MIT, copyright (c) 2026 Aitezaz Sikandar. Retain the complete
license in `public/THIRD-PARTY-NOTICES.txt` for existing adaptations and append any
new source/asset provenance. No reference personal information, project content,
dark theme, Next code or artwork is copied into Dario's portfolio.
