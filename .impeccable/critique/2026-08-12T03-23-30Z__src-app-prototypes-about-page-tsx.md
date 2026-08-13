---
target: about 页面(深色编辑风重做版)
total_score: 33
p0_count: 0
p1_count: 4
timestamp: 2026-08-12T03-23-30Z
slug: src-app-prototypes-about-page-tsx
---
⚠️ DEGRADED: single-context (session config forbids spawning sub-agents unless explicitly requested)

Target: `src/app/prototypes/about/page.tsx` — BuzzVideo About page, dark editorial rebuild.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hover/focus/accordion states solid; no loading state while videos fetch |
| 2 | Match System / Real World | 4 | Copy concrete and jargon-free |
| 3 | User Control and Freedom | 3 | No skip-to-content link; masthead is the only way back |
| 4 | Consistency and Standards | 4 | One rule system held end to end |
| 5 | Error Prevention | 3 | n/a — no forms or destructive actions |
| 6 | Recognition Rather Than Recall | 3 | Everything visible; "Talk to our team" is a dead button (prototype) |
| 7 | Flexibility and Efficiency | 3 | Keyboard reaches every control; scroller arrow-scrollable |
| 8 | Aesthetic and Minimalist Design | 4 | Nothing decorative survives |
| 9 | Error Recovery | 3 | Video falls back to poster + neutral surface |
| 10 | Help and Documentation | 3 | FAQ covers the real questions |
| **Total** | | **33/40** | **Good** |

## Anti-Patterns Verdict

Deterministic scan: `detect.mjs` — 0 findings, exit 0.

LLM assessment: does not read as AI-generated. No eyebrows, no gradient text, no stat tiles, no icon-card grid, no centered-everything. The rule-and-uppercase system is committed enough to look like a decision rather than a template.

## Issues found and fixed in this pass

- **[P1] Hero video fought the headline.** The gym clip carried baked-in typography ("RAW PRE WORKOUT") and UGC captions that landed behind the H1 at multiple points in the loop. Swapped to the chrome-sprinter/supercar clip (324746276853833728): no burned-in type, dark back half holds white type. Gym clip moved to the "Creative testing" tile.
- **[P1] Closing CTA was keyboard-inaccessible.** "Start free" was a `<span>` with `cursor-pointer` — not focusable, not announced. Rebuilt as a real button via the shared `Cta` component (new `onOrange` variant), label unified to "Start creating".
- **[P1] No visible focus indicator anywhere.** All controls had `outline: none`. Added focus rings — on the focusable shell, not the inner span (the first attempt made that mistake; the span never receives focus).
- **[P1] All 10 videos decoded simultaneously, forever.** Added an IntersectionObserver that pauses off-screen clips. Verified 1/10 playing instead of 10/10. Videos also got `aria-hidden` and a neutral fallback surface.
- **[P2] Metronomic rhythm.** Six consecutive sections at exactly 128px padding and five h2 at exactly 54px. Introduced a three-tier heading scale (thesis 66 / chapter 54 / aside 38) and varied section padding (176 / 128 / 144 / 96 / 128 / 112 / 112).
- **[P2] No poster frames.** Extracted first frames with ffmpeg to `public/prototypes/about/posters/` (10 files, 14–44 KB). All resolve 200.

## Deliberately not changed

- **Manifesto 01–06 numbering.** Flagged as decorative (reordering the six changes nothing, unlike the affiliate 01–03 which is a real sequence). User chose to keep it.
- **Skip-to-content link.** Offered, declined — prototype stage.

## Persona Red Flags

- **Jordan (first-timer)**: lands fine. H1 states what this is in one line; FAQ answers "what is this" first.
- **Casey (mobile, slow connection)**: was the worst hit — 10 simultaneous decodes. Now off-screen-paused with poster frames.
- **Sam (keyboard/screen reader)**: was blocked at the closing CTA and had no focus rings. Both fixed. Still no skip link; ticker announces nine model names.

## Questions to Consider

- The manifesto and the affiliate steps now use the same numbered-rule device. At what point does a repeated device stop being a system and start being a template?
- "Talk to our team" and "Contact sales" are dead buttons. In a prototype meant to be replicated into production, should dead controls look interactive at all?
