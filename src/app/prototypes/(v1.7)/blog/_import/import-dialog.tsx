"use client";

/* 新建文章的入口弹窗:空白 / 从 Google Docs 粘贴 / 上传 .docx。
   两条导入路径最终都汇到 parse.ts 的同一套映射,结果一致。
   导入是一次性的:解析完就落到后台,Docs 那份不再跟随;重新导入会覆盖,弹窗会先警告。 */

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ClipboardPaste,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { BLOCK_LABELS, type Block, type BlockType } from "../content";
import { htmlToBlocks, type ParseResult } from "./parse";
import { shrinkDataUrl } from "../image-input";

type Mode = "choose" | "paste" | "file";

const inputCls =
  "w-full rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a2e] outline-none transition placeholder:text-[#b6b6c2] focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20";


/* 文档里的图先压再入库:Word 内嵌图基本都是 1~2MB 的 PNG,
   原样塞进浏览器存储会把整份后台数据挤爆。压不下来的才退成占位并写进回执。 */
async function compressImages(parsed: ParseResult): Promise<ParseResult> {
  let shrunk = 0;
  let dropped = 0;
  const blocks = await Promise.all(
    parsed.blocks.map(async (b) => {
      if (b.type !== "image" || !b.src?.startsWith("data:")) return b;
      const before = b.src.length;
      const out = await shrinkDataUrl(b.src);
      if (!out) {
        dropped += 1;
        return { ...b, src: "" };
      }
      if (out.length < before) shrunk += 1;
      return { ...b, src: out };
    }),
  );
  const notes = [...parsed.notes];
  if (shrunk)
    notes.push(
      `${shrunk} image${shrunk > 1 ? "s were" : " was"} resized to 1600px and recompressed so it fits in browser storage.`,
    );
  if (dropped)
    notes.push(
      `${dropped} image${dropped > 1 ? "s were" : " was"} still too large after compression and came across as a placeholder. Re-add it from the image block.`,
    );
  return { ...parsed, blocks, notes };
}

export function ImportDialog({
  open,
  onClose,
  onBlank,
  onImport,
  /** 覆盖既有文章时传进来,用于提示会被覆盖 */
  overwriteTitle,
}: {
  open: boolean;
  onClose: () => void;
  onBlank: () => void;
  onImport: (r: ParseResult) => void;
  overwriteTitle?: string;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setMode("choose");
    setResult(null);
    setError("");
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  /* 粘贴:直接吃剪贴板里的 HTML,Google Docs 复制时本来就带结构 */
  const onPaste = async (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData("text/html");
    const plain = e.clipboardData.getData("text/plain");
    if (!html && !plain) return;
    e.preventDefault();
    setError("");
    try {
      const parsed = htmlToBlocks(
        html || plain.split(/\n{2,}/).map((p) => `<p>${p}</p>`).join(""),
      );
      if (!parsed.blocks.length) {
        setError("Nothing was parsed. Make sure you copied the body text from Google Docs.");
        return;
      }
      if (!html) {
        parsed.notes.unshift(
          "The clipboard held plain text only, so heading levels and lists could not be recovered. Upload a .docx instead.",
        );
      }
      setResult(await compressImages(parsed));
    } catch {
      setError("Could not parse that. Try uploading a .docx instead.");
    }
  };

  /* 上传:docx 先经 mammoth 转成语义 HTML,再走同一套映射 */
  const handleFile = async (file: File) => {
    if (!/\.docx$/i.test(file.name)) {
      setError("Please upload a .docx. In Google Docs: File → Download → Microsoft Word (.docx).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const mammoth = await import("mammoth/mammoth.browser");
      const buf = await file.arrayBuffer();
      const { value } = await mammoth.convertToHtml(
        { arrayBuffer: buf },
        {
          /* 只映射 Title / Subtitle —— mammoth 默认就把 Heading N 转成 hN,
             层级怎么落到我们的两级,交给 parse.ts 按文档实际用了哪几级来归一化。 */
          styleMap: [
            "p[style-name='Title'] => h1.doc-title",
            "p[style-name='Subtitle'] => p.doc-subtitle",
          ],
        },
      );
      const parsed = htmlToBlocks(value);
      if (!parsed.blocks.length) {
        setError("No body content was found in this document.");
        return;
      }
      setResult(await compressImages(parsed));
    } catch {
      setError("This file could not be read. Make sure it is a .docx, not a .doc or a PDF.");
    } finally {
      setBusy(false);
    }
  };

  const Panel = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0a0a0c]/55 p-4">
      <div className="max-h-[86vh] w-full max-w-[720px] overflow-y-auto rounded-[20px] bg-white shadow-[0_28px_70px_rgba(26,26,46,0.28)]">
        {children}
      </div>
    </div>
  );

  const Header = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="flex items-start justify-between gap-4 border-b border-[#ececf1] px-7 py-5">
      <div>
        <h2 className="text-[19px] font-extrabold tracking-tight text-[#1a1a2e]">{title}</h2>
        {sub && <p className="mt-1 text-[13.5px] text-[#6a6b7b]">{sub}</p>}
      </div>
      <button
        onClick={close}
        aria-label="Close"
        className="rounded-lg p-1.5 text-[#9a9aa8] transition hover:bg-[#f3f3f6] hover:text-[#1a1a2e]"
      >
        <X className="size-[18px]" />
      </button>
    </div>
  );

  /* ── 解析结果预览 ── */
  if (result) {
    const order: BlockType[] = [
      "heading",
      "paragraph",
      "list",
      "image",
      "table",
      "quote",
      "code",
      "divider",
    ];
    return (
      <Panel>
        <Header
          title="Review before importing"
          sub="Importing is one-way. Once the content is here, the Google Doc no longer syncs."
        />
        <div className="space-y-5 px-7 py-6">
          {overwriteTitle && (
            <div className="flex gap-3 rounded-xl bg-[#fffaf0] p-4">
              <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-[#b8722a]" />
              <p className="text-[14px] leading-relaxed text-[#41425a]">
                This will <strong className="font-bold">overwrite</strong> the body of &ldquo;
                {overwriteTitle}&rdquo;. Any block changes made here will be lost.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#ececf1] p-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8]">
                Title
              </div>
              <div className="mt-1.5 text-[15px] font-bold text-[#1a1a2e]">
                {result.title || "No Title style found in the document"}
              </div>
            </div>
            <div className="rounded-xl border border-[#ececf1] p-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8]">
                Excerpt
              </div>
              <div className="mt-1.5 line-clamp-2 text-[14px] text-[#41425a]">
                {result.excerpt || "No Subtitle style found, add one manually"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8]">
              Parsed into {result.blocks.length} blocks
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {order
                .filter((t) => result.counts[t])
                .map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#fff3ec] px-3 py-1.5 text-[13px] font-semibold text-[#ff5e1a]"
                  >
                    {BLOCK_LABELS[t]} × {result.counts[t]}
                  </span>
                ))}
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto rounded-xl border border-[#ececf1]">
            {result.blocks.map((b: Block, i) => (
              <div
                key={b.id}
                className="flex gap-3 border-b border-[#f1f0f5] px-4 py-2.5 last:border-b-0"
              >
                <span className="w-6 shrink-0 text-[12px] tabular-nums text-[#b6b6c2]">
                  {i + 1}
                </span>
                <span className="w-[74px] shrink-0 text-[12px] font-bold text-[#9a9aa8]">
                  {BLOCK_LABELS[b.type]}
                </span>
                <span className="line-clamp-1 text-[13.5px] text-[#41425a]">
                  {"text" in b
                    ? b.text
                    : b.type === "list"
                      ? b.items.join(" / ")
                      : b.type === "table"
                        ? b.head.join(" | ")
                        : b.type === "image"
                          ? b.caption || "(image)"
                          : ""}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#f5f6fb] p-4">
            <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#6a6b7b]">
              What did not come across
            </div>
            <ul className="mt-2 space-y-1.5">
              {result.notes.map((n, i) => (
                <li key={i} className="text-[13.5px] leading-relaxed text-[#41425a]">
                  · {n}
                </li>
              ))}
              <li className="text-[13.5px] leading-relaxed text-[#41425a]">
                · Callout and CTA card have no equivalent in Docs. Add them in the editor after importing.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#ececf1] px-7 py-4">
          <button
            onClick={reset}
            className="rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[14px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
          >
            Start over
          </button>
          <button
            onClick={() => {
              onImport(result);
              reset();
            }}
            className="rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105"
          >
            {overwriteTitle ? "Overwrite and import" : "Import as draft"}
          </button>
        </div>
      </Panel>
    );
  }

  /* ── 粘贴 ── */
  if (mode === "paste") {
    return (
      <Panel>
        <Header
          title="Paste from Google Docs"
          sub="Select the body in Docs, copy it, and paste below. Heading levels, lists, images and tables become blocks automatically."
        />
        <div className="space-y-4 px-7 py-6">
          <div
            contentEditable
            suppressContentEditableWarning
            onPaste={onPaste}
            data-placeholder="Paste here"
            className="min-h-[200px] w-full overflow-y-auto rounded-xl border-2 border-dashed border-[#d4d3df] bg-[#faf8f6] p-5 text-[15px] leading-relaxed text-[#41425a] outline-none transition focus:border-[#ff5e1a] focus:bg-white empty:before:text-[#b6b6c2] empty:before:content-[attr(data-placeholder)]"
          />
          {error && <p className="text-[13.5px] font-medium text-[#ff5255]">{error}</p>}
          <p className="text-[13px] leading-relaxed text-[#9a9aa8]">
            Headings must use the Google Docs Title / Heading 1 / Heading 2 styles, not a
            manually enlarged font. Manually sized text carries no structure, so it all arrives as
            plain paragraphs.
          </p>
        </div>
        <div className="flex justify-end border-t border-[#ececf1] px-7 py-4">
          <button
            onClick={reset}
            className="rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[14px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a]"
          >
            Back
          </button>
        </div>
      </Panel>
    );
  }

  /* ── 上传 ── */
  if (mode === "file") {
    return (
      <Panel>
        <Header
          title="Upload a document"
          sub="In Google Docs: File → Download → Microsoft Word (.docx). Then drop the file here."
        />
        <div className="space-y-4 px-7 py-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) void handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
              dragging ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#d4d3df] bg-[#faf8f6]"
            }`}
          >
            {busy ? (
              <>
                <Loader2 className="size-7 animate-spin text-[#ff5e1a]" />
                <span className="text-[14px] font-semibold text-[#6a6b7b]">Parsing…</span>
              </>
            ) : (
              <>
                <UploadCloud className="size-7 text-[#9a9aa8]" />
                <span className="text-[15px] font-bold text-[#1a1a2e]">
                  Drop a .docx here, or click to choose
                </span>
                <span className="text-[13px] text-[#9a9aa8]">
                  Images, tables and lists come across too
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </div>
          {error && <p className="text-[13.5px] font-medium text-[#ff5255]">{error}</p>}
        </div>
        <div className="flex justify-end border-t border-[#ececf1] px-7 py-4">
          <button
            onClick={reset}
            className="rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[14px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a]"
          >
            Back
          </button>
        </div>
      </Panel>
    );
  }

  /* ── 入口三选一 ── */
  const options = [
    {
      icon: ClipboardPaste,
      title: "Paste from Google Docs",
      desc: "Copy the body in Docs and paste it straight in. Fastest, no export needed.",
      onClick: () => setMode("paste"),
      primary: true,
    },
    {
      icon: UploadCloud,
      title: "Upload a .docx file",
      desc: "Export from Docs and drop it in. Images and tables come across more completely.",
      onClick: () => setMode("file"),
      primary: true,
    },
    {
      icon: FileText,
      title: "Start from blank",
      desc: "Build the article block by block yourself.",
      onClick: () => {
        onBlank();
        close();
      },
      primary: false,
    },
  ];

  return (
    <Panel>
      <Header title="New post" sub="Choose how to start" />
      <div className="space-y-2.5 px-7 py-6">
        {options.map((o) => (
          <button
            key={o.title}
            onClick={o.onClick}
            className="group flex w-full items-start gap-4 rounded-xl border border-[#ececf1] p-5 text-left transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
          >
            <span
              className={`inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] ${
                o.primary
                  ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white"
                  : "bg-[#f3f3f6] text-[#6a6b7b]"
              }`}
            >
              <o.icon className="size-[18px]" />
            </span>
            <span>
              <span className="block text-[15.5px] font-bold text-[#1a1a2e]">{o.title}</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-[#6a6b7b]">
                {o.desc}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
