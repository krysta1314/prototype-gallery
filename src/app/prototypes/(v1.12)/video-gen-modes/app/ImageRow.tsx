"use client";

/* 画布最上面一行「Image」:图片节点 + Upscale(2026-11-05 把 ai-tools 的 Upscale 画布并进来，两个原型共用一个画布)。
   - 图片来源：工具页「Open in canvas」带过来的图(sessionStorage CANVAS_KEY),没有就用样图;
   - 选中图片节点 → 上方出真实画布同款工具栏(Upscale / Download / Favorites / Delete,复用 hybrid-reel/canvas/upscale.tsx),
     点 Upscale → 节点右侧出参数浮层(SeedVR,和工具页同一套参数和计价)→ 右边新建一个连线的放大结果节点;
   - 放大结果还能再放大(链式);失败显示原因 + Retry。
   - 2026-11-06:工具栏 Upscale 后面加 Talking Avatar(照片 + 音频 → 说话视频，结果落在下面 Video 行)。 */

import { useEffect, useState } from "react";
import { ImageIcon, ImageUpscale } from "lucide-react";
import { ImageToolbar, UpscalePopover } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/upscale";
import { DEFAULT_PARAMS, type UpscaleParams } from "@/app/prototypes/(v1.12)/ai-tools/app/logic";
import { UPSCALE_ERROR_TEXT, UpscaleError, type UpscaleApi, type UpscaleSource } from "@/app/prototypes/(v1.12)/ai-tools/app/api";
import { createFixtureApi, FIXTURE_SAMPLE } from "@/app/prototypes/(v1.12)/ai-tools/app/fixture";
import { CANVAS_KEY, parseCanvasPayload } from "@/app/prototypes/(v1.12)/ai-tools/app/canvasProject";
import { CanvasToolPopover } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/CanvasToolPopover";
import { CANVAS_TOOLS } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/canvasTools";
import type { Media, ToolState } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/logic";
import { ToolButton } from "./VideoRow";

type Img = {
  id: string;
  x: number;
  src: UpscaleSource;
  status: "ready" | "running" | "failed";
  from?: string;
  /** 放大用的参数(失败重试用) */
  params?: UpscaleParams;
  error?: string;
  fileSize?: number;
};

/** 画布分组框(Figma Section 样式):浅灰底框住一组节点，左上角深色标签 */
export function Section({ label, count, left, top, width, height }: { label: string; count?: number; left: number; top: number; width: number; height: number }) {
  return (
    <div className="pointer-events-none absolute rounded-[24px] border border-[#dcdce4] bg-[#e8e8ee]/70" style={{ left, top, width, height }} aria-hidden>
      <span className="absolute -top-9 left-0 inline-flex items-center gap-1.5 rounded-lg bg-[#2b2b36] px-2.5 py-1 text-[13px] font-semibold text-white">
        {label}
        {count !== undefined && <span className="tabular-nums text-white/55">{count}</span>}
      </span>
    </div>
  );
}

export const IMG_W = 260;
export const IMG_H = 146;
let seq = 1;

export function ImageRow({
  x0,
  y,
  gap,
  selected,
  onSelect,
  notify,
  upscaleApi,
  expanded = false,
  canvasMedia = [],
  onImages,
  onRunTool,
}: {
  /** 第一个节点的左边 */
  x0: number;
  y: number;
  /** 节点之间的水平间距(和视频节点同一格宽) */
  gap: number;
  selected: string | null;
  onSelect: (id: string) => void;
  notify: (t: string) => void;
  upscaleApi?: UpscaleApi;
  /** true = 每张就绪的图旁边都展开 Upscale 浮层(和视频节点的输入框全部展开一样) */
  expanded?: boolean;
  /** 画布上所有素材(工具浮层「From canvas」里挑) */
  canvasMedia?: Media[];
  /** 就绪的图片有变化时告诉画布(给视频节点的工具浮层挑人物照片) */
  onImages?: (list: Media[]) => void;
  /** 图片节点上的模型工具(Talking Avatar)点了生成 */
  onRunTool?: (tool: string, node: Media, state: ToolState) => void;
}) {
  const [api] = useState(() => upscaleApi ?? createFixtureApi({ delayMs: 4000 }));
  const [imgs, setImgs] = useState<Img[]>([]);
  const [params, setParams] = useState<UpscaleParams>(DEFAULT_PARAMS);
  const [popFor, setPopFor] = useState<string | null>(null);
  const [fav, setFav] = useState<Set<string>>(new Set());
  /** 图片节点上打开的模型工具浮层(和 Upscale 浮层互斥) */
  const [toolFor, setToolFor] = useState<{ id: string; tool: string } | null>(null);
  const asMedia = (m: Img): Media => ({ id: m.id, name: m.src.name, kind: "image", url: m.src.url });

  useEffect(() => {
    onImages?.(imgs.filter((m) => m.status === "ready").map(asMedia));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgs]);

  /* 工具页 Open in canvas 带来的图(只能在客户端读 sessionStorage) */
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(CANVAS_KEY);
    } catch {
      /* 存储不可用：用样图 */
    }
    const list = parseCanvasPayload(raw)?.images ?? [FIXTURE_SAMPLE.source];
    let live = true;
    void Promise.resolve().then(() => live && setImgs(list.map((src, i) => ({ id: `img-${i}`, x: x0 + i * gap, src, status: "ready" }))));
    return () => {
      live = false;
    };
  }, [x0, gap]);

  const run = (id: string, from: Img, p: UpscaleParams) => {
    void api
      .upscale(from.src, p)
      .then((r) => {
        setImgs((all) => all.map((m) => (m.id === id ? { ...m, status: "ready", src: { url: r.url, width: r.width, height: r.height, name: `${from.src.name.replace(/\.[a-z]+$/i, "")}-${r.width}x${r.height}.${r.format}` }, fileSize: r.fileSize } : m)));
        notify("Upscale is done");
      })
      .catch((e: unknown) => {
        const kind = e instanceof UpscaleError ? e.kind : "fail";
        setImgs((all) => all.map((m) => (m.id === id ? { ...m, status: "failed", error: UPSCALE_ERROR_TEXT[kind] } : m)));
      });
  };

  const upscale = (from: Img) => {
    const id = `img-u${seq++}`;
    /* 放在来源右边第一个空位 */
    let x = from.x + gap;
    while (imgs.some((m) => m.x === x)) x += gap;
    setImgs((all) => [...all, { id, x, src: from.src, status: "running", from: from.id, params }]);
    setPopFor(null);
    onSelect(id);
    run(id, from, params);
  };

  const right = imgs.length ? Math.max(...imgs.map((m) => m.x)) + IMG_W + 12 + 332 + 30 : x0 + IMG_W + 400;
  return (
    <>
      <Section label="Image" count={imgs.length || undefined} left={x0 - 210} top={y - 64} width={right - (x0 - 210)} height={700} />
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        {imgs
          .filter((m) => m.from)
          .map((m) => {
            const a = imgs.find((x) => x.id === m.from);
            if (!a) return null;
            const yy = y + 22 + IMG_H / 2;
            return <path key={m.id} d={`M${a.x + IMG_W},${yy} L${m.x},${yy}`} stroke="#ff8a4c" strokeWidth={2} fill="none" />;
          })}
      </svg>
      {imgs.map((m) => {
        const on = m.id === selected;
        const from = m.from ? imgs.find((x) => x.id === m.from) : undefined;
        return (
          <div key={m.id} className="absolute" style={{ left: m.x, top: y, width: IMG_W }} onClick={(e) => (e.stopPropagation(), onSelect(m.id))}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
              <span className="shrink-0 font-semibold text-[#4a4b5c]">{m.from ? "Upscaled Image" : "Image"}</span>
              <span className="min-w-0 truncate text-right tabular-nums text-[#a0a1aa]">
                {m.status === "ready" ? `${m.src.width} × ${m.src.height}` : m.src.name}
              </span>
            </div>
            <div className={`relative grid h-[146px] place-items-center overflow-hidden rounded-2xl bg-white transition ${on ? "border-2 border-[#ff6a3d] shadow-[0_8px_24px_rgba(255,94,26,0.12)]" : "border border-[#e4e3ea]"}`}>
              {m.status === "ready" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.src.url} alt={m.src.name} className="size-full bg-[#f7f7f9] object-contain" />
              ) : m.status === "running" ? (
                <div className="text-center">
                  <ImageIcon className="mx-auto size-4 animate-pulse text-[#ff5e1a]" />
                  <p className="mt-1.5 text-[13px] font-semibold text-[#1a1a2e]">Generating…</p>
                </div>
              ) : (
                <div className="px-3 text-center">
                  <p className="text-[13px] font-semibold text-[#c2410c]">{m.error}</p>
                  {from && m.params && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgs((all) => all.map((x) => (x.id === m.id ? { ...x, status: "running", error: undefined } : x)));
                        run(m.id, from, m.params!);
                      }}
                      className="mt-2 rounded-full border border-[#ececf1] px-3 py-1 text-[12px] font-semibold text-[#1a1a2e] hover:bg-[#f4f3f6]"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
            {(on || expanded) && m.status === "ready" && (
              <ImageToolbar
                style={{ left: IMG_W / 2, top: -10 }}
                upscaleLabel="Upscale Image"
                upscaleIcon={ImageUpscale}
                canUpscale
                upscaleOpen={toolFor?.id !== m.id && (expanded || popFor === m.id)}
                downloadPct={null}
                fileSize={m.fileSize}
                favorite={fav.has(m.id)}
                onToggleFavorite={() =>
                  setFav((s) => {
                    const n = new Set(s);
                    if (n.has(m.id)) n.delete(m.id);
                    else n.add(m.id);
                    return n;
                  })
                }
                onUpscale={() => (setToolFor(null), setPopFor(popFor === m.id ? null : m.id))}
                extra={
                  onRunTool
                    ? CANVAS_TOOLS.image.map((t) => (
                        <ToolButton
                          key={t}
                          tool={t}
                          open={toolFor?.id === m.id && toolFor.tool === t}
                          onClick={() => (setPopFor(null), setToolFor(toolFor?.id === m.id && toolFor.tool === t ? null : { id: m.id, tool: t }))}
                        />
                      ))
                    : null
                }
                onDownload={() => {
                  const a = document.createElement("a");
                  a.href = m.src.url;
                  a.download = m.src.name;
                  a.click();
                }}
                onDelete={() => {
                  setPopFor(null);
                  setImgs((all) => all.filter((x) => x.id !== m.id));
                }}
              />
            )}
            {toolFor?.id === m.id && on && m.status === "ready" && onRunTool && (
              <CanvasToolPopover
                key={toolFor.tool}
                tool={toolFor.tool}
                node={asMedia(m)}
                canvasMedia={canvasMedia}
                style={{ left: 0, top: 178, maxHeight: 440 }}
                onClose={() => setToolFor(null)}
                onConfirm={(st) => {
                  const t = toolFor.tool;
                  setToolFor(null);
                  onRunTool(t, asMedia(m), st);
                }}
              />
            )}
            {toolFor?.id !== m.id && (expanded || (on && popFor === m.id)) && m.status === "ready" && (
              <UpscalePopover
                title="Upscale Image"
                icon={ImageUpscale}
                style={{ left: 0, top: 178, maxHeight: 440 }}
                source={{ width: m.src.width, height: m.src.height }}
                params={params}
                onChange={setParams}
                onClose={() => setPopFor(null)}
                onConfirm={() => upscale(m)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
