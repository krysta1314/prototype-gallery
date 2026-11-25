// 每个落地页自己的配图(2026-11-25 Monica:落地页配图不能都一样，走 AIGC 接口按页生成)。
// 模板会把这里的图排在首屏拼贴和示例区的最前面，不够再用同类素材池补。
// 图片在 public/prototypes/site/pages/<slug>/;提示词原样保留(作品墙悬停会展示)。模型页的图用该模型自己生成。
// 生成脚本和提示词清单:~/Desktop/官网素材工程/08-落地页配图/(gen.py + jobs*.json),接口 key 只从环境变量读，不进仓库。
import type { Pic } from "./oa/pool";
import { TOOL_ROWS } from "./tool-page-rows";
import { OTHER_MEDIA } from "./page-media-other";

const P = "/prototypes/site/pages";
const img = (slug: string, n: number, aspect: string, alt: string, prompt: string, model: string, modelSlug: string): Pic => ({ kind: "image", src: `${P}/${slug}/${n}.webp`, aspect, alt, prompt, source: "AIGC dev 接口 2026-11-25", model, modelSlug });

export const PAGE_MEDIA: Record<string, Pic[]> = {
  "ai-product-photography": [
    img("ai-product-photography", 1, "3:4", "A cream ceramic candle on a travertine block in warm sunlight", "Commercial product photograph: one matte cream ceramic candle jar with a plain unprinted surface and a single cotton wick, standing on a rough travertine block. Warm late-afternoon sunlight from the right casts a long soft shadow; a sprig of dried eucalyptus lies beside it. Warm beige plaster wall background, shallow depth of field, 85mm lens, crisp focus on the jar, generous empty space above the product.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("ai-product-photography", 2, "1:1", "The same candle floating above a splash of teal water", "Commercial product photograph: one matte cream ceramic candle jar with a plain unprinted surface and a single lit cotton wick, floating centered above rippling dark teal water with a clean splash frozen around its base. Dramatic studio rim light, deep teal gradient background, high-end fragrance campaign look, tack-sharp product, square composition with the jar in the middle.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("ai-product-photography", 3, "3:4", "A hand placing the candle on a linen bedside table", "Lifestyle product photograph: a woman's hand with natural short nails places one matte cream ceramic candle jar with a plain unprinted surface on a linen-covered bedside table next to an open paperback and a small glass of water. Soft morning window light, cozy neutral bedroom softly blurred behind, natural skin tone on the hand, 50mm lens, calm editorial mood. Only one hand visible, five fingers.", "Nano Banana 2.1", "nano-banana-2-1"),
  ],
  "ai-art-generator": [
    img("ai-art-generator", 1, "3:4", "Watercolor painting of a shiba inu by a cafe window", "Loose watercolor painting on textured cold-press paper: a shiba inu dog sitting on a wooden chair by a sunny cafe window, a cup of coffee on the small round table. Visible paper grain, soft bleeding washes of ochre, sage green and dusty blue, white paper left for highlights, light pencil underdrawing, hand-painted feel.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("ai-art-generator", 2, "1:1", "3D clay render of a shiba inu at a cafe table", "Stylized 3D clay render: a chubby shiba inu dog character sitting on a tiny wooden chair by a cafe window, a tiny coffee cup on a small round table. Soft matte clay material with subtle fingerprints, rounded shapes, pastel peach and mint palette, soft studio lighting, gentle contact shadows, plain pastel backdrop, toy-like charm.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("ai-art-generator", 3, "3:4", "Impasto oil painting of a shiba inu by a cafe window", "Thick impasto oil painting on canvas: a shiba inu dog sitting on a wooden chair by a cafe window at golden hour, a coffee cup on the small round table. Bold visible palette-knife strokes, rich burnt orange, deep teal and cream colors, strong warm light through the window, expressive post-impressionist style, canvas texture visible.", "Nano Banana 2.1", "nano-banana-2-1"),
  ],
  "flux-3-image": [
    img("flux-3-image", 1, "3:4", "Editorial portrait of a woman in a yellow blazer against a blue wall", "Photorealistic editorial portrait of a stylish young woman with freckles and a sleek low bun, wearing a butter-yellow oversized blazer, standing against a cobalt blue wall in hard midday sun. Natural skin texture, soft smile, confident gaze at camera, crisp shadow of a palm leaf on the wall, shot on medium format, fashion magazine look.", "FLUX 3 Image", "flux-3-image"),
    img("flux-3-image", 2, "1:1", "Off-white running sneakers on a glossy red surface", "Photorealistic studio product shot of a pair of chunky off-white running sneakers with plain unbranded panels, one shoe resting on the other, on a glossy tomato-red surface with a matching red background. Hard flash lighting, sharp reflections, bold colour-block advertising look, every stitch in focus.", "FLUX 3 Image", "flux-3-image"),
    img("flux-3-image", 3, "3:4", "A sunlit ceramics studio with shelves of handmade bowls", "Photorealistic interior photograph of a small sunlit ceramics studio: shelves of handmade bowls in cream and terracotta glazes, a potter's wheel with a half-formed vase, dust in a beam of window light, plants on the sill. Warm natural tones, wide 28mm lens, deep focus, calm documentary feel, no people.", "FLUX 3 Image", "flux-3-image"),
  ],
  "seedream-5-5": [
    img("seedream-5-5", 1, "3:4", "Beauty portrait of a woman holding a grapefruit slice", "Beauty campaign photograph of a young East Asian woman with glossy shoulder-length black hair and natural healthy skin, holding a slice of grapefruit near her cheek, playful half smile. Soft peach studio backdrop, clean diffused light, visible skin texture, minimal makeup with a coral lip, crisp focus on the eyes.", "Seedream 5.5", "seedream-5-5"),
    img("seedream-5-5", 2, "1:1", "Overhead photo of matcha tiramisu on a green tiled table", "Overhead food photograph of a matcha tiramisu in a square glass dish on a pale green tiled table, one slice lifted out on a small plate with a gold fork, a dusting of matcha powder, a cup of iced milk tea beside it. Bright soft daylight, pastel palette, clean cafe menu style, sharp detail on the layers.", "Seedream 5.5", "seedream-5-5"),
    img("seedream-5-5", 3, "3:4", "A cyclist in a red raincoat on a neon-lit street at dusk", "Cinematic street photograph at dusk: a cyclist in a bright red raincoat riding past a row of neon-lit noodle shops on a wet city street, reflections of pink and teal lights on the pavement, light rain, motion blur on the background while the rider stays sharp, 35mm film look. Shop signs are abstract glowing shapes with no readable characters.", "Seedream 5.5", "seedream-5-5"),
  ],
  "jewelry-ads": [
    img("jewelry-ads", 1, "3:4", "A gold chain necklace with a pearl pendant on a model", "Jewelry advertising photograph: close crop of a beautiful young woman's neck and collarbone wearing a delicate gold chain necklace with a single small pearl pendant, her chin and soft smile just in frame, hair tucked behind one ear with a small gold hoop earring. Warm natural skin tone, silk cream blouse, soft window light, creamy blurred background, the necklace tack-sharp.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("jewelry-ads", 2, "1:1", "A gold ring with an oval emerald on a wet black pebble", "Jewelry advertising macro photograph: one slim gold ring with a small oval emerald, standing upright on a wet black pebble with tiny water droplets around it. Dramatic single spotlight, deep green velvet background falling into shadow, sparkling highlights on the stone, extreme sharpness, luxury campaign look.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("jewelry-ads", 3, "3:4", "Stacked gold rings and a bracelet on a hand against a camel coat", "Jewelry advertising lifestyle photograph: a young woman's hand with natural manicured nails resting on the collar of a camel wool coat, wearing three stacked thin gold rings and a fine gold bracelet. Soft overcast daylight, city street softly blurred behind, warm natural skin tone, 85mm lens, elegant everyday mood. Only one hand visible, five fingers.", "Nano Banana 2.1", "nano-banana-2-1"),
  ],
  "restaurant-ads": [
    img("restaurant-ads", 1, "3:4", "Two hands holding a smash burger over a diner table", "Restaurant advertising photograph: a tall smash burger with two beef patties, melted cheddar dripping, pickles and a glossy brioche bun, held up in two hands toward the camera over a table with fries in a paper cone. Warm diner lighting, red booth softly blurred behind, steam rising, appetizing close-up, shallow depth of field. Exactly two hands, five fingers each.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("restaurant-ads", 2, "1:1", "Overhead view of friends sharing pizza and pasta", "Restaurant advertising overhead photograph: a round wooden table crowded with shared dishes \u2014 a margherita pizza with one slice being pulled away by a hand with stretchy cheese, a bowl of rigatoni, a green salad, two glasses of sparkling water. Three other hands reaching in with forks, late-evening candlelight, warm tones, lively friends-at-dinner feeling.", "Nano Banana 2.1", "nano-banana-2-1"),
    img("restaurant-ads", 3, "3:4", "A chef sliding a bowl of ramen across the counter", "Restaurant advertising photograph: a smiling young chef in a clean white apron sliding a wooden board with fresh ramen bowl toward the camera across a pass counter, steam rising from the broth, soft egg, pork slices and spring onion in sharp focus. Open kitchen softly blurred behind with warm pendant lights, friendly inviting mood.", "Nano Banana 2.1", "nano-banana-2-1"),
  ],
};

/* 「其他」类页面(方案/行业/平台、指南/价格、榜单)的素材在 page-media-other.ts,排在本页已有配图前面 */
for (const [slug, pics] of Object.entries(OTHER_MEDIA)) PAGE_MEDIA[slug] = [...pics, ...(PAGE_MEDIA[slug] ?? [])];

/** 本页自己的配图(没有就是空数组) */
export const pageMedia = (slug: string): Pic[] => PAGE_MEDIA[slug] ?? [];

/* ── 功能行的前后对比(2026-11-25 Monica:功能行用前后对比滑杆)──
   每页一个数组，按功能行的顺序用：第 1 组给「What is …」那一行，后面的给后续功能行。没有的行照旧用单张图。 */
export type ComparePair = { before: Pic; after: Pic; beforeLabel?: string; afterLabel?: string; /** 滑杆初始位置(0–100,越小「之后」露得越多) */ start?: number };
const NB = ["Nano Banana 2.1", "nano-banana-2-1"] as const;
const still = (slug: string, file: string, alt: string, prompt = ""): Pic => ({ kind: "image", src: `${P}/${slug}/${file}.webp`, aspect: "4:3", alt, prompt, source: "AIGC dev 接口 2026-11-25", model: NB[0], modelSlug: NB[1] });
const clip = (slug: string, file: string, poster: string, alt: string, prompt: string): Pic => ({ kind: "video", src: `${P}/${slug}/${file}.mp4`, poster: `${P}/${slug}/${poster}.webp`, aspect: "4:3", alt, prompt, source: "AIGC dev 接口 2026-11-25", model: "Seedance 2.5 Flash", modelSlug: "seedance-2-5-flash" });

export const PAGE_COMPARE: Record<string, ComparePair[]> = {
  /* 修复前 ↔ 修复后:旧照片是先生成的，再把它当参考图交给 Nano Banana 2.1 修复 */
  "ai-photo-restoration": [
    { before: still("ai-photo-restoration", "r1-before", "A faded, scratched 1970s family photo before restoration"), after: still("ai-photo-restoration", "r1-after", "The same family photo restored with natural colour and no scratches", "Restore this damaged old photo. Remove every scratch, crease, dust speck and the water stain; correct the fading to natural colours; keep the same people and framing.") },
    { before: still("ai-photo-restoration", "r2-before", "A torn black-and-white 1940s portrait before restoration"), after: still("ai-photo-restoration", "r2-after", "The same portrait repaired and colourised", "Restore and colourise this worn black-and-white portrait. Repair the torn corner and fold lines; keep the same face and framing."), afterLabel: "Restored" },
  ],
  /* 原图 ↔ 视频:静态图作首帧，Seedance 2.5 Flash 生成 5 秒 720p */
  "image-to-video": [
    { before: still("image-to-video", "v1-before", "A still photo of a golden retriever on a pier at sunrise"), after: clip("image-to-video", "v1-after", "v1-before", "The golden retriever turns and walks toward the camera", "The golden retriever turns its head toward the camera, tail wagging, then trots a few steps along the pier as the mist drifts over the lake. Slow push-in."), beforeLabel: "Image", afterLabel: "Video", start: 35 },
    { before: still("image-to-video", "v2-before", "A still photo of an iced matcha latte"), after: clip("image-to-video", "v2-after", "v2-before", "Matcha pours into the glass and swirls into the milk", "A hand slowly pours bright green matcha into the glass; it swirls into the milk in soft clouds, ice cubes shift. Locked-off camera."), beforeLabel: "Image", afterLabel: "Video", start: 35 },
  ],
};
/* 对比里的「之后」同时当本页首屏和示例区的专属素材 */
for (const [slug, pairs] of Object.entries(PAGE_COMPARE)) PAGE_MEDIA[slug] = [...pairs.map((c) => c.after), ...(PAGE_MEDIA[slug] ?? [])];
export const pageCompare = (slug: string): ComparePair[] => PAGE_COMPARE[slug] ?? [];

/* ── 功能行逐行配图(2026-11-25,工具页素材):按行的顺序 what → models(Runs on,有模型才有这一行)→ faq → uses…
   每格可以是前后对比(ComparePair)、单张图/视频(Pic),或 null(这一行照旧从素材池取)。
   某页写了 PAGE_ROWS 就以它为准，没写的页照旧按 PAGE_COMPARE 顺序取。行里的素材也会自动进首屏拼贴。 */
export type RowMedia = ComparePair | Pic | null;
export const isPair = (m: RowMedia): m is ComparePair => !!m && "before" in m && "after" in m;
export const PAGE_ROWS: Record<string, RowMedia[]> = { ...TOOL_ROWS };
/* 试点页(已有 PAGE_COMPARE / PAGE_MEDIA 的)：逐行数据里留空的行，先按顺序补本页原有的对比，再补原有的单图 */
for (const [slug, rows] of Object.entries(PAGE_ROWS)) {
  const taken = new Set(rows.flatMap((m) => (m ? [isPair(m) ? m.after.src : m.src] : [])));
  const pairs = pageCompare(slug).filter((c) => !taken.has(c.after.src));
  const afters = new Set(pageCompare(slug).map((c) => c.after.src));
  const singles = (PAGE_MEDIA[slug] ?? []).filter((p) => !afters.has(p.src) && !taken.has(p.src));
  const spare: RowMedia[] = [...pairs, ...singles];
  PAGE_ROWS[slug] = rows.map((m) => m ?? spare.shift() ?? null);
}
export const pageRows = (slug: string): RowMedia[] => PAGE_ROWS[slug] ?? pageCompare(slug);
/* 行素材并进本页素材(对比取「之后」),去重 */
export function registerRows() {
  for (const [slug, rows] of Object.entries(PAGE_ROWS)) {
    const seen = new Set((PAGE_MEDIA[slug] ?? []).map((p) => p.src));
    const add = rows.flatMap((m) => (m ? [isPair(m) ? m.after : m] : [])).filter((p) => !seen.has(p.src) && (seen.add(p.src), true));
    PAGE_MEDIA[slug] = [...add, ...(PAGE_MEDIA[slug] ?? [])];
  }
}
registerRows();
