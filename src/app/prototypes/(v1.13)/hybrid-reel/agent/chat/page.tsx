"use client";

/* Hybrid Reel · Agent 对话
   素材和 prompt 从落地页 composer 带进来(「+」→ Local Upload,再点 Create),
   这里不出上传卡。进来即分析;brief 六项能从 prompt 里抽到的不再问,只追问缺项(PRD F2.3);
   出方案后一个 Edit in canvas 带去画布。

   真模型:素材理解与分镜都走 BytePlus ARK(seed-2-0-lite-260428),经服务端
   /api/hybrid-reel/analyze 与 /outline,key 只在服务端。视频与音轨一起喂进去,
   所以「有无人声」不另跑 STT。 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  TriangleAlert,
  Wand2,
  Ban,
  Copy,
  Play,
  ArrowRight,
  Check,
} from "lucide-react";
import { APPLE_FONT, Composer, HistoryRail, IconRail, TopBar } from "./shell";
import { takePendingHandoff } from "./handoff";
import {
  HANDOFF_KEY,
  ROLE_META,
  type Brief,
  type ClipProfile,
  type Handoff,
  type Outline,
  type Role,
} from "./types";

/* ── brief 的六个必填项(PRD F2.2) ── */
const QUESTIONS: {
  key: keyof Brief;
  q: string;
  options: string[];
  parse?: (v: string) => string | number | string[];
}[] = [
  { key: "platform", q: "Where is this going to run?", options: ["IG Reels", "FB Reels", "TikTok"] },
  {
    key: "durationSec",
    q: "How long should the finished cut be?",
    options: ["15s", "20s", "30s"],
    parse: (v) => Number(v.replace(/\D/g, "")),
  },
  {
    key: "audience",
    q: "Who is it for?",
    options: ["Women 25–38 with sensitive skin", "Parents of under-5s", "People training at home"],
  },
  {
    key: "sellingPoints",
    q: "What do you want them to remember?",
    options: ["Works in 7 days", "Made in-house", "One size fits all"],
    parse: (v) => v.split(/[,;·]/).map((s) => s.trim()).filter(Boolean),
  },
  { key: "cta", q: "And what should they do next?", options: ["Shop the trial", "Book a demo", "Link in bio"] },
  { key: "subtitleLang", q: "Subtitle language?", options: ["English", "繁體中文", "Bahasa Indonesia"] },
];

type Message =
  | { id: string; kind: "agent"; text: string }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "files"; files: { name: string; url: string; isImage: boolean }[] }
  | { id: string; kind: "thinking"; text: string }
  | { id: string; kind: "profiles"; profiles: ClipProfile[]; model: string }
  | { id: string; kind: "question"; index: number; answered?: string }
  | { id: string; kind: "outline"; outline: Outline };

let seq = 0;
const nextId = () => `m${(seq += 1)}`;

export default function HybridReelChat() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<ClipProfile[]>([]);
  const [brief, setBrief] = useState<Partial<Brief>>({});
  /* 还没答的 brief 项(按 QUESTIONS 的下标)—— prompt 里抽到的不在这里 */
  const [queue, setQueue] = useState<number[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  /* 没带素材直接打开这一页(硬刷新 / 直链)→ 空态 */
  const [empty, setEmpty] = useState(false);

  const push = (...items: Message[]) => setMessages((prev) => [...prev, ...items]);
  const replaceLast = (item: Message) =>
    setMessages((prev) => [...prev.slice(0, -1), item]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const pendingQuestion = useMemo(() => {
    const last = messages[messages.length - 1];
    return last?.kind === "question" && last.answered === undefined ? last.index : null;
  }, [messages]);

  /* ── 从落地页带进来的素材 + prompt 起跑:分析与 brief 抽取并行 ── */
  const startFrom = async (files: File[], prompt: string) => {
    push({
      id: nextId(),
      kind: "files",
      files: files.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
        isImage: f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name),
      })),
    });
    if (prompt) push({ id: nextId(), kind: "user", text: prompt });
    push({
      id: nextId(),
      kind: "thinking",
      text: `Watching ${files.length} ${files.length === 1 ? "clip" : "clips"} — picture and sound…`,
    });
    setBusy(true);

    const form = new FormData();
    files.forEach((f) => form.append("file", f));

    try {
      const [analyzeRes, briefRes] = await Promise.all([
        fetch("/api/hybrid-reel/analyze", { method: "POST", body: form }),
        fetch("/api/hybrid-reel/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }),
      ]);
      const analyzed = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzed.error ?? `HTTP ${analyzeRes.status}`);
      const extracted: Partial<Record<keyof Brief, unknown>> = briefRes.ok
        ? (await briefRes.json()).brief ?? {}
        : {};

      const withUrls: ClipProfile[] = analyzed.profiles.map((p: ClipProfile, i: number) => ({
        ...p,
        objectUrl: URL.createObjectURL(files[i]),
      }));
      setProfiles(withUrls);
      replaceLast({ id: nextId(), kind: "profiles", profiles: withUrls, model: analyzed.model });

      /* prompt 里已经说了的不再问 */
      const known: Partial<Brief> = {};
      const missing: number[] = [];
      QUESTIONS.forEach((q, i) => {
        const v = extracted[q.key];
        const has = Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
        if (has) (known as Record<string, unknown>)[q.key] = v;
        else missing.push(i);
      });
      setBrief(known);
      setQueue(missing);

      if (missing.length === 0) {
        push({ id: nextId(), kind: "agent", text: "That's what you gave me, and your brief covers everything I need. Planning the cut." });
        void requestOutline(known as Brief, withUrls);
      } else {
        const knownCount = QUESTIONS.length - missing.length;
        push(
          {
            id: nextId(),
            kind: "agent",
            text:
              knownCount > 0
                ? `That's what you gave me. Your brief already covers ${knownCount} of 6 — ${missing.length} quick ${missing.length === 1 ? "question" : "questions"} and I'll plan the cut.`
                : "That's what you gave me. Six questions and I'll plan the cut.",
          },
          { id: nextId(), kind: "question", index: missing[0] },
        );
      }
    } catch (error) {
      replaceLast({
        id: nextId(),
        kind: "agent",
        text: `分析失败:${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const handoff = takePendingHandoff();
    if (!handoff || handoff.files.length === 0) {
      setEmpty(true);
      return;
    }
    void startFrom(handoff.files, handoff.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 答完六项 → 真调 ARK 出分镜 ── */
  const requestOutline = async (finalBrief: Brief, clipProfiles: ClipProfile[] = profiles) => {
    push({ id: nextId(), kind: "thinking", text: "Matching your footage to a narrative…" });
    setBusy(true);
    try {
      const res = await fetch("/api/hybrid-reel/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: finalBrief, profiles: clipProfiles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      replaceLast({ id: nextId(), kind: "outline", outline: data as Outline });
    } catch (error) {
      replaceLast({
        id: nextId(),
        kind: "agent",
        text: `出方案失败:${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const answer = (index: number, value: string) => {
    const q = QUESTIONS[index];
    const parsed = q.parse ? q.parse(value) : value;
    const merged = { ...brief, [q.key]: parsed } as Partial<Brief>;
    setBrief(merged);

    setMessages((prev) =>
      prev.map((m) => (m.kind === "question" && m.index === index ? { ...m, answered: value } : m)),
    );

    const rest = queue.filter((i) => i !== index);
    setQueue(rest);
    if (rest.length > 0) {
      push({ id: nextId(), kind: "question", index: rest[0] });
    } else {
      void requestOutline(merged as Brief);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    push({ id: nextId(), kind: "user", text });
    if (pendingQuestion !== null) answer(pendingQuestion, text);
  };

  const openCanvas = (outline: Outline) => {
    const handoff: Handoff = { brief: brief as Brief, profiles, outline };
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
    } catch {
      /* 隐私模式写不进去也不拦着跳转,画布那边会退回空态 */
    }
    router.push("/prototypes/hybrid-reel/canvas");
  };

  const references = profiles.map((p, i) => ({
    key: `${p.label}-${i}`,
    url: p.kind === "image" ? p.objectUrl : undefined,
    label: p.label,
  }));

  if (empty) {
    return (
      <div className="flex h-dvh bg-white" style={{ fontFamily: APPLE_FONT }}>
        <IconRail />
        <HistoryRail activeTitle="Hybrid Reel · 真实素材成片" />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <p className="text-[16px] font-bold text-[#1a1a2e]">Nothing to work with yet</p>
              <p className="mt-1.5 max-w-[42ch] text-[14px] leading-relaxed text-[#6a6b7b]">
                Attach your footage with the + button on the Marketing Agent, describe the ad, then
                press Create.
              </p>
              <Link
                href="/prototypes/hybrid-reel/agent"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white"
              >
                Back to Marketing Agent
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-white" style={{ fontFamily: APPLE_FONT }}>
      <IconRail />
      <HistoryRail activeTitle="Hybrid Reel · 真实素材成片" />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="mx-auto max-w-[880px] space-y-5 py-4">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                onAnswer={answer}
                onOpenCanvas={openCanvas}
                profiles={profiles}
              />
            ))}
          </div>
        </div>

        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          references={references}
          disabled={busy}
          placeholder={
            pendingQuestion !== null
              ? "Type your answer, or pick one above…"
              : "Describe your idea, campaign with marketing agent. Use @ to reference uploaded files."
          }
        />
      </div>

    </div>
  );
}

/* ────────────────────────── 单条消息 ────────────────────────── */

function MessageRow({
  message,
  onAnswer,
  onOpenCanvas,
  profiles,
}: {
  message: Message;
  onAnswer: (index: number, value: string) => void;
  onOpenCanvas: (outline: Outline) => void;
  profiles: ClipProfile[];
}) {
  switch (message.kind) {
    case "user":
      return (
        <div className="flex flex-col items-end gap-1.5">
          <div className="max-w-[62ch] rounded-2xl bg-[#f6f5f8] px-4 py-3 text-[14.5px] leading-relaxed text-[#1a1a2e]">
            {message.text}
          </div>
          <Copy className="size-3.5 text-[#c6c8d4]" />
        </div>
      );

    case "files":
      return (
        <div className="flex justify-end">
          <div className="flex max-w-[232px] flex-wrap justify-end gap-2">
            {message.files.map((f) => (
              <span
                key={f.url}
                title={f.name}
                className="relative block size-16 overflow-hidden rounded-[14px] bg-[#e7e6ec] ring-1 ring-black/5"
              >
                {f.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="size-full object-cover" />
                ) : (
                  <>
                    <VideoThumb src={f.url} />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-6 place-items-center rounded-full bg-white/90 text-[#1a1a2e] shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                        <Play className="ml-[1px] size-3 fill-current" />
                      </span>
                    </span>
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      );

    case "agent":
      return <AgentBlock>{message.text}</AgentBlock>;

    case "thinking":
      return (
        <AgentBlock>
          <span className="inline-flex items-center gap-2 text-[#6a6b7b]">
            <Loader2 className="size-4 animate-spin text-[#ff5e1a]" /> {message.text}
          </span>
        </AgentBlock>
      );

    case "profiles":
      return (
        <AgentBlock>
          <div className="space-y-2.5">
            {message.profiles.map((p) => (
              <ProfileCard key={p.label} profile={p} />
            ))}
            <p className="pt-1 text-[12px] text-[#9a9bb0]">
              Analysed with {message.model} — picture and audio in a single pass.
            </p>
          </div>
        </AgentBlock>
      );

    case "question": {
      const q = QUESTIONS[message.index];
      return (
        <>
          <AgentBlock>{q.q}</AgentBlock>
          {message.answered ? (
            <div className="flex justify-end">
              <div className="max-w-[62ch] rounded-2xl bg-[#f6f5f8] px-4 py-2.5 text-[14.5px] text-[#1a1a2e]">
                {message.answered}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              {q.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => onAnswer(message.index, o)}
                  className="rounded-full border border-[#ececf1] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </>
      );
    }

    case "outline":
      return (
        <AgentBlock>
          <OutlineCard
            outline={message.outline}
            profiles={profiles}
            onOpenCanvas={() => onOpenCanvas(message.outline)}
          />
        </AgentBlock>
      );
  }
}

/* <video> 不 seek 的话很多浏览器不画首帧,缩略图就是一块灰。拿到 metadata 后跳到 0.1s 逼它画一帧。 */
function VideoThumb({ src }: { src: string }) {
  return (
    <video
      src={src}
      muted
      playsInline
      preload="metadata"
      onLoadedMetadata={(event) => {
        const el = event.currentTarget;
        if (el.currentTime === 0) el.currentTime = 0.1;
      }}
      className="size-full object-cover"
    />
  );
}

/* agent 消息不带头像 —— 真实产品里助手回复就是平铺的正文,用户那侧靠右的气泡已经足够区分 */
function AgentBlock({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 text-[14.5px] leading-relaxed text-[#1a1a2e]">{children}</div>;
}

function ProfileCard({ profile }: { profile: ClipProfile }) {
  const role = ROLE_META[profile.suggestedRole as Role] ?? ROLE_META.hook;
  return (
    <div className="flex gap-3 rounded-2xl border border-[#ececf1] bg-white p-3">
      <span className="w-[58px] shrink-0 overflow-hidden rounded-lg bg-[#f4f4f7]">
        {profile.objectUrl ? (
          profile.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.objectUrl} alt="" className="aspect-[3/4] size-full object-cover" />
          ) : (
            <video src={profile.objectUrl} muted className="aspect-[3/4] size-full object-cover" />
          )
        ) : (
          <span className="grid aspect-[3/4] place-items-center">
            {profile.kind === "image" ? (
              <ImageIcon className="size-4 text-[#9a9bb0]" />
            ) : (
              <Film className="size-4 text-[#9a9bb0]" />
            )}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-bold text-[#1a1a2e]">{profile.label}</span>
          <span
            className="rounded-full px-2 py-[2px] text-[11px] font-bold"
            style={{ background: role.soft, color: role.color }}
          >
            Could be {role.label}
          </span>
          {profile.faceVisible && (
            <span className="rounded-full bg-[#f1f0f4] px-2 py-[2px] text-[11px] font-semibold text-[#6a6b7b]">
              face on screen
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-[#1a1a2e]">{profile.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {profile.tags.map((t) => (
            <span key={t} className="rounded-full bg-[#f6f5f8] px-2 py-[2px] text-[11px] text-[#6a6b7b]">
              {t}
            </span>
          ))}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] font-semibold ${
              profile.hasVoice ? "bg-[#fff3ec] text-[#ff5e1a]" : "bg-[#f6f5f8] text-[#9a9bb0]"
            }`}
          >
            {profile.hasVoice ? <Mic className="size-3" /> : <MicOff className="size-3" />}
            {profile.hasVoice ? "speech" : "no speech"}
          </span>
        </div>
        {profile.voiceSummary && (
          <p className="mt-1.5 border-l-2 border-[#ffd2b8] pl-2.5 text-[12.5px] italic text-[#6a6b7b]">
            {profile.voiceSummary}
          </p>
        )}
        {profile.issues.map((issue) => (
          <p
            key={issue}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-[#fff0f0] px-2 py-1 text-[12px] font-semibold text-[#c22f32]"
          >
            <TriangleAlert className="size-3" /> {issue}
          </p>
        ))}
      </div>
    </div>
  );
}

function OutlineCard({
  outline,
  profiles,
  onOpenCanvas,
}: {
  outline: Outline;
  profiles: ClipProfile[];
  onOpenCanvas: () => void;
}) {
  const total = outline.shots.reduce((n, s) => n + s.durationSec, 0);

  return (
    <div className="space-y-3">
      <p>{outline.direction}</p>

      <div className="space-y-2">
        {outline.shots.map((shot, i) => {
          const meta = ROLE_META[shot.role] ?? ROLE_META.hook;
          const clip =
            shot.source.kind === "clip" ? profiles[shot.source.clipIndex] : undefined;
          return (
            <div
              key={i}
              className="rounded-2xl border border-[#ececf1] bg-white p-3"
              style={{ borderLeft: `3px solid ${meta.color}` }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-[3px] text-[11px] font-bold"
                  style={{ background: meta.soft, color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="text-[12.5px] text-[#9a9bb0]">{meta.blurb}</span>
                <span className="ml-auto text-[12.5px] font-bold tabular-nums text-[#6a6b7b]">
                  {shot.durationSec}s
                </span>
              </div>

              {shot.source.kind === "clip" && (
                <p className="mt-1.5 text-[13px] text-[#1a1a2e]">
                  <span className="font-semibold">{clip?.label ?? `clip ${shot.source.clipIndex}`}</span>
                  <span className="text-[#9a9bb0]">
                    {" "}
                    · {shot.source.inSec}s – {shot.source.outSec}s
                  </span>
                </p>
              )}

              {shot.source.kind === "generate" && (
                <div className="mt-1.5 rounded-xl bg-[#faf8f6] p-2.5">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#6a6b7b]">
                    <Wand2 className="size-3" /> Nothing covers this — I&apos;ll shoot it (
                    {shot.source.genType})
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#1a1a2e]">
                    {shot.source.prompt}
                  </p>
                </div>
              )}

              {shot.source.kind === "blocked" && (
                <div className="mt-1.5 rounded-xl border border-dashed border-[#e0dfe6] p-2.5">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#6a6b7b]">
                    <Ban className="size-3" /> Shoot this one yourself
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#1a1a2e]">
                    {shot.source.reason}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#6a6b7b]">
                    {shot.source.suggestion}
                  </p>
                </div>
              )}

              <p className="mt-1.5 flex items-start gap-2 text-[12.5px] text-[#6a6b7b]">
                <span className="mt-[2px] shrink-0 rounded bg-[#f6f5f8] px-1.5 text-[10px] font-bold uppercase">
                  {shot.subtitle.source === "stt" ? "heard" : "written"}
                </span>
                <span className="text-[#1a1a2e]">&ldquo;{shot.subtitle.text}&rdquo;</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[#ececf1] bg-[#faf8f6] p-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#9a9bb0]">
            Estimated cost
          </p>
          <p className="mt-0.5">
            <span className="text-[24px] font-extrabold tabular-nums text-[#1a1a2e]">
              {outline.credits.total.toLocaleString("en-US")}
            </span>
            <span className="text-[13px] text-[#6a6b7b]"> credits</span>
          </p>
          <p className="text-[12.5px] text-[#6a6b7b]">
            {outline.credits.base} base + {outline.credits.generatedShots} generated ×{" "}
            {outline.credits.perGenerateShot} · {total}s total · nothing charged until you render
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCanvas}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_22px_rgba(255,82,85,0.28)] transition hover:brightness-105"
        >
          <Check className="size-4" /> Edit in canvas <ArrowRight className="size-4" />
        </button>
      </div>

      <p className="text-[12.5px] text-[#9a9bb0]">
        改方案不花钱,直接在下面说要改什么。 · BGM: {outline.bgmPrompt}
      </p>
    </div>
  );
}
