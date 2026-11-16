"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { FOR_YOU, OUT_OF_FOR_YOU, OTHER_SOURCE, creator, igCode, isVertical, post, poster, video } from "../v2/data";

/** For You 视频清单:按 APP 里的播放顺序列出每条视频、来源和文案(给 Monica 核对素材用) */
function Item({ id, i }: { id: string; i: number }) {
  const p = post(id);
  const code = igCode(id);
  const [dur, setDur] = useState<number | null>(null);
  const vertical = isVertical(id);
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="relative flex aspect-[9/16] items-center justify-center bg-black">
        <video
          src={video(id)}
          poster={poster(id)}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onMouseEnter={(e) => void e.currentTarget.play()}
          onMouseLeave={(e) => e.currentTarget.pause()}
          className={vertical ? "h-full w-full object-cover" : "w-full"}
        />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">{i + 1}</span>
        {dur ? <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">{dur.toFixed(0)}s</span> : null}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center gap-1.5">
          {code ? (
            <a href={`https://www.instagram.com/reel/${code}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-[#FFF1EA] px-1.5 py-0.5 text-[11px] font-semibold text-[#E24F12] hover:underline">
              Instagram <ExternalLink size={10} />
            </a>
          ) : (
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-600">{OTHER_SOURCE[id] ?? "其他素材"}</span>
          )}
          <span className="text-[11px] text-stone-400">{vertical ? "9:16" : id === "catfan" ? "1:1" : ["terracotta", "hotel"].includes(id) ? "4:3" : "16:9"}</span>
        </div>
        <div className="text-[13px] font-medium leading-5 text-stone-900">{p.caption}</div>
        <div className="text-[12px] text-stone-500">
          {creator(p.author).name} · {p.cat} · <code className="text-stone-400">{id}</code>
        </div>
      </div>
    </div>
  );
}

export default function ForYouVideos() {
  const ig = FOR_YOU.filter((id) => igCode(id)).length;
  const igOut = OUT_OF_FOR_YOU.filter((id) => igCode(id)).length;
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="mx-auto max-w-[1200px] px-8 py-12">
        <div className="text-[13px] font-medium text-stone-500">BuzzVideo APP · 第二版</div>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-stone-900">For You 视频清单</h1>
        <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-stone-600">
          按 APP 里 For You 的播放顺序排列，共 {FOR_YOU.length} 条(2026-11-11 按你在这一页上的标注调整：前 5 条按你给的顺序，打勾的保留)。其中 {ig} 条来自 Instagram @buzzvideo.global,{FOR_YOU.length - ig} 条是往期项目和产品里生成的素材。鼠标移到视频上播放，点「Instagram」打开原帖。
        </p>
        <p className="mt-2 max-w-[760px] text-[13px] leading-6 text-amber-800">
          暂缺 1 条：「Stranger Things, but make it 90s cel animation」——不登录 Instagram 取不到这条的视频文件。
        </p>
        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {FOR_YOU.map((id, i) => (
            <Item key={id} id={id} i={i} />
          ))}
        </div>
        <h2 className="mt-14 text-[20px] font-semibold text-stone-900">已移出 For You({OUT_OF_FOR_YOU.length} 条)</h2>
        <p className="mt-2 max-w-[760px] text-[14px] leading-6 text-stone-600">
          带货、UGC、广告感比较强的素材，以及你没打勾的几条(其中 {igOut} 条来自 Instagram)。仍保留在数据里，做同款、创作者主页等地方还会用到。
        </p>
        <div className="mt-6 grid gap-4 opacity-70" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {OUT_OF_FOR_YOU.map((id, i) => (
            <Item key={id} id={id} i={FOR_YOU.length + i} />
          ))}
        </div>
      </div>
    </div>
  );
}
