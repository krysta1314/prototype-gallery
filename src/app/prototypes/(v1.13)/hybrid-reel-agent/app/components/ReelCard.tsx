"use client";

/* 成片视频卡:9:16,右上一排圆形图标(收藏 / 下载 / 重新生成 / 剪辑 / 更多),中间播放键,
   底部控制条(播放、静音、时间、全屏)+ 可拖进度条。下载按钮下载本次成片 src(文件名由调用方按品牌 / 平台 / 时长拼);
   ⋯ 菜单:「View prompt」+「Redo a shot」(只重做勾选的 AI 补拍镜头,有 AI 镜头时才有);「View prompt」:弹窗列出这条成片用到的生成 prompt(每个 AI 补拍镜头 + 旁白稿)。toast 统一走调用方(AgentChat 底部)。 */

import { useEffect, useRef, useState } from "react";
import { Crop, Download, Eye, Heart, Maximize, MoreHorizontal, Pause, Play, RefreshCw, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { DEMO_REEL } from "../reel";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function ReelCard({
  onEdit,
  onRegenerate,
  onRedoShot,
  prompts,
  clip,
  wide,
  disabled,
  src,
  fileName,
  onDownload,
}: {
  onEdit: () => void;
  onRegenerate: () => void;
  /** ⋯ → Redo a shot;不传(没有 AI 补拍镜头)不出这一项 */
  onRedoShot?: () => void;
  /** 生成网格里的单镜卡:只播 src 里从 start 起的 sec 秒(原型用演示成片里的一段代替这一镜) */
  clip?: { start: number; sec: number };
  /** 占满父容器宽度(网格三列);不传固定 280px 宽 */
  wide?: boolean;
  /** 「View prompt」里列的内容:每个 AI 补拍镜头的 prompt + 旁白稿 */
  prompts: { title: string; meta?: string; text: string }[];
  /** 成片(重)生成或单镜重试在跑:Regenerate、Edit in canvas 一起禁用 */
  disabled?: boolean;
  /** 视频地址;不传用 DEMO_REEL.src(评审原型传公开目录里的成片) */
  src?: string;
  /** 下载文件名;不传用 DEMO_REEL.fileName */
  fileName?: string;
  /** 下载:传了就交给调用方(先取文件,失败出 toast + Retry);不传用浏览器直接下载链接 */
  onDownload?: (url: string, fileName: string) => void;
}) {
  const url = src ?? DEMO_REEL.src;
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState<number>(clip?.sec ?? DEMO_REEL.durationSec);
  const from = clip?.start ?? 0;
  const [menu, setMenu] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    if (!showPrompt) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setShowPrompt(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [showPrompt]);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  const iconBtn = "grid size-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55";

  if (failed) {
    return (
      <div className={`grid aspect-[9/16] ${wide ? "w-full" : "w-[280px]"} place-items-center rounded-2xl border border-[#ececf1] bg-[#f6f7f9] text-center text-[13px] text-[#6a6b7b]`}>
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
    <div className={`group relative aspect-[9/16] ${wide ? "w-full" : "w-[280px]"} overflow-hidden rounded-2xl bg-black`}>
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
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          /* 单镜卡:播到这一镜结尾就停,回到这一镜开头 */
          if (clip && v.currentTime >= from + clip.sec) {
            v.pause();
            v.currentTime = from;
          }
          setTime(Math.max(0, v.currentTime - from));
        }}
        onLoadedMetadata={(e) => {
          if (clip) e.currentTarget.currentTime = from;
          else setLength(e.currentTarget.duration);
        }}
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
      <div className="absolute right-2 top-2 flex gap-1.5">
        <button type="button" aria-label={liked ? "Unfavorite" : "Favorite"} aria-pressed={liked} onClick={() => setLiked((v) => !v)} className={iconBtn}>
          <Heart className={`size-4 ${liked ? "fill-[#ff5255] text-[#ff5255]" : ""}`} />
        </button>
        {onDownload ? (
          <button type="button" aria-label="Download" onClick={() => onDownload(url, fileName ?? DEMO_REEL.fileName)} className={iconBtn}>
            <Download className="size-4" />
          </button>
        ) : (
          <a href={url} download={fileName ?? DEMO_REEL.fileName} aria-label="Download" className={iconBtn}>
            <Download className="size-4" />
          </a>
        )}
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
            <div className="absolute right-0 top-9 z-10 overflow-hidden rounded-xl bg-white p-1 text-[13px] text-[#1a1a2e] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setShowPrompt(true);
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-[#f6f7f9]"
              >
                <Eye className="size-4" /> View prompt
              </button>
              {onRedoShot && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setMenu(false);
                    onRedoShot();
                  }}
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left hover:bg-[#f6f7f9] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="size-4" /> Redo a shot
                </button>
              )}
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
            if (v) v.currentTime = from + Number(e.target.value);
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
      {/* View prompt:这条成片实际用到的生成 prompt;点遮罩、× 或 Esc 关闭 */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6" onClick={() => setShowPrompt(false)}>
          <div
            role="dialog"
            aria-label="Prompt"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(26,26,46,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-[#f1f1f4] px-5 py-3.5">
              <span className="text-[15px] font-semibold text-[#1a1a2e]">Prompt</span>
              <button type="button" aria-label="Close" onClick={() => setShowPrompt(false)} className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#f1f1f4]">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {prompts.map((p) => (
                <div key={p.title}>
                  <p className="text-[13.5px] font-semibold text-[#1a1a2e]">
                    {p.title}
                    {p.meta && <span className="ml-2 font-normal text-[#9a9bb0]">{p.meta}</span>}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line rounded-lg bg-[#f8f7fa] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[#1a1a2e]">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
