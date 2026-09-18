'use client';

/* 首页弹窗的唯一模板:媒体 → 标题 → 若干「粗体一行 + 灰色一行」→ 一个大 CTA。
   三种类型(促销 / 模型上新 / 功能上新)共用它,admin 只填内容,长相不由类型决定 ——
   这样运营加一种活动不需要前端再画一版弹窗。 */

import { useRef } from 'react';
import Link from 'next/link';
import { ImageIcon, X } from 'lucide-react';
import type { PopupConfig } from '../_lib/types';
import { useDialogA11y } from '../_lib/useDialogA11y';

export function PopupTemplate({
  config,
  onClose,
  preview = false,
}: {
  config: PopupConfig;
  onClose: () => void;
  /** true 表示这是详情页右侧的常驻缩略预览,不是真实弹窗:不做焦点管理,整棵子树对键盘与辅助技术不可达 */
  preview?: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useDialogA11y({ ref: dialogRef, onClose, enabled: !preview });

  const media = config.media;

  return (
    <div
      inert={preview}
      aria-hidden={preview || undefined}
      // 缩略预览里不要滚动条 —— 真实弹窗内容超屏时才需要滚
      className={`fixed inset-0 z-[100] grid place-items-center bg-[#1a1a2e]/45 p-3 backdrop-blur-[3px] sm:p-6 ${
        preview ? 'overflow-hidden' : 'overflow-y-auto'
      }`}
      role="presentation"
      onClick={onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        // 缩略预览里不要投影 —— 外层按弹窗尺寸裁切,投影只会在圆角处漏出两牙灰色
        className={`relative w-full max-w-[520px] overflow-hidden rounded-[24px] bg-white text-[#1a1a2e] outline-none ${
          preview ? '' : 'shadow-[0_28px_90px_rgba(26,26,46,0.32)]'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          /* 素材深浅不定,白底 chip 压在浅色图上会糊成一块灰。
             半透明深底 + 白色叉在任何素材上都读得出来,且不需要投影。 */
          className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        {/* 媒体位四周留白,不出血到卡片边缘 —— 出血会让素材的边缘细节被圆角切掉。
            视频用外链,原型不把视频塞进 localStorage。 */}
        <div className="p-1.5 pb-0">
          <div className="aspect-video w-full overflow-hidden rounded-[19px] bg-[#f1f0f5]">
            {media.src ? (
              media.kind === 'video' ? (
                <video
                  src={media.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.src} alt="" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="grid h-full w-full place-items-center bg-[linear-gradient(140deg,#EFE6FF_0%,#E3ECFF_50%,#FFE7D6_100%)] text-[#9a94a8]">
                <ImageIcon className="size-7" />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          <h2 id="popup-title" className="text-[21px] font-extrabold leading-snug tracking-tight">
            {config.title || 'Untitled popup'}
          </h2>

          {config.description && (
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#6a6b7b]">{config.description}</p>
          )}

          {config.items.length > 0 && (
            <dl className="mt-4 space-y-3.5">
              {config.items.map((it, i) => (
                <div key={i}>
                  <dt className="text-[15.5px] font-bold text-[#1a1a2e]">{it.title}</dt>
                  {it.subtitle && <dd className="mt-0.5 text-[13px] text-[#8a8a99]">{it.subtitle}</dd>}
                </div>
              ))}
            </dl>
          )}

          {config.ctaText && (
            <Link
              href={config.ctaHref || '#'}
              className="mt-5 block rounded-full bg-[#141420] px-5 py-3.5 text-center text-[15px] font-bold text-white transition hover:bg-[#2b2c3b]"
            >
              {config.ctaText}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
