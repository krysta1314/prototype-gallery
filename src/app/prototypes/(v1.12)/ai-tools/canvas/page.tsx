"use client";

/* 画布入口(开发原型):2026-11-05 起和 video-gen-modes 同一个画布(Image 行的 Upscale + 各视频模型节点);左上角 logo 回产品首页。 */

import { useRouter } from "next/navigation";
import { CanvasView } from "@/app/prototypes/(v1.12)/video-gen-modes/app/CanvasView";

export default function UpscaleImageCanvasPage() {
  const router = useRouter();
  return (
    <div className="h-dvh">
      <CanvasView onBack={() => router.push("/prototypes/ai-tools")} />
    </div>
  );
}
