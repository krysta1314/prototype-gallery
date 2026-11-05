"use client";

/* 素材选择浮层：点素材位的「+」打开。两个来源:
   - Local Upload:系统文件选择器(真读文件，视频 / 音频读真实时长);
   - Sample Files:内置示例(评审时稳定演示超数量 / 超时长)。
   accept 限定这个素材位收哪些类型;multiple 决定一次能选几个。 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AudioLines, Check, ChevronLeft, FolderOpen, Paperclip, UsersRound } from "lucide-react";
import { kindOf, newId, type Asset, type AssetKind } from "../assets";
import { AVATARS, SAMPLE_FILES } from "../samples";
import type { Placement } from "./Popover";

const MIME: Record<AssetKind, string> = { image: "image/*", video: "video/*", audio: "audio/*" };

function readSecs(url: string, kind: "video" | "audio"): Promise<number | undefined> {
  return new Promise((resolve) => {
    const el = document.createElement(kind);
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? Math.round(el.duration * 10) / 10 : undefined);
    el.onerror = () => resolve(undefined);
    el.src = url;
  });
}

export async function fileToAsset(file: File): Promise<Asset | null> {
  const kind = kindOf(file.type);
  if (!kind) return null;
  const url = URL.createObjectURL(file);
  const secs = kind === "image" ? undefined : await readSecs(url, kind);
  return { id: newId("u"), kind, url, name: file.name, secs, source: "upload" };
}

export function AssetThumb({ asset, className = "" }: { asset: Asset; className?: string }) {
  if (asset.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={asset.url} alt="" className={`size-full object-cover ${className}`} draggable={false} />;
  if (asset.kind === "video")
    return asset.poster ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={asset.poster} alt="" className={`size-full object-cover ${className}`} draggable={false} />
    ) : (
      <video src={`${asset.url}#t=0.1`} muted playsInline preload="metadata" className={`size-full object-cover ${className}`} />
    );
  return (
    <span className={`grid size-full place-items-center bg-gradient-to-br from-[#fff3ec] to-[#ffe7d6] text-[#ff5e1a] ${className}`}>
      <AudioLines className="size-5" />
    </span>
  );
}

export function AssetPicker({
  accept,
  multiple = false,
  placement,
  onPick,
  trigger,
  disabled,
  uploadHint,
}: {
  accept: AssetKind[];
  multiple?: boolean;
  placement: Placement;
  onPick: (assets: Asset[]) => void;
  /** 触发器(通常是一个「+」格子) */
  trigger: (open: () => void, isOpen: boolean) => ReactNode;
  disabled?: boolean;
  /** Local Upload 下面那行灰字;不传按 accept 生成 */
  uploadHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const [view, setView] = useState<"menu" | "assets" | "avatars">("menu");
  const samples = SAMPLE_FILES.filter((a) => accept.includes(a.kind));
  const list = view === "avatars" ? AVATARS : samples;
  const finish = (list: Asset[]) => {
    /* 每次放进来都是新的一份(同一示例可以放两次) */
    onPick(list.map((a) => ({ ...a, id: newId(a.kind[0]) })));
    setPicked([]);
    setOpen(false);
    setView("menu");
  };
  const toggle = (a: Asset) => {
    if (!multiple) return finish([a]);
    setPicked((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]));
  };

  return (
    <div ref={ref} className="relative">
      {trigger(() => !disabled && (setOpen((o) => !o), setView("menu")), open)}
      <input
        ref={input}
        type="file"
        hidden
        multiple={multiple}
        accept={accept.map((k) => MIME[k]).join(",")}
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          const assets = (await Promise.all(files.map(fileToAsset))).filter((a): a is Asset => !!a && accept.includes(a.kind));
          if (assets.length) finish(multiple ? assets : assets.slice(0, 1));
        }}
      />
      {open && (
        <div
          role="dialog"
          aria-label="Add files"
          className={`absolute left-0 z-50 rounded-2xl border border-[#ececf1] bg-white p-2 shadow-[0_16px_40px_rgba(26,26,46,0.16)] ${view === "menu" ? "w-[300px]" : "w-[340px]"} ${
            placement === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          }`}
        >
          {view === "menu" ? (
            /* 照产品的「+」菜单:Local Upload / Assets / Avatar Library */
            <>
              <MenuRow icon={<Paperclip className="size-[18px]" />} title="Local Upload" hint={uploadHint ?? `Support ${accept.join(", ")}`} onClick={() => input.current?.click()} />
              <MenuRow icon={<FolderOpen className="size-[18px]" />} title="Assets" hint="Reuse generated & uploaded file" onClick={() => setView("assets")} />
              {accept.includes("image") && (
                <MenuRow icon={<UsersRound className="size-[18px]" />} title="Avatar Library" hint="Use AI avatars or upload your own" onClick={() => setView("avatars")} />
              )}
            </>
          ) : (
            <div className="px-1">
              <div className="flex items-center gap-1.5 pb-1">
                <button type="button" aria-label="Back" onClick={() => (setView("menu"), setPicked([]))} className="grid size-7 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f4f3f6] hover:text-[#1a1a2e]">
                  <ChevronLeft className="size-4" />
                </button>
                <p className="text-[13px] font-semibold text-[#1a1a2e]">{view === "assets" ? "Assets" : "Avatar Library"}</p>
              </div>
              <div className="mt-1 grid max-h-[220px] grid-cols-5 gap-1.5 overflow-y-auto pb-1">
                {list.map((a) => {
                  const on = picked.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      title={a.secs ? `${a.name} · ${a.secs}s` : a.name}
                      onClick={() => toggle(a)}
                      className={`relative aspect-square overflow-hidden rounded-lg ring-offset-1 transition ${on ? "ring-2 ring-[#ff5e1a]" : "hover:ring-2 hover:ring-[#d4d3df]"}`}
                    >
                      <AssetThumb asset={a} />
                      {a.secs !== undefined && (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9.5px] font-semibold tabular-nums text-white">{a.secs}s</span>
                      )}
                      {on && (
                        <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-[#ff5e1a] text-white">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {multiple && (
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[12px] text-[#9a9bb0]">{picked.length ? `${picked.length} selected` : "Pick one or more"}</span>
                  <button
                    type="button"
                    disabled={!picked.length}
                    onClick={() => finish(list.filter((a) => picked.includes(a.id)))}
                    className="rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#2a2a42] disabled:opacity-35"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MenuRow({ icon, title, hint, onClick }: { icon: ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#faf8f6]">
      <span className="mt-0.5 text-[#9a9bb0]">{icon}</span>
      <span>
        <span className="block text-[14px] font-medium text-[#1a1a2e]">{title}</span>
        <span className="mt-0.5 block text-[12px] text-[#9a9bb0]">{hint}</span>
      </span>
    </button>
  );
}
