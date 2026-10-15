"use client";

/* 成片视频卡:9:16,右上一排圆形图标(收藏 / 下载 / 重新生成 / 剪辑 / 更多),中间播放键,
   底部控制条(播放、静音、时间、全屏)+ 可拖进度条。下载按钮真下载演示成片。 */

import { useRef, useState } from "react";
import { Crop, Download, Heart, Maximize, MoreHorizontal, Pause, Play, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { DEMO_REEL } from "../reel";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function ReelCard({
  onEdit,
  onRegenerate,
  disabled,
  src,
}: {
  onEdit: () => void;
  onRegenerate: () => void;
  disabled?: boolean;
  /** 视频地址;不传用 DEMO_REEL.src(评审原型传公开目录里的成片) */
  src?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState<number>(DEMO_REEL.durationSec);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  };
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  const iconBtn = "grid size-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55";

  if (failed) {
    return (
      <div className="grid aspect-[9/16] w-[280px] place-items-center rounded-2xl border border-[#ececf1] bg-[#f6f7f9] text-center text-[13px] text-[#6a6b7b]">
        <span>
          Couldn&apos;t load the video
          <button type="button" onClick={() => setFailed(false)} className="mt-2 block w-full font-semibold text-[#ff5e1a]">
            Retry
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="group relative aspect-[9/16] w-[280px] overflow-hidden rounded-2xl bg-black">
      <video
        ref={ref}
        src={src ?? DEMO_REEL.src}
        muted={muted}
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
      <div className="absolute right-2 top-2 flex gap-1.5">
        <button type="button" aria-label={liked ? "Unfavorite" : "Favorite"} aria-pressed={liked} onClick={() => setLiked((v) => !v)} className={iconBtn}>
          <Heart className={`size-4 ${liked ? "fill-[#ff5255] text-[#ff5255]" : ""}`} />
        </button>
        <a href={DEMO_REEL.src} download={DEMO_REEL.fileName} aria-label="Download" className={iconBtn}>
          <Download className="size-4" />
        </a>
        <button type="button" aria-label="Regenerate" disabled={disabled} onClick={onRegenerate} className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/35`}>
          <RefreshCw className="size-4" />
        </button>
        <button type="button" aria-label="Edit in canvas" onClick={onEdit} className={iconBtn}>
          <Crop className="size-4" />
        </button>
        <div className="relative">
          <button type="button" aria-label="More" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className={iconBtn}>
            <MoreHorizontal className="size-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-xl bg-white py-1 text-[13px] text-[#1a1a2e] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              {["Copy link", "Delete"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    flash(label === "Copy link" ? "Link copied" : "Deleted (demo only)");
                  }}
                  className="block w-full px-3 py-2 text-left hover:bg-[#f6f7f9]"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {!playing && (
        <button type="button" aria-label="Play" onClick={toggle} className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-[#1a1a2e] backdrop-blur">
          <Play className="ml-0.5 size-5 fill-current" />
        </button>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
        <input
          type="range"
          min={0}
          max={length || 0}
          step={0.1}
          value={time}
          aria-label="Seek"
          onChange={(e) => {
            const v = ref.current;
            if (v) v.currentTime = Number(e.target.value);
          }}
          className="h-1 w-full cursor-pointer accent-white"
        />
        <div className="mt-1 flex items-center gap-2 text-[12px] tabular-nums text-white">
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((v) => !v)}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <span>
            {clock(time)} / {clock(length)}
          </span>
          <button type="button" aria-label="Full screen" onClick={() => void ref.current?.requestFullscreen()} className="ml-auto">
            <Maximize className="size-4" />
          </button>
        </div>
      </div>
      {toast && (
        <span role="status" className="absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-[12px] text-white">
          {toast}
        </span>
      )}
    </div>
  );
}
