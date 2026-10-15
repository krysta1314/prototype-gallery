"use client";

/* Hybrid Reel Agent 落地页界面:沿用 Marketing Agent 首页的主视觉(品牌渐变 + 点阵、Bricolage 大标题、922px composer),
   composer 里加素材、写一句话、Create。
   开发原型与评审原型共用;Create 之后去哪由调用方的 onCreate 决定。
   缩略图按 item.kind 判断,评审原型的预置项(只有预览 URL,没有 File)也能显示。 */

import { useEffect, useRef, useState } from "react";
import localFont from "next/font/local";
import { Film, Music, Plus, SlidersHorizontal, TriangleAlert, Upload, X } from "lucide-react";
import { LlmSwitcher } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/llm";
import { videoLength } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/analyze";
import { APPLE_FONT, HistoryRail, IconRail, TopBar } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/shell";
import type { HomeItem } from "./api";
import { CREATION_HERO, CreationTypePicker, creationLabel, type CreationType } from "./components/CreationTypePicker";
import { PROMPT_MAX, fileKey, mediaKind, pickFiles, showPromptCount } from "./logic/upload";

/* 与 Marketing Agent 首页同一套标题字与渐变字、Create 按钮(design.md tokens) */
const bricolageExtraBold = localFont({ src: "../../../../fonts/BricolageGrotesque-ExtraBold.ttf", weight: "800", display: "swap" });
const gradText = "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const composerCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:hover:brightness-100";

export function AgentHome({
  initialItems = [],
  initialPrompt = "",
  initialNotices = [],
  credits,
  initialType = "hybrid",
  initialTypeMenuOpen = false,
  onCreate,
}: {
  initialItems?: HomeItem[];
  initialPrompt?: string;
  /** 评审原型用:挂载时就显示的选文件提示(「上传超限」步骤);开发原型不传 */
  initialNotices?: string[];
  /** 顶栏余额;不传用 TopBar 默认(开发原型不传)。评审原型传 Agent 当前余额,「积分不足」开关打开时是 2 */
  credits?: number;
  /** 评审原型用:挂载时选中的创作类型、类型弹层是否打开;开发原型不传(Hybrid Reel、关闭) */
  initialType?: CreationType;
  initialTypeMenuOpen?: boolean;
  onCreate: (items: HomeItem[], prompt: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<HomeItem[]>(initialItems);
  const [draft, setDraft] = useState(initialPrompt);
  /* 选文件时被拦下的原因,输入框上方一条可关闭的提示 */
  const [notices, setNotices] = useState<string[]>(initialNotices);
  /* 拖文件到输入框上:进出子元素会连发 enter / leave,用计数判断是否还在框内 */
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  const countRef = useRef(items.length);
  /* 已加文件的判重标识(名字 + 大小 + 修改时间);评审预置项没有 File,用名字占位 */
  const keyOf = (it: HomeItem) => (it.file ? fileKey(it.file) : `preset:${it.name}`);
  const keysRef = useRef(items.map(keyOf));
  useEffect(() => {
    countRef.current = items.length;
    keysRef.current = items.map((it) => (it.file ? fileKey(it.file) : `preset:${it.name}`));
  }, [items]);
  /* 创作类型:默认 Hybrid Reel;切到其他类型时 Create 不可用(本原型只做 Hybrid Reel) */
  const [type, setType] = useState<CreationType>(initialType);
  const canCreate = type === "hybrid" && items.length > 0;

  /* 选文件就校验:视频先读时长(读不到不拦),再判重、按上限挑出能加的;不合规的不加入 */
  const add = async (files: File[]) => {
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    const durations = await Promise.all(
      files.map((f, i) => (mediaKind(f.name, f.type) === "video" ? videoLength(urls[i]) : Promise.resolve(undefined))),
    );
    const { accepted, notices: next } = pickFiles(
      countRef.current,
      files.map((f, i) => ({ name: f.name, type: f.type, size: f.size, durationSec: durations[i], key: fileKey(f) })),
      keysRef.current,
    );
    urls.forEach((u, i) => !accepted.includes(i) && URL.revokeObjectURL(u));
    const added = accepted.map((i) => ({ file: files[i], url: urls[i], name: files[i].name, kind: mediaKind(files[i].name, files[i].type) ?? "video" }));
    countRef.current += added.length;
    keysRef.current = [...keysRef.current, ...added.map((a) => fileKey(a.file))];
    setItems((prev) => [...prev, ...added]);
    setNotices(next);
  };
  const create = () => {
    if (!canCreate) return;
    onCreate(items, draft.trim());
  };

  return (
    <div className="flex h-dvh bg-white" style={{ fontFamily: APPLE_FONT }}>
      <IconRail />
      <HistoryRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar credits={credits} />
        <main
          className="relative isolate min-h-0 flex-1 overflow-y-auto bg-[#fffdfb] px-6 text-[#1a1a2e]"
          onPointerMove={(e) => {
            const field = fieldRef.current;
            if (!field) return;
            const r = e.currentTarget.getBoundingClientRect();
            field.style.setProperty("--ma-pointer-x", `${e.clientX - r.left}px`);
            field.style.setProperty("--ma-pointer-y", `${e.clientY - r.top + e.currentTarget.scrollTop}px`);
            field.style.setProperty("--ma-pointer-opacity", "1");
          }}
          onPointerLeave={() => fieldRef.current?.style.setProperty("--ma-pointer-opacity", "0")}
        >
          {/* 品牌渐变 + 点阵(globals.css .marketing-agent-brand-field),鼠标附近点阵亮起;内容压在它上面 */}
          <div ref={fieldRef} className="marketing-agent-brand-field" aria-hidden="true" />
          <div className="relative z-10 pb-10">
            <h1 className={`${bricolageExtraBold.className} mt-[12vh] text-center text-[clamp(30px,3.6vw,48px)] leading-[1.1] tracking-[-0.04em]`}>
              <span className={gradText}>{creationLabel(type)}:</span> {CREATION_HERO[type][0]}
              <br /> {CREATION_HERO[type][1]}
            </h1>
            <div className="mx-auto mt-7 w-[922px] max-w-full">
              {notices.length > 0 && (
                <div
                  role="alert"
                  className="mb-2 flex items-start gap-2 rounded-xl border border-[#FFD1D1] bg-[#FFF0F0] px-3 py-2 text-[13px] leading-relaxed text-[#C22F32]"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#FF5255]" />
                  <ul className="min-w-0 flex-1">
                    {notices.map((n) => (
                      <li key={n} className="break-words">
                        {n}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setNotices([])}
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[#C22F32] transition hover:bg-[#FFD1D1]"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
              <div
                onDragEnter={(e) => {
                  if (!hasFiles(e)) return;
                  e.preventDefault();
                  dragDepth.current += 1;
                  setDragging(true);
                }}
                onDragOver={(e) => {
                  if (!hasFiles(e)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDragLeave={(e) => {
                  if (!hasFiles(e)) return;
                  dragDepth.current = Math.max(0, dragDepth.current - 1);
                  if (dragDepth.current === 0) setDragging(false);
                }}
                onDrop={(e) => {
                  if (!hasFiles(e)) return;
                  e.preventDefault();
                  dragDepth.current = 0;
                  setDragging(false);
                  void add(Array.from(e.dataTransfer.files));
                }}
                className={`relative flex min-h-[178px] flex-col rounded-[22px] border bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20 ${
                  dragging ? "border-[#ff5e1a] ring-2 ring-[#ff5e1a]/20" : "border-[#ececf1]"
                }`}
              >
                {/* 拖进来时盖一层提示;松手和「+」选文件走同一套校验(判重、上限、类型) */}
                {dragging && (
                  <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[22px] border-2 border-dashed border-[#ff5e1a] bg-[#fff7f2]/95">
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-[#ff5e1a]">
                      <Upload className="size-4" /> Drop footage, images or music to add
                    </span>
                  </div>
                )}
                {items.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 px-1">
                    {items.map((f, i) => (
                      <span key={f.url} className="group relative">
                        <span className="relative block size-11 overflow-hidden rounded-lg bg-[#f1f2f5] ring-1 ring-[#ececf1]">
                          {f.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.url} alt={f.name} className="size-full object-cover" />
                          ) : f.kind === "video" ? (
                            <>
                              {/* HEVC 的 .MOV 在 Chrome 里画不出首帧:底下垫一个胶片图标,不会是一块白 */}
                              <Film className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-[#9a9bb0]" />
                              <video src={`${f.url}#t=0.1`} muted playsInline preload="metadata" className="relative size-full object-cover" />
                            </>
                          ) : (
                            <span title={f.name} className="grid size-full place-items-center text-[#6a6b7b]">
                              {f.kind === "audio" ? <Music className="size-4" /> : <Film className="size-4" />}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${f.name}`}
                          onClick={() => setItems((prev) => prev.filter((_, k) => k !== i))}
                          className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-[#1a1a2e] text-[10px] leading-none text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <textarea
                  value={draft}
                  maxLength={PROMPT_MAX}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                      e.preventDefault();
                      create();
                    }
                  }}
                  placeholder={
                    type === "hybrid"
                      ? 'Add footage with +, then describe the ad. e.g. "15s TikTok ad for our face mist"'
                      : "Describe your idea or campaign, or paste a product / landing page / IG post URL. Use @ to reference uploaded files."
                  }
                  className="w-full flex-1 resize-none bg-transparent px-2 pt-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
                />
                <div className="flex items-center justify-between gap-2 px-1 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      aria-label="Add footage"
                      className="grid size-9 place-items-center rounded-lg border border-[#ececf1] bg-white text-[#6a6b7b] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
                    >
                      <Plus className="size-[18px]" />
                    </button>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept="video/*,image/*,audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const list = e.target.files ? Array.from(e.target.files) : [];
                        e.target.value = "";
                        void add(list);
                      }}
                    />
                    {/* 与 Marketing Agent 同款创作类型选择;本原型只有 Hybrid Reel 往下走 */}
                    <CreationTypePicker value={type} onChange={setType} defaultOpen={initialTypeMenuOpen} />
                    <span className="hidden items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold sm:flex">
                      <SlidersHorizontal className="size-4" /> Auto
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {/* 快到 20,000 字上限才出计数,到顶变红;输入框本身不让再多打 */}
                    {showPromptCount(draft.length) && (
                      <span className={`text-[12px] tabular-nums ${draft.length >= PROMPT_MAX ? "font-semibold text-[#e5484d]" : "text-[#9a9bb0]"}`}>
                        {draft.length.toLocaleString("en-US")} / {PROMPT_MAX.toLocaleString("en-US")}
                      </span>
                    )}
                    <LlmSwitcher placement="down" />
                    <button type="button" onClick={create} disabled={!canCreate} title={type === "hybrid" && !items.length ? "Add footage first" : undefined} className={composerCta}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
