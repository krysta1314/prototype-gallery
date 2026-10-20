"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import App from "../app/App";
import { demoReducer } from "../app/demo";
import { AppProvider, InsetsProvider } from "../app/provider";
import { StillContext } from "../app/still";
import Splash from "../app/screens/Splash";
import HomeScreen from "../shell/HomeScreen";
import StatusBar from "../shell/StatusBar";
import { FLOWS, type FlowAnno, type FlowNode, type FlowSection } from "./flows";
import { JOURNEYS, buildPreset, type Journey } from "./journeys";
import { NAV_TREE, navLeaves } from "./navTree";

/** 截图缩放：402×874 的屏幕缩到约 150 宽 */
const SHOT = 0.37;
const SCREEN_W = 402;
const SCREEN_H = 874;
const NODE_W = Math.round(SCREEN_W * SHOT);
const SHOT_H = Math.round(SCREEN_H * SHOT);
/** 截图上方的屏名 */
const TITLE_H = 26;
const NODE_H = TITLE_H + SHOT_H;
/** 只有文字框的行压矮 */
const TEXT_H = 72;
/** 判断菱形的高 */
const DIAMOND_H = 112;
/** 变体组：截图之间的间距、外框内边距、截图下方标签的高 */
const VAR_GAP = 16;
const VAR_PAD = 12;
const VAR_TAG = 28;
/** 列间距放箭头 + 交互文字;行间距放往下拐的折线和截图下的标签 */
const GAP_X = 132;
const GAP_Y = 120;
const PAD = 40;
/** 条件卡片：宽度、卡片底边离所在行顶的距离(留给截图标注)、没有上方行时给卡片预留的高度 */
const CARD_W = 400;
const CARD_GAP = 84;
const CARD_BAND = 260;
const ACCENT = "#5f6070";
const EDGE = "#d9480f";
/** 截图标注色(和异常橙区分开) */
const ANNO = "#c2255c";
/** 标注文字条的高度 + 间距 */
const ANNO_STEP = 26;
const APPLE_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

type Box = { x: number; y: number; w: number; h: number; mid: number };

/** 用户旅程图：评审时的主讲材料。每屏一张真机截图(就是这条旅程的预置状态),判断用菱形，身份 / 状态差异用变体组;点截图进入那条旅程 */
export default function FlowPage({ id, onSelect }: { id: string; onSelect: (j: Journey) => void }) {
  const flow = FLOWS[id];
  const module = NAV_TREE.find((m) => navLeaves(m.children).includes(id));
  // 主路径(第 0 行)在第一屏看不到时(笔记本屏幕、上方还有一行出口),打开就滚到主路径
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scrollRef.current;
    const first = box?.querySelector<HTMLElement>("[data-main-row]");
    if (!box || !first) return;
    const top = first.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top + 220 > box.clientHeight) box.scrollTop = top - 56;
  }, [id]);
  if (!flow) return null;
  return (
    <div ref={scrollRef} className="min-h-0 overflow-auto bg-[#f7f7f8] pb-16">
      <header className="px-10 pt-8">
        <p className="text-[12px] font-medium" style={{ color: module?.color }}>
          {module?.label} › 用户旅程图
        </p>
        <h2 className="mt-1 text-[22px] font-semibold text-[#1a1a2e]">{flow.title} · 用户旅程</h2>
        <p className="mt-1.5 max-w-[860px] text-[13px] leading-[20px] text-[#5f6070]">{flow.desc} 点任意一屏进入那条旅程，看单屏细节和演示状态。</p>
        <Legend />
      </header>
      {flow.sections.map((sec, i) => (
        <section key={sec.title || i} className="mt-6">
          {sec.title ? <h3 className="px-10 text-[15px] font-semibold text-[#1a1a2e]">{sec.title}</h3> : null}
          <Canvas sec={sec} onSelect={onSelect} />
        </section>
      ))}
    </div>
  );
}

/** 图例：评审时先讲这几种符号 */
function Legend() {
  const item = (icon: ReactNode, label: string) => (
    <span className="flex items-center gap-1.5">
      {icon}
      {label}
    </span>
  );
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#5f6070]">
      {item(
        <svg width="28" height="8">
          <path d="M0,4 H22" stroke={ACCENT} strokeWidth="1.5" />
          <path d="M20,0 L28,4 L20,8 z" fill={ACCENT} />
        </svg>,
        "交互 / 跳转(线上写点击什么)",
      )}
      {item(
        <svg width="28" height="8">
          <path d="M0,4 H22" stroke={EDGE} strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M20,0 L28,4 L20,8 z" fill={EDGE} />
        </svg>,
        "异常分支",
      )}
      {item(
        <svg width="20" height="14">
          <path d="M10,1 L19,7 L10,13 L1,7 z" fill="#fff" stroke="#1a1a2e" />
        </svg>,
        "判断(线上写条件)",
      )}
      {item(<span className="h-3.5 w-6 rounded-[4px] border border-dashed border-[#9a9bb0]" />, "变体组：同一屏的身份 / 状态差异")}
      {item(<span className="rounded-full bg-[#eef0f6] px-1.5 text-[10.5px] text-[#3a3b45]">身份</span>, "截图下的身份 / 状态标签")}
      {item(
        <span className="flex size-[14px] items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: ANNO }}>
          1
        </span>,
        "截图标注：引线指到的元素，文字写它的规则",
      )}
    </div>
  );
}

function Canvas({ sec, onSelect }: { sec: FlowSection; onSelect: (j: Journey) => void }) {
  // 行号可以是负数(主路径上方的出口，如付费墙右上方的「购买成功」)
  const minRow = Math.min(0, ...sec.nodes.map((n) => n.row));
  const maxRow = Math.max(...sec.nodes.map((n) => n.row));
  const isShotRow = (r: number) => sec.nodes.some((n) => n.row === r && !n.text);
  // 只有文字框的行压矮
  const rowH = (r: number) => (isShotRow(r) ? NODE_H : TEXT_H);
  // 条件卡片放在对应那条线的正上方;主路径上方没有别的行时，给卡片留出位置
  const top0 = PAD + (sec.cards?.length && minRow === 0 ? CARD_BAND : 0);
  const rowTop = (r: number) => {
    let y = top0;
    for (let k = minRow; k < r; k++) y += rowH(k) + GAP_Y;
    return y;
  };
  const rowMid = (r: number) => (isShotRow(r) ? rowTop(r) + TITLE_H + SHOT_H / 2 : rowTop(r) + TEXT_H / 2);
  const xOf = (col: number) => PAD + col * (NODE_W + GAP_X);

  const box = (n: FlowNode): Box => {
    const x = xOf(n.col);
    const y = rowTop(n.row);
    if (n.text) return { x, y, w: NODE_W, h: TEXT_H, mid: y + TEXT_H / 2 };
    if (n.decision) return { x, y: rowMid(n.row) - DIAMOND_H / 2, w: NODE_W, h: DIAMOND_H, mid: rowMid(n.row) };
    if (n.variants) {
      const k = n.variants.length;
      return { x: x - VAR_PAD, y: y - 6, w: k * NODE_W + (k - 1) * VAR_GAP + VAR_PAD * 2, h: NODE_H + VAR_TAG + 12, mid: rowMid(n.row) };
    }
    return { x, y, w: NODE_W, h: NODE_H, mid: rowMid(n.row) };
  };
  const nodeOf = (id: string) => sec.nodes.find((n) => n.id === id)!;
  const at = (id: string) => box(nodeOf(id));

  const right = Math.max(...sec.nodes.map((n) => box(n).x + box(n).w));
  const width = right + GAP_X + PAD;
  const height = rowTop(maxRow) + rowH(maxRow) + VAR_TAG + PAD;

  // 有分叉线的出发屏
  const forkSources = new Set(sec.edges.filter((e) => e.fork).map((e) => e.from));
  // 每条线的路径 + 文字位置
  const routes = sec.edges.map((e) => {
    const a = at(e.from);
    const b = at(e.to);
    const na = nodeOf(e.from);
    const nb = nodeOf(e.to);
    const cxA = a.x + a.w / 2;
    if (e.fork) {
      // 分叉线：出发屏右侧不远处分开，往上 / 往下拐到目标行，再往右进目标;文字写在最后一段横线上
      const fx = a.x + a.w + 28;
      return { e, d: `M${a.x + a.w + 6},${a.mid} H${fx} V${b.mid} H${b.x - 6}`, label: { kind: "h" as const, x1: fx, x2: b.x, y: b.mid, left: true } };
    }
    if (e.busCol !== undefined) {
      // 右侧绕线：右出 → 第 busCol 列左边的竖线 → 目标行 → 进目标;文字写在最后一段横线上
      const bus = xOf(e.busCol) - GAP_X / 2;
      return { e, d: `M${a.x + a.w + 6},${a.mid} H${bus} V${b.mid} H${b.x - 6}`, label: { kind: "h" as const, x1: bus, x2: b.x, y: b.mid } };
    }
    if (e.merge) {
      const bus = b.x - GAP_X / 2;
      return { e, d: `M${a.x + a.w + 6},${a.mid} H${bus} V${b.mid} H${b.x - 6}`, label: { kind: "h" as const, x1: a.x + a.w, x2: bus, y: a.mid } };
    }
    if (na.row === nb.row) {
      // 同一屏有分叉线时，直行这条的文字也从分叉点起、左对齐，和上下两条对齐
      if (forkSources.has(e.from)) {
        const fx = a.x + a.w + 28;
        return { e, d: `M${a.x + a.w + 6},${a.mid} H${b.x - 6}`, label: { kind: "h" as const, x1: fx, x2: b.x, y: a.mid, left: true } };
      }
      return { e, d: `M${a.x + a.w + 6},${a.mid} H${b.x - 6}`, label: { kind: "h" as const, x1: a.x + a.w, x2: b.x, y: a.mid } };
    }
    if (na.col === nb.col) {
      // 从变体组往下接单屏：竖线对准下面那一屏的中线
      const x = a.w > NODE_W ? b.x + b.w / 2 : cxA;
      return { e, d: `M${x},${a.y + a.h + 6} V${b.y - 6}`, label: { kind: "v" as const, x, y: a.y + a.h } };
    }
    return { e, d: `M${cxA},${a.y + a.h + 6} V${b.mid} H${b.x - 6}`, label: { kind: "h" as const, x1: cxA, x2: b.x, y: b.mid } };
  });

  return (
    <div className="relative" style={{ width, height }}>
      {/* 主路径所在行的位置(给「打开时滚到主路径」用) */}
      <span data-main-row className="pointer-events-none absolute left-0 w-px" style={{ top: rowTop(0) - 40, height: 1 }} />
      <svg className="pointer-events-none absolute inset-0" width={width} height={height}>
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={ACCENT} />
          </marker>
          <marker id="flow-arrow-edge" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={EDGE} />
          </marker>
        </defs>
        {/* 异常线先画：和正常线共用的竖线段被灰线盖住，只有拐出去那段是橙色虚线 */}
        {[...routes]
          .sort((x, y) => Number(!!y.e.edge) - Number(!!x.e.edge))
          .map(({ e, d }) => (
            <path
              key={`${e.from}-${e.to}`}
              d={d}
              fill="none"
              stroke={e.edge ? EDGE : ACCENT}
              strokeWidth={1.5}
              strokeDasharray={e.edge ? "5 4" : undefined}
              markerEnd={`url(#${e.edge ? "flow-arrow-edge" : "flow-arrow"})`}
            />
          ))}
        {/* 判断菱形 */}
        {sec.nodes
          .filter((n) => n.decision)
          .map((n) => {
            const b = box(n);
            const cx = b.x + b.w / 2;
            return <path key={n.id} d={`M${cx},${b.y} L${b.x + b.w},${b.mid} L${cx},${b.y + b.h} L${b.x},${b.mid} z`} fill="#fff" stroke="#1a1a2e" strokeWidth={1.25} />;
          })}
      </svg>

      {/* 线上的文字：横线写在线上方(文字底边贴线),竖线写在线右侧 */}
      {routes.map(({ e, label }) => {
        const color = e.edge ? EDGE : "#3a3b45";
        const strong = /^(是|否)$/.test(e.label);
        if (label.kind === "v")
          return (
            <p key={`${e.from}-${e.to}-l`} className="absolute text-[11px] leading-[14px]" style={{ left: label.x + 8, top: label.y + 10, width: NODE_W / 2 + GAP_X - 20, color }}>
              {e.label}
            </p>
          );
        const leftAlign = "left" in label && label.left;
        return (
          <p
            key={`${e.from}-${e.to}-l`}
            className={`absolute leading-[14px] ${leftAlign ? "text-left" : "text-center"} ${strong ? "text-[12px] font-semibold" : "text-[11px]"}`}
            style={{ left: label.x1 + 8, top: label.y - 4, width: Math.max(60, label.x2 - label.x1 - 16), transform: "translateY(-100%)", color }}
          >
            {e.label}
          </p>
        );
      })}

      {sec.tails?.map((t) => {
        const b = at(t.after);
        return (
          <p key={`tail-${t.after}`} className="absolute text-[11px] leading-[14px] text-[#8e8d99]" style={{ left: b.x + b.w + 12, top: b.mid - 14, width: GAP_X - 20 }}>
            {t.label}
          </p>
        );
      })}

      {/* 条件卡片：放在那条线正上方(左边从线的中点起),虚线连到线上;高度随内容，底边贴在所在行上方 */}
      {sec.cards?.map((c) => {
        const a = at(c.from);
        const b = at(c.to);
        const gapMid = (a.x + a.w + b.x) / 2;
        const cardBottom = rowTop(nodeOf(c.from).row) - CARD_GAP;
        return (
          <div key={`card-${c.from}-${c.to}`}>
            <span className="absolute border-l border-dashed border-[#9a9bb0]" style={{ left: gapMid, top: cardBottom, height: a.mid - cardBottom - 26 }} />
            <div
              className="absolute rounded-xl bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.08]"
              style={{ left: gapMid - 14, top: cardBottom, width: CARD_W, transform: "translateY(-100%)" }}
            >
              <p className="text-[12px] font-semibold text-[#1a1a2e]">{c.title}</p>
              <ul className="mt-1.5 space-y-0.5">
                {c.lines.map((l) => (
                  <li key={l} className="text-[11.5px] leading-[16px] text-[#3a3b45]">
                    {l}
                  </li>
                ))}
              </ul>
              {/* 要特别提醒的一句：高亮 */}
              {c.emphasis ? <p className="mt-2 rounded-md bg-[#fff3bf] px-2 py-1 text-[11.5px] font-semibold leading-[16px] text-[#5c3d00]">{c.emphasis}</p> : null}
            </div>
          </div>
        );
      })}

      {sec.nodes.map((n) => {
        const b = box(n);
        // 判断：菱形里写问题
        if (n.decision)
          return (
            <p
              key={n.id}
              className="absolute flex items-center justify-center whitespace-pre-line text-center text-[12px] font-semibold leading-[16px] text-[#1a1a2e]"
              style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            >
              {n.decision}
            </p>
          );
        // 文字框：不是一条旅程，只说明去处或异常提示
        if (n.text)
          return (
            <div
              key={n.id}
              className={`absolute flex items-center justify-center whitespace-pre-line rounded-xl px-3 text-center text-[12px] leading-[17px] ring-1 ${n.edge ? "bg-[#fff7ed] text-[#c2410c] ring-[#fdba74]" : "bg-white text-[#3a3b45] ring-black/[0.08]"}`}
              style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            >
              {n.text}
            </div>
          );
        // 变体组：虚线框，组名 + 并排截图 + 每张下面的身份 / 状态标签
        if (n.variants)
          return (
            <div key={n.id} className="absolute rounded-2xl border border-dashed border-[#9a9bb0] bg-white/50" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
              <span className="absolute left-3 flex items-center text-[12px] font-semibold text-[#1a1a2e]" style={{ top: 6, height: TITLE_H - 6 }}>
                {n.title}
              </span>
              {n.variants.map((v, i) => {
                const j = JOURNEYS.find((x) => x.id === v.id);
                if (!j) return null;
                return <ShotCard key={v.id} journey={j} onSelect={onSelect} left={VAR_PAD + i * (NODE_W + VAR_GAP)} top={6 + TITLE_H - 6} tag={v.label} hideTitle annos={v.annos} />;
              })}
            </div>
          );
        const j = JOURNEYS.find((x) => x.id === n.id);
        if (!j) return null;
        return <ShotCard key={n.id} journey={j} onSelect={onSelect} left={b.x} top={b.y} tag={n.tag} annos={n.annos} />;
      })}
    </div>
  );
}

/** 一屏：屏名 + 截图(+ 截图下的身份 / 状态标签);点击进入那条旅程 */
function ShotCard({
  journey: j,
  onSelect,
  left,
  top,
  tag,
  hideTitle,
  annos,
}: {
  journey: Journey;
  onSelect: (j: Journey) => void;
  left: number;
  top: number;
  tag?: string;
  hideTitle?: boolean;
  annos?: FlowAnno[];
}) {
  const edge = j.group === "异常与边界";
  return (
    // 截图里本身有按钮，外层不能再嵌 <button>
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(j)}
      onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && onSelect(j)}
      className="group absolute cursor-pointer text-left"
      style={{ left, top, width: NODE_W }}
      title={`进入「${j.title}」`}
    >
      {hideTitle ? null : (
        // 屏名完整显示：长了就往上换行(底边贴着截图)
        <span className="relative block" style={{ height: TITLE_H }}>
          <span
            className={`absolute bottom-[6px] left-0 flex w-full items-start gap-1 text-[12px] font-medium leading-[15px] ${edge ? "text-[#c2410c]" : "text-[#1a1a2e]"}`}
          >
            {edge ? <TriangleAlert size={12} className="mt-[1.5px] shrink-0" /> : null}
            <span>{j.title}</span>
          </span>
        </span>
      )}
      <span className="block overflow-hidden rounded-[18px] ring-1 ring-black/[0.08] transition-shadow group-hover:ring-2 group-hover:ring-[#ff5e1a]" style={{ width: NODE_W, height: SHOT_H }}>
        <Shot journey={j} />
      </span>
      {annos?.length ? <Annotations annos={annos} shotTop={hideTitle ? 0 : TITLE_H} /> : null}
      {tag ? (
        // 标签完整显示，长了就换行
        <span className={`mt-1.5 block rounded-[10px] px-2 py-0.5 text-center text-[10.5px] leading-[14px] ${edge ? "bg-[#fff1e6] text-[#c2410c]" : "bg-[#eef0f6] text-[#3a3b45]"}`}>
          {tag}
        </span>
      ) : null}
    </div>
  );
}

/**
 * 截图标注：元素本身不加框 / 点，竖引线从截图上方带编号的标注文字连到元素上沿(像 Figma 批注)
 */
function Annotations({ annos, shotTop }: { annos: FlowAnno[]; shotTop: number }) {
  // 上面的元素对应靠下的文字，引线不交叉
  const sorted = [...annos].sort((a, b) => a.y - b.y);
  return (
    <span className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
      {sorted.map((a, i) => {
        const w = (a.w ?? 32) * SHOT;
        const h = (a.h ?? 32) * SHOT;
        const boxLeft = a.x * SHOT - w / 2;
        const boxTop = shotTop + a.y * SHOT - h / 2;
        const lineX = boxLeft + w / 2;
        const labelTop = -30 - (sorted.length - 1 - i) * ANNO_STEP - (shotTop ? 0 : TITLE_H);
        return (
          <span key={a.text}>
            {/* 元素本身不加任何框和点：引线停在元素上沿外，末端一个小圆点 */}
            <span className="absolute w-px" style={{ left: lineX, top: labelTop + 20, height: boxTop - labelTop - 20 - 3, backgroundColor: ANNO }} />
            <span className="absolute size-[5px] rounded-full" style={{ left: lineX - 2, top: boxTop - 5, backgroundColor: ANNO }} />
            <span
              className="absolute flex h-5 items-center gap-1 whitespace-nowrap rounded-md bg-white pl-1 pr-1.5 text-[11px] font-medium"
              style={{ left: lineX - 9, top: labelTop, color: ANNO, boxShadow: `inset 0 0 0 1px ${ANNO}55, 0 1px 2px rgba(0,0,0,0.08)` }}
            >
              <span className="flex size-[14px] items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: ANNO }}>
                {i + 1}
              </span>
              {a.text}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** 缩小的手机屏外框(只看，不可点) */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none origin-top-left" style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${SHOT})` }} inert>
      {/* 和真机一样不显示网页滚动条 */}
      <div className="hide-scrollbars relative overflow-hidden bg-[#0f0f13]" style={{ width: SCREEN_W, height: SCREEN_H, fontFamily: APPLE_FONT }}>
        {children}
        <StatusBar tint="light" />
      </div>
    </div>
  );
}

/** 一张「截图」:用这条旅程的预置状态挂一个缩小的真机屏 */
function Shot({ journey }: { journey: Journey }) {
  const preset = buildPreset(journey);
  return (
    <Frame>
      {journey.phase === "home" ? (
        <HomeScreen onLaunch={() => {}} scale={SHOT} screenRef={{ current: null }} />
      ) : journey.phase === "splash" ? (
        <InsetsProvider value={{ top: 62, bottom: 34 }}>
          <div className="absolute inset-0 flex flex-col">
            <Splash />
          </div>
        </InsetsProvider>
      ) : (
        // 静帧：会自己往下走的屏(Face ID 等)停在这一帧
        <StillContext.Provider value>
          <AppProvider reducer={demoReducer} initialState={preset.state} initialNav={preset.nav}>
            <InsetsProvider value={{ top: 62, bottom: 34 }}>
              <div className="absolute inset-0 flex flex-col">
                <App />
              </div>
            </InsetsProvider>
          </AppProvider>
        </StillContext.Provider>
      )}
    </Frame>
  );
}
