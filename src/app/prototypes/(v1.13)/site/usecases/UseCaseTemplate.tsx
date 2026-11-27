"use client";

/* 用例 / 广告模板落地页模板(2026-11-19,v1.13 第 3 批)。一级网址 /<slug>,数据在 content/*.ts(汇总于 usecase-content.ts)。
   版式沿用工具页的 OpenArt 骨架(../oa/kit.tsx):首屏(大标题 + 一句定义 + 可编辑提示词框 + 真实成片拼贴)
     → 能做什么(左右交替，真实成片)→ 模板 = 现成提示词配方(填回首屏 / 复制)→ 示例 → 三步 → 规格(只放核实过的)
     → FAQ → 博客 → 相关页面标签 → 收尾卡。
   「模板」只是提示词，不说有模板库功能。CTA「Create now」= 带着当前提示词进最匹配的工具(appOf)。 */

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUp, Plus } from "lucide-react";
import { appOf, go, openWithPrompt, type OnLink } from "../../site-nav/SiteNavHeader";
import { allLinks, INDUSTRY_HREFS, statusOf } from "../../site-nav/nav-data";
import { MODELS } from "../../site-nav/models-catalog";
import { StepPickModel, StepPrompt, StepResult } from "../models/ModelVisuals";
import { modelHref } from "../models/model-content";
import { CopyBtn, OA_CTA, OA_WRAP, OABlog, OAChips, OACta, OAExamples, OAFaq, OAFeatureRows, OAHero, OAPanel, OAPromptBox, OASteps, PicView, type OARow, evenGrid } from "../oa/kit";
import { heroPics, pageLedger, picsOf, postsFor, spreadSubjects, type Pic, promptFor } from "../oa/pool";
import { SIGNUP_CREDITS } from "../tools/credits";
import { MEDIA, type MediaKey, type UseCase } from "./usecase-types";
import { caseBySlug } from "./usecase-content";
import { resolveHref } from "../redirects";
import { heroFill, pageMedia, PAGE_MEDIA } from "../page-media";
import { relatedPool } from "../learn/guide-media";
import { FILL2_ROWS } from "../page-media-fill2";
import { CONTENT_UPDATED } from "../content-date";

const VERIFIED = "November 23, 2026";
const ALL_PICS: Pic[] = [...picsOf("video"), ...picsOf("image")];
const picOf = (k: MediaKey): Pic | undefined => ALL_PICS.find((p) => p.src.endsWith(MEDIA[k]));
const plain = (s: string) => s.replace(/\[([^\]]+)\]/g, "$1");

/* 2026-11-26 审核：个别「能做什么」行手工指定更切题的现成素材(行序号从 0 起) */
const ROW_FIX: Record<string, Record<number, string>> = {
  "ai-video-for-creators": { 0: "/ai-b-roll-generator/what.mp4", 2: "/kling-4-0/ex-lp-paper-city.mp4" } /* B-roll you never filmed → 咖啡手冲空镜，原来是海边跑步;Scroll-stopping openers → 纸艺城市在骑车人身后展开，原来是开衫试穿 */,
  "instagram-reels": { 1: "/ai-product-video-generator/faq.mp4" } /* Cozy lifestyle scenes → 客厅点蜡烛;原来指定的圣诞蜡烛素材已下架，这一行是空框 */,
  "ai-marketing-videos": { 0: "/ai-video-for-agencies/r1.mp4", 2: "/minimax-h3/lp-poster.mp4" } /* Launch films → 冲浪品牌主片，原来是海边跑步;Event and promo teasers → 电影上映预告，原来是 KOVA 罐 */,
  /* 2026-11-27 Monica:「fitness-ads，手表又出来，你看下到底有哪些图文不符的，能在做过的素材里找到的就复用」→ 逐页核对后改的这一批(都逐帧看过画面，不只看说明) */
  "fitness-ads": { 2: "/heygen-video/ex-lp-trainer-tip.mp4" } /* Creator-style talking clips → 健身房教练对镜头讲话，原来是开手表盒 */,
  "affiliate-marketing-videos": { 0: "341502600350326784.mp4", 1: "/ai-video-for-creators/r3.mp4" } /* 桌面开箱键盘;坐着推荐洗护用品，原来是开手表盒 */,
  "ai-video-for-small-business": { 2: "338151977366118400.png" } /* Eye-catching statics → 芝士三明治静态广告，原来是耳机视频 */,
  "ai-commercials": { 0: "/ai-video-generator/ad-after.mp4" } /* Product hero films → 产品特写主片，原来是冲浪品牌片 */,
  "home-decor-ads": { 1: "/ai-video-editor/season-before.webp", 2: "/wan-3-0/wan30_candle_30s_take.mp4" } /* 夏日客厅;30 秒一镜到底，原来是拿胶片相机的男人 */,
  "tiktok-videos": { 2: "/gemini-omni-flash/lp-morph.mp4" } /* Animated visual hooks → 冰咖啡变成浪花和纸鸟，原来是雨衣女生过马路 */,
  "tiktok-shop-videos": { 1: "/seedream-5-5/ex-lp-lipstick-swatch.webp" } /* Swatches and close-ups → 口红试色图，原来是口播 */,
  "amazon-product-videos": { 2: "/grok-imagine-2-0/lp-product.webp" } /* Clean studio shots → 白底产品图，原来是客厅蜡烛 */,
  /* 2026-11-27 Monica 圈出 Mobile App Ads 三行(手表、BRIVO 罐、KOVA 罐)和第 3 步(KOVA Berry):「这几个配图不合适啊，要图文相符」→
     达人口播 = 沙发上用订阅管理 App 的用户;吉祥物 = 语言 App 的猫头鹰;动画抓眼球 = 16-bit 像素游戏画面 */
  "mobile-app-ads": { 0: "/mobile-app-ads/g2.mp4" /* 沙发上用 App 取消订阅;先试过床上那条，Monica:「这个不是手表是 mobile app」(那条其实是开手表盒) */, 1: "/mobile-app-ads/hf-h1.mp4", 2: "/minimax-h3/ex-lp-pixel-quest.mp4" },
};
/* 首屏补位题材：App 广告页专属素材不够时，只补「创作者对镜头说话 / 自拍 / App」这类，不补产品测评、开箱 */
const HERO_TOPIC: Record<string, RegExp> = { "mobile-app-ads": /^(?!.*\b(serum|unbox\w*|review\w*|sweater|scooter|mount)\b).*\b(app|selfie|creator|talks? to (the )?camera|talking to (the )?camera)\b/i };
/* 第 3 步成片指定(同上):跟着手机做健身的 App 广告 */
const STEP_FIX: Record<string, string> = {
  "mobile-app-ads": "/mobile-app-ads/hf-h4.mp4",
  /* 2026-11-27 同一批核对：第 3 步的成片也要是本页题材 */
  "fitness-ads": "/wan-3-0/ex-lp-yoga-sunrise.mp4" /* 原来是雨衣女生过马路 */,
  "home-decor-ads": "/ai-product-video-generator/faq.mp4" /* 原来是耳机礼盒 */,
  "perfume-ads": "tools/unboxing-ugc.mp4" /* 香水礼盒开箱，原来是 KOVA 罐 */,
  "restaurant-ads": "/seedance-2-0/ex-lp-smash-burger.mp4" /* 餐车汉堡广告，原来是 KOVA 罐 */,
  "tiktok-videos": "/seedance-2-0/ex-lp-bag-interview.mp4" /* 街头采访，原来是手表 */,
  "instagram-reels": "/minimax-h3/ex-lp-silk-scarf.mp4" /* 薰衣草田丝巾，原来是雨衣女生 */,
};
const EX_DEDICATED_ONLY = new Set(["real-estate-video-ads", "home-decor-ads", "supplement-ads", "perfume-ads", "mobile-app-ads", "restaurant-ads", "fashion-ads", "beverage-ads", "jewelry-ads", "fitness-ads"]);
/* 按文件名找素材：本页首屏补位表(heroFill)里的也算 */
/* 工具页前后对比里的图不在素材池里，要复用就在这登记 */
const EXTRA_PICS: Pic[] = [{ kind: "image", src: "/prototypes/site/pages/ai-video-editor/season-before.webp", aspect: "4:3", alt: "A lit candle on a coffee table in a bright summer living room", prompt: "A lit amber candle on a coffee table in front of a linen sofa, green summer trees outside the window.", source: "AIGC dev 接口 2026-11-25" }];
const siteFind = (slug: string, f: string): Pic | undefined => [...heroFill(slug), ...ALL_SITE, ...EXTRA_PICS].find((x) => x.src.endsWith(f));
const fixedPics = (slug: string): Pic[] => [...Object.values(ROW_FIX[slug] ?? {}), ...(STEP_FIX[slug] ? [STEP_FIX[slug]] : [])].map((f) => siteFind(slug, f)).filter((p): p is Pic => !!p);
/* 2026-11-26 Real Estate 页:站内房产素材只有 4 条、都在首屏，三行原来配的是蜡烛 / 产品测评 / 啤酒节海报。Monica 同意用 AIGC 补:
   Seedance 2.5 Flash 文生视频 720p(工程 ~/Desktop/官网素材工程/15-主题页素材/jobs-re.json)。这几条只给功能行和第 3 步用，不进首屏 */
const RE = "/prototypes/site/pages/real-estate-video-ads";
const re = (file: string, alt: string, prompt: string): Pic => ({ kind: "video", src: `${RE}/row-${file}.mp4`, poster: `${RE}/row-${file}.webp`, aspect: "16:9", alt, prompt, source: "AIGC v2 2026-11-26", model: "Seedance 2.5 Flash", modelSlug: "seedance-2-5-flash" });
const ROW_PICS: Record<string, { rows: Pic[]; step?: Pic }> = {
  "real-estate-video-ads": {
    rows: [
      re("interior", "A slow gimbal shot gliding into a sunlit open-plan living room", "Real estate listing video, one slow, steady gimbal shot from the entry hall into a sunlit open-plan living room with oak floors, a stone fireplace and tall garden windows. Warm afternoon light, no people."),
      re("agent", "A real estate agent talks to camera in front of a white craftsman house", "A friendly real estate agent in a navy blazer stands in front of a white craftsman house and talks to camera in a creator style: \"Here's what's happening in the neighborhood market this month.\""),
      re("openhouse", "An agent welcomes a couple at the door of a white home with balloons on the mailbox", "Photorealistic open-house promo: a white two-story suburban home on a sunny morning, balloons tied to the mailbox, a real estate agent opens the navy front door and welcomes a young couple walking up the stone path. Slow push-in from the sidewalk.") /* Monica:「真实的，不要这种不真实的风格」—— 原来是剪纸插画动画，换成实拍风 */,
    ],
    step: re("exterior", "A slow push-in on a modern two-story home at twilight", "Real estate listing video: a slow cinematic push-in toward a modern two-story home at twilight, warm light in the windows, stone path and landscaped garden."),
  },
};
const ALL_SITE: Pic[] = [...Object.values(PAGE_MEDIA).flat(), ...ALL_PICS];

/* 提示词里的 [占位] 标橙 */
function PromptPreview({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((p, i) =>
        p.startsWith("[") ? (
          <mark key={i} className="rounded-[3px] bg-[#FF744D]/20 text-white ring-1 ring-[#FF744D]/60">
            {p.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

let LABELS: Map<string, string> | null = null;
function labelOf(href: string): string {
  if (!LABELS) LABELS = new Map(allLinks().map((l) => [l.href, l.label]));
  return LABELS.get(href) ?? caseBySlug(href.slice(1))?.name ?? href.slice(1).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UseCaseTemplate({ u, onLink }: { u: UseCase; onLink: OnLink }) {
  const a = (label: string, rawHref: string, status = statusOf(resolveHref(rawHref)), href = resolveHref(rawHref)) => ({
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      go(href, status, label, onLink);
    },
  });
  const [prompt, setPrompt] = useState(u.prompt);

  /* 进工具：带上当前提示词([占位] 去括号);生成器以外的工具页不带 */
  const enterTool = (label: string, text = prompt) => {
    const base = appOf(u.tool);
    if (!base) return go(u.tool, statusOf(u.tool), label, onLink);
    if (base.startsWith("/prototypes/video-gen-modes")) {
      const url = new URL(base, window.location.origin);
      url.searchParams.set("prompt", plain(text));
      window.location.assign(url.pathname + url.search);
    } else window.location.assign(base);
  };
  const toTool = (label: string) => ({
    href: u.tool,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      enterTool(label);
    },
  });

  /* 2026-11-27 审图：Real Estate 示例里有「$2,150/mo」这类美元价格的图 → 带美元价格的素材不用 */
  const own = useMemo(() => [...pageMedia(u.slug), ...heroFill(u.slug), ...u.hero.map(picOf).filter((p): p is Pic => !!p)].filter((p) => !/\$\s?\d/.test(`${p.alt ?? ""} ${p.prompt ?? ""}`)) /* 2026-11-26 本页专属素材(含首屏补主体)排在通用挑图前，行业页首屏先放贴主题的 */, [u]); /* 2026-11-25 本页专属配图排最前 */
  const type = own[0]?.kind === "image" ? "image" : "video";
  /* 2026-11-26 Monica:「首屏不要放一样的素材，下面也不要重复」—— 「能做什么」行的图先登记，首屏每个主体一张，示例 / 步骤 / 卡片只用没出现过的 */
  const makePics = useMemo(() => u.makes.map((m) => picOf(m.pic)), [u]);
  /* 指定给功能行 / 第 3 步的素材也先登记，首屏不再重复用 */
  const reserve = (L: ReturnType<typeof pageLedger>) => (makePics.forEach((p) => p && L.mark(p)), fixedPics(u.slug).forEach(L.mark), L);
  /* 2026-11-27 Monica 在 Perfume Ads 首屏圈出绿底眼镜人像：「有 bug，绿色那个本来没有的」——
     首屏轮播取 10 张，本页专属素材(7 条香水)排完后用 u.hero 的旧清单(口红、眼镜人像)和通用素材池补位，轮到后面就出现不相关的图。
     本页专属素材(page-media 的配图 + 首屏补主体)够 5 张时，首屏只轮播专属素材，不再补位;不够 5 张的页面保持原逻辑 */
  const hero = useMemo(() => {
    const ok = (p: Pic) => p.kind !== "audio" && !/\$\s?\d/.test(`${p.alt ?? ""} ${p.prompt ?? ""}`);
    const mine = [...pageMedia(u.slug), ...heroFill(u.slug)].filter(ok);
    if (mine.length >= 5) {
      const only = heroPics(type, mine, 10, u.slug, reserve(pageLedger()), [], true);
      if (only.length >= 5) return only;
    }
    /* 专属素材不够 5 张、但这页定了补位题材(HERO_TOPIC)时，只从同题材的站内素材里补，不用旧清单和通用池 */
    const topic = HERO_TOPIC[u.slug];
    if (topic && mine.length >= 3) {
      const themed = ALL_SITE.filter((p) => p.kind === type && topic.test(p.alt ?? "") && !/\$\s?\d/.test(`${p.alt ?? ""} ${p.prompt ?? ""}`));
      const mixed = heroPics(type, mine, 8, u.slug, reserve(pageLedger()), themed, true);
      if (mixed.length >= 5) return mixed;
    }
    return heroPics(type, own, 10, u.slug, reserve(pageLedger()));
  }, [type, own, u.slug, makePics]); // eslint-disable-line react-hooks/exhaustive-deps
  const L = reserve(pageLedger());
  hero.forEach(L.mark);
  const fill = () => L.take(type === "image" ? picsOf("image") : picsOf("video"), 1)[0];
  /* 2026-11-26 审核：① 每个方案 / 行业页「How to make…」第 3 步都配同一条演唱会长镜头(本页素材被首屏用完后退回通用池第一条);
     ② 「What … can AI make」三行的配图是早期从很小的素材表里挑的，常和这一行讲的对不上(Creators 页配了啤酒节海报)。
     改成按文字找全站最切题的素材(只看素材说明里的实词重合),找不到够切题的才用原来的 */
  /* 只在本页相关的落地页(related + 进入的工具页)素材里找，跨得太远的不要 */
  const SITE_POOL = useMemo(() => relatedPool([u.tool, ...u.related]).filter((p) => p.kind === type), [u, type]);
  const STOP = new Set("with from that this your video videos make made makes they into each every same also when then than more most need needs like have such onto over model models buzzvideo what which best does where using used uses first image images photo photos shot shots clip clips product products brand brands them their there these those will without about before after just only".split(" "));
  const wordsOf = (x: string) => new Set((x.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w)));
  const scoreOf = (p: Pic | undefined, want: Set<string>) => {
    if (!p) return -1;
    const have = wordsOf(p.alt ?? "");
    let n = 0;
    want.forEach((w) => (have.has(w) || have.has(`${w}s`) || have.has(w.replace(/s$/, ""))) && n++);
    return n;
  };
  const bestFor = (topic: string, min: number, current?: Pic): Pic | undefined => {
    const want = wordsOf(topic);
    let best: Pic | undefined;
    let score = Math.max(min - 1, scoreOf(current, want));
    for (const p of SITE_POOL) {
      if (L.has(p)) continue;
      const n = scoreOf(p, want);
      if (n > score) (best = p), (score = n);
    }
    return best && L.mark(best);
  };
  const model = MODELS.find((m) => m.slug === u.model);

  const rows: OARow[] = u.makes.map((m, i) => {
    const fixed = ROW_FIX[u.slug]?.[i];
    const forced = fixed ? siteFind(u.slug, fixed) : undefined;
    /* 2026-11-27 审图：BEER FESTIVAL 海报(插画，非写实)和 LUMEA 精华被当成万能图，出现在 Creators / Mobile App / TikTok / Perfume / Jewelry / Supplement 等页。
       不是讲活动 / 护肤的页面，这两类原定配图作废，按文字重新找 */
    const offTopic = (q?: Pic) => !!q && ((/beer festival|comic-style/i.test(q.alt ?? "") && !/event|festival|restaurant/.test(u.slug)) || (/\b(lumea|serum)\b/i.test(q.alt ?? "") && !/skincare|beauty|ugc/.test(u.slug)));
    const planned = offTopic(makePics[i]) ? undefined : makePics[i];
    const p = ROW_PICS[u.slug]?.rows[i] ?? (FILL2_ROWS[u.slug]?.rows[i] ? L.mark(FILL2_ROWS[u.slug].rows[i]!) : undefined) ?? (forced && L.mark(forced)) ?? bestFor(`${m.title} ${m.body}`, planned ? 2 : 1, planned) ?? planned ?? bestFor(`${m.title} ${m.body}`, 0) /* 原来指定的素材已下架或作废时不留空框 */;
    return {
      key: m.title,
      title: m.title,
      body: m.body,
      media: <div className="aspect-video">{p ? <PicView p={p} /> : null}</div> /* 2026-11-26 Monica:功能行配图统一 16:9 */,
      cta: { label: "Create now", link: toTool(u.toolName) },
    };
  });

  /* 示例：本页挑的成片 + 「能做什么」用到的成片(去重) */
  /* 2026-11-27 Monica 同意换掉示例区不切题的素材：行业页 / App 页的示例只放本页专属素材;早期通用清单(u.hero)里的口红口播、眼镜人像、精华礼盒、擦咖啡渍这些
     不再混进来(香水页混了口红和眼镜，家居页混了精华礼盒)。剩下不到 4 条时整个示例区不显示，和餐厅 / 时装 / 饮料 / 珠宝 / 健身页一致 */
  const dedicated = new Set([...pageMedia(u.slug), ...heroFill(u.slug)].map((p) => p.src));
  const exPool = EX_DEDICATED_ONLY.has(u.slug) ? own.filter((p) => dedicated.has(p.src)) : own;
  const examples = L.take(spreadSubjects(exPool), 99);

  const firstRecipe = u.recipes[0]?.prompt ?? u.prompt;
  const stepPic = ROW_PICS[u.slug]?.step ?? FILL2_ROWS[u.slug]?.step ?? (STEP_FIX[u.slug] ? siteFind(u.slug, STEP_FIX[u.slug]) : undefined) ?? L.take(own, 1)[0] ?? SITE_POOL.find((p) => !L.has(p) && L.mark(p)) ?? fill();
  const steps = u.steps.slice(0, 3).map((s, i) => ({
    ...s,
    visual:
      i === 0 && model ? (
        <StepPickModel m={model} siblings={MODELS.filter((x) => x.type === model.type && x.slug !== model.slug)} />
      ) : i === 1 ? (
        <StepPrompt prompt={promptFor(stepPic, plain(firstRecipe))} chips={[model?.name ?? u.toolName]} />
      ) : model ? (
        <StepResult sample={stepPic} m={model} />
      ) : null,
  }));

  const applyRecipe = (p: string) => {
    setPrompt(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* 2026-11-25 Footer 精简到约 100 个后，行业页不再全部进 Footer:每个行业页在「相关」里多带后面两个行业，保证都有正文内链 */
  const at = INDUSTRY_HREFS.indexOf("/" + u.slug);
  const siblings = at < 0 ? [] : [1, 2].map((k) => INDUSTRY_HREFS[(at + k) % INDUSTRY_HREFS.length]).filter((h) => !u.related.includes(h));
  const chips = [...u.related, ...siblings].map((href) => ({ label: labelOf(href), link: a(labelOf(href), href) }));
  const faqs = [u.definition, ...u.faq];

  return (
    <main className="bg-black text-white">
      <OAHero
        onPrompt={setPrompt}
        chip={
          model ? (
            <a {...a(model.name, modelHref(model.slug))} className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10 transition hover:bg-white/[0.12]">
              <span className="size-1.5 rounded-full bg-[#FF744D]" />
              {u.chip}
              <ArrowRight className="size-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
              <span className="size-1.5 rounded-full bg-[#FF744D]" />
              {u.chip}
            </span>
          )
        }
        title={u.h1}
        lead={u.lead}
        pics={hero}
        box={
          <OAPromptBox onSubmit={() => enterTool(u.toolName)}>
            <label htmlFor="usecase-prompt" className="sr-only">
              Prompt for {u.name}
            </label>
            <div className="relative min-h-[84px] px-1 text-[16px] leading-relaxed">
              <div aria-hidden className="pointer-events-none whitespace-pre-wrap break-words text-white">
                <PromptPreview text={prompt} />
                {"​"}
              </div>
              <textarea
                id="usecase-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 size-full resize-none overflow-hidden bg-transparent text-transparent caret-white selection:bg-[#FF744D]/30 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a {...toTool("Add product photo")} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12.5px] font-semibold text-[#E8E8E8] transition hover:bg-white/15">
                <Plus className="size-3.5" /> Add product photo
              </a>
              <span className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#240A03]">{u.toolName}</span>
              <span className="ml-auto">
                <button type="submit" className={OA_CTA}>
                  Create now <ArrowUp className="size-4" />
                </button>
              </span>
            </div>
          </OAPromptBox>
        }
      />

      {u.hub && <HubGrid u={u} a={a} pick={(c) => (c && L.take([c], 1)[0]) || fill()} />}

      {/* 2026-11-26 和模型页、工具页同一套顺序(Monica 定):示例 → 能做什么 → 怎么做 → 模板(提示词)→ 规格 → FAQ */}
      {examples.length >= 4 && (
        <OAExamples
          title={`${u.name} examples made on BuzzVideo`}
          sub="Every clip and image below was generated on BuzzVideo. Hover a card to read its prompt when one is attached, then try it or start from a template below."
          tabs={[{ label: "All", pics: examples }]}
          onUse={(p) => enterTool(u.toolName, p)}
        />
      )}

      {rows.length > 0 && <OAFeatureRows id="make" title={u.makeTitle} sub={u.makeSub} rows={rows} />}

      <OASteps title={u.stepsTitle} steps={steps} />

      {u.recipes.length > 0 && (
        <OAPanel
          id="templates"
          title={u.recipesTitle}
          sub={
            <>
              {u.recipesSub} Each template is a prompt: swap the <span className="rounded-[3px] bg-[#FF744D]/20 px-1 text-white ring-1 ring-[#FF744D]/60">highlighted</span> parts for your own product, then create.
            </>
          }
        >
          <ul className={evenGrid(u.recipes.length).wrap}>
            {u.recipes.map((r, ri) => (
              <li key={r.name} className={`flex flex-col rounded-[20px] bg-white/[0.05] p-5 ring-1 ring-white/[0.08] ${evenGrid(u.recipes.length).item(ri)}`}>
                <h3 className="text-[18px] font-extrabold leading-snug">{r.name}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#CACACA]">{r.bestFor}</p>
                <p className="mt-4 flex-1 rounded-[14px] bg-black/50 p-4 text-[14.5px] leading-relaxed text-white/90 ring-1 ring-white/[0.06]">
                  <PromptPreview text={r.prompt} />
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyRecipe(r.prompt)} className="rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#240A03] transition hover:bg-[#FFF3EC]">
                    Use this template
                  </button>
                  <CopyBtn text={r.prompt} />
                </div>
              </li>
            ))}
          </ul>
        </OAPanel>
      )}

      {u.specs && (
        <OAPanel id="specs" title={u.specs.title} sub={u.specs.sub}>
          <dl className="divide-y divide-white/[0.08] overflow-hidden rounded-[20px] bg-white/[0.05] ring-1 ring-white/[0.08]">
            {u.specs.rows.map((r) => (
              <div key={r.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_1.4fr] sm:gap-6">
                <dt className="text-[15px] font-bold">{r.label}</dt>
                <dd className="text-[15px] text-[#CACACA]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </OAPanel>
      )}

      <OAFaq items={faqs} />
      <OABlog posts={postsFor(u.blogTopic, 3, L.srcs)} all={a("Blog", "/blog", "live")} link={(p) => a(p.title, p.href, "live")} />
      {chips.length > 0 && <OAChips title={u.kind === "template" ? "More ad templates and tools" : "Related use cases and tools"} chips={chips} />}
      <OACta
        title={u.ctaTitle}
        sub={`New accounts get ${SIGNUP_CREDITS} free credits for Seedream images and Seed Audio voiceovers; video models are on the Starter, Pro and Ultra plans.`}
        cta={{ label: "Get started for free", link: toTool(u.toolName) }}
      />

      {/* 2026-11-25 Monica:「落地页都不要放这个」—— 页面底部不再显示数据来源说明;外部来源仍留在结构化数据里 */}
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": u.hub ? "CollectionPage" : "WebPage",
              name: u.h1,
              description: u.lead,
              url: `https://buzzvideo.ai/${u.slug}`,
              dateModified: CONTENT_UPDATED,
              publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" },
            },
            ...(u.recipes.length
              ? [
                  {
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    name: u.recipesTitle,
                    itemListElement: u.recipes.map((r, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "CreativeWork", name: r.name, text: r.prompt } })),
                  },
                ]
              : []),
            { "@context": "https://schema.org", "@type": "HowTo", name: u.stepsTitle, step: u.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
            ...own
              .slice(0, 4)
              .map((p) => ({
                "@context": "https://schema.org",
                "@type": p.kind === "video" ? "VideoObject" : "ImageObject",
                name: p.alt,
                description: p.model ? `Made with ${p.model} on BuzzVideo.` : "Made on BuzzVideo.",
                contentUrl: p.src.startsWith("http") ? p.src : `https://buzzvideo.ai${p.src}`,
                ...(p.kind === "video" ? { thumbnailUrl: p.poster ? (p.poster.startsWith("http") ? p.poster : `https://buzzvideo.ai${p.poster}`) : undefined, uploadDate: "2026-11-23" } : {}),
                creator: { "@type": "Organization", name: "BuzzVideo AI" },
              })),
          ]),
        }}
      />
    </main>
  );
}

/* 模板总页：按类型 / 平台 / 节日分组列出全部模板页 */
function HubGrid({ u, a, pick }: { u: UseCase; pick: (c?: Pic) => Pic | undefined; a: (label: string, href: string) => { href: string; onClick: (e: React.MouseEvent) => void } }) {
  if (!u.hub) return null;
  return (
    <section id="all-templates" className="scroll-mt-28 py-20 md:py-28">
      <div className={OA_WRAP}>
        <h2 className="font-bold leading-[1.2] tracking-[-0.01em] [text-wrap:balance] text-[clamp(28px,2.8vw,40px)]">{u.hub.title}</h2>
        <p className="mt-5 max-w-[60rem] text-[18px] leading-[28px] text-[#CACACA]">{u.hub.sub}</p>
        <div className="mt-12 space-y-14">
          {u.hub.groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-[22px] font-extrabold">{g.title}</h3>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {g.slugs
                  .map((s) => caseBySlug(s))
                  .filter((x): x is UseCase => !!x)
                  .map((x) => {
                    const c = picOf(x.hero[0]);
                    const p = pick(c);
                    return (
                      <li key={x.slug}>
                        <a {...a(x.name, `/${x.slug}`)} className="group block h-full overflow-hidden rounded-[20px] bg-white/[0.05] ring-1 ring-white/[0.08] transition hover:-translate-y-1">
                          <div className="aspect-[4/5] overflow-hidden bg-[#111]">{p && <PicView p={p} className="transition duration-500 group-hover:scale-[1.04]" />}</div>
                          <div className="p-4">
                            <p className="text-[16px] font-bold">{x.name}</p>
                            <p className="mt-1 text-[13.5px] text-[#CACACA]">{x.recipes.length} copy-ready prompts</p>
                          </div>
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
