"use client";

/* Blog Admin -- 这个需求的主角。
   列表(状态 Tab / 搜索 / 筛选)→ 编辑器(区块化正文 + 右侧配置面板)→ 状态流转。
   写入的是与前台同一个 store,所以这里发布,/prototypes/blog 立刻多一篇。 */

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  FileText,
  GripVertical,
  Heading2,
  Image as ImageIcon,
  Info,
  Link2,
  List,
  Minus,
  MousePointerClick,
  Code2,
  Plus,
  Quote,
  Table2,
  Type,
  Video,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  BLOCK_LABELS,
  AUTHORS,
  formatDate,
  newBlock,
  type Block,
  type BlockType,
  type Post,
  type PostStatus,
} from "../content";
import { BlockList, headingId } from "../blocks";
import { MediaSlot } from "../media";
import { ImageInput } from "../image-input";
import { VideoInput } from "../video-input";
import { AdminSidebar, type AdminView } from "./sidebar";
import { CategoriesView } from "./categories";
import { ImportDialog } from "../_import/import-dialog";
import type { ParseResult } from "../_import/parse";
import { DemoBar } from "../demo-bar";
import { useToast, type Notify } from "../toast";
import {
  createPost,
  deletePost,
  duplicatePost,
  resetPosts,
  savePost,
  useCategories,
  usePosts,
} from "../store";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const TODAY = "2026-09-14";

const STATUS_STYLE: Record<PostStatus, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-[#e8f7ef] text-[#1a7f4b]" },
  draft: { label: "Draft", cls: "bg-[#f3f3f6] text-[#6a6b7b]" },
  archived: { label: "Archived", cls: "bg-[#faf0e8] text-[#9a7a5a]" },
};

/* 不带宽度的基底 -- 需要固定宽度的控件用它,避免和 w-full 打架 */
const inputBase =
  "rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a2e] outline-none transition placeholder:text-[#b6b6c2] focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20";
const inputCls = `w-full ${inputBase}`;

/* 删除的两步确认。
   第一步讲清后果(会从 blog 上消失、链接失效),第二步是不可撤销的最终确认 ——
   已发布文章一旦删掉,外部链接和搜索引擎收录都会断,值得多挡一道。 */
function DeleteDialog({
  post,
  step,
  onNext,
  onCancel,
  onConfirm,
}: {
  post: Post;
  step: 1 | 2;
  onNext: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const live = post.status === "published";
  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0a0a0c]/45 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-[20px] bg-white shadow-[0_28px_70px_rgba(26,26,46,0.28)]"
      >
        <div className="flex items-start gap-3.5 px-6 pb-4 pt-6">
          <span
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${
              step === 1 ? "bg-[#fff3ec] text-[#ff5e1a]" : "bg-[#fdecec] text-[#e5484d]"
            }`}
          >
            {step === 1 ? <Trash2 className="size-[18px]" /> : <AlertTriangle className="size-[18px]" />}
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">
              {step === 1 ? "Delete this post?" : "This cannot be undone"}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">
              {step === 1 ? (
                <>
                  &ldquo;{post.title}&rdquo;
                  {live
                    ? " is live. Deleting removes it from the blog immediately and its link stops working."
                    : " will be removed from the admin."}
                </>
              ) : (
                <>
                  The post and all of its blocks are gone for good. If you only want to take it off
                  the blog, cancel and use Unpublish instead.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#ececf1] px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[13.5px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
          >
            Cancel
          </button>
          {step === 1 ? (
            <button
              onClick={onNext}
              className="rounded-xl bg-[#1a1a2e] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:brightness-125"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="rounded-xl bg-[#e5484d] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:brightness-110"
            >
              Delete permanently
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* 上下线的确认弹窗。发布与下线都会立刻改变读者看到的东西,值得挡一道。
   删除因为不可撤销,走的是另一个两步弹窗。 */
function ConfirmDialog({
  post,
  intent,
  onCancel,
  onConfirm,
}: {
  post: Post;
  intent: "publish" | "unpublish" | "archive";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const publishing = intent === "publish";
  const archiving = intent === "archive";
  const wasLive = post.status === "published";
  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0a0a0c]/45 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-[20px] bg-white shadow-[0_28px_70px_rgba(26,26,46,0.28)]"
      >
        <div className="flex items-start gap-3.5 px-6 pb-4 pt-6">
          <span
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${
              publishing
                ? "bg-[#e8f7ef] text-[#1a7f4b]"
                : archiving
                  ? "bg-[#faf0e8] text-[#9a7a5a]"
                  : "bg-[#fff3ec] text-[#ff5e1a]"
            }`}
          >
            {publishing ? (
              <Send className="size-[18px]" />
            ) : archiving ? (
              <Archive className="size-[18px]" />
            ) : (
              <EyeOff className="size-[18px]" />
            )}
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">
              {publishing
                ? "Publish this post?"
                : archiving
                  ? "Archive this post?"
                  : "Unpublish this post?"}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">
              &ldquo;{post.title}&rdquo;{" "}
              {publishing
                ? "goes live on the blog straight away and anyone with the link can read it."
                : archiving
                  ? `${wasLive ? "will come off the blog and its link stops working." : "will be filed away."} It stays under Archived and can be restored at any time.`
                  : "disappears from the blog and its link stops working. The post itself is kept as a draft."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#ececf1] px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#ececf1] bg-white px-5 py-2.5 text-[13.5px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2.5 text-[13.5px] font-bold text-white transition ${
              publishing
                ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] shadow-[0_8px_20px_rgba(255,82,85,0.28)] hover:brightness-105"
                : "bg-[#1a1a2e] hover:brightness-125"
            }`}
          >
            {publishing ? "Publish now" : archiving ? "Archive" : "Unpublish"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* 列表上方的筛选下拉。
   不用原生 <select>:它展开后的选项列表由操作系统绘制,CSS 改不了,
   在浅色后台里会弹出一片深色系统菜单,跟整套 UI 不是一回事。
   所以这里自己画弹层,并把键盘操作补齐(上下键移动、Enter 选中、Esc 关闭)。 */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const all = ["All", ...options];
  const active = value !== "All";

  /* 点外面收起 */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Filter by ${label.toLowerCase()}`}
        onClick={() => {
          setCursor(Math.max(0, all.indexOf(value)));
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCursor(Math.max(0, all.indexOf(value)));
            setOpen(true);
          }
        }}
        className={`inline-flex h-[42px] items-center gap-2 rounded-xl border pl-3.5 pr-3 text-[13.5px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
          active
            ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]"
            : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"
        }`}
      >
        {label}: {value}
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""} ${
            active ? "text-[#ff5e1a]" : "text-[#9a9aa8]"
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((i) => Math.min(i + 1, all.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              pick(all[cursor]);
            }
          }}
          ref={(el) => el?.focus()}
          className="absolute left-0 top-full z-50 mt-1.5 max-h-[280px] min-w-full overflow-y-auto whitespace-nowrap rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_18px_44px_rgba(26,26,46,0.16)] outline-none"
        >
          {all.map((o, i) => {
            const selected = o === value;
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(o)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                  i === cursor ? "bg-[#fff3ec]" : ""
                } ${selected ? "font-bold text-[#ff5e1a]" : "font-medium text-[#1a1a2e]"}`}
              >
                <Check
                  className={`size-3.5 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`}
                />
                {o === "All" ? `${label}: All` : o}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** 配置面板里的下拉选择。
   原生 <select> 的选项列表由操作系统绘制,深色菜单跟这套后台完全不是一路,
   所以和筛选器一样自绘一个 listbox。 */
function PickerSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          setCursor(Math.max(0, options.indexOf(value)));
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCursor(Math.max(0, options.indexOf(value)));
            setOpen(true);
          }
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-[14px] font-medium text-[#1a1a2e] outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
          open ? "border-[#ff5e1a]" : "border-[#ececf1] hover:border-[#d4d3df]"
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#9a9aa8] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((i) => Math.min(i + 1, options.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              pick(options[cursor]);
            }
          }}
          ref={(el) => el?.focus()}
          className="absolute left-0 top-full z-50 mt-1.5 max-h-[260px] w-full overflow-y-auto rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_18px_44px_rgba(26,26,46,0.16)] outline-none"
        >
          {options.map((o, i) => {
            const selected = o === value;
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(o)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                  i === cursor ? "bg-[#fff3ec]" : ""
                } ${selected ? "font-bold text-[#ff5e1a]" : "font-medium text-[#1a1a2e]"}`}
              >
                <Check className={`size-3.5 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`} />
                <span className="truncate">{o}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** 列表行的图标动作按钮 */
function RowAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  /* 自绘 tooltip 而不是用原生 title:原生的要等一秒才出、样式由系统决定,
     跟这套后台不是一回事。键盘聚焦时也要出得来,所以用 focus-within 一起触发。 */
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex size-8 items-center justify-center rounded-lg text-[#9a9aa8] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${
          danger
            ? "hover:bg-[#fff0f0] hover:text-[#ff5255]"
            : "hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
        }`}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1a1a2e] px-2 py-1 text-[11.5px] font-semibold text-white opacity-0 shadow-[0_6px_16px_rgba(26,26,46,0.22)] transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 motion-reduce:transition-none"
      >
        {label}
      </span>
    </span>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  /* 兜底:旧数据里可能残留已下线的状态(比如 scheduled),查不到时不能让整页崩掉 */
  const s = STATUS_STYLE[status] ?? { label: status, cls: "bg-[#f3f3f6] text-[#6a6b7b]" };
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
          <ImageInput src={block.src} onChange={(src) => set({ src })} />
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
          <VideoInput src={block.src} onChange={(src) => set({ src })} />
          <input
            value={block.caption}
            onChange={(e) => set({ caption: e.target.value })}
            placeholder="Caption"
            className={inputCls}
          />
        </div>
      );

    case "table":
      return (
        <div className="space-y-2.5">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {block.head.map((h, i) => (
                    <th key={i} className="p-1">
                      <input
                        value={h}
                        onChange={(e) =>
                          set({ head: block.head.map((x, j) => (j === i ? e.target.value : x)) })
                        }
                        className={`${inputCls} font-bold`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="p-1">
                        <input
                          value={cell}
                          onChange={(e) =>
                            set({
                              rows: block.rows.map((rr, j) =>
                                j === r ? rr.map((cc, k) => (k === c ? e.target.value : cc)) : rr,
                              ),
                            })
                          }
                          className={inputCls}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                set({
                  head: [...block.head, "Column"],
                  rows: block.rows.map((r) => [...r, ""]),
                })
              }
              className="text-[13px] font-semibold text-[#ff5e1a]"
            >
              + Column
            </button>
            <button
              onClick={() => set({ rows: [...block.rows, block.head.map(() => "")] })}
              className="text-[13px] font-semibold text-[#ff5e1a]"
            >
              + Row
            </button>
            {/* 加得了就得删得掉:之前只有删行没有删列,多点一次 + Column 就没法收回 */}
            {block.head.length > 1 && (
              <button
                onClick={() =>
                  set({
                    head: block.head.slice(0, -1),
                    rows: block.rows.map((r) => r.slice(0, -1)),
                  })
                }
                className="text-[13px] font-semibold text-[#9a9aa8] hover:text-[#ff5255]"
              >
                Remove last column
              </button>
            )}
            {block.rows.length > 1 && (
              <button
                onClick={() => set({ rows: block.rows.slice(0, -1) })}
                className="text-[13px] font-semibold text-[#9a9aa8] hover:text-[#ff5255]"
              >
                Remove last row
              </button>
            )}
          </div>
        </div>
      );

    case "references":
      return (
        <div className="space-y-2.5">
          {block.items.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={r.label}
                onChange={(e) =>
                  set({
                    items: block.items.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    ),
                  })
                }
                placeholder="Source title"
                className={inputCls}
              />
              <input
                value={r.href}
                onChange={(e) =>
                  set({
                    items: block.items.map((x, j) =>
                      j === i ? { ...x, href: e.target.value } : x,
                    ),
                  })
                }
                placeholder="https://"
                className={inputCls}
              />
              <button
                onClick={() => set({ items: block.items.filter((_, j) => j !== i) })}
                aria-label="Remove reference"
                className="shrink-0 rounded-lg border border-[#ececf1] px-2.5 text-[#9a9aa8] transition hover:border-[#ff5255] hover:text-[#ff5255]"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => set({ items: [...block.items, { label: "", href: "" }] })}
            className="text-[13px] font-semibold text-[#ff5e1a]"
          >
            + Add reference
          </button>
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

/* 正文顶部常驻的插入条。
   区块之间的 hover 插入位太隐蔽,而拉到页尾按 Add block 又要滚很久 ——
   所以把常用类型摆在这里,跟着页面滚,插在"你正在编辑的那一块"后面。 */
const BLOCK_ICON: Record<BlockType, React.ElementType> = {
  paragraph: Type,
  heading: Heading2,
  image: ImageIcon,
  quote: Quote,
  list: List,
  code: Code2,
  callout: Info,
  cta: MousePointerClick,
  video: Video,
  table: Table2,
  references: Link2,
  divider: Minus,
};

function BlockToolbar({
  onAdd,
  position,
}: {
  onAdd: (t: BlockType) => void;
  /** 给用户交代这一下会插到哪里 */
  position: string;
}) {
  return (
    <div className="sticky top-[76px] h-fit">
      {/* 十二种全列出来,并且写上名字:光看图标分不清 callout 和 references。
          窄屏收成纯图标,免得把正文挤没。 */}
      <div className="flex flex-col gap-0.5 rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
        {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => {
          const Icon = BLOCK_ICON[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => onAdd(t)}
              aria-label={BLOCK_LABELS[t]}
              className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-[12.5px] font-semibold text-[#6a6b7b] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 xl:px-2.5"
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden whitespace-nowrap xl:inline">{BLOCK_LABELS[t]}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 px-1 text-[10.5px] leading-tight text-[#b6b6c2]">{position}</p>
    </div>
  );
}

function AddBlockMenu({
  onAdd,
  variant = "bar",
}: {
  onAdd: (t: BlockType) => void;
  variant?: "bar" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const inline = variant === "inline";

  return (
    <div className={inline ? "group/add relative h-5" : "relative"}>
      {inline ? (
        /* 块之间的插入位:平时只是一条几乎看不见的空隙,鼠标移上去才显形 ——
           每块之间都摆一个常驻按钮会把正文切得很碎。 */
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Insert block here"
          className="flex h-5 w-full items-center gap-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/add:opacity-100"
        >
          <span className="h-px flex-1 bg-[#ffd0b8]" />
          <span className="inline-flex items-center gap-1 rounded-full border border-[#ffd0b8] bg-white px-2 py-0.5 text-[11px] font-bold text-[#ff5e1a]">
            <Plus className="size-3" />
            Insert
          </span>
          <span className="h-px flex-1 bg-[#ffd0b8]" />
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d4d3df] bg-white py-3.5 text-[14px] font-semibold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
        >
          <Plus className="size-4" />
          Add block
        </button>
      )}

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div
            className={`absolute z-50 grid grid-cols-2 gap-1 rounded-[18px] border border-[#ececf1] bg-white p-2 shadow-[0_24px_60px_rgba(26,26,46,0.18)] sm:grid-cols-3 ${
              inline ? "left-0 top-full mt-1 w-[min(560px,100%)]" : "inset-x-0 bottom-full mb-2"
            }`}
          >
            {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => {
              const Icon = BLOCK_ICON[t];
              return (
                <button
                  key={t}
                  onClick={() => {
                    onAdd(t);
                    setOpen(false);
                  }}
                  className="group/item flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium text-[#1a1a2e] transition hover:bg-[#fff7f1] hover:text-[#ff5e1a]"
                >
                  <Icon className="size-4 shrink-0 text-[#9a9aa8] transition group-hover/item:text-[#ff5e1a]" />
                  {BLOCK_LABELS[t]}
                </button>
              );
            })}
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
  notify: Notify;
}) {
  const categories = useCategories();
  const [draft, setDraft] = useState<Post>(post);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [reimport, setReimport] = useState(false);
  const [tagInput, setTagInput] = useState("");
  /* 区块拖拽排序。draggable 只在按住手柄时才打开 ——
     常开的话整块都变成可拖对象,里面的 textarea 就没法选中文字了。 */
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState<null | "save" | "publish">(null);
  /* 工具条插到"正在编辑的那一块"后面;还没点过任何块就追加到末尾 */
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

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

  const previewToc = useMemo(
    () =>
      draft.blocks
        .filter((b) => b.type === "heading")
        .map((b) => ({
          text: (b as { text: string }).text,
          level: (b as { level: 2 | 3 }).level,
        })),
    [draft.blocks],
  );

  const reorderBlock = (from: number, to: number) =>
    setDraft((d) => {
      if (from === to) return d;
      const next = [...d.blocks];
      const [moved] = next.splice(from, 1);
      next.splice(from < to ? to - 1 : to, 0, moved);
      return { ...d, blocks: next };
    });

  const insertBlock = (at: number, t: BlockType) =>
    setDraft((d) => {
      const next = [...d.blocks];
      next.splice(at, 0, newBlock(t));
      return { ...d, blocks: next };
    });

  const removeBlock = (i: number) => {
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, j) => j !== i) }));
    /* 删掉的正好是"当前这一块"就退回上一块;删的是它前面的,序号整体前移一位 */
    setFocusIdx((cur) => {
      if (cur === null) return null;
      if (cur === i) return i > 0 ? i - 1 : null;
      return cur > i ? cur - 1 : cur;
    });
  };

  const copyBlock = (i: number) =>
    setDraft((d) => {
      const next = [...d.blocks];
      next.splice(i + 1, 0, { ...d.blocks[i], id: `b${Date.now()}` });
      return { ...d, blocks: next };
    });

  /* 保存是异步的(真实后台要打一次接口),所以按钮先转圈再出 toast ——
     瞬间弹成功提示会让人怀疑到底存没存。这里用一小段延时模拟那一跳。 */
  const save = (extra?: Partial<Post>, msg = "Draft saved", kind: "save" | "publish" = "save") =>
    new Promise<void>((resolve) => {
      const next = { ...draft, ...extra };
      setDraft(next);
      setPending(kind);
      window.setTimeout(() => {
        const ok = savePost(next);
        setPending(null);
        if (ok) notify(msg);
        else notify("Kept in this session only: browser storage is full or blocked", "error");
        resolve();
      }, 550);
    });

  const publish = () =>
    save(
      { status: "published", publishedAt: draft.publishedAt || TODAY },
      "Published. It is live on the blog now",
      "publish",
    );

  return (
    <div className="min-h-screen bg-[#faf8f6]" style={{ fontFamily: APPLE_FONT }}>
      <ImportDialog
        open={reimport}
        onClose={() => setReimport(false)}
        onBlank={() => setReimport(false)}
        overwriteTitle={draft.title || "Untitled post"}
        onImport={(r) => {
          /* 重新导入只换正文与标题摘要,slug / 分类 / 作者 / SEO 这些后台配置保留 */
          setDraft((d) => ({
            ...d,
            title: r.title || d.title,
            excerpt: r.excerpt || d.excerpt,
            blocks: r.blocks,
          }));
          setReimport(false);
          notify(`Re-imported ${r.blocks.length} blocks`);
        }}
      />

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
              onClick={() => setReimport(true)}
              className="rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-bold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
            >
              Re-import
            </button>
            <button
              onClick={() => save()}
              disabled={pending !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === "save" && <Loader2 className="size-3.5 animate-spin" />}
              {pending === "save" ? "Saving…" : "Save draft"}
            </button>
            <button
              onClick={publish}
              disabled={pending !== null}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2 text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === "publish" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {pending === "publish" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1340px] gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* 正文区。写作态左边挂一条竖工具栏 —— 横条压在正文上方会把标题和第一块推远,
            放左边既常驻又不占正文的垂直空间。 */}
        <div className={tab === "write" ? "flex gap-3" : ""}>
          {tab === "write" && (
            <BlockToolbar
              onAdd={(t) => {
                const at = focusIdx === null ? draft.blocks.length : focusIdx + 1;
                insertBlock(at, t);
                setFocusIdx(at);
              }}
              position={
                focusIdx === null
                  ? "Adds to the end"
                  : `Inserts after block ${focusIdx + 1}`
              }
            />
          )}
          {tab === "write" ? (
            <div className="min-w-0 flex-1 rounded-[22px] border border-[#ececf1] bg-white p-7 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
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

              <div className="mt-6 border-t border-[#ececf1] pt-5 text-[12.5px] text-[#9a9aa8]">
                {draft.blocks.length} blocks
              </div>

              {/* 不用 space-y / gap:块与块之间的缝就是插入位本身,
                  这样整条缝都能 hover,不会出现"要对准 2px 才出按钮" */}
              <div className="mt-5 flex flex-col">
                {draft.blocks.map((b, i) => (
                  <Fragment key={b.id}>
                    <AddBlockMenu variant="inline" onAdd={(t) => insertBlock(i, t)} />
                  <div
                    onFocusCapture={() => setFocusIdx(i)}
                    onMouseDown={() => setFocusIdx(i)}
                    draggable={armed}
                    onDragStart={(e) => {
                      setDragIdx(i);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      if (dragIdx === null) return;
                      e.preventDefault();
                      /* 落在上半区插到这块前面,下半区插到后面 */
                      const r = e.currentTarget.getBoundingClientRect();
                      setOverIdx(e.clientY - r.top > r.height / 2 ? i + 1 : i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIdx !== null && overIdx !== null) reorderBlock(dragIdx, overIdx);
                      setDragIdx(null);
                      setOverIdx(null);
                      setArmed(false);
                    }}
                    onDragEnd={() => {
                      setDragIdx(null);
                      setOverIdx(null);
                      setArmed(false);
                    }}
                    className={`group rounded-[18px] border bg-white p-4 transition ${
                      dragIdx === i
                        ? "border-[#ff5e1a] opacity-40"
                        : focusIdx === i
                          ? "border-[#ff5e1a] ring-2 ring-[#ff5e1a]/15"
                          : "border-[#ececf1] hover:border-[#d4d3df]"
                    } ${
                      dragIdx !== null && overIdx === i && dragIdx !== i
                        ? "border-t-2 border-t-[#ff5e1a]"
                        : ""
                    } ${
                      dragIdx !== null && overIdx === i + 1 && dragIdx !== i
                        ? "border-b-2 border-b-[#ff5e1a]"
                        : ""
                    }`}
                  >
                    <div className="mb-2.5 flex items-center gap-2">
                      <span
                        onMouseDown={() => setArmed(true)}
                        onMouseUp={() => setArmed(false)}
                        aria-label="Drag to reorder"
                        title="Drag to reorder"
                        className="inline-flex cursor-grab text-[#d4d3df] transition hover:text-[#6a6b7b] active:cursor-grabbing"
                      >
                        <GripVertical className="size-4" />
                      </span>
                      {/* 序号。工具条说"插到第 N 块后面",块上就得能数出这个 N,
                          否则那句提示对不上任何东西。拖动重排后自动跟着变。 */}
                      <span
                        className={`inline-flex min-w-[20px] justify-center rounded-md px-1 py-0.5 text-[10.5px] font-bold tabular-nums ${
                          focusIdx === i ? "bg-[#fff3ec] text-[#ff5e1a]" : "bg-[#f5f5f8] text-[#9a9aa8]"
                        }`}
                      >
                        {i + 1}
                      </span>
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
                  </Fragment>
                ))}

                <div className="mt-3">
                  <AddBlockMenu onAdd={(t) => insertBlock(draft.blocks.length, t)} />
                </div>
              </div>
            </div>
          ) : (
            /* 预览的版式跟着前台文章页走:分类 → 标题 → 摘要 → 日期 → 分隔线 → 目录 + 正文。封面只出现在列表卡片和分享卡,文章页内不重复。
               顺序错了预览就失去意义,所以这里刻意和 [slug]/page.tsx 对齐。
               外层不能加 overflow-hidden:祖先一旦裁剪,里面目录的 sticky 就失效。 */
            <div className="rounded-[22px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
              <header className="border-b border-[#ececf1] px-9 pb-9 pt-10">
                <span className="inline-block rounded-full bg-[#fff3ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">
                  {draft.category}
                </span>
                <h1 className="mt-4 text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.12] tracking-tight text-[#1a1a2e]">
                  {draft.title || "Untitled post"}
                </h1>
                {draft.excerpt && (
                  <p className="mt-4 text-[18px] leading-relaxed text-[#6a6b7b]">{draft.excerpt}</p>
                )}
                <div className="mt-6 text-[14px] text-[#9a9aa8]">
                  {draft.publishedAt ? formatDate(draft.publishedAt) : "Not published yet"}
                </div>
              </header>

              <div className="grid gap-10 px-9 py-11 xl:grid-cols-[180px_minmax(0,1fr)]">
                <aside className="hidden xl:block">
                  {previewToc.length > 0 && (
                    <nav className="sticky top-24">
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9aa8]">
                        On this page
                      </div>
                      <ul className="mt-3.5 space-y-2.5 border-l border-[#ececf1]">
                        {previewToc.map((h) => (
                          <li key={h.text}>
                            <a
                              href={`#${headingId(h.text)}`}
                              onClick={(e) => {
                                e.preventDefault();
                                document
                                  .getElementById(headingId(h.text))
                                  ?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className={`block border-l-2 border-transparent text-[13.5px] leading-snug text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a] ${
                                h.level === 3 ? "pl-6" : "pl-4"
                              }`}
                            >
                              {h.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  )}
                </aside>
                <div className="min-w-0 max-w-[720px]">
                  <BlockList blocks={draft.blocks} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 配置面板 */}
        {/* SEO 全展开后面板比视口高,sticky 会把底部卡在屏幕外 ——
            所以给它自己一条滚动条,顶栏 76px 之外的高度全留给它。 */}
        <aside className="lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto lg:overscroll-contain lg:pb-2">
          <div className="overflow-hidden rounded-[22px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
            <Section title="Publish">
              {/* 状态和发布时间都不是手填的:状态由顶栏的 Publish / Unpublish 决定,
                  发布时间就是点 Publish 的那一刻。这里只做只读回显。 */}
              <div className="rounded-xl bg-[#faf8f6] px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-[#1a1a2e]">Status</span>
                  <StatusBadge status={draft.status} />
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-[#ececf1] pt-2.5">
                  <span className="text-[12.5px] font-bold text-[#1a1a2e]">Published</span>
                  <span className="text-[13px] font-semibold text-[#6a6b7b]">
                    {draft.publishedAt ? formatDate(draft.publishedAt) : "Not published yet"}
                  </span>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed text-[#9a9aa8]">
                Set by the Publish button — the date is stamped the moment the post goes live.
              </p>
            </Section>

            <Section title="Content">
              {/* 封面只配这一张:落地页卡片、Related Posts 卡片和社交分享卡取它;文章页内不重复出现 */}
              <Field label="Cover image" hint="16:9 · 1600×900">
                <ImageInput src={draft.cover} onChange={(cover) => set({ cover })} />
              </Field>
              <Field label="Slug">
                {/* 完整地址过长时换行会顶开整块面板,所以把 /blog/ 做成输入框内的前缀,
                    真实地址只在下面单行省略显示。 */}
                <div className="flex items-stretch overflow-hidden rounded-xl border border-[#ececf1] bg-white transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                  <span className="flex select-none items-center border-r border-[#ececf1] bg-[#faf8f6] px-2.5 text-[13px] font-semibold text-[#9a9aa8]">
                    /blog/
                  </span>
                  <input
                    value={draft.slug}
                    onChange={(e) =>
                      set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-[#1a1a2e] outline-none placeholder:text-[#b6b6c2]"
                    placeholder="post-url"
                  />
                </div>
              </Field>
              <Field label="Category">
                <PickerSelect
                  ariaLabel="Category"
                  value={draft.category}
                  options={categories.map((c) => c.name)}
                  onChange={(v) => set({ category: v })}
                />
              </Field>
              <Field label="Author">
                <PickerSelect
                  ariaLabel="Author"
                  value={draft.author.name}
                  options={AUTHORS.map((a) => a.name)}
                  onChange={(v) =>
                    set({ author: AUTHORS.find((a) => a.name === v) ?? draft.author })
                  }
                />
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

            <Section title="SEO">
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

              {/* 社交分享卡片:标题和描述沿用上面的 meta,只有图是单独的一张,
                  所以这里不再重复两个输入框,只放图和一个预览。 */}
              <div className="rounded-xl bg-[#faf8f6] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a9aa8]">
                  Social preview
                </div>
                <div className="mt-2.5 overflow-hidden rounded-xl border border-[#ececf1] bg-white">
                  <MediaSlot label="Cover · 16:9" ratio="aspect-[16/9]" src={draft.cover} />
                  <div className="p-3">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#9a9aa8]">
                      buzzvideo.ai
                    </div>
                    <div className="mt-1 line-clamp-1 text-[13.5px] font-bold text-[#1a1a2e]">
                      {draft.seo.metaTitle || draft.title || "Untitled post"}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#6a6b7b]">
                      {draft.seo.metaDescription || draft.excerpt || "No description set."}
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#9a9aa8]">
                  Falls back to the cover image and the meta fields above when nothing is set here.
                </p>
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
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

function BlogAdmin() {
  const posts = usePosts();
  const categories = useCategories();
  const searchParams = useSearchParams();
  const [view, setView] = useState<AdminView>("posts");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<PostStatus | "all">("all");
  const [category, setCategory] = useState("All");
  const [author, setAuthor] = useState("All");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  /* 删除要过两道确认:第一道说清后果,第二道是不可撤销的最终确认 */
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [confirming, setConfirming] = useState<{
    post: Post;
    intent: "publish" | "unpublish" | "archive";
  } | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);

  const [notify, toastNode] = useToast();

  /* 导入落成一篇 Draft,直接进编辑器 —— 导入只省掉打字,模组仍要编辑过一遍 */
  const importAsDraft = (r: ParseResult) => {
    const p = createPost();
    const next = {
      ...p,
      title: r.title || "Untitled post",
      excerpt: r.excerpt,
      slug: (r.title || "untitled-post")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60),
      blocks: r.blocks,
    };
    const ok = savePost(next);
    setCreating(false);
    setEditingId(next.id);
    notify(
      ok
        ? `Imported ${r.blocks.length} blocks as a draft`
        : `Imported ${r.blocks.length} blocks, but browser storage is full so this is session-only`,
      ok ? "success" : "error",
    );
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
      draft: posts.filter((p) => p.status === "draft").length,
      archived: posts.filter((p) => p.status === "archived").length,
      month: posts.filter((p) => p.publishedAt.startsWith("2026-09")).length,
    }),
    [posts],
  );

  /* 作者选项从文章里现算,而不是读固定的 AUTHORS —— 只列出真的有文章的人 */
  const authorNames = useMemo(
    () => [...new Set(posts.map((p) => p.author.name))].sort(),
    [posts],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => (tab === "all" ? true : p.status === tab))
      .filter((p) => (category === "All" ? true : p.category === category))
      .filter((p) => (author === "All" ? true : p.author.name === author))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.slug.includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [posts, tab, category, author, query]);

  /* 编辑器是另一条 return 分支,toastNode 要在这里一并挂上,
     否则编辑器里的保存 / 发布提示根本没有渲染位置。 */
  if (editing) {
    return (
      <>
        <Editor key={editing.id} post={editing} onBack={() => setEditingId(null)} notify={notify} />
        {toastNode}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f6]" style={{ fontFamily: APPLE_FONT }}>
      <ImportDialog
        open={creating}
        onClose={() => setCreating(false)}
        onBlank={() => {
          const p = createPost();
          setEditingId(p.id);
        }}
        onImport={importAsDraft}
      />

      {confirming && (
        <ConfirmDialog
          post={confirming.post}
          intent={confirming.intent}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const { post: p, intent } = confirming;
            if (intent === "publish") {
              savePost({ ...p, status: "published", publishedAt: p.publishedAt || TODAY });
              notify("Published. It is live on the blog now");
            } else if (intent === "archive") {
              savePost({ ...p, status: "archived" });
              notify(`Archived "${p.title}"`);
            } else {
              savePost({ ...p, status: "draft" });
              notify("Unpublished. Removed from the blog");
            }
            setConfirming(null);
          }}
        />
      )}

      {deleting && (
        <DeleteDialog
          post={deleting}
          step={deleteStep}
          onNext={() => setDeleteStep(2)}
          onCancel={() => {
            setDeleting(null);
            setDeleteStep(1);
          }}
          onConfirm={() => {
            deletePost(deleting.id);
            notify(`Deleted "${deleting.title}"`);
            setDeleting(null);
            setDeleteStep(1);
          }}
        />
      )}

      <DemoBar />

      <div className="flex">
        <AdminSidebar view={view} onGoto={setView} />
        <div className="min-w-0 flex-1">
          {view === "categories" ? (
            <CategoriesView categories={categories} posts={posts} notify={notify} />
          ) : (
            <PostsView />
          )}
        </div>
      </div>

      {toastNode}
    </div>
  );

  function PostsView() {
    return (
      <>
      {/* 顶栏 */}
      <div className="border-b border-[#ececf1] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-[11px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255]">
              <FileText className="size-[18px] text-white" />
            </span>
            <div>
              <div className="text-[17px] font-extrabold tracking-tight text-[#1a1a2e]">
                Blog Posts
              </div>
              <div className="text-[12.5px] text-[#9a9aa8]">
                Write, schedule and publish articles for the blog
              </div>
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
              onClick={() => setCreating(true)}
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
            /* 第一格写 total,否则和第三格的 this month 挨在一起容易看混 */
            { label: "Total published", value: stats.published, icon: Check },
            { label: "Published this month", value: stats.month, icon: Sparkles },
            { label: "Drafts", value: stats.draft, icon: FileText },
            { label: "Archived", value: stats.archived, icon: Archive },
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
          <FilterSelect
            label="Category"
            value={category}
            options={categories.map((c) => c.name)}
            onChange={setCategory}
          />
          <FilterSelect
            label="Author"
            value={author}
            options={authorNames}
            onChange={setAuthor}
          />
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
        {/* 不用 overflow-hidden:它会把行内 tooltip 裁掉。圆角改由表头和末行各自承担 */}
        <div className="mt-5 rounded-[22px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <div className="hidden grid-cols-[minmax(0,1fr)_118px_136px_104px_108px_176px] gap-4 rounded-t-[22px] border-b border-[#ececf1] bg-[#faf8f6] px-6 py-3 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8] xl:grid">
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
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#ececf1] px-6 py-4 transition last:rounded-b-[22px] last:border-b-0 hover:bg-[#fffaf7] xl:grid xl:grid-cols-[minmax(0,1fr)_118px_136px_104px_108px_176px] xl:items-center"
              >
                <button
                  onClick={() => setEditingId(p.id)}
                  className="flex w-full min-w-0 items-center gap-3 text-left xl:w-auto"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14.5px] font-bold text-[#1a1a2e]">
                        {p.title}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-[#9a9aa8]">
                      /blog/{p.slug}
                    </span>
                  </span>
                </button>

                <span className="text-[13.5px] text-[#6a6b7b]">{p.category}</span>
                <span className="truncate text-[13.5px] text-[#6a6b7b]">{p.author.name}</span>
                <span>
                  <StatusBadge status={p.status} />
                </span>
                <span className="text-[13px] text-[#9a9aa8]">{formatDate(p.updatedAt)}</span>

                {/* 四个动作全部用 icon。纯图标必须带 title 与 aria-label,
                    否则鼠标用户猜不出、读屏用户读不出。 */}
                <div className="ml-auto flex items-center gap-0.5 xl:ml-0 xl:justify-end">
                  <RowAction label="Edit" onClick={() => setEditingId(p.id)}>
                    <Pencil className="size-[15px]" />
                  </RowAction>

                  {p.status === "archived" ? (
                    /* 归档态只提供「取回」:回到草稿,想上线再走 Publish,不跳过确认 */
                    <RowAction
                      label="Restore to drafts"
                      onClick={() => {
                        savePost({ ...p, status: "draft" });
                        notify(`Restored "${p.title}" to drafts`);
                      }}
                    >
                      <ArchiveRestore className="size-[15px]" />
                    </RowAction>
                  ) : p.status === "published" ? (
                    <RowAction
                      label="Unpublish"
                      onClick={() => setConfirming({ post: p, intent: "unpublish" })}
                    >
                      <EyeOff className="size-[15px]" />
                    </RowAction>
                  ) : (
                    <RowAction
                      label="Publish"
                      onClick={() => setConfirming({ post: p, intent: "publish" })}
                    >
                      <Send className="size-[15px]" />
                    </RowAction>
                  )}

                  <RowAction
                    label="Duplicate"
                    onClick={() => {
                      duplicatePost(p.id);
                      notify("Duplicated as a draft");
                    }}
                  >
                    <Copy className="size-[15px]" />
                  </RowAction>

                  {p.status !== "archived" && (
                    <RowAction
                      label="Archive"
                      onClick={() => setConfirming({ post: p, intent: "archive" })}
                    >
                      <Archive className="size-[15px]" />
                    </RowAction>
                  )}

                  <RowAction
                    label="Delete"
                    danger
                    onClick={() => {
                      setDeleteStep(1);
                      setDeleting(p);
                    }}
                  >
                    <Trash2 className="size-[15px]" />
                  </RowAction>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      </>
    );
  }
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
