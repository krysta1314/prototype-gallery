"use client";

/* 工具页的上传卡(2026-11-05 Monica 定，版式参考她给的「Reference Video / Character Image」):
   卡片 = 图标 + 一句标题 + 一行「Upload, Assets or Avatars」,底部一条写这个素材叫什么;两个素材时并排(调用方用 grid 排)。
   点卡片弹出和首页「+」同一个菜单:Local Upload / Assets / Avatar Library(头像库只在收图片时出现)。
   选中的都转成 File 交给 onFiles,后面的格式 / 时长校验和拖进来的文件走同一条路。 */

import type { ReactNode } from "react";
import { AssetPicker } from "@/app/prototypes/(v1.12)/video-gen-modes/app/components/AssetPicker";
import type { Asset, AssetKind } from "@/app/prototypes/(v1.12)/video-gen-modes/app/assets";

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
}: {
  /** 这个素材位收哪些类型 */
  kinds: AssetKind[];
  icon: ReactNode;
  title: string;
  /** 格式 / 时长要求(悬停显示) */
  hint?: string;
  /** 卡片底部的素材名 */
  label: string;
  multiple?: boolean;
  dragging?: boolean;
  /** 本地上传 / 资产库 / 头像库选中后(已转成 File) */
  onFiles: (files: File[]) => void;
}) {
  return (
    <AssetPicker
      accept={kinds}
      multiple={multiple}
      placement="down"
      onPick={async (assets) => {
        const files = (await Promise.all(assets.map(toFile))).filter((f): f is File => !!f);
        if (files.length) onFiles(files);
      }}
      trigger={(open, isOpen) => (
        <button
          type="button"
          onClick={() => open()}
          title={hint}
          aria-label={`${title}. ${hint ?? ""}`}
          className={`flex h-[136px] w-full flex-col overflow-hidden rounded-xl border text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
            dragging || isOpen ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#e1e3e9] bg-[#fafafb] hover:border-[#ffbd99] hover:bg-[#fffaf7]"
          }`}
        >
          <span className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1.5 px-2">
            <span className="grid size-8 place-items-center rounded-[9px] bg-[#fff3ec] text-[#ff5e1a]">{icon}</span>
            <span className="text-[13px] font-semibold leading-tight text-[#1a1a2e]">{title}</span>
            <span className="text-[11.5px] leading-snug text-[#9a9bb0]">{kinds.includes("image") ? "Upload, Assets or Avatars" : "Upload or Assets"}</span>
          </span>
          <span className="block w-full shrink-0 border-t border-[#ececf1] bg-white py-1.5 text-[12px] font-medium text-[#4a4b5c]">{label}</span>
        </button>
      )}
    />
  );
}
