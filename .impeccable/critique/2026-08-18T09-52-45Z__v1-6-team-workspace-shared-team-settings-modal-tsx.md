---
target: 团队设置弹窗 vs OpenAI admin console 参考
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-08-18T09-52-45Z
slug: v1-6-team-workspace-shared-team-settings-modal-tsx
---
⚠️ DEGRADED: single-context (session policy: sub-agents only on explicit request)

Target: `src/app/prototypes/(v1.6)/team-workspace/_shared/team-settings-modal.tsx` (+ `account-settings-modal.tsx`), compared against the two OpenAI admin-console reference screenshots.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Progress bars, toasts and the new create-team loading are solid; but nothing tells you *where you are* outside the modal — no URL, no title change |
| 2 | Match System / Real World | 3 | Credits / seats / plan language is close to how buyers talk; `Credits and Usage` vs `Credits Top-up` are two same-family tabs that read as duplicates |
| 3 | User Control and Freedom | 2 | No deep link, browser Back leaves the whole app, and sub-tasks (limit editor, change plan, invite) stack modals **on top of** the settings modal (z-80 under z-95) |
| 4 | Consistency and Standards | 3 | Component vocabulary is now unified (avatars, badges, sidebars); `Plans and Billing` breaks density consistency by holding four unrelated jobs |
| 5 | Error Prevention | 3 | Delete-team requires cancelling the plan + typing the name; over-seat invites blocked; Free teams gated before invite |
| 6 | Recognition Rather Than Recall | 3 | The new permissions matrix removed the biggest recall tax; money is still invisible on the team side (credits only, no cost) |
| 7 | Flexibility and Efficiency | 2 | No keyboard path between tabs, no search, no deep link, no export, no bulk actions (set limits / remove for many members) |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and calm; at 1440px the form tabs leave ~200px dead margin on both sides — the shell grew, the layout didn't |
| 9 | Error Recovery | 2 | Removing a member and revoking an invite are one-click and irreversible; toasts carry no Undo |
| 10 | Help and Documentation | 2 | Good inline explanations, and the permissions matrix now doubles as help; zero links to docs anywhere |
| **Total** | | **26/40** | **Competent, structurally capped** |

## Anti-Patterns Verdict

**LLM assessment**: This does not read as AI-generated. It reads as a competent product surface that outgrew its container. No gradient text, no eyebrow scaffolding, no identical-card grids, no decorative glass. Cards are used where cards are right. The one tell is dimensional: a 1440×960 shell wrapped around content that was laid out for ~1000px, so three tabs scroll internally while two others float in whitespace.

**Deterministic scan**: `detect.mjs` over the two settings modals plus the identity menu returned `[]` — zero findings, exit 0. Clean.

**Visual overlays**: not injected. Browser inspection was done through the live prototype (measurements below), not through the overlay script, so no user-visible overlay is available.

Measured evidence (1812×1290 viewport, live modal):

| Tab | Content height | Viewport | Scrolls internally |
|---|---|---|---|
| Team Details | 889 | 889 | no |
| Team Members | 1078 | 889 | **yes** |
| Roles and Permissions | 1252 | 889 | **yes** |
| Credits and Usage | 1082 | 889 | **yes** |
| Credits Top-up | 889 | 889 | no |
| Plans and Billing | 880 | 880 | no |
| Activity Log | 889 | 889 | no |

Three of seven tabs already overflow the tallest modal that fits a 1290px screen — before any of the analytics work lands.

## Overall Impression

The boss's references aren't saying "our visual design is wrong". They're saying **settings shouldn't be a modal**. Both screenshots are the same architectural claim: an admin surface with its own route, grouped left nav, in-page sub-tabs, and analytics as a first-class section with a time-range control. Our surface has the right content and (now) the right component vocabulary, but it lives in a dialog — and a dialog is the wrong container for a place people *stay in* to read numbers, compare members and export.

The single biggest opportunity: promote the admin surface to a route, keep modals for single-purpose tasks. That one move fixes deep links, Back, stacked modals, vertical space and the analytics ceiling at once.

## What's Working

1. **The permissions matrix is genuinely good** — grouped capabilities, current role column highlighted, and the copy states the two hard decisions (Billing Admin is billing-only; seats have no tiers). It's both feature and documentation, and it's the reference's `Permissions & roles` item done well.
2. **Progressive gating reads as a real product.** Free team → `Upgrade to invite` + seats card copy that says the right thing (`Free includes one seat…`) instead of a generic "seats full". This is better than the reference, which just shows `42/42 seats in use`.
3. **State discipline.** Every panel has an honest empty/blocked/alert state (80% warn, 100% blocked, auto-top-up paused, expired invites). Most prototypes fake this; these are wired to one source of truth.

## Priority Issues

**[P1] Settings is a modal, not a route**
- **Why it matters**: no shareable URL for "look at Kenji's usage"; browser Back exits the app instead of the panel; sub-tasks stack a second modal over the first; height is hard-capped so tables show ~6 rows. Your own review index proves the cost — all 20+ links in `team-review/features.ts` point at `…/home?role=…` because **no settings tab can be addressed by URL**.
- **Fix**: add `/prototypes/team-workspace/settings` with the tab in the path (`/settings/members`), reuse the existing tab components verbatim, keep the modal only for quick tasks (rename, set one limit, invite, buy credits). Then make the review links point into the real tabs.
- **Suggested command**: `/impeccable shape team settings as a route`

**[P1] Credits and Usage has no time dimension**
- **Why it matters**: this is the actual content of the boss's second screenshot — stacked area chart, `Last 30 days` selector, per-source breakdown, `Updated …UTC`. Ours is a single-cycle snapshot: two progress bars and a per-member ranking. You can't answer "did usage spike last week and why", which is the first question any Owner asks before paying more.
- **Fix**: time-range control (7 / 30 days, this cycle, custom) + stacked area chart by model and by member + last-updated stamp. `org-members` already has 28-day sparkline and by-department bar code to lift — this is assembly, not invention.
- **Suggested command**: `/impeccable craft team usage analytics`

**[P2] `Plans and Billing` carries four jobs in one scroll**
- **Why it matters**: plan card + seats + payment method + auto top-up + invoice history in one column. The reference splits exactly this into in-page tabs (`Plan | Invoices | Settings`) — that's the pattern to copy.
- **Fix**: sub-tabs `Plan · Invoices · Payment & auto top-up`. Also collapses the `Credits Top-up` / `Credits and Usage` confusion, since top-up belongs under billing.
- **Suggested command**: `/impeccable layout the billing tab`

**[P2] No Undo on destructive member actions**
- **Why it matters**: `Remove from team` and `Revoke` are single clicks with a toast, and removing a member currently says nothing about what happens to their projects and assets. Owners will hesitate — or worse, not hesitate.
- **Fix**: toast with a 5-second `Undo` for remove/revoke, and a line in the confirm step stating where their work goes (stays with the team vs leaves with them). Decide that rule; it's a product gap, not just UI.
- **Suggested command**: `/impeccable harden member management`

**[P2] The shell grew, the layout didn't**
- **Why it matters**: form tabs render a 760px column centred in 1160px, so `Team Details` reads like a small form lost in a large room, while the members table is cramped enough to scroll. Dimensions are doing nothing for either.
- **Fix**: two-column form pages (fields left, contextual summary right — plan, seats, next bill) so width earns its keep; tables take full width with sticky headers.
- **Suggested command**: `/impeccable layout the settings shell`

**[P3] Seven flat nav items should be grouped**
- **Why it matters**: the reference groups ~15 items; at seven we're at the edge where scanning starts costing. `Workspace / People / Usage / Billing` is the natural grouping and it survives the next four items (SSO, notifications, audit export, project tags).
- **Suggested command**: `/impeccable layout the settings nav`

## Persona Red Flags

**Alex (Power User — Owner of a 10-person team)**: wants to send a teammate "here's our usage" → no URL exists, so he screenshots it. Wants to set a 3,000 limit for five new hires → five separate modals, no multi-select. Wants to move between tabs from the keyboard → no shortcut, and Tab walks the whole nav list first. Wants last month vs this month → the surface has no time control at all.

**Jordan (First-Timer — just created a team)**: lands in settings and sees seven tabs, four of which are money. The Free-state gate (`Upgrade to invite`) correctly stops him at the right place, and the permissions matrix now answers "what can an Admin do" — both of those hold. He then clicks `Remove from team` on a mis-invited colleague and gets no confirmation of where their work went.

**评审同事 / reviewer (project-specific persona, from `team-review`)**: needs to open a specific state to check one rule during review. Every link in `features.ts` lands on `/home` with demo params, then requires 3 manual clicks to reach the tab being reviewed. The modal architecture is directly taxing your own review workflow.

## Minor Observations

- `aria-current="page"` is correctly set on the active nav item — good; keep it when moving to routes.
- Mobile falls back to a drawer with the same body, so the three overflowing tabs are worse on a phone.
- `Credits and Usage` shows credits only. `org-members` shows real currency cost. Two口径 for the same question is a future review finding.
- Sub-modals inherit the parent's blur backdrop, so opening `Change plan` stacks two blurs — visually muddy.
- `ROLE_BLURB` in `data.ts` is still dead data now that the matrix exists; either use it as the matrix's row-1 summary or delete it.

## Questions to Consider

- If settings were a route, would `Credits and Usage` still be "a settings tab" — or is it actually a **product page** (like Assets) that Owners visit weekly, and billing is the only thing that belongs in settings?
- The boss's reference has `Workspace analytics` as a top-level nav item, not a billing sub-page. What changes about our IA if usage analytics is a peer of Home / Canvas / Assets rather than something buried behind an avatar menu?
- What's the confident version of `Team Details`? Right now it's a rename field, one toggle and a danger zone — three unrelated things. Would it be better dissolved into the other tabs and removed entirely?
