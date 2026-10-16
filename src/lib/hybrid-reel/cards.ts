/* 字卡样式库(spec 2.6):和字幕样式分开的一套。字卡偏海报感(底板、描边、斜切),字幕讲究好读不抢戏。
   这里只放 id 和给模型看的说明,服务端排方案时按 id 挑;渲染在 canvas/cards.tsx。 */

export const CARD_STYLES: { id: string; name: string; fit: string }[] = [
  /* 2026-09-29 Monica 定的:按投放素材里的热门程度只留 16 套(长得像的、小众的去掉,之后又去掉了 Notification、Search bar;旧工程里存的见 LEGACY_CARD_STYLE)。
     2026-10-16 Monica 定的顺序:仿原生 / UGC → 卖点 Block → 花哨的(Beast pop、Sticker、IG Strong、Editorial、花字、Neon)→ 小标签与行动号召(Tag、Chat bubble、Button、Link in bio);剪辑器的样式网格和 /prototypes/text-styles 都按这个顺序 */
  { id: "tiktok-box", name: "TikTok box", fit: "TikTok's native white box, each line boxed — the most native-looking hook, looks organic not like an ad" },
  { id: "tiktok-outline", name: "TikTok outline", fit: "TikTok's plain white text with a thin black outline — organic UGC captions like '3 weeks later…'" },
  { id: "hormozi", name: "Hormozi bold", fit: "condensed caps with a thick outline, 1–4 words, wrap ONE keyword in *asterisks* to turn it yellow — punchy hooks" },
  { id: "comment-reply", name: "Comment reply", fit: "TikTok 'reply to comment' bubble — open on a viewer's question or objection, then answer it" },
  { id: "pov", name: "POV hook", fit: "'POV:' prefix in bold then the scenario — relatable UGC openers; write the text without the 'POV:' prefix" },
  { id: "block", name: "Block", fit: "solid accent-colour plate behind bold text — selling points, action cues" },
  { id: "beast-pop", name: "Beast pop", fit: "chunky rounded comic caps, yellow with a thick black outline, slightly tilted — high-energy, exciting reveals" },
  { id: "sticker", name: "Sticker", fit: "tilted sticker with a drop shadow — offers, discounts, 'new'" },
  { id: "ig-strong", name: "IG Strong", fit: "heavy italic condensed caps on a red block — bold claims, 'stop doing X'" },
  { id: "editorial", name: "Editorial", fit: "elegant serif, no plate — premium taglines, beauty and fashion" },
  { id: "huazi", name: "Variety 花字", fit: "variety-show title: gradient yellow-orange fill, white and red double outline, tilted — exclamations, Chinese e-commerce energy" },
  { id: "neon", name: "Neon", fit: "white text with a pink neon glow — night, party, trendy moods" },
  { id: "tag", name: "Tag", fit: "small white rounded pill with dark text — several selling points stacked one after another" },
  { id: "imessage", name: "Chat bubble", fit: "grey iMessage-style bubble — 'my friend asked me…' hooks, a question someone would text" },
  { id: "button", name: "Button", fit: "pill button with an arrow — calls to action" },
  { id: "link-in-bio", name: "Link in bio", fit: "native white label with a link icon — end card pointing to the profile link" },
];

/** 去掉的样式 → 最接近的保留样式(旧工程、旧方案里存的 id) */
export const LEGACY_CARD_STYLE: Record<string, string> = {
  slash: "ig-strong",
  stat: "hormozi",
  poster: "hormozi",
  "wait-for-it": "tiktok-box",
  "ig-elegant": "editorial",
  glass: "block",
  "ig-modern": "tiktok-outline",
  "ig-typewriter": "tiktok-box",
  "ig-directional": "ig-strong",
  splice: "beast-pop",
  glitch: "neon",
  tape: "tag",
  notification: "tiktok-box",
  "search-bar": "tiktok-box",
};

export const CARD_STYLE_IDS = new Set(CARD_STYLES.map((s) => s.id));

/** 剪辑器里字卡的默认样式「None」:不加底板、描边和特效的白色粗体字。只在剪辑器里选,不交给模型排方案(CARD_STYLES 里没有它) */
export const CARD_STYLE_NONE = "none";

export const cardStyleId = (id: string) => (id === CARD_STYLE_NONE ? id : LEGACY_CARD_STYLE[id] ?? (CARD_STYLE_IDS.has(id) ? id : "block"));

/** 字卡进场时可以绑的音效(转场本期不做,所以不给 whoosh / riser) */
export const CARD_SFX = ["pop", "ding", "click", "sparkle", "shutter", "boom"] as const;
