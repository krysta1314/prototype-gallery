/* 核对模型落地页的进产品按钮(2026-11-26 Monica:「每个落地页根据自己的模型，去掉 marketing agent / video gen / image gen / audio,都是选中落地页这个对应的模型」)。
   对 models-catalog 里每个有落地页的模型(不在 MERGED / REMOVED;Seedance 2.5 落地页已删，但产品映射保留，也一起核):
   按落地页按钮实际用的 appOf(modelHref(slug)) 算出产品网址，再确认生成器能按网址里的 key 选中这个模型 ——
   不能落到 Marketing Agent、默认视频 / 图片 / 音频模型。首屏 Create now、功能行 / 用途行 / 底部 CTA(toTool)和示例卡 Try this prompt(openWithPrompt)都走 appOf。
   运行：npx tsx scripts/site/check-model-cta.ts(有不通过的退出码 1) */

const B = "../../src/app/prototypes";

(async () => {
  const { MODELS } = await import(B + "/(v1.13)/site-nav/models-catalog");
  const { appOf } = await import(B + "/(v1.13)/site-nav/SiteNavHeader");
  const { modelHref } = await import(B + "/(v1.13)/site/models/model-content");
  const { MERGED, REMOVED } = await import(B + "/(v1.13)/site/redirects");
  const { MODELS: VIDEO } = await import(B + "/(v1.12)/video-gen-modes/app/capabilities");
  const { IMAGE_MODELS } = await import(B + "/(v1.12)/video-gen-modes/app/components/ImageGenComposer");
  const { modelsFor } = await import(B + "/(v1.12)/video-gen-modes/app/components/AudioGenComposer");

  const GEN = "/prototypes/video-gen-modes/home";
  const pages = MODELS.filter((m: { slug: string }) => !MERGED[m.slug] && !REMOVED.has(m.slug));
  const fails: string[] = [];
  const rows: string[] = [];
  for (const m of pages as { slug: string; name: string; type: "video" | "image" | "audio" }[]) {
    const url = appOf(modelHref(m.slug));
    const err = (why: string) => fails.push(`✗ ${m.slug.padEnd(30)} ${why}  →  ${url ?? "(none)"}`);
    if (!url) { err("没有产品网址"); continue; }
    const u = new URL(url, "http://x");
    if (u.pathname !== GEN) { err("不是生成器"); continue; }
    const q = u.searchParams;
    const type = q.get("type");
    if (type === "marketing") { err("落到 Marketing Agent"); continue; }
    if (!q.get("prompt")) { err("没带提示词"); continue; }
    let picked: string | undefined;
    if (m.type === "video") {
      if (type) { err(`视频模型却带了 type=${type}`); continue; }
      const key = q.get("model");
      picked = VIDEO.find((x: { key: string }) => x.key === key)?.label;
      if (!picked) { err(`视频生成器里没有 model=${key}`); continue; }
    } else if (m.type === "image") {
      if (type !== "image") { err(`图片模型 type=${type}`); continue; }
      const key = q.get("imageModel");
      picked = IMAGE_MODELS.find((x: { key: string }) => x.key === key)?.label;
      if (!picked) { err(`图片生成器里没有 imageModel=${key}`); continue; }
    } else {
      const kind = type === "audio" ? "voice" : type === "music" ? "music" : type === "sfx" ? "sfx" : undefined;
      if (!kind) { err(`音频模型 type=${type}`); continue; }
      const key = q.get("audioModel");
      picked = modelsFor(kind).find((x: { key: string }) => x.key === key)?.label;
      if (!picked) { err(`${type} 生成器里没有 audioModel=${key}`); continue; }
    }
    rows.push(`✓ ${m.slug.padEnd(30)} → ${picked}`);
  }
  console.log(rows.join("\n"));
  console.log(`\n${pages.length} 个模型落地页，通过 ${rows.length},不通过 ${fails.length}`);
  if (fails.length) {
    console.log(fails.join("\n"));
    process.exit(1);
  }
})();
