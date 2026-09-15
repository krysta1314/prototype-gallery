"use client";

/* 一个 renderBlock 分发所有 block 类型 -- 前台详情页和 admin 预览共用它。
   新增一种 block 只要在这里加一个 case,不必为任何一篇文章写页面。 */

import { ArrowRight, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { Block } from "./content";
import { MediaSlot } from "./media";

/** 轻量行内标记:**粗体** 与 [文字](链接) */
export function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      out.push(
        <strong key={`s${k++}`} className="font-semibold text-[#1a1a2e]">
          {m[1]}
        </strong>,
      );
    } else if (m[2]) {
      out.push(
        <em key={`i${k++}`} className="italic">
          {m[2]}
        </em>,
      );
    } else {
      out.push(
        <a
          key={`a${k++}`}
          href={m[4]}
          className="font-semibold text-[#ff5e1a] underline decoration-[#ff5e1a]/30 underline-offset-4 transition hover:decoration-[#ff5e1a]"
        >
          {m[3]}
        </a>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CALLOUT = {
  info: { icon: Info, bg: "bg-[#f5f6fb]", bar: "bg-[#6a6b7b]", ink: "text-[#6a6b7b]" },
  tip: { icon: Lightbulb, bg: "bg-[#fff7f1]", bar: "bg-[#ff5e1a]", ink: "text-[#ff5e1a]" },
  warn: { icon: TriangleAlert, bg: "bg-[#fffaf0]", bar: "bg-[#d98324]", ink: "text-[#b8722a]" },
} as const;

export function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      /* 段落里可能带软换行(Docs 里的 shift+enter),按行渲染而不是拼成一行 */
      return (
        <p className="text-[17px] leading-[1.75] text-[#41425a]">
          {block.text.split("\n").map((line, i, all) => (
            <span key={i}>
              {inline(line)}
              {i < all.length - 1 && <br />}
            </span>
          ))}
        </p>
      );

    case "heading":
      return block.level === 2 ? (
        <h2
          id={headingId(block.text)}
          className="scroll-mt-28 pt-4 text-[27px] font-extrabold tracking-tight text-[#1a1a2e]"
        >
          {block.text}
        </h2>
      ) : (
        <h3
          id={headingId(block.text)}
          className="scroll-mt-28 pt-2 text-[20px] font-bold tracking-tight text-[#1a1a2e]"
        >
          {block.text}
        </h3>
      );

    case "image":
      return (
        <figure>
          {block.src ? (
            <img
              src={block.src}
              alt={block.caption}
              className="w-full rounded-[4px] border border-[#ececf1] object-cover"
            />
          ) : (
            <MediaSlot label="Image · 16:9" ratio="aspect-[16/9]" />
          )}
          {block.caption && (
            <figcaption className="mt-2.5 text-[13px] text-[#9a9aa8]">{block.caption}</figcaption>
          )}
        </figure>
      );

    case "quote":
      return (
        <blockquote className="border-l-[3px] border-[#ff5e1a] pl-5">
          <p className="text-[20px] font-medium leading-[1.6] text-[#1a1a2e]">“{block.text}”</p>
          {block.cite && (
            <cite className="mt-2.5 block text-[13px] not-italic text-[#9a9aa8]">- {block.cite}</cite>
          )}
        </blockquote>
      );

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} className="pl-1.5 text-[17px] leading-[1.7] text-[#41425a]">
          {inline(item)}
        </li>
      ));
      return block.ordered ? (
        <ol className="ml-5 list-decimal space-y-2 marker:font-semibold marker:text-[#ff5e1a]">
          {items}
        </ol>
      ) : (
        <ul className="ml-5 list-disc space-y-2 marker:text-[#ff5e1a]">{items}</ul>
      );
    }

    case "code":
      return (
        <div className="overflow-hidden rounded-[4px] border border-[#ececf1] bg-[#1a1a2e]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {block.language}
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-[13.5px] leading-[1.7] text-[#e8e8f0]">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "callout": {
      const c = CALLOUT[block.tone];
      const Icon = c.icon;
      return (
        <div className={`flex gap-3.5 rounded-[4px] ${c.bg} p-5`}>
          <Icon className={`mt-0.5 size-[18px] shrink-0 ${c.ink}`} />
          <div>
            <div className="text-[15px] font-bold text-[#1a1a2e]">{block.title}</div>
            <p className="mt-1 text-[15px] leading-[1.65] text-[#41425a]">{inline(block.text)}</p>
          </div>
        </div>
      );
    }

    case "cta":
      return (
        <div className="rounded-[4px] bg-gradient-to-br from-[#fff3ec] to-[#ffe7d2] p-7">
          <div className="text-[21px] font-extrabold tracking-tight text-[#1a1a2e]">
            {block.title}
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#6a6b7b]">{block.text}</p>
          <a
            href={block.href}
            className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105"
          >
            {block.label}
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      );

    case "video":
      return (
        <figure>
          <video
            src={block.src}
            autoPlay
            muted
            loop
            playsInline
            className="aspect-video w-full rounded-[4px] object-cover"
          />
          {block.caption && (
            <figcaption className="mt-2.5 text-[13px] text-[#9a9aa8]">{block.caption}</figcaption>
          )}
        </figure>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-[4px] border border-[#ececf1]">
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="bg-[#faf8f6]">
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-[#ececf1] px-4 py-2.5 text-left font-bold text-[#1a1a2e]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-[#ececf1] last:border-b-0">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 align-top text-[#41425a]">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "references":
      return (
        <section className="rounded-[4px] bg-[#faf8f6] p-6">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8]">
            References
          </h2>
          <ol className="mt-3 space-y-2">
            {block.items.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-[1.6]">
                <span className="shrink-0 tabular-nums text-[#9a9aa8]">{i + 1}.</span>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#ff5e1a] underline decoration-[#ff5e1a]/30 underline-offset-4 transition hover:decoration-[#ff5e1a]"
                >
                  {r.label || r.href}
                </a>
              </li>
            ))}
          </ol>
        </section>
      );

    case "divider":
      return <hr className="border-t border-[#ececf1]" />;

    default:
      return null;
  }
}

export function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((b) => (
        <RenderBlock key={b.id} block={b} />
      ))}
    </div>
  );
}
