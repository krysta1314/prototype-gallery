"use client";

/* 画布节点上的模型工具浮层(Lip Sync / Character Swap / Motion Control / 3D to Video / Talking Avatar)。
   样子照图片节点的 Upscale 浮层(332 宽、白卡、底部积分块 + 圆形箭头按钮);内容和工具页左栏同一套配置：
   模型(多个时下拉)→ 素材位 → 选项 → 提示词。当前节点已经填在它的素材位里(不加标签，2026-11-06 Monica 去掉「This node」;不能移除);
   其余素材位可以「Upload」本地文件，或直接点画布上已有的同类节点。
   2026-11-06 Monica 定：模型带提示词的(Talking Avatar 的 Kling、Character Swap、Motion Control、3D to Video、Lip Sync 的 Type a script)
   改成画布输入框的样子：上面一排素材块(+ 加素材)、中间大提示词框、底栏「模型 · 参数」按钮(点开选模型和参数)+ 积分 + 生成;
   同一个工具里只要有一个模型带提示词就整体用这个样子(换到 MiniMax 这类没提示词的模型时只是不显示提示词框，版式不跳);
   目前 5 个工具都属于这种，表单样子留给以后完全没有提示词的工具。 */

import { useEffect, useRef, useState } from "react";
import { ArrowUp, AudioLines, Check, ChevronDown, Film, ImageIcon, Plus, Upload, X } from "lucide-react";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { FieldLabel, Segmented } from "../components/ToolKit";
import { formatCredits } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { ModelLogo, Stepper, SwitchRow, VoicePicker, switchOn } from "./ModelTool";
import { modelToolSpec, type MediaKind, type SpecInput, type SpecOption } from "./specs";
import { blockerInfo, cost as costOf, optValue, promptRequired, promptVisible, secsProblem, switchModel, variantOf, visibleInputs, visibleOptions, type Media, type ToolState } from "./logic";
import { CANVAS_TOOL_LABEL, canvasPicks, keepNode, seedState } from "./canvasTools";

const KIND_ICON = { image: ImageIcon, video: Film, audio: AudioLines } as const;
const ACCEPT: Record<MediaKind, string> = { image: ".jpg,.jpeg,.png,.webp", video: ".mp4,.mov,.webm,.m4v", audio: ".mp3,.wav,.m4a,.aac,.ogg" };
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/45";

function readSecs(url: string, kind: MediaKind): Promise<number | undefined> {
  if (kind === "image") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? el.duration : undefined);
    el.onerror = () => resolve(undefined);
    el.src = url;
  });
}

/** 点在 ref 外面(或按 Esc)时关掉小菜单 */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      /* 音色弹窗挂在 body 上，点它不算点外面 */
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest?.("[data-voice-modal]")) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/** 浮层里的小素材块(56px) */
function Thumb({ m, tag, onRemove }: { m: Media; tag?: string; onRemove?: () => void }) {
  const Icon = KIND_ICON[m.kind];
  return (
    <div className="group relative size-14 shrink-0 rounded-lg bg-[#f3f4f6] ring-1 ring-black/5" title={m.name}>
      <div className="size-full overflow-hidden rounded-lg">
        {m.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt={m.name} className="size-full object-cover" />
        ) : m.kind === "video" ? (
          <video src={`${m.url}#t=0.5`} muted playsInline preload="metadata" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center bg-[#fff3ec] text-[#ff5e1a]">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      {tag && <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-[#1a1a2e]/70 py-[1px] text-center text-[9.5px] font-semibold text-white">{tag}</span>}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${m.name}`}
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-[#1a1a2e]/75 text-white ring-[1.5px] ring-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export function CanvasToolPopover({
  tool,
  node,
  canvasMedia,
  style,
  onClose,
  onConfirm,
}: {
  /** specs.ts 的工具 key */
  tool: string;
  /** 打开浮层的那个节点 */
  node: Media;
  /** 画布上所有可用的素材(「From canvas」里挑) */
  canvasMedia: Media[];
  style: React.CSSProperties;
  onClose: () => void;
  onConfirm: (state: ToolState, credits: number | null) => void;
}) {
  const spec = modelToolSpec(tool);
  const [s, setS] = useState<ToolState>(() => seedState(tool, node));
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickFor, setPickFor] = useState<SpecInput | null>(null);
  const v = variantOf(spec, s.model);
  const block = blockerInfo(v, s);
  const credits = costOf(spec, v, s);
  const setOpt = (id: string, x: string) => setS((p) => ({ ...p, opts: { ...p.opts, [id]: x } }));
  const add = (inp: SpecInput, m: Media) => {
    const p = secsProblem(inp, m);
    if (p) return setErr(p);
    setErr(null);
    setS((x) => ({ ...x, files: { ...x.files, [inp.id]: [...(x.files[inp.id] ?? []), m].slice(-inp.max) } }));
  };
  const remove = (inp: SpecInput, id: string) => setS((x) => ({ ...x, files: { ...x.files, [inp.id]: (x.files[inp.id] ?? []).filter((m) => m.id !== id) } }));

  const renderInput = (inp: SpecInput) => {
    const list = s.files[inp.id] ?? [];
    const full = list.length >= inp.max;
    const used = Object.values(s.files).flat().map((m) => m.id);
    const picks = canvasPicks(canvasMedia, inp.kind, used);
    return (
      <div key={inp.id}>
        <FieldLabel info={inp.hint} hint={inp.min === 0 ? "Optional" : inp.max > 1 ? `${list.length}/${inp.max}` : undefined}>
          {inp.label}
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {list.map((m) => (m.id === node.id ? <Thumb key={m.id} m={m} /> : <Thumb key={m.id} m={m} onRemove={() => remove(inp, m.id)} />))}
          {!full && (
            <button
              type="button"
              onClick={() => {
                setPickFor(inp);
                fileRef.current?.setAttribute("accept", ACCEPT[inp.kind]);
                fileRef.current?.click();
              }}
              className={`grid size-14 shrink-0 place-items-center rounded-lg border border-[#e4e3ea] bg-white text-[#6a6b7b] transition hover:border-[#ffbd99] hover:text-[#ff5e1a] ${FOCUS}`}
              aria-label={`Upload ${inp.label.toLowerCase()}`}
              title="Upload"
            >
              <span className="flex flex-col items-center gap-0.5 text-[10px] font-semibold">
                <Plus className="size-4" />
                Upload
              </span>
            </button>
          )}
        </div>
        {!full && picks.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-[11px] font-semibold text-[#6a6b7b]">From canvas</p>
            <div className="flex flex-wrap gap-1.5">
              {picks.map((m) => (
                <button key={m.id} type="button" onClick={() => add(inp, m)} aria-label={`Use ${m.name} from canvas`} className={`rounded-lg transition hover:ring-2 hover:ring-[#ff5e1a]/50 ${FOCUS}`}>
                  <Thumb m={m} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOption = (o: SpecOption) => {
    const val = optValue(v, s, o.id);
    if (o.control === "voice") return <VoicePicker key={o.id} o={o} value={val} onChange={(x) => setOpt(o.id, x)} />;
    if (o.control === "stepper") return <Stepper key={o.id} o={o} value={val} onChange={(x) => setOpt(o.id, x)} />;
    const on = switchOn(o);
    if (on) return <SwitchRow key={o.id} o={o} on={val === on} onChange={(x) => setOpt(o.id, x ? on : o.values.find((y) => y !== on)!)} />;
    return (
      <div key={o.id}>
        <FieldLabel info={o.hint}>{o.ask ?? o.label}</FieldLabel>
        {o.values.length <= 3 ? (
          <Segmented label={o.ask ?? o.label} value={val} options={o.values.map((x) => ({ value: x, label: x }))} onChange={(x: string) => setOpt(o.id, x)} />
        ) : (
          <div role="radiogroup" aria-label={o.label} className="grid gap-1 rounded-xl bg-[#f4f4f6] p-1" style={{ gridTemplateColumns: `repeat(${Math.min(o.values.length, 4)}, minmax(0, 1fr))` }}>
            {o.values.map((x) => (
              <button
                key={x}
                type="button"
                role="radio"
                aria-checked={x === val}
                onClick={() => setOpt(o.id, x)}
                className={`rounded-lg px-1 py-1.5 text-[12px] font-medium transition ${FOCUS} ${x === val ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : "text-[#8d8e9d] hover:text-[#4a4b5c]"}`}
              >
                {x}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const options = visibleOptions(v, s);
  const inputs = visibleInputs(v, s);
  const title = CANVAS_TOOL_LABEL[tool] ?? spec.title;
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        const inp = pickFor;
        if (!f || !inp) return;
        const url = URL.createObjectURL(f);
        void readSecs(url, inp.kind).then((secs) => add(inp, { id: `up-${Date.now().toString(36)}`, name: f.name, kind: inp.kind, url, secs }));
      }}
    />
  );
  const submit = (
    <>
      <span
        className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]"
        aria-label={credits === null ? "Estimated credits: unknown" : `Estimated credits: ${credits}`}
      >
        <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
        {credits === null ? `${formatCredits(v.credits.perSecond)}/s` : formatCredits(credits)}
      </span>
      <span title={block?.message}>
        <button
          type="button"
          aria-label={block ? `Generate. ${block.message}` : "Generate"}
          onClick={() => onConfirm(s, credits)}
          disabled={!!block}
          className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-white shadow-[0_2px_0_#b65a42] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
        >
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </button>
      </span>
    </>
  );

  /* ---------- 带提示词：画布输入框样子 ---------- */
  if (v.prompt.mode !== "none" || spec.models.some((m) => m.prompt.mode !== "none")) {
    const asks = options.filter((o) => o.ask);
    const settings = options.filter((o) => !o.ask);
    const used = Object.values(s.files).flat().map((m) => m.id);
    /* 底栏按钮上的摘要：模型 + 主要参数;开关类只在打开时写它的名字(写「Off」看不懂) */
    const summary = [
      v.label,
      ...settings
        .filter((o) => o.control !== "stepper")
        .map((o) => {
          const val = optValue(v, s, o.id);
          const on = switchOn(o);
          if (on) return val === on ? o.label : null;
          /* 有人话说法的用人话(如「2 AI looks」),光写「2」看不懂 */
          const said = o.say?.[o.values.indexOf(val)];
          return said ?? val;
        })
        .filter(Boolean),
    ].join(" · ");
    return (
      <div
        role="dialog"
        aria-label={title}
        data-upscale-pop
        data-nodrag
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute z-40 flex w-[520px] cursor-default flex-col gap-3 rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_14px_40px_rgba(26,26,46,0.14)]"
        style={{ ...style, maxHeight: undefined }}
      >
        {fileInput}
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold text-[#1a1a2e]">{title}</h2>
          {asks.map((o) => (
            <div key={o.id} role="radiogroup" aria-label={o.ask} className="ml-1 inline-flex rounded-[10px] bg-[#f4f4f6] p-0.5">
              {o.values.map((x) => (
                <button
                  key={x}
                  type="button"
                  role="radio"
                  aria-checked={optValue(v, s, o.id) === x}
                  onClick={() => setOpt(o.id, x)}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold transition ${FOCUS} ${optValue(v, s, o.id) === x ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.08)]" : "text-[#8d8e9d] hover:text-[#4a4b5c]"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          ))}
          <button type="button" aria-label="Close" onClick={onClose} className="ml-auto grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]">
            <X className="size-4" />
          </button>
        </div>
        {/* 素材块一排：已放的素材 + 每个还能加的素材位一个「+」块(块下写素材位名) */}
        <div className="flex flex-wrap items-start gap-2">
          {inputs.map((inp) => {
            const list = s.files[inp.id] ?? [];
            return (
              <div key={inp.id} className="flex gap-2">
                {list.map((m) => (m.id === node.id ? <Thumb key={m.id} m={m} /> : <Thumb key={m.id} m={m} onRemove={() => remove(inp, m.id)} />))}
                {list.length < inp.max && (
                  <AddTile
                    inp={inp}
                    picks={canvasPicks(canvasMedia, inp.kind, used)}
                    onUpload={() => {
                      setPickFor(inp);
                      fileRef.current?.setAttribute("accept", ACCEPT[inp.kind]);
                      fileRef.current?.click();
                    }}
                    onPick={(m) => add(inp, m)}
                  />
                )}
              </div>
            );
          })}
        </div>
        {promptVisible(v, s) && (
          <textarea
            value={s.prompt}
            onChange={(e) => setS((x) => ({ ...x, prompt: e.target.value }))}
            aria-label={v.prompt.label ?? "Prompt"}
            rows={4}
            placeholder={promptRequired(v, s) ? v.prompt.placeholder : `${v.prompt.placeholder.replace(/^Optional: (.)/, (_, c: string) => c.toUpperCase())} (optional)`}
            className="w-full resize-none bg-transparent px-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#a5a6b6]"
          />
        )}
        {(err || (block && !block.missing)) && (
          <p role="alert" className="rounded-lg bg-[#fff4f2] px-2.5 py-1.5 text-[12.5px] leading-snug text-[#c2410c]">
            {err ?? block?.message}
          </p>
        )}
        <div className="flex items-center gap-2">
          <SettingsMenu
            summary={summary}
            modelKey={s.model}
            models={spec.models.length > 1 ? spec.models.map((m) => ({ key: m.key, label: m.label, blurb: m.blurb })) : null}
            onModel={(k) => setS((x) => keepNode(spec, switchModel(spec, x, k), node))}
          >
            {settings.map(renderOption)}
          </SettingsMenu>
          <div className="ml-auto flex items-center gap-2">{submit}</div>
        </div>
      </div>
    );
  }
  return (
    <div
      role="dialog"
      aria-label={title}
      data-upscale-pop
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-40 flex w-[332px] cursor-default flex-col overflow-hidden rounded-[20px] border border-[#ececf1] bg-white shadow-[0_16px_36px_rgba(26,26,46,0.2)]"
      style={style}
    >
      {fileInput}
      <div className="flex items-center gap-2 px-4 pb-2 pt-3.5">
        <h2 className="text-[14px] font-bold text-[#1a1a2e]">{title}</h2>
        {/* 只有一个模型时标题旁写模型(同工具页);多个模型时下面有下拉 */}
        {spec.models.length === 1 && (
          <span className="rounded-full bg-[#fff3ec] px-2 py-[2px] text-[11px] font-bold text-[#ff5e1a]" title="Model">
            {v.badge ?? v.label}
          </span>
        )}
        <button type="button" aria-label="Close" onClick={onClose} className="ml-auto grid size-7 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 pb-3 thin-scroll">
        {spec.models.length > 1 && (
          <div>
            <FieldLabel>Model</FieldLabel>
            <DropdownSelect
              size="sm"
              label="Model"
              value={s.model}
              onChange={(k) => setS((x) => keepNode(spec, switchModel(spec, x, k), node))}
              icon={(k) => <ModelLogo modelKey={k} />}
              options={spec.models.map((m) => ({ value: m.key, label: m.label, hint: m.blurb }))}
            />
          </div>
        )}
        {/* 顺序同工具页：常驻素材 → 问题标签 → 它带出来的素材 / 选项 → 其余选项 → 提示词 */}
        {inputs.filter((i) => !i.showIf).map(renderInput)}
        {options.filter((o) => o.ask).map(renderOption)}
        {inputs.filter((i) => i.showIf).map(renderInput)}
        {options.filter((o) => !o.ask && o.showIf).map(renderOption)}
        {options.filter((o) => !o.ask && !o.showIf).map(renderOption)}
        {promptVisible(v, s) && (
          <div>
            <FieldLabel hint={promptRequired(v, s) ? undefined : "Optional"}>{v.prompt.label ?? "Prompt"}</FieldLabel>
            <textarea
              value={s.prompt}
              onChange={(e) => setS((x) => ({ ...x, prompt: e.target.value }))}
              placeholder={v.prompt.placeholder}
              aria-label={v.prompt.label ?? "Prompt"}
              rows={3}
              className="w-full resize-none rounded-xl border border-[#ececf1] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none placeholder:text-[#74758a] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15"
            />
          </div>
        )}
        {(err || (block && !block.missing)) && (
          <p role="alert" className="text-[12px] font-medium text-[#c2410c]">
            {err ?? block?.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-[#f1f1f4] px-4 py-3">{submit}</div>
    </div>
  );
}

/** 输入框里「+」加素材块：点开小菜单 = 从电脑上传 / 画布上已有的同类节点 */
function AddTile({ inp, picks, onUpload, onPick }: { inp: SpecInput; picks: Media[]; onUpload: () => void; onPick: (m: Media) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Add ${inp.label.toLowerCase()}`}
        onClick={() => (picks.length ? setOpen((o) => !o) : onUpload())}
        className={`flex size-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#f1f2f5] text-[#8d8e9d] transition hover:bg-[#e9eaee] hover:text-[#4a4b5c] ${FOCUS}`}
      >
        <Plus className="size-3.5 shrink-0" />
        {/* 名字长的素材位(如 Look References)换行显示，不截断 */}
        <span className="line-clamp-2 max-w-[54px] text-center text-[9px] font-semibold leading-[1.15] tracking-tight">{inp.label.replace(/ (Audio|Image|Video)$/, "")}</span>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-1.5 w-[220px] rounded-xl border border-[#ececf1] bg-white p-1.5 shadow-[0_12px_30px_rgba(26,26,46,0.15)]">
          <button type="button" role="menuitem" onClick={() => (setOpen(false), onUpload())} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-[#1a1a2e] hover:bg-[#f6f6f8]">
            <Upload className="size-3.5 text-[#6a6b7b]" />
            Upload from device
          </button>
          <p className="mt-1 px-2 pb-1 text-[11px] font-semibold text-[#8d8e9d]">From canvas</p>
          <div className="flex flex-wrap gap-1.5 px-2 pb-1">
            {picks.map((m) => (
              <button key={m.id} type="button" role="menuitem" onClick={() => (setOpen(false), onPick(m))} aria-label={`Use ${m.name} from canvas`} className={`rounded-lg transition hover:ring-2 hover:ring-[#ff5e1a]/50 ${FOCUS}`}>
                <Thumb m={m} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 底栏「模型 · 参数」按钮：点开往下出面板，上面选模型(多个时)、下面是参数 */
function SettingsMenu({
  summary,
  modelKey,
  models,
  onModel,
  children,
}: {
  summary: string;
  modelKey: string;
  models: { key: string; label: string; blurb?: string }[] | null;
  onModel: (k: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const hasSettings = Array.isArray(children) ? children.length > 0 : !!children;
  if (!models && !hasSettings)
    return (
      <span className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-[10px] border border-[#ececf1] px-3 text-[13px] font-semibold text-[#1a1a2e]">
        <ModelLogo modelKey={modelKey} />
        <span className="truncate">{summary}</span>
      </span>
    );
  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 max-w-[300px] items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-semibold transition ${FOCUS} ${open ? "border-[#ffcfb3] bg-[#fff7f1] text-[#1a1a2e]" : "border-[#ececf1] bg-white text-[#1a1a2e] hover:border-[#d4d3df]"}`}
      >
        <ModelLogo modelKey={modelKey} />
        <span className="truncate">{summary}</span>
        <ChevronDown className={`size-3.5 shrink-0 text-[#8d8e9d] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="dialog" aria-label="Model and settings" className="absolute left-0 top-full z-50 mt-1.5 w-[340px] space-y-4 rounded-2xl border border-[#ececf1] bg-white p-3.5 shadow-[0_16px_36px_rgba(26,26,46,0.18)]">
          {models && (
            <div>
              <FieldLabel>Model</FieldLabel>
              <div role="radiogroup" aria-label="Model" className="space-y-1">
                {models.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    role="radio"
                    aria-checked={m.key === modelKey}
                    onClick={() => onModel(m.key)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${FOCUS} ${m.key === modelKey ? "bg-[#fff7f1]" : "hover:bg-[#f6f6f8]"}`}
                  >
                    <span className="mt-0.5">
                      <ModelLogo modelKey={m.key} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-[#1a1a2e]">{m.label}</span>
                      {m.blurb && <span className="block text-[11.5px] leading-snug text-[#6a6b7b]">{m.blurb}</span>}
                    </span>
                    {m.key === modelKey && <Check className="mt-0.5 size-4 shrink-0 text-[#ff5e1a]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
