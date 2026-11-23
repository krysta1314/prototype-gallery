"use client";

/* 免费工具：Facebook / Instagram 广告图片尺寸(2026-11-19)。预设取自 Meta Ads Guide(见 ../specs.ts),canvas 本地裁切 / 留边，导出 PNG 或 JPG。 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { baseName, download, drawFit, fmtBytes } from "../media";
import { IMAGE_PRESETS } from "../specs";
import { BTN, ErrorLine, FilePick, Seg, ToolPanel } from "../ui";

type PresetKey = (typeof IMAGE_PRESETS)[number]["key"];

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preset, setPreset] = useState<PresetKey>("feed");
  const [mode, setMode] = useState<"crop" | "fit">("crop");
  const [bg, setBg] = useState<"white" | "black" | "blur">("white");
  const [fx, setFx] = useState(50);
  const [fy, setFy] = useState(50);
  const [type, setType] = useState<"jpg" | "png">("jpg");
  const [err, setErr] = useState<string>();
  const [size, setSize] = useState<number>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const P = IMAGE_PRESETS.find((p) => p.key === preset)!;

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => setImg(im);
    im.onerror = () => setErr("This image can't be opened in the browser. Try a JPG, PNG or WebP file.");
    im.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const draw = useCallback(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, P.w, P.h);
    drawFit(ctx, img, img.naturalWidth, img.naturalHeight, P.w, P.h, mode, bg, fx / 100, fy / 100);
  }, [img, P, mode, bg, fx, fy]);
  useEffect(draw, [draw]);

  const pick = (f: File) => {
    setErr(undefined);
    setSize(undefined);
    setImg(null);
    if (!f.type.startsWith("image/")) return setErr("That file isn't an image. Pick a JPG, PNG or WebP file.");
    setFile(f);
  };

  const save = () => {
    const c = canvas.current;
    if (!c || !file) return;
    draw();
    c.toBlob(
      (b) => {
        if (!b) return setErr("Couldn't create the file. Try a smaller image.");
        setSize(b.size);
        download(b, `${baseName(file)}-${P.w}x${P.h}.${type}`);
      },
      type === "png" ? "image/png" : "image/jpeg",
      0.92,
    );
  };

  if (!file)
    return (
      <ToolPanel>
        <FilePick accept="image/*" onFile={pick} title="Choose an image" hint="JPG, PNG or WebP · the image stays on your device" />
        <ErrorLine text={err} />
      </ToolPanel>
    );

  const wider = img ? img.naturalWidth / img.naturalHeight > P.w / P.h : true;
  return (
    <ToolPanel>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[18px] bg-[#1C1C1C] p-4">
          <canvas ref={canvas} width={P.w} height={P.h} aria-label={`Preview at ${P.w} by ${P.h}`} className="max-h-[520px] w-auto max-w-full rounded-[10px] bg-black" style={{ aspectRatio: `${P.w}/${P.h}` }} />
          <p className="mt-3 text-[12.5px] tabular-nums text-[#9F9F9F]">
            {P.w}×{P.h} px{img ? ` · from ${img.naturalWidth}×${img.naturalHeight}` : ""}
          </p>
        </div>
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-white">{file.name}</p>
              <p className="text-[12.5px] text-[#9F9F9F]">{fmtBytes(file.size)}</p>
            </div>
            <button type="button" aria-label="Choose another image" onClick={() => (setFile(null), setImg(null), setSize(undefined))} className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white hover:bg-white/15">
              <X className="size-4" />
            </button>
          </div>
          <Seg label="Ad size" value={preset} onChange={(v) => (setPreset(v), setSize(undefined))} options={IMAGE_PRESETS.map((p) => ({ value: p.key, label: p.label, hint: p.hint }))} />
          <Seg label="Resize mode" value={mode} onChange={setMode} options={[{ value: "crop", label: "Crop to fill" }, { value: "fit", label: "Fit with background" }]} />
          {mode === "crop" ? (
            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold text-[#9F9F9F]">{wider ? "Crop position (left to right)" : "Crop position (top to bottom)"}</span>
              <input type="range" min={0} max={100} value={wider ? fx : fy} onChange={(e) => (wider ? setFx(+e.target.value) : setFy(+e.target.value))} className="w-full accent-[#FF744D]" />
            </label>
          ) : (
            <Seg label="Background" value={bg} onChange={setBg} options={[{ value: "white", label: "White" }, { value: "black", label: "Black" }, { value: "blur", label: "Blurred" }]} />
          )}
          <Seg label="File type" value={type} onChange={setType} options={[{ value: "jpg", label: "JPG", hint: "Smaller file" }, { value: "png", label: "PNG", hint: "Lossless" }]} />
          <button type="button" className={`${BTN} w-full`} onClick={save} disabled={!img}>
            <Download className="size-4" /> Download {type.toUpperCase()}
          </button>
          {size !== undefined && <p className="text-[12.5px] text-[#CACACA]">Saved {fmtBytes(size)}. Meta&apos;s limit for image ads is 30 MB.</p>}
          {img && (img.naturalWidth < P.w || img.naturalHeight < P.h) && mode === "crop" && <p className="text-[12.5px] text-[#FFF3EC]">Your image is smaller than {P.w}×{P.h}, so it is scaled up and may look soft.</p>}
          <ErrorLine text={err} />
        </div>
      </div>
    </ToolPanel>
  );
}
