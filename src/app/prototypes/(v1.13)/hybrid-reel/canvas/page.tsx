"use client";

/* Canvas —— agent 里点 Edit in canvas 之后落到这里。
   所有素材都带过来:每条一个 sourceVideo 节点,整份 EDL 进一个剪辑器节点。

   为什么是一个剪辑器节点而不是 clip→生成→拼接三类节点(偏离 Wilson PRD §5.4a F4a.1):
   10 条素材 + 3 个补拍 + 1 个拼接 = 14 个节点,用户打开即懵;
   而且补拍段是这条片子的一部分,不是独立产物,不该单独占一个节点。

   handoff 走 sessionStorage,单向 —— agent 会话保留上下文,但画布这边改动不回流。 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Film,
  Image as ImageIcon,
  Sparkles,
  Play,
  Zap,
  Scissors,
  Type,
  Wand2,
  Music,
  Ban,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  HANDOFF_KEY,
  ROLE_META,
  type Handoff,
  type Role,
  type Shot,
} from "../agent/chat/types";
import { APPLE_FONT } from "../agent/chat/shell";

type Tab = "clip" | "subtitle" | "regen" | "audio";

const SUB_STYLES = {
  1: { name: "Clean", cls: "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" },
  2: { name: "Boxed", cls: "bg-black/80 px-2 py-1 text-white" },
  3: { name: "Pop", cls: "bg-[#ff5e1a] px-2 py-1 text-white -rotate-1" },
} as const;

export default function HybridReelCanvas() {
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Handoff;
        setHandoff(parsed);
        setShots(parsed.outline.shots);
      }
    } catch {
      /* 读不到就走空态 */
    }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!handoff) {
    return (
      <div
        className="grid min-h-dvh place-items-center bg-[#faf8f6] px-6 text-center"
        style={{ fontFamily: APPLE_FONT }}
      >
        <div>
          <p className="text-[16px] font-bold text-[#1a1a2e]">画布是空的</p>
          <p className="mt-1.5 text-[14px] text-[#6a6b7b]">
            先在 agent 里上传素材、确认分镜方案,再点 Edit in canvas 过来。
          </p>
          <Link
            href="/prototypes/hybrid-reel/agent/chat"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white"
          >
            <ArrowLeft className="size-4" /> 回到 agent
          </Link>
        </div>
      </div>
    );
  }

  const { profiles, outline, brief } = handoff;
  const totalSec = shots.reduce((n, s) => n + s.durationSec, 0);
  const generated = shots.filter((s) => s.source.kind === "generate").length;
  const credits = outline.credits.base + outline.credits.perGenerateShot * generated;

  return (
    <div className="min-h-dvh bg-[#faf8f6]" style={{ fontFamily: APPLE_FONT }}>
      <header className="flex flex-wrap items-center gap-3 border-b border-[#ececf1] bg-white px-6 py-3">
        <Link
          href="/prototypes/hybrid-reel/agent/chat"
          className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
        >
          <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" /> Back to agent
        </Link>
        <span className="h-4 w-px bg-[#ececf1]" />
        <span className="text-[15px] font-extrabold tracking-tight text-[#1a1a2e]">
          Hybrid Reel — {brief.platform} {brief.durationSec}s
        </span>
        <span className="ml-auto text-[12.5px] text-[#9a9bb0]">Canvas · auto-arranged</span>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        <div
          className="rounded-[22px] border border-[#ececf1] p-6"
          style={{
            backgroundColor: "#fff",
            backgroundImage: "radial-gradient(#e7e5ec 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="flex flex-col items-stretch gap-4 lg:flex-row">
            {/* 素材节点 —— 全部带过来了 */}
            <div className="flex w-full shrink-0 flex-col justify-center gap-2 lg:w-[210px]">
              {profiles.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-2 rounded-xl border border-[#ececf1] bg-white p-2 shadow-[0_2px_8px_rgba(26,26,46,0.05)]"
                >
                  <span className="size-9 shrink-0 overflow-hidden rounded-lg bg-[#f4f4f7]">
                    {p.objectUrl ? (
                      p.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.objectUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <video src={p.objectUrl} muted className="size-full object-cover" />
                      )
                    ) : (
                      <span className="grid size-full place-items-center text-[#9a9bb0]">
                        {p.kind === "image" ? (
                          <ImageIcon className="size-3.5" />
                        ) : (
                          <Film className="size-3.5" />
                        )}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold text-[#1a1a2e]">
                      {p.label}
                    </span>
                    <span className="block text-[10.5px] text-[#9a9bb0]">sourceVideo</span>
                  </span>
                  <span className="size-2 shrink-0 rounded-full bg-[#ff9a3d]" />
                </div>
              ))}
            </div>

            <svg
              className="hidden w-[60px] shrink-0 self-stretch lg:block"
              viewBox="0 0 60 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              {profiles.map((_, i) => {
                const y = ((i + 0.5) / profiles.length) * 100;
                return (
                  <path
                    key={i}
                    d={`M0 ${y} C 28 ${y}, 32 50, 60 50`}
                    fill="none"
                    stroke="#ffbd99"
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {/* 剪辑器节点 */}
            <div className="flex min-w-0 flex-1 items-center">
              <div className="w-full rounded-2xl border-2 border-[#ff5e1a] bg-white p-4 shadow-[0_10px_28px_rgba(255,94,26,0.16)]">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-extrabold text-[#1a1a2e]">
                      Hybrid Reel editor
                    </span>
                    <span className="block text-[11px] text-[#9a9bb0]">
                      hybridReelEditor · {shots.length} shots · {totalSec.toFixed(1)}s
                    </span>
                  </span>
                  <span className="ml-auto size-2 shrink-0 rounded-full bg-[#ff5e1a]" />
                </div>

                <div className="mt-3 flex h-8 gap-[3px] overflow-hidden rounded-lg">
                  {shots.map((s, i) => {
                    const m = ROLE_META[s.role] ?? ROLE_META.hook;
                    const blocked = s.source.kind === "blocked";
                    return (
                      <span
                        key={i}
                        title={`${m.label} · ${s.durationSec}s`}
                        className="relative grid min-w-0 place-items-center truncate px-1 text-[10px] font-bold text-white"
                        style={{ flexGrow: s.durationSec, background: blocked ? "#c6c8d4" : m.color }}
                      >
                        {s.source.kind === "generate" && (
                          <span className="absolute right-1 top-1 size-1.5 rounded-full bg-white" />
                        )}
                        {m.label}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#ececf1] bg-white px-4 py-2.5 text-[14px] font-bold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
                  >
                    <Play className="size-4" /> Open editor
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105"
                  >
                    <Zap className="size-4" /> Render
                  </button>
                  <span className="text-[12px] text-[#9a9bb0]">
                    {credits.toLocaleString("en-US")} credits — charged when you render
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-dashed border-[#e0dfe6] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#6a6b7b]">
          素材全部带过来了,整份 EDL 写进剪辑器节点 —— 不是 clip / 生成 / 拼接三类节点铺一屏。
          点 Open editor 做四类微调:换片段与剪头尾、改字幕、重生某一个 AI 镜头、换配乐。
        </p>
      </main>

      {editorOpen && (
        <EditorPanel
          shots={shots}
          setShots={setShots}
          profiles={profiles}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}

/* ── 剪辑器 ── */
function EditorPanel({
  shots,
  setShots,
  profiles,
  onClose,
}: {
  shots: Shot[];
  setShots: (s: Shot[]) => void;
  profiles: Handoff["profiles"];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<Tab>("clip");
  const [styleId, setStyleId] = useState<1 | 2 | 3>(1);
  const [ducking, setDucking] = useState(35);
  const [busy, setBusy] = useState(false);

  const shot = shots[index] ?? shots[0];
  const meta = ROLE_META[shot.role] ?? ROLE_META.hook;
  const clip = shot.source.kind === "clip" ? profiles[shot.source.clipIndex] : undefined;

  const patch = (next: Partial<Shot>) =>
    setShots(shots.map((s, i) => (i === index ? { ...s, ...next } : s)));

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-[#1a1a2e]/45 px-4 py-6">
      <div className="flex max-h-full w-full max-w-[1000px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(26,26,46,0.3)]">
        <div className="flex items-center gap-3 border-b border-[#ececf1] px-5 py-3">
          <span className="text-[15px] font-extrabold text-[#1a1a2e]">Hybrid Reel editor</span>
          <span className="text-[12.5px] text-[#9a9bb0]">
            one track — no keyframes, no masks, no curves
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f4f4f7]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            {/* 预览 */}
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-xl bg-[#1a1a2e]">
              {clip?.objectUrl ? (
                clip.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clip.objectUrl} alt="" className="size-full object-cover opacity-80" />
                ) : (
                  <video src={clip.objectUrl} muted loop autoPlay className="size-full object-cover" />
                )
              ) : (
                <div
                  className="grid size-full place-items-center"
                  style={{ background: `linear-gradient(160deg, ${meta.color}44 0%, #1a1a2e 62%)` }}
                >
                  <Play className="size-8 text-white/60" />
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-[3px] text-[10.5px] font-bold text-white">
                {meta.label} · {shot.durationSec}s
              </span>
              <span className="absolute inset-x-3 bottom-7 text-center">
                <span
                  className={`inline text-[13px] font-extrabold leading-snug ${SUB_STYLES[styleId].cls}`}
                  style={{ boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
                >
                  {shot.subtitle.text}
                </span>
              </span>
            </div>

            {/* 检查器 */}
            <div className="rounded-2xl border border-[#ececf1]">
              <div className="flex flex-wrap items-center gap-2 border-b border-[#ececf1] px-4 py-3">
                <span className="text-[12px] font-bold uppercase tracking-wide text-[#9a9bb0]">
                  This beat
                </span>
                <select
                  aria-label="Narrative role"
                  value={shot.role}
                  onChange={(e) => patch({ role: e.target.value as Role })}
                  className="rounded-full px-3 py-1 text-[13px] font-bold outline-none"
                  style={{ background: meta.soft, color: meta.color }}
                >
                  {Object.entries(ROLE_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <span className="text-[12.5px] text-[#6a6b7b]">{meta.blurb}</span>
              </div>

              <div className="flex gap-1 border-b border-[#ececf1] px-3 pt-2">
                {(
                  [
                    { id: "clip", label: "Clip", icon: Scissors },
                    { id: "subtitle", label: "Subtitle", icon: Type },
                    { id: "regen", label: "Reshoot", icon: Wand2 },
                    { id: "audio", label: "Audio", icon: Music },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[13px] font-bold transition ${
                      tab === t.id
                        ? "border-b-2 border-[#ff5e1a] text-[#ff5e1a]"
                        : "border-b-2 border-transparent text-[#6a6b7b] hover:text-[#1a1a2e]"
                    }`}
                  >
                    <t.icon className="size-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              <div className="min-h-[170px] p-4">
                {tab === "clip" &&
                  (shot.source.kind === "clip" ? (
                    <div className="space-y-3">
                      <select
                        aria-label="Swap footage"
                        value={shot.source.clipIndex}
                        onChange={(e) =>
                          patch({
                            source: {
                              kind: "clip",
                              clipIndex: Number(e.target.value),
                              inSec: 0,
                              outSec: shot.durationSec,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-[#ececf1] px-3 py-2.5 text-[13.5px] font-semibold text-[#1a1a2e]"
                      >
                        {profiles.map((p, i) => (
                          <option key={p.label} value={i}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <label className="block text-[12.5px] font-bold uppercase tracking-wide text-[#9a9bb0]">
                        Length — {shot.durationSec}s
                        <input
                          type="range"
                          min={1}
                          max={12}
                          step={0.5}
                          value={shot.durationSec}
                          onChange={(e) => patch({ durationSec: Number(e.target.value) })}
                          className="mt-1.5 w-full accent-[#ff5e1a]"
                        />
                      </label>
                      <p className="text-[12.5px] text-[#9a9bb0]">Free — re-renders from the edit list.</p>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-[#e0dfe6] bg-[#faf8f6] p-3 text-[13px] text-[#1a1a2e]">
                      {shot.source.kind === "generate"
                        ? "This beat is generated — swap in your own footage and it stops being a generated shot."
                        : "We won't generate this one. Shoot it yourself and drop it in."}
                    </p>
                  ))}

                {tab === "subtitle" && (
                  <div className="space-y-3">
                    <textarea
                      aria-label="Subtitle text"
                      rows={3}
                      value={shot.subtitle.text}
                      onChange={(e) => patch({ subtitle: { ...shot.subtitle, text: e.target.value } })}
                      className="w-full resize-none rounded-xl border border-[#ececf1] px-3 py-2.5 text-[13.5px] text-[#1a1a2e] outline-none focus-visible:border-[#ff5e1a]"
                    />
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setStyleId(id)}
                          className={`flex-1 rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                            styleId === id
                              ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]"
                              : "border-[#ececf1] text-[#6a6b7b]"
                          }`}
                        >
                          {SUB_STYLES[id].name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tab === "regen" &&
                  (shot.source.kind === "generate" ? (
                    <div className="space-y-3">
                      <textarea
                        aria-label="Generation prompt"
                        rows={4}
                        value={shot.source.prompt}
                        onChange={(e) =>
                          patch({
                            source: {
                              ...(shot.source as Extract<Shot["source"], { kind: "generate" }>),
                              prompt: e.target.value,
                            },
                          })
                        }
                        className="w-full resize-none rounded-xl border border-[#ececf1] px-3 py-2.5 text-[13px] text-[#1a1a2e] outline-none focus-visible:border-[#ff5e1a]"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setBusy(true);
                          window.setTimeout(() => setBusy(false), 900);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                        {busy ? "Reshooting…" : "Reshoot this shot"}
                      </button>
                      <p className="text-[12.5px] text-[#9a9bb0]">
                        seedance-2.5 · only this shot, not the whole reel
                      </p>
                    </div>
                  ) : (
                    <p className="flex items-start gap-2 rounded-xl border border-dashed border-[#e0dfe6] bg-[#faf8f6] p-3 text-[13px] text-[#1a1a2e]">
                      <Ban className="mt-0.5 size-4 shrink-0 text-[#6a6b7b]" />
                      This beat uses your own footage — change it under Clip instead.
                    </p>
                  ))}

                {tab === "audio" && (
                  <label className="block text-[12.5px] font-bold uppercase tracking-wide text-[#9a9bb0]">
                    Music under voice — {ducking}%
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={ducking}
                      onChange={(e) => setDucking(Number(e.target.value))}
                      className="mt-2 w-full accent-[#ff5e1a]"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* 平面时间线 */}
          <div className="mt-4 rounded-2xl border border-[#ececf1] p-3">
            <div className="flex gap-1.5">
              {shots.map((s, i) => {
                const m = ROLE_META[s.role] ?? ROLE_META.hook;
                const active = i === index;
                const blocked = s.source.kind === "blocked";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    style={{
                      flexGrow: s.durationSec,
                      background: blocked ? "#f1f0f4" : m.soft,
                      borderColor: active ? m.color : "transparent",
                    }}
                    className="min-w-0 rounded-xl border-2 px-2.5 py-2 text-left transition"
                  >
                    <span
                      className="block truncate text-[12px] font-extrabold"
                      style={{ color: blocked ? "#6a6b7b" : m.color }}
                    >
                      {m.label}
                    </span>
                    <span className="block text-[11px] text-[#6a6b7b]">{s.durationSec}s</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
