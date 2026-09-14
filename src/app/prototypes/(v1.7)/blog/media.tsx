"use client";

/* 图 / 视频的占位块。
   原型阶段不放真实素材(没有贴题的图,随便找的库存图反而误导评审),
   但版面里的媒体位要留着,否则看不出真实上线后的节奏。
   所以统一渲染成中性深色块,右下角标出这一位将来放什么、什么比例。 */

export function MediaSlot({
  label = "Image",
  ratio = "aspect-[16/10]",
  className = "",
  compact = false,
}: {
  /** 这一位将来放什么,例如 Cover / Video / Thumbnail */
  label?: string;
  ratio?: string;
  className?: string;
  /** 小尺寸缩略位,不显示文字 */
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[4px] border border-white/10 bg-[#141419] ${ratio} ${className}`}
      aria-hidden
    >
      {/* 对角线,一眼认出这是占位而不是加载失败 */}
      <svg className="absolute inset-0 size-full text-white/[0.07]" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
      </svg>
      {!compact && (
        <span className="absolute bottom-2.5 right-3 text-[11.5px] font-semibold tracking-[0.04em] text-white/30">
          {label}
        </span>
      )}
    </div>
  );
}
