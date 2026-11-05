"use client";

/* 底栏四个下拉：模型 → 模式 → 比例 · 分辨率 → 时长。先选模型，模式下拉只列这个模型 API 支持的。 */

import { CameraMovePicker } from "./CameraMovePicker";
import { StylePresetPicker } from "./StylePresetPicker";
import {
  Camera,
  ChevronDown,
  Info,
  Maximize,
  GalleryHorizontalEnd,
  Layers,
  Palette,
  Scissors,
  StepForward,
  type LucideProps,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AUTO_RATIO,
  MODE_HINT,
  MODE_LABEL,
  MODEL_GROUPS,
  modelCaps,
  type ModeKey,
  type ModelKey,
} from "../capabilities";
import {
  effectiveSecs,
  modeResolutions,
  shotsActive,
  toolSlot,
  type ComposerState,
} from "../state";
import {
  extrasFor,
  extraValue,
  lockedResolution,
  setExtra,
  smartDuration,
} from "../extras";
import { isToolMode, optionValue, toolSpec, visibleOptions } from "../tools";
import { MenuItem, Pill, menuHeading, type Placement } from "./Popover";

export function ModelIcon({
  model,
  className = "size-4",
}: {
  model: ModelKey;
  className?: string;
}) {
  const caps = modelCaps(model);
  if (caps.icon)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={caps.icon} alt="" className={`${className} object-contain`} />
    );
  return (
    <span
      className={`${className} grid place-items-center rounded-[4px] bg-[#1a1a2e] text-[9px] font-bold leading-none text-white`}
      aria-hidden
    >
      M
    </span>
  );
}

/** 首尾帧：两个并排的圆角框(照即梦) */
function FramesIcon({ className, strokeWidth = 2 }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="8" height="16" rx="2" />
      <rect x="13" y="4" width="8" height="16" rx="2" />
    </svg>
  );
}

/** 全能参考：方框 + 圆角播放三角(Monica 给的 lucide square-play 新版路径) */
function OmniIcon({ className, strokeWidth = 2 }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" />
    </svg>
  );
}

export const MODE_ICON: Record<ModeKey, (p: LucideProps) => React.ReactNode> = {
  omni: OmniIcon,
  frames: FramesIcon,
  keyframes: GalleryHorizontalEnd,
  edit: Scissors,
  extend: StepForward,
  camera: Camera,
  style: Palette,
};

/** 模型列表按公司分组：灰色小标题 + 该公司的模型 */
function GroupedModels({
  value,
  onPick,
}: {
  value: ModelKey;
  onPick: (k: ModelKey) => void;
}) {
  return (
    <>
      {MODEL_GROUPS.map((g, gi) => (
        <div key={g.company} role="group" aria-label={g.company}>
          <p className={`${companyHeading} ${gi > 0 ? "mt-1.5" : ""}`}>
            {g.company}
          </p>
          {g.models.map((m) => (
            <MenuItem
              key={m.key}
              selected={m.key === value}
              onClick={() => onPick(m.key)}
              icon={<ModelIcon model={m.key} />}
              label={m.label}
              hint={m.modes.map((k) => MODE_LABEL[k]).join(" · ")}
            />
          ))}
        </div>
      ))}
    </>
  );
}

const companyHeading =
  "px-2.5 pb-1 pt-2 text-[12px] font-medium text-[#a0a1aa]";

export function ModelMenu({
  value,
  onChange,
  placement,
}: {
  value: ModelKey;
  onChange: (k: ModelKey) => void;
  placement: Placement;
}) {
  return (
    <Pill
      ariaLabel="Video model"
      placement={placement}
      width={300}
      icon={<ModelIcon model={value} />}
      label={modelCaps(value).label}
    >
      {(close) => (
        <>
          <GroupedModels
            value={value}
            onPick={(k) => {
              onChange(k);
              close();
            }}
          />
        </>
      )}
    </Pill>
  );
}

export function ModeMenu({
  model,
  value,
  onChange,
  placement,
}: {
  model: ModelKey;
  value: ModeKey;
  onChange: (m: ModeKey) => void;
  placement: Placement;
}) {
  const Icon = MODE_ICON[value];
  return (
    <Pill
      ariaLabel="Input mode"
      placement={placement}
      width={290}
      icon={<Icon className="size-4 text-[#6a6b7b]" />}
      label={MODE_LABEL[value]}
    >
      {(close) => (
        <>
          <p className={menuHeading}>{modelCaps(model).label} mode types</p>
          {modelCaps(model).modes.map((k) => {
            const I = MODE_ICON[k];
            return (
              <MenuItem
                key={k}
                selected={k === value}
                onClick={() => {
                  onChange(k);
                  close();
                }}
                icon={<I className="size-4 text-[#6a6b7b]" />}
                label={MODE_LABEL[k]}
                hint={MODE_HINT[k]}
              />
            );
          })}
        </>
      )}
    </Pill>
  );
}

/** 模式标签(分段控件样式：灰色轨道里，选中的是白色浮起块):放在输入框最上面一排，只列当前模型 API 支持的模式(参考即梦：全能参考 / 首尾帧 / 视频编辑 …)。
    每个标签名后面一个小 ⓘ:只有点击 ⓘ 才弹出这个模式的说明(点外面 / Esc / 滚动时关)。不做悬停弹出：在标签间移动鼠标切换时会一闪一闪。 */
export function ModeTabs({
  model,
  value,
  onChange,
  placement,
}: {
  model: ModelKey;
  value: ModeKey;
  onChange: (m: ModeKey) => void;
  placement: Placement;
}) {
  /* 全部模式摆在一行(不收进 More);放不下时横向滑动，两端出现渐隐 + 箭头。
     轨道是横向滚动容器，ⓘ 说明如果放在里面会被裁掉，所以挂到 body,按 ⓘ 的位置 fixed 定位 */
  const [info, setInfo] = useState<{ k: ModeKey; x: number; y: number } | null>(
    null,
  );
  const [edge, setEdge] = useState({ left: false, right: false });
  const track = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const shown = modelCaps(model).modes;

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({
      left: el.scrollLeft > 4,
      right: Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 4,
    });
  }, []);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, model]);
  /* 选中的模式(比如从侧边栏直接进 Style Presets)滚到看得见的位置 */
  useEffect(() => {
    /* 只横向滚标签条本身(scrollIntoView 会连带滚动外层：画布上 16 个输入框会把画布拖到最后一个) */
    const t = track.current;
    const el = t?.querySelector<HTMLElement>(`[data-mode="${value}"]`);
    if (!t || !el) return;
    const left =
      el.getBoundingClientRect().left -
      t.getBoundingClientRect().left +
      t.scrollLeft;
    if (left < t.scrollLeft) t.scrollLeft = left;
    else if (left + el.offsetWidth > t.scrollLeft + t.clientWidth)
      t.scrollLeft = left + el.offsetWidth - t.clientWidth;
  }, [value, model]);
  useEffect(() => {
    if (!info) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        pop.current?.contains(t) ||
        (t instanceof Element && t.closest("[data-mode-info]"))
      )
        return;
      setInfo(null);
    };
    const close = () => setInfo(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [info]);

  const openInfo = (k: ModeKey, btn: HTMLElement) => {
    if (info?.k === k) return setInfo(null);
    const r = btn.getBoundingClientRect();
    const W = 240;
    const x = Math.min(Math.max(12, r.left - 8), window.innerWidth - W - 12);
    setInfo({ k, x, y: placement === "up" ? r.top - 8 : r.bottom + 8 });
  };
  const scrollBy = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  const InfoIcon = info ? MODE_ICON[info.k] : null;

  return (
    <div className="relative w-fit max-w-full">
      <div
        ref={track}
        role="tablist"
        aria-label={`${modelCaps(model).label} mode types`}
        onScroll={measure}
        className="flex max-w-full scroll-px-10 items-center gap-0.5 overflow-x-auto rounded-[11px] bg-[#f4f3f6] p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((k) => {
          const I = MODE_ICON[k];
          const on = k === value;
          return (
            <div
              key={k}
              data-mode={k}
              className={`relative inline-flex h-8 shrink-0 items-center rounded-[9px] text-[12.5px] transition ${
                on
                  ? "bg-white text-[#1a1a2e] shadow-[0_1px_3px_rgba(26,26,46,0.12)]"
                  : "text-[#8d8e9d] hover:text-[#4a4b5c]"
              }`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setInfo(null);
                  if (!on) onChange(k);
                }}
                className={`inline-flex h-full items-center gap-1.5 whitespace-nowrap rounded-l-[9px] pl-2.5 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30 ${on ? "font-semibold" : "font-medium"}`}
              >
                <I className="size-3.5" />
                {MODE_LABEL[k]}
              </button>
              <button
                type="button"
                data-mode-info
                aria-label={`What is ${MODE_LABEL[k]}?`}
                aria-expanded={info?.k === k}
                onClick={(e) => openInfo(k, e.currentTarget)}
                className={`mr-1 grid size-5 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/30 ${
                  info?.k === k
                    ? "bg-black/5 opacity-100"
                    : "opacity-55 hover:bg-black/5 hover:opacity-100"
                }`}
              >
                <Info className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
      {/* 放不下时两端的渐隐 + 箭头(触控板 / 手机直接滑，鼠标用户点箭头) */}
      {edge.left && (
        <button
          type="button"
          aria-label="Scroll modes left"
          onClick={() => scrollBy(-1)}
          className="absolute inset-y-0 left-0 flex w-10 items-center justify-start rounded-l-[11px] bg-gradient-to-r from-[#f4f3f6] from-55% to-transparent pl-1 text-[#6a6b7b] hover:text-[#1a1a2e]"
        >
          <ChevronDown className="size-4 rotate-90" />
        </button>
      )}
      {edge.right && (
        <button
          type="button"
          aria-label="Scroll modes right"
          onClick={() => scrollBy(1)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-end rounded-r-[11px] bg-gradient-to-l from-[#f4f3f6] from-55% to-transparent pr-1 text-[#6a6b7b] hover:text-[#1a1a2e]"
        >
          <ChevronDown className="size-4 -rotate-90" />
        </button>
      )}
      {info &&
        InfoIcon &&
        createPortal(
          <div
            ref={pop}
            role="dialog"
            aria-label={MODE_LABEL[info.k]}
            style={{
              left: info.x,
              top: info.y,
              transform: placement === "up" ? "translateY(-100%)" : undefined,
            }}
            className="fixed z-[80] w-[240px] rounded-xl border border-[#ececf1] bg-white px-3 py-2.5 text-left shadow-[0_16px_40px_rgba(26,26,46,0.16)]"
          >
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]">
              <InfoIcon className="size-3.5 text-[#6a6b7b]" />
              {MODE_LABEL[info.k]}
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-[#6a6b7b]">
              {MODE_HINT[info.k]}
            </p>
          </div>,
          document.body,
        )}
    </div>
  );
}

const ratioBox = (r: string) => {
  const [w, h] = r.split(":").map(Number);
  const s = 16 / Math.max(w, h);
  return { width: Math.max(6, w * s), height: Math.max(6, h * s) };
};

const seg = (on: boolean) =>
  `rounded-lg text-[12.5px] transition ${on ? "bg-white font-semibold text-[#1a1a2e] shadow-[0_2px_7px_rgba(26,26,46,0.08)]" : "text-[#9a9bb0] hover:text-[#4a4b5c]"}`;
const fieldLabel = "text-[13px] font-medium text-[#a0a1aa]";

/** 底栏模型按钮 → Model Settings 弹层(照真实产品):Model / Aspect Ratio / Duration / Resolution / With Audio */
export function ModelSettingsMenu({
  state,
  onModel,
  onChange,
  placement,
  inline = false,
}: {
  state: ComposerState;
  onModel: (k: ModelKey) => void;
  onChange: (p: Partial<ComposerState>) => void;
  placement: Placement;
  /** true = 不做下拉，直接把设置面板摆出来(演示：首页全部模型输入框右边常显，跟着模式变);不显示 Model 选择 */
  inline?: boolean;
}) {
  const caps = modelCaps(state.model);
  const [list, setList] = useState(false);
  /* 额外能力模式(tools.ts)可以有自己的分辨率 / 时长 / 比例说明和选项 */
  const spec = toolSpec(state.model, state.mode);
  const tool =
    spec && isToolMode(state.mode) ? toolSlot(state, state.mode) : undefined;
  const setOpt = (id: string, v: string) =>
    isToolMode(state.mode) &&
    tool &&
    onChange({
      slots: {
        ...state.slots,
        tools: {
          ...state.slots.tools,
          [state.mode]: { ...tool, opts: { ...tool.opts, [id]: v } },
        },
      },
    });
  const draftRes = lockedResolution(state);
  const resList = draftRes
    ? [draftRes]
    : modeResolutions(state.model, state.mode);
  /* 放了首帧 / 尾帧、而这个模型的图生不收比例:画面跟随首帧 */
  const ratioFromFrame =
    state.mode === "frames" &&
    !!caps.frames?.ratioFromFrame &&
    !!(state.slots.frames.start || state.slots.frames.end);
  const ratioText =
    spec?.ratioFollows ??
    (ratioFromFrame
      ? `Follows your ${state.slots.frames.start ? "first" : "last"} frame`
      : "Matches the source video");
  const lockedRatio =
    state.mode === "edit" ||
    state.mode === "extend" ||
    caps.ratios.length === 0 ||
    !!spec?.ratioFollows ||
    ratioFromFrame;
  const ratios = [
    ...(AUTO_RATIO.has(state.model) ? ["Auto"] : []),
    ...caps.ratios,
  ];
  const shots = shotsActive(state) && !state.multiShot.smart;
  const fixedSecs = smartDuration(state)
    ? "Model picks the length (Smart Duration)"
    : spec?.secsFromOption
      ? `Set by ${spec.secsFromOption.label}`
      : spec?.secsFrom
        ? tool?.files[spec.secsFrom.input]?.[0]?.secs !== undefined
          ? `${effectiveSecs(state)}s — matches the ${spec.secsFrom.label}`
          : `Matches the ${spec.secsFrom.label}`
        : state.mode === "edit"
          ? state.slots.edit.source
            ? `${effectiveSecs(state)}s — matches the source video`
            : "Matches the source video"
          : shots
            ? `${effectiveSecs(state)}s — sum of your shots`
            : null;
  const { min, max, step } = spec?.durations ?? caps.durations;
  const options: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step)
    options.push(Math.round(v * 10) / 10);

  const body = (
    <div
      className={
        inline
          ? ""
          : "max-h-[min(640px,62dvh)] overflow-y-auto overscroll-contain p-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }
    >
      <p className="text-[16px] font-bold text-[#27160f]">Model Settings</p>

      {!inline && (
        <>
          <p className={`mt-3 ${fieldLabel}`}>Model</p>
          <div className="relative mt-1.5">
            <button
              type="button"
              onClick={() => setList((o) => !o)}
              aria-expanded={list}
              className="flex w-full items-center gap-2.5 rounded-xl border border-[#e4e3ea] bg-white px-3 py-2.5 text-left text-[14px] text-[#1a1a2e] shadow-[0_0_0_3px_#f1f0f4]"
            >
              <ModelIcon model={state.model} />
              <span className="flex-1">{caps.label}</span>
              <ChevronDown
                className={`size-4 text-[#9a9bb0] transition ${list ? "rotate-180" : ""}`}
              />
            </button>
            {list && (
              <div
                role="menu"
                className="absolute inset-x-0 top-[calc(100%+6px)] z-10 max-h-[300px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl border border-[#ececf1] bg-white p-1 shadow-[0_12px_30px_rgba(26,26,46,0.15)]"
              >
                <GroupedModels
                  value={state.model}
                  onPick={(k) => {
                    onModel(k);
                    setList(false);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      <p className={`mt-4 ${fieldLabel}`}>Aspect Ratio</p>
      {lockedRatio ? (
        <p className="mt-1.5 rounded-xl bg-[#f4f4f6] px-3 py-2.5 text-[12.5px] text-[#6a6b7b]">
          {ratioText}
        </p>
      ) : (
        <div className="mt-1.5 flex gap-1 rounded-xl bg-[#f4f4f6] p-1">
          {ratios.map((r) => {
            const on = (r === "Auto" ? "adaptive" : r) === state.ratio;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({ ratio: r === "Auto" ? "adaptive" : r })
                }
                className={`flex flex-1 flex-col items-center gap-1 py-2 ${seg(on)}`}
              >
                <span className="grid h-5 place-items-center">
                  {r === "Auto" ? (
                    <Maximize className="size-4" />
                  ) : (
                    <span
                      className="block rounded-[3px] border-[1.5px] border-current"
                      style={ratioBox(r)}
                    />
                  )}
                </span>
                {r}
              </button>
            );
          })}
        </div>
      )}

      <p className={`mt-4 ${fieldLabel}`}>Duration</p>
      {fixedSecs ? (
        <p className="mt-1.5 rounded-xl bg-[#f4f4f6] px-3 py-2.5 text-[12.5px] text-[#6a6b7b]">
          {fixedSecs}
        </p>
      ) : (
        <div className="mt-1.5 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl bg-[#f4f4f6] p-1">
          {options.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={v === state.secs}
              onClick={() => onChange({ secs: v })}
              className={`shrink-0 px-3 py-2 tabular-nums ${seg(v === state.secs)}`}
            >
              {v}s
            </button>
          ))}
        </div>
      )}

      {/* 没有分辨率选项的模型 / 模式不显示这一栏 */}
      {resList.length > 0 && (
        <>
          <p className={`mt-4 ${fieldLabel}`}>Resolution</p>
          <div className="mt-1.5 flex gap-1 rounded-xl bg-[#f4f4f6] p-1">
            {resList.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={state.resolution === r}
                onClick={() => onChange({ resolution: r })}
                className={`flex-1 py-2 ${seg(state.resolution === r)}`}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}
      {state.mode === "keyframes" && caps.keyframes?.resolutions && (
        <p className="mt-1.5 text-[11.5px] text-[#9a9bb0]">
          Keyframes on {caps.label} run at{" "}
          {caps.keyframes.resolutions.join(" or ")}.
        </p>
      )}

      {/* 专项模式的选项(运镜方式、风格、VHS 损坏程度) */}
      {spec &&
        tool &&
        visibleOptions(spec, tool.opts).map((o) => {
          const val = optionValue(spec, tool.opts, o.id);
          return (
            <div key={o.id}>
              <p className={`mt-4 ${fieldLabel}`}>{o.label}</p>
              {o.id === "move" ? (
                <CameraMovePicker values={o.values} value={val} onChange={(v) => setOpt(o.id, v)} />
              ) : o.id === "style" ? (
                <StylePresetPicker values={o.values} value={val} onChange={(v) => setOpt(o.id, v)} />
              ) : o.numeric ? (
                <label className="mt-1.5 flex items-center gap-2 rounded-xl bg-[#f4f4f6] px-3 py-2 text-[12.5px] text-[#6a6b7b]">
                  <input
                    type="number"
                    min={o.numeric.min}
                    max={o.numeric.max}
                    step={o.numeric.step}
                    value={val}
                    onChange={(e) => setOpt(o.id, e.target.value)}
                    aria-label={o.label}
                    className="w-16 rounded-md border border-[#ececf1] bg-white px-1.5 py-1 text-right tabular-nums text-[#1a1a2e] outline-none focus:border-[#ff5e1a]"
                  />
                  s into the video
                </label>
              ) : (
                <div
                  className={`mt-1.5 rounded-xl bg-[#f4f4f6] p-1 ${o.values.length > 4 ? "grid grid-cols-3 gap-1" : "flex gap-1"}`}
                >
                  {o.values.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={v === val}
                      onClick={() => setOpt(o.id, v)}
                      className={`${o.values.length > 4 ? "" : "flex-1"} px-1.5 py-2 ${seg(v === val)}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {caps.audioToggle && (
        <div className="mt-4 flex items-center justify-between">
          <p className={fieldLabel}>With Audio</p>
          <div className="flex w-[180px] gap-1 rounded-xl bg-[#f4f4f6] p-1">
            {(["No", "Yes"] as const).map((o) => {
              const on = (o === "Yes") === state.audio;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ audio: o === "Yes" })}
                  className={`flex-1 py-1.5 ${seg(on)}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 模型的额外参数(extras.ts,按 fal API 核对):Thinking、Prompt Enhance、Smart Duration、Keep Original Audio 等 */}
      {extrasFor(state).map((p) => {
        const forced = p.force?.(state);
        const val = extraValue(state, p);
        const values = p.kind === "toggle" ? ["No", "Yes"] : (p.values ?? []);
        const isOn = (v: string) =>
          p.kind === "toggle" ? (v === "Yes") === val : v === val;
        return (
          <div key={p.id} className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <p className={`${fieldLabel} flex items-center gap-1`}>
                {p.label}
                <InfoTip text={p.hint} label={`About ${p.label}`} />
              </p>
              <div
                className={`flex gap-1 rounded-xl bg-[#f4f4f6] p-1 ${p.kind === "toggle" ? "w-[180px]" : "min-w-[180px]"} ${forced ? "opacity-60" : ""}`}
              >
                {values.map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={!!forced}
                    aria-pressed={isOn(v)}
                    onClick={() =>
                      onChange(
                        setExtra(
                          state,
                          p.id,
                          p.kind === "toggle" ? v === "Yes" : v,
                        ),
                      )
                    }
                    className={`flex-1 whitespace-nowrap px-1.5 py-1.5 disabled:cursor-not-allowed ${seg(isOn(v))}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {forced && (
              <p className="mt-1 text-[11.5px] leading-snug text-[#c2410c]">
                {forced.reason}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
  if (inline) return body;
  return (
    <Pill
      ariaLabel="Model settings"
      placement={placement}
      width={360}
      scroll={false}
      icon={<ModelIcon model={state.model} />}
      label={caps.label}
    >
      {() => body}
    </Pill>
  );
}

/** 设置项名字后面的 ⓘ:点击弹出一句说明(和模式标签的 ⓘ 一样，不做悬停),点外面或 Esc 关闭 */
function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`grid size-4 place-items-center rounded-full transition ${open ? "text-[#ff5e1a]" : "text-[#b4b5c3] hover:text-[#6a6b7b]"}`}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-[calc(100%+6px)] z-20 w-[220px] rounded-lg bg-[#1a1a2e] px-2.5 py-1.5 text-[11.5px] font-normal leading-snug text-white shadow-[0_8px_20px_rgba(26,26,46,0.2)]"
        >
          {text}
        </span>
      )}
    </span>
  );
}

/** 一次生成几条(底栏「1」):照产品，标题 How many to generate + 1–8 两排格子 */
export function CountMenu({
  value,
  onChange,
  placement,
}: {
  value: number;
  onChange: (n: number) => void;
  placement: Placement;
}) {
  return (
    <Pill
      ariaLabel="Number of videos"
      placement={placement}
      width={264}
      scroll={false}
      icon={<Layers className="size-4 text-[#6a6b7b]" />}
      label={`${value}`}
    >
      {(close) => (
        <div className="p-2">
          <p className="text-[13px] font-medium text-[#a0a1aa]">
            How many to generate
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-[#f4f4f6] p-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={n === value}
                onClick={() => (onChange(n), close())}
                className={`py-2 tabular-nums ${seg(n === value)}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </Pill>
  );
}
