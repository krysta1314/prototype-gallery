---
target: Hybrid Reel 原型全流程(Agent 落地页 → 对话 → 画布 → 全屏编辑器)
total_score: 20
p0_count: 1
p1_count: 4
timestamp: 2026-09-24T08-13-14Z
slug: src-app-prototypes-v1-13-hybrid-reel
---
Method: dual-agent (A: design review · B: detector + browser, isolated). Supplemented by a requirements-vs-docs audit and a code audit.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good analysis/generation status; plan card shows no cost; balance 63,016 on landing vs 35,600 in chat/canvas |
| 2 | Match System / Real World | 2 | Beat language is great; "broll", "Clips 3/10", "No Video Generated", image-model settings in Hybrid Reel mode |
| 3 | User Control and Freedom | 2 | Undo only via ⌘Z; route picked by typing "c"; back to chat only via unlabeled logo; Model Settings ignores Esc |
| 4 | Consistency and Standards | 1 | Fonts switch (landing Inter+Bricolage vs SF elsewhere); two balances; two nav icon sets; 3 tab styles; CN/EN mixed in one card |
| 5 | Error Prevention | 1 | Two "Generate Video" buttons target different shots; export with ungenerated shots → blank frames; 2–3s options while Seedance bills 4s |
| 6 | Recognition Rather Than Recall | 2 | Storyboard has no thumbnails; generator nodes anonymous; beat not visible on timeline; icon-only track headers |
| 7 | Flexibility and Efficiency | 3 | Context menu, ⌘C/⌘Z, S split, Tab-accept, trim snapping; no batch generate / multi-select; "@" mention promised but not implemented |
| 8 | Aesthetic and Minimalist Design | 2 | Editor is restrained; entry layer over-decorated; chat proposal is a wall of text |
| 9 | Error Recovery | 2 | Credits refunded on failure; video failure reason never shown; chat dead-ends after outline/brief errors |
| 10 | Help and Documentation | 2 | Type picker explainer, tooltips on icons; nothing explains nodes/edges/credits on canvas |
| **Total** | | **20/40** | **Acceptable (lower edge)** |

## Anti-Patterns Verdict

LLM assessment: moderately AI-flavored. The canvas/editor core is restrained and tool-like; the AI look concentrates in the entry layer, chat proposals and decoration.
1. Sparkles as a universal icon (Home/Agent/Canvas rail all the same Sparkles icon; Create, AI generate, Design with AI, Make music with AI).
2. Chat proposals read as raw LLM output: 3 routes × 6 bold labels + bullets ≈ 40 lines.
3. Gradient buttons everywhere, two directions (Create: vertical red→orange + 3px hard shadow + hover lift; others horizontal); up to 3 gradient buttons on one editor screen.
4. Pill-in-pill account cluster (credits + gradient Upgrade + red -30% + orange gift + Personal) — an enterprise feature showing Personal and a discount.
5. Marketing hero inside a tool (Bricolage ExtraBold + gradient text + Inter body) — violates design.md system-font rule; font changes when entering chat.
6. Template popovers: KEY FEATURES / HOW TO USE uppercase tracked kickers, ENTERPRISE badge, illustration + 3 checkmarks + full-width gradient button; the pitch repeats 3 times with inconsistent beat lists.
7. Identical anonymous "Video Generator" nodes; rainbow audio category tiles outside the brand palette.
8. Ten font sizes (9–14px in half-pixel steps) in the full editor.
9. Nested cards in the plan card with pipe-joined chips ("Seedance 2.0 | 9:16 | 720p | 2s | broll").

Deterministic scan: 10 gradient-text warnings. Only 1 inside the agent surface (agent/page.tsx:103 gradText, brand-sanctioned); 9 on the Hybrid Reel home page.tsx using the CTA button gradient on text (wrong token). Browser: #9a9bb0 gray (2.73:1 on white) used 72 times across 13 files; subtitle chip white on #ff9563 = 2.16:1; showcase icons use cyan/purple gradients outside the palette; agent page 99% Inter vs SF elsewhere; nested-cards and tiny-text (11–11.5px, rendered ~8px at 73% canvas zoom). False positives: white text on gradient CTA buttons.

## Priority Issues

- [P0] The money moment is unclear: preview "Generate Video · 50" targets the shot under the playhead, the Settings button targets the selected shot; plan card never shows a number; export with missing shots produces blank frames and warns only afterwards. Fix: no paid button in preview; a "2 AI shots missing · Generate all · 100 credits" bar; plan card shows ≈credits + balance; block export with a choice.
- [P1] The beat structure disappears after handoff: beat names only in aria-labels, anonymous generator nodes. Fix: thin beat color strip + "Hook · 2s" label per clip, name nodes "Hook · AI shot", role editable.
- [P1] Strip the decorative AI layer: distinct nav icons, one gradient primary per screen, Upgrade as text, no -30%/gift, verbs instead of sparkles.
- [P1] Landing composer shows wrong controls in Hybrid Reel mode (image model GPT-image-2 / Low / 1:1, 10 LLMs). Fix: real params as chips (9:16 · 15s · TikTok · subtitle language), LLM under Advanced, "Add footage" when nothing is attached.
- [P1] Chat proposals need structure: comparable route cards (beat strip, "AI 2 / yours 2", ≈credits, one-line insight, "Use this route"), storyboard rows with in-point thumbnails, assumptions as editable chips.
- [P2] Four surfaces don't feel like one product: shared AppShell, system font on landing, one Tabs/Button set, language rule (fixed product copy English, content follows user).
- [P2] Color semantics collide and contrast is low: hook = brand orange = selection; pain = CTA red = error red; track colors mean something else; subtitle chip 2.2:1. Fix: dedicated categorical palette; subtitle chip dark text on #FFE7D6.
- [P2] Editor lacks basics: context menu without Split/Delete/Duplicate/Replace, no undo/redo buttons, no properties for real clips, Media has no import, "None" subtitle style isn't none.

## Persona Red Flags

- Jordan (first-timer who can't afford an editor): no finished example on landing; 10 LLMs + image settings; picks a route by typing "c"; "broll"; first canvas view is a gray tile with a price; two Generate buttons; export gives blank frames.
- Alex (CapCut power user): no Split/Delete in context menu; no clip properties (volume/speed); no undo button; no import; subtitle presets only.
- Riley (stress tester): switching to non-enterprise keeps Hybrid Reel selected and Create still works (gate bypass); Model Settings + LLM menu open together, Esc doesn't close; generation failure silently reverts; 16:9/12s fits into a 9:16/2s slot without warning; three identical "做一条广告片" sessions.

## Minor Observations

- Copy: "Support image, video, pdf, audio" → "Supports images, videos, PDFs and audio"; "Reuse generated & uploaded file" → "files".
- Gate modal opens with the type popover still open behind it; LLM picker and tool cards lack accessible names.
- Plan card "Cancel" is ambiguous and sits next to the primary.
- Cover preview frame is landscape while the reel is 9:16.
- Canvas zoom control overlaps the editor timeline at 96%; context-menu hover highlight sticks.
- Placeholder "Use @ to reference your footage" promises a feature that doesn't exist.

## Questions to Consider

1. If beats are the product's core, why do they vanish the moment editing starts — could the timeline itself be the storyboard?
2. Does a linear 15s ad need a node graph at all, or is it there because the product already has a canvas?
3. How could users watch a full rough cut before spending the first credit (storyboard frames or free low-res placeholders in the gaps)?
