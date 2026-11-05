"use client";

/* 输入框左上的素材位：随模式变形。
   omni 一排参考素材(+ Kling 的 Element / Voice);frames「Start ⇄ End」;keyframes 首 · 中 · 尾一行;
   edit / extend 一个原片格。
   超限的素材红框 + 「Over limit」角标(只标不删)。 */

import { ArrowLeftRight, AudioLines, FileText, Info, Link2, Plus, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { VoiceModal, type CloneModel, type Voice } from "../../../../(v1.5)/audio-generation/shared";

/** 两个音色克隆模型：克隆出来的音色 ID 不通用，Kling 视频只能用 Kling 克隆的 */
const CLONE_MODELS: CloneModel[] = [
  { key: "kling", label: "Kling", hint: "For Kling video. 5–30s of clear speech." },
  { key: "seed-audio", label: "Seed Audio", hint: "For voiceovers in Audio Gen. Up to 30s." },
];
import { newId, type Asset, type AssetKind } from "../assets";
import { modelCaps } from "../capabilities";
import { modeAssets, toolSlot, type ComposerState, type Element, type ModeSlots, type WebSource } from "../state";
import { isToolMode, toolSpec, visibleInputs } from "../tools";
import { AssetPicker, AssetThumb } from "./AssetPicker";
import type { Placement } from "./Popover";

type Patch = <K extends keyof ModeSlots>(mode: K, value: Partial<ModeSlots[K]>) => void;

/** @ 引用名:按当前模式里的顺序给 Image1 / Video1 / Audio1 */
export function refLabels(s: ComposerState): Map<string, string> {
  const n = { image: 0, video: 0, audio: 0 } as Record<AssetKind, number>;
  const out = new Map<string, string>();
  for (const a of modeAssets(s)) out.set(a.id, `${a.kind[0].toUpperCase()}${a.kind.slice(1)}${++n[a.kind]}`);
  return out;
}

function Tile({
  asset,
  over,
  onRemove,
}: {
  asset: Asset;
  over?: boolean;
  onRemove: () => void;
}) {
  const dim = "size-[56px]";
  return (
    /* 缩略图上不叠时长角标(太挤);时长放在悬停提示里 */
    <div className="group relative flex shrink-0 flex-col items-center gap-1" title={asset.secs !== undefined ? `${asset.name} · ${asset.secs}s` : asset.name}>
      <div className={`relative ${dim} overflow-hidden rounded-xl bg-[#f4f3f6] ${over ? "ring-2 ring-[#e5484d] ring-offset-1" : "ring-1 ring-black/5"}`}>
        <AssetThumb asset={asset} />
        {asset.source === "generated" && (
          <span className="absolute left-1 top-1 rounded bg-[#1a1a2e]/80 px-1 text-[9px] font-semibold text-white">Generated</span>
        )}
        {/* 有问题的素材只标红框，不在格子上写字(56px 放不下，且原因不一定是超数量);原因写在输入框下方的红色提示里 */}
        <button
          type="button"
          aria-label={`Remove ${asset.name}`}
          onClick={onRemove}
          className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

function AddTile({
  accept,
  multiple,
  placement,
  onPick,
  caption,
  hint,
  icon,
}: {
  accept: AssetKind[];
  multiple?: boolean;
  placement: Placement;
  onPick: (a: Asset[]) => void;
  caption?: string;
  hint?: string;
  icon?: ReactNode;
}) {
  const dim = "size-[56px]";
  return (
    <AssetPicker
      accept={accept}
      multiple={multiple}
      placement={placement}
      onPick={onPick}
      trigger={(open, isOpen) => (
        <button
          type="button"
          onClick={open}
          aria-label={caption ? `Add ${caption.replace("\n", " ").toLowerCase()}` : "Add files"}
          title={hint}
          className={`flex ${dim} shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl transition ${
            isOpen ? "bg-[#fff1e8] text-[#ff5e1a]" : "bg-[#f3f4f6] text-[#9a9bb0] hover:bg-[#ececf1] hover:text-[#4a4b5c]"
          }`}
        >
          {icon ?? <Plus className={caption ? "size-4" : "size-5"} />}
          {caption && <span className="whitespace-pre-line px-0.5 text-center text-[10px] font-medium leading-[1.15]">{caption}</span>}
        </button>
      )}
    />
  );
}

/** Kling 主体：跟主素材格放在同一排(竖线隔开),不再单独一行 "Elements" */
function ElementTiles({ elements, placement, onChange, over, max }: { elements: Element[]; placement: Placement; onChange: (e: Element[]) => void; over: Set<string>; max?: number }) {
  return (
    <>
      <span aria-hidden className="mx-1 h-7 w-px self-center bg-[#ececf1]" />
      {elements.map((e) => (
        <Tile key={e.id} asset={e.front} over={over.has(e.id)} onRemove={() => onChange(elements.filter((x) => x.id !== e.id))} />
      ))}
      {(max === undefined || elements.length < max) && (
        <AddTile
          accept={["image"]}
          multiple
          placement={placement}
          caption="Element"
          hint="Pick a front view first, then up to 3 more angles"
          onPick={(imgs) => onChange([...elements, { id: newId("e"), front: imgs[0], angles: imgs.slice(1, 4) }])}
        />
      )}
    </>
  );
}

/** Wan 3.0 / Wan 3.0 Prime:Omni 里多一个「Web / Doc」格，贴公开网页链接或传一份文档(file_url / web_url),
    模型先读内容再生成(自动开 thinking)。只能一个来源;放了之后显示成链接 / 文档格，悬停 ✕ 移除。 */
/** 小浮层：点外面或按 Esc 关闭 */
function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [ref, open, close]);
}

/** 标题后的 ⓘ:点击显示一句说明，点外面关闭 */
function InfoDot({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useDismiss(box, open, () => setOpen(false));
  return (
    <span ref={box} className="relative inline-flex">
      <button type="button" aria-label="More info" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`grid size-4 place-items-center rounded-full transition ${open ? "text-[#ff5e1a]" : "text-[#b4b5c3] hover:text-[#6a6b7b]"}`}>
        <Info className="size-3.5" />
      </button>
      {open && (
        <span role="tooltip" className="absolute left-0 top-[calc(100%+6px)] z-50 w-[220px] rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-[11.5px] font-normal leading-snug text-white shadow-[0_8px_20px_rgba(26,26,46,0.2)]">
          {text}
        </span>
      )}
    </span>
  );
}

/** 「Make a video from a page or doc」表单(URL / Doc 格的小窗) */
function WebSourceForm({ onAdd }: { onAdd: (s: WebSource) => void }) {
  const [url, setUrl] = useState("");
  /* 网页和文档二选一:fal 实测 web_url 和 file_url 不能同时传(2026-11-05,校验报错 file_url and web_url cannot be used together) */
  const [kind, setKind] = useState<"url" | "doc">("url");
  const fileRef = useRef<HTMLInputElement>(null);
  const valid = /^https?:\/\/[^\s.]+\.[^\s]+$/.test(url.trim());
  return (
    <>
      <p className="flex items-center gap-1 text-[13px] font-semibold text-[#1a1a2e]">
        Make a video from a page or doc
        <InfoDot text="Wan reads it first, then writes the video. Add a web page or a document, not both." />
      </p>
      <div role="tablist" aria-label="Source type" className="mt-2.5 flex gap-1 rounded-lg bg-[#f4f4f6] p-0.5 text-[12px] font-medium">
        {([
          ["url", "Web page", Link2],
          ["doc", "Document", FileText],
        ] as const).map(([k, t, I]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition ${kind === k ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : "text-[#8d8e9d] hover:text-[#4a4b5c]"}`}
          >
            <I className="size-3.5" />
            {t}
          </button>
        ))}
      </div>
      {kind === "url" ? (
        <>
          <div className="mt-2.5 flex gap-1.5">
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && valid && onAdd({ kind: "url", value: url.trim() })}
              placeholder="https://yourstore.com/product"
              aria-label="Web page link"
              className="min-w-0 flex-1 rounded-lg border border-[#ececf1] px-2.5 py-1.5 text-[13px] outline-none placeholder:text-[#9a9bb0] focus:border-[#ff5e1a]"
            />
            <button type="button" disabled={!valid} onClick={() => onAdd({ kind: "url", value: url.trim() })} className="rounded-lg bg-[#1a1a2e] px-3 text-[12.5px] font-semibold text-white disabled:opacity-35">
              Add
            </button>
          </div>
          <p className="mt-1.5 text-[11.5px] text-[#a0a1aa]">Public pages only, no login.</p>
        </>
      ) : (
        <>
          {/* 点击弹出系统文件选择框;原型只记文件名 */}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAdd({ kind: "doc", value: f.name });
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2.5 flex w-full flex-col items-center gap-1 rounded-xl border border-[#dcdce4] px-3 py-4 text-[12.5px] text-[#4a4b5c] transition hover:border-[#ff5e1a]/50 hover:bg-[#fff7f1]"
          >
            <FileText className="size-5 text-[#9a9bb0]" />
            Upload a document
            <span className="text-[11.5px] text-[#a0a1aa]">PDF, Word or TXT</span>
          </button>
        </>
      )}
    </>
  );
}

/** 放好的网页 / 文档：蓝色格，悬停 ✕ 移除 */
function WebSourceChip({ source, onRemove }: { source: WebSource; onRemove: () => void }) {
  const label = source.kind === "url" ? source.value.replace(/^https?:\/\//, "").split("/")[0] : source.value;
  return (
    <div className="group relative shrink-0" title={source.value}>
      <div className="flex size-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-[#eef4ff] text-[#3b6fd8] ring-1 ring-black/5">
        {source.kind === "url" ? <Link2 className="size-5" /> : <FileText className="size-5" />}
        <span className="w-full truncate px-1 text-center text-[9.5px] font-semibold leading-tight">{label}</span>
      </div>
      <button type="button" aria-label="Remove web page or document" onClick={onRemove} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100">
        <X className="size-3" />
      </button>
    </div>
  );
}

/** 素材位里单独一个「URL / Doc」格(2026-11-05 评审比较过 5 种入口，定这个) */
function WebSourceTile({ source, placement, onChange }: { source?: WebSource; placement: Placement; onChange: (s?: WebSource) => void }) {
  const [open, setOpen] = useState(false);
  /* 点外面 / Esc 关掉「Make a video from a page or doc」小窗 */
  const box = useRef<HTMLDivElement>(null);
  useDismiss(box, open, () => setOpen(false));
  return (
    <>
      <span aria-hidden className="mx-1 h-7 w-px self-center bg-[#ececf1]" />
      {source ? (
        <WebSourceChip source={source} onRemove={() => onChange(undefined)} />
      ) : (
        <div ref={box} className="relative">
          <button
            type="button"
            aria-label="Add a web page or document"
            title="Paste a public web page link or upload a document"
            onClick={() => setOpen((o) => !o)}
            className={`flex size-[56px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl transition ${open ? "bg-[#fff1e8] text-[#ff5e1a]" : "bg-[#f3f4f6] text-[#9a9bb0] hover:bg-[#ececf1] hover:text-[#4a4b5c]"}`}
          >
            <Plus className="size-4" />
            <span className="whitespace-pre-line text-center text-[10px] font-medium leading-[1.15]">{"URL /\nDoc"}</span>
          </button>
          {open && (
            <div role="dialog" aria-label="Add a web page or document" className={`absolute left-0 z-40 w-[320px] rounded-2xl border border-[#ececf1] bg-white p-3 shadow-[0_16px_40px_rgba(26,26,46,0.16)] ${placement === "up" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"}`}>
              <WebSourceForm onAdd={(src) => (onChange(src), setOpen(false))} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** Kling 音色：和素材格 / 主体格同一排(竖线隔开),因为提示词里要用 @Voice1 引用。
    每个音色一个 56×56 格(橙色声波 + 名字),悬停 ✕ 移除;最后一个「Voice」格打开产品现有的「Select or add a voice」弹窗
    (Preset Voice / My Voice / Clone voice)。最多 3 个(Kling 4.0),满了「Voice」格消失。 */
function VoiceTiles({ voices, max, onChange }: { voices: string[]; max: number; onChange: (v: string[]) => void }) {
  const [library, setLibrary] = useState(false);
  const add = (v: Voice) => {
    if (!voices.includes(v.name) && voices.length < max) onChange([...voices, v.name]);
  };
  return (
    <>
      <span aria-hidden className="mx-1 h-7 w-px self-center bg-[#ececf1]" />
      {voices.map((v, i) => (
        <div key={`${v}-${i}`} className="group relative shrink-0" title={`@Voice${i + 1} · ${v}`}>
          <div className="flex size-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-[#fff3ec] text-[#ff8a3c] ring-1 ring-black/5">
            <AudioLines className="size-5" />
            <span className="w-full truncate px-1 text-center text-[10px] font-semibold leading-tight text-[#b4532a]">{v}</span>
          </div>
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(voices.filter((_, j) => j !== i))}
            className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      {voices.length < max && (
        <button
          type="button"
          aria-label="Add voice"
          title={`Add a voice (up to ${max})`}
          onClick={() => setLibrary(true)}
          className={`flex size-[56px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl transition ${library ? "bg-[#fff1e8] text-[#ff5e1a]" : "bg-[#f3f4f6] text-[#9a9bb0] hover:bg-[#ececf1] hover:text-[#4a4b5c]"}`}
        >
          <Plus className="size-4" />
          <span className="text-[10px] font-medium leading-[1.15]">Voice</span>
        </button>
      )}
      {/* 挂到 body:否则会被输入框所在层级困住，左边被侧栏盖住 */}
      {library && createPortal(<VoiceModal value={null} filters cloneModels={CLONE_MODELS} voiceModel="kling" isSelected={(v) => voices.includes(v.name)} onChange={add} onClose={() => setLibrary(false)} />, document.body)}
    </>
  );
}

export function ModeSlotsView({
  state,
  onPatch,
  overIds,
  placement,
  part,
}: {
  state: ComposerState;
  onPatch: Patch;
  overIds: string[];
  placement: Placement;
  /** 预留：素材校验提示 */
  notify?: (t: string) => void;
  /** main = 提示词上方的主素材格(含 Kling 主体);extras = 提示词下方的附加行(如 Soundtrack) */
  part: "main" | "extras";
}) {
  const caps = modelCaps(state.model);
  const over = new Set(overIds);
  const pick = (main: ReactNode, extras: ReactNode) => (part === "main" ? main : extras);
  const s = state.slots;

  if (state.mode === "omni" && caps.omni) {
    const L = caps.omni;
    const accept: AssetKind[] = ["image", ...(L.videos > 0 ? (["video"] as const) : []), ...(L.audios > 0 ? (["audio"] as const) : [])];
    return pick(
      <div className="flex flex-wrap items-start gap-2">
        <AddTile accept={accept} multiple placement={placement} caption="Reference" hint={L.videos > 0 ? (L.audios > 0 ? "Images, videos or audio as references" : "Images or videos as references") : "Images as references"} onPick={(add) => onPatch("omni", { refs: [...s.omni.refs, ...add] })} />
        {s.omni.refs.map((a) => (
          <Tile key={a.id} asset={a} over={over.has(a.id)} onRemove={() => onPatch("omni", { refs: s.omni.refs.filter((x) => x.id !== a.id) })} />
        ))}
        {(L.elements !== undefined || s.omni.elements.length > 0) && <ElementTiles elements={s.omni.elements} placement={placement} onChange={(e) => onPatch("omni", { elements: e })} over={over} />}
        {(L.webSource || s.omni.source) && <WebSourceTile source={s.omni.source} placement={placement} onChange={(src) => onPatch("omni", { source: src })} />}
        {(L.voices !== undefined || s.omni.voices.length > 0) && <VoiceTiles voices={s.omni.voices} max={L.voices ?? 0} onChange={(v) => onPatch("omni", { voices: v })} />}
      </div>,
      /* 不显示「Images 1/10 · Videos 0/5 …」计数行：超限时由标红 + 提示说明 */
      null,
    );
  }

  if (state.mode === "frames") {
    const f = s.frames;
    const startOptional = caps.frames?.startRequired === false;
    const frameTile = (which: "start" | "end") => {
      const a = f[which];
      const cap = which === "start" ? "Start frame" : "End frame";
      return a ? (
        <Tile asset={a} over={over.has(a.id)} onRemove={() => onPatch("frames", { [which]: undefined })} />
      ) : (
        <AddTile accept={["image"]} placement={placement} caption={which === "start" ? "Start\nframe" : "End\nframe"} hint={which === "start" && !startOptional ? cap : `${cap} (optional)`} onPick={([x]) => onPatch("frames", { [which]: x })} />
      );
    };
    const fx = caps.frames?.soundtrack || f.soundtrack;
    return pick(
        <div className="flex items-start gap-1.5">
          {frameTile("start")}
          {/* 只有首帧的模型(Grok 1.5)不显示交换按钮和尾帧格;之前放的尾帧仍显示，由校验提示移除 */}
          {(!caps.frames?.noEnd || f.end) && (
            <>
              <button
                type="button"
                aria-label="Swap start and end frames"
                disabled={!f.start && !f.end}
                onClick={() => onPatch("frames", { start: f.end, end: f.start })}
                className="mt-[14px] grid size-7 place-items-center rounded-full text-[#9a9bb0] transition hover:bg-[#f4f3f6] hover:text-[#1a1a2e] disabled:opacity-40"
              >
                <ArrowLeftRight className="size-4" />
              </button>
              {frameTile("end")}
            </>
          )}
          {(caps.frames?.elements || f.elements.length > 0) && <ElementTiles elements={f.elements} placement={placement} onChange={(e) => onPatch("frames", { elements: e })} over={over} />}
          {/* MiniMax 的配乐(target_audio_url):和首尾帧同一排，竖线隔开 */}
          {fx && (
            <>
              <span aria-hidden className="mx-1 h-7 w-px self-center bg-[#ececf1]" />
              {f.soundtrack ? (
                <Tile asset={f.soundtrack} over={over.has(f.soundtrack.id)} onRemove={() => onPatch("frames", { soundtrack: undefined })} />
              ) : (
                <AddTile accept={["audio"]} placement={placement} caption={"Sound-\ntrack"} hint="Optional. Becomes the video's audio track as is" onPick={([a]) => onPatch("frames", { soundtrack: a })} />
              )}
            </>
          )}
        </div>,
      null,
    );
  }

  if (state.mode === "keyframes" && caps.keyframes) {
    const k = s.keyframes;
    const K = caps.keyframes;
    const end = (which: "start" | "end") => {
      const a = k[which];
      const cap = which === "start" ? "Start" : "End";
      return a ? (
        <Tile asset={a} onRemove={() => onPatch("keyframes", { [which]: undefined })} />
      ) : (
        <AddTile accept={["image"]} placement={placement} caption={cap} onPick={([x]) => onPatch("keyframes", { [which]: x })} />
      );
    };
    return pick(
        <div className="flex flex-wrap items-start gap-2">
          {end("start")}
          <span className="mt-[27px] h-px w-3 bg-[#dcdbe3]" aria-hidden />
          {k.middle.map((a) => (
            <Tile key={a.id} asset={a} over={over.has(a.id)} onRemove={() => onPatch("keyframes", { middle: k.middle.filter((x) => x.id !== a.id) })} />
          ))}
          {k.middle.length < K.maxMiddle && (
            <AddTile
              accept={["image"]}
              multiple={K.maxMiddle > 1}
              placement={placement}
              caption="Middle"
              hint={K.maxMiddle > 1 ? `Add keyframes (${k.middle.length}/${K.maxMiddle})` : "Add the middle frame"}
              onPick={(add) => onPatch("keyframes", { middle: [...k.middle, ...add], middleTime: k.middleTime ?? state.secs / 2 })}
            />
          )}
          <span className="mt-[27px] h-px w-3 bg-[#dcdbe3]" aria-hidden />
          {end("end")}
          {/* 参考图(Kling 4.0):和首中尾帧同一排，竖线隔开，不再单独一行 */}
          {/* 不支持参考图的模型：已放的仍显示(标红)方便移除，但不给新增 */}
          {(K.references !== undefined || k.refs.length > 0) && (
            <>
              <span aria-hidden className="mx-1 h-7 w-px self-center bg-[#ececf1]" />
              {k.refs.map((a) => (
                <Tile key={a.id} asset={a} over={over.has(a.id)} onRemove={() => onPatch("keyframes", { refs: k.refs.filter((x) => x.id !== a.id) })} />
              ))}
              {K.references !== undefined && (
                <AddTile accept={["image"]} multiple placement={placement} caption="Reference" hint="Optional reference images" onPick={(add) => onPatch("keyframes", { refs: [...k.refs, ...add] })} />
              )}
            </>
          )}
          {K.timed && k.middle.length > 0 && (
            <label className="mt-[14px] inline-flex items-center gap-1.5 rounded-lg bg-[#f4f3f6] px-2 py-1 text-[12px] text-[#6a6b7b]">
              Middle at
              <input
                type="number"
                min={0}
                max={state.secs}
                step={0.5}
                value={k.middleTime ?? ""}
                onChange={(e) => onPatch("keyframes", { middleTime: e.target.value === "" ? undefined : Number(e.target.value) })}
                className="w-12 rounded-md border border-[#ececf1] bg-white px-1.5 py-0.5 text-right tabular-nums text-[#1a1a2e] outline-none focus:border-[#ff5e1a]"
                aria-label="Middle frame time in seconds"
              />
              s
            </label>
          )}
        </div>,
        null,
    );
  }

  if ((state.mode === "edit" || state.mode === "extend") && (caps.edit || caps.extend)) {
    const isEdit = state.mode === "edit";
    const src = isEdit ? s.edit.source : s.extend.source;
    const max = isEdit ? caps.edit!.sourceMax : caps.extend!.sourceMax;
    return pick(
        <div className="flex flex-wrap items-start gap-3">
          {src ? (
            <Tile asset={src} over={over.has(src.id)} onRemove={() => onPatch(isEdit ? "edit" : "extend", { source: undefined })} />
          ) : (
            <AddTile
              accept={["video"]}
              placement={placement}
              caption={isEdit ? "Edit\nvideo" : "Extend\nvideo"}
              hint={`Video up to ${max}s`}
              onPick={([v]) => onPatch(isEdit ? "edit" : "extend", { source: v })}
            />
          )}
          {/* 编辑：参考内容和原片同一排(照即梦) */}
          {isEdit && (caps.edit?.references || s.edit.refs.length > 0) && (
            <>
              {s.edit.refs.map((a) => (
                <Tile key={a.id} asset={a} over={over.has(a.id)} onRemove={() => onPatch("edit", { refs: s.edit.refs.filter((x) => x.id !== a.id) })} />
              ))}
              {caps.edit?.references && (
                <AddTile accept={["image"]} multiple placement={placement} caption="Reference" hint="Optional reference images" onPick={(add) => onPatch("edit", { refs: [...s.edit.refs, ...add] })} />
              )}
            </>
          )}
        </div>,
        null,
    );
  }


  /* 额外能力模式(tools.ts):按配置画素材格，多个输入之间用短竖线隔开;选项在 Model Settings 里 */
  const spec = toolSpec(state.model, state.mode);
  if (spec && isToolMode(state.mode)) {
    const m = state.mode;
    const t = toolSlot(state, m);
    const setFiles = (id: string, list: Asset[]) => onPatch("tools", { [m]: { ...t, files: { ...t.files, [id]: list } } });
    const inputs = visibleInputs(spec, t.opts);
    return pick(
      <div className="flex flex-wrap items-start gap-2">
        {inputs.map((inp, idx) => {
          const list = t.files[inp.id] ?? [];
          return (
            <Fragment key={inp.id}>
              {idx > 0 && <span aria-hidden className="mx-1 h-7 w-px self-center bg-[#ececf1]" />}
              {list.map((a) => (
                <Tile key={a.id} asset={a} over={over.has(a.id)} onRemove={() => setFiles(inp.id, list.filter((x) => x.id !== a.id))} />
              ))}
              {list.length < inp.max && (
                <AddTile
                  accept={[inp.kind]}
                  multiple={inp.max - list.length > 1}
                  placement={placement}
                  caption={inp.caption}
                  hint={inp.hint}
                  onPick={(add) => setFiles(inp.id, [...list, ...add].slice(0, inp.max))}
                />
              )}
            </Fragment>
          );
        })}
      </div>,
      null,
    );
  }

  return null;
}
