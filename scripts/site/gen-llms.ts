/* 生成官网原型的 llms.txt(2026-11-26 SEO 审核：旧文件手写，104 个链接指向已删页、漏了 31 个现行页)。
   数据全部取自代码里的现行页面：工具(TOOLS_CONTENT)、模型(MODELS 去掉 MERGED)、指南 / 榜单 / 方案(各 meta.ts),
   删除和合并的页(site/redirects.ts)、解答页(改做博客)不收。
   运行：npx tsx scripts/site/gen-llms.ts  → 写 public/prototypes/site/llms.txt */
import { writeFileSync } from "node:fs";

const B = "../../src/app/prototypes/(v1.13)";
const SITE = "https://buzzvideo.ai";

(async () => {
  const { TOOLS_CONTENT } = await import(B + "/site/tools/tool-content");
  const { MODELS } = await import(B + "/site-nav/models-catalog");
  const { modelPageData, modelHref } = await import(B + "/site/models/model-content");
  const { MERGED, REMOVED } = await import(B + "/site/redirects");
  const { META: GUIDES } = await import(B + "/site/guides/meta");
  const { META: COMPARE } = await import(B + "/site/compare/meta");
  const { META: USECASES } = await import(B + "/site/usecases/meta");
  const { META: FREE } = await import(B + "/site/free/meta");
  const { FOOTER_TAGLINE } = await import(B + "/site-nav/SiteFooter").catch(() => ({ FOOTER_TAGLINE: undefined as string | undefined }));

  const live = (slug: string) => !MERGED[slug] && !REMOVED.has(slug);
  const strip = (t: string) => t.replace(/ \| BuzzVideo$/, "");
  const line = (title: string, href: string, desc: string) => `- [${strip(title)}](${SITE}${href}): ${desc}`;
  const out: string[] = [];
  const section = (h: string, rows: string[]) => { if (rows.length) out.push(`${h}\n`, ...rows, ""); };

  out.push(
    "# BuzzVideo\n",
    `> ${FOOTER_TAGLINE ?? "BuzzVideo is an AI ad generator for marketers and creators. Its Marketing Agent turns a product photo, link or idea into campaign-ready video and image ads, using leading models such as Seedance, Kling, Nano Banana and GPT Image in one place."}\n`,
    "New accounts get 500 free credits, usable on Seedream 4.5, Seedream 5.0 lite, Seed Audio 1.0 and the image upscaler; video generation needs a Starter, Pro or Ultra plan. Work made on the Free plan carries a watermark; paid plans remove it. Everything you generate can be used commercially. BuzzVideo MCP (https://mcp.buzzvideo.ai/mcp) lets ChatGPT, Claude and other MCP clients generate videos, images and audio on a BuzzVideo account.\n",
  );

  const tools = (TOOLS_CONTENT as any[]).filter((t) => live(t.slug) && !/-mcp-skill$/.test(t.slug));
  const G: [string, string][] = [["Ads", "## Ads and agent tools"], ["Video", "## Video tools"], ["Avatar", "## Avatar and lip sync tools"], ["Image", "## Image tools"], ["Audio", "## Audio tools"]];
  for (const [g, h] of G) section(h, tools.filter((t) => t.group === g).map((t) => line(t.metaTitle, `/${t.slug}`, t.metaDescription)));

  out.push("## Models\n", `- [All AI models](${SITE}/models): Every video, image and audio model on BuzzVideo in one place, with what each one is best for.\n`);
  for (const [type, h] of [["video", "### Video models"], ["image", "### Image models"], ["audio", "### Audio models"]] as const)
    section(h, (MODELS as any[]).filter((m) => m.type === type && live(m.slug)).map((m) => { const d = modelPageData(m.slug)!; return line(d.metaTitle, modelHref(m.slug), d.metaDescription); }));

  const fromMeta = (M: Record<string, any>, keep: (k: string) => boolean) => Object.entries(M).filter(([k]) => live(k) && keep(k)).map(([k, v]) => line(v.title, `/${k}`, v.description));
  section("## Model guides and pricing", fromMeta(GUIDES, (k) => /-(prompt-guide|pricing)$/.test(k)));
  section("## Best AI tools", fromMeta(COMPARE, (k) => /^best-ai-/.test(k)));
  section("## Solutions by industry and platform", fromMeta(USECASES, () => true));
  section("## Company", [
    ...fromMeta(FREE, (k) => ["enterprise", "help", "faq", "whats-new"].includes(k)),
    `- [Pricing](${SITE}/pricing): BuzzVideo plans and credits.`,
    `- [About](${SITE}/about): About BuzzVideo.`,
    `- [Blog](${SITE}/blog): Guides and news about AI video ads.`,
    `- [BuzzVideo MCP](${SITE}/mcp): Use BuzzVideo inside ChatGPT, Claude and other MCP clients.`,
  ]);
  const txt = out.join("\n").replace(/\n{3,}/g, "\n\n");
  writeFileSync("public/prototypes/site/llms.txt", txt);
  console.log("links", (txt.match(/\]\(https/g) ?? []).length);
})();
