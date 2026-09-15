"use client";

/* 图 / 视频的占位块。
   原型阶段不放真实素材(没有贴题的图,随便找的库存图反而误导评审),
   但版面里的媒体位要留着,否则看不出真实上线后的节奏。
   所以统一渲染成中性深色块,右下角标出这一位将来放什么、什么比例。

   封面比例全站统一 16:9(源图 1600x900):
   BuzzVideo 自己的产出就是 16:9,编辑截一帧即可用;社交卡 1.91:1 也几乎不用裁。
   统一之后一张源图走遍列表、详情、分享三处,编辑不用记安全区规则。 */

export function MediaSlot({
  label = "Image",
  ratio = "aspect-[16/9]",
  className = "",
  compact = false,
  flush = false,
}: {
  /** 这一位将来放什么,例如 Cover / Video / Thumbnail */
  label?: string;
  ratio?: string;
  className?: string;
  /** 小尺寸缩略位,不显示文字 */
  compact?: boolean;
  /** 卡片内的封面位。默认四角圆角;卡片 hover 时只有下面两角变直角,
      上面两角必须保持 14px —— 它和卡片的上圆角重合,拉直会让深色块戳出卡片边界。
      圆角写在自己身上而不是靠父层 overflow 裁切,否则父层过渡背景色时裁切会被重绘丢掉。 */
  flush?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#43484e] ${
        flush
          ? "rounded-[14px] transition-[border-radius] duration-300 ease-out group-hover:rounded-b-none motion-reduce:transition-none"
          : "rounded-[4px]"
      } ${ratio} ${className}`}
      aria-hidden
    >
      {/* 对角线,一眼认出这是占位而不是加载失败 */}
      <svg className="absolute inset-0 size-full text-white/[0.14]" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
      </svg>
      {!compact && (
        <span className="absolute bottom-2.5 right-3 text-[11.5px] font-semibold tracking-[0.04em] text-white/40">
          {label}
        </span>
      )}
    </div>
  );
}
