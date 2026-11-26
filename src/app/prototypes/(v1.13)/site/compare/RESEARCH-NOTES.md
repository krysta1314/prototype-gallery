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

## New vendors 2026-11-26 (official pages via WebFetch)
- invideo.io/pricing: no free plan listed. Starter $10/seat/mo yearly ($120/yr, "50% off", struck-through $20 monthly), 400 cr/seat, up to 5 editors, 100 premium stock; Plus $24/seat/mo yearly ($288, 60% off, list $60), 2,000 cr, 10 free guest seats; Max $1,500 upfront for 2 yrs then $3,000/yr (list $250/mo), 8,000 cr. Black Friday "up to 75% off", "pay 12 get 24". Seedance 2.5 (720p/1080p/Draft) NOT on Starter (Plus+); page contradicts itself on Seedance 2.0 Fast/Mini for Starter. Credits don't roll over; credit costs may change without notice. Not on page: watermark, export resolution, commercial-use terms.
- invideo.io homepage: "The agentic video editor for serious creatives"; models Seedance 2.5/2.0, MiniMax H3, Gemini Omni Flash, Kling 4.0, Wan 3.0, Pixverse (+ Veo, not written); images GPT Image 2.5, Nano Banana Pro, Seedream, Flux 2…; iOS + Android app links. API not mentioned (MCP page linked).
- invideo.io/make/ai-avatar-generator: AI twin / custom avatars "in 50+ languages"; stock avatar count not stated (a blog says 175+ languages -> not used).
- help.invideo.io "Is invideo Editor free…": timeline edits free; generation, transcripts, paid stock use credits. FAQ: editor exports free, no watermark. Free-plan credit allowance -> Not confirmed (third-party/blog figures conflict).
- invideo commercial use -> Not confirmed (rights help article 404).
- openart.ai/pricing: Starter $14 mo / $11 yr, 4,000 cr; Plus $34/$24, 12,000 cr; Pro $56/$36, 24,000 cr; Wonder $240/$144, 106,000 cr. Page JSON-LD shows different annual prices ($13/$27/$44/$175) -> used visible prices. All paid plans watermark-free; commercial use Plus+ only; 100+ models all plans; Director + OpenArt MCP all plans; credits don't roll over; BF "up to 40% off annual", discount first billing period only, renews at list.
- openart.ai homepage + blog "What is OpenArt?" (Nov 13 2026): 40 free credits, no card; free trial + Starter non-commercial; Director multi-scene up to 5 min (Short Film, Music Video, UGC Ads); Characters; Video Upscale to 4K; MCP & CLI (Claude, ChatGPT, Cursor); desktop app + After Effects plugin; no public API, no mobile app mentioned.
- OpenArt free-credit watermark -> pages conflict (some say watermarked, some say watermark-free) -> written as "pages disagree". Native canvas / node editor -> Not confirmed (only community ComfyUI workflows), not written.
- Pages built: buzzvideo-vs-invideo (BuzzVideo, invideo, Pippit, Creatify, HeyGen, Higgsfield), buzzvideo-vs-openart (BuzzVideo, OpenArt, Higgsfield, Runway, Kling AI, Luma).
