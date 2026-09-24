"use client";

/* 剪辑器共用的小控件 —— 全屏编辑、音频面板、节点工具条都用这一套,状态语言统一:
   - 悬停:中性灰底(#f3f4f6)+ 文字加深,不用品牌橙
   - 选中 / 当前:品牌橙(导航项、标签页下划线、选项卡描边、开关、时间线选中框)
   - 分段控件:灰槽 + 白色滑块,表示「这个值是哪一档」,不算选中态,所以不用橙
   - 键盘聚焦:橙色 2px 光圈
   - 轨道色:字幕品牌橙实底白字、配音蓝、音乐绿、音效紫,画面是素材本身。
     选中框字幕和画面同一套:2px 深一档品牌橙(#e2500f)框 + 把手,选中不改块本身颜色 */

import { Tip } from "./tip";

export const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40";
/** 输入框 / 文本框 / 下拉 */
export const FIELD =
  "w-full rounded-lg border border-[#e1e3e9] bg-white text-[13px] text-[#1a1a2e] outline-none transition placeholder:text-[#9a9bb0] hover:border-[#c9cad4] focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15";

/* 轨道上各类块的配色 */
export const TRACK = {
  sub: { bg: "#ff9563", bgHover: "#ff8854", selected: "#ff9563", text: "#ffffff" },
  music: { bg: "#e5f5ee", bgHover: "#d6efe3", border: "#b6e0cb", text: "#12704b" },
  sfx: { bg: "#f1ecff", bgHover: "#e7dffe", border: "#d6c9fa", text: "#5b3cc4" },
  voice: { bg: "#e8f1ff", bgHover: "#dbe8ff", border: "#bcd4fb", text: "#1d56c4" },
} as const;

/** 还没生成的内容(AI 镜头 / 配音 / 封面):平涂浅灰。不用斜纹和星星 —— 那是「AI 占位」的套路,
    用镜头 / 摄像机的语言表达「这一格还没拍」 */
export const PENDING_FILL = "bg-[#eef0f3]";

export function IconBtn({
  label,
  tip,
  kbd,
  side = "top",
  align,
  onClick,
  disabled,
  active,
  size = "md",
  children,
}: {
  label: string;
  /** 悬停提示,不填就用 label */
  tip?: string;
  kbd?: string;
  side?: "top" | "bottom" | "right" | "left";
  align?: "center" | "start" | "end";
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  return (
    <Tip label={tip ?? label} kbd={kbd} side={side} align={align}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        disabled={disabled}
        className={`grid place-items-center rounded-lg transition ${FOCUS} ${size === "sm" ? "size-7" : "size-8"} ${
          active ? "bg-[#fff1e8] text-[#ff5e1a]" : "text-[#4a4b5c] hover:bg-[#f3f4f6] hover:text-[#1a1a2e] active:bg-[#eceef2]"
        } disabled:pointer-events-none disabled:opacity-30`}
      >
        {children}
      </button>
    </Tip>
  );
}

/** 面板里的标签页:文字 + 橙色下划线(音频面板、素材面板共用) */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: readonly { id: T; label: string }[];
}) {
  return (
    <div role="tablist" className="flex border-b border-[#e6e7ec]">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex-1 pb-2.5 pt-1 text-[13.5px] font-semibold transition ${FOCUS} rounded-t-md ${
            value === t.id ? "text-[#1a1a2e]" : "text-[#9a9bb0] hover:text-[#4a4b5c]"
          }`}
        >
          {t.label}
          <span
            className={`absolute inset-x-1/4 -bottom-px h-[2px] rounded-full bg-[#ff5e1a] transition-opacity ${
              value === t.id ? "opacity-100" : "opacity-0"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/** 分段控件:选一档数值(画面处理、速度) */
export function Segmented<T extends string | number>({
  value,
  onChange,
  items,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  items: readonly { id: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-[#f1f2f5] p-0.5">
      {items.map((m) => (
        <button
          key={String(m.id)}
          type="button"
          role="radio"
          aria-checked={value === m.id}
          onClick={() => onChange(m.id)}
          className={`min-w-0 flex-1 whitespace-nowrap rounded-md py-1.5 text-[12px] font-semibold tabular-nums tracking-[-0.01em] transition ${FOCUS} ${
            value === m.id
              ? "bg-white text-[#1a1a2e] shadow-[0_1px_2px_rgba(26,26,46,0.12),0_0_0_0.5px_rgba(26,26,46,0.06)]"
              : "text-[#6a6b7b] hover:text-[#1a1a2e]"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${FOCUS} focus-visible:ring-offset-2 ${
        on ? "bg-[#ff5e1a]" : "bg-[#d9dae2] hover:bg-[#c9cad4]"
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(26,26,46,0.25)] transition-[left] duration-150 ${
          on ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/** 面板顶部:标题 + 可选说明 + 右上角关闭 */
export function PanelHeader({
  title,
  hint,
  onClose,
  closeLabel = "Close panel",
}: {
  title: React.ReactNode;
  hint?: string;
  onClose?: () => void;
  closeLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-bold leading-7 text-[#1a1a2e]">{title}</h3>
        {hint && <p className="text-[12px] leading-snug text-[#6a6b7b]">{hint}</p>}
      </div>
      {onClose && (
        <IconBtn label={closeLabel} side="bottom" align="end" size="sm" onClick={onClose}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </IconBtn>
      )}
    </div>
  );
}

/** 面板里的分组小标题 */
export function Label({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between gap-2 first:mt-0">
      <p className="text-[12px] font-semibold text-[#4a4b5c]">{children}</p>
      {aside}
    </div>
  );
}

/* 生成中的填充动画:和 generation-queue-upsell 原型同一套暖橙渐变,斜向缓慢流动。
   铺满最近的 relative 父级;文字叠在上面时给文字加 relative。 */
const GEN_BG =
  "repeating-linear-gradient(135deg, rgba(255,219,179,0.95) 0%, rgba(255,179,180,0.9) 25%, rgba(255,219,179,0.95) 50%)";
export function GenFill({ className = "" }: { className?: string }) {
  return (
    <>
      <style href="hr-gen-fill" precedence="default">{`
        @keyframes hr-gen-shift { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .hr-gen { animation: hr-gen-shift 5s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .hr-gen { animation: none; } }
      `}</style>
      <span aria-hidden className={`hr-gen pointer-events-none absolute inset-0 ${className}`} style={{ background: GEN_BG, backgroundSize: "200% 200%" }} />
    </>
  );
}
