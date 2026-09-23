"use client";

/* Hybrid Reel · Agent 对话
   素材和 prompt 从落地页 composer 带进来(「+」→ Local Upload,再点 Create),
   这里不出上传卡。进来即分析;brief 六项能从 prompt 里抽到的不再问,只追问缺项(PRD F2.3);
   出方案后一个 Edit in canvas 带去画布。

   真模型:素材理解与分镜都走 BytePlus ARK(seed-2-0-lite-260428),经服务端
   /api/hybrid-reel/analyze 与 /outline,key 只在服务端。视频与音轨一起喂进去,
   所以「有无人声」不另跑 STT。 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Mic,
  Wand2,
  X,
  Film,
  ChevronRight,
  ChevronDown,
  Layers,
  Ban,
  Copy,
  Play,
  ArrowRight,
  Check,
} from "lucide-react";
import { APPLE_FONT, Composer, HistoryRail, IconRail, TopBar } from "./shell";
import { getSession, hydrateSession, latestSession, putMedia, saveSession, takePendingHandoff } from "./handoff";
import {
  HANDOFF_KEY,
  ROLE_META,
  type Brief,
  type ClipProfile,
  type Handoff,
  type Outline,
  type Role,
  type Shot,
} from "./types";

type Message =
  | { id: string; kind: "agent"; text: string }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "files"; files: { name: string; url: string; isImage: boolean }[] }
  | { id: string; kind: "thinking"; text: string }
  /* AI 看完素材后的一段完整回复(含 brief 六项),结尾问用户确认;没有按钮 */
  | { id: string; kind: "reply"; markdown: string; brief: Brief; model?: string; confirmed?: boolean; superseded?: boolean }
  | { id: string; kind: "outline"; outline: Outline; confirmed?: boolean; superseded?: boolean }
  /* 生成计划卡(照真实产品的 Generation plan):每个 AI 补拍段 + 最终合成各一项,主按钮进画布 */
  | { id: string; kind: "plan"; outline: Outline; status: "awaiting" | "cancelled" };

let seq = 0;
/* 带上页面加载时刻:刷新后计数归零,但恢复出来的旧消息 id 不会和新消息撞 */
const idBase = Date.now().toString(36);
const nextId = () => `m${idBase}-${(seq += 1)}`;

export default function HybridReelChat() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  /* 这次对话在 History 里的 id;从落地页 Create 进来时新建,从 History 点进来时沿用 */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const titleRef = useRef("Hybrid Reel");
  const createdRef = useRef(0);
  /* 本次会话素材的 blob URL ↔ IndexedDB key,随会话一起存,刷新后据此恢复缩略图 */
  const mediaRef = useRef<{ key: string; url: string }[]>([]);
  /* 回复语言跟用户输入走:prompt 里有中文就中文 */
  const [lang, setLang] = useState<"zh" | "en">("en");
  const T = (zh: string, en: string) => (lang === "zh" ? zh : en);

  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<ClipProfile[]>([]);
  const [brief, setBrief] = useState<Partial<Brief>>({});
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


  /* ── 从落地页带进来的素材 + prompt 起跑:分析与 brief 抽取并行 ── */
  const startFrom = async (files: File[], prompt: string) => {
    const id = `hr-${Date.now().toString(36)}`;
    titleRef.current = prompt ? prompt.replace(/\s+/g, " ").slice(0, 32) : `Hybrid Reel · ${files[0]?.name ?? ""}`;
    createdRef.current = Date.now();
    const urls = files.map((f) => URL.createObjectURL(f));
    mediaRef.current = files.map((f, i) => ({ key: `${id}:${i}`, url: urls[i] }));
    files.forEach((f, i) => void putMedia(`${id}:${i}`, f));
    setSessionId(id);
    const zh = /[\u4e00-\u9fff]/.test(prompt);
    setLang(zh ? "zh" : "en");

    push({
      id: nextId(),
      kind: "files",
      files: files.map((f, i) => ({
        name: f.name,
        url: urls[i],
        isImage: f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name),
      })),
    });
    if (prompt) push({ id: nextId(), kind: "user", text: prompt });
    push({
      id: nextId(),
      kind: "thinking",
      text: zh
        ? `正在看这 ${files.length} 条素材的画面和声音…`
        : `Watching ${files.length} ${files.length === 1 ? "clip" : "clips"} — picture and sound…`,
    });
    setBusy(true);

    const form = new FormData();
    files.forEach((f) => form.append("file", f));

    try {
      const analyzeRes = await fetch("/api/hybrid-reel/analyze", { method: "POST", body: form });
      const analyzed = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzed.error ?? `HTTP ${analyzeRes.status}`);

      const withUrls: ClipProfile[] = analyzed.profiles.map((p: ClipProfile, i: number) => ({
        ...p,
        objectUrl: urls[i],
      }));
      setProfiles(withUrls);

      /* 看完素材再写回复:产品是什么、覆盖了哪些环节、brief 六项,一段话说完 */
      replaceLast({ id: nextId(), kind: "thinking", text: zh ? "正在整理方案…" : "Putting the plan together…" });
      const briefRes = await fetch("/api/hybrid-reel/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, profiles: withUrls, lang: zh ? "zh" : "en" }),
      });
      const proposed = await briefRes.json();
      if (!briefRes.ok) throw new Error(proposed.error ?? `HTTP ${briefRes.status}`);
      setBrief(proposed.brief);
      replaceLast({ id: nextId(), kind: "reply", markdown: proposed.reply, brief: proposed.brief, model: analyzed.model });
    } catch (error) {
      replaceLast({
        id: nextId(),
        kind: "agent",
        text: `${zh ? "分析失败" : "Analysis failed"}:${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const handoff = takePendingHandoff();
    if (handoff && handoff.files.length > 0) {
      void startFrom(handoff.files, handoff.prompt);
      return;
    }
    /* 没带新素材:看是不是从 History 点进来的,或者回到最近一次 */
    const wanted = new URLSearchParams(window.location.search).get("session");
    const restored = getSession(wanted) ?? (wanted ? null : latestSession());
    if (restored) {
      void hydrateSession(restored).then((s) => {
        setSessionId(s.id);
        titleRef.current = s.title;
        createdRef.current = s.createdAt;
        mediaRef.current = s.media ?? [];
        setLang(s.lang ?? "en");
        /* 上次在「思考中」被刷掉的,那一步没跑完,去掉占位,让用户接着发 */
        const msgs = s.messages as Message[];
        while (msgs.length && msgs[msgs.length - 1].kind === "thinking") msgs.pop();
        setMessages(msgs);
        setProfiles(s.profiles as ClipProfile[]);
        setBrief(s.brief as Partial<Brief>);
      });
      return;
    }
    setEmpty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 对话每变一次就写回 History,落地页那栏立刻能看到 */
  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    saveSession({
      id: sessionId,
      title: titleRef.current,
      createdAt: createdRef.current || Date.now(),
      messages,
      profiles,
      brief,
      queue: [],
      lang,
      media: mediaRef.current,
    });
  }, [sessionId, messages, profiles, brief, lang]);

  /* ── 答完六项 → 真调 ARK 出分镜 ── */
  const requestOutline = async (
    finalBrief: Brief,
    clipProfiles: ClipProfile[] = profiles,
    revision?: { current: Outline; change: string },
  ) => {
    push({
      id: nextId(),
      kind: "thinking",
      text: revision
        ? T("正在调整分镜…", "Updating the storyboard…")
        : T("正在把素材排进叙事结构…", "Matching your footage to a narrative…"),
    });
    setBusy(true);
    try {
      const res = await fetch("/api/hybrid-reel/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: finalBrief,
          profiles: clipProfiles,
          ...(revision ? { current: revision.current, change: revision.change } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages((prev) => [
        ...prev.slice(0, -1).map((m) => (m.kind === "outline" && !m.confirmed ? { ...m, superseded: true } : m)),
        { id: nextId(), kind: "outline", outline: data as Outline },
        {
          id: nextId(),
          kind: "agent",
          text: T(
            "以上是分镜方案。有想改的镜头直接告诉我；没有的话回「可以」，我就生成执行计划。",
            "That's the storyboard. Tell me if any shot should change; if not, reply “ok” and I'll draw up the generation plan.",
          ),
        },
      ]);
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

  /* 最后一条是还没确认的回复时,用户打的字要么是「可以」,要么是要改什么 */
  const pendingReply = (() => {
    const last = messages[messages.length - 1];
    return last?.kind === "reply" && !last.confirmed ? last : null;
  })();

  /* 「可以 / 好 / 确认 / OK / go」这类短回复直接当确认,不再花一次模型调用 */
  const isConfirm = (text: string) => {
    const t = text.trim().toLowerCase().replace(/[。!！.,，~]/g, "");
    if (t.length > 16) return false;
    return /^(ok|okay|yes|yep|go|sure|confirm|proceed|looks good|lgtm|do it|go ahead|可以|好|好的|行|没问题|确认|就这样|开始|继续|可以的|好的开始|开始吧|没毛病|就按这个|按这个来|ok的)$/.test(t)
      || /确认|开始排|就这样|没问题|按这个/.test(t);
  };

  const confirmReply = (message: Extract<Message, { kind: "reply" }>) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, confirmed: true } : m)));
    push({ id: nextId(), kind: "agent", text: T("好，我用你的素材来排分镜，缺的镜头之后会由 AI 补拍。", "Great — laying out the storyboard from your footage; the missing shots will be AI-shot afterwards.") });
    void requestOutline(message.brief);
  };

  const reviseReply = async (change: string, current: Extract<Message, { kind: "reply" }>) => {
    push({ id: nextId(), kind: "thinking", text: T("正在调整…", "Updating the brief…") });
    setBusy(true);
    try {
      const res = await fetch("/api/hybrid-reel/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: change, profiles, current: current.brief, change, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setBrief(data.brief);
      if (data.action === "confirm") {
        /* 模型判断用户其实是在同意 —— 直接往下走 */
        setMessages((prev) => [
          ...prev.slice(0, -1).map((m) => (m.id === current.id ? { ...m, confirmed: true } : m)),
          { id: nextId(), kind: "agent", text: data.reply || T("好，我用你的素材来排分镜，缺的镜头之后会由 AI 补拍。", "Great — laying out the storyboard from your footage; the missing shots will be AI-shot afterwards.") },
        ]);
        void requestOutline(current.brief);
        return;
      }
      setMessages((prev) => [
        ...prev.slice(0, -1).map((m) => (m.kind === "reply" && !m.confirmed ? { ...m, superseded: true } : m)),
        { id: nextId(), kind: "reply", markdown: data.reply, brief: data.brief },
      ]);
    } catch (error) {
      replaceLast({
        id: nextId(),
        kind: "agent",
        text: `${T("调整失败", "Couldn't update the brief")}:${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setBusy(false);
    }
  };

  /* 倒数第二条是分镜、最后一条是「有没有要改的」那句时,用户打的字就是对分镜的答复 */
  const pendingOutline = (() => {
    const m = messages[messages.length - 2];
    const last = messages[messages.length - 1];
    return m?.kind === "outline" && !m.confirmed && last?.kind === "agent" ? m : null;
  })();
  const pendingPlan = (() => {
    const m = messages[messages.length - 2];
    return m?.kind === "plan" && m.status === "awaiting" ? m : null;
  })();

  const makePlan = (outlineMsg: Extract<Message, { kind: "outline" }>) => {
    setMessages((prev) => [
      ...prev.map((m) => (m.id === outlineMsg.id ? { ...m, confirmed: true } : m)),
      { id: nextId(), kind: "plan", outline: outlineMsg.outline, status: "awaiting" },
      {
        id: nextId(),
        kind: "agent",
        text: T(
          "计划已生成，请查看上方的计划卡片，确认后进入画布开始生成。",
          "The plan is ready — check the card above; confirm to open it in the canvas and start generating.",
        ),
      },
    ]);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    push({ id: nextId(), kind: "user", text });
    if (pendingReply) {
      if (isConfirm(text)) confirmReply(pendingReply);
      else void reviseReply(text, pendingReply);
      return;
    }
    if (pendingOutline) {
      if (isConfirm(text)) makePlan(pendingOutline);
      else void requestOutline(brief as Brief, profiles, { current: pendingOutline.outline, change: text });
      return;
    }
    if (pendingPlan && isConfirm(text)) openCanvas(pendingPlan.outline);
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
        <HistoryRail activeId={sessionId} />
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
      <HistoryRail activeId={sessionId} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="mx-auto max-w-[880px] space-y-5 py-4">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                onOpenCanvas={openCanvas}
                onCancelPlan={(id) => {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === id && m.kind === "plan" ? { ...m, status: "cancelled" } : m)),
                  );
                  push({ id: nextId(), kind: "agent", text: T("已取消。想改哪里直接告诉我。", "Cancelled. Tell me what to change.") });
                }}
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
            pendingReply
              ? T("回「可以」就开始排分镜，或者直接说要改什么…", "Reply “ok” to go ahead, or tell me what to change…")
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
  onOpenCanvas,
  onCancelPlan,
  profiles,
}: {
  message: Message;
  onCancelPlan: (messageId: string) => void;
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
          <span className="inline-flex items-center gap-2.5 text-[#6a6b7b]">
            <TypingDots /> {message.text}
          </span>
        </AgentBlock>
      );

    case "reply":
      return (
        <AgentBlock>
          <div className={message.superseded ? "opacity-55" : ""}>
            <Markdown text={message.markdown} />
            {message.model && (
              <p className="mt-3 text-[12px] text-[#9a9bb0]">
                {/[\u4e00-\u9fff]/.test(message.markdown)
                  ? `素材理解模型：${message.model}，画面与声音一次分析。`
                  : `Analysed with ${message.model} — picture and audio in a single pass.`}
              </p>
            )}
          </div>
        </AgentBlock>
      );

    case "outline":
      return (
        <AgentBlock>
          <div className={message.superseded ? "opacity-55" : ""}>
            <OutlineCard outline={message.outline} profiles={profiles} />
          </div>
        </AgentBlock>
      );

    case "plan":
      return (
        <AgentBlock>
          <PlanCard
            outline={message.outline}
            profiles={profiles}
            status={message.status}
            onCancel={() => onCancelPlan(message.id)}
            onConfirm={() => onOpenCanvas(message.outline)}
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
/* 极简 markdown:段落、"-" 列表、**加粗**。回复是模型写的,只放开这三样。 */
function Markdown({ text }: { text: string }) {
  /* 模型在 JSON 里常把星号转义成 \*\*,先还原;顺手把「**平台**：」这种加粗后紧跟的全角冒号收进加粗外面 */
  const clean = text.replace(/\r/g, "").replace(/\\\*/g, "*").replace(/\\_/g, "_");
  const blocks = clean.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const inline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-[#1a1a2e]">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        /* 项目符号:- • 数字. 或单个 *(后面不能再跟 *,否则会把 **加粗** 吃掉一半) */
        const bullet = /^(?:[-•]|\*(?!\*)|\d+[.、])\s+/;
        const isList = lines.every((l) => bullet.test(l));
        if (isList) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#c6c8d4]" />
                  <span>{inline(l.replace(bullet, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {inline(l)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/* agent 消息不带头像 —— 真实产品里助手回复就是平铺的正文,用户那侧靠右的气泡已经足够区分 */

/* agent 消息不带头像 —— 真实产品里助手回复就是平铺的正文,用户那侧靠右的气泡已经足够区分 */
/* 等待态用真实产品那种三个点的打字动画,不用转圈。
   只动 transform / opacity;prefers-reduced-motion 下退成静止的三个点。 */
function TypingDots() {
  return (
    <span className="hr-dots inline-flex items-center gap-[5px]" aria-hidden>
      <span />
      <span />
      <span />
      <style>{`
        .hr-dots span {
          width: 7px; height: 7px; border-radius: 9999px; background: #c6c8d4; display: inline-block;
          animation: hr-dot 1.2s ease-in-out infinite;
        }
        .hr-dots span:nth-child(2) { animation-delay: 0.15s; }
        .hr-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes hr-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hr-dots span { animation: none; opacity: 0.7; }
        }
      `}</style>
    </span>
  );
}

function AgentBlock({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 text-[14.5px] leading-relaxed text-[#1a1a2e]">{children}</div>;
}

const ROLE_ZH: Record<Role, string> = { hook: "开场钩子", pain: "痛点", proof: "证明", usage: "使用场景", cta: "行动号召" };

/* ── Generation plan 卡(照真实产品)──
   每个镜头一项(自有素材标「无需生成」,AI 补拍带 prompt 与参数);每项:标题、View prompt、参数 chips、参考素材缩略图、消耗。
   这里不生成、不扣费 —— 不显示任何 credits 数字;底部一句说明 + Cancel + Edit in canvas,生成和扣费都在画布里。 */
function PlanCard({
  outline,
  profiles,
  status,
  onCancel,
  onConfirm,
}: {
  outline: Outline;
  profiles: ClipProfile[];
  status: "awaiting" | "cancelled";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const zh = /[\u4e00-\u9fff]/.test(outline.direction);
  const [openPrompt, setOpenPrompt] = useState<number | null>(null);
  const refs = profiles.filter((p) => p.objectUrl).slice(0, 3);
  const itemCount = outline.shots.length;

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#ececf1] bg-white ${status === "cancelled" ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <ChevronDown className="size-4 text-[#6a6b7b]" />
        <span className="text-[14px] font-semibold text-[#1a1a2e]">Generation plan</span>
        <span
          className={`ml-auto rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold ${
            status === "awaiting" ? "bg-[#fff6d6] text-[#8a6a00]" : "bg-[#f1f0f4] text-[#6a6b7b]"
          }`}
        >
          {status === "awaiting" ? "Awaiting confirmation" : "Cancelled"}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] text-[#6a6b7b]">
          <Layers className="size-3.5" /> {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="space-y-2 px-3 pb-3">
        {outline.shots.map((shot, i) => {
          const role = ROLE_META[shot.role] ?? ROLE_META.hook;
          const roleName = (zh ? ROLE_ZH[shot.role] : undefined) ?? role.label ?? String(shot.role);

          /* 自有素材:编排进来,但不需要生成 */
          if (shot.source.kind === "clip") {
            const clip = profiles[shot.source.clipIndex];
            return (
              <div key={i} className="rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
                <div className="flex items-start gap-2">
                  {clip?.kind === "image" ? (
                    <ImageIcon className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  ) : (
                    <Film className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                      {zh ? `你的素材 · ${roleName}` : `Your footage · ${roleName}`} ({shot.durationSec}s)
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="max-w-[360px] truncate rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]" title={clip?.label}>
                        {clip?.label ?? `clip ${shot.source.clipIndex}`} | {shot.source.inSec}s–{shot.source.outSec}s | {zh ? "无需生成" : "no generation"}
                      </span>
                      {clip?.objectUrl &&
                        (clip.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={clip.objectUrl} alt="" className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
                        ) : (
                          <video src={clip.objectUrl} muted className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
                        ))}
                    </div>
                  </span>
                </div>
              </div>
            );
          }

          /* 撞上真人边界:不生成,提示用户自行补拍 */
          if (shot.source.kind === "blocked") {
            return (
              <div key={i} className="rounded-xl border border-dashed border-[#e0dfe6] bg-white p-3">
                <div className="flex items-start gap-2">
                  <Ban className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                      {zh ? `建议自行补拍 · ${roleName}` : `Shoot it yourself · ${roleName}`} ({shot.durationSec}s)
                    </span>
                    <span className="mt-1 block text-[12px] leading-snug text-[#6a6b7b]">
                      {shot.source.reason} {shot.source.suggestion}
                    </span>
                  </span>
                </div>
              </div>
            );
          }

          const src = shot.source;
          return (
            <div key={i} className="rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
              <div className="flex items-start gap-2">
                <Wand2 className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                    {zh ? `AI 补拍 · ${roleName}` : `AI shot · ${roleName}`} ({shot.durationSec}s)
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenPrompt(openPrompt === i ? null : i)}
                    className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#6a6b7b] hover:text-[#1a1a2e]"
                  >
                    {openPrompt === i ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    View prompt
                  </button>
                  {openPrompt === i && (
                    <p className="mt-1.5 rounded-lg bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-[#1a1a2e]">
                      {src.prompt}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]">
                      Seedance 2.5 | 9:16 | 1080p | {shot.durationSec}s | {src.genType}
                    </span>
                    <span className="flex gap-1">
                      {refs.map((p) =>
                        p.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.label} src={p.objectUrl} alt="" className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
                        ) : (
                          <video key={p.label} src={p.objectUrl} muted className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
                        ),
                      )}
                    </span>
                  </div>
                </span>
              </div>
            </div>
          );
        })}

      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf1] bg-[#faf8f6] px-4 py-3">
        <span className="text-[13px] text-[#6a6b7b]">
          {zh
            ? "计划确认后进入画布，生成和扣费都在画布里进行。"
            : "Confirm to open this plan in the canvas — generation and credits happen there."}
        </span>
        {status === "awaiting" && (
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6]"
            >
              <X className="size-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13.5px] font-bold text-white shadow-[0_6px_18px_rgba(255,82,85,0.24)] transition hover:brightness-105"
            >
              Edit in canvas <ArrowRight className="size-4" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

function OutlineCard({ outline, profiles }: { outline: Outline; profiles: ClipProfile[] }) {
  const total = outline.shots.reduce((n, s) => n + s.durationSec, 0);
  const zh = /[\u4e00-\u9fff]/.test(outline.direction);

  return (
    <div className="space-y-3">
      <p>{outline.direction}</p>

      {/* 分镜表:一行一个镜头 —— 环节 / 时长 / 用什么素材(或 AI 补拍) / 字幕 */}
      <div className="overflow-x-auto rounded-2xl border border-[#ececf1]">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#faf8f6] text-left text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#9a9bb0]">
              <th className="w-10 px-3 py-2.5">#</th>
              <th className="w-[120px] px-3 py-2.5">{zh ? "环节" : "Beat"}</th>
              <th className="w-14 px-3 py-2.5">{zh ? "时长" : "Length"}</th>
              <th className="px-3 py-2.5">{zh ? "画面来源" : "Source"}</th>
              <th className="w-[30%] px-3 py-2.5">{zh ? "字幕" : "Subtitle"}</th>
            </tr>
          </thead>
          <tbody>
            {outline.shots.map((shot, i) => {
              const meta = ROLE_META[shot.role] ?? ROLE_META.hook;
              const clip = shot.source.kind === "clip" ? profiles[shot.source.clipIndex] : undefined;
              return (
                <tr key={i} className="border-t border-[#ececf1] align-top">
                  <td className="px-3 py-3 tabular-nums text-[#9a9bb0]">{i + 1}</td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11px] font-bold"
                      style={{ background: meta.soft, color: meta.color }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                      {(zh ? ROLE_ZH[shot.role] : undefined) ?? meta.label ?? String(shot.role)}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-[#1a1a2e]">{shot.durationSec}s</td>
                  <td className="px-3 py-3 text-[#1a1a2e]">
                    {shot.source.kind === "clip" && (
                      <>
                        <span className="block max-w-[260px] truncate font-semibold" title={clip?.label}>
                          {clip?.label ?? `clip ${shot.source.clipIndex}`}
                        </span>
                        <span className="text-[12px] text-[#9a9bb0]">
                          {shot.source.inSec}s – {shot.source.outSec}s
                        </span>
                      </>
                    )}
                    {shot.source.kind === "generate" && (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a2e] px-2 py-[2px] text-[10.5px] font-bold text-white">
                          <Wand2 className="size-3" /> {zh ? "AI 补拍" : "AI shot"} · {shot.source.genType}
                        </span>
                        <span className="mt-1 block text-[12px] leading-snug text-[#6a6b7b]">
                          {shot.source.prompt}
                        </span>
                      </>
                    )}
                    {shot.source.kind === "blocked" && (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f0f4] px-2 py-[2px] text-[10.5px] font-bold text-[#6a6b7b]">
                          <Ban className="size-3" /> {zh ? "建议自行补拍" : "Shoot it yourself"}
                        </span>
                        <span className="mt-1 block text-[12px] leading-snug text-[#6a6b7b]">
                          {shot.source.reason} {shot.source.suggestion}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[#1a1a2e]">
                    <span className="mr-1.5 rounded bg-[#f6f5f8] px-1.5 text-[10px] font-bold uppercase text-[#9a9bb0]">
                      {shot.subtitle.source === "stt" ? (zh ? "原声" : "heard") : zh ? "撰写" : "written"}
                    </span>
                    &ldquo;{shot.subtitle.text}&rdquo;
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
