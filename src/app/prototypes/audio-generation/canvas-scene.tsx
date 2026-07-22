"use client";

import { useRef, useState } from "react";
import {
  Plus, Workflow, ImagePlus, Video, SquarePlay, Image as ImageIcon, Music, User, Film,
  AudioLines, X, Trash2, Loader2, Coins, Download, RotateCcw,
} from "lucide-react";
import {
  AudioPlayer, AudioParamControls, Field, VOICES, DEFAULT_PARAMS, type Voice, type GenParams, ctaGrad, APPLE_FONT,
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

const TEMPLATES = [
  { label: "Cream Product UGC Style Video", color: "#ffe7d6" },
  { label: "Pet Products", color: "#fff3ec" },
  { label: "Advertising", color: "#fff7f1" },
];

const MAX_CHARS = 3000;

/** Compact canvas node — placeholder until generated, then the waveform player. */
function AudioNode({
  node,
  selected,
  onSelect,
  onMove,
  onRegenerate,
}: {
  node: AudioNodeData;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRegenerate: () => void;
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

  return (
    <div className="absolute z-20 w-72" style={{ left: node.x, top: node.y }}>
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
            <button className="grid size-7 place-items-center rounded-lg text-[#6a6b7b] hover:bg-[#faf8f6]" aria-label="Download"><Download className="size-3.5" /></button>
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
        {/* connection handles (decorative) */}
        <span className="absolute left-0 top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#c7c7d1]" />
        <span className="absolute right-0 top-1/2 z-10 size-3 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white bg-[#c7c7d1]" />

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

// 预置三个节点分别展示 idle / 生成中 / 已生成三种状态(演示用)
const DEMO_NODES: AudioNodeData[] = [
  { id: 1, x: 110, y: 90, text: "", voice: null, params: DEFAULT_PARAMS, status: "idle", duration: 0 },
  { id: 2, x: 430, y: 90, text: "Welcome to our summer sale — up to 50% off this weekend only.", voice: VOICES[0], params: DEFAULT_PARAMS, status: "loading", duration: 0 },
  { id: 3, x: 750, y: 90, text: "Meet the all-new Aurora smartwatch. Own your day and night.", voice: VOICES[1], params: DEFAULT_PARAMS, status: "done", duration: 5 },
];

export function CanvasScene() {
  const [nodes, setNodes] = useState<AudioNodeData[]>(DEMO_NODES);
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
    const x = menu ? menu.x : 200;
    const y = menu ? menu.y : 160;
    setNodes((prev) => [
      ...prev,
      { id, x, y, text: "", voice: null, params: DEFAULT_PARAMS, status: "idle", duration: 0 },
    ]);
    setSelectedId(id);
    setMenu(null);
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
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="max-w-md text-sm font-semibold text-[#6a6b7b]">
            Double-click the canvas to start generate, or start with below workflow templates.
          </p>
          <div className="pointer-events-auto flex flex-wrap justify-center gap-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                className="w-44 overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-left shadow-[0_10px_24px_rgba(26,26,46,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(26,26,46,0.14)]"
              >
                <div className="h-24 w-full" style={{ backgroundColor: t.color }} />
                <div className="px-3 py-2.5 text-xs font-bold text-[#1a1a2e]">{t.label}</div>
              </button>
            ))}
          </div>
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
