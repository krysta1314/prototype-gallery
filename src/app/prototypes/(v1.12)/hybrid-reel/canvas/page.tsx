"use client";

/* Canvas —— agent 里点 Edit in canvas 之后落到这里。
   从 agent 带过来的素材各成一个节点(图片 / 视频 / AI 补拍),全部连进一个剪辑器节点;
   剪辑器节点里能直接预览和剪,点 Full-screen edit 进全屏剪辑。
   生成和扣费都在这里发生:AI 补拍节点点 Generate 才扣这一镜的 credits。

   工程(节点位置、时间线、字幕、配乐…)写回 sessionStorage 的 handoff 里,硬刷新后原样恢复;
   素材 blob URL 失效的问题由 rehydrateUrls 从 IndexedDB 换回。 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HANDOFF_KEY } from "../agent/chat/types";
import { fixImageRefs } from "@/lib/hybrid-reel/prompt";
import { APPLE_FONT } from "../agent/chat/shell";
import { rehydrateUrls } from "../agent/chat/handoff";
import { arrange, buildProject, resetInterrupted, splitVoiceLines } from "./project";
import { Workspace, type Stored } from "./workspace";

export default function HybridReelCanvas() {
  const [handoff, setHandoff] = useState<Stored | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let parsed: Stored | null = null;
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      if (raw) parsed = JSON.parse(raw) as Stored;
    } catch {
      /* 读不到就走空态 */
    }
    if (!parsed) {
      setLoaded(true);
      return;
    }
    const initial = parsed;
    void rehydrateUrls(initial, initial.media ?? []).then(({ data, media }) => {
      const next: Stored = { ...data, media };
      /* 旧版工程(或第一次进来)按分镜重新建 */
      /* 生成中被刷新:有任务 id 的(Seedance 真生成)保持生成中,进画布后接着查;其他的退回未生成,扣的积分退回(resetInterrupted) */
      const restored = next.project?.v === 1 ? resetInterrupted(next.project) : null;
      const project =
        restored
          ? {
              ...restored,
              assets: restored.assets.map((b) => {
                if (b.origin !== "ai" || b.kind !== "video") return b;
                /* 旧工程补上:分镜里的一句话描述(时间线上显示)、从 @Image 1 开始的参考图编号 */
                const shot = next.outline.shots[Number(b.id.replace(/^ai-/, ""))];
                const summary = b.summary ?? (shot?.source.kind === "generate" ? shot.source.summary : undefined);
                return { ...b, summary, prompt: b.prompt && fixImageRefs(b.prompt, b.refIds?.length) };
              }),
              /* 旧工程补上方案里每一镜的台词(加配音时当默认文案) */
              clips: restored.clips.map((c) => {
                if (c.line !== undefined) return c;
                const shot = next.outline.shots[Number(c.id.replace(/^c-/, ""))];
                return /^c-\d+$/.test(c.id) && shot?.subtitle?.text && shot.subtitle.source !== "stt" ? { ...c, line: shot.subtitle.text } : c;
              }),
            }
          : buildProject(next);
      /* 旧工程一个节点装 6 句的,拆成一句一个节点 */
      const split = next.project?.v === 1 ? arrange(splitVoiceLines(project)) : project;
      setHandoff({ ...next, project: split });
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="min-h-dvh bg-[#f7f7f9]" />;

  if (!handoff?.project) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#f7f7f9] px-6 text-center" style={{ fontFamily: APPLE_FONT }}>
        <div>
          <p className="text-[16px] font-bold text-[#1a1a2e]">Nothing on the canvas yet</p>
          <p className="mt-1.5 text-[14px] text-[#6a6b7b]">
            Upload footage in the agent, confirm the plan, then choose Edit in canvas.
          </p>
          <Link
            href="/prototypes/hybrid-reel-agent"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white"
          >
            <ArrowLeft className="size-4" /> Back to agent
          </Link>
        </div>
      </div>
    );
  }

  return <Workspace handoff={handoff} initial={handoff.project} />;
}
