"use client";

/* 工具落地页模板 v2(2026-11-19,Monica:照 openart.ai/ai-image-generator 一模一样的版式)。/tools/<keyword>,数据在 tool-content.ts,区块在 ../oa/kit.tsx。
   定位(照 Higgsfield):Header 点功能直接进产品工具页;这一页是给搜索 / AI 搜索进来的人看的落地页，
   工具页的 canonical 指向这里。首屏提示词框 = 带着提示词进工具。
   版式(OpenArt 顺序):首屏(大写大标题 + 一句答案 + 发光提示词框 + 作品拼贴)→ 示例与提示词 → 关键功能(左右交替)
     → 品牌色底：更多玩法 + 背后的模型 → 浅底：三步教程 + 用途 → FAQ 两列 → 博客 → 相关工具标签 → 收尾卡。
   SEO / GEO:H1 = 搜索词;首段答案优先;「What is X?」做功能段标题;FAQ 来自真实搜索;
   JSON-LD:BreadcrumbList、SoftwareApplication、HowTo、FAQPage、成片 VideoObject / ImageObject。 */

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { appOf, go, openWithPrompt, type OnLink } from "../../site-nav/SiteNavHeader";
import { HEADER, statusOf, TOOLS_HUB_GROUPS } from "../../site-nav/nav-data";
import { MODELS, type ModelType } from "../../site-nav/models-catalog";
import { modelHref } from "../models/model-content";
import { mediaOf } from "../models/model-media";
import { StepChatReply, StepConnect, StepPickModel, StepPrompt, StepResult } from "../models/ModelVisuals";
import { OA_CTA, OABlog, OAChips, OACta, OADrench, OAExamples, OAFaq, OAFeatureRows, OAHero, OAPromptBox, OASteps, PicView, type OACard, type OARow, OACompare } from "../oa/kit";
import { heroPics, isTextHeavy, pageLedger, picsOf, postsFor, promptFor, spreadSubjects, subjectOf, type Pic } from "../oa/pool";
import { FREE_MODELS, fromCreditsOf, modelEntry, SIGNUP_CREDITS, toolBySlug, TOOLS_CONTENT, type ToolEntry } from "./tool-content";
import { MERGED, REMOVED, resolveHref } from "../redirects";
import { heroFill, isPair, pageMedia, pageRows, PAGE_MEDIA } from "../page-media";
import { THEME_MEDIA } from "../page-media-theme";
import { HERO_FILL } from "../page-media-hero";
import { MarketingAgentHero } from "./MarketingAgentHero";
import { HeroCamera, HeroDub, HeroExtend, HeroPair, HeroStack, HeroStitch, HeroVideo, HeroWipe } from "../oa/hero-feature";
import { VinylLyrics } from "../oa/vinyl";
import { AudioLanding, supportsTags } from "../audio/AudioLanding";
import { audioKindOf } from "../audio/audio-samples";
import { CONTENT_UPDATED } from "../content-date";

const VERIFIED = "November 19, 2026";
const MODE_LABEL: Record<ToolEntry["mode"], string> = { marketing: "Marketing Agent", video: "Video", image: "Image", audio: "Voiceover", music: "Music", sfx: "Sound Effects" };
const ATTACH: Partial<Record<ToolEntry["mode"], string>> = { marketing: "Add product photo", video: "Add image or link", image: "Add photo", audio: "Add voice sample" };
const TYPE_OF: Record<ToolEntry["group"], ModelType> = { Ads: "video", Video: "video", Image: "image", Audio: "audio", Avatar: "video" };
const TOPIC_OF = { Ads: "ads", Video: "video", Image: "image", Audio: "audio", Avatar: "video" } as const;

/** 一张 16:9 卡里放三条视频：9:16 / 1:1 / 16:9,底边对齐，角标写投放位(讲竖屏 / 社媒的图文行用) */
function RatioCollage({ pics }: { pics: Pic[] }) {
  const slots = [
    { r: "9:16", name: "TikTok & Reels", x: 3, w: 27.2, h: 86 },
    { r: "1:1", name: "Feed post", x: 32.2, w: 31, h: 55.1 },
    { r: "16:9", name: "YouTube", x: 65.2, w: 32, h: 32 },
  ];
  return (
    <div className="relative size-full bg-[#111]">
      {slots.map((sl, i) => (
        <div key={sl.r} className="absolute bottom-[7%] overflow-hidden rounded-[14px] ring-1 ring-white/10" style={{ left: `${sl.x}%`, width: `${sl.w}%`, height: `${sl.h}%` }}>
          <PicView p={pics[i]} />
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
            {sl.r} · {sl.name}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 个别工具页首屏固定放哪几条(按文件名，依次占槽位：最左、左内、正中、右内、最右)。
    2026-11-26 Monica 在 AI Video Generator:先把后台走廊挪到正中;又从示例区画箭头，把港口飞龙、女足传中、市集长镜头、玩具店换上首屏，
    替掉耳机、啤酒插画、运动相机和 LUMEA 口播(这几条回到下面的示例区) */
const TOOL_HERO_SEQ: Record<string, string[]> = {
  /* 2026-11-27 Monica 画箭头：最左的港口飞龙和正中的后台歌手对调(后台那条偏暗，飞龙放正中) */
  "ai-video-generator": ["lp-one-take", "ex-lp-soccer-cross", "ex-lp-dragon-harbor", "ex-lp-market-walk", "ex-lp-toy-store"],
  /* 2026-11-26 Monica:Text to Video「hero 五个视频全部替换到好看的」 */
  /* Animation:「hero 不是根据这个落地页的内容做的」—— 3D 卡通 / Q 版 / 黏土 / 纸艺，对应文案里的几种风格 */
  "ai-animation-generator": ["ex-lp-claymation-yeast", "th-a8", "motion-control/use3", "ex-lp-clay-lighthouse", "ex-lp-paper-city"],
  /* Influencer:「全部放数字人那种视频」「那种时尚博主」 */
  "ai-influencer-generator": ["instagram-reels/r1", "346121909483659264", "ai-video-for-creators/r2", "328742133781553152", "instagram-reels/r2"],
  "text-to-video": ["ex-lp-paper-city", "ex-lp-rose-bloom", "lp-knight", "ex-lp-yoga-sunrise", "ex-lp-dragon-harbor"],
};
/* 全站素材(各模型成片 + 各落地页配图)按文件名查，指定首屏顺序和主题素材池都从这里取 */
let ALL_PICS: Pic[] | undefined;
const allPics = (): Pic[] => {
  if (!ALL_PICS) {
    const seen = new Set<string>();
    ALL_PICS = [...picsOf("video"), ...picsOf("image"), ...Object.values(PAGE_MEDIA).flat()].filter((p) => p.kind !== "audio" && !seen.has(p.src) && (seen.add(p.src), true));
  }
  return ALL_PICS;
};
const byFile = (n: string) => allPics().find((x) => x.src.endsWith(`/${n}.mp4`) || x.src.endsWith(`/${n}.webp`) || x.src.endsWith(`/${n}.jpg`) || x.src.endsWith(`/${n}`));

const PRODUCT = /\b(product|unbox\w*|bottle|serum|sneakers?|earbuds|headphones|candle|watch|perfume|fragrance|tumbler|backpack|tote|lamp|lipstick|skincare|packshot|demo|turnaround|soda|can from|the \w+ can|charging stand|planter|weekender)\b/i;
const TALKING = /\b(talks? to (the )?camera|talking|says|speaks?|presents?|presenter|spokesperson|selfie|vlog\w*|influencer|creator|ugc|review|unboxing|lip[- ]?sync\w*)\b/i;

/* 2026-11-26 Monica:Anime 页「这里也是 anime」、Face Swap「全部要是换脸相关的素材」——
   主题限定的页面：首屏、示例区、功能行补位都只用同主题素材，不再从通用模型素材池补(通用池里是写实广告片) */
const THEMED: Partial<Record<string, (p: Pic) => boolean>> = {
  "ai-anime-generator": (p) => /\banime\b/i.test(`${p.alt ?? ""} ${p.prompt ?? ""}`),
  "ai-face-swap": (p) => !!p.inset || /(face-swap|character-swap)/.test(p.src),
  "video-face-swap": (p) => !!p.inset || /(face-swap|character-swap)/.test(p.src),
  /* 2026-11-26 第二批：首屏素材和落地页内容不符的几页，按页面主题限定 */
  "ai-animation-generator": (p) => /\b(3d cartoon|cartoon|animated|animation|claymation|clay|felt|paper-craft|paper cut|hand-drawn|mascot|stop-motion|crayon|chibi)\b/i.test(p.alt ?? ""),
  /* 2026-11-27 Monica「这里怎么就一个，找一些有情节的 AI 视频放上去」:关键词池太小(首屏拿完示例区只剩 1 条),
     且 reveal 把航拍房子、音箱产品也拉了进来 → 去掉 reveal,再按文件名补一批有情节 / 有对白的成片 */
  "ai-short-drama": (p) =>
    p.kind === "video" &&
    !/asmr/i.test(p.alt ?? "") &&
    (/\/(ex-lp-first-date|ex-lp-lake-proposal|ex-lp-old-friends|ex-lp-laundromat-brawl|ex-lp-barber-reveal|ex-lp-cat-vs-vacuum|ex-lp-split-reaction|ex-lp-street-magician|ex-lp-mirror-handoff|lp-diner|lp-taco-bilingual|ex-lp-moving-day)\.mp4$/.test(p.src) ||
      /\b(drama|argu\w*|face off|confront\w*|cliffhanger|mystery|episode|soap|betray\w*|breakup|proposal|standoff|tense|detective|thriller|plot twist|first date|toast|reunion|brawl|secret|confess\w*|sitcom|couple)\b/i.test(p.alt ?? "")),
  "ai-dance-video": (p) => /\b(danc\w*|choreograph\w*|breakdanc\w*|twirls?|ballet|hip-hop)\b/i.test(p.alt ?? ""),
  "faceless-video-generator": (p) => /\b(paper-craft|faceless|collage|explainer|voiceover|captions?|stickman|stop-motion|top-down|clay|whiteboard|b-roll)\b/i.test(p.alt ?? ""),
  "ai-music-video-generator": (p) => !p.src.includes("th-mv-hero") && /\b(music video|sings?|singing|singer|rapper|band|concert|guitar|ukulele|choreograph\w*|song)\b/i.test(p.alt ?? ""),
  /* 2026-11-26 审核:Ads 这组首屏 / 示例也混进了跑酷、足球、动画片，和页面讲的东西对不上 */
  "ai-ugc-video-generator": (p) => p.kind === "video" && /\b(ugc|selfie|creator|talks? to (the )?camera|talking to camera|review\w*|unboxing|vlog\w*|try-on|get-ready|holds? up)\b/i.test(p.alt ?? ""),
  "ai-product-video-generator": (p) => p.kind === "video" && PRODUCT.test(p.alt ?? ""),
  "url-to-video": (p) => p.kind === "video" && PRODUCT.test(p.alt ?? ""),
  "ai-ad-generator": (p) => p.kind === "video" && (PRODUCT.test(p.alt ?? "") || /\b(ad|ads|commercial|spot|campaign|ugc)\b/i.test(p.alt ?? "")),
  "marketing-agent": (p) => p.kind === "video" && (PRODUCT.test(p.alt ?? "") || /\b(ad|ads|commercial|spot|campaign|ugc)\b/i.test(p.alt ?? "")),
  "ai-b-roll-generator": (p) => p.kind === "video" && !TALKING.test(p.alt ?? "") && /\b(b-roll|hands?|close-up|macro|pours?|poured|steam|slow[- ]motion|drone|aerial|time-lapse|lifestyle|dolly|push-in|light trails|lands on)\b/i.test(p.alt ?? ""),
  "transparent-png-generator": (p) => p.kind === "image" && /\b(transparent|transparency|cutout|no background|isolated|stickers?|die-cut)\b/i.test(p.alt ?? ""),
  /* 「这里要全部放数字人那种视频」「那种时尚博主」:真人对镜头说话的视频(博主、主播、数字人) */
  "ai-influencer-generator": (p) => p.kind === "video" && (TALKING.test(p.alt ?? "") || /\b(try-on|outfit|fashion|get-ready|grwm|reel)\b/i.test(p.alt ?? "")),
  "talking-avatar": (p) => p.kind === "video" && TALKING.test(p.alt ?? ""),
  "ai-spokesperson": (p) => p.kind === "video" && TALKING.test(p.alt ?? ""),
};

/* 2026-11-26 审核：图片类工具页首屏几乎都是同样 5 张通用图(巨型精华瓶、举 BRIVO 罐的女生…),和各页讲的功能对不上。
   这些页同主题素材不够凑满整页，不做硬限定，改成「切题的排前面」:首屏、示例区先放说明里带这些词的素材，不够再用通用的补 */
const PREFER: Record<string, RegExp> = {
  "remove-background": /\b(transparent|cutout|cut out|white background|isolated|no background)\b/i,
  "ai-background-generator": /\b(the same (\w+ )?(bottle|can|candle|tote|perfume|product|sneaker)|backdrop|on a (marble|stone|travertine|striped|wooden|linen)|new background)\b/i,
  "ai-product-photography": /\b(product (photo|shot|photograph)|packshot|studio product|bottle|candle|perfume|still life|e-commerce)\b/i,
  "ai-image-editor": /\b(the same|original|relit|recomposed|edited|swapped|removed|replaced|with a (camel|new))\b/i,
  "ai-inpainting": /\b(the same|original|removed|replaced|swapped|with a (camel|new))\b/i,
  "remove-object": /\b(removed|the same (photo|street|floor|bottle)|clean)\b/i,
  "image-to-image": /\b(the same|rendered as|restyled|redrawn|turned into|version of)\b/i,
  "ai-image-extender": /\b(recomposed|extended|wider|expanded|outpaint\w*|cropped to)\b/i,
  "ai-infographic-generator": /\b(infographic|chart|diagram|steps|timeline|callouts?|labeled)\b/i,
  "ai-photo-restoration": /\b(restor\w+|old photo|black-and-white|faded|colou?ri[sz]ed|scratched|1940s|1950s|1970s)\b/i,
  "sketch-to-image": /\b(sketch|drawing|pencil|storyboard|doodle|crayon|line art)\b/i,
  "consistent-character": /\b(the same (woman|man|character|creator|girl|person)|mascot|character sheet|three scenes|poses)\b/i,
  "ai-headshot-generator": /\b(headshot|portrait|blazer|linkedin)\b/i,
  "ai-hairstyle-changer": /\b(hair|bob|bangs|curly|ponytail|portrait)\b/i,
  "ai-mockup-generator": /\b(mockup|billboard|packaging|label|tote|box|bag|storefront|signage)\b/i,
  "image-to-3d": /\b(3d|figurine|turnaround|render|toy|model sheet)\b/i,
  "ai-logo-generator": /\b(logo|badge|monogram|brand mark|emblem|sticker)\b/i,
  "upscale-image": /\b(upscaled|sharp|detail\w*|macro|4k|every)\b/i,
  "virtual-try-on": /\b(try-on|wearing|outfit|coat|dress|cardigan|blazer|trench)\b/i,
  "ai-poster-generator": /\b(poster|key visual|billboard)\b/i,
  "ai-flyer-maker": /\b(flyer|poster|menu|invitation|sale)\b/i,
  "ai-art-generator": /\b(painting|watercolor|illustration|art nouveau|paper-cut|impasto|clay render|linocut|collage)\b/i,
  "ai-cartoon-generator": /\b(cartoon|mascot|3d cartoon|comic|caricature|claymation)\b/i,
  "ai-script-to-video": /\b(explainer|voiceover|captions?|ad|ads|ugc|review)\b/i,
  "ai-camera-control": /\b(dolly|orbit\w*|push-in|pull-back|crane\w*|tracking|follow shot|one continuous|single take|fpv|drone|arc\w*)\b/i,
};
/* 2026-11-27 审图：Logo / Sketch / 3D / Headshot 等页首屏仍混进别页的通用图(「换红色风衣」那张)。切题素材够 3 张时首屏只用切题的 */
/* 从提示词里取前两三个实词拼成商品页网址的末段(比如 sage-headphones),每条示例的链接各不相同、看得出是哪个商品 */
const slugify = (s: string) => {
  const STOPW = new Set("a an the and with for of in on to my your this that from into vertical horizontal second seconds video ad ads shot clip one continuous make create page added hook top selling points end product shop now short call action link".split(" "));
  const w = (s.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((x) => !STOPW.has(x) && !/^\d/.test(x)).slice(0, 3);
  return w.length ? w.join("-") : "your-product";
};
const preferPool = (slug: string, type: string): Pic[] => {
  const re = PREFER[slug]; const all = allPics().filter((p) => p.kind === type);
  const hit = all.filter((p) => re.test(p.alt ?? ""));
  return hit.length >= 3 ? hit : preferFirst(slug, all);
};
const preferFirst = (slug: string, list: Pic[]): Pic[] => {
  const re = PREFER[slug];
  return re ? [...list.filter((p) => re.test(p.alt ?? "")), ...list.filter((p) => !re.test(p.alt ?? ""))] : list;
};

/* 2026-11-26 画中画首屏：结果 + 左上角原图小卡(Face Swap 看竞品都是「原片 / 参考脸 → 换好的」;Image to Video 是「图 → 视频」)。
   取别的落地页现成的前后对比(本页的对比留给下面功能行，不重复),按槽位顺序：最左、左内、正中、右内、最右 */
const pairOf = (slug: string, file: string, label: string, insetFrom?: [string, string]): Pic | undefined => {
  for (const m of pageRows(slug)) if (m && isPair(m) && m.after.src.endsWith(`/${file}`)) return { ...m.after, inset: m.before, insetLabel: label };
  for (const m of pageRows(slug)) if (m && !isPair(m) && m.src.endsWith(`/${file}`)) {
    const from = insetFrom && pageRows(insetFrom[0]).find((x) => x && isPair(x) && x.before.src.endsWith(`/${insetFrom[1]}`));
    return from && isPair(from) ? { ...m, inset: from.before, insetLabel: label } : m;
  }
  return undefined;
};
/* 2026-11-27 Monica 圈第 3 步成片：「这个素材选的不符合，不要重新生成，就从已有的里面选」「重新选图」「换个合适的配图」
   → 第 3 步按页面指定一张已有素材(和第 2 步的提示词、页面主题对得上),不再用通用补位图(圣诞礼盒精华液) */
const STEP_PIC: Record<string, string> = {
  "ai-image-generator": "nano-banana-2-1/ex-lp-market-portrait",
  "remove-background": "seedream-5-5/ex-lp-cutout-chair",
  "ai-image-editor": "nano-banana-2-1/lp-picnic",
  "ai-image-extender": "grok-imagine-2-0/lp-16x9",
  "ai-poster-generator": "seedream-5-5/ex-lp-festival-poster",
  "ai-cartoon-generator": "ai-animation-generator/mascot",
  "remove-object": "ai-image-editor/use3-after",
};
const TOOL_HERO_PAIRS: Record<string, () => (Pic | undefined)[]> = {
  /* 2026-11-27 Monica「AI Infographic Generator 这些素材都不是 infographic 啊」:五张都是信息图(正中咖啡知识竖版信息图) */
  "ai-infographic-generator": () => [byFile("nano-banana-pro/ex-lp-infographic-coffee"), byFile("seedream-4-5/lp-ingredients"), byFile("gpt-image-2/ex-lp-size-chart"), byFile("gpt-image-2-6-flare/lp-meal-plan"), byFile("seedream-5-0-pro/pro_infographic")],
  /* 2026-11-27 Monica「AI Poster Generator 首屏这当然是展示 poster」:五张都是海报(用本页功能行以外的) */
  "ai-poster-generator": () => [byFile("ai-short-drama/pilot"), byFile("ai-art-generator/use1"), byFile("ai-flyer-maker/use2"), byFile("ai-flyer-maker/what"), byFile("ai-flyer-maker/use3")],
  /* 2026-11-27 Monica 圈正中的老爷爷：「换一个漂亮时尚女生跳舞的」→ 五个槽位按顺序指定，正中是天台上跳舞的时尚女生，不放老人 */
  /* 2026-11-27 Monica 圈掉面团、MOSSA 瓶、咖啡：「换成 youtube 上那种 AI 数字人做播客那种感觉，或者还有别的，就是做内容，但是不露脸，或者是 AI 数字人」
     → 正中 AI 双人播客，左内 AI 数字人主播，右内带字幕的竖版播客片段;两边外侧的手绘讲解、黏土灯塔保留 */
  "faceless-video-generator": () => [HERO_FILL["long-video-to-shorts"]?.find((x) => x.src.endsWith("/hf-ls1.mp4")), byFile("talking-avatar/what"), byFile("mcp-skill-showcase/faceless-money"), byFile("long-video-to-shorts/podcast"), byFile("heygen-video/ex-lp-clay-lighthouse")],
  /* 2026-11-27 Monica 画箭头：左内放贴纸套组，右内放黄色扶手椅(正中相机、两侧外橙子和机器人不动) */
  "transparent-png-generator": () => [byFile("gpt-image-2-6-flare/lp-camera"), byFile("gpt-image-2-5-flare/ex-lp-sticker-pack"), byFile("diagrams/el-citrus"), byFile("seedream-5-5/ex-lp-cutout-chair"), byFile("gpt-image-2-6-flare/ex-lp-mascot")],
  /* 槽位顺序：正中、左内、左外、右内、右外 */
  "ai-dance-video": () => [byFile("motion-control/what-after"), byFile("motion-control/use3"), byFile("motion-control/models"), byFile("minimax-h3-max/ex-lp-dance-studio-2"), byFile("gpt-image-2-5-sunburst/ex-lp-ballet-backstage")],
  "ai-face-swap": () => [
    pairOf("video-face-swap", "use2-after.mp4", "Original"),
    pairOf("video-face-swap", "faq-after.webp", "Face"),
    pairOf("video-face-swap", "use3.mp4", "Original", ["video-face-swap", "what-before.mp4"]),
  ],
  "video-face-swap": () => [
    pairOf("ai-face-swap", "use1-after.mp4", "Original"),
    pairOf("ai-face-swap", "faq-after.webp", "Face"),
    pairOf("ai-face-swap", "use3-after.webp", "Original"),
  ],
  /* Monica:「这 5 个视频找一些好看的放进去」—— 全站图生视频的成片里挑画面最好的 5 条，带上它们的首帧 */
  "image-to-video": () => [
    pairOf("ai-camera-control", "use2-after.mp4", "Image"),
    pairOf("ai-dance-video", "what-after.mp4", "Image"),
    pairOf("ai-camera-control", "what-after.mp4", "Image"),
    pairOf("ai-animation-generator", "image-after.mp4", "Image"),
    pairOf("ai-video-generator", "ad-after.mp4", "Image"),
  ],
};
/* 功能行单独换素材(行序号从 0 起：what → models → faq → uses…) */
/* 按行标题换素材(比按序号稳):2026-11-27 Monica 圈 Remove Object「Swap one object for another」配的是精华液女生 —— 「这个配图没展示对」→ 换成换物前后对比 */
const TOPIC_SWAP: Record<string, [RegExp, () => Pic | undefined][]> = {
  /* 2026-11-27 Monica:AI Dance「Group routines」配了女生嘴部特写、「Cartoon and 3D characters」配了真人街舞 →「这个配图不符合」
     → 多人编舞：3D Director 白模排舞 + 渲染成片左右对照;卡通角色：3D 动画风女生照着跳(Motion Control 页同一条) */
  "ai-dance-video": [
    [/^Group routines/, () => ({ kind: "video", src: "/prototypes/site/pages/ai-dance-video/group-3d.mp4", poster: "/prototypes/site/pages/ai-dance-video/group-3d.webp", aspect: "16:9", alt: "Four mannequins blocking a dance in 3D next to the same four dancers rendered on a concert stage", prompt: "Block a 4-member dance group on a neon stage in 3D, then render the same moves photoreal.", source: "3D Director 演示" })],
    /* 「Fashion ads 这个应该用女团跳舞那个」:九人女团穿同款浅粉套装在练舞室跳(竖版视频，两侧垫模糊底) */
    [/^Fashion ads/, () => ({ kind: "video", src: "/prototypes/site/pages/ai-dance-video/girlgroup.mp4", poster: "/prototypes/site/pages/ai-dance-video/girlgroup.webp", aspect: "16:9", alt: "A girl group in matching pastel pink outfits dances in sync in a bright studio", prompt: "A vertical dance-pop video: the group dances in sync in matching pastel outfits in a bright studio.", source: "AI Music Video 页 th-mv3" })],
    [/^Cartoon and 3D/, () => ({ kind: "video", src: "/prototypes/site/pages/motion-control/hero-animated.mp4", poster: "/prototypes/site/pages/motion-control/hero-animated.webp", aspect: "4:3", alt: "A 3D animated woman copies a dance on a sunny garden terrace", prompt: "Make the animated character in my photo copy the moves in my dance clip.", source: "AIGC dev 2026-11-27", model: "Kling 3.0 Motion Control" })],
  ],
  "remove-object": [[/^How do you remove/, () => { const m = pageRows("ai-video-editor").find((x) => x && isPair(x) && x.after.src.endsWith("/fix-after.webp")); return m && isPair(m) ? ({ ...m, beforeLabel: "Original", afterLabel: "Removed" } as unknown as Pic) : undefined; }], [/^Swap one object/, () => { const m = pageRows("ai-image-editor").find((x) => x && isPair(x) && x.after.src.endsWith("/use1-after.webp")); return m && isPair(m) ? ({ ...m, beforeLabel: "Original", afterLabel: "Swapped" } as unknown as Pic) : undefined; }]],
};
const ROW_SWAP: Record<string, Record<number, () => Pic | undefined>> = {
  /* Monica:「Which models can turn an image into a video?」「也不是应该有个小图，然后视频吗?」 */
  "image-to-video": { 2: () => pairOf("url-to-video", "use2.mp4", "Image") },
  /* 首屏拿走了本页的素材，这一行换成别的，不重复 */
  "ai-dubbing": { 3: () => rowPic("ai-video-editor", "localize.mp4") },
  /* 2026-11-27 首屏用了舞蹈参考片(what-before),第一行换成 Dance 页「一张照片 → 跳舞」那组，不重复 */
  "motion-control": { 0: () => pairOf("ai-dance-video", "what-after.mp4", "Photo") },
  "upscale-video": { 0: () => demo("/prototypes/ai-tools/upscale-video-demo.mp4", "Side-by-side of a clip before and after upscaling in BuzzVideo", "16:9") },
  "ai-video-extender": { 0: () => rowPic("ai-video-extender", "faq.webp"), 2: () => rowPic("ai-video-extender", "models.webp"), 1: () => PICK },
  /* Music Video:「Runs on」那行要带广告配乐的视频 */
  "ai-music-video-generator": { 1: () => byTheme("ai-music-video-generator", "th-mv-ad.mp4") },
  /* B-roll「UGC and talking-head ads」:「这里应该是带有人的视频啊」 */
  "ai-b-roll-generator": { 3: () => rowPic("ai-spokesperson", "use1.mp4") },
};
const PICK = { kind: "video", src: "__pick__", aspect: "16:9", alt: "", prompt: "", source: "" } as Pic;
function rowPic(slug: string, file: string): Pic | undefined {
  for (const m of pageRows(slug)) {
    if (!m) continue;
    if (isPair(m)) { if (m.after.src.endsWith(`/${file}`)) return m.after; if (m.before.src.endsWith(`/${file}`)) return m.before; }
    else if (m.src.endsWith(`/${file}`)) return m;
  }
  return undefined;
}
function rowPairOf(slug: string, file: string) {
  for (const m of pageRows(slug)) if (m && isPair(m) && m.after.src.endsWith(`/${file}`)) return m;
  return undefined;
}
const byTheme = (slug: string, file: string) => (THEME_MEDIA[slug] ?? []).find((x) => x.src.endsWith(`/${file}`));
const demo = (src: string, alt: string, aspect = "16:10", prompt = ""): Pic => ({ kind: "video", src, aspect, alt, prompt, source: "BuzzVideo 工具页演示" });
/* 功能行换成自绘示意(不是素材) */
const ROW_NODE: Record<string, Record<number, () => React.ReactNode>> = {
  /* Music Video「Can AI make the song too?」:「像黑胶音乐播放器转，然后歌词滚动」 */
  "ai-music-video-generator": { 2: () => <VinylLyrics cover="/prototypes/site/pages/ai-music-video-generator/faq-poster.webp" /> },
};
/* 2026-11-26 首屏单画面(代替 5 张拼贴):返回画面 + 用掉的素材(登记进账本，下面不再重复) */
/* 2026-11-27 Monica「MCP 这几页 HERO 分成左右」并把下面「What is…」那条聊天演示(AI 对话里出视频)拉到首屏右边 */
const HERO_SPLIT = new Set(["video-generation-mcp", "claude-video-generator", "chatgpt-video-generator", "ai-image-editor", "upscale-image", "remove-object", "ai-inpainting"]); /* 2026-11-27 ai-image-extender 改居中标题 + 下方大对比(Monica 选的布局)，不再左右分栏 */
/* 2026-11-27 Monica:AI Image Editor「跟 Claude Video Generator 一个布局，素材是 slider，展示 before after」;
   Image Upscaler / Remove Object「跟 image upscale 一样，展示 before after」;Image Extender「也是 before after 的 hero，不要白线」
   → 左右分栏首屏，右边是本页「What is」那组前后对比(滑杆自动左右扫);那一行改放别的素材 */
const splitCompare = (slug: string, before: string, after: string) => () => {
  const m = pageRows(slug).find((x) => x && isPair(x) && x.after.src.endsWith(`/${after}`));
  return m && isPair(m) ? { node: <div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-[#111] shadow-[0_40px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10"><OACompare {...m} beforeLabel={before} afterLabel={m.afterLabel ?? "After"} /></div>, used: [m.after, m.before] } : undefined;
};
const mcpHero = (slug: string) => () => {
  const p = rowPic(slug, "what.mp4");
  return p && { node: <div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-[#111] shadow-[0_40px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10"><PicView p={p} /></div>, used: [p] };
};
const HERO_FEATURE: Record<string, () => { node: React.ReactNode; used: Pic[] } | undefined> = {
  "ai-image-editor": splitCompare("ai-image-editor", "Original", "what-after.webp"),
  "upscale-image": splitCompare("upscale-image", "Low-res", "what-after.webp"),
  "remove-object": splitCompare("remove-object", "Original", "what-after.webp"),
  /* 2026-11-27 Monica「直接放个 before 和 after 就好，上下比较，不要 slider 了。就只改 hero 部分」 */
  "ai-image-extender": () => {
    const m = pageRows("ai-image-extender").find((x) => x && isPair(x) && x.after.src.endsWith("/what-after.webp"));
    return m && isPair(m) ? { node: <HeroStack before={m.before} after={m.after} beforeLabel="Original" afterLabel={m.afterLabel ?? "Extended"} />, used: [m.after, m.before] } : undefined;
  },
  /* 2026-11-27 Monica:AI Inpainting「这个页面 hero 也要换成 before after」 */
  "ai-inpainting": splitCompare("ai-inpainting", "Masked area", "what-after.webp"),
  /* 2026-11-27 Marketing Agent 首屏改成居中标题 + 整块演示(MarketingAgentHero.tsx),不再走这里 */
  "video-generation-mcp": mcpHero("video-generation-mcp"),
  "claude-video-generator": mcpHero("claude-video-generator"),
  "chatgpt-video-generator": mcpHero("chatgpt-video-generator"),
  /* 「AI Dubbing 根据内容展示素材，一个就好，hero 结构改一下」:同一条视频依次说英语、西语、法语 */
  "ai-dubbing": () => { const p = rowPic("ai-dubbing", "use1.mp4"); return p && { node: <HeroDub p={p} langs={[{ code: "EN", name: "English", from: 0, to: 4.95 }, { code: "ES", name: "Spanish", from: 4.95, to: 9.9 }, { code: "FR", name: "French", from: 9.9, to: 99 }]} />, used: [p] }; },
  /* 「Motion Control 改下结构展示一个视频，视频就用我们工具页那个」 */
  /* 2026-11-27 Monica「这个素材太糊了」:左舞蹈参考(Dance 页素材)右 3D 动画风女生照跳(Kling 3.0 Motion Control,AIGC 生成) */
  "motion-control": () => {
    const M = "/prototypes/site/pages/motion-control";
    const left: Pic = { kind: "video", src: `${M}/what-before.mp4`, poster: `${M}/what-before-poster.webp`, aspect: "4:3", alt: "Dance reference clip: a woman in a white tee and jeans dances in a grey studio", prompt: "", source: "" };
    const right: Pic = { kind: "video", src: `${M}/hero-animated.mp4`, poster: `${M}/hero-animated.webp`, aspect: "4:3", alt: "A 3D animated woman in a denim shirt and floral skirt copies the same dance on a sunny garden terrace", prompt: "Make the animated character in my photo copy the moves in my dance clip. Keep the original sound.", source: "AIGC dev 2026-11-27", model: "Kling 3.0 Motion Control" };
    /* 2026-11-27 Monica「剪辑排版一下，这个要放到一个视频里」:两段剪成一条 16:9 视频(左舞蹈参考、右动画角色，同步) */
    const one: Pic = { ...right, src: `${M}/hero-combined.mp4`, poster: `${M}/hero-combined.webp`, aspect: "16:9" };
    return { node: <div className="relative"><HeroVideo p={one} /><span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-[#240A03]/75 px-2.5 py-1 text-[12px] font-bold text-white">Dance clip</span><span className="pointer-events-none absolute left-[calc(50%+12px)] top-3 z-10 rounded-full bg-[#FF744D] px-2.5 py-1 text-[12px] font-bold text-white">Your character</span></div>, used: [right, left, one] };
  },
  /* 2026-11-27 Monica「AI Camera Control 改成下面配一个视频那种布局，用 fal.ai 的素材，做一个联动的控制镜头角度」 */
  "ai-camera-control": () => {
    const C = "/prototypes/site/pages/ai-camera-control";
    const M: [string, string][] = [["dolly_in", "Dolly in"], ["dolly_out", "Dolly out"], ["truck_right", "Truck right"], ["pan_left", "Pan left"], ["pedestal_up", "Crane up"], ["s_curve_forward", "S-curve"]];
    const moves = M.map(([key, label]) => ({ key, label, src: `${C}/cc-${key}.mp4`, poster: `${C}/cc-${key}.webp` }));
    const lead: Pic = { kind: "video", src: moves[0].src, poster: moves[0].poster, aspect: "16:9", alt: "A breakdancer frozen mid-freeze on a court while the camera dollies in", prompt: "Keep the scene frozen and dolly the camera in slowly toward the dancer.", source: "AIGC dev 2026-11-27", model: "MiniMax H3 Max" };
    return { node: <HeroCamera moves={moves} />, used: [lead] };
  },
  /* 「3D to Video 也是就展示一个视频，就是那个飞机」:工具页的水上飞机渲染 */
  "3d-to-video": () => { const p = demo("/prototypes/ai-tools/guide/cards/render-3d.mp4", "A 3D seaplane blockout rendered as a realistic flight over a rocky coast", "16:10", "Render my 3D blockout as a realistic shot: a red-and-white seaplane flies low over a rocky Mediterranean coast. Keep my camera move and timing."); return { node: <HeroVideo p={p} />, used: [p] }; },
  /* 「AI Lip Sync 就是展示一个对口型，就是工具页那个素材」 */
  /* 2026-11-27 Monica「这个素材也太糊了」(工具页 640px 那条)→ 换本页 1024px 的对口型成片：同一个人对镜头说新台词 */
  /* 2026-11-27 Monica:还是用紫色毛衣车上的女生，原配音 Lively_Girl 像小孩 → 用 AIGC 重配成年女声(minimax-speech-2.8-hd · Calm_Woman)再跑口型同步，覆盖 use3.mp4 */
  "ai-lip-sync": () => { const p = rowPic("ai-lip-sync", "use3.mp4") ?? rowPic("ai-lip-sync", "what.mp4"); return p && { node: <HeroVideo p={p} />, used: [p] }; },
  /* 「Upscale Video 直接做成 before after」 */
  "upscale-video": () => { const m = rowPairOf("upscale-video", "what-after.mp4"); return m && { node: <HeroWipe before={m.before} after={m.after} beforeLabel="360p" afterLabel="4K" />, used: [m.before, m.after] }; },
  /* 「Video Extender 是不是展示 before after」:原片 5 秒和延长后 10 秒并排 */
  /* 2026-11-27 Monica「这个内容特别不好，用人家官方的素材」:换成 BytePlus Seedance 2.0 文档 Extend video 示例(三段接成一条) */
  "ai-video-extender": () => {
    const X = "/prototypes/site/pages/ai-video-extender";
    const PROMPT = "The arched window in [Video 1] opens, and the camera moves into the interior of the art museum, transitioning into [Video 2]. After that, the camera enters the painting itself, transitioning into [Video 3].";
    const v = (n: string, alt: string, prompt = ""): Pic => ({ kind: "video", src: `${X}/${n}.mp4`, poster: `${X}/${n}.webp`, aspect: "16:9", alt, prompt, source: "BytePlus Seedance 2.0 docs · Extend video", model: "Seedance 2.0", modelSlug: "seedance-2-0" });
    const ins = [v("stitch-in1", "Clip 1: a stone building with a lit arched window among city towers at dusk"), v("stitch-in2", "Clip 2: a framed painting of a night cafe on a museum wall"), v("stitch-in3", "Clip 3: inside the painting, a cafe terrace in thick brushstrokes")];
    const out = v("stitch-out", "Three clips extended and joined into one continuous shot from city window to museum to painting", PROMPT.replace(/\[|\]/g, ""));
    return { node: <HeroStitch inputs={[{ p: ins[0], secs: 5, from: 0, to: 5.2 }, { p: ins[1], secs: 3, from: 5.2, to: 9 }, { p: ins[2], secs: 3, from: 9, to: 12.1 }]} output={out} outSecs={12} />, used: [out, ...ins] };
  },
  /* 2026-11-26 审核:Remove Object from Video 首屏原来是演唱会、跑步这些无关视频 → 直接放一组「去掉前 / 去掉后」对比(取 Remove Object 页没在本页用过的那组) */
  "remove-object-from-video": () => {
    const m = pageRows("remove-object")[0];
    return m && isPair(m) ? { node: <div className="aspect-video overflow-hidden rounded-[20px] bg-[#111] shadow-[0_40px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10"><OACompare {...m} beforeLabel="Original" afterLabel="Object removed" /></div>, used: [m.before, m.after] } : undefined;
  },
  /* 「AI Music Video 换个 hero 的展示方式，放个 MV 进去」「这个不好，换个清新一点的」 */
  "ai-music-video-generator": () => { const p = byTheme("ai-music-video-generator", "th-mv-fresh.mp4") ?? rowPic("ai-music-video-generator", "use1.mp4"); return p && { node: <HeroVideo p={p} />, used: [p] }; },
};

export function ToolTemplate({ t, onLink }: { t: ToolEntry; onLink: OnLink }) {
  const a = (label: string, rawHref: string, status = statusOf(resolveHref(rawHref)), href = resolveHref(rawHref)) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });
  /* 进工具(照 Higgsfield:落地页的按钮带人进产品工具页) */
  const enterTool = (label: string) => {
    const app = appOf(`/${t.slug}`);
    if (app) window.location.href = app;
    else go("/", statusOf("/"), label, onLink);
  };
  const toTool = (label: string) => ({
    href: `/${t.slug}`,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      enterTool(label);
    },
  });
  const type = TYPE_OF[t.group];
  const def = modelEntry(t.models[0]);
  const from = fromCreditsOf(t.models[0]);
  const freeOk = t.models.some((s) => FREE_MODELS.has(s));
  const freeLine = freeOk ? `${SIGNUP_CREDITS} free credits when you sign up` : t.group === "Image" ? "Free credits work on Seedream images · other models from the Starter plan" : "Free to sign up · video models from the Starter plan";

  /* 素材：本工具的成片 + 本工具模型的成片 → 同类池 */
  const own: Pic[] = useMemo(() => {
    const out: Pic[] = [...pageMedia(t.slug)]; /* 2026-11-25 本页专属配图排最前 */
    if (t.media) out.push({ kind: t.media.kind, src: t.media.src, poster: t.media.poster, aspect: t.media.aspect, alt: t.media.alt, prompt: t.prompt.replace(/\[|\]/g, ""), source: t.media.source });
    for (const s of t.models) {
      const m = modelEntry(s);
      for (const x of mediaOf(s)) if (x.kind === type) out.push({ ...x, model: m?.name, modelSlug: s });
    }
    out.push(...heroFill(t.slug).filter((x) => x.kind === type)); /* 2026-11-26 首屏补主体 */
    const pairs = (TOOL_HERO_PAIRS[t.slug]?.() ?? []).filter((x): x is Pic => !!x);
    const all = [...pairs, ...out.filter((x) => !pairs.some((q) => q.src === x.src))];
    const th: ((p: Pic) => boolean) | undefined = THEMED[t.slug];
    return th ? all.filter((x) => th(x)) : all;
  }, [t, type]);
  const themed: ((p: Pic) => boolean) | undefined = THEMED[t.slug];
  const pool = useMemo(() => {
    const seen = new Set<string>();
    const base = themed ? [...own, ...allPics().filter((p) => (p.kind === type || type === "video") && themed(p))] : [...own, ...picsOf(type)];
    return base.filter((p) => (seen.has(p.src) ? false : (seen.add(p.src), true)));
  }, [own, type, themed]);
  /* 2026-11-26 Monica:「首屏不要放一样的素材，下面也不要重复」—— 整页一本素材账(pageLedger):
     先登记功能行的固定素材(PAGE_ROWS),首屏每个主体只放一张，示例区 / 功能行 / 卡片都只用没出现过的文件 */
  const rowMedia = pageRows(t.slug);
  const reserveRows = (L: ReturnType<typeof pageLedger>) => {
    for (const m of rowMedia) if (m) (isPair(m) ? [m.before, m.after] : [m]).forEach(L.mark);
    for (const f of Object.values(ROW_SWAP[t.slug] ?? {})) { const x = f(); if (x) L.mark(x); }
    return L;
  };
  const hero = useMemo(() => {
    /* 指定了首屏顺序的页面：这几条按顺序排到最前，heroPics 依次放进槽位 */
    if (HERO_FEATURE[t.slug]) return [] as Pic[]; /* 单画面首屏不用拼贴，素材留给下面 */
    const seq = TOOL_HERO_SEQ[t.slug];
    const extra = (seq ?? []).map(byFile).filter((x): x is Pic => !!x && !own.some((o) => o.src === x.src));
    const rank = (x: Pic) => { const i = seq ? seq.findIndex((n) => x.src.endsWith(`/${n}.mp4`) || x.src.endsWith(`/${n}.webp`)) : -1; return i < 0 ? 99 : i; };
    const ordered = seq ? [...extra, ...own].map((x, k) => [x, k] as const).sort((p, q) => rank(p[0]) - rank(q[0]) || p[1] - q[1]).map(([x]) => x) : preferFirst(t.slug, PREFER[t.slug] ? [...own, ...allPics().filter((p) => p.kind === type && PREFER[t.slug].test(p.alt ?? "") && !own.some((o) => o.src === p.src))] : own);
    const L0 = reserveRows(pageLedger());
    /* 画中画对子按给定顺序直接占槽位(不走主体去重：「The same …」文案会把不同对子并成一个主体) */
    const pairs = (TOOL_HERO_PAIRS[t.slug]?.() ?? []).filter((x): x is Pic => !!x && !L0.has(x)).slice(0, 5).map(L0.mark);
    return [...pairs, ...heroPics(type, ordered.filter((x) => !pairs.includes(x)), (themed || PREFER[t.slug] ? 5 : 12) - pairs.length, t.slug, L0, themed ? pool : PREFER[t.slug] ? preferPool(t.slug, type) : undefined) /* 字多的图(海报、信息图)照旧只放正中一张：两边的卡会被输入框压住标题，Monica 之前指出过 */ /* 主题页素材少：首屏只取 5 条，其余留给示例区 */];
  }, [type, own, t.slug, rowMedia, themed, pool]); // eslint-disable-line react-hooks/exhaustive-deps
  /* 2026-11-26 Monica 在 AI Video Generator 首屏圈出「15s / product / in-use shot」橙框:「不要做这个」——
     输入框一开始放正中那张成片的真实提示词，不再放带 [占位] 的模板;没有可用提示词时才用模板，并去掉方括号 */
  /* 2026-11-27 Monica:「URL to video 提示词要带 URL」—— 这页输入框里的每条提示词(含首屏轮播打字)前面都带上商品页链接 */
  const PAGE_URL = "https://yourstore.com/products/";
  /* 链接末段取提示词里的商品词;模板提示词没有商品词时，用首屏那条成片说明里的商品(如 wireless-charging-stand) */
  const urlSlug = (s: string) => { const k = slugify(s); return k !== "your-product" ? k : slugify(own.find((p) => p.kind === "video")?.alt ?? ""); };
  const withUrl = (s: string) => (t.slug === "url-to-video" && s && !/https?:\/\//.test(s) ? `${PAGE_URL}${urlSlug(s)} ${s.replace(/\bfrom the page I added\b/i, "from this product page")}` : s);
  const setPromptUrl = (s: string) => setPrompt(withUrl(s));
  const [prompt, setPrompt] = useState(() => {
    /* 2026-11-27 审图：Mockup / Photo Restoration / Background Generator 的输入框放的是正中那张通用图的提示词，和工具无关。
       只有本页专属素材、或切题(主题 / PREFER)的素材的提示词才放进输入框，否则用工具自己的提示词模板 */
    const ownSrc = new Set(pageMedia(t.slug).map((p) => p.src));
    const fits = (p?: Pic) => !!p?.prompt && (ownSrc.has(p.src) || (themed ? themed(p) : PREFER[t.slug] ? PREFER[t.slug].test(p.alt ?? "") : true));
    const fu = HERO_FEATURE[t.slug]?.()?.used.find((p) => p.prompt); /* 单画面首屏：用这条主画面自己的提示词 */
    const lead = fu ?? [hero[2], ...hero].find(fits); /* 单画面首屏：输入框放那条视频自己的提示词 */ /* 正中那张优先(和模型页一致，长提示词也照放，框里可滚动) */
    return withUrl(lead?.prompt ?? t.prompt.replace(/\[|\]/g, ""));
  });
  /* 账本每次渲染重建(下面按顺序取图，渲染多次结果一样) */
  const L = reserveRows(pageLedger());
  hero.forEach(L.mark);
  const feature = HERO_FEATURE[t.slug]?.();
  feature?.used.forEach(L.mark);
 
  const pinned = STEP_PIC[t.slug] ? byFile(STEP_PIC[t.slug]) : undefined; /* 第 3 步指定素材先登记，示例区不再拿 */
  if (pinned) L.mark(pinned);
  /* 2026-11-27 首屏拿走了「What is…」行的素材 → 先给那一行留一条本页经 MCP 做的视频(在示例区拿光之前) */
  const heroRowAlt = HERO_SPLIT.has(t.slug) ? L.take([...(t.media ? [{ kind: t.media.kind, src: t.media.src, poster: t.media.poster, aspect: t.media.aspect, alt: t.media.alt, prompt: t.prompt.replace(/\[|\]/g, ""), source: t.media.source } as Pic] : []), ...pageMedia(t.slug).filter((x) => x.kind === "video")], 1)[0] : undefined;
  /* 2026-11-26 逐页截图审核：主题页素材少，示例区把同主题素材拿完后，How to use 第 3 步的成片卡是空的(黑卡 + 加号)。先给第 3 步留一条同主题素材 */
  const stepReserve = themed ? L.take(pool.filter((p) => p.kind !== "audio"), 1)[0] : undefined;
  const xStepReserve = themed && t.extra ? L.take(pool.filter((p) => p.kind === "image"), 1)[0] ?? L.take(pool.filter((p) => p.kind !== "audio"), 1)[0] : undefined; /* 第二套步骤(照片换脸)也留一条，不和第一套用同一张 */
  /* 2026-11-27 审图：三个音频工具页共用同一批 LUMEA 产品图，和配音 / 播客 / 音效对不上 → 改用真人对镜头说话、播客、录音类视频(按页面 slug 错开起点) */
  const visualPool = type === "audio" ? (() => { const v = allPics().filter((p) => p.kind === "video" && (TALKING.test(p.alt ?? "") || /\b(podcast|microphone|studio|singer|sings|voice|narrat\w*|music|band|guitar)\b/i.test(p.alt ?? ""))); let h = 0; for (const c of t.slug) h = (h * 31 + c.charCodeAt(0)) >>> 0; const k = v.length ? h % v.length : 0; return [...v.slice(k), ...v.slice(0, k)]; })() : pool.filter((p) => p.kind !== "audio");

  /* 示例分类：全部 + 每个有成片的模型 */
  const tabs = (() => {
    /* 2026-11-27 审图：图片工具页示例区仍是通用图(Zero sugar、LUMEA)→ 切题素材够 4 张时示例区只放切题的 */
    const onTopic = PREFER[t.slug] ? [...pool, ...preferPool(t.slug, type)].filter((p, i, a) => a.findIndex((q) => q.src === p.src) === i && PREFER[t.slug].test(p.alt ?? "") && p.prompt && !L.has(p)) : [];
    const withPrompt = onTopic.length >= 4 ? spreadSubjects(onTopic) : preferFirst(t.slug, spreadSubjects(pool.filter((p) => (p.prompt || p.kind === "audio") && !L.has(p))));
    const byModel = new Map<string, Pic[]>();
    for (const p of withPrompt) if (p.model) byModel.set(p.model, [...(byModel.get(p.model) ?? []), p]);
    const firstTab = { label: "All", pics: withPrompt.slice(0, 14) };
    const out = [firstTab, ...[...byModel.entries()].filter(([, v]) => v.length > 1).slice(0, 5).map(([label, pics]) => ({ label, pics }))];
    for (const x of out) x.pics.forEach(L.mark);
    return out;
  })();

  /* 功能段 / 用途段 / 卡片配图：同一页不重复(首屏拼贴之外的放前面，不够再循环) */
  const next = () => L.take(visualPool, 1)[0];
  /* 2026-11-25 功能行优先用本页的前后对比(page-media.ts 的 PAGE_COMPARE),按行的顺序取;没有就用单张图 */
  /* 2026-11-25 逐行配图：page-media.ts 的 PAGE_ROWS 按行给对比或单张素材，没有的行照旧 */
  let rowAt = 0;
  /* 2026-11-26 Monica 在 AI Video Generator 的「Brand films」「YouTube Shorts and TikTok」行:「要配视频，找个视频配过来」
     「这个也要配视频，排版一个，放不同尺寸的视频在卡片里，看看其他页面有没有要改」——
     视频类工具页(Video / Ads / Avatar)的图文行，原来配的单张静图一律换成本页没用过的视频(按行标题和视频描述的词重合度挑);
     讲竖屏 / 社媒投放的行(Shorts、TikTok、Reels、vertical…)换成一张卡里放 9:16 / 1:1 / 16:9 三条视频。前后对比(图→视频)保留 */
  const WORDS = (x: string) => new Set(x.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const videoPool = visualPool.filter((p) => p.kind === "video");
  /* 2026-11-26 审核：原来词重合 0 个也会硬配一条视频(「Hook testing」配了打铁、「Docs to explainer」配了 ASMR 开箱)。
     本页这一行已有专属静图时，只有找到足够切题的视频(实词重合 ≥ min)才换，否则保留静图 */
  const STOP = new Set("with from that this your video videos make made makes they into each every same also when then than more most need needs like have such onto over model models buzzvideo seedance kling minimax what which best does where using used uses first image images photo photos shot shots clip clips product products brand brands".split(" "));
  const pickVideo = (topic: string, min = 0) => {
    const want = new Set([...WORDS(topic)].filter((w) => !STOP.has(w)));
    let best: Pic | undefined;
    let score = -1;
    for (const v of videoPool) {
      if (L.has(v)) continue;
      const have = WORDS(min ? v.alt ?? "" : `${v.alt ?? ""} ${v.prompt ?? ""}`); /* 要替换现成静图时只看素材说明(长提示词随便都能撞上两个词) */
      let n = 0;
      want.forEach((w) => have.has(w) && n++);
      if (n > score) (best = v), (score = n);
    }
    if (score < min) return undefined;
    if (best) L.mark(best);
    return best;
  };
  const SOCIAL = /\b(shorts|tiktok|reels|vertical|9:16|social|stories|instagram)\b/i;
  const media = (pick: () => Pic | undefined, topic = "") => {
    const i = rowAt++;
    const node = ROW_NODE[t.slug]?.[i];
    if (node) return <div className="aspect-video [container-type:inline-size]">{node()}</div>;
    const swap = TOPIC_SWAP[t.slug]?.find(([re]) => re.test(topic))?.[1]() ?? ROW_SWAP[t.slug]?.[i]?.();
    const m0 = swap === PICK ? null : swap ?? rowMedia[i];
    /* 已经搬到首屏的素材这一行不再重复：换本页自己做的(经 MCP 生成的)没用过的素材 */
    const m = m0 && feature?.used.some((u) => u.src === (isPair(m0) ? m0.after.src : m0.src)) ? heroRowAlt ?? null : m0;
    /* 主题页本页专属的静图(换脸图、动漫图)本身就切题，保留;只给空行补主题视频 */
    if (type === "video" && !(swap && swap !== PICK) && !(m && isPair(m)) && (!m || (m.kind === "image" && !(themed && m))) && !m?.inset) {
      if (SOCIAL.test(topic)) {
        const vs = [pickVideo(topic), pickVideo(topic), pickVideo(topic)].filter((x): x is Pic => !!x);
        if (vs.length === 3) return <div className="aspect-video"><RatioCollage pics={vs} /></div>;
      }
      const v = pickVideo(topic, m && t.slug !== "ai-video-generator" ? 2 : 0); /* AI Video Generator 那页 Monica 看过、指定要视频，照旧 */
      if (v) return <div className="aspect-video"><PicView p={v} /></div>;
    }
    const p = m ? undefined : pick();
    /* 2026-11-26 Monica:功能行配图统一 16:9(原 4:3) */
    /* 这一行什么都没分到时(主题页素材池空了)用全站同类素材补，不留空框 */
    const last = !m && !p ? L.take(allPics().filter((x) => x.kind === (type === "image" ? "image" : "video")), 1)[0] : undefined;
    return <div className="aspect-video">{m && isPair(m) ? <OACompare {...m} /> : m ? <PicView p={m} /> : p ? <PicView p={p} /> : last ? <PicView p={last} /> : null}</div>;
  };
  const models = t.models.map((s) => modelEntry(s)).filter((m): m is NonNullable<typeof m> => !!m);

  const rows: OARow[] = [
    { key: "what", title: t.definition.q, body: t.definition.a, media: media(next, `${t.definition.q} ${t.definition.a}`), cta: { label: "Try it now", link: toTool(t.name) } },
    /* 底层模型不在模型清单里(SeedVR、MCP Skill 现场选模型等)时不显示这一行 */
    ...(models.length ? [{
      key: "models",
      title: `Runs on ${models.slice(0, 3).map((m) => m.name).join(", ")}`,
      body: (
        <>
          {t.mode === "marketing" ? "The Marketing Agent picks the model for each shot, or you choose one yourself. " : "Pick the model next to the prompt. "}
          {models.slice(0, 3).map((m, i) => (
            <span key={m.slug}>
              <a {...a(m.name, modelHref(m.slug))} className="font-semibold text-white underline decoration-[#FF744D] decoration-2 underline-offset-4">
                {m.name}
              </a>{" "}
              {m.desc.charAt(0).toLowerCase() + m.desc.slice(1)}
              {i < Math.min(3, models.length) - 1 ? "; " : "."}
            </span>
          ))}
        </>
      ),
      media: media(next, `${t.name} ${models.map((m) => m.desc).join(" ")}`),
      cta: { label: "Try it now", link: toTool(t.name) },
    }] : []),
    ...t.faq
      .filter((q) => !/free|cost|price|legal/i.test(q.q))
      .slice(0, 1)
      .map((q) => ({ key: "faq", title: q.q, body: q.a, media: media(next, `${q.q} ${q.a}`), cta: { label: "Try it now", link: toTool(t.name) } })),
  ];

  const sameGroup = TOOLS_CONTENT.filter((x) => x.slug !== t.slug && (x.group === t.group || t.related.includes(x.slug)));
  const rowSeen = new Set<string>();
  const ways: OACard[] = [...t.related.map(toolBySlug).filter((x): x is ToolEntry => !!x), ...sameGroup.filter((x) => !t.related.includes(x.slug))]
    .slice(0, 8)
    .map((x) => {
      /* 同一排同一主体只放一次(工具页封面里常有同一瓶 LUMEA),撞了就换下一张 */
      const cover: Pic | undefined = x.media ? { kind: x.media.kind, src: x.media.src, poster: x.media.poster, aspect: x.media.aspect, alt: x.media.alt, prompt: "", source: "" } : undefined;
      /* 2026-11-26 逐页截图审核：主题限定的页(Transparent PNG 等)素材池小，这排卡片大多分不到图，是黑卡。
         卡片讲的是「另一个工具」,优先用那个工具自己落地页的素材(也更切题),再用封面、本页素材池，最后才用全站素材补，不留黑卡 */
      const theirs = pageMedia(x.slug).filter((c) => c.kind !== "audio" && !isTextHeavy(c) && !/-before(-poster)?\./.test(c.src) && !rowSeen.has(subjectOf(c)));
      let pic = L.take(theirs, 1)[0] ?? (cover && !rowSeen.has(subjectOf(cover)) ? L.take([cover], 1)[0] : undefined);
      for (let k = 0; !pic && k < 40; k++) {
        const c = next();
        if (!c) break;
        if (!rowSeen.has(subjectOf(c))) pic = c;
      }
      if (!pic) pic = L.take(allPics().filter((c) => !rowSeen.has(subjectOf(c))), 1)[0];
      if (pic) rowSeen.add(subjectOf(pic));
      return { key: x.slug, title: x.name, desc: x.h1Tail.charAt(0).toUpperCase() + x.h1Tail.slice(1), pic, link: a(x.name, `/${x.slug}`) };
    });
  /* 2026-11-26 Monica:「没有落地页的就不推荐」—— 没有落地页或分不到图的模型卡不放(这里只列这个工具实际用到的模型，不拿别的模型凑数) */
  const modelCards: OACard[] = [];
  for (const m of models) {
    if (modelCards.length >= 3) break;
    if (MERGED[m.slug] || REMOVED.has(m.slug)) continue;
    const own0 = mediaOf(m.slug).filter((x) => x.kind !== "audio");
    const own = themed ? [...own0.filter((x) => themed(x)), ...own0.filter((x) => !themed(x))] : PREFER[t.slug] ? [...own0.filter((x) => PREFER[t.slug].test(x.alt ?? "")), ...own0] : own0; /* 2026-11-27 审图：动画页模型卡全是写实片 */
    /* 2026-11-27 审图：正文列了 3 个模型、卡片只出 1 张(其余模型的素材都被上面用完了)。本模型的素材用完时，再找全站标了这个模型的素材 */
    const s = L.take(own.filter((x) => !rowSeen.has(subjectOf(x))), 1)[0] ?? L.take(own, 1)[0] ?? L.take(allPics().filter((x) => x.modelSlug === m.slug && x.kind !== "audio"), 1)[0];
    if (!s) continue;
    rowSeen.add(subjectOf(s));
    modelCards.push({ key: m.slug, title: m.name, tag: m.vendor, desc: m.desc, meta: m.release === "v1.13" ? "Next release" : undefined /* 2026-11-26 Monica 划掉模型卡上的「From X credits」,工具页同款卡片一起去掉 */, pic: { ...s, model: m.name }, link: a(m.name, modelHref(m.slug)) });
  }

  const resultPic = pinned ?? stepReserve ?? L.take(own.filter((p) => p.kind !== "audio"), 1)[0] ?? next() ?? L.take(allPics().filter((p) => p.kind === (type === "image" ? "image" : "video")), 1)[0];
  const steps = t.steps.slice(0, 3).map((s, i) => ({
    ...s,
    visual:
      i === 0 && def ? (
        <StepPickModel m={def} siblings={MODELS.filter((x) => x.type === def.type && x.slug !== def.slug)} />
      ) : i === 1 ? (
        <StepPrompt prompt={promptFor(resultPic, t.prompt.replace(/\[|\]/g, ""))} chips={[def?.name ?? MODE_LABEL[t.mode]]} /> /* 2026-11-27 逐页审图：第 2 步提示词和第 3 步成片对不上 → 用那条成片自己的提示词 */
      ) : def ? (
        <StepResult sample={resultPic} m={def} from={from} />
      ) : i === 0 ? (
        /chatgpt/.test(t.slug) ? <StepConnect url="BuzzVideo" label="Plugins directory" client="ChatGPT" /> : /mcp|claude/.test(t.slug) ? <StepConnect url="https://mcp.buzzvideo.ai/mcp" /> : <StepPrompt prompt={t.prompt.replace(/\[|\]/g, "")} chips={["Product photo", "Brief"]} />
      ) : (
        <StepChatReply sample={resultPic} ask={t.prompt.replace(/\[|\]/g, "")} reply={t.mode === "marketing" ? "Done. Here's your video, made with Seedance 2.5." : "Here's your video."} />
      ),
  }));

  const uses: OARow[] = t.uses.map((u) => ({ key: u.title, title: u.title, body: u.body, media: media(next, `${u.title} ${u.body}`), cta: { label: `Try ${t.name}`, link: toTool(t.name) } }));
  /* 2026-11-26 第二种用法的完整一块(ai-face-swap 的照片换脸):步骤 + 用途 + FAQ;用途行接着用本页 PAGE_ROWS 后面的素材 */
  const x = t.extra;
  const xModel = x ? modelEntry(x.model) : undefined;
  const xUses: OARow[] = x ? x.uses.map((u) => ({ key: u.title, title: u.title, body: u.body, media: media(next, `${u.title} ${u.body}`), cta: { label: "Try it now", link: toTool(t.name) } })) : [];
  const xResult = x ? xStepReserve ?? L.take(own.filter((p) => p.kind === "image"), 1)[0] ?? next() ?? L.take(allPics().filter((p) => p.kind === "image"), 1)[0] : undefined;
  const xSteps = x
    ? x.steps.slice(0, 3).map((s, i) => ({
        ...s,
        visual:
          i === 0 && xModel ? (
            <StepPickModel m={xModel} siblings={MODELS.filter((m) => m.type === xModel.type && m.slug !== xModel.slug)} />
          ) : i === 1 ? (
            <StepPrompt prompt={promptFor(xResult, x.prompt.replace(/\[|\]/g, ""))} chips={[xModel?.name ?? "Image"]} />
          ) : xModel ? (
            <StepResult sample={xResult} m={xModel} from={fromCreditsOf(xModel.slug)} />
          ) : null,
      }))
    : [];
  /* 相关工具标签 = 导航同一菜单里的全部功能(含新功能;Soon 的照样标出) */
  const menu = HEADER.find((h) => h.label === ({ Ads: "Agent", Video: "Video", Image: "Image", Audio: "Audio", Avatar: "Video" } as const)[t.group]);
  const chipLinks = [...(menu?.tiles ?? []), ...(menu?.groups?.[0]?.links ?? [])].filter((l, i, arr) => l.href !== `/${t.slug}` && arr.findIndex((x) => x.href === l.href) === i);
  const chips = (chipLinks.length ? chipLinks : TOOLS_HUB_GROUPS[1].links).slice(0, 24).map((l) => ({
    label: l.label,
    link: a(l.label, l.href, l.status),
    soon: l.badge === "Soon",
  }));
  const kind = t.group === "Image" ? "image" : t.group === "Audio" ? "audio" : "video";
  /* 2026-11-25 音频工具页照 ElevenLabs 单独做首屏和声音板块(../audio/AudioLanding.tsx);示例拼贴和品牌色底卡片去掉，下面的 SEO 段不变 */
  const audioKind = t.group === "Audio" ? audioKindOf(t.slug) : undefined;

  return (
    <main className="bg-black text-white">
      {/* 2026-11-19 Monica:落地页都是一级页面，不放面包屑 */}

      {audioKind ? (
        <AudioLanding
          slug={t.slug}
          kind={audioKind}
          title={t.h1}
          lead={t.lead}
          chip={
            t.soon ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
                <span className="size-1.5 rounded-full bg-[#FFA73C]" />
                Coming soon
              </span>
            ) : undefined /* 2026-11-26 Monica 划掉首屏「Powered by …」小标签 */
          }
          cta={{ label: t.soon ? "Get notified" : "Create now", onClick: () => enterTool(t.name) }}
          price={from !== undefined ? `${from} credits / s` : undefined}
          model={def?.name ?? MODE_LABEL[t.mode]}
          tags={supportsTags(t.models[0])}
          prompt={audioKind === "voice" ? undefined : t.prompt.replace(/\[|\]/g, "")}
          onPrompt={setPromptUrl}
        />
      ) : t.slug === "marketing-agent" ? (
        <MarketingAgentHero title={t.h1} lead={t.lead} onStart={() => enterTool(t.name)} />
      ) : (
      <OAHero
          onPrompt={setPromptUrl}
          chip={
            t.soon ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
                <span className="size-1.5 rounded-full bg-[#FFA73C]" />
                Coming soon
              </span>
            ) : undefined /* 2026-11-26 Monica 划掉首屏「Powered by …」小标签 */
          }
          title={t.h1}
          lead={t.lead}
          pics={hero}
          feature={feature?.node}
          split={HERO_SPLIT.has(t.slug)}
          box={
            <OAPromptBox onSubmit={() => enterTool(t.name)}>
              <label htmlFor="tool-prompt" className="sr-only">
                Prompt for {t.name}
              </label>
              {/* 一直可编辑;固定三行高，长提示词在框里滚动(和模型页一样)。首屏不再给 [占位] 标橙框 */}
              <textarea
                id="tool-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                spellCheck={false}
                rows={3}
                className="block h-[84px] w-full resize-none bg-transparent px-1 text-[16px] leading-relaxed text-white caret-white [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin] selection:bg-[#FF744D]/30 focus:outline-none"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {ATTACH[t.mode] && (
                  <a {...toTool(ATTACH[t.mode]!)} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12.5px] font-semibold text-[#E8E8E8] transition hover:bg-white/15">
                    <Plus className="size-3.5" /> {ATTACH[t.mode]}
                  </a>
                )}
                <span className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#240A03]">{def?.name ?? MODE_LABEL[t.mode]}</span>
                <span className="ml-auto flex items-center gap-3">
                  <button type="submit" className={OA_CTA}>
                    {t.soon ? "Get notified" : "Create now"}
                  </button>
                </span>
              </div>
            </OAPromptBox>
          }
        />
      )}

      {!audioKind && tabs[0].pics.length > 0 && (
        <OAExamples
          title={`Explore ${t.name} examples and prompts`}
          sub={`See what marketers and creators make with BuzzVideo's ${t.name.replace(/^AI /, "AI ")}. Every example below was generated on BuzzVideo; hover to read the prompt, then try it or write your own.`}
          tabs={tabs}
          onUse={(p) => openWithPrompt(`/${t.slug}`, p, t.name, onLink)}
        />
      )}

      {/* 2026-11-26 Monica 定的顺序(和模型页一致):示例 → Key features → How to use → Best uses → 更多工具 / 模型 → FAQ → 博客 → Explore → CTA */}
      <OAFeatureRows
        id="features"
        title={`Key ${t.name} features`}
        sub={`Create, edit and finish ${kind === "audio" ? "audio" : kind === "image" ? "images" : "videos"} for ads in one place. ${models.length > 1 ? `${models.slice(0, 4).map((m) => m.name).join(", ")} all run on the same BuzzVideo account and credits.` : ""}`}
        rows={rows}
      />

      <OASteps title={`How to use ${/^AI /.test(t.name) ? "the " : ""}${t.name}`} steps={steps} />
      <OAFeatureRows id="uses" tone="light" title={`Best uses for ${t.name}`} rows={uses} />
      {x && (
        <>
          <OASteps id={`${x.id}-how`} title={x.title} steps={xSteps} />
          <OAFeatureRows id={`${x.id}-uses`} title={x.usesTitle} sub={x.usesSub} rows={xUses} />
          <OAFaq id={`${x.id}-faq`} title={x.faqTitle} items={x.faq} />
        </>
      )}

      {!audioKind && <OADrench
        ways={{ title: "More ways to create and edit", cards: ways }}
        models={modelCards.length === 0 ? undefined : {
          title: `Top AI models behind BuzzVideo's ${t.name}`,
          sub: "BuzzVideo gives you the leading models in one place, not one provider's look. Pick the model that fits the job; you see the credit price before you create.",
          cards: modelCards,
        }}
      />}

      <OAFaq items={[t.definition, ...t.faq]} />
      <OABlog posts={postsFor(TOPIC_OF[t.group], 3, L.srcs)} all={a("Blog", "/blog", "live")} link={(p) => a(p.title, p.href, "live")} />
      <OAChips title={`Explore AI ${kind} tools`} chips={chips} />
      <OACta title={t.soon ? `Be first to try ${t.name}` : freeOk ? `Try ${t.name} with ${SIGNUP_CREDITS} free credits` : "Create without limits"} sub="Make video, image and audio ads with the leading AI models on one BuzzVideo account." cta={{ label: t.soon ? "Get notified at launch" : "Get started for free", link: toTool(t.name) }} />

      {/* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */}
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: `BuzzVideo ${t.name}`,
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              description: t.lead,
              dateModified: CONTENT_UPDATED,
              publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
            },
            { "@context": "https://schema.org", "@type": "HowTo", name: `How to use ${t.name} on BuzzVideo`, step: t.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [t.definition, ...t.faq, ...(t.extra?.faq ?? [])].map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
            ...own
              .filter((p) => p.kind !== "audio")
              .slice(0, 6)
              .map((p) => ({
                "@context": "https://schema.org",
                "@type": p.kind === "video" ? "VideoObject" : "ImageObject",
                name: p.alt,
                description: p.model ? `Made with ${p.model} on BuzzVideo.` : "Made on BuzzVideo.",
                contentUrl: p.src.startsWith("http") ? p.src : `https://buzzvideo.ai${p.src}`,
                ...(p.kind === "video" ? { thumbnailUrl: p.poster ? `https://buzzvideo.ai${p.poster}` : undefined, uploadDate: "2026-11-19" } : {}),
                creator: { "@type": "Organization", name: "BuzzVideo AI" },
              })),
          ]),
        }}
      />
    </main>
  );
}
