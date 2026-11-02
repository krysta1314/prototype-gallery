---
target: MCP Skills 落地页与子页面
total_score: 25
p0_count: 2
p1_count: 6
timestamp: 2026-11-02T03-43-21Z
slug: src-app-prototypes-v1-12-mcp-skill-showcase
---
Method: dual-agent (A: design review · B: detector + browser)

Nielsen total 25/40 (Visibility 2, Match 2, Control 3, Consistency 2, Error prevention 2, Recognition 3, Efficiency 3, Minimalist 3, Error recovery 2, Help 3).
Detector CLI: 0 findings. Browser overlay: dark-glow CTA, line-length (chat, FAQ), low-contrast white on #dc6f4c (3.27:1), width transition, skipped heading, cramped toggle.

P0 Demo chat blanks on tab switch (opacity-only reveal + scroll-to-bottom) — fixed: unmounted until shown, top fade.
P0 Detail Try buttons before setup — fixed: visible "First time? Set up" row under CTAs.
P1 Demo plays before seen — fixed: IntersectionObserver start + Replay.
P1 Research placeholder clipped/wireframe — fixed: report card with ad thumbnails, wide ratio.
P1 Claude button contrast 3.27 — fixed: #b8532f (4.87:1).
P1 Mobile nav missing, header gutter 3.6px — fixed: menu sheet, shorter Dashboard label.
P1 Model wall borrowed stills / one product everywhere — kept by owner decision; needs new media (open).
P2 Touch cards hide description — fixed: one-line caption always visible.
P2 Empty search dead end — fixed: searches prompts/gets/variations, clickable suggestions, custom clear.
P2 Templated chat copy, prefix in edit box, repeated steps — fixed.
P3 Titles generic, not-found bare, link row wraps, copy button squeezed, FAQ line length — fixed.
Open: href="#" nav/footer links, single-product media.
