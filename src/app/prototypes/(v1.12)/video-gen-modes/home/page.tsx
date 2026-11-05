"use client";

/* 开发原型 · 主页(无演示控件)。侧边栏 Canvas 跳到开发版画布。
   支持 ?model=<模型 key>&mode=<模式 key> 直接打开某个模型的某个模式(v1.12 模型思维导图的「看 UI」用)。 */

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductApp } from "../app/ProductApp";
import { MODELS, supports, type ModeKey, type ModelKey } from "../app/capabilities";

function Home() {
  const router = useRouter();
  const q = useSearchParams();
  const m = q.get("model");
  const model = MODELS.find((x) => x.key === m)?.key as ModelKey | undefined;
  const md = q.get("mode") as ModeKey | null;
  const mode = model && md && supports(model, md) ? md : undefined;
  return (
    <div className="h-dvh">
      <ProductApp onCanvas={() => router.push("/prototypes/video-gen-modes/canvas")} initialStart={model ? { model, mode } : undefined} />
    </div>
  );
}

export default function VideoGenModesHome() {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#faf8f6]" />}>
      <Home />
    </Suspense>
  );
}
