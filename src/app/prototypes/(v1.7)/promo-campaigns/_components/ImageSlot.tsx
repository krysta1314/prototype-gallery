'use client';

/* 活动素材槽:点击选文件 / 拖拽放入,图片和视频都能上传,都不限大小。
   原型没有对象存储:图片先在浏览器里缩到最长边 1600 再转 JPEG 存进 localStorage;
   视频走 object URL,只在本次会话内有效,不占存储。
   真实后台这里换成上传接口 + 素材库选择器,两者都会有稳定地址。 */

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';

const MAX_EDGE = 1600;
const QUALITY = 0.72;
/** data URI 的字符数上限。再大就会把整份后台数据挤爆 */
const MAX_BYTES = 600_000;

const ACCEPT_IMAGE = 'image/png,image/jpeg,image/webp';
const ACCEPT_VIDEO = 'video/mp4,video/webm';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('read failed'));
    fr.readAsDataURL(file);
  });
}

async function shrink(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('decode failed'));
    el.src = raw;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  if (scale === 1 && raw.length <= MAX_BYTES) return raw;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

export function ImageSlot({
  label,
  hint,
  ratio,
  value,
  onChange,
  placeholder,
  media = 'image',
}: {
  label: string;
  hint: string;
  /** Tailwind aspect 类,让每个槽按真实使用比例预览 */
  ratio: string;
  value: string;
  onChange: (dataUrl: string) => void;
  /** 没有上传素材时显示的占位(CSS 画的主题图) */
  placeholder?: React.ReactNode;
  /** 这个槽收图还是收视频 */
  media?: 'image' | 'video';
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isVideo = media === 'video';

  async function take(file: File | undefined) {
    if (!file) return;
    setError('');

    /* 视频不限大小:转 data URI 存 localStorage 才有 5MB 的天花板,
       这里改成 object URL —— 本次会话内能正常播放和预览,不占存储。
       代价是刷新后失效(浏览器会回收这个 URL),真实后台走上传接口没有这个问题。 */
    if (isVideo) {
      setBusy(true);
      try {
        onChange(URL.createObjectURL(file));
      } catch {
        setError('Could not read that video.');
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const out = await shrink(file);
      if (out.length > MAX_BYTES) {
        setError('Still too large after compression. Use a simpler or smaller image.');
        return;
      }
      onChange(out);
    } catch {
      setError('Could not read that image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-[#1a1a2e]">{label}</span>
        {value && (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="rounded-md p-1 text-[#6a6b7b] transition hover:text-[#ff5e1a]"
              aria-label={`Replace ${label}`}
            >
              <RefreshCw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-md p-1 text-[#6a6b7b] transition hover:text-[#c0392b]"
              aria-label={`Remove ${label}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[12px] text-[#6a6b7b]">{hint}</p>

      <input
        ref={input}
        type="file"
        accept={isVideo ? ACCEPT_VIDEO : ACCEPT_IMAGE}
        hidden
        onChange={e => {
          void take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          void take(e.dataTransfer.files?.[0]);
        }}
        className={`mt-2 block w-full overflow-hidden rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25 ${ratio} ${
          value ? 'border border-[#ececf1]' : 'border-2 border-dashed border-[#d4d2da] hover:border-[#ffb694]'
        }`}
      >
        {busy ? (
          <span className="grid h-full place-items-center text-[#9a9aa6]">
            <Loader2 className="size-5 animate-spin" />
          </span>
        ) : value ? (
          isVideo ? (
            <video src={value} muted loop autoPlay playsInline className="h-full w-full object-cover" />
          ) : (
            // 用 img 而不是 next/image:data URI 过不了 next/image 的优化管线
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          )
        ) : placeholder ? (
          <span className="relative block h-full w-full">
            {placeholder}
            <span className="absolute inset-0 grid place-items-center bg-white/55 text-[12px] font-semibold text-[#6a6b7b]">
              Click or drop to upload
            </span>
          </span>
        ) : (
          <span className="grid h-full place-items-center gap-1 text-[#9a9aa6]">
            <ImagePlus className="mx-auto size-5" />
            <span className="text-[12px] font-semibold">Click or drop to upload</span>
          </span>
        )}
      </button>

      {error && <p className="mt-1.5 text-[12px] font-semibold text-[#c9432a]">{error}</p>}
    </div>
  );
}
