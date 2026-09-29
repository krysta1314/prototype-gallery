/* 字卡样式库(spec 2.6):和字幕样式分开的一套。字卡偏海报感(底板、描边、斜切),字幕讲究好读不抢戏。
   这里只放 id 和给模型看的说明,服务端排方案时按 id 挑;渲染在 canvas/cards.tsx。 */

export const CARD_STYLES: { id: string; name: string; fit: string }[] = [
  /* 2026-09-29 Monica 从字卡评审页(/prototypes/text-styles)挑定的 28 套:原有 7 套 + 调研候选 21 套。Slash、Stat 去掉了(旧工程见 LEGACY_CARD_STYLE) */
  { id: "poster", name: "Poster", fit: "huge condensed caps, white with a heavy outline — scroll-stopping hook titles" },
  { id: "block", name: "Block", fit: "solid accent-colour plate behind bold text — selling points, action cues" },
  { id: "tag", name: "Tag", fit: "small white rounded pill with dark text — several selling points stacked one after another" },
  { id: "sticker", name: "Sticker", fit: "tilted sticker with a drop shadow — offers, discounts, 'new'" },
  { id: "button", name: "Button", fit: "pill button with an arrow — calls to action" },
  { id: "editorial", name: "Editorial", fit: "elegant serif, no plate — premium taglines, beauty and fashion" },
  { id: "glass", name: "Glass", fit: "frosted translucent panel — calm, clean, tech or skincare" },
  { id: "tiktok-box", name: "TikTok box", fit: "TikTok's native white box, each line boxed — the most native-looking hook, looks organic not like an ad" },
  { id: "tiktok-outline", name: "TikTok outline", fit: "TikTok's plain white text with a thin black outline — organic UGC captions like '3 weeks later…'" },
  { id: "ig-modern", name: "IG Modern", fit: "wide tracked caps like Instagram Modern — lifestyle and brand titles" },
  { id: "ig-strong", name: "IG Strong", fit: "heavy italic condensed caps on a red block — bold claims, 'stop doing X'" },
  { id: "ig-directional", name: "IG Directional", fit: "tilted all-caps line with a hard shadow — travel, sport, energetic moments" },
  { id: "ig-typewriter", name: "Typewriter", fit: "lowercase typewriter mono on a white strip — diary-style, deadpan UGC notes like 'day 1.'" },
  { id: "ig-elegant", name: "Elegant", fit: "high-contrast Didone caps, wide tracking — luxury and beauty titles" },
  { id: "comment-reply", name: "Comment reply", fit: "TikTok 'reply to comment' bubble — open on a viewer's question or objection, then answer it" },
  { id: "imessage", name: "Chat bubble", fit: "grey iMessage-style bubble — 'my friend asked me…' hooks, a question someone would text" },
  { id: "notification", name: "Notification", fit: "phone push-notification card — urgency: shipped, price drop, restock, limited time" },
  { id: "search-bar", name: "Search bar", fit: "search box with the query typed in — the problem people search for, e.g. 'how to fix dry skin'" },
  { id: "hormozi", name: "Hormozi bold", fit: "condensed caps with a thick outline, 1–4 words, wrap ONE keyword in *asterisks* to turn it yellow — punchy hooks" },
  { id: "beast-pop", name: "Beast pop", fit: "chunky rounded comic caps, yellow with a thick black outline, slightly tilted — high-energy, exciting reveals" },
  { id: "pov", name: "POV hook", fit: "'POV:' prefix in bold then the scenario — relatable UGC openers; write the text without the 'POV:' prefix" },
  { id: "wait-for-it", name: "Wait for it", fit: "small native white label with an emoji — retention teaser before a reveal, e.g. 'Wait for the result 👀'" },
  { id: "huazi", name: "Variety 花字", fit: "variety-show title: gradient yellow-orange fill, white and red double outline, tilted — exclamations, Chinese e-commerce energy" },
  { id: "neon", name: "Neon", fit: "white text with a pink neon glow — night, party, trendy moods" },
  { id: "splice", name: "Splice", fit: "white heavy text with an offset accent outline copy — retro, playful titles" },
  { id: "glitch", name: "Glitch", fit: "caps with red / cyan RGB split — tech, gaming, 'next level' claims" },
  { id: "tape", name: "Tape label", fit: "washi-tape strip with typewriter text, tilted — aesthetic labels like 'Day 1 of 30'" },
  { id: "link-in-bio", name: "Link in bio", fit: "native white label with a link icon — end card pointing to the profile link" },
];

/** 去掉的样式 → 最接近的保留样式(旧工程、旧方案里存的 id) */
export const LEGACY_CARD_STYLE: Record<string, string> = { slash: "ig-strong", stat: "poster" };

export const CARD_STYLE_IDS = new Set(CARD_STYLES.map((s) => s.id));

export const cardStyleId = (id: string) => LEGACY_CARD_STYLE[id] ?? (CARD_STYLE_IDS.has(id) ? id : "block");

/** 字卡进场时可以绑的音效(转场本期不做,所以不给 whoosh / riser) */
export const CARD_SFX = ["pop", "ding", "click", "sparkle", "shutter", "boom"] as const;
