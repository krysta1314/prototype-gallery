"use client";

/* MCP Skill 库：调研结果 + 挑选要做的 Skill。
   数据全部在 content.ts;勾选「要做」只存在本机浏览器里，用来讨论，不落库。 */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle2,
  CircleDashed,
  ClipboardCopy,
  FlaskConical,
  Search,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { useToast } from "../../(v1.7)/blog/toast";
import {
  BATCHES,
  CAPS,
  DECIDED,
  LIVE_ON_DEV,
  TRY_PROMPTS,
  NOT_DOING,
  PRODUCT_ASKS,
  RESEARCH,
  RULES,
  SKILLS,
  TEST_RUN,
  type Batch,
  type Category,
  type Skill,
} from "./content";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const gradText = "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#ff5e1a]";

const STORE_KEY = "mcp-skill-library:picked";
const RECOMMENDED = DECIDED;

const batchLabel = (b: Batch) => BATCHES.find((x) => x.id === b)!.label;

function usePicked() {
  const [picked, setPicked] = useState<string[]>(RECOMMENDED);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // 2026-10-30 两个 slug 改名(旧名在 dev-admin 被占用)，旧勾选记录跟着换
      const RENAMED: Record<string, string> = { "ai-video-editor": "video-editor", "product-photoshoot": "product-photos" };
      if (raw) setPicked((JSON.parse(raw) as string[]).map((x) => RENAMED[x] ?? x));
    } catch {}
  }, []);
  const save = (next: string[]) => {
    setPicked(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {}
  };
  return [picked, save] as const;
}

export default function McpSkillLibrary() {
  const [notify, toastNode] = useToast();
  const [picked, setPicked] = usePicked();
  const [batch, setBatch] = useState<Batch | "all">("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [onlyHigh, setOnlyHigh] = useState(false);
  const [pickView, setPickView] = useState<"all" | "picked" | "unpicked">("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => Array.from(new Set(SKILLS.map((s) => s.category))), []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SKILLS.filter(
      (s) =>
        (batch === "all" || s.batch === batch) &&
        (category === "all" || s.category === category) &&
        (!onlyHigh || s.value === "高") &&
        (pickView === "all" || (pickView === "picked") === picked.includes(s.slug)) &&
        (!q || [s.slug, s.name, s.what, s.refs].some((f) => f.toLowerCase().includes(q))),
    );
  }, [batch, category, onlyHigh, pickView, query, picked]);

  const toggle = (slug: string) =>
    setPicked(picked.includes(slug) ? picked.filter((x) => x !== slug) : [...picked, slug]);

  const copyPicked = async () => {
    const rows = SKILLS.filter((s) => picked.includes(s.slug)).map(
      (s) => `${batchLabel(s.batch)}\t${s.slug}\t${s.name}`,
    );
    try {
      await navigator.clipboard.writeText(rows.join("\n"));
      notify(`已复制 ${rows.length} 个 Skill`);
    } catch {
      notify("复制失败，请手动选择", "error");
    }
  };

  const tested = SKILLS.filter((s) => LIVE_ON_DEV.has(s.slug)).length;
  const high = SKILLS.filter((s) => s.value === "高").length;

  return (
    <div style={{ fontFamily: APPLE_FONT }} className="min-h-screen bg-white text-[#1a1a2e]">
      {toastNode}

      {/* Hero */}
      <header className="relative overflow-hidden bg-[linear-gradient(160deg,#ffe7d2_0%,#ffffff_52%,#ffdedf_100%)] px-6 pb-14 pt-16">
        <div className="mx-auto max-w-6xl">
          <span className={kicker}>MCP Skill 库</span>
          <h1 className="mt-5 text-[clamp(34px,5.5vw,58px)] font-extrabold leading-[1.08] tracking-tight">
            BuzzVideo MCP 要配哪些 <span className={gradText}>Skill</span>
          </h1>
          <p className="mt-4 max-w-[720px] text-[17px] leading-relaxed text-[#6a6b7b]">
            汇总 Skill 市场、竞品平台、爆款玩法三路调研，加上已经跑通的 demo 流程，共 {SKILLS.length}{" "}
            个候选。默认勾上已选定的 {DECIDED.length} 个;改动勾选只保存在你这台电脑的浏览器里。
          </p>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: SKILLS.length, l: "候选 Skill" },
              { n: high, l: "高商业价值" },
              { n: tested, l: "已上线 dev 并测通" },
              { n: picked.length, l: "已选要做", hot: true },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)] backdrop-blur"
              >
                <div
                  className={`text-[clamp(30px,4vw,40px)] font-extrabold tabular-nums ${s.hot ? gradText : ""}`}
                >
                  {s.n}
                </div>
                <div className="text-[13px] font-semibold text-[#6a6b7b]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* 测试记录 */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[260px_1fr]">
          <div className="mx-auto w-full max-w-[260px]">
            <video
              src={TEST_RUN.video}
              poster={TEST_RUN.poster}
              controls
              playsInline
              className="aspect-[9/16] w-full rounded-[22px] bg-[#141414] object-cover shadow-[0_16px_36px_rgba(26,26,46,0.2)]"
            />
          </div>
          <div>
            <span className={kicker}>首条测试</span>
            <h2 className="mt-4 text-[clamp(26px,3.6vw,36px)] font-extrabold tracking-tight">
              <code className="rounded-lg bg-[#fff3ec] px-2 py-0.5 text-[0.8em] text-[#ff5e1a]">{TEST_RUN.slug}</code>{" "}
              测通了
            </h2>
            <p className="mt-2 text-[15px] text-[#6a6b7b]">
              {TEST_RUN.date} · {TEST_RUN.brief}
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#b7e6cb] bg-[#f3fbf6] p-6">
                <div className="flex items-center gap-2 text-[15px] font-bold text-[#166c40]">
                  <CheckCircle2 className="size-5" /> 跑通了
                </div>
                <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed">
                  {TEST_RUN.passed.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-1 size-3.5 shrink-0 text-[#1a7f4b]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#ffe0c7] bg-[#fff7f1] p-6">
                <div className="flex items-center gap-2 text-[15px] font-bold text-[#c2410c]">
                  <Wrench className="size-5" /> 已写回 Skill(v2)
                </div>
                <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed">
                  {TEST_RUN.todo.map((t) => (
                    <li key={t} className="flex gap-2">
                      <CircleDashed className="mt-1 size-3.5 shrink-0 text-[#ff5e1a]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 写法规则 */}
      <section className="bg-[#faf8f6] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <span className={kicker}>写法规则</span>
          <h2 className="mt-4 text-[clamp(26px,3.6vw,36px)] font-extrabold tracking-tight">每条 Skill 都要遵守</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RULES.map((r, i) => (
              <div
                key={r.title}
                className={`rounded-2xl bg-white p-6 shadow-[0_4px_16px_rgba(26,26,46,0.06)] ${
                  r.must ? "ring-2 ring-[#ff5e1a]/40" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-[15px] font-extrabold text-white">
                    {i + 1}
                  </div>
                  {r.must && (
                    <span className="rounded-full bg-[#fff0f0] px-2.5 py-1 text-[12px] font-bold text-[#c22f32]">
                      必做 · 审核角色
                    </span>
                  )}
                </div>
                <div className="mt-4 text-[16px] font-bold">{r.title}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#6a6b7b]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill 清单 */}
      <section className="px-6 py-16" id="catalog">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className={kicker}>Skill 清单</span>
              <h2 className="mt-4 text-[clamp(26px,3.6vw,36px)] font-extrabold tracking-tight">挑出要做的</h2>
              {/* 按是否选中筛选:分段控件，选项只有 3 个，一眼看全 */}
              <div role="radiogroup" aria-label="按是否选中筛选" className="mt-4 inline-flex rounded-xl bg-[#f3f4f6] p-1">
                {(
                  [
                    { id: "all", label: "全部", n: SKILLS.length },
                    { id: "picked", label: "已选", n: SKILLS.filter((s) => picked.includes(s.slug)).length },
                    { id: "unpicked", label: "未选", n: SKILLS.filter((s) => !picked.includes(s.slug)).length },
                  ] as const
                ).map((o) => {
                  const active = pickView === o.id;
                  return (
                    <button
                      key={o.id}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPickView(o.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[14px] font-bold transition ${
                        active ? "bg-white text-[#1a1a2e] shadow-[0_1px_4px_rgba(26,26,46,0.12)]" : "text-[#6a6b7b] hover:text-[#1a1a2e]"
                      }`}
                    >
                      {o.label}
                      <span className={`tabular-nums text-[12px] ${active ? "text-[#ff5e1a]" : "text-[#9a9bab]"}`}>{o.n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPicked(RECOMMENDED);
                  notify(`已恢复为选定的 ${DECIDED.length} 个`, "info");
                }}
                className="rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-[14px] font-bold transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
              >
                恢复选定清单
              </button>
              <button
                onClick={copyPicked}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2.5 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105"
              >
                <ClipboardCopy className="size-4" /> 复制已选({picked.length})
              </button>
            </div>
          </div>

          {/* 筛选 */}
          <div className="z-20 -mx-6 mt-8 md:sticky md:top-0 border-b border-[#ececf1] bg-white/95 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", ...BATCHES.map((b) => b.id)] as (Batch | "all")[]).map((b) => {
                const active = batch === b;
                const n = b === "all" ? SKILLS.length : SKILLS.filter((s) => s.batch === b).length;
                return (
                  <button
                    key={String(b)}
                    onClick={() => setBatch(b)}
                    className={`rounded-full px-4 py-2 text-[14px] font-bold transition ${
                      active
                        ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_18px_rgba(255,82,85,0.25)]"
                        : "border border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"
                    }`}
                  >
                    {b === "all" ? "全部" : batchLabel(b)} <span className="tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Toggle on={onlyHigh} set={setOnlyHigh} label="只看高价值" />
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9a9bab]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索 Skill、对标"
                    className="h-10 w-[200px] rounded-xl border border-[#ececf1] pl-9 pr-3 text-[14px] outline-none transition focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
                  />
                </label>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["all", ...categories] as (Category | "all")[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-2.5 py-1 text-[13px] font-semibold transition ${
                    category === c ? "bg-[#1a1a2e] text-white" : "bg-[#f3f4f6] text-[#6a6b7b] hover:bg-[#ececf1]"
                  }`}
                >
                  {c === "all" ? "全部分类" : c}
                </button>
              ))}
            </div>
          </div>

          {/* 分批展示 */}
          {BATCHES.filter((b) => batch === "all" || b.id === batch).map((b) => {
            const items = list.filter((s) => s.batch === b.id);
            if (!items.length) return null;
            return (
              <div key={String(b.id)} className="mt-10">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-[22px] font-extrabold tracking-tight">{b.label}</h3>
                  <span className="text-[14px] text-[#6a6b7b]">{b.hint}</span>
                  <span className="ml-auto text-[13px] tabular-nums text-[#9a9bab]">{items.length} 个</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <SkillCard key={s.slug} s={s} on={picked.includes(s.slug)} toggle={() => toggle(s.slug)} />
                  ))}
                </div>
              </div>
            );
          })}
          {!list.length && (
            <div className="mt-12 rounded-2xl border border-dashed border-[#ececf1] p-10 text-center text-[#6a6b7b]">
              没有符合筛选条件的 Skill
            </div>
          )}

          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-[#ececf1] bg-[#faf8f6] p-5 text-[14px]">
            <Ban className="mt-0.5 size-4 shrink-0 text-[#9a9bab]" />
            <div>
              <span className="font-bold">暂不做：</span>
              {NOT_DOING.map((n) => (
                <span key={n.name}>
                  {n.name} —— <span className="text-[#6a6b7b]">{n.why}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 产品建议 */}
      <section className="bg-[#faf8f6] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <span className={kicker}>产品建议</span>
          <h2 className="mt-4 text-[clamp(26px,3.6vw,36px)] font-extrabold tracking-tight">MCP 本身要补的能力</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_ASKS.map((a, i) => (
              <div key={a.title} className="rounded-2xl bg-white p-7 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#ff5e1a]" />
                  <span className="text-[17px] font-bold">{a.title}</span>
                  {i === 0 && (
                    <span className="rounded-full bg-[#fff3ec] px-2 py-0.5 text-[12px] font-bold text-[#ff5e1a]">
                      Monica 点名
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6a6b7b]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 调研来源 */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <span className={kicker}>调研结论</span>
          <h2 className="mt-4 text-[clamp(26px,3.6vw,36px)] font-extrabold tracking-tight">三路调研看到了什么</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {RESEARCH.map((r) => (
              <div key={r.title} className="flex flex-col rounded-2xl border border-[#ececf1] bg-white p-7">
                <div className="flex items-baseline justify-between">
                  <div className="text-[18px] font-bold">{r.title}</div>
                  <div className="text-[13px] font-semibold text-[#ff5e1a]">{r.count}</div>
                </div>
                <ul className="mt-4 space-y-3 text-[14px] leading-relaxed">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#ff5e1a]" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#9a9bab]">来源</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener"
                        className="group flex items-center gap-1 rounded-lg bg-[#f3f4f6] px-2.5 py-1 text-[12px] font-semibold text-[#1a1a2e] transition hover:bg-[#fff3ec] hover:text-[#ff5e1a]"
                      >
                        {s.label}
                        <ArrowUpRight className="size-3 transition group-hover:translate-x-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Toggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => set(!on)}
      aria-pressed={on}
      className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-bold transition ${
        on ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]" : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"
      }`}
    >
      <span
        className={`flex size-4 items-center justify-center rounded border ${on ? "border-[#ff5e1a] bg-[#ff5e1a]" : "border-[#d4d3df]"}`}
      >
        {on && <Check className="size-3 text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

function SkillCard({ s, on, toggle }: { s: Skill; on: boolean; toggle: () => void }) {
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md ${
        on ? "border-[#ffb37a] shadow-[0_0_0_3px_rgba(255,94,26,0.10)]" : "border-[#ececf1]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-[#f3f4f6] px-1.5 py-0.5 text-[11px] font-semibold text-[#6a6b7b]">
              {s.category}
            </span>
            {s.value === "高" && (
              <span className="flex items-center gap-0.5 rounded-md bg-[#fff3ec] px-1.5 py-0.5 text-[11px] font-bold text-[#ff5e1a]">
                <Star className="size-3 fill-current" /> 高价值
              </span>
            )}
            {LIVE_ON_DEV.has(s.slug) && (
              <span className="flex items-center gap-0.5 rounded-md bg-[#e8f7ef] px-1.5 py-0.5 text-[11px] font-bold text-[#166c40]">
                <FlaskConical className="size-3" /> 已测通
              </span>
            )}
            {s.proven && !LIVE_ON_DEV.has(s.slug) && (
              <span className="rounded-md bg-[#eef2ff] px-1.5 py-0.5 text-[11px] font-bold text-[#4f46e5]">
                已有 demo 流程
              </span>
            )}
          </div>
          <div className="mt-2.5 text-[17px] font-bold leading-snug">{s.name}</div>
          <code className="text-[12px] text-[#9a9bab]">{s.slug}</code>
        </div>
        <button
          onClick={toggle}
          aria-pressed={on}
          className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[13px] font-bold transition ${
            on
              ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white"
              : "border border-[#ececf1] text-[#6a6b7b] hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
          }`}
        >
          {on && <Check className="size-3.5" strokeWidth={3} />}
          {on ? "要做" : "选"}
        </button>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed">{s.what}</p>
      {TRY_PROMPTS[s.slug] && (
        <p className="mt-2 rounded-lg bg-[#f3fbf6] px-3 py-2 text-[12px] leading-relaxed text-[#166c40]">
          试试这样说:「{TRY_PROMPTS[s.slug]}」
        </p>
      )}
      {s.flow && <p className="mt-2 text-[13px] leading-relaxed text-[#6a6b7b]">流程：{s.flow}</p>}

      <div className="mt-3 flex flex-wrap gap-1">
        {s.caps.map((c) => (
          <span
            key={c}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              c === "new" ? "bg-[#fff0f0] text-[#c22f32]" : c === "data" ? "bg-[#eef2ff] text-[#4f46e5]" : "bg-[#f7f7f9] text-[#6a6b7b]"
            }`}
          >
            {CAPS[c]}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-4">
        {s.note && (
          <div className="mb-2 rounded-lg bg-[#fff7f1] px-3 py-2 text-[12px] leading-relaxed text-[#c2410c]">{s.note}</div>
        )}
        <div className="border-t border-[#f1f1f4] pt-3 text-[12px] leading-relaxed text-[#9a9bab]">对标：{s.refs}</div>
      </div>
    </article>
  );
}
