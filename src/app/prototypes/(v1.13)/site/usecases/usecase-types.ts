// 用例 / 广告模板落地页的数据结构(2026-11-19,v1.13 第 3 批)。纯数据，不引 React(meta.ts 在服务端用)。
// 「模板」= 现成的提示词配方(带 [占位]),复制进对应工具就能用;产品里没有单独的模板库功能，页面上也不这么说。

/** 页面用到的真实成片(全部来自 oa/pool 的 picsOf:MCP Skill 示例片 + 模型页样片),值 = src 结尾，用来精确挑图 */
export const MEDIA = {
  linkToAd: "tools/link-to-ad.mp4",
  ugcReview: "tools/ugc-product-review.mp4",
  unboxing: "tools/unboxing-ugc.mp4",
  productAd: "tools/product-ad.mp4",
  talkingProduct: "tools/talking-product.mp4",
  product3d: "tools/3d-product-video.mp4",
  runner: "346130838481592320.mp4",
  comicPoster: "342955906843074560.mp4",
  parcelUnbox: "346122865675919360.mp4",
  bedCreator: "346121909483659264.mp4",
  skincareSelfie: "341503959111884800.mp4",
  coffeeSpill: "341459635628204032.mp4",
  keyboardUnbox: "341502600350326784.mp4",
  sprinter: "324746276853833728.mp4",
  yuzu: "340757510384312320.png",
  perfumePoster: "324792860815712256.png",
  grilledCheese: "338151977366118400.png",
  glassesPortrait: "331328468790861824.png",
  serumFlatlay: "sunburst_flatlay.jpg",
  serumCandid: "sunburst_candid.jpg",
  cardigan: "gpt-image-2-5-sunburst/flatlay.jpg",
  canRooftop: "can_master.jpg",
  sunscreenBeach: "grok-imagine-2-0/beach.jpg",
  sunscreenStory: "grok-imagine-2-0/story.jpg",
  sunscreenColour: "grok-imagine-2-0/colour.jpg",
  sunscreenBanner: "grok-imagine-2-0/banner.jpg",
  giftMacro: "key_macro.jpg",
  giftWindow: "key_wide2.jpg",
  giant: "nano-banana-2-1/giant.jpg",
  serumPortrait: "nano-banana-2-1/portrait.jpg",
  glowStatic: "nano-banana-2-1/static.jpg",
  coldbrewStatic: "s45_static.jpg",
  coldbrewHowto: "s45_infographic.jpg",
  coldbrewCreator: "pro_creator.jpg",
  coldbrewInfographic: "pro_infographic.jpg",
  candleXmas: "wan30_test_5s.mp4",
  candleUgc: "wan30_candle_ugc_15s.mp4",
  candleTake: "wan30_candle_30s_take.mp4",
  h3Serum: "h3_final_web.mp4",
  lipstick: "328742133781553152.mp4",
} as const;
export type MediaKey = keyof typeof MEDIA;

export type UseCaseKind = "template" | "solution";

export type UseCaseRecipe = {
  /** 模板名(卡片标题) */
  name: string;
  /** 适合什么时候用，一句 */
  bestFor: string;
  /** 提示词，[占位] 让用户换成自己的 */
  prompt: string;
};

export type UseCase = {
  slug: string;
  kind: UseCaseKind;
  /** 导航里的名字 */
  name: string;
  /** 首屏小标签 */
  chip: string;
  h1: string;
  /** 首屏两句话：先下定义(含 BuzzVideo),40–60 词，不写价格 */
  lead: string;
  /** CTA「Create now」进哪个工具(一级网址，appOf 认) */
  tool: string;
  toolName: string;
  /** 步骤卡里展示的默认模型 slug */
  model: string;
  /** 首屏提示词(可编辑，带 [占位]) */
  prompt: string;
  hero: MediaKey[];
  /** 「能做什么」段 */
  makeTitle: string;
  makeSub: string;
  makes: { title: string; body: string; pic: MediaKey }[];
  /** 模板(提示词配方)段 */
  recipesTitle: string;
  recipesSub: string;
  recipes: UseCaseRecipe[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  /** 只放核实过的规格(如 9:16) */
  specs?: { title: string; sub: string; rows: { label: string; value: string }[] };
  definition: { q: string; a: string };
  faq: { q: string; a: string }[];
  /** 相关页面(导航里的一级网址) */
  related: string[];
  blogTopic: "ads" | "video" | "image" | "audio" | "design";
  ctaTitle: string;
  metaTitle: string;
  metaDescription: string;
  /** 模板总页：列出这些模板页 */
  hub?: { title: string; sub: string; groups: { title: string; slugs: string[] }[] };
};
