"use client";

/* 分类管理:新建、改名、排序、删除。
   两条约束是刻意的:
   - 改名会把所有引用它的文章一起改掉,否则文章会挂在一个不存在的分类下
   - 还有文章在用的分类不给删,并告诉你有几篇在用 */

import { useState } from "react";
import { Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category, Post } from "../content";
import { addCategory, deleteCategory, moveCategory, renameCategory, reorderCategory } from "../store";

const inputCls =
  "w-full rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[14px] text-[#1a1a2e] outline-none transition placeholder:text-[#b6b6c2] focus:border-[#ff5e1a] focus:ring-2 focus:ring-[#ff5e1a]/20";

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-8 items-center justify-center rounded-lg text-[#9a9aa8] transition disabled:cursor-not-allowed disabled:opacity-35 ${
        danger ? "hover:bg-[#fff0f0] hover:text-[#ff5255]" : "hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
      }`}
    >
      {children}
    </button>
  );
}

export function CategoriesView({
  categories,
  posts,
  notify,
}: {
  categories: Category[];
  posts: Post[];
  notify: (m: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  /* 拖拽排序:记住正在拖的那一行,以及当前悬停到第几行 */
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const countFor = (name: string) => posts.filter((p) => p.category === name).length;

  const create = () => {
    if (!draft.trim()) return;
    if (addCategory(draft)) {
      notify(`Added "${draft.trim()}"`);
      setDraft("");
      setAdding(false);
    } else {
      notify("That name is already taken");
    }
  };

  const commitRename = (id: string) => {
    const before = categories.find((c) => c.id === id)?.name;
    if (renameCategory(id, editValue)) {
      notify(`Renamed to "${editValue.trim()}", posts updated`);
      setEditing(null);
    } else {
      notify(editValue.trim() === before ? "Nothing changed" : "That name is already taken");
    }
  };

  const remove = (c: Category) => {
    const r = deleteCategory(c.id);
    notify(
      r.ok
        ? `Deleted "${c.name}"`
        : `"${c.name}" is used by ${r.inUse} post${r.inUse > 1 ? "s" : ""}. Move them first.`,
    );
  };

  return (
    <div className="mx-auto max-w-[840px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#1a1a2e]">
            Blog Categories
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-[#6a6b7b]">
            Drag a row to reorder. The order here is the order readers see on the blog, and renaming a
            category also updates every post already using it.
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            setDraft("");
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)] transition hover:brightness-105"
        >
          <Plus className="size-4" />
          New category
        </button>
      </div>

      {/* 列表 */}
      <div className="overflow-hidden rounded-[22px] border border-[#ececf1] bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
        <div className="grid grid-cols-[28px_minmax(0,1fr)_90px_150px] gap-4 border-b border-[#ececf1] bg-[#faf8f6] px-5 py-3 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#9a9aa8]">
          <span />
          <span>Name</span>
          <span>Posts</span>
          <span className="text-right">Actions</span>
        </div>

        {adding && (
          <div className="grid grid-cols-[28px_minmax(0,1fr)_90px_150px] items-center gap-4 border-b border-[#ececf1] bg-[#fffaf7] px-5 py-3">
            <span />
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Category name"
              className={inputCls}
            />
            <span className="text-[13.5px] text-[#b6b6c2]">0</span>
            <div className="flex items-center justify-end gap-0.5">
              <IconBtn label="Save" onClick={create} disabled={!draft.trim()}>
                <Check className="size-4" />
              </IconBtn>
              <IconBtn label="Cancel" onClick={() => setAdding(false)}>
                <X className="size-4" />
              </IconBtn>
            </div>
          </div>
        )}

        {categories.map((c, i) => {
          const used = countFor(c.name);
          const isEditing = editing === c.id;
          return (
            <div
              key={c.id}
              draggable={!isEditing}
              onDragStart={() => setDragId(c.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverIdx(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && dragId !== c.id) setOverIdx(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorderCategory(dragId, i);
                setDragId(null);
                setOverIdx(null);
              }}
              className={`grid grid-cols-[28px_minmax(0,1fr)_90px_150px] items-center gap-4 border-b border-[#ececf1] px-5 py-3 last:border-b-0 ${
                dragId === c.id ? "opacity-40" : "hover:bg-[#fffaf7]"
              } ${overIdx === i && dragId !== c.id ? "border-t-2 border-t-[#ff5e1a]" : ""}`}
            >
              {/* 手柄同时给键盘用:聚焦后上下键即可换位 */}
              <button
                type="button"
                aria-label={`Reorder ${c.name}`}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    moveCategory(c.id, -1);
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    moveCategory(c.id, 1);
                  }
                }}
                className="cursor-grab rounded text-[#d4d3df] transition hover:text-[#6a6b7b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </button>

              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(c.id);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className={inputCls}
                />
              ) : (
                <span className="truncate text-[14.5px] font-bold text-[#1a1a2e]">{c.name}</span>
              )}

              <span className="text-[13.5px] tabular-nums text-[#6a6b7b]">{used}</span>

              <div className="flex items-center justify-end gap-0.5">
                {isEditing ? (
                  <>
                    <IconBtn label="Save" onClick={() => commitRename(c.id)}>
                      <Check className="size-4" />
                    </IconBtn>
                    <IconBtn label="Cancel" onClick={() => setEditing(null)}>
                      <X className="size-4" />
                    </IconBtn>
                  </>
                ) : (
                  <>
                    <IconBtn
                      label="Rename"
                      onClick={() => {
                        setEditing(c.id);
                        setEditValue(c.name);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </IconBtn>
                    <IconBtn
                      label={used ? `Used by ${used} posts` : "Delete"}
                      danger
                      disabled={used > 0}
                      onClick={() => remove(c)}
                    >
                      <Trash2 className="size-3.5" />
                    </IconBtn>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="text-[15px] font-bold text-[#1a1a2e]">No categories yet</p>
            <p className="mt-1.5 text-[13.5px] text-[#6a6b7b]">
              Use New category above. Posts need a category before they can be published.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
