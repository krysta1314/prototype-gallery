"use client";

/* Google Docs → Block 的解析核心。
   两条入口(剪贴板粘贴 / 上传 .docx)最终都会变成一段语义 HTML,再走这里同一套映射,
   所以两边结果一致,以后加「贴 Docs 链接」也复用这里。

   映射是查表,不是模型推理 —— 结果稳定可预期,这点是说服编辑的关键。

   Google Docs 段落样式 → 我们的 block:
     标题 (Title)        → 文章标题(不进正文)
     副标题 (Subtitle)   → 文章摘要 excerpt(不进正文)
     标题层级是「自适应」的,不写死:真实文档常常整篇只用一种标题样式。
     取文档里最浅的那一级当 H2,更深的一律 H3,所以
       只用 2 级标题的文档   → 章节标题都是 H2(而不是全被压成三级)
       1/2/3 级都用的文档    → 1 级→H2,2/3 级→H3
     普通文本            → paragraph
     项目符号 / 编号列表  → list
     图片                → image
     表格                → table
     分隔线              → divider
     代码块              → code
   行内只保留 粗体 / 斜体 / 链接,其余(字号、颜色、下划线、字体)一律丢弃。 */

import type { Block, BlockType } from "../content";

export type ParseResult = {
  title: string;
  excerpt: string;
  blocks: Block[];
  /** 丢弃或降级的东西,导入前摊开给编辑看 */
  notes: string[];
  counts: Partial<Record<BlockType, number>>;
};

/* base64 图片的上限(URI 字符数)。约 150KB 解码后体积,再大就退成占位。 */
const DATA_URI_LIMIT = 200_000;

/* 判断一个包装层里是否已经有块级内容 */
const BLOCK_TAGS = new Set([
  "p", "div", "section", "article", "ul", "ol", "table", "blockquote", "pre", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
]);

let seq = 0;
const id = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

/* ── 行内:只留粗体 / 斜体 / 链接,转成我们的轻量标记 ── */

function inlineText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  /* br 自身没有内容,必须在空值早退之前处理,否则软换行会被吞掉 */
  if (tag === "br") return "\n";

  const inner = Array.from(el.childNodes).map(inlineText).join("");
  if (!inner.trim()) return inner;
  const style = el.getAttribute("style") ?? "";
  // Google Docs 粘贴时粗斜体是写在 span 的 inline style 上,不是 <b>/<i>
  const bold =
    tag === "b" || tag === "strong" || /font-weight:\s*(bold|[6-9]00)/i.test(style);
  const italic = tag === "i" || tag === "em" || /font-style:\s*italic/i.test(style);

  if (tag === "a") {
    const href = el.getAttribute("href") ?? "";
    // Docs 的外链会包一层 google.com/url?q= 跳转,还原成真实地址
    const real = /google\.com\/url\?/.test(href)
      ? new URLSearchParams(href.split("?")[1]).get("q") ?? href
      : href;
    return real ? `[${inner}](${real})` : inner;
  }
  let out = inner;
  // Docs 的假粗体:<b style="font-weight:normal"> 包整段,要排除掉
  if (bold && !/font-weight:\s*normal/i.test(style)) out = `**${out}**`;
  if (italic) out = `*${out}*`;
  return out;
}

/** 剥掉行内标记 —— 标题与摘要是纯文本字段 */
const plain = (t: string) =>
  t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const text = (el: Element) =>
  Array.from(el.childNodes).map(inlineText).join("").replace(/\s+\n/g, "\n").trim();

/* ── 块级 ── */

/* 嵌套列表我们没有对应 block。不拍平成一坨,而是把子项拆成独立条目并按层级缩进,
   这样 Docs 里的层级在后台仍然看得出来,编辑要调也有迹可循。 */
function listLines(el: Element, depth = 0): { lines: string[]; nested: boolean } {
  const lines: string[] = [];
  let nested = false;
  for (const li of Array.from(el.children)) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const sub = Array.from(li.children).find((c) =>
      ["ul", "ol"].includes(c.tagName.toLowerCase()),
    );
    const clone = li.cloneNode(true) as Element;
    clone.querySelectorAll("ul, ol").forEach((n) => n.remove());
    const own = text(clone);
    if (own) lines.push(depth === 0 ? own : `${"  ".repeat(depth - 1)}· ${own}`);
    if (sub) {
      nested = true;
      const r = listLines(sub, depth + 1);
      lines.push(...r.lines);
    }
  }
  return { lines, nested };
}

export function htmlToBlocks(html: string): ParseResult {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;

  // Docs 粘贴会把整篇包在一个 <b style="font-weight:normal"> 里,先脱掉这层壳
  const onlyChild = root.children.length === 1 ? root.children[0] : null;
  const scope =
    onlyChild && /font-weight:\s*normal/i.test(onlyChild.getAttribute("style") ?? "")
      ? onlyChild
      : root;

  const blocks: Block[] = [];
  const notes: string[] = [];
  let title = "";
  let excerpt = "";
  /* 标题的原始层级,走完一遍再统一归一化 */
  const headings: { idx: number; orig: number }[] = [];

  const push = (b: Block) => blocks.push(b);

  const dropped = { empty: 0 };
  /* 只有真的丢了东西才提示,否则编辑会把恒定出现的提示当噪音全部忽略 */
  const flags = { styling: false, nestedList: false, bigImage: 0, boldAsHeading: 0 };

  /* 源码里出现这些才算「丢过排版」 */
  if (/style="[^"]*(font-size|color|text-decoration|font-family)/i.test(html) ||
      /<(u|s|strike|font)\b/i.test(html)) {
    flags.styling = true;
  }

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const cls = el.getAttribute("class") ?? "";

    switch (tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const t = text(el);
        if (!t) return;
        // .doc-title / .doc-subtitle 由 docx 的样式映射打上
        if (cls.includes("doc-title")) {
          title = plain(t);
          return;
        }
        headings.push({ idx: blocks.length, orig: Number(tag[1]) });
        push({ id: id(), type: "heading", level: 2, text: t });
        return;
      }

      case "p": {
        if (cls.includes("doc-subtitle") && !excerpt) {
          excerpt = plain(text(el));
          return;
        }
        // 只含一张图的段落,当图片处理
        const img = el.querySelector("img");
        if (img && !text(el)) return walk(img);
        const t = text(el);
        if (!t) {
          dropped.empty += 1;
          return;
        }
        push({ id: id(), type: "paragraph", text: t });
        return;
      }

      case "ul":
      case "ol": {
        const { lines, nested } = listLines(el);
        if (!lines.length) return;
        if (nested) flags.nestedList = true;
        push({ id: id(), type: "list", ordered: tag === "ol", items: lines });
        return;
      }

      case "img": {
        const raw = el.getAttribute("src") ?? "";
        /* docx 里的内嵌图会被转成 base64,一张就可能几百 KB。
           全塞进去会撑爆浏览器存储,而且失败是静默的,所以超限直接退成占位。 */
        const tooBig = raw.startsWith("data:") && raw.length > DATA_URI_LIMIT;
        if (tooBig) flags.bigImage += 1;
        push({
          id: id(),
          type: "image",
          src: tooBig ? "" : raw.startsWith("http") || raw.startsWith("data:") ? raw : "",
          caption: plain(el.getAttribute("alt") ?? ""),
        });
        return;
      }

      case "table": {
        const rows = Array.from(el.querySelectorAll("tr")).map((tr) =>
          Array.from(tr.querySelectorAll("th, td")).map((c) => text(c)),
        );
        if (!rows.length) return;
        const [head, ...body] = rows;
        push({ id: id(), type: "table", head, rows: body });
        return;
      }

      case "hr":
        push({ id: id(), type: "divider" });
        return;

      case "pre": {
        const t = el.textContent?.trim() ?? "";
        if (t) push({ id: id(), type: "code", language: "text", code: t });
        return;
      }

      case "blockquote": {
        const t = text(el);
        if (t) push({ id: id(), type: "quote", text: t, cite: "" });
        return;
      }

      case "br":
      case "style":
      case "script":
      case "meta":
        return;

      default: {
        /* div / span / section 之类的包装层。
           如果它自己直接挂着文字(网页和 Word 复制过来常见的 <div>文字</div>),
           必须当段落收下 —— 早先只递归 children,这种内容会被整段丢掉。 */
        const ownText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent ?? "")
          .join("")
          .trim();
        const hasBlockChild = Array.from(el.children).some((c) =>
          BLOCK_TAGS.has(c.tagName.toLowerCase()),
        );
        if (ownText && !hasBlockChild) {
          const t = text(el);
          if (t) push({ id: id(), type: "paragraph", text: t });
          return;
        }
        Array.from(el.children).forEach(walk);
      }
    }
  };

  Array.from(scope.children).forEach(walk);

  /* 文档没有「标题」样式时,把正文第一个标题当文章标题 ——
     真实稿件几乎都是这么写的:第一行就是标题,和下面的章节用同一种样式。 */
  if (!title && blocks[0]?.type === "heading") {
    title = plain(blocks[0].text);
    blocks.shift();
    headings.shift();
    headings.forEach((h) => (h.idx -= 1));
    notes.push("The document has no Title style, so its first heading was used as the post title.");
  }

  /* 层级归一化:最浅的一级当 H2,更深的一律 H3 */
  if (headings.length) {
    const min = Math.min(...headings.map((h) => h.orig));
    let demoted = 0;
    for (const h of headings) {
      const b = blocks[h.idx];
      if (b?.type !== "heading") continue;
      b.level = h.orig <= min ? 2 : 3;
      if (h.orig > min + 1) demoted += 1;
    }
    if (demoted) {
      notes.push(`${demoted} heading${demoted > 1 ? "s were" : " was"} deeper than two levels and merged into Heading 3`);
    }
  }

  const counts: Partial<Record<BlockType, number>> = {};
  for (const b of blocks) counts[b.type] = (counts[b.type] ?? 0) + 1;

  if (dropped.empty)
    notes.push(`Dropped ${dropped.empty} empty paragraph${dropped.empty > 1 ? "s" : ""}`);

  if (flags.styling)
    notes.push(
      "Font size, colour, typeface and underline were discarded. Only bold, italic and links are kept.",
    );

  if (flags.nestedList)
    notes.push(
      "Nested list levels were flattened into indented items, since a list block has one level.",
    );

  if (flags.bigImage)
    notes.push(
      `${flags.bigImage} embedded image${flags.bigImage > 1 ? "s were" : " was"} too large to store and came across as a placeholder. Re-add via the asset library.`,
    );

  /* 整段加粗、且全篇没有一个标题 → 很可能是手动调字号当标题,要点名说清楚 */
  if (!headings.length) {
    const boldOnly = blocks.filter(
      (b) => b.type === "paragraph" && /^\*\*[^*]+\*\*$/.test(b.text.trim()),
    ).length;
    if (boldOnly)
      notes.push(
        `No heading styles were found, but ${boldOnly} paragraph${boldOnly > 1 ? "s are" : " is"} entirely bold. If those are meant to be headings, set them with the Title / Heading styles in Docs and import again.`,
      );
  }

  if (!title) {
    notes.push(
      headings.length
        ? "The document does not start with a heading, so the post title needs to be filled in manually."
        : "No headings were found, so the post title needs to be filled in manually.",
    );
  }

  return { title, excerpt, blocks, notes, counts };
}
