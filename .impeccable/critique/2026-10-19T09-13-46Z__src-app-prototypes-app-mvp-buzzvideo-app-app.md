---
target: BuzzVideo APP 原型全部界面
total_score: 27
p0_count: 0
p1_count: 3
timestamp: 2026-10-19T09-13-46Z
slug: src-app-prototypes-app-mvp-buzzvideo-app-app
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score: 27/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Purchase success has no explicit confirmation, only badge shimmer on Me |
| 2 | Match with real world | 2 | Agent/Image/Video/Audio + model names are jargon for SMB owners; paywall leads with credits |
| 3 | User control | 2 | Paywall close hidden 3s even when prices fail; post-purchase reset loses the draft |
| 4 | Consistency | 3 | Photo permission alert lays 3 buttons horizontally (iOS stacks); bare back chevrons |
| 5 | Error prevention | 3 | Good: blocked sends keep draft, no charge |
| 6 | Recognition vs recall | 3 | Session actions only via long-press |
| 7 | Flexibility | 3 | Ideas carousel, quick tiles |
| 8 | Minimalist | 3 | Me stacks many same-weight cards + 2 chip rows |
| 9 | Error recovery | 2 | Offline: send stays enabled, toast only; prices-failed lone Retry |
| 10 | Help | 3 | Footnotes fine |

## Priority issues
- [P1] "Save 30%" hard-coded; Starter is 26%, Pro 29%, Ultra 29% (Paywall.tsx:58)
- [P1] Paywall close delay 3s applies even when prices failed (Paywall.tsx:19)
- [P1] Paywall shows no context per trigger (video_locked / low_credits / first_login identical)
- [P2] Offline: send button stays enabled orange (InputBar.tsx)
- [P2] Touch targets < 44pt without hitSlop: Pill 36pt (Me filters, Inspire categories), mode pill 36, credits pill 32, send 36, IconButton 36
- [P2] Jargon at entry points (Agent mode default, model names)
- [P2] Photo permission alert horizontal 3 buttons; attach sheet last row under home indicator
- Conflicts with decided product rules (need PM call): post-purchase return to Me; ATT before login; 3s close delay on first_login; push mid-render

## Detector
CLI clean (RN StyleSheet not scanned). Browser: in-phone flags all false positives (gradient sibling, covered home widgets, iOS system replicas). Contrast in phone passes (sub 6.3:1); only decorative faint dot 2.97:1.
