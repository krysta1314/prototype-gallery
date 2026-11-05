"use client";

/* 画布(轻量版):点阵底 + Video Generator 节点;输入框(同一个 Composer,往上开菜单)贴在节点正下方，和真实画布一样。
   2026-11-05:一打开就给每个视频模型各放一个节点，一行一家公司(行首写公司名),不用一个个切模型就能看到各自的输入框;
   composers="all"(默认)所有节点的输入框都展开,"selected" 时只展开选中的(产品行为，评审演示条可切)。
   最上面一行是「Image」:图片节点 + Upscale(原 ai-tools 的 Upscale 画布并进来，见 ImageRow.tsx);ai-tools 和本原型共用这一个画布。
   每个节点有自己的输入框状态;节点右侧「+」在下一个空格新建一个连线节点。
   点生成之后的交互(生成中、结果、Extend / Edit / Use last frame)不在本需求范围，只弹提示。
   hybrid-reel 的真实画布正在被别的需求改，这里不碰它;研发把同一个 Composer 接进真实画布即可。 */

import { useMemo, useState } from "react";
import { Plus, Trash2, Video } from "lucide-react";
import { APPLE_FONT } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/shell";
import { TopToast } from "@/app/prototypes/(v1.12)/ai-tools/app/components/TopToast";
import { MODEL_GROUPS, MODE_LABEL, modelCaps } from "./capabilities";
import { ModelIcon } from "./components/BarMenus";
import { ImageRow, Section } from "./ImageRow";
import type { UpscaleApi } from "@/app/prototypes/(v1.12)/ai-tools/app/api";
import { initialComposer, type ComposerState } from "./state";
import { useToast } from "./ProductApp";
import { Composer } from "./components/Composer";

type Node = { id: string; x: number; y: number; composer: ComposerState; from?: string };

const W = 260;
const H = 146;
/** 一格 = 节点 + 下面的输入框;格子编号按 COLS 列折算(一行最多放 COLS 个，生成的后续节点接在同一行后面) */
const COLS = 8;
const CELL_W = 700;
const CELL_H = 620;
const PAD = 140;
/** 最上面「Image」分组的高度(图片节点 + 工具栏 + Upscale 浮层) */
const IMG_ROW = 740;
const Y0 = PAD + IMG_ROW;
const COMPOSER_W = 640;
const X0 = PAD;
const cellXY = (i: number) => ({ x: X0 + (i % COLS) * CELL_W + (CELL_W - W) / 2, y: Y0 + Math.floor(i / COLS) * CELL_H });
const cellOf = (n: { x: number; y: number }) => Math.round((n.y - Y0) / CELL_H) * COLS + Math.round((n.x - X0 - (CELL_W - W) / 2) / CELL_W);
/** 每个模型一个节点：一行一家公司 */
const allModelNodes = (): Node[] =>
  MODEL_GROUPS.flatMap((g, row) => g.models.map((m, col) => ({ id: `m-${m.key}`, ...cellXY(row * COLS + col), composer: initialComposer(m.key) })));
let seq = 1;

export function CanvasView({
  onBack,
  inUK = false,
  composers = "all",
  upscaleApi,
}: {
  onBack: () => void;
  inUK?: boolean;
  /** 生成相关(点生成之后不在本需求范围;保留参数，调用方不用改) */
  failNext?: () => boolean;
  generateMs?: number;
  /** all = 每个节点的输入框都展开(评审看各模型 UI 用);selected = 只展开选中的(产品行为) */
  composers?: "all" | "selected";
  /** 图片节点 Upscale 的接口(不传 = fixture) */
  upscaleApi?: UpscaleApi;
}) {
  const [nodes, setNodes] = useState<Node[]>(allModelNodes);
  const [sel, setSel] = useState<string | null>(`m-${MODEL_GROUPS[0].models[0].key}`);
  const { toast, notify, dismiss } = useToast();
  const setNode = (id: string, p: Partial<Node>) => setNodes((all) => all.map((n) => (n.id === id ? { ...n, ...p } : n)));

  /** 新节点放在来源节点之后的第一个空格 */
  const addNode = (from: Node, composer: ComposerState, link: boolean) => {
    const id = `n${seq++}`;
    const used = new Set(nodes.map(cellOf));
    let i = cellOf(from) + 1;
    while (used.has(i)) i++;
    setNodes((all) => [...all, { id, ...cellXY(i), composer, from: link ? from.id : undefined }]);
    setSel(id);
  };

  const generate = () => notify("Your video is generating");


  const size = useMemo(() => ({ w: Math.max(...nodes.map((n) => n.x)) + W / 2 + CELL_W / 2 + PAD, h: Math.max(...nodes.map((n) => n.y)) + CELL_H + PAD }), [nodes]);

  return (
    <div className="relative h-full overflow-hidden bg-[#f3f3f6]" style={{ fontFamily: APPLE_FONT }}>
      <div className="absolute inset-0 overflow-auto" onClick={() => setSel(null)}>
        <div className="relative" style={{ width: size.w, height: size.h, backgroundImage: "radial-gradient(#cfcfd8 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
          <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden>
            {nodes
              .filter((n) => n.from)
              .map((n) => {
                const a = nodes.find((x) => x.id === n.from);
                if (!a) return null;
                const x1 = a.x + W, y1 = a.y + 22 + H / 2, x2 = n.x, y2 = n.y + 22 + H / 2;
                return <path key={n.id} d={`M${x1},${y1} C${x1 + 60},${y1} ${x2 - 60},${y2} ${x2},${y2}`} stroke="#ff8a4c" strokeWidth={2} fill="none" />;
              })}
          </svg>
          <ImageRow x0={X0 + (CELL_W - W) / 2} y={PAD} gap={CELL_W} selected={sel} onSelect={setSel} notify={notify} upscaleApi={upscaleApi} expanded={composers === "all"} />
          {/* 每家公司一个分组框(Figma Section 样式):框住这一行的节点和输入框，左上角标签写公司名 + 模型数 */}
          {MODEL_GROUPS.map((g, row) => {
            const y = Y0 + row * CELL_H;
            const inRow = nodes.filter((n) => n.y === y);
            if (!inRow.length) return null;
            const right = Math.max(...inRow.map((n) => n.x)) + W / 2 + CELL_W / 2 - 10;
            return <Section key={g.company} label={g.company} count={g.models.length} left={X0 + 10} top={y - 30} width={right - X0 - 10} height={540} />;
          })}
          {nodes.map((n) => {
            const on = n.id === sel;
            const caps = modelCaps(n.composer.model);
            return (
              <div key={n.id} className="absolute" style={{ left: n.x, top: n.y, width: W }} onClick={(e) => (e.stopPropagation(), setSel(n.id))}>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="shrink-0 font-semibold text-[#4a4b5c]">Video Generator</span>
                  <span className="ml-2 flex min-w-0 flex-1 items-center justify-end gap-1 text-[#a0a1aa]">
                    <ModelIcon model={n.composer.model} className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {caps.label} · {MODE_LABEL[n.composer.mode]}
                    </span>
                  </span>
                  {on && (
                    <button type="button" aria-label="Delete node" onClick={(e) => (e.stopPropagation(), setNodes((all) => all.filter((x) => x.id !== n.id)), setSel(null))} className="ml-1 grid size-6 shrink-0 place-items-center rounded-md text-[#9a9bb0] hover:bg-white hover:text-[#1a1a2e]">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className={`relative grid h-[146px] place-items-center overflow-hidden rounded-2xl bg-white transition ${on ? "border-2 border-[#ff6a3d] shadow-[0_8px_24px_rgba(255,94,26,0.12)]" : "border border-[#e4e3ea]"}`}>
                  <div className="text-center">
                    <Video className="mx-auto size-4 text-[#1a1a2e]" />
                    <p className="mt-1.5 text-[13px] font-semibold text-[#1a1a2e]">No Video Generated</p>
                    <p className="mt-0.5 text-[11.5px] text-[#9a9bb0]">Configure settings and start generation</p>
                  </div>
                  <span className="absolute -left-[5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-[#ff6a3d]" aria-hidden />
                </div>
                <button
                  type="button"
                  aria-label="Add a video node"
                  onClick={(e) => (e.stopPropagation(), addNode(n, initialComposer(n.composer.model), true))}
                  className="absolute -right-3 top-[95px] grid size-6 place-items-center rounded-full bg-[#ff6a3d] text-white shadow-sm transition hover:scale-110"
                >
                  <Plus className="size-3.5" strokeWidth={3} />
                </button>
                {(composers === "all" || on) && (
                  /* 输入框贴在节点正下方(真实画布同款);宽 640,以节点为中心 */
                  <div
                    className="absolute top-[212px] z-10 rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_14px_40px_rgba(26,26,46,0.12)] focus-within:z-40"
                    style={{ width: COMPOSER_W, left: (W - COMPOSER_W) / 2 }}
                    onClick={(e) => (e.stopPropagation(), setSel(n.id))}
                  >
                    <Composer
                      state={n.composer}
                      onChange={(c) => setNode(n.id, { composer: c })}
                      onCreate={generate}
                      notify={notify}
                      inUK={inUK}
                      variant="canvas"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={onBack} aria-label="Back to home" className="absolute left-4 top-4 z-20 grid size-10 place-items-center rounded-xl border border-[#ececf1] bg-white shadow-sm transition hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prototypes/starter-guide/icons/buzz-video-logo.svg" alt="" className="size-6" />
      </button>

      <TopToast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
