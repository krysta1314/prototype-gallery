"use client";

/* 生成好的配音卡(同 BuzzVideo 产品里的音频结果卡):白底圆角,右上一排小图标(收藏 / 下载 / 剪辑 / 更多),
   下面一条浅灰播放条 —— 橙色渐变圆形播放键 + 灰色波形(已播放的部分变橙)+ 「0:00 / 0:30」。
   原型:没有真配音文件,播的是演示成片的音轨;时长按旁白稿算。 */

import { useEffect, useRef, useState } from "react";
import { Crop, Download, Eye, Heart, MoreHorizontal, Pause, Play, X } from "lucide-react";

const BARS = [10, 16, 9, 18, 12, 20, 8, 14, 19, 11, 17, 9, 15, 20, 12, 8, 16, 13, 19, 10, 14, 18, 9, 16, 12, 20, 11, 15, 8, 17, 13, 19, 10, 14, 18, 9, 16, 12, 15, 11];
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function AudioCard({
  src,
  sec,
  script,
  fileName = "voiceover.mp3",
  onEdit,
}: {
  src: string;
  /** 旁白时长(秒),显示用 */
  sec: number;
  /** 「⋯ → View script」里显示的整条旁白稿 */
  script: string;
  fileName?: string;
  onEdit?: () => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [liked, setLiked] = useState(false);
  const [menu, setMenu] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const total = Math.max(1, Math.round(sec));
  const played = Math.min(1, time / total);

  useEffect(() => {
    if (!showScript) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setShowScript(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [showScript]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };
  const download = async () => {
    try {
      const blob = await (await fetch(src)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      /* 原型:拿不到文件就不下载 */
    }
  };
  const icon = "grid size-7 place-items-center rounded-lg text-[#4a4b5c] transition hover:bg-[#f1f1f4] hover:text-[#1a1a2e]";

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-[#ececf1] bg-white p-3 shadow-[0_2px_8px_rgba(26,26,46,0.04)]">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          if (t >= total) {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
            setTime(0);
          } else setTime(t);
        }}
        onEnded={() => setTime(0)}
      />
      <div className="mb-2 flex items-center justify-end gap-0.5">
        <button type="button" aria-label="Favorite" aria-pressed={liked} onClick={() => setLiked((v) => !v)} className={icon}>
          <Heart className={`size-4 ${liked ? "fill-[#ff5255] text-[#ff5255]" : ""}`} />
        </button>
        <button type="button" aria-label="Download" onClick={() => void download()} className={icon}>
          <Download className="size-4" />
        </button>
        {onEdit && (
          <button type="button" aria-label="Edit in canvas" onClick={onEdit} className={icon}>
            <Crop className="size-4" />
          </button>
        )}
        <div className="relative">
          <button type="button" aria-label="More" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className={icon}>
            <MoreHorizontal className="size-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-8 z-10 rounded-xl bg-white p-1 text-[13px] text-[#1a1a2e] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setShowScript(true);
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-[#f6f7f9]"
              >
                <Eye className="size-4" /> View script
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-[#f4f4f6] px-3 py-2.5">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={toggle}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_16px_rgba(255,82,85,0.35)]"
        >
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4" />}
        </button>
        <div className="flex h-8 min-w-0 flex-1 items-center gap-[3px]" aria-hidden>
          {BARS.map((h, i) => (
            <span key={i} className={`w-[3px] shrink-0 rounded-full ${i / BARS.length < played ? "bg-[#ff7a3d]" : "bg-[#c9cad6]"}`} style={{ height: h }} />
          ))}
        </div>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#4a4b5c]">
          {clock(time)} / {clock(total)}
        </span>
      </div>
      {/* View script:整条旁白稿;× / 遮罩 / Esc 关闭 */}
      {showScript && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6" onClick={() => setShowScript(false)}>
          <div role="dialog" aria-label="Script" onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(26,26,46,0.28)]">
            <div className="flex items-center justify-between border-b border-[#f1f1f4] px-5 py-3.5">
              <span className="text-[15px] font-semibold text-[#1a1a2e]">Script</span>
              <button type="button" aria-label="Close" onClick={() => setShowScript(false)} className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#f1f1f4]">
                <X className="size-4" />
              </button>
            </div>
            <p className="overflow-y-auto whitespace-pre-line px-5 py-4 text-[13.5px] leading-relaxed text-[#1a1a2e]">{script}</p>
          </div>
        </div>
      )}
    </div>
  );
}
