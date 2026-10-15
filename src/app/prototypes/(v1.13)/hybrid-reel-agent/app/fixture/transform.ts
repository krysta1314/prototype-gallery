/* 评审开关对录好的分镜做的纯数据变换。 */

import type { ClipProfile, Outline, Shot } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";

/** AI 补拍 0:每个补拍镜头换成一段可用素材(同样时长,轮流取可用片段),积分只剩基础费 */
export function withoutAiShots(outline: Outline, profiles: ClipProfile[]): Outline {
  const pool = profiles.flatMap((p, clipIndex) =>
    p.kind === "video" ? (p.segments ?? []).filter((g) => g.usable).map((g) => ({ clipIndex, start: g.start, end: g.end })) : [],
  );
  let k = 0;
  const shots: Shot[] = outline.shots.map((s) => {
    if (s.source.kind !== "generate" || !pool.length) return s;
    const seg = pool[k++ % pool.length];
    const outSec = Math.min(seg.end, seg.start + s.durationSec);
    return { ...s, source: { kind: "clip", clipIndex: seg.clipIndex, inSec: seg.start, outSec } };
  });
  return { ...outline, shots, credits: { ...outline.credits, generatedShots: 0, total: outline.credits.base } };
}

export function withVoiceover(outline: Outline, on: boolean): Outline {
  if (!outline.voiceover || outline.voiceover.on === on) return outline;
  return { ...outline, voiceover: { ...outline.voiceover, on } };
}

/** 「素材不可用」变体(评审用):从录好的素材分析改出来 —— 视频的每一段都标成不可用(第一个视频太糊,其余看不到产品),
    产品图标成不用(太糊);品牌 logo 原样。原因按回复语言写,和模型产出的 issues 一样 */
export function unusableProfiles(profiles: ClipProfile[], lang: "zh" | "en"): ClipProfile[] {
  const blurry = lang === "zh" ? "画面太糊" : "Too blurry";
  const noProduct = lang === "zh" ? "看不到产品" : "Product not visible";
  let videos = 0;
  return profiles.map((p) => {
    if (p.kind === "video") {
      const why = videos++ === 0 ? blurry : noProduct;
      return { ...p, issues: [why], segments: (p.segments ?? []).map((g) => ({ ...g, usable: false, reason: why })) };
    }
    if (p.kind === "image" && p.identity !== "brand" && p.identity !== "reference") {
      return { ...p, identity: "unused" as const, identityWhy: blurry, issues: [blurry] };
    }
    return p;
  });
}

/* 「旁白超长」开关:把录好的旁白稿换成更长的一版(按镜头下标;中英文各一套),旁白预估超过分镜时长,
   成片交付说明里能看到 Agent 提速 / 删句 / 字幕拆屏(logic/overlength.ts)。没写的镜头不变 */
const LONG_SCRIPT: Record<"zh" | "en", Record<number, string>> = {
  en: {
    1: "Your skin stays tight and flaky all day, no matter how much cream you pile on before work",
    2: "Bulky serums are impossible to carry, so your skin goes thirsty the moment you leave home",
    3: "Rellet mist sprays a perfect even fine mist anywhere, anytime, even right over your makeup",
    5: "Shop the full Rellet HA line today and grab the launch offer while it lasts",
  },
  zh: {
    1: "上妆卡粉，补水只停留在表面，脸上一整天都紧绷绷的，怎么抹面霜都不管用",
    2: "普通产品黏腻，用着麻烦还不吸收，出门在外想补水也找不到合适的办法",
    3: "颐莲喷雾开盖超简单，随时随地轻轻一喷，带妆也能补水",
    5: "点击购物车享专属限时优惠，新品上市限量发售，手慢就没有了，赶紧下单吧",
  },
};
export function withLongScript(outline: Outline, lang: "zh" | "en"): Outline {
  const long = LONG_SCRIPT[lang];
  return {
    ...outline,
    shots: outline.shots.map((s, i) => (long[i] && s.subtitle?.source === "authored" ? { ...s, subtitle: { ...s.subtitle, text: long[i] } } : s)),
  };
}
