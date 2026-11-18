// Design Studio 演示数据。品牌、示例贴文、Deck 页、Site 区块、资料夹都照 Notion 需求里的 HTML 示意原型
// (BusinessFocus 海军蓝 + 金 / GirlStyle 莓红 + 粉 / Client 森林绿 + 薄荷;[方括号] 是预留位置);
// Aurelia 是「从官网建 Brand Kit」演示用的虚构客户。

export type BrandColor = { name: string; hex: string; role: "primary" | "secondary" | "accent" | "text" | "background" };
export type BrandFont = { role: "heading" | "subheading" | "body"; family: string; weight: number; spec: string };
export type BrandKit = {
  id: string;
  name: string;
  /** 画面上的字标(HTML 里的 BUSINESSFOCUS) */
  word: string;
  initials: string;
  colors: BrandColor[];
  fonts: BrandFont[];
  voice: { tone: string; avoid: string[] };
  audience: string;
  sellingPoints: string[];
  source: "manual" | "url" | "agent" | "canva";
  sourceUrl?: string;
  /** 降级后超额的变只读 */
  readOnly?: boolean;
};

export type LayerKind = "image" | "text" | "shape" | "logo";
export type Layer = {
  id: string;
  kind: LayerKind;
  /** Layers 面板里显示的名字 */
  name?: string;
  /** 位置和尺寸都是画布宽高的百分比，Magic Resize 换比例时直接复用 */
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  /** 字号：画布宽度的百分比(cqw) */
  size?: number;
  weight?: number;
  color?: string;
  /** 文字底色(CTA 胶囊)或形状填色 */
  fill?: string;
  align?: "left" | "center" | "right";
  src?: string;
  radius?: number;
  /** 锁定:position = 只能换内容;all = 全锁 */
  lock?: "position" | "all";
  ai?: boolean;
  bgRemoved?: boolean;
  /** 混用了别的品牌的素材(Brand Check 演示) */
  foreignBrand?: string;
};

export type Page = { id: string; bg: string; layers: Layer[]; note?: string };
export type DesignType = "post" | "story" | "carousel" | "deck";
export type ApprovalStatus = "draft" | "in_review" | "approved" | "changes";
export type Design = {
  id: string;
  name: string;
  type: DesignType;
  brandId: string | null;
  folderId: string | null;
  /** 画布比例(宽 / 高) */
  ratio: number;
  /** Magic Resize 当前格式 */
  format: FormatKey;
  pages: Page[];
  version: number;
  approval: { status: ApprovalStatus; approvedVersion?: number; reviewer?: string };
  template?: string;
  edited: string;
};

export type Folder = { id: string; name: string; meta: string; brandId: string | null; team: boolean };

export const IMG = {
  speaker: "/prototypes/ai-tools/demo-after.png",
  model: "/prototypes/asset-library/images/img-01.jpg",
  serum: "/prototypes/mcp-skill-showcase/ref-product-ad.jpg",
  juice: "/prototypes/homepage/product-unboxing/juice.jpg",
  review: "/prototypes/mcp-skill-showcase/ref-ugc-product-review.jpg",
  promo: "/prototypes/mcp-skill-showcase/product-promo-video.jpg",
};

const fonts = (heading: string): BrandFont[] => [
  { role: "heading", family: heading, weight: 900, spec: `${heading} Black · 64 / 72` },
  { role: "subheading", family: "Inter", weight: 600, spec: "Inter SemiBold" },
  { role: "body", family: "Inter", weight: 500, spec: "Inter Medium · 28 / 40" },
];

export const BRAND_KITS: BrandKit[] = [
  {
    id: "bk_bf",
    name: "BusinessFocus",
    word: "BUSINESSFOCUS",
    initials: "BF",
    colors: [
      { name: "Navy", hex: "#12263A", role: "primary" },
      { name: "Gold", hex: "#E0A526", role: "accent" },
      { name: "Ivory", hex: "#F7F3EA", role: "background" },
      { name: "Slate", hex: "#5B6573", role: "secondary" },
    ],
    fonts: fonts("Noto Sans TC"),
    voice: { tone: "Confident, data-led, plain Cantonese-English", avoid: ["Clip-art", "neon colours", "stock handshake photos"] },
    audience: "Professionals and investors in Hong Kong",
    sellingPoints: ["Three sectors to watch", "Expert speakers", "Actionable takeaways"],
    source: "manual",
  },
  {
    id: "bk_gs",
    name: "GirlStyle",
    word: "GIRLSTYLE",
    initials: "GS",
    colors: [
      { name: "Berry", hex: "#7A1F3D", role: "primary" },
      { name: "Blush", hex: "#F4C9D6", role: "accent" },
      { name: "Shell", hex: "#FFF6F8", role: "background" },
      { name: "Ink", hex: "#2B2B2B", role: "secondary" },
    ],
    fonts: fonts("Noto Sans TC"),
    voice: { tone: "Playful, warm, like a friend who knows beauty", avoid: ["cheap", "anti-aging"] },
    audience: "Women 18–30 in Hong Kong and Taiwan",
    sellingPoints: ["Honest reviews", "Trend-first picks", "Local prices"],
    source: "manual",
  },
  {
    id: "bk_client",
    name: "Client: [BRAND]",
    word: "[CLIENT]",
    initials: "CL",
    colors: [
      { name: "Forest", hex: "#1F3B2C", role: "primary" },
      { name: "Mint", hex: "#9BD3AE", role: "accent" },
      { name: "Mist", hex: "#F2F7F3", role: "background" },
      { name: "Stone", hex: "#6B7570", role: "secondary" },
    ],
    fonts: fonts("Noto Sans TC"),
    voice: { tone: "[CLIENT TONE OF VOICE]", avoid: ["[WORDS TO AVOID]"] },
    audience: "[CLIENT AUDIENCE]",
    sellingPoints: ["[SELLING POINT 1]", "[SELLING POINT 2]"],
    source: "manual",
  },
];

/** From website 抽取演示用的结果(Aurelia Skin Rituals,虚构客户) */
export const EXTRACTED_KIT: BrandKit = {
  id: "bk_aurelia",
  name: "Aurelia Skin Rituals",
  word: "AURELIA",
  initials: "AU",
  colors: [
    { name: "Gold", hex: "#B8893A", role: "primary" },
    { name: "Sage", hex: "#5C7C6B", role: "accent" },
    { name: "Cream", hex: "#FFFBF4", role: "background" },
    { name: "Sand", hex: "#E9DDC8", role: "secondary" },
  ],
  fonts: fonts("Cormorant Garamond"),
  voice: { tone: "Calm, luxurious, ritual-focused", avoid: ["miracle", "instant results"] },
  audience: "Women 28–45 who invest in premium skincare",
  sellingPoints: ["Radiant skin in 14 days", "Botanical gold complex", "Dermatologist tested"],
  source: "url",
  sourceUrl: "aurelia-skin.com",
};

/** 取品牌色;text 没单独定义时用 primary(HTML 里字色就是主色) */
export const color = (k: BrandKit | undefined, role: BrandColor["role"], fallback = "#1a1a2e") =>
  k?.colors.find((c) => c.role === role)?.hex ?? (role === "text" ? (k?.colors.find((c) => c.role === "primary")?.hex ?? fallback) : fallback);
export const fontOf = (k: BrandKit | undefined, role: BrandFont["role"]) => k?.fonts.find((f) => f.role === role);

let seq = 0;
export const uid = (p = "id") => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Magic Resize 的格式(照 HTML:IG post 1:1 / IG post 4:5 / Story 9:16 / FB link 1.91:1) */
export type FormatKey = "square" | "portrait" | "story" | "fb" | "deck";
export const FORMATS: { key: Exclude<FormatKey, "deck">; label: string; ratio: number; dims: string }[] = [
  { key: "square", label: "IG post 1:1", ratio: 1, dims: "1080 × 1080" },
  { key: "portrait", label: "IG post 4:5", ratio: 4 / 5, dims: "1080 × 1350" },
  { key: "story", label: "Story 9:16", ratio: 9 / 16, dims: "1080 × 1920" },
  { key: "fb", label: "FB link 1.91:1", ratio: 1.91, dims: "1200 × 628" },
];
export const formatRatio = (f: FormatKey) => (f === "deck" ? 16 / 9 : FORMATS.find((x) => x.key === f)!.ratio);
export const formatLabel = (f: FormatKey) => (f === "deck" ? "Presentation 16:9" : FORMATS.find((x) => x.key === f)!.label);

/** 平台 UI 遮挡区(上 / 下，画布高度百分比) */
export const SAFE_ZONE: Partial<Record<FormatKey, { top: number; bottom: number }>> = { story: { top: 12, bottom: 18 } };

/** HTML 里的示例贴文：字标 + Investment Talk、品牌色 hero(AI 人像去背景)、標題、CTA 胶囊、日期地点 */
export function talkPost(k: BrandKit | undefined, opts: { locked?: boolean; headline?: string; img?: string } = {}): Layer[] {
  const lock = opts.locked ? ("position" as const) : undefined;
  return [
    { id: uid("l"), kind: "logo", name: "Wordmark", x: 5, y: 4, w: 55, h: 5, lock: "all" },
    { id: uid("l"), kind: "text", name: "Event name", x: 60, y: 4.4, w: 35, h: 4, text: "Investment Talk", size: 2.5, weight: 600, color: color(k, "text"), align: "right", lock },
    (() => {
      /* 只有人像做去背景(HTML:AI image · background removed);产品 / 场景图直接铺满 */
      const src = opts.img ?? IMG.speaker;
      const portrait = src === IMG.speaker || src === IMG.model;
      return { id: uid("l"), kind: "image" as const, name: portrait ? "AI image (cut-out)" : "AI image", x: 5, y: 11, w: 90, h: 50, src, radius: 2.2, ai: true, bgRemoved: portrait, fill: color(k, "primary"), lock };
    })(),
    { id: uid("l"), kind: "text", name: "Headline", x: 5, y: 64, w: 90, h: 17, text: opts.headline ?? "2027 投資展望\n三個必看板塊", size: 6.7, weight: 900, color: color(k, "text"), lock },
    { id: uid("l"), kind: "text", name: "CTA pill", x: 5, y: 86, w: 30, h: 6.4, text: "Watch the talk", size: 2.7, weight: 700, color: color(k, "primary"), fill: color(k, "accent"), align: "center", lock },
    { id: uid("l"), kind: "text", name: "Date & venue", x: 55, y: 87.5, w: 40, h: 4, text: "[DATE] · [VENUE]", size: 2.5, weight: 500, color: color(k, "text"), align: "right", lock },
  ];
}

/** 换品牌时把图层上的品牌色一起换掉(HTML:右上角切品牌，全部画面跟着换色) */
export function recolor(layers: Layer[], from: BrandKit | undefined, to: BrandKit | undefined): Layer[] {
  if (!from || !to) return layers;
  const map = new Map(from.colors.map((c) => [c.hex.toLowerCase(), color(to, c.role)]));
  const sw = (h?: string) => (h ? (map.get(h.toLowerCase()) ?? h) : h);
  return layers.map((l) => ({ ...l, color: sw(l.color), fill: sw(l.fill) }));
}

export type Template = { id: string; name: string; tag: "Brand" | "IG post" | "Story" | "Imported from Canva"; format: Exclude<FormatKey, "deck">; locked: boolean; headline: string; img: string };
/** 模板(照 HTML Templates 面板:Headline layout / Quote card / Carousel cover / Event promo) */
export const TEMPLATES: Template[] = [
  { id: "t_headline", name: "Headline layout", tag: "Brand", format: "portrait", locked: true, headline: "2027 投資展望\n三個必看板塊", img: IMG.speaker },
  { id: "t_quote", name: "Quote card", tag: "IG post", format: "square", locked: false, headline: "“Cash flow\nbeats hype.”", img: IMG.review },
  { id: "t_carousel", name: "Carousel cover", tag: "IG post", format: "portrait", locked: true, headline: "5 charts\nto watch", img: IMG.promo },
  { id: "t_event", name: "Event promo", tag: "Story", format: "story", locked: false, headline: "Register\nnow", img: IMG.model },
  { id: "t_canva", name: "Townhall cover", tag: "Imported from Canva", format: "portrait", locked: false, headline: "Townhall\nQ4 2026", img: IMG.promo },
];

export const ASSETS: { id: string; src: string; label: string; ai: boolean }[] = [
  { id: "a1", src: IMG.speaker, label: "Image gen · 2h ago", ai: true },
  { id: "a2", src: IMG.model, label: "Image gen · 2h ago", ai: true },
  { id: "a3", src: IMG.promo, label: "Video frame · 1d", ai: true },
  { id: "a4", src: IMG.serum, label: "Upload · 3d", ai: false },
];

export const FOLDERS: Folder[] = [
  { id: "f_bf", name: "BusinessFocus", meta: "Brand kit · 42 designs", brandId: "bk_bf", team: true },
  { id: "f_gs", name: "GirlStyle", meta: "Brand kit · 37 designs", brandId: "bk_gs", team: true },
  { id: "f_pitch", name: "Client pitches", meta: "Decks · 12", brandId: null, team: true },
  { id: "f_sites", name: "Event sites", meta: "Sites · 4 live", brandId: null, team: true },
  { id: "f_canva", name: "Imported from Canva", meta: "Templates · 86", brandId: null, team: true },
  { id: "f_shared", name: "Shared with me", meta: "9 items", brandId: null, team: false },
];

export function designFromTemplate(t: Template, k: BrandKit | undefined, name?: string): Design {
  return {
    id: uid("ds"),
    name: name ?? `${t.name} · ${k?.name ?? "No brand"}`,
    type: t.format === "story" ? "story" : "post",
    brandId: k?.id ?? null,
    folderId: null,
    ratio: formatRatio(t.format),
    format: t.format,
    pages: [{ id: uid("p"), bg: color(k, "background", "#ffffff"), layers: talkPost(k, { locked: t.locked, headline: t.headline, img: t.img }) }],
    version: 1,
    approval: { status: "draft" },
    template: t.locked ? t.id : undefined,
    edited: "Just now",
  };
}

/** Deck 5 页(照 HTML slidesFor):首尾页主色底，中间页底色 */
export const DECK_SLIDES: [string, string][] = [
  ["Enterprise AI video, on brand", "One workspace for your team to generate, edit and publish ads, posts, decks and sites."],
  ["The problem today", "Five tools, re-uploaded logos, off-brand outputs and seats paid in every one of them."],
  ["BuzzVideo Studio", "Generation, Brand Kit and a Canva-style editor in one place, with admin controls and credit budgets."],
  ["How teams use it", "Prompt, polish in the Image Builder, resize for every channel, publish."],
  ["Plans and next step", "[PLAN DETAILS] · Book a demo with the PressLogic team."],
];

export function deckFromOutline(k: BrandKit | undefined, name: string, slides: [string, string][]): Design {
  return {
    id: uid("ds"),
    name,
    type: "deck",
    brandId: k?.id ?? null,
    folderId: null,
    ratio: 16 / 9,
    format: "deck",
    version: 1,
    approval: { status: "draft" },
    edited: "Just now",
    pages: slides.map(([title, body], i) => {
      const dark = i === 0 || i === slides.length - 1;
      const ink = dark ? color(k, "background", "#ffffff") : color(k, "primary");
      return {
        id: uid("p"),
        bg: dark ? color(k, "primary") : color(k, "background", "#ffffff"),
        note: `Talking points for “${title}”.`,
        layers: [
          { id: uid("l"), kind: "text", name: "Header", x: 6.5, y: 9, w: 60, h: 5, text: `${k?.word ?? "BRAND"} × BuzzVideo`, size: 1.6, weight: 800, color: ink },
          { id: uid("l"), kind: "text", name: "Page number", x: 74, y: 9, w: 19.5, h: 5, text: `${i + 1} / ${slides.length}`, size: 1.4, weight: 500, color: ink, align: "right" },
          { id: uid("l"), kind: "shape", name: "Accent bar", x: 6.5, y: 36, w: 6.5, h: 2, fill: color(k, "accent") },
          { id: uid("l"), kind: "text", name: "Title", x: 6.5, y: 42, w: 80, h: 14, text: title, size: 4.6, weight: 800, color: ink },
          { id: uid("l"), kind: "text", name: "Body", x: 6.5, y: 58, w: 66, h: 14, text: body, size: 1.9, weight: 500, color: ink },
          { id: uid("l"), kind: "text", name: "Hint", x: 6.5, y: 86, w: 60, h: 5, text: "Click any text to edit · images regenerate on brand", size: 1.4, weight: 500, color: ink },
        ],
      };
    }),
  };
}

export function initialDesigns(): Design[] {
  const [bf, gs] = BRAND_KITS;
  const post: Design = {
    ...designFromTemplate(TEMPLATES[0], bf, "2027 outlook · IG post"),
    folderId: "f_bf",
    edited: "2h ago",
  };
  const deck = { ...deckFromOutline(bf, "Enterprise sales deck", DECK_SLIDES), folderId: "f_pitch", edited: "Yesterday" };
  const story = { ...designFromTemplate({ ...TEMPLATES[3], locked: false }, gs, "Weekend picks · story"), folderId: "f_gs", edited: "2d ago" };
  const carousel = { ...designFromTemplate(TEMPLATES[2], bf, "Carousel cover"), folderId: "f_bf", edited: "4d ago" };
  return [post, deck, story, carousel];
}

/** Site 区块(照 HTML:Hero / Speakers / Agenda / Register form / Footer) */
export type SiteSection = { id: string; kind: "hero" | "speakers" | "agenda" | "form" | "footer"; title: string; body: string };
export const SITE_SECTIONS = (): SiteSection[] => [
  { id: uid("s"), kind: "hero", title: "2027 投資展望", body: "[ONE-LINE DESCRIPTION OF THE TALK]" },
  { id: uid("s"), kind: "speakers", title: "Speakers", body: "[SPEAKER] · [SPEAKER] · [SPEAKER]" },
  { id: uid("s"), kind: "agenda", title: "Agenda", body: "19:00 Welcome · 19:15 Outlook · 20:15 Q&A" },
  { id: uid("s"), kind: "form", title: "Register now", body: "Name · Email · Company" },
  { id: uid("s"), kind: "footer", title: "Footer", body: "© BusinessFocus · Privacy" },
];

export type Site = {
  id: string;
  name: string;
  brandId: string | null;
  slug: string;
  sections: SiteSection[];
  status: "draft" | "live";
  domain?: string;
  password?: boolean;
  noindex: boolean;
};

export const INITIAL_SITES: Site[] = [{ id: "st_talk", name: "Talk sign-up page", brandId: "bk_bf", slug: "bf-talk", sections: SITE_SECTIONS(), status: "live", noindex: false }];
