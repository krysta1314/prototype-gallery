# compare/ research notes (2026-11-23)
- vendors.ts: verified 2026-11-19 from official sites by previous attempt; reused.
- TopView page (uat-app.buzzvideo.ai/compare/topview) structure: hero -> editorial disclosure -> How to choose -> Quick comparison table (URL start / entry plan / watermark+export / wider model access / free plan; "Not confirmed") -> tool-by-tool (Good fit if / strengths / Check before you buy / sources) -> What X offers & what to check -> case studies -> How we checked -> FAQ -> Sources & last update -> CTA. Tone: hedged, credits rivals.

## Re-check 2026-11-23 (official pages via WebFetch)
- creatify.ai/pricing: Free 10 cr, Standard $15 / $10 yr (55 cr), Pro $55/$38 (280 cr, 1,500 actors, 3 custom avatars), free = 2 video ads or 20 image ads, 300 actors, watermark on free. FAQ: you own creatives, use in any channel. OK = vendors.ts.
- heygen.com/pricing: Free 3 videos/mo, 1 min, watermark, 500+ presenters; Creator $29 / $24 yr (FAQ), 600 cr, 1080p, branding removed, 30 min; Pro $49 4K. OK.
- synthesia.io/pricing: Basic free 10 min, 9 avatars, watermark; Starter $19/mo ($9 first month promo) or $14/mo yearly; 125+ avatars. BF promo Nov 23–Dec 7.
- makeugc.ai/pricing: Starter $59 / $29.50 yr (BFCM), 500 cr, 480p/720p, 300+ actors; Growth $79 HD-4K 500+ actors; Pro $149 1,000+ actors, API/MCP. "Start now for $1". Rollover not stated on page now.
- pippit.ai/pricing: shows yearly-only prices with odd figures (USD101 vs 168 "original") -> price DROPPED, keep "free plan, daily credits, no card".
- arcads help: no $ prices public; Starter 8,000 cr..; trial 72h 1,000 cr, card, auto Starter; rollover on Pro+. Seedance 2.5 5s = 210 cr (720p).
- higgsfield blog (Oct 24 2026): Starter $15/mo 200 cr, Plus $49, Ultra $129; paid = commercial use; free plan has no monthly credits (homepage says daily free credits -> conflict, show both/hedge).
- runway.com/pricing: Free 125 one-time; Standard $12/mo yearly (list $15), 625 cr; Pro $28 yearly ($35); Gen-4.5, Kling 4.0, Nano Banana Pro on Standard; Seedance 2.5 Pro+.
- elevenlabs.io/pricing: Free 10k cr ~10 min no commercial license; Starter $6 ($1 first mo) / $5 yr; commercial license + music commercial use on Starter.
- suno.com/pricing: Free 50 cr/day no downloads no commercial; Pro $8 ($96/yr) 2,500 cr 20 downloads; Premier $24.
- photoroom.com/pricing: $ amounts not rendered -> DROP $; Pro 8,000 cr 1,000 exports; Max 25,000 cr, video for ads. Help: Free non-commercial.
- sync.so/pricing: Hobbyist $5 + $0.05/s watermark 1 min; Creator $19 + $0.05/s, 5 min, no watermark.

## Build progress
- content.ts written (7 alternatives + 9 best-of). Next: templates, registry.tsx, meta.ts, checks.
- BuzzVideo dubbing / video translator = coming soon (tools/content/video.ts).
- DONE 2026-11-23: CompareTemplates.tsx, registry.tsx, meta.ts. tsc clean, eslint clean, SSR render of all 16 pages OK (1 H1 each). Not yet wired into pages-registry / pages-meta (caller does it).
