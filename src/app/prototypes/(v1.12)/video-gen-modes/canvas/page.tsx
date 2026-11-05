"use client";

/* 开发原型 · 画布。左上角 logo 回开发版主页。 */

import { useRouter } from "next/navigation";
import { CanvasView } from "../app/CanvasView";

export default function VideoGenModesCanvas() {
  const router = useRouter();
  return (
    <div className="h-dvh">
      <CanvasView onBack={() => router.push("/prototypes/video-gen-modes/home")} />
    </div>
  );
}
