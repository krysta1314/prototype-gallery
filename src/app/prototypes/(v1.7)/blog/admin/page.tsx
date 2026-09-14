"use client";

/* Blog Admin -- 这个需求的主角。
   列表(状态 Tab / 搜索 / 筛选)→ 编辑器(区块化正文 + 右侧配置面板)→ 状态流转。
   写入的是与前台同一个 store,所以这里发布,/prototypes/blog 立刻多一篇。 */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  BLOCK_LABELS,
  CATEGORIES,
  AUTHORS,
  formatDate,
  newBlock,
  readingMinutes,
  type Block,
  type BlockType,
  type Post,
  type PostStatus,
} from "../content";
import { BlockList } from "../blocks";
import { MediaSlot } from "../media";
import { DemoBar } from "../demo-bar";
import {
  createPost,
  deletePost,
  duplicatePost,
  resetPosts,
  savePost,
  usePosts,
} from "../store";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const TODAY = "2026-09-14";

const STATUS_STYLE: Record<PostStatus, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-[#e8f7ef] text-[#1a7f4b]" },
  scheduled: { label: "Scheduled", cls: "bg-[#eef0fb] text-[#4a4fb8]" },
  draft: { label: "Draft", cls: "bg-[#f3f3f6] text-[#6a6b7b]" },
  archived: { label: "Archived", cls: "bg-[#faf0e8] text-[#9a7a5a]" },
};

/* 不带宽度的基底 -- 需要固定宽度的控件用它,避免和 w-full 打架 */
const inputBase =
  "rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a2e] outline-none transition placeholder:text-[#b6b6c2] focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20";
const inputCls = `w-full ${inputBase}`;

function StatusBadge({ status }: { status: PostStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${s.cls}`}>{s.label}</span>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12.5px] font-bold text-[#1a1a2e]">{label}</span>
        {hint && <span className="text-[11.5px] text-[#9a9aa8]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ececf1] last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
          {title}
        </span>
        <ChevronDown
          className={`size-4 text-[#9a9aa8] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-4 px-5 pb-5">{children}</div>}
    </div>
  );
}

/* ── Block 编辑器 ───────────────────────────────────────────── */

function BlockEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (b: Block) => void;
}) {
  const set = (patch: Record<string, unknown>) => onChange({ ...block, ...patch } as Block);

  switch (block.type) {
    case "paragraph":
      return (
        <textarea
          value={block.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={Math.max(2, Math.ceil(block.text.length / 80))}
          placeholder="Write a paragraph. **bold** and [link](url) are supported."
          className={`${inputCls} resize-y leading-relaxed`}
        />
      );

    case "heading":
      return (
        <div className="flex gap-2">
          <select
            value={block.level}
            onChange={(e) => set({ level: Number(e.target.value) as 2 | 3 })}
            className={`${inputBase} w-[86px] shrink-0`}
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            value={block.text}
            onChange={(e) => set({ text: e.target.value })}
            className={`${inputCls} min-w-0 font-bold`}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2.5">
          <div className="rounded-xl border border-dashed border-[#d4d3df] px-3.5 py-3 text-[12.5px] text-[#9a9aa8]">
            占位图位。接入真实素材后这里换成上传 / 素材库选择。
          </div>
          <input
            value={block.caption}
            onChange={(e) => set({ caption: e.target.value })}
            placeholder="Caption"
            className={inputCls}
          />
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2.5">
          <textarea
            value={block.text}
            onChange={(e) => set({ text: e.target.value })}
            rows={2}
            placeholder="Quote"
            className={`${inputCls} resize-y`}
          />
          <input
            value={block.cite}
            onChange={(e) => set({ cite: e.target.value })}
            placeholder="Attribution"
            className={inputCls}
          />
        </div>
      );

    case "list":
      return (
        <div className="space-y-2.5">
          <div className="flex gap-2">
            {[
              { v: false, label: "Bulleted" },
              { v: true, label: "Numbered" },
            ].map((o) => (
              <button
                key={o.label}
                onClick={() => set({ ordered: o.v })}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  block.ordered === o.v
                    ? "bg-[#fff3ec] text-[#ff5e1a]"
                    : "border border-[#ececf1] text-[#6a6b7b] hover:text-[#ff5e1a]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={(e) =>
                  set({ items: block.items.map((x, j) => (j === i ? e.target.value : x)) })
                }
                className={inputCls}
              />
              <button
                onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                className="shrink-0 rounded-lg border border-[#ececf1] px-2.5 text-[#9a9aa8] transition hover:border-[#ff5255] hover:text-[#ff5255]"
                aria-label="Remove item"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => set({ items: [...block.items, "New item"] })}
            className="text-[13px] font-semibold text-[#ff5e1a]"
          >
            + Add item
          </button>
        </div>
      );

    case "code":
      return (
        <div className="space-y-2.5">
          <input
            value={block.language}
            onChange={(e) => set({ language: e.target.value })}
            placeholder="Language"
            className={`${inputBase} w-[160px]`}
          />
          <textarea
            value={block.code}
            onChange={(e) => set({ code: e.target.value })}
            rows={4}
            className={`${inputCls} resize-y font-mono text-[13px]`}
          />
        </div>
      );

    case "callout":
      return (
        <div className="space-y-2.5">
          <div className="flex gap-2">
            {(["info", "tip", "warn"] as const).map((t) => (
              <button
                key={t}
                onClick={() => set({ tone: t })}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold capitalize transition ${
                  block.tone === t
                    ? "bg-[#fff3ec] text-[#ff5e1a]"
                    : "border border-[#ececf1] text-[#6a6b7b] hover:text-[#ff5e1a]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={block.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Callout title"
            className={`${inputCls} font-semibold`}
          />
          <textarea
            value={block.text}
            onChange={(e) => set({ text: e.target.value })}
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </div>
      );

    case "cta":
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            value={block.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Title"
            className={`${inputCls} font-semibold sm:col-span-2`}
          />
          <textarea
            value={block.text}
            onChange={(e) => set({ text: e.target.value })}
            rows={2}
            placeholder="Supporting line"
            className={`${inputCls} resize-y sm:col-span-2`}
          />
          <input
            value={block.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="Button label"
            className={inputCls}
          />
          <input
            value={block.href}
            onChange={(e) => set({ href: e.target.value })}
            placeholder="Button link"
            className={inputCls}
          />
        </div>
      );

    case "video":
      return (
        <div className="space-y-2.5">
          <input
            value={block.src}
            onChange={(e) => set({ src: e.target.value })}
            placeholder="Video URL"
            className={inputCls}
          />
          <input
            value={block.caption}
            onChange={(e) => set({ caption: e.target.value })}
            placeholder="Caption"
            className={inputCls}
          />
        </div>
      );

    case "divider":
      return (
        <div className="rounded-xl border border-dashed border-[#d4d3df] py-3 text-center text-[12.5px] text-[#9a9aa8]">
          Horizontal divider, nothing to configure
        </div>
      );

    default:
      return null;
  }
}

function AddBlockMenu({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d4d3df] bg-white py-3.5 text-[14px] font-semibold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
      >
        <Plus className="size-4" />
        Add block
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="absolute inset-x-0 bottom-full z-50 mb-2 grid grid-cols-2 gap-1 rounded-[18px] border border-[#ececf1] bg-white p-2 shadow-[0_24px_60px_rgba(26,26,46,0.18)] sm:grid-cols-3">
            {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  onAdd(t);
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-[#1a1a2e] transition hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
              >
                {BLOCK_LABELS[t]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── 编辑器视图 ─────────────────────────────────────────────── */

function Editor({
  post,
  onBack,
  notify,
}: {
  post: Post;
  onBack: () => void;
  notify: (m: string) => void;
}) {
  const [draft, setDraft] = useState<Post>(post);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [tagInput, setTagInput] = useState("");

  const set = (patch: Partial<Post>) => setDraft((d) => ({ ...d, ...patch }));
  const setSeo = (patch: Partial<Post["seo"]>) =>
    setDraft((d) => ({ ...d, seo: { ...d.seo, ...patch } }));

  const updateBlock = (i: number, b: Block) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.map((x, j) => (j === i ? b : x)) }));

  const moveBlock = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.blocks.length) return d;
      const next = [...d.blocks];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, blocks: next };
    });

  const removeBlock = (i: number) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, j) => j !== i) }));

  const copyBlock = (i: number) =>
    setDraft((d) => {
      const next = [...d.blocks];
      next.splice(i + 1, 0, { ...d.blocks[i], id: `b${Date.now()}` });
      return { ...d, blocks: next };
    });

  const save = (extra?: Partial<Post>, msg = "Saved") => {
    const next = { ...draft, ...extra };
    setDraft(next);
    savePost(next);
    notify(msg);
  };

  const publish = () => {
    if (draft.scheduledAt && draft.scheduledAt > TODAY) {
      save({ status: "scheduled" }, `Scheduled for ${formatDate(draft.scheduledAt)}`);
    } else {
      save(
        { status: "published", publishedAt: draft.publishedAt || TODAY, scheduledAt: "" },
        "Published. It is live on the blog now",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]" style={{ fontFamily: APPLE_FONT }}>
      <DemoBar />

      {/* 编辑器顶栏 */}
      <div className="sticky top-0 z-40 border-b border-[#ececf1] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1340px] items-center gap-4 px-6 py-3.5">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
          >
            <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
            All posts
          </button>
          <span className="hidden truncate text-[14px] font-bold text-[#1a1a2e] sm:block">
            {draft.title || "Untitled post"}
          </span>
          <StatusBadge status={draft.status} />

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-xl border border-[#ececf1] bg-white p-0.5">
              {(["write", "preview"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold capitalize transition ${
                    tab === t ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:text-[#1a1a2e]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => save()}
              className="rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
            >
              Save draft
            </button>
            <button
              onClick={publish}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2 text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105"
            >
              <Send className="size-3.5" />
              {draft.scheduledAt && draft.scheduledAt > TODAY ? "Schedule" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1340px] gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* 正文区 */}
        <div>
          {tab === "write" ? (
            <div className="rounded-[22px] border border-[#ececf1] bg-white p-7 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
              <input
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Post title"
                className="w-full border-none bg-transparent text-[30px] font-extrabold tracking-tight text-[#1a1a2e] outline-none placeholder:text-[#d4d3df]"
              />
              <textarea
                value={draft.excerpt}
                onChange={(e) => set({ excerpt: e.target.value })}
                placeholder="Excerpt, shown on the blog cards and in search results"
                rows={2}
                className="mt-3 w-full resize-y border-none bg-transparent text-[16px] leading-relaxed text-[#6a6b7b] outline-none placeholder:text-[#d4d3df]"
              />

              <div className="mt-6 flex items-center gap-3 border-t border-[#ececf1] pt-5 text-[12.5px] text-[#9a9aa8]">
                <span>{draft.blocks.length} blocks</span>
                <span aria-hidden>·</span>
                <span>{readingMinutes(draft.blocks)} min read</span>
              </div>

              <div className="mt-5 space-y-3">
                {draft.blocks.map((b, i) => (
                  <div
                    key={b.id}
                    className="group rounded-[18px] border border-[#ececf1] bg-white p-4 transition hover:border-[#d4d3df]"
                  >
                    <div className="mb-2.5 flex items-center gap-2">
                      <GripVertical className="size-4 text-[#d4d3df]" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a9aa8]">
                        {BLOCK_LABELS[b.type]}
                      </span>
                      <div className="ml-auto flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        {[
                          { icon: "↑", fn: () => moveBlock(i, -1), label: "Move up" },
                          { icon: "↓", fn: () => moveBlock(i, 1), label: "Move down" },
                        ].map((a) => (
                          <button
                            key={a.label}
                            onClick={a.fn}
                            aria-label={a.label}
                            className="size-7 rounded-lg text-[13px] text-[#6a6b7b] transition hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
                          >
                            {a.icon}
                          </button>
                        ))}
                        <button
                          onClick={() => copyBlock(i)}
                          aria-label="Duplicate block"
                          className="inline-flex size-7 items-center justify-center rounded-lg text-[#6a6b7b] transition hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          onClick={() => removeBlock(i)}
                          aria-label="Delete block"
                          className="inline-flex size-7 items-center justify-center rounded-lg text-[#6a6b7b] transition hover:bg-[#fff0f0] hover:text-[#ff5255]"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <BlockEditor block={b} onChange={(nb) => updateBlock(i, nb)} />
                  </div>
                ))}

                <AddBlockMenu
                  onAdd={(t) => setDraft((d) => ({ ...d, blocks: [...d.blocks, newBlock(t)] }))}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-[#ececf1] bg-white p-9 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
              <MediaSlot label="Cover · 21:9" ratio="aspect-[21/9]" />
              <span className="mt-6 inline-block rounded-full bg-[#fff3ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">
                {draft.category}
              </span>
              <h1 className="mt-3 text-[34px] font-extrabold leading-[1.12] tracking-tight text-[#1a1a2e]">
                {draft.title || "Untitled post"}
              </h1>
              {draft.excerpt && (
                <p className="mt-3 text-[18px] leading-relaxed text-[#6a6b7b]">{draft.excerpt}</p>
              )}
              <div className="mt-8 max-w-[720px]">
                <BlockList blocks={draft.blocks} />
              </div>
            </div>
          )}
        </div>

        {/* 配置面板 */}
        <aside className="lg:sticky lg:top-[76px] lg:h-fit">
          <div className="overflow-hidden rounded-[22px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
            <Section title="Publish">
              <Field label="Status">
                <select
                  value={draft.status}
                  onChange={(e) => set({ status: e.target.value as PostStatus })}
                  className={inputCls}
                >
                  {(Object.keys(STATUS_STYLE) as PostStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_STYLE[s].label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Published">
                  <input
                    type="date"
                    value={draft.publishedAt}
                    onChange={(e) => set({ publishedAt: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Schedule for">
                  <input
                    type="date"
                    value={draft.scheduledAt}
                    onChange={(e) => set({ scheduledAt: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <button
                onClick={() => set({ featured: !draft.featured })}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold transition ${
                  draft.featured
                    ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]"
                    : "border-[#ececf1] text-[#6a6b7b] hover:border-[#ff5e1a]"
                }`}
              >
                <Star className={`size-4 ${draft.featured ? "fill-[#ff5e1a]" : ""}`} />
                Feature on the blog homepage
                {draft.featured && <Check className="ml-auto size-4" />}
              </button>
            </Section>

            <Section title="Content">
              <Field label="Slug" hint={`/blog/${draft.slug || "…"}`}>
                <input
                  value={draft.slug}
                  onChange={(e) =>
                    set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Category">
                <select
                  value={draft.category}
                  onChange={(e) => set({ category: e.target.value })}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Author">
                <select
                  value={draft.author.name}
                  onChange={(e) =>
                    set({ author: AUTHORS.find((a) => a.name === e.target.value) ?? draft.author })
                  }
                  className={inputCls}
                >
                  {AUTHORS.map((a) => (
                    <option key={a.name}>{a.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {draft.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-[#f3f3f6] px-2.5 py-1 text-[12px] font-semibold text-[#6a6b7b]"
                    >
                      {t}
                      <button
                        onClick={() => set({ tags: draft.tags.filter((x) => x !== t) })}
                        aria-label={`Remove ${t}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      set({ tags: [...new Set([...draft.tags, tagInput.trim()])] });
                      setTagInput("");
                    }
                  }}
                  placeholder="Add a tag, press Enter"
                  className={`${inputCls} mt-2`}
                />
              </Field>
            </Section>

            <Section title="SEO" defaultOpen={false}>
              <Field
                label="Meta title"
                hint={`${draft.seo.metaTitle.length}/60`}
              >
                <input
                  value={draft.seo.metaTitle}
                  onChange={(e) => setSeo({ metaTitle: e.target.value })}
                  placeholder={draft.title}
                  className={inputCls}
                />
              </Field>
              <Field
                label="Meta description"
                hint={`${draft.seo.metaDescription.length}/160`}
              >
                <textarea
                  value={draft.seo.metaDescription}
                  onChange={(e) => setSeo({ metaDescription: e.target.value })}
                  rows={3}
                  placeholder={draft.excerpt}
                  className={`${inputCls} resize-y`}
                />
              </Field>
              <Field label="Canonical URL">
                <input
                  value={draft.seo.canonical}
                  onChange={(e) => setSeo({ canonical: e.target.value })}
                  placeholder="https://buzzvideo.ai/blog/…"
                  className={inputCls}
                />
              </Field>
              <button
                onClick={() => setSeo({ noindex: !draft.seo.noindex })}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13.5px] font-semibold transition ${
                  draft.seo.noindex
                    ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]"
                    : "border-[#ececf1] text-[#6a6b7b] hover:border-[#ff5e1a]"
                }`}
              >
                Hide from search engines (noindex)
                {draft.seo.noindex && <Check className="ml-auto size-4" />}
              </button>

              {/* 搜索结果预览 */}
              <div className="rounded-xl bg-[#faf8f6] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a9aa8]">
                  Search preview
                </div>
                <div className="mt-2.5 text-[12px] text-[#1a7f4b]">
                  buzzvideo.ai › blog › {draft.slug}
                </div>
                <div className="mt-1 line-clamp-1 text-[16px] font-medium text-[#1a3fb8]">
                  {draft.seo.metaTitle || draft.title || "Untitled post"}
                </div>
                <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#6a6b7b]">
                  {draft.seo.metaDescription || draft.excerpt || "No description set."}
                </div>
              </div>
            </Section>
          </div>

          <Link
            href={`/prototypes/blog/${draft.slug}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#ececf1] bg-white py-3 text-[14px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
          >
            <Eye className="size-4" />
            Open the live article page
          </Link>
        </aside>
      </div>
    </div>
  );
}

/* ── 列表视图 ───────────────────────────────────────────────── */

const TABS: Array<{ key: PostStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

function BlogAdmin() {
  const posts = usePosts();
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<PostStatus | "all">("all");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2400);
  };

  /* 从文章页「Edit in admin」带 ?edit=<id> 进来时直接打开编辑器 */
  useEffect(() => {
    const id = searchParams?.get("edit");
    if (id) setEditingId(id);
  }, [searchParams]);

  const editing = posts.find((p) => p.id === editingId);

  const stats = useMemo(
    () => ({
      published: posts.filter((p) => p.status === "published").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      draft: posts.filter((p) => p.status === "draft").length,
      month: posts.filter((p) => p.publishedAt.startsWith("2026-09")).length,
    }),
    [posts],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => (tab === "all" ? true : p.status === tab))
      .filter((p) => (category === "All" ? true : p.category === category))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.slug.includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [posts, tab, category, query]);

  if (editing) {
    return <Editor key={editing.id} post={editing} onBack={() => setEditingId(null)} notify={notify} />;
  }

  return (
    <div className="min-h-screen bg-[#faf8f6]" style={{ fontFamily: APPLE_FONT }}>
      <DemoBar />

      {/* 顶栏 */}
      <div className="border-b border-[#ececf1] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-[11px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255]">
              <FileText className="size-[18px] text-white" />
            </span>
            <div>
              <div className="text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">
                Blog admin
              </div>
              <div className="text-[12.5px] text-[#9a9aa8]">Content · BuzzVideo</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                resetPosts();
                notify("Demo content restored");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
            >
              <RotateCcw className="size-3.5" />
              Reset demo data
            </button>
            <button
              onClick={() => {
                const p = createPost();
                setEditingId(p.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105"
            >
              <Plus className="size-4" />
              New post
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-6 py-8">
        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Published", value: stats.published, icon: Check },
            { label: "Scheduled", value: stats.scheduled, icon: CalendarClock },
            { label: "Drafts", value: stats.draft, icon: FileText },
            { label: "Published this month", value: stats.month, icon: Sparkles },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-[20px] border border-[#ececf1] bg-white p-5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
            >
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#9a9aa8]">
                <k.icon className="size-4" />
                {k.label}
              </div>
              <div className="mt-2 text-[32px] font-extrabold tabular-nums tracking-tight text-[#1a1a2e]">
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* 筛选条 */}
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <div className="flex max-w-full overflow-x-auto rounded-xl border border-[#ececf1] bg-white p-0.5">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 rounded-[9px] px-3.5 py-2 text-[13.5px] font-semibold transition ${
                    active ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:text-[#1a1a2e]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[13.5px] font-semibold text-[#6a6b7b] outline-none focus:border-[#ff5e1a]"
          >
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="ml-auto flex w-full items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20 sm:w-[280px]">
            <Search className="size-4 shrink-0 text-[#9a9aa8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or slug"
              className="w-full bg-transparent text-[13.5px] text-[#1a1a2e] outline-none placeholder:text-[#b6b6c2]"
            />
          </div>
        </div>

        {/* 表格 */}
        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <div className="hidden grid-cols-[minmax(0,1fr)_118px_136px_104px_108px_164px] gap-4 border-b border-[#ececf1] bg-[#faf8f6] px-6 py-3 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8] xl:grid">
            <span>Post</span>
            <span>Category</span>
            <span>Author</span>
            <span>Status</span>
            <span>Updated</span>
            <span className="text-right">Actions</span>
          </div>

          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-[16px] font-bold text-[#1a1a2e]">No posts match</div>
              <p className="mt-1.5 text-[14px] text-[#6a6b7b]">
                Try a different status tab or clear the search.
              </p>
            </div>
          ) : (
            rows.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#ececf1] px-6 py-4 transition last:border-b-0 hover:bg-[#fffaf7] xl:grid xl:grid-cols-[minmax(0,1fr)_118px_136px_104px_108px_164px] xl:items-center"
              >
                <button
                  onClick={() => setEditingId(p.id)}
                  className="flex w-full min-w-0 items-center gap-3 text-left xl:w-auto"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      {p.featured && <Star className="size-3.5 shrink-0 fill-[#ff5e1a] text-[#ff5e1a]" />}
                      <span className="truncate text-[14.5px] font-bold text-[#1a1a2e]">
                        {p.title}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-[#9a9aa8]">
                      /blog/{p.slug} · {readingMinutes(p.blocks)} min
                    </span>
                  </span>
                </button>

                <span className="text-[13.5px] text-[#6a6b7b]">{p.category}</span>
                <span className="truncate text-[13.5px] text-[#6a6b7b]">{p.author.name}</span>
                <span>
                  <StatusBadge status={p.status} />
                  {p.status === "scheduled" && p.scheduledAt && (
                    <span className="mt-1 block text-[11.5px] text-[#9a9aa8]">
                      {formatDate(p.scheduledAt)}
                    </span>
                  )}
                </span>
                <span className="text-[13px] text-[#9a9aa8]">{formatDate(p.updatedAt)}</span>

                <div className="ml-auto flex items-center gap-1 xl:ml-0 xl:justify-end">
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                  >
                    Edit
                  </button>
                  {p.status === "published" ? (
                    <button
                      onClick={() => {
                        savePost({ ...p, status: "draft" });
                        notify("Unpublished. Removed from the blog");
                      }}
                      className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        savePost({ ...p, status: "published", publishedAt: p.publishedAt || TODAY });
                        notify("Published. It is live on the blog now");
                      }}
                      className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => {
                      duplicatePost(p.id);
                      notify("Duplicated as a draft");
                    }}
                    aria-label="Duplicate"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-[#9a9aa8] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      deletePost(p.id);
                      notify("Deleted");
                    }}
                    aria-label="Delete"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-[#9a9aa8] transition hover:bg-[#fff0f0] hover:text-[#ff5255]"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-[#1a1a2e] px-5 py-3 text-[14px] font-medium text-white shadow-[0_16px_36px_rgba(26,26,46,0.2)]">
          {toast}
        </div>
      )}
    </div>
  );
}

/* useSearchParams 要求 Suspense 边界,否则 next build 预渲染这一页会失败 */
export default function BlogAdminPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#faf8f6] text-[14px] text-[#9a9aa8]"
          style={{ fontFamily: APPLE_FONT }}
        >
          Loading blog admin…
        </div>
      }
    >
      <BlogAdmin />
    </Suspense>
  );
}
