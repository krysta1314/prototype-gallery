"use client";

/* 画布(轻量版):点阵底 + Video Generator 节点;输入框(同一个 Composer,往上开菜单)贴在节点正下方，和真实画布一样。
   2026-11-05:一打开就给每个视频模型各放一个节点，一行一家公司(行首写公司名),不用一个个切模型就能看到各自的输入框;
   composers="all"(默认)所有节点的输入框都展开,"selected" 时只展开选中的(产品行为，评审演示条可切)。
   最上面一行是「Image」:图片节点 + Upscale(原 ai-tools 的 Upscale 画布并进来，见 ImageRow.tsx);ai-tools 和本原型共用这一个画布。
   第二行是「Video」(2026-11-06):视频 / 音频节点，工具栏上能用 Upscale 和独立工具页的模型工具(见 VideoRow.tsx);工具生成的结果也落在这一行。
   每个节点有自己的输入框状态;节点右侧「+」在下一个空格新建一个连线节点。
   点生成之后的交互(生成中、结果、Extend / Edit / Use last frame)不在本需求范围，只弹提示。
   hybrid-reel 的真实画布正在被别的需求改，这里不碰它;研发把同一个 Composer 接进真实画布即可。 */

import { useMemo, useState } from "react";
import { Plus, Video } from "lucide-react";
import { APPLE_FONT } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/shell";
import { TopToast } from "@/app/prototypes/(v1.12)/ai-tools/app/components/TopToast";
import { MODEL_GROUPS } from "./capabilities";
import { ImageRow, Section } from "./ImageRow";
import { DraftToolbar, VideoRow, type VItem } from "./VideoRow";
import { modelToolSpec } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/specs";
import { CANVAS_TOOL_LABEL, canvasResultUrl } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/canvasTools";
import type { Media, ToolState } from "@/app/prototypes/(v1.12)/ai-tools/app/model-tools/logic";
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
/** 第二行「Video」的高度(视频节点 + 工具栏 + 工具浮层) */
const VID_ROW = 820;
/** 2026-11-18 Monica:音频拆成 Voiceover / Music / Sound Effects 三个分组(和首页 Creation type 对应)。
    配音节点有工具(Lip Sync / Talking Avatar,结果是视频，承载节点带浮层)所以高;音乐 / 音效只有 Ask AI + 固定 4 个 */
type RowKey = "video" | "voice" | "music" | "sfx";
const ROWS: { key: RowKey; label: string; height: number }[] = [
  { key: "video", label: "Video", height: VID_ROW },
  { key: "voice", label: "Voiceover", height: 620 },
  { key: "music", label: "Music", height: 300 },
  { key: "sfx", label: "Sound Effects", height: 300 },
];
const rowY = (k: RowKey) => PAD + IMG_ROW + ROWS.slice(0, ROWS.findIndex((r) => r.key === k)).reduce((a, r) => a + r.height, 0);
const Y0 = PAD + IMG_ROW + ROWS.reduce((a, r) => a + r.height, 0);
const COMPOSER_W = 640;
/** Video 行节点间距：视频节点的工具栏 868 宽(加了 Ask AI、复制),留 30 空隙 */
const VID_GAP = 900;
/** 承载节点离来源节点近一点(2026-11-18 Monica:线短一点)。下限 = 来源工具栏半宽 + 承载节点工具栏半宽(235/2)+ 20,
    全部展开时两条工具栏才不会叠:图片行 506/2+118+20 ≈ 391 → 480;视频行 868/2+118+20 ≈ 572 → 580 */
export const DRAFT_GAP = 480;
const VID_DRAFT_GAP = 580;

/** 把新节点插在 after(及它已有的生成结果)最右边的后面;紧挨来源的承载节点用 DRAFT_GAP,其余用 VID_GAP;
    右边的节点整体往右挪到够放为止;after 为空就放行尾 */
function insertVid(all: VItem[], after: VItem | null, item: Omit<VItem, "x">, vx: number): VItem[] {
  if (!after) return [...all, { ...item, x: Math.max(...all.map((v) => v.x), vx - VID_GAP) + VID_GAP }];
  const byId = new Map(all.map((v) => [v.id, v]));
  const fromSource = (v: VItem): boolean => {
    for (let c: VItem | undefined = v; c; c = c.from ? byId.get(c.from) : undefined) if (c.id === after.id) return true;
    return false;
  };
  const anchor = all.filter(fromSource).reduce((a, b) => (b.x > a.x ? b : a));
  const x = anchor.x + (anchor.id === after.id && item.from === after.id ? VID_DRAFT_GAP : VID_GAP);
  const next = all.filter((v) => v.x > anchor.x);
  const shift = next.length ? Math.max(0, x + VID_GAP - Math.min(...next.map((v) => v.x))) : 0;
  return [...all.map((v) => (v.x > anchor.x ? { ...v, x: v.x + shift } : v)), { ...item, x }];
}
/** 每种来源节点的第一个工具(全部展开时默认打开它的承载节点) */
const FIRST_TOOL = { video: "upscale", audio: "lip-sync" } as const;
const X0 = PAD;
const cellXY = (i: number) => ({ x: X0 + (i % COLS) * CELL_W + (CELL_W - W) / 2, y: Y0 + Math.floor(i / COLS) * CELL_H });
const cellOf = (n: { x: number; y: number }) => Math.round((n.y - Y0) / CELL_H) * COLS + Math.round((n.x - X0 - (CELL_W - W) / 2) / CELL_W);
/** 每个模型一个节点：一行一家公司 */
const allModelNodes = (): Node[] =>
  MODEL_GROUPS.flatMap((g, row) => g.models.map((m, col) => ({ id: `m-${m.key}`, ...cellXY(row * COLS + col), composer: initialComposer(m.key) })));
let seq = 1;
let vseq = 1;

/** 各行一开始的样例节点(紧挨着排;工具生成的结果插在来源右边、把后面的节点往右挤，连线不会穿过别的节点):
    Video 行一段口播(Lip Sync / Character Swap 用)、一段动作视频(Motion Control / 3D to Video 用);
    Voiceover 一段配音(Lip Sync / Talking Avatar 用);Music 一段背景音乐(hybrid-reel 的 demo 配乐);Sound Effects 一个 whoosh(ffmpeg 合成的样例) */
const S = "/prototypes/ai-tools/samples";
const initialRows = (x0: number): Record<RowKey, VItem[]> => ({
  video: [
    { id: "v-talk", x: x0, title: "Video", status: "ready", media: { id: "v-talk", name: "talking-clip.mp4", kind: "video", url: `${S}/talking-clip.mp4`, secs: 8 } },
    { id: "v-moves", x: x0 + VID_GAP, title: "Video", status: "ready", media: { id: "v-moves", name: "dance-moves.mp4", kind: "video", url: `${S}/3d-blockout.mp4`, secs: 10 } },
  ],
  voice: [{ id: "a-voice", x: x0, title: "Voiceover", status: "ready", media: { id: "a-voice", name: "voiceover.mp3", kind: "audio", url: "/prototypes/ai-tools/voice-sample.mp3", secs: 16 } }],
  music: [{ id: "a-music", x: x0, title: "Music", status: "ready", media: { id: "a-music", name: "background-music.mp3", kind: "audio", url: "/prototypes/asset-library/audio/audio-01.mp3", secs: 170 } }],
  sfx: [{ id: "a-sfx", x: x0, title: "Sound Effects", status: "ready", media: { id: "a-sfx", name: "whoosh.mp3", kind: "audio", url: "/prototypes/video-gen-modes/sfx-whoosh.mp3", secs: 2 } }],
});

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
  const VX = X0 + (CELL_W - W) / 2;
  /* 全部展开(评审看全):每个有工具的样例节点默认打开第一个工具的承载节点(视频 = Upscale Video,配音 = Lip Sync) */
  const [rows, setRows] = useState<Record<RowKey, VItem[]>>(() => {
    const base = initialRows(VX);
    if (composers !== "all") return base;
    const seed = (list: VItem[], tool: string) =>
      list.reduce((all, src) => {
        const id = `v-d${vseq++}`;
        const title = tool === "upscale" ? "Upscale Video" : (CANVAS_TOOL_LABEL[tool] ?? tool);
        return insertVid(all, all.find((v) => v.id === src.id)!, { id, title, status: "draft", from: src.id, tool, source: src.media, media: { id, name: "", kind: "video", url: "" } }, VX);
      }, list);
    return { ...base, video: seed(base.video, FIRST_TOOL.video), voice: seed(base.voice, FIRST_TOOL.audio) };
  });
  const setRow = (k: RowKey) => (f: (all: VItem[]) => VItem[]) => setRows((r) => ({ ...r, [k]: f(r[k]) }));
  const rowOf = (id: string): RowKey => (Object.keys(rows) as RowKey[]).find((k) => rows[k].some((v) => v.id === id)) ?? "video";
  const allItems = useMemo(() => Object.values(rows).flat(), [rows]);
  const [images, setImages] = useState<Media[]>([]);
  const canvasMedia = useMemo(() => [...images, ...allItems.filter((v) => v.status === "ready").map((v) => v.media)], [images, allItems]);

  const insertAfter = (all: VItem[], after: VItem | null, item: Omit<VItem, "x">) => insertVid(all, after, item, VX);
  /** 2026-11-18 Monica:点来源节点上的工具 → 在来源那一行新建一个承载节点(结果是视频 → 视频节点),参数浮层挂在它下面;
      同一来源同一工具已经有没生成的承载节点就直接选中它，不重复建。from 为空(图片行的 Talking Avatar)= 放 Video 行行尾、不连线 */
  const openTool = (tool: string, from: VItem | null, source: Media) => {
    const k = from ? rowOf(from.id) : "video";
    const existing = rows[k].find((v) => v.status === "draft" && v.tool === tool && (from ? v.from === from.id : v.source?.id === source.id));
    if (existing) return setSel(existing.id);
    const id = `v-d${vseq++}`;
    const title = tool === "upscale" ? "Upscale Video" : (CANVAS_TOOL_LABEL[tool] ?? modelToolSpec(tool).title);
    setRow(k)((all) => insertAfter(all, from, { id, title, status: "draft", from: from?.id, tool, source, media: { id, name: "", kind: "video", url: "" } }));
    setSel(id);
  };
  /** 承载节点点了生成：就在这个节点里变成生成中 → 结果(原型不真跑模型) */
  const runDraft = (draft: VItem, url: string, secs?: number) => {
    const set = setRow(rowOf(draft.id));
    set((all) => all.map((v) => (v.id === draft.id ? { ...v, status: "running", media: { id: v.id, name: `${draft.title.toLowerCase().replace(/\s+/g, "-")}.mp4`, kind: "video", url, secs } } : v)));
    window.setTimeout(() => {
      set((all) => all.map((v) => (v.id === draft.id ? { ...v, status: "ready" } : v)));
      notify(`${draft.title} is done`);
    }, 4000);
  };
  const runTool = (draft: VItem, st: ToolState) => {
    const tool = draft.tool!;
    const node = draft.source!;
    const secsInput = st.files[Object.keys(st.files).find((k) => st.files[k]?.[0]?.kind === "audio") ?? ""]?.[0]?.secs;
    runDraft(draft, canvasResultUrl(tool, node), tool === "talking-avatar" ? secsInput : node.secs);
  };
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
          <ImageRow
            x0={VX}
            y={PAD}
            gap={CELL_W}
            selected={sel}
            onSelect={setSel}
            notify={notify}
            upscaleApi={upscaleApi}
            expanded={composers === "all"}
            onImages={setImages}
            onOpenTool={(tool, node) => openTool(tool, null, node)}
          />
          {ROWS.map((r) => (
            <VideoRow
              key={r.key}
              label={r.label}
              height={r.height - 50}
              /* 音乐 / 音效节点没有可用的工具(Lip Sync / Talking Avatar 要的是人声) */
              audioTools={r.key === "voice" ? undefined : []}
              x0={VX}
              y={rowY(r.key)}
              items={rows[r.key]}
              expanded={composers === "all"}
              setItems={setRow(r.key)}
              selected={sel}
              onSelect={setSel}
              canvasMedia={canvasMedia}
              notify={notify}
              onOpenTool={(tool, from) => openTool(tool, from, from.media)}
              onRunTool={runTool}
              onDuplicate={(src) => {
                const id = `v-c${vseq++}`;
                setRow(r.key)((all) => insertAfter(all, src, { ...src, id, from: undefined, media: { ...src.media, id } }));
                setSel(id);
              }}
              onUpscale={(draft) => {
                const src = draft.source!;
                runDraft(draft, src.url.startsWith("/prototypes/") ? "/prototypes/ai-tools/upscale-video-demo.mp4" : src.url, src.secs);
              }}
            />
          ))}
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
            return (
              <div key={n.id} className="absolute" style={{ left: n.x, top: n.y, width: W, zIndex: on ? 20 : undefined }} onClick={(e) => (e.stopPropagation(), setSel(n.id))}>
                {/* 照线上画布：生成节点选中时上方浮一条工具栏(Ask AI + 固定 4 个;还没生成，下载 / 收藏置灰) */}
                {on && (
                  <DraftToolbar
                    label="Video Generator actions"
                    onAsk={() => notify("Ask AI isn't part of this prototype")}
                    onDuplicate={() => addNode(n, n.composer, false)}
                    onDelete={() => (setNodes((all) => all.filter((x) => x.id !== n.id)), setSel(null))}
                  />
                )}
                {/* 2026-11-18 Monica:标题旁不显示模型 · 模式(输入框里已经有) */}
                <div className="mb-1.5 text-[12px]">
                  <span className="font-semibold text-[#4a4b5c]">Video Generator</span>
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
