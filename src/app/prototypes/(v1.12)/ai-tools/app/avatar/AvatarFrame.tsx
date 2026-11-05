"use client";

/* 数字人拿着商品的画面(fixture):商品都放在画面下部(脸以下),不挡脸;数字人照片铺满 9:16,商品图按手持方式摆在不同位置。
   首帧预览和结果视频共用;variant = 第几次重做(位置 / 角度 / 景别略有不同);playing = 结果视频播放中(轻微推镜 + 商品晃动)。
   真实产品里是模型合成的一张图 / 一段视频,这里只是演示构图。 */

import type { HoldStyle } from "./logic";

const LAYOUT: Record<HoldStyle, { left: number; top: number; w: number; rot: number }> = {
  /* 拿在手里:右下,略斜 */
  hold: { left: 56, top: 66, w: 32, rot: -6 },
  /* 对镜头展示:正中偏下,更大、正对镜头 */
  show: { left: 32, top: 64, w: 36, rot: 0 },
  /* 开箱:底部,半截在盒子里 */
  unbox: { left: 34, top: 70, w: 32, rot: 3 },
  /* 使用:拿到下巴 / 脸颊旁边,较小(不挡脸) */
  use: { left: 64, top: 64, w: 24, rot: -12 },
};

export function AvatarFrame({
  avatar,
  focus,
  product,
  hold,
  variant = 0,
  playing = false,
  dim = false,
  className = "",
  children,
}: {
  avatar: string;
  focus?: string;
  product: string | null;
  hold: HoldStyle;
  variant?: number;
  playing?: boolean;
  dim?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const l = LAYOUT[hold];
  /* 重做:每次换一点位置 / 角度 / 景别(循环 4 种) */
  const v = variant % 4;
  const dx = [0, -4, 3, -2][v];
  const dy = [0, 2, -3, 4][v];
  const zoom = [1, 1.06, 1.12, 1.03][v];
  return (
    <div className={`relative aspect-[9/16] overflow-hidden bg-[#e9e7ee] ${className}`} style={{ containerType: "inline-size" }}>
      <style>{`
        @keyframes pa-push { 0%,100% { transform: scale(var(--z)); } 50% { transform: scale(calc(var(--z) * 1.05)); } }
        @keyframes pa-sway { 0%,100% { transform: rotate(var(--r)) translateY(0); } 50% { transform: rotate(calc(var(--r) + 3deg)) translateY(-3%); } }
        @media (prefers-reduced-motion: reduce) { .pa-anim { animation: none !important; } }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar}
        alt=""
        className="pa-anim absolute inset-0 size-full object-cover"
        style={{ objectPosition: focus, ["--z" as string]: zoom, transform: `scale(${zoom})`, animation: playing ? "pa-push 6s ease-in-out infinite" : undefined }}
      />
      {hold === "unbox" && product && (
        <div
          className="absolute rounded-[6%] bg-gradient-to-b from-[#e8d5bb] to-[#cdb391] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
          style={{ left: `${l.left - 6 + dx}%`, top: `${l.top + 14 + dy}%`, width: `${l.w + 12}%`, height: "24%" }}
        />
      )}
      {product && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product}
          alt=""
          className="pa-anim absolute aspect-[3/4] rounded-[10%] border-[0.6cqw] border-white object-cover shadow-[0_10px_28px_rgba(0,0,0,0.3)]"
          style={{
            left: `${l.left + dx}%`,
            top: `${l.top + dy}%`,
            width: `${l.w}%`,
            ["--r" as string]: `${l.rot + v * 2}deg`,
            transform: `rotate(${l.rot + v * 2}deg)`,
            animation: playing ? "pa-sway 3s ease-in-out infinite" : undefined,
          }}
        />
      )}
      {dim && <div className="absolute inset-0 bg-white/55" />}
      {children}
    </div>
  );
}
