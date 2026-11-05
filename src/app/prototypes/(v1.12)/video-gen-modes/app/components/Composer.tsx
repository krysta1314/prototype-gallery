"use client";

/* 视频生成输入框:Video Gen(首页)和画布视频节点共用。
   结构：素材位(随模式变)→ 提示词 / 分镜列表 → 校验提示 → 底栏 [leading][模型][模式][比例·分辨率][时长][Multi-shot] … [积分][Create]。
   换模型时当前模式不支持 → 回退到该模型默认模式 + 顶部 toast(素材留着)。 */

import { ArrowUp, Clapperboard, Info, TriangleAlert } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { MODE_LABEL, modelCaps, type ModeKey, type ModelKey } from "../capabilities";
import { dependsOnVideo, estimateCredits } from "../credits";
import { isToolMode, promptRequiredFor, toolSpec } from "../tools";
import { selectMode, selectModel, shotsActive, toolSlot, type ComposerState, type ModeSlots } from "../state";
import { validate } from "../validate";
import { CountMenu, ModeTabs, ModelSettingsMenu } from "./BarMenus";
import type { Placement } from "./Popover";
import { ShotList, firstShots } from "./ShotList";
import { ModeSlotsView, refLabels } from "./Slots";

/** 提示词占位文案：按「模型 × 模式」写，只提这个模型真的能用的素材(没有音频参考的模型不提 @Audio1 等) */
function placeholderFor(s: ComposerState): string {
  const caps = modelCaps(s.model);
  switch (s.mode) {
    case "omni": {
      const L = caps.omni!;
      if (L.elements !== undefined)
        return "Use @ to reference uploads and elements, such as @Element1 holds the product in @Image1, mimicking @Video1's motion, speaking in @Voice1.";
      const audio = L.audios > 0 ? ", with @Audio1 as background music" : "";
      return `Use @ to reference uploads, such as place the product in @Image1 into the scene of @Image2, mimicking @Video1's motion${audio}.`;
    }
    case "frames":
      if (caps.frames?.elements) return "Describe how the start frame turns into the end frame. Use @ to bring in your elements, such as @Element1 walks in.";
      if (caps.frames?.soundtrack) return "Describe how the start frame turns into the end frame. Add a soundtrack to set the audio.";
      return "Describe how the start frame turns into the end frame";
    case "keyframes":
      return caps.keyframes?.timed ? "Describe how the video moves from the start, through the middle frame, to the end" : "Describe how the video moves through each keyframe";
    case "edit":
      return caps.edit?.references ? "Describe what to change, such as replace the bottle in @Video1 with the one in @Image1" : "Describe what to change in @Video1";
    case "extend":
      return caps.extend?.direction ? "Describe what happens before or after the video" : "Describe what happens next";
    default:
      return toolSpec(s.model, s.mode)?.placeholder ?? "Describe the video";
  }
}

export const switchToast = (model: ModelKey, from: ModeKey, to: ModeKey) =>
  `${modelCaps(model).label} doesn't support ${MODE_LABEL[from]}. Switched to ${MODE_LABEL[to]}. Your references are kept.`;

const homeCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100";

export function Composer({
  state,
  onChange,
  onCreate,
  notify,
  inUK,
  variant,
  leading,
  busy,
  balance = 35600,
}: {
  state: ComposerState;
  onChange: (s: ComposerState) => void;
  onCreate: () => void;
  notify: (text: string) => void;
  inUK?: boolean;
  variant: "home" | "canvas";
  leading?: ReactNode;
  busy?: boolean;
  /** 账户积分余额(悬停积分浮层里的 Credits left) */
  balance?: number;
}) {
  const placement: Placement = variant === "canvas" ? "up" : "down";
  const caps = modelCaps(state.model);
  const v = useMemo(() => validate(state, { inUK }), [state, inUK]);
  const credits = estimateCredits(state) * state.count;
  const videoPriced = dependsOnVideo(state);
  /* 还没放必填素材(原片、角色 / 动作视频)不算错误：不弹红条，只是 Create 置灰;真正违规(超限等)才提示 */
  const shownIssue = v.issues.find((i) => i.code !== "no-source" && i.code !== "motion-missing" && i.code !== "tool-missing");
  const [mention, setMention] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  /* @ 能引用的名字：素材(Image1 / Video1 / Audio1)+ Omni 里的 Kling 主体(Element1)和音色(Voice1) */
  const labels = [
    ...new Set(refLabels(state).values()),
    ...(state.mode === "omni" ? state.slots.omni.elements.map((_, i) => `Element${i + 1}`) : []),
    ...(state.mode === "omni" ? state.slots.omni.voices.map((_, i) => `Voice${i + 1}`) : []),
  ];

  const patch = <K extends keyof ModeSlots>(mode: K, value: Partial<ModeSlots[K]>) =>
    onChange({ ...state, slots: { ...state.slots, [mode]: { ...state.slots[mode], ...value } } });

  const pickModel = (k: ModelKey) => {
    const r = selectModel(state, k);
    onChange(r.state);
    if (r.switchedFrom) notify(switchToast(k, r.switchedFrom, r.state.mode));
    else if (r.restored) notify(`Switched back to ${MODE_LABEL[r.restored]}. Your references are back.`);
  };

  const shotsAllowed = !!caps.multiShot && (state.mode === "frames" || state.mode === "keyframes" || state.mode === "omni");
  const shotsOn = shotsActive(state);
  const toggleShots = () =>
    onChange({
      ...state,
      multiShot: { ...state.multiShot, on: !state.multiShot.on, shots: state.multiShot.shots.length ? state.multiShot.shots : firstShots(state.prompt) },
    });

  const insertMention = (label: string) => {
    const p = state.prompt.endsWith("@") ? state.prompt.slice(0, -1) : state.prompt;
    onChange({ ...state, prompt: `${p}@${label} ` });
    setMention(false);
    area.current?.focus();
  };

  const hasPrompt = !!state.prompt.trim() || (shotsOn && state.multiShot.shots.some((s) => s.prompt.trim()));
  /* 有的模式必须写提示词(Vidu 参考生、风格化、Lip Sync 选 Typed script):只放素材不够 */
  const spec = toolSpec(state.model, state.mode);
  const needPrompt =
    (state.mode === "omni" && !!caps.omni?.promptRequired) || (!!spec && isToolMode(state.mode) && promptRequiredFor(spec, toolSlot(state, state.mode).opts));
  const canCreate = v.ok && !busy && (hasPrompt || (!needPrompt && labels.length > 0));

  return (
    <div className="flex flex-col gap-3">
      {/* 模式标签在最上面(原来在底栏下拉里),换模型后只列新模型支持的模式 */}
      {/* 只有一个模式的模型(如 Kling 3.0 只有 First & Last Frame)也显示这一个标签：说明在用什么模式，输入框高度也和其他模型一致 */}
      <ModeTabs model={state.model} value={state.mode} onChange={(m) => onChange(selectMode(state, m))} placement={placement} />
      {/* 素材格一排在上、提示词整行在下(所有模式一致，切模式时提示词位置不跳);附加行在提示词下面 */}
      <ModeSlotsView part="main" state={state} onPatch={patch} overIds={v.overIds} placement={placement} notify={notify} />
      <div>
      {shotsOn && !state.multiShot.smart ? (
        <ShotList shots={state.multiShot.shots} shotMax={caps.multiShot!.shotMax} onChange={(shots) => onChange({ ...state, multiShot: { ...state.multiShot, shots } })} />
      ) : (
        <div className="relative">
          <textarea
            ref={area}
            value={state.prompt}
            onChange={(e) => {
              onChange({ ...state, prompt: e.target.value });
              setMention(e.target.value.endsWith("@") && labels.length > 0);
            }}
            onBlur={() => window.setTimeout(() => setMention(false), 150)}
            aria-label="Prompt"
            rows={variant === "home" ? 4 : 3}
            placeholder={shotsOn && state.multiShot.smart ? "Describe the whole video. Kling splits it into shots for you" : placeholderFor(state)}
            className="w-full resize-none bg-transparent px-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#a5a6b6]"
          />
          {mention && (
            <div role="listbox" aria-label="Reference files" className="absolute left-1 top-full z-30 mt-1 w-48 rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_12px_30px_rgba(26,26,46,0.15)]">
              {labels.map((l) => (
                <button key={l} type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => insertMention(l)} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-[#1a1a2e] hover:bg-[#faf8f6]">
                  @{l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
      <ModeSlotsView part="extras" state={state} onPatch={patch} overIds={v.overIds} placement={placement} notify={notify} />

      {shownIssue && (
        <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-[#fff4f2] px-2.5 py-1.5 text-[12.5px] leading-snug text-[#c2410c]">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {shownIssue.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {leading}
        <ModelSettingsMenu state={state} onModel={pickModel} onChange={(p) => onChange({ ...state, ...p })} placement={placement} />
        {shotsAllowed && (
          <button
            type="button"
            aria-pressed={shotsOn}
            onClick={toggleShots}
            className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-semibold transition ${shotsOn ? "border-[#ffcfb3] bg-[#fff3ec] text-[#ff5e1a]" : "border-[#ececf1] bg-white text-[#1a1a2e] hover:border-[#d4d3df]"}`}
          >
            <Clapperboard className="size-3.5" />
            Multi-shot
          </button>
        )}
        {shotsOn && caps.multiShot?.smart && (
          <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[#6a6b7b]">
            <input type="checkbox" checked={state.multiShot.smart} onChange={(e) => onChange({ ...state, multiShot: { ...state.multiShot, smart: e.target.checked } })} className="size-3.5 accent-[#ff5e1a]" />
            Smart shots
          </label>
        )}
        {/* 底栏顺序：模型 → Multi-shot → 条数 */}
        <CountMenu value={state.count} onChange={(count) => onChange({ ...state, count })} placement={placement} />
        <div className="ml-auto flex items-center gap-2">
          {/* 悬停积分：照真实产品的浮层「条数 × 单价 = 合计 | Credits left」;按参考视频时长计费的模式下面多一行说明 */}
          <span className="group relative inline-flex" tabIndex={0}>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ffd8c2] bg-[#fff7f1] px-2.5 text-[13px] font-bold tabular-nums text-[#ff5e1a]">
              <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
              {credits}
            </span>
            {/* 外层 padding 是透明桥，鼠标从徽章移进浮层不会断 */}
            <span
              role="tooltip"
              className={`invisible absolute right-0 z-50 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 ${
                placement === "up" ? "bottom-full pb-2.5" : "top-full pt-2.5"
              }`}
            >
              <span className="block whitespace-nowrap rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_rgba(26,26,46,0.16)]">
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[14px] font-bold tabular-nums text-[#1a1a2e]">
                    <span className="grid size-4 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-[9px] text-white">✦</span>
                    {state.count} × {(credits / state.count).toLocaleString("en-US")} = {credits.toLocaleString("en-US")}
                  </span>
                  <span className="text-[#d8d8de]">|</span>
                  <span className="text-[14px] text-[#8d8e9d]">Credits left: {balance.toLocaleString("en-US")}</span>
                </span>
                {videoPriced && (
                  <span className="mt-2 flex items-center gap-1.5 border-t border-[#f0eff3] pt-2 text-[12.5px] text-[#8d8e9d]">
                    <Info className="size-3.5 shrink-0" />
                    Final cost depends on your reference video&apos;s length
                  </span>
                )}
              </span>
            </span>
          </span>
          {variant === "canvas" ? (
            <button type="button" aria-label="Generate" disabled={!canCreate} onClick={onCreate} className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#ff5255] to-[#ffa73c] text-white shadow-[0_2px_0_#b65a42] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none">
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <button type="button" disabled={!canCreate} onClick={onCreate} className={homeCta}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
