"use client";

/* Hybrid Reel Agent 落地页界面:只保留 composer 主体 —— 加素材、写一句话、Create。
   开发原型与评审原型共用;Create 之后去哪由调用方的 onCreate 决定。
   缩略图按 item.kind 判断,评审原型的预置项(只有预览 URL,没有 File)也能显示。 */

import { useRef, useState } from "react";
import { ArrowUp, Clapperboard, Film, Music, Plus, X } from "lucide-react";
import { APPLE_FONT, HistoryRail, IconRail, TopBar } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/shell";
import type { HomeItem } from "./api";
import type { MediaKind } from "./store";

const kindOf = (f: File): MediaKind =>
  f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name) ? "image" : f.type.startsWith("audio/") ? "audio" : "video";

export function AgentHome({
  initialItems = [],
  initialPrompt = "",
  onCreate,
}: {
  initialItems?: HomeItem[];
  initialPrompt?: string;
  onCreate: (items: HomeItem[], prompt: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<HomeItem[]>(initialItems);
  const [draft, setDraft] = useState(initialPrompt);
  const canCreate = items.length > 0;

  const add = (list: FileList | null) => {
    if (!list) return;
    setItems((prev) => [
      ...prev,
      ...Array.from(list).map((file) => ({ file, url: URL.createObjectURL(file), name: file.name, kind: kindOf(file) })),
    ]);
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
        <TopBar />
        <main className="grid flex-1 place-items-center px-6">
          <div className="w-full max-w-[760px]">
            <h1 className="mb-6 text-center text-[28px] font-semibold tracking-tight text-[#1a1a2e]">
              Turn your footage into a finished ad
            </h1>
            <div className="rounded-[20px] border border-[#ececf1] bg-white p-3 shadow-[0_4px_18px_rgba(26,26,46,0.06)]">
              {items.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto px-1 pt-1">
                  {items.map((f, i) => (
                    <span key={f.url} className="group relative size-16 shrink-0 overflow-hidden rounded-xl border border-[#ececf1] bg-[#f4f4f7]">
                      {f.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url} alt="" className="size-full object-cover" />
                      ) : f.kind === "video" ? (
                        <video src={`${f.url}#t=0.5`} muted preload="metadata" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-[#9a9bb0]">
                          {f.kind === "audio" ? <Music className="size-5" /> : <Film className="size-5" />}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setItems((prev) => prev.filter((_, k) => k !== i))}
                        className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault();
                    create();
                  }
                }}
                placeholder="Add your product footage and tell me what ad to make…"
                className="w-full resize-none bg-transparent px-1 pb-2 pt-1 text-[14.5px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Add footage"
                  className="grid size-9 place-items-center rounded-lg border border-[#ececf1] bg-white text-[#6a6b7b] transition hover:bg-[#f6f7f9]"
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
                    add(e.target.files);
                    e.target.value = "";
                  }}
                />
                <span className="flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-[7px] text-[13px] font-semibold text-[#ff5e1a]">
                  <Clapperboard className="size-4" /> Hybrid Reel
                </span>
                <button
                  type="button"
                  onClick={create}
                  disabled={!canCreate}
                  aria-label="Create"
                  title={canCreate ? "Create" : "Add footage first"}
                  className="ml-auto grid size-9 place-items-center rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white transition hover:brightness-105 disabled:opacity-40"
                >
                  <ArrowUp className="size-4" strokeWidth={2.6} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
