"use client";

/* 区块编辑器里的图片槽:点击选文件 / 拖拽放入。
   原型没有对象存储,图片只能以 data URI 存进 localStorage,而 localStorage 一共就 5MB ——
   所以一律先在浏览器里缩到最长边 1600 再转 JPEG,压完还超上限就拒收并说明原因。
   真实后台这里换成上传接口 + 素材库选择器,压缩交给服务端,这条限制就不存在了。 */

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

const MAX_EDGE = 1600;
const QUALITY = 0.72;
/* data URI 的字符数上限。再大就会把整份后台数据挤爆 */
const MAX_BYTES = 600_000;

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(file);
  });
}

/** 缩到最长边 MAX_EDGE 并转成 JPEG;GIF 会掉动画,所以原样返回。 */
async function shrink(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  if (file.type === "image/gif") return raw;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode failed"));
    el.src = raw;
  });

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  if (scale === 1 && raw.length <= MAX_BYTES) return raw;
  return draw(img) || raw;
}

/** 把一个 data URI 缩到可存的大小;压不下来就返回 null(调用方退成占位)。
    导入 Word 时也走这条路——文档里的图动辄 1~2MB,不压就只能整张丢掉。 */
export async function shrinkDataUrl(src: string): Promise<string | null> {
  if (!src.startsWith("data:image/")) return src;
  if (src.length <= MAX_BYTES && !src.startsWith("data:image/png")) return src;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = src;
    });
    const out = draw(img);
    return out.length <= MAX_BYTES ? out : null;
  } catch {
    return null;
  }
}

/** 按 MAX_EDGE 缩放并压成 JPEG(白底,避免透明变黑)。 */
function draw(img: HTMLImageElement): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function ImageInput({
  src,
  onChange,
}: {
  src?: string;
  onChange: (src: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");

  const accept = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That is not an image file.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const out = await shrink(file);
      if (out.length > MAX_BYTES) {
        setError(
          `Still ${Math.round(out.length / 1024)}KB after compression. This prototype keeps images in browser storage, so use one under ~500KB.`,
        );
      } else {
        onChange(out);
      }
    } catch {
      setError("Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  if (src) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl border border-[#ececf1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="block max-h-[280px] w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[12px] font-bold text-[#1a1a2e] shadow-sm transition hover:text-[#ff5e1a]"
            >
              <RefreshCw className="size-3" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              aria-label="Remove image"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-white/95 text-[#6a6b7b] shadow-sm transition hover:text-[#ff5255]"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            void accept(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {error && <p className="text-[12px] font-semibold text-[#c22f32]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void accept(e.dataTransfer.files?.[0]);
        }}
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-3.5 py-7 text-center transition ${
          over
            ? "border-[#ff5e1a] bg-[#fff7f1]"
            : "border-[#d4d3df] bg-white hover:border-[#ff5e1a] hover:bg-[#fffaf7]"
        }`}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin text-[#ff5e1a]" />
        ) : (
          <ImagePlus className="size-5 text-[#9a9aa8]" />
        )}
        <span className="text-[13px] font-bold text-[#1a1a2e]">
          {busy ? "Processing…" : "Drop an image here, or click to choose"}
        </span>
        <span className="text-[11.5px] text-[#9a9aa8]">
          PNG, JPG, WebP or GIF · resized to 1600px on the long edge
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          void accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-[12px] font-semibold text-[#c22f32]">{error}</p>}
    </div>
  );
}
