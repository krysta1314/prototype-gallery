---
target: model page template
total_score: 25
p0_count: 0
p1_count: 2
timestamp: 2026-11-18T08-32-31Z
slug: src-app-prototypes-v1-16-model-page-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser)
Target: model page template (src/app/prototypes/(v1.16)/model-page) — Nielsen 25/40
AI slop: yes. 10 uppercase pill kickers (one per section, repeating the TOC label and H2), gradient text in H1 + final CTA, gradient step squares, Sparkles on the Create button, five same-size card grids, hero/feature videos are promo title cards rather than real model output, one UGC clip reused 3x.
Detector: gradient-text x2 (page.tsx:16 used :208/:563); browser 77 hits: low-contrast 32 (#9a9aab 2.77:1 on white — mega-menu group labels, glance dt, timestamps; #ff5e1a meta 3.06:1), repeated-section-kickers 9, hero-eyebrow-chip 1, line-length 13 (FAQ ~104ch), nested-cards / thin-border-wide-shadow on mega panels. Mobile 375: no overflow.
Priority issues:
[P1] Template grammar, no point of view — remove section kickers, no gradient text, plain step numerals, no sparkles; bigger H2 scale. (quieter, typeset)
[P1] Hero + features sell title cards not model output — real Kling outputs, input→output pairs, varied examples. (bolder)
[P2] Low-contrast secondary text #9a9aab / orange meta. (polish)
[P3] Duplicated specs (facts/specs/FAQ), mixed price-table order, Compare first column not sticky on mobile, FAQ line length. (polish, adapt)
