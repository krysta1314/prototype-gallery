"use client";

import { useRef, useState } from "react";
import {
  Plus, Workflow, ImagePlus, Video, SquarePlay, Image as ImageIcon, Music, User, Film,
  AudioLines, X, Trash2, Loader2, Coins, Download, RotateCcw, FileText, ArrowUp, Upload,
} from "lucide-react";
import {
  AudioPlayer, AudioParamControls, Field, DEFAULT_PARAMS, type Voice, type GenParams, ctaGrad, APPLE_FONT,
} from "./shared";

const focusRing =
  "focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20 focus-visible:outline-none";

type AudioNodeData = {
  id: number;
  x: number;
  y: number;
  text: string;
  voice: Voice | null;
  params: GenParams;
  status: "idle" | "loading" | "done";
  duration: number;
};

const ADD_NODE_ITEMS = [
  { key: "upload-image", label: "Upload Image", icon: ImageIcon },
  { key: "upload-video", label: "Upload Video", icon: Video },
  { key: "upload-audio", label: "Upload Audio", icon: Music },
  { key: "select-avatar", label: "Select Avatar", icon: User },
  { key: "gen-image", label: "Generate Image", icon: ImageIcon },
  { key: "gen-video", label: "Generate Video", icon: Film },
  { key: "gen-audio", label: "Generate Audio", icon: AudioLines }, // ← 新增,紧跟 Generate Video
];

/** 空画布上的起点。动词由上面那句话承担,标签只留类型名 —— 三个 chip 都写 "Generate" 是噪音 */
const MEDIA_TYPES = [
  { key: "video", label: "Video", icon: Video },
  { key: "image", label: "Image", icon: ImageIcon },
  { key: "audio", label: "Audio", icon: AudioLines },
];

const MAX_CHARS = 3000;

/** Empty-canvas mark: the pointer itself, with a single spark to say "double-click here". */
function CanvasCursorMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* spark, tucked above-left of the cursor tip */}
      <path
        d="M9 4.4c.25-.85 1.45-.85 1.7 0l.5 1.7c.08.28.3.5.58.58l1.7.5c.85.25.85 1.45 0 1.7l-1.7.5a.9.9 0 0 0-.58.58l-.5 1.7c-.25.85-1.45.85-1.7 0l-.5-1.7a.9.9 0 0 0-.58-.58l-1.7-.5c-.85-.25-.85-1.45 0-1.7l1.7-.5a.9.9 0 0 0 .58-.58l.5-1.7Z"
        fill="#ff5e1a"
      />
      {/* pointer */}
      <path
        d="M13.4 11.6a1.1 1.1 0 0 1 1.42-1.42l12.1 4.64c.95.37.87 1.74-.12 1.99l-4.6 1.16a1.1 1.1 0 0 0-.8.8l-1.16 4.6c-.25.99-1.62 1.07-1.99.12L13.4 11.6Z"
        fill="#2b2c3b"
      />
    </svg>
  );
}


/** Compact canvas node — placeholder until generated, then the waveform player. */
function AudioNode({
  node,
  selected,
  onSelect,
  onMove,
  onRegenerate,
  onGenerateFrom,
}: {
  node: AudioNodeData;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRegenerate: () => void;
  onGenerateFrom: () => void;
}) {
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  function onDown(e: React.PointerEvent) {
    drag.current = { dx: e.clientX - node.x, dy: e.clientY - node.y, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMovePtr(e: React.PointerEvent) {
    if (!drag.current) return;
    drag.current.moved = true;
    onMove(e.clientX - drag.current.dx, e.clientY - drag.current.dy);
  }
  function onUp() {
    drag.current = null;
  }

  // Save the generated voiceover script as a .txt the user can download.
  function downloadScript() {
    const blob = new Blob([node.text || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voiceover-script.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="absolute z-20 w-72 hover:z-40" style={{ left: node.x, top: node.y }}>
      {/* title row — title doubles as drag handle; toolbar shows above a selected node */}
      <div className="mb-2 flex items-center justify-between">
        <div
          onPointerDown={onDown}
          onPointerMove={onMovePtr}
          onPointerUp={onUp}
          className="flex w-fit cursor-grab items-center gap-1.5 px-1 text-[15px] font-bold text-[#6a6b7b] active:cursor-grabbing"
        >
          <AudioLines className="size-4 text-[#6a6b7b]" /> Audio Generator
        </div>
        {selected && node.status === "done" && (
          <div className="flex items-center gap-0.5 rounded-xl border border-[#ececf1] bg-white p-0.5 shadow-[0_4px_16px_rgba(26,26,46,0.08)]">
            <button className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6]" aria-label="Download audio"><Download className="size-3.5" /></button>
            <button onClick={downloadScript} className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6]" aria-label="Download script (.txt)"><FileText className="size-3.5" /></button>
            <button onClick={onRegenerate} className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6]" aria-label="Regenerate"><RotateCcw className="size-3.5" /></button>
          </div>
        )}
      </div>

      {/* card */}
      <div
        onPointerDown={onSelect}
        className={`relative rounded-[22px] border bg-white shadow-[0_8px_24px_rgba(26,26,46,0.06)] transition-colors ${
          selected ? "border-[#ff5e1a]" : "border-[#ececf1]"
        }`}
      >
        {/* left connection handle (decorative) */}
        <span className="absolute left-0 top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#c7c7d1]" />

        {/* right handle — a "+" that reveals the "Generate from this node" menu on hover */}
        <div className="group/gen absolute right-0 top-1/2 z-30 -translate-y-1/2 translate-x-1/2">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            className="grid size-6 place-items-center rounded-full border border-[#ececf1] bg-white text-[#6a6b7b] shadow-[0_2px_8px_rgba(26,26,46,0.14)] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
            aria-label="Generate from this node"
          >
            <Plus className="size-3.5" />
          </button>
          <div className="invisible absolute left-full top-1/2 z-30 -translate-y-1/2 pl-2 opacity-0 transition group-hover/gen:visible group-hover/gen:opacity-100">
            <div className="w-60 rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_36px_rgba(26,26,46,0.16)]">
              <div className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-[#6a6b7b]">Generate from this node</div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onGenerateFrom(); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[#fff3ec]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a]"><AudioLines className="size-4" /></span>
                <span>
                  <span className="block text-sm font-semibold text-[#1a1a2e]">Generate Audio</span>
                  <span className="block text-xs text-[#6a6b7b]">New voiceover from this node</span>
                </span>
              </button>
              <button onPointerDown={(e) => e.stopPropagation()} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[#fff3ec]">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff3ec] text-[#ff5e1a]"><Film className="size-4" /></span>
                <span>
                  <span className="block text-sm font-semibold text-[#1a1a2e]">Generate Video</span>
                  <span className="block text-xs text-[#6a6b7b]">Create a video from this node</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {node.status === "idle" && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AudioLines className="size-8 text-[#1a1a2e]" />
            <p className="text-lg font-bold text-[#1a1a2e]">No Audio Generated</p>
            <p className="text-sm leading-snug text-[#9a9aa8]">Configure settings and<br />start generation</p>
          </div>
        )}
        {node.status === "loading" && (
          <div
            className="relative h-44 overflow-hidden rounded-[22px]"
            style={{ background: "linear-gradient(135deg,#ffe1bd 0%,#ffb9a6 48%,#ff9fb2 100%)" }}
          >
            <span className="absolute left-3 top-3 rounded-full bg-black/15 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">Generating…</span>
          </div>
        )}
        {node.status === "done" && (
          <div className="p-3">
            <AudioPlayer durationSec={node.duration} onRegenerate={onRegenerate} hideActions />
          </div>
        )}
      </div>
    </div>
  );
}

/** Right-docked settings drawer for the selected node. */
function AudioSettingsPanel({
  node,
  onChange,
  onGenerate,
  onDelete,
  onClose,
}: {
  node: AudioNodeData;
  onChange: (patch: Partial<AudioNodeData>) => void;
  onGenerate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const canGenerate = node.text.trim().length > 0 && !!node.voice && node.status !== "loading";

  return (
    <div className="absolute right-0 top-0 bottom-0 z-40 flex w-80 flex-col border-l border-[#ececf1] bg-white shadow-[-16px_0_36px_rgba(26,26,46,0.08)]">
      {/* header */}
      <div className="flex items-start justify-between border-b border-[#ececf1] px-4 py-3.5">
        <div>
          <p className="text-base font-extrabold tracking-tight text-[#1a1a2e]">Audio Settings</p>
          <p className="text-xs text-[#6a6b7b]">Configure audio generation</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6] hover:text-[#ff5255]" aria-label="Delete node">
            <Trash2 className="size-4" />
          </button>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6]" aria-label="Close settings">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* scrollable fields */}
      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <Field label="Input Source">
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#d4d3df] px-3 py-2.5 text-sm text-[#6a6b7b]">
            <AudioLines className="size-4 shrink-0" /> No reference audio connected (optional)
          </div>
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-[#1a1a2e]">Script</span>
          <div className="relative">
            <textarea
              value={node.text}
              onChange={(e) => onChange({ text: e.target.value.slice(0, MAX_CHARS) })}
              placeholder="Enter the script to turn into a voiceover... Type @ to reference attachments"
              rows={4}
              className={`w-full resize-none rounded-xl border border-[#ececf1] bg-white px-3 pb-6 pt-2.5 text-sm text-[#1a1a2e] ${focusRing}`}
            />
            <span className={`absolute bottom-2 right-3 text-xs tabular-nums ${node.text.length >= MAX_CHARS ? "text-[#ff5255]" : "text-[#6a6b7b]"}`}>
              {node.text.length}/{MAX_CHARS}
            </span>
          </div>
          {node.text.trim().length === 0 && <p className="mt-1 text-xs font-semibold text-[#ff5255]">Script is required</p>}
        </div>

        <AudioParamControls
          voice={node.voice}
          onVoice={(v) => onChange({ voice: v })}
          params={node.params}
          onParams={(p) => onChange({ params: p })}
        />
      </div>

      {/* footer */}
      <div className="border-t border-[#ececf1] p-3">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`flex w-full items-center justify-center gap-2 rounded-xl ${ctaGrad} px-5 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105 disabled:opacity-50`}
        >
          {node.status === "loading" ? (
            <><Loader2 className="size-4 animate-spin" /> Generating…</>
          ) : (
            <>
              Generate Audio
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                <Coins className="size-3.5" /> 3
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function CanvasScene() {
  const [nodes, setNodes] = useState<AudioNodeData[]>([]); // 初始空白画布
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const nextId = useRef(4);
  const containerRef = useRef<HTMLDivElement>(null);

  function openMenuAt(x: number, y: number) {
    setMenu({ x, y });
  }

  function handleDoubleClick(e: React.MouseEvent) {
    if (e.target !== e.currentTarget) return; // only on blank canvas
    const rect = containerRef.current?.getBoundingClientRect();
    openMenuAt(e.clientX - (rect?.left ?? 0), e.clientY - (rect?.top ?? 0));
  }

  function handlePlusClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    const btnRect = e.currentTarget.getBoundingClientRect();
    openMenuAt(btnRect.right - (rect?.left ?? 0) + 8, btnRect.top - (rect?.top ?? 0));
  }

  function addAudioNode() {
    const id = nextId.current++;
    setNodes((prev) => {
      // From the add-node menu, drop at the click point; from the toolbar, stagger into open space.
      const staggered = 430 + (prev.length % 4) * 40;
      const x = menu ? menu.x : staggered;
      const y = menu ? menu.y : 360;
      return [
        ...prev,
        { id, x, y, text: "", voice: null, params: DEFAULT_PARAMS, status: "idle", duration: 0 },
      ];
    });
    setSelectedId(id);
    setMenu(null);
  }

  // "Generate from this node" → drop a fresh Audio Generator to the right of the source.
  function generateFromNode(source: AudioNodeData) {
    const id = nextId.current++;
    setNodes((prev) => [
      ...prev,
      { id, x: source.x + 320, y: source.y, text: "", voice: null, params: DEFAULT_PARAMS, status: "idle", duration: 0 },
    ]);
    setSelectedId(id);
  }

  function patchNode(id: number, patch: Partial<AudioNodeData>) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function deleteNode(id: number) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  }

  function generateNode(id: number) {
    const node = nodes.find((n) => n.id === id);
    if (!node || !node.text.trim() || !node.voice) return;
    patchNode(id, { status: "loading" });
    const words = node.text.trim().split(/\s+/).length;
    const duration = Math.min(120, Math.max(3, Math.round(words * 0.35)));
    setTimeout(() => patchNode(id, { status: "done", duration }), 1200);
  }

  const isEmpty = nodes.length === 0 && !menu;
  // 演示用:三版空状态设计切换,真实产品里只会留一版
  const [variant, setVariant] = useState<1 | 2 | 3>(1);
  const [promptType, setPromptType] = useState("video");
  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  const MENU_WIDTH = 224; // w-56
  const MENU_HEIGHT = 320; // header + 7 items, generous estimate
  let menuLeft = menu?.x ?? 0;
  let menuTop = menu?.y ?? 0;
  if (menu) {
    const rect = containerRef.current?.getBoundingClientRect();
    const containerWidth = rect?.width ?? menu.x + MENU_WIDTH;
    const containerHeight = rect?.height ?? menu.y + MENU_HEIGHT;
    menuLeft = Math.max(8, Math.min(menu.x, containerWidth - MENU_WIDTH - 8));
    menuTop = Math.max(8, Math.min(menu.y, containerHeight - MENU_HEIGHT - 8));
  }

  return (
    <div
      ref={containerRef}
      onDoubleClick={handleDoubleClick}
      className="relative h-[calc(100vh-53px)] overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(#d4d3df 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        backgroundColor: "#f3f3f5",
        fontFamily: APPLE_FONT,
      }}
    >
      {/* Left toolbar */}
      <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_10px_24px_rgba(26,26,46,0.08)]">
        <button
          onClick={handlePlusClick}
          className={`grid size-10 place-items-center rounded-xl ${ctaGrad} text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105`}
          aria-label="Add node"
        >
          <Plus className="size-5" />
        </button>
        <button className="grid size-10 place-items-center rounded-xl text-[#6a6b7b] transition hover:bg-[#faf8f6]" aria-label="Workflow">
          <Workflow className="size-5" />
        </button>
        <div className="my-0.5 h-px w-6 bg-[#ececf1]" />
        <button className="grid size-10 place-items-center rounded-xl text-[#6a6b7b] transition hover:bg-[#faf8f6]" aria-label="Add image">
          <ImagePlus className="size-5" />
        </button>
        <button className="grid size-10 place-items-center rounded-xl text-[#6a6b7b] transition hover:bg-[#faf8f6]" aria-label="Add video">
          <SquarePlay className="size-5" />
        </button>
        <button onClick={addAudioNode} className="grid size-10 place-items-center rounded-xl text-[#6a6b7b] transition hover:bg-[#faf8f6]" aria-label="Add audio generator">
          <AudioLines className="size-5" />
        </button>
      </div>

      {/* Empty state —— 三版设计,底部切换器选 */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-6">
          {/* 方案 1 · 幽灵节点:直接在画布上预告「点完会长出什么」,而不是先弹一组按钮 */}
          {variant === 1 && (
            <div className="pointer-events-auto flex flex-col items-center">
              <div className="mb-6 flex flex-col items-center text-center">
                <CanvasCursorMark />
                <p className="mt-3 text-[15px] font-bold tracking-tight text-[#4a4b5a]">
                  Double-click anywhere to start, or pick a node below.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {MEDIA_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={addAudioNode}
                      className="group flex h-[108px] w-[172px] flex-col justify-between rounded-2xl border-2 border-dashed border-[#d4d2da] p-3.5 text-left transition duration-200 hover:border-solid hover:border-[#ff5e1a] hover:bg-white hover:shadow-[0_10px_28px_rgba(26,26,46,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
                    >
                      <Icon className="size-[18px] text-[#9a98a4] transition duration-200 group-hover:text-[#ff5e1a]" />
                      <span className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-[#6a6b7b] transition duration-200 group-hover:text-[#1a1a2e]">
                          {t.label}
                        </span>
                        <Plus className="size-4 text-[#c4c2cc] transition duration-200 group-hover:text-[#ff5e1a]" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 方案 2 · 提示词栏:和 Agent 页同一套输入语汇,画布不再是「先建节点再填内容」 */}
          {variant === 2 && (
            <div className="pointer-events-auto w-full max-w-[620px]">
              <div className="rounded-[22px] border border-[#e4e2e8] bg-white p-2 shadow-[0_18px_44px_rgba(26,26,46,0.10)]">
                <input
                  placeholder="Describe what you want to create on this canvas…"
                  className={`w-full rounded-xl bg-transparent px-3 py-3 text-[15px] text-[#1a1a2e] placeholder:text-[#8d8b98] focus:outline-none`}
                />
                <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
                  <div className="flex items-center gap-1">
                    {MEDIA_TYPES.map((t) => {
                      const Icon = t.icon;
                      const on = promptType === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setPromptType(t.key)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition duration-200 ${
                            on ? "bg-[#fff3ec] text-[#ff5e1a]" : "text-[#6a6b7b] hover:bg-[#f5f4f7]"
                          }`}
                        >
                          <Icon className="size-4" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={addAudioNode}
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${ctaGrad} text-white transition hover:brightness-105`}
                    aria-label="Generate"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-center text-[13px] font-medium text-[#6a6b7b]">
                Or double-click the canvas to place an empty node.
              </p>
            </div>
          )}

          {/* 方案 3 · 投放区:画布本来就该能接住拖进来的素材,空状态直接说这件事 */}
          {variant === 3 && (
            <div className="pointer-events-auto w-full max-w-[520px] rounded-[26px] border-2 border-dashed border-[#d4d2da] bg-white/55 px-8 py-9 text-center backdrop-blur-[2px] transition duration-200 hover:border-[#ffb694] hover:bg-white/80">
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#fff3ec] text-[#ff5e1a]">
                <Upload className="size-5" />
              </span>
              <p className="mt-4 text-[16px] font-bold tracking-tight text-[#1a1a2e]">
                Drop media here to get started
              </p>
              <p className="mt-1 text-[13.5px] font-medium text-[#6a6b7b]">
                Or double-click the canvas — no file needed.
              </p>
              <div className="mt-5 flex items-center justify-center gap-1.5">
                {MEDIA_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={addAudioNode}
                      className="flex items-center gap-1.5 rounded-full border border-[#e4e2e8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#4a4b5a] transition duration-200 hover:border-[#ffc9ab] hover:text-[#ff5e1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/25"
                    >
                      <Icon className="size-4" />
                      Generate {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 演示控制 —— 不属于真实产品,切换上方三版空状态设计 */}
      {isEmpty && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#e4e2e8] bg-white/90 p-1 shadow-[0_8px_22px_rgba(26,26,46,0.10)] backdrop-blur">
          {([
            [1, "幽灵节点"],
            [2, "提示词栏"],
            [3, "投放区"],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
                variant === v ? "bg-[#1a1a2e] text-white" : "text-[#6a6b7b] hover:bg-[#f5f4f7]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Add Node menu */}
      {menu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />
          <div
            className="absolute z-30 w-56 rounded-2xl border border-[#ececf1] bg-white p-1.5 shadow-[0_16px_36px_rgba(26,26,46,0.16)]"
            style={{ left: menuLeft, top: menuTop }}
          >
            <div className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide text-[#6a6b7b]">Add Node</div>
            {ADD_NODE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={item.key === "gen-audio" ? addAudioNode : undefined}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#fff3ec]"
                >
                  <Icon className="size-4 text-[#ff5e1a]" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Nodes */}
      {nodes.map((n) => (
        <AudioNode
          key={n.id}
          node={n}
          selected={n.id === selectedId}
          onSelect={() => setSelectedId(n.id)}
          onMove={(x, y) => patchNode(n.id, { x, y })}
          onRegenerate={() => generateNode(n.id)}
          onGenerateFrom={() => generateFromNode(n)}
        />
      ))}

      {/* Settings drawer */}
      {selected && (
        <AudioSettingsPanel
          node={selected}
          onChange={(patch) => patchNode(selected.id, patch)}
          onGenerate={() => generateNode(selected.id)}
          onDelete={() => deleteNode(selected.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
