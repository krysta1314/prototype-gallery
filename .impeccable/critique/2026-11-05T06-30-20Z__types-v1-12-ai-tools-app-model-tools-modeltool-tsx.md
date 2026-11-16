---
target: 8 个模型加工类工具页
total_score: 23
p0_count: 0
p1_count: 4
timestamp: 2026-11-05T06-30-20Z
slug: types-v1-12-ai-tools-app-model-tools-modeltool-tsx
---
Method: dual-agent (A: design review · B: detector + browser evidence)

Target: 8 model processing tool pages (ai-tools/app/model-tools/ModelTool.tsx)
Score: 23/40 (Acceptable). P1 x4, P2 x3, P3 minor list.
P1: Insert Shot raw time inputs + 10 flat controls -> timeline range, prompt up, Advanced collapse.
P1: Result card replays input, no before/after -> input thumbnails, result title, Result/Input toggle, real result samples.
P1: Voice Clone form lacks consent, models unexplained -> model cards with difference + price, UploadDrop, switch rows, consent checkbox.
P1: Voice Clone result dead end -> rename, waveform, Use in Lip Sync (+ My voices in Lip Sync).
P2: Lip Sync order/choices -> ask what to say first, voice preview dropdown, speed stepper.
P2: Errors grey under CTA (2.73:1) -> inline field errors, hint #6a6b7b, drop sparkles icon.
P2: Remove x invisible on touch, 20px -> always visible on touch, 24px.
Report: docs/reviews/2026-11-05-tool-pages-ui/index.html
