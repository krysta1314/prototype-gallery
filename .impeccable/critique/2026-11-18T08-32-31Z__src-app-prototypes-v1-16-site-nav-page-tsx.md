---
target: site header + footer
total_score: 23
p0_count: 0
p1_count: 1
timestamp: 2026-11-18T08-32-31Z
slug: src-app-prototypes-v1-16-site-nav-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser)
Target: site header + footer (src/app/prototypes/(v1.16)/site-nav) — Nielsen 23/40
AI slop: half. Header is restrained, but every group title is 11px uppercase tracked #9a9aab (2.77:1); panels centred under the whole bar with widths jumping 310px→full; AI Models list has names only; Templates and Solutions overlap (by platform / ad type). Footer = 23 uppercase columns, 151 links — sitemap wall, 23 accordions on mobile (~1100px).
Detector: low-contrast 19 (mega labels), nested-cards + thin-border-wide-shadow on mega panels, gradient-text on demo hero; footer itself 0 hits; mobile no overflow.
Priority issues:
[P1] Logged-in app carries the full marketing mega-nav plus SEO footer beside the sidebar — two parallel navs. (distill)
[P2] Footer link wall — regroup to 6 groups with sub-headings, links stay in DOM; definition line as the visual anchor. (layout)
[P2] Mega-menu positioning/info — one consistent panel geometry; vendor + strength per model; de-duplicate Templates vs Solutions. (clarify, layout)
[P2] Low-contrast group labels. (polish)
