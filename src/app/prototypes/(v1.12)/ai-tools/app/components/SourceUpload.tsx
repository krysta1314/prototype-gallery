"use client";

/* 工具页的上传卡(2026-11-05 Monica 定，版式参考她给的「Reference Video / Character Image」):
   卡片 = 图标 +「Upload an image / a video / audio」+ 一行写清楚格式和大小 / 时长(2026-11-06 Monica 定);
   页面上有两个以上素材时底部再加一条素材名(label),两张并排(调用方用 grid 排);只有一个素材的页面不加。
   点卡片弹出和首页「+」同一个菜单:Local Upload / Assets / Avatar Library(头像库只在收图片时出现);
   2026-11-06 Monica 定：工具页只给入口，点 Assets / Avatar Library 不展开原型里的素材列表，只出提示。
   选中的都转成 File 交给 onFiles,后面的格式 / 时长校验和拖进来的文件走同一条路。 */

import type { ReactNode } from "react";
import type { Notify } from "./TopToast";
import { AssetPicker } from "@/app/prototypes/(v1.12)/video-gen-modes/app/components/AssetPicker";
import type { Asset, AssetKind } from "@/app/prototypes/(v1.12)/video-gen-modes/app/assets";

/** 单个文件大小上限(MB,卡片上写给用户看;待和后端确认) */
export const MAX_MB = { image: 20, video: 200, audio: 50 } as const;

/** 选文件时就挡掉超过大小的(2026-11-06 Monica 定：不合格的文件不放进去，顶部提示原因);没问题返回 null */
export function sizeProblem(file: { name: string; size: number }, kind: keyof typeof MAX_MB): string | null {
  const mb = file.size / (1024 * 1024);
  if (mb <= MAX_MB[kind]) return null;
  const noun = kind === "image" ? "Images" : kind === "video" ? "Videos" : "Audio files";
  return `${file.name} is ${Math.round(mb)} MB. ${noun} can be up to ${MAX_MB[kind]} MB.`;
}

/** 资产库 / 头像库里的素材转成 File(原型里都是站内地址，fetch 得到) */
async function toFile(a: Asset): Promise<File | null> {
  try {
    const blob = await (await fetch(a.url)).blob();
    return new File([blob], a.name, { type: blob.type || (a.kind === "image" ? "image/png" : a.kind === "video" ? "video/mp4" : "audio/mpeg") });
  } catch {
    return null;
  }
}

export function SourceUpload({
  kinds,
  icon,
  title,
  hint,
  label,
  multiple = false,
  dragging = false,
  onFiles,
  notify,
}: {
  /** 这个素材位收哪些类型 */
  kinds: AssetKind[];
  icon: ReactNode;
  title: string;
  /** 支持的格式 + 大小 / 时长,直接写在卡片上 */
  hint: string;
  /** 卡片底部的素材名(页面上有多个素材时才传) */
  label?: string;
  multiple?: boolean;
  dragging?: boolean;
  /** 本地上传选中后(已转成 File) */
  onFiles: (files: File[]) => void;
  /** 点 Assets / Avatar Library 时的提示(原型只给入口，不做选择器) */
  notify?: Notify;
}) {
  return (
    <AssetPicker
      accept={kinds}
      multiple={multiple}
      placement="down"
      onEntry={(src) => notify?.(src === "assets" ? "Opens your Assets library" : "Opens the Avatar Library", "info")}
      onPick={async (assets) => {
        const files = (await Promise.all(assets.map(toFile))).filter((f): f is File => !!f);
        if (files.length) onFiles(files);
      }}
      trigger={(open, isOpen) => (
        <button
          type="button"
          onClick={() => open()}
          aria-label={`${title}. ${hint}`}
          className={`flex h-full min-h-[136px] w-full flex-col overflow-hidden rounded-xl border text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
            dragging || isOpen ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#e1e3e9] bg-[#fafafb] hover:border-[#ffbd99] hover:bg-[#fffaf7]"
          }`}
        >
          <span className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1.5 px-3 py-3">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#fff3ec] text-[#ff5e1a]">{icon}</span>
            <span className="text-[14px] font-semibold leading-tight text-[#1a1a2e]">{title}</span>
            <span className="text-[12px] leading-snug text-[#9a9bb0]">{hint}</span>
          </span>
          {label && <span className="block w-full shrink-0 border-t border-[#ececf1] bg-white py-1.5 text-[12px] font-medium text-[#4a4b5c]">{label}</span>}
        </button>
      )}
    />
  );
}
