"use client";

/* 成片视频卡:9:16,右上一排圆形图标(收藏 / 下载 / 重新生成 / 剪辑 / 更多),中间播放键,
   底部控制条(播放、静音、时间、全屏)+ 可拖进度条。下载按钮下载本次成片 src(文件名由调用方按品牌 / 平台 / 时长拼);
   ⋯ 菜单:Copy link 真复制绝对地址,Delete 交给调用方确认。toast 统一走调用方(AgentChat 底部)。 */

import { useRef, useState } from "react";
import { Crop, Download, Heart, Maximize, MoreHorizontal, Pause, Play, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { DEMO_REEL } from "../reel";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function ReelCard({
  onEdit,
  onRegenerate,
  onDelete,
  onToast,
  disabled,
  src,
  fileName,
}: {
  onEdit: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onToast: (text: string) => void;
  /** 成片(重)生成或单镜重试在跑:Regenerate、Edit in canvas 与 ⋯ 里的 Delete 一起禁用 */
  disabled?: boolean;
  /** 视频地址;不传用 DEMO_REEL.src(评审原型传公开目录里的成片) */
  src?: string;
  /** 下载文件名;不传用 DEMO_REEL.fileName */
  fileName?: string;
}) {
  const url = src ?? DEMO_REEL.src;
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState<number>(DEMO_REEL.durationSec);
  const [menu, setMenu] = useState(false);
  const [failed, setFailed] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.href).href);
      onToast("Link copied");
    } catch {
      onToast("Couldn't copy the link");
    }
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
        src={url}
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
        <a href={url} download={fileName ?? DEMO_REEL.fileName} aria-label="Download" className={iconBtn}>
          <Download className="size-4" />
        </a>
        <button type="button" aria-label="Regenerate" disabled={disabled} onClick={onRegenerate} className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/35`}>
          <RefreshCw className="size-4" />
        </button>
        <button type="button" aria-label="Edit in canvas" disabled={disabled} onClick={onEdit} className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/35`}>
          <Crop className="size-4" />
        </button>
        <div className="relative">
          <button type="button" aria-label="More" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className={iconBtn}>
            <MoreHorizontal className="size-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-xl bg-white py-1 text-[13px] text-[#1a1a2e] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  void copyLink();
                }}
                className="block w-full px-3 py-2 text-left hover:bg-[#f6f7f9]"
              >
                Copy link
              </button>
              {/* 成片在重生成 / 单镜重试在改它:先不让删(删了白扣积分,撤销还会捞回旧片) */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setMenu(false);
                  onDelete();
                }}
                className="block w-full px-3 py-2 text-left text-[#e5484d] hover:bg-[#f6f7f9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Delete
              </button>
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
    </div>
  );
}
