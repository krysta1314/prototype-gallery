"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Monitor,
  RotateCw,
  Search,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { ALL_FEATURES, FEATURE_GROUPS, STATUS_META, type Feature, type FeatureStatus } from "./features";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif';

const STATUS_ICON: Record<FeatureStatus, typeof CircleCheck> = {
  done: CircleCheck,
  partial: CircleDot,
  gap: CircleAlert,
};

const STATUS_DOT: Record<FeatureStatus, string> = {
  done: "text-[#0f7a5a]",
  partial: "text-[#b06a1c]",
  gap: "text-[#c9432a]",
};

/** 预览用的逻辑视口。原型是桌面布局(lg 断点 1024),所以按 1440 渲染再等比缩放 */
const FRAME = { desktop: { w: 1440, h: 900 }, mobile: { w: 414, h: 860 } };

/**
 * 内嵌预览一律加 preview=1:原型在这个模式下不读也不写 localStorage,
 * 状态完全由链接上的参数决定。否则会继承上一次走查留下的残留状态,
 * 看到的就不是这条功能该有的界面。
 */
function previewSrc(href: string) {
  return href.includes("?") ? `${href}&preview=1` : `${href}?preview=1`;
}

export default function TeamReviewPage() {
  const [activeId, setActiveId] = useState(ALL_FEATURES[0]!.id);
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return FEATURE_GROUPS.map((group) => ({
      ...group,
      features: group.features.filter((f) => {
        if (onlyOpen && f.status === "done" && !f.open?.length) return false;
        if (!needle) return true;
        return (
          f.title.toLowerCase().includes(needle) ||
          f.intent.toLowerCase().includes(needle) ||
          f.cases.some((c) => c.toLowerCase().includes(needle))
        );
      }),
    })).filter((group) => group.features.length > 0);
  }, [q, onlyOpen]);

  const active: Feature = ALL_FEATURES.find((f) => f.id === activeId) ?? ALL_FEATURES[0]!;

  const tally = useMemo(() => {
    const counts = { done: 0, partial: 0, gap: 0 } as Record<FeatureStatus, number>;
    ALL_FEATURES.forEach((f) => (counts[f.status] += 1));
    return counts;
  }, []);

  return (
    <div className="flex min-h-screen bg-[#faf9fb] text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      {/* ── 左:功能清单,按用户旅程分段 ── */}
      <aside className="sticky top-0 flex h-screen w-[272px] shrink-0 flex-col border-r border-[#ececf1] bg-white">
        <div className="border-b border-[#f0eef2] px-4 py-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#a8a2ae]">评审清单</p>
          <h1 className="mt-1 text-[16px] font-bold tracking-[-0.02em]">Team Workspace 功能列表</h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {(["done", "partial", "gap"] as FeatureStatus[]).map((s) => (
              <span key={s} className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${STATUS_META[s].tone}`}>
                {STATUS_META[s].label} {tally[s]}
              </span>
            ))}
          </div>

          <label className="mt-3 flex h-9 items-center gap-2 rounded-xl border border-[#ececf1] px-3 transition focus-within:border-[#ff5e1a]">
            <Search className="size-3.5 shrink-0 text-[#b4aeb8]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜功能或边界状态"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#b4aeb8]"
            />
          </label>

          <button
            type="button"
            aria-pressed={onlyOpen}
            onClick={() => setOnlyOpen((v) => !v)}
            className={`mt-2 h-8 w-full rounded-lg text-[12px] font-bold transition ${
              onlyOpen ? "bg-[#24202a] text-white" : "bg-[#f6f4f7] text-[#706a78] hover:bg-[#efedf1]"
            }`}
          >
            只看有缺口 / 待决策的
          </button>

          {/* 徽章图例 —— 光一个数字看不出是什么 */}
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] leading-[1.5] text-[#9a94a0]">
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#fff3ec] px-1 py-px font-bold text-[#b06a1c]">
              <TriangleAlert className="size-2.5" />1
            </span>
            = 该功能有 1 条缺口 / 待决策
          </p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3" aria-label="功能列表">
          {groups.length === 0 ? (
            <p className="px-2 py-8 text-center text-[12.5px] text-[#9a94a0]">没有匹配的功能</p>
          ) : (
            groups.map((group) => (
              <section key={group.id} className="mb-4 last:mb-0">
                <div className="flex items-baseline gap-2 px-2 pb-1.5">
                  <span className="text-[10.5px] font-bold tabular-nums text-[#c3bcc8]">{group.stage}</span>
                  <h2 className="text-[11.5px] font-bold tracking-[-0.01em] text-[#56505c]">{group.title}</h2>
                </div>
                <ul className="grid gap-0.5">
                  {group.features.map((f) => {
                    const Icon = STATUS_ICON[f.status];
                    const isActive = f.id === activeId;
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setActiveId(f.id)}
                          aria-current={isActive ? "true" : undefined}
                          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                            isActive ? "bg-[#fff0ea] font-bold text-[#ee6545]" : "font-semibold text-[#3b3442] hover:bg-[#f6f4f7]"
                          }`}
                        >
                          <Icon className={`size-3.5 shrink-0 ${isActive ? "text-[#ee6545]" : STATUS_DOT[f.status]}`} />
                          <span className="min-w-0 flex-1 truncate text-[12.5px]">{f.title}</span>
                          {f.open?.length ? (
                            <span
                              title={`${f.open.length} 条缺口 / 待决策`}
                              aria-label={`${f.open.length} 条缺口或待决策`}
                              className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#fff3ec] px-1 py-px text-[10px] font-bold text-[#b06a1c]"
                            >
                              <TriangleAlert className="size-2.5" />
                              {f.open.length}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </nav>
      </aside>

      {/* ── 右:UI 预览 + 走查清单 ── */}
      <main className="min-w-0 flex-1">
        <FeaturePanel key={active.id} feature={active} />
      </main>
    </div>
  );
}

function FeaturePanel({ feature }: { feature: Feature }) {
  const group = FEATURE_GROUPS.find((g) => g.features.some((f) => f.id === feature.id))!;
  const meta = STATUS_META[feature.status];

  const [stateIdx, setStateIdx] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [nonce, setNonce] = useState(0);
  const link = feature.links[stateIdx];

  return (
    <div className="px-7 py-6">
      <header>
        <p className="flex items-center gap-2 text-[11.5px] font-semibold text-[#9a94a0]">
          <span className="tabular-nums">{group.stage}</span>
          <span>{group.title}</span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <h2 className="text-[22px] font-bold tracking-[-0.03em]">{feature.title}</h2>
          <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${meta.tone}`}>{meta.label}</span>
        </div>
        <p className="mt-2 max-w-[880px] text-[13.5px] leading-[1.6] text-[#4b4552]">{feature.intent}</p>
      </header>

      {/* 状态切换 + 视口 + 刷新 */}
      {feature.links.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#f1eff3] p-1">
            {feature.links.map((l, i) => (
              <button
                key={l.label + l.href}
                type="button"
                aria-pressed={i === stateIdx}
                onClick={() => setStateIdx(i)}
                className={`h-7 rounded-lg px-3 text-[12px] font-bold transition ${
                  i === stateIdx ? "bg-white text-[#28222e] shadow-sm" : "text-[#8a8490] hover:text-[#56505c]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-xl bg-[#f1eff3] p-1">
              {(
                [
                  ["desktop", Monitor],
                  ["mobile", Smartphone],
                ] as ["desktop" | "mobile", typeof Monitor][]
              ).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={key === "desktop" ? "桌面视口" : "移动视口"}
                  aria-pressed={device === key}
                  onClick={() => setDevice(key)}
                  className={`grid size-7 place-items-center rounded-lg transition ${
                    device === key ? "bg-white text-[#28222e] shadow-sm" : "text-[#8a8490] hover:text-[#56505c]"
                  }`}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              aria-label="重新加载预览"
              className="grid size-8 place-items-center rounded-xl border border-[#ececf1] bg-white text-[#8a8490] transition hover:border-[#ddd7df] hover:text-[#28222e]"
            >
              <RotateCw className="size-3.5" />
            </button>
            {link && (
              <Link
                href={link.href}
                target="_blank"
                className="flex h-8 items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-3 text-[12px] font-bold text-[#3b3442] transition hover:border-[#ffc7a9] hover:text-[#ff5e1a]"
              >
                新标签打开
                <ArrowUpRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* UI 预览 */}
      <div className="mt-3">
        {link ? (
          <Preview src={previewSrc(link.href)} device={device} nonce={nonce} caption={link.state} />
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-[#f0cf9e] bg-[#fffaf1] px-6 py-16 text-center">
            <TriangleAlert className="size-7 text-[#b06a1c]" />
            <p className="mt-3 text-[14px] font-bold text-[#8f5514]">这个功能原型里还没有</p>
            <p className="mt-1 max-w-[420px] text-[12.5px] leading-[1.6] text-[#8a6a41]">
              下面「边界状态与规则」是它该有的样子,可以直接当开发口径用。
            </p>
          </div>
        )}
      </div>

      {/* 走查清单 + 缺口 */}
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#a8a2ae]">
            边界状态与规则 · 逐条走查
          </h3>
          <ol className="mt-2.5">
            {feature.cases.map((c, i) => (
              <li key={c} className="flex gap-3 border-b border-[#f0eef2] py-2.5 last:border-b-0">
                <span className="mt-[3px] w-4 shrink-0 text-[11px] font-bold tabular-nums text-[#c3bcc8]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] leading-[1.6] text-[#3b3442]">{c}</span>
              </li>
            ))}
          </ol>
        </section>

        {feature.open?.length ? (
          <section className="self-start rounded-2xl border border-[#f0cf9e] bg-[#fffaf1] px-4 py-3.5">
            <h3 className="flex items-center gap-1.5 text-[12px] font-bold text-[#8f5514]">
              <TriangleAlert className="size-3.5" />
              缺口 / 待决策 · {feature.open.length} 条
            </h3>
            <ul className="mt-2 grid gap-1.5">
              {feature.open.map((o) => (
                <li key={o} className="flex gap-2 text-[12.5px] leading-[1.6] text-[#8a6a41]">
                  <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-[#b06a1c]" />
                  {o}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="self-start rounded-2xl border border-[#e6f0ea] bg-[#f4fbf7] px-4 py-3.5">
            <h3 className="text-[12px] font-bold text-[#0f7a5a]">没有已知缺口</h3>
            <p className="mt-1.5 text-[12.5px] leading-[1.6] text-[#3d7a63]">
              左边预览里逐条对一遍上面的规则,发现对不上的地方直接记在这条功能下。
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * 用 iframe 内嵌真实原型页面,而不是把界面重画一遍 —— 这样清单里看到的就是
 * 开发要照着做的那个页面本身,不会两边走样。
 * 原型是桌面布局,所以按固定逻辑宽度渲染再等比缩放到可用宽度。
 */
function Preview({
  src,
  device,
  nonce,
  caption,
}: {
  src: string;
  device: "desktop" | "mobile";
  nonce: number;
  caption?: string;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const size = FRAME[device];

  const measure = useCallback(() => {
    const w = holderRef.current?.clientWidth ?? 0;
    if (!w) return;
    setScale(Math.min(1, w / size.w));
  }, [size.w]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (holderRef.current) ro.observe(holderRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <figure className="m-0">
      <div
        ref={holderRef}
        className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_10px_30px_rgba(26,26,46,0.06)]"
        style={{ height: size.h * scale }}
      >
        <div style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <iframe
            key={`${src}-${nonce}-${device}`}
            src={src}
            title={caption ? `预览:${caption}` : "预览"}
            className="size-full border-0"
            loading="lazy"
          />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 flex items-center gap-2 text-[11.5px] text-[#9a94a0]">
          <span className="rounded bg-[#f1eff3] px-1.5 py-0.5 font-semibold text-[#706a78]">演示状态</span>
          {caption}
          <span className="ml-auto tabular-nums">{Math.round(scale * 100)}%</span>
        </figcaption>
      )}
    </figure>
  );
}
