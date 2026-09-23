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
  RotateCcw,
} from "lucide-react";
import { APPLE_FONT, Composer, HistoryRail, IconRail, TopBar } from "./shell";
import { getMedia, getSession, hydrateSession, latestSession, putMedia, saveSession, takePendingHandoff } from "./handoff";
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
  | { id: string; kind: "agent"; text: string; retry?: boolean }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "files"; files: { name: string; url: string; isImage: boolean }[] }
  | { id: string; kind: "thinking"; text: string }
  /* AI 看完素材后的一段完整回复(含 brief 六项),结尾问用户确认;没有按钮 */
  | { id: string; kind: "reply"; markdown: string; brief: Brief; model?: string; confirmed?: boolean; superseded?: boolean }
  | { id: string; kind: "outline"; outline: Outline; confirmed?: boolean; superseded?: boolean }
  /* 按投放目的给的 3 个不同结构的方案;chosen 之前可切换查看,选定后收起 */
  | { id: string; kind: "options"; options: Outline[]; chosen?: number }
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
  const [resumeOutline, setResumeOutline] = useState(false);

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
    push(watchingMsg(files.length, zh));
    await analyze(files, prompt, urls, zh);
  };

  const watchingMsg = (n: number, zh: boolean): Message => ({
    id: nextId(),
    kind: "thinking",
    text: zh ? `正在看这 ${n} 条素材的画面和声音…` : `Watching ${n} ${n === 1 ? "clip" : "clips"} — picture and sound…`,
  });

  /* 看素材 → 写提案。失败时留一条可重试的消息,素材不用重新上传 */
  const analyze = async (files: File[], prompt: string, urls: string[], zh: boolean) => {
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
      const detail = error instanceof Error ? error.message : String(error);
      const network = /无法连接模型服务|fetch failed|Failed to fetch|ECONNRESET|ETIMEDOUT|socket|network/i.test(detail);
      replaceLast({
        id: nextId(),
        kind: "agent",
        retry: true,
        text: network
          ? zh
            ? "这次没连上模型服务，素材分析没跑完。素材都还在，点「重试」再分析一次。"
            : "I couldn't reach the model service, so the analysis didn't finish. Your footage is still here — retry to run it again."
          : `${zh ? "分析失败" : "Analysis failed"}:${detail}`,
      });
    } finally {
      setBusy(false);
    }
  };

  /* 重试:从 IndexedDB 取回这次会话的素材,接着上次的位置重新分析 */
  const retryAnalysis = async () => {
    const filesMsg = messages.find((m) => m.kind === "files");
    const prompt = messages.find((m) => m.kind === "user")?.text ?? "";
    if (!filesMsg || filesMsg.kind !== "files") return;
    const media = mediaRef.current;
    const blobs = await Promise.all(media.map((m) => getMedia(m.key)));
    if (blobs.some((b) => !b)) {
      replaceLast({
        id: nextId(),
        kind: "agent",
        text: T("素材文件找不到了，请回到上一页重新上传。", "The footage is no longer available — please upload it again."),
      });
      return;
    }
    const files = blobs.map((b, i) => new File([b!], filesMsg.files[i]?.name ?? `clip-${i + 1}`, { type: b!.type }));
    const zh = lang === "zh";
    replaceLast(watchingMsg(files.length, zh));
    await analyze(files, prompt, media.map((m) => m.url), zh);
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
        /* 上次在「思考中」被刷掉的,那一步没跑完:去掉占位,再按停在哪一步接着走 */
        const msgs = s.messages as Message[];
        while (msgs.length && msgs[msgs.length - 1].kind === "thinking") msgs.pop();
        const zh = (s.lang ?? "en") === "zh";
        const replyIdx = msgs.map((m) => m.kind).lastIndexOf("reply");
        const reply = msgs[replyIdx];
        const after = replyIdx >= 0 ? msgs.slice(replyIdx + 1) : [];
        const last = msgs[msgs.length - 1];
        if (
          reply?.kind === "reply" &&
          reply.confirmed &&
          !after.some((m) => m.kind === "outline" || m.kind === "plan" || m.kind === "options")
        ) {
          /* 已确认提案、分镜还没出来 → 等语言等状态就位后自动重排 */
          setResumeOutline(true);
        } else if (replyIdx < 0 && msgs.some((m) => m.kind === "files") && !(last?.kind === "agent" && last.retry)) {
          /* 素材分析没跑完 → 给一条可重试的消息 */
          msgs.push({
            id: nextId(),
            kind: "agent",
            retry: true,
            text: zh
              ? "上次的素材分析没跑完。素材都还在，点「重试」接着分析。"
              : "The last analysis didn't finish. Your footage is still here — retry to pick it up.",
          });
        }
        setMessages(msgs);
        setProfiles(s.profiles as ClipProfile[]);
        setBrief(s.brief as Partial<Brief>);
      });
      return;
    }
    setEmpty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 恢复会话时发现分镜没排完:这一帧 lang / brief / profiles 都已就位,接着排 */
  useEffect(() => {
    if (!resumeOutline) return;
    setResumeOutline(false);
    void requestOptions(brief as Brief, profiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeOutline]);

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
  const CONFIRM_LINE = () =>
    T(
      "好，我按投放目的给你排 3 个不同结构的方案，缺的镜头之后会由 AI 补拍。",
      "Great — I'll lay out 3 storyboards with different structures for this goal; missing shots get AI-shot afterwards.",
    );

  /* ── 确认提案 → 按投放目的挑 3 种结构,各出一版 ── */
  const requestOptions = async (finalBrief: Brief, clipProfiles: ClipProfile[] = profiles) => {
    push({
      id: nextId(),
      kind: "thinking",
      text: T("正在按投放目的设计 3 个不同结构的方案…", "Designing 3 storyboards with different structures…"),
    });
    setBusy(true);
    try {
      const res = await fetch("/api/hybrid-reel/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: finalBrief, profiles: clipProfiles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const options = data.options as Outline[];
      /* 方案本身是一段完整的文字回复(结尾就是提问),不再另起一条消息 */
      replaceLast({ id: nextId(), kind: "options", options });
    } catch (error) {
      replaceLast({
        id: nextId(),
        kind: "agent",
        text: `${T("出方案失败", "Couldn't build the storyboards")}:${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setBusy(false);
    }
  };

  /* 选定一版:方案卡收起,选中的那版作为可修改的分镜往下走 */
  const chooseOption = (msg: Extract<Message, { kind: "options" }>, index: number, thenChange?: string) => {
    const outline = msg.options[index];
    const name = outline.structure?.name ?? "";
    const title = outline.concept?.title ? `「${outline.concept.title}」` : `「${name}」`;
    setMessages((prev) => [
      ...prev.map((m) => (m.id === msg.id ? { ...m, chosen: index } : m)),
      {
        id: nextId(),
        kind: "agent",
        text: T(
          `好，就用方案 ${OPTION_LETTERS[index]}${title}，这是完整分镜：`,
          `Going with option ${OPTION_LETTERS[index]} — ${outline.concept?.title ?? name}. Here's the full storyboard:`,
        ),
      },
      { id: nextId(), kind: "outline", outline },
      ...(thenChange
        ? []
        : [
            {
              id: nextId(),
              kind: "agent" as const,
              text: T(
                "有想改的镜头直接告诉我；没有的话回「可以」，我就生成执行计划。",
                "Tell me if any shot should change; if not, reply “ok” and I'll draw up the generation plan.",
              ),
            },
          ]),
    ]);
    if (thenChange) void requestOutline(brief as Brief, profiles, { current: outline, change: thenChange });
  };

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
          structure: revision?.current.structure,
          ...(revision ? { current: revision.current, change: revision.change } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages((prev) => [
        ...prev.slice(0, -1).map((m) => (m.kind === "outline" && !m.confirmed ? { ...m, superseded: true } : m)),
        { id: nextId(), kind: "outline", outline: { ...(data as Outline), structure: (data as Outline).structure ?? revision?.current.structure } },
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
    push({ id: nextId(), kind: "agent", text: CONFIRM_LINE() });
    void requestOptions(message.brief);
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
          { id: nextId(), kind: "agent", text: data.reply || CONFIRM_LINE() },
        ]);
        void requestOptions(current.brief);
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
  /* 方案出来后、还没选:之后只有普通问答(比如「先选一个方案」)也仍算待选 */
  const pendingOptions = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.kind === "options") return m.chosen === undefined ? m : null;
      if (m.kind !== "user" && m.kind !== "agent") return null;
    }
    return null;
  })();
  const pendingPlan = (() => {
    const m = messages[messages.length - 2];
    return m?.kind === "plan" && m.status === "awaiting" ? m : null;
  })();

  /* AI 建议的下一句:输入框空着时灰字显示,按 Tab 填入。
     都是「推进到下一步」的确认语,发送时按确认处理,不再走一次模型 */
  const suggestion = busy
    ? null
    : pendingReply
      ? T("可以，按这个方案排分镜", "Looks good, build the storyboard")
      : pendingOptions
        ? T("用方案 A", "Go with option A")
        : pendingOutline
        ? T("可以，生成执行计划", "Looks good, draw up the plan")
        : pendingPlan
          ? T("可以，进入画布", "Open it in the canvas")
          : null;

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
    const confirmed = isConfirm(text) || text === suggestion;
    setDraft("");
    push({ id: nextId(), kind: "user", text });
    if (pendingReply) {
      if (confirmed) confirmReply(pendingReply);
      else void reviseReply(text, pendingReply);
      return;
    }
    if (pendingOptions) {
      /* 「用方案 B」「第二个」「C，开头换成产品特写」都认;只回「可以」就用推荐的 A */
      const pick = parseChoice(text, pendingOptions.options.length);
      if (pick) chooseOption(pendingOptions, pick.index, pick.rest || undefined);
      else if (confirmed) chooseOption(pendingOptions, 0);
      else
        push({
          id: nextId(),
          kind: "agent",
          text: T(
            `先选一个方案：回 ${pendingOptions.options.map((_, i) => OPTION_LETTERS[i]).join("、")}，选好后可以再改。`,
            `Pick one first — reply ${pendingOptions.options.map((_, i) => OPTION_LETTERS[i]).join(" / ")}. You can tweak it after.`,
          ),
        });
      return;
    }
    if (pendingOutline) {
      if (confirmed) makePlan(pendingOutline);
      else void requestOutline(brief as Brief, profiles, { current: pendingOutline.outline, change: text });
      return;
    }
    if (pendingPlan && confirmed) openCanvas(pendingPlan.outline);
  };

  const openCanvas = (outline: Outline) => {
    const handoff: Handoff = { brief: brief as Brief, profiles, outline, media: mediaRef.current };
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
                onRetry={m.id === messages[messages.length - 1]?.id && !busy ? retryAnalysis : undefined}
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
          suggestion={suggestion}
          placeholder={
            pendingReply
              ? T("回「可以」就开始排分镜，或者直接说要改什么…", "Reply “ok” to go ahead, or tell me what to change…")
              : T("想改哪里直接告诉我，用 @ 引用你的素材。", "Tell me what to change in this reel. Use @ to reference your footage.")
          }
        />
      </div>

    </div>
  );
}

/* ────────────────────────── 单条消息 ────────────────────────── */

const OPTION_LETTERS = ["A", "B", "C"];

/** 从用户的话里认出选了哪个方案;rest 是选完之后顺带提的修改(没有就是空串) */
function parseChoice(text: string, n: number): { index: number; rest: string } | null {
  const t = text.trim();
  const toIndex = (c: string) => {
    const k = c.toUpperCase();
    return { A: 0, B: 1, C: 2, "1": 0, "2": 1, "3": 2, 一: 0, 二: 1, 三: 2 }[k as "A"] ?? -1;
  };
  const patterns = [
    /(?:方案|选项|option|plan)\s*([ABCabc1-3一二三])/i,
    /第\s*([一二三1-3])\s*(?:个|版|种)/,
    /* 单独一个字母:后面只能是结尾、标点、「吧」或中文 —— 避免把英文句子里的冠词 a 当成方案 A */
    /^(?:我?(?:用|选|要)|就|go with)?\s*([ABCabc])(?=$|[，,。.!！吧]|\s*[\u4e00-\u9fff])/i,
  ];
  const FILLER = /^(?:go with|let'?s go with|i'?ll take|use|pick|我?(?:用|选|要)|就|吧|这个|那个)\s*/i;
  for (const p of patterns) {
    const m = t.match(p);
    if (!m) continue;
    const index = toIndex(m[1]);
    if (index < 0 || index >= n) continue;
    let rest = t.replace(m[0], "").replace(/^[\s，,。.!！、:：]+|[\s，,。.!！、:：吧]+$/g, "");
    for (let k = 0; k < 3 && FILLER.test(rest); k++) rest = rest.replace(FILLER, "").replace(/^[\s，,。.!！、:：]+/, "");
    return { index, rest: rest.length >= 4 ? rest : "" };
  }
  return null;
}

/* ── 3 个方案 ── 照 Marketing Agent 出策略方向的写法:一段文字回复,每个方案讲清楚
   洞察、结构、开场、镜头安排、标语、调性,结尾请用户选。选定后完整分镜表在下面单独给出。 */
function OptionsText({
  options,
  chosen,
  profiles,
}: {
  options: Outline[];
  chosen?: number;
  profiles: ClipProfile[];
}) {
  const zh = /[\u4e00-\u9fff]/.test(options[0]?.direction ?? "");
  const beatName = (r: Role) => (zh ? ROLE_ZH[r] : ROLE_META[r]?.label) ?? r;
  const L = zh
    ? { insight: "核心洞察", structure: "叙事结构", hook: "开场钩子", shots: "镜头安排", taglines: "标语建议", tone: "调性", mine: "你的素材", ai: "AI 补拍", self: "需要你补拍", pick: "推荐" }
    : { insight: "Insight", structure: "Structure", hook: "Opening", shots: "Shots", taglines: "Tagline options", tone: "Tone", mine: "your footage", ai: "AI shot", self: "you shoot this", pick: "Top pick" };
  const letters = options.map((_, i) => OPTION_LETTERS[i]).join(zh ? "、" : " / ");

  const shotLine = (s: Outline["shots"][number]) => {
    const src =
      s.source.kind === "clip"
        ? `${L.mine} ${profiles[s.source.clipIndex]?.label ?? ""}`
        : s.source.kind === "generate"
          ? L.ai
          : L.self;
    const sub = s.subtitle?.text ? (zh ? `「${s.subtitle.text}」` : ` “${s.subtitle.text}”`) : "";
    return `${beatName(s.role)} · ${s.durationSec}s · ${src}${sub ? (zh ? ` —${sub}` : ` —${sub}`) : ""}`;
  };

  return (
    <div className="space-y-5">
      <p>
        {zh
          ? `我按这条广告的投放目的，策划了 ${options.length} 个结构不同的方案，请看看：`
          : `Here are ${options.length} routes with different structures, each built around this ad's goal:`}
      </p>

      {options.map((o, i) => {
        const c = o.concept;
        const isChosen = chosen === i;
        return (
          <section key={i} className={chosen !== undefined && !isChosen ? "opacity-55" : ""}>
            <h4 className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-[#1a1a2e]">
              {zh ? "方案" : "Route"} {OPTION_LETTERS[i]}：{c?.title ?? o.structure?.name}
              <span className="text-[13px] font-semibold text-[#6a6b7b]">（{o.structure?.name}）</span>
              {i === 0 && chosen === undefined && (
                <span className="rounded-full bg-[#fff3ec] px-2 py-0.5 text-[11px] font-semibold text-[#d24f14]">{L.pick}</span>
              )}
              {isChosen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] px-2 py-0.5 text-[11px] font-semibold text-[#d24f14]">
                  <Check className="size-3" /> {zh ? "已选" : "Chosen"}
                </span>
              )}
            </h4>
            <ul className="mt-2 space-y-1.5">
              {c?.insight && <Item label={L.insight}>{c.insight}</Item>}
              <Item label={L.structure}>
                {o.shots.map((s) => beatName(s.role)).join(" → ")}
                {o.structure?.why ? <span className="text-[#6a6b7b]">。{o.structure.why}</span> : null}
              </Item>
              {c?.hook && <Item label={L.hook}>{c.hook}</Item>}
              <Item label={L.shots}>
                <ol className="mt-1 space-y-1">
                  {o.shots.map((s, j) => (
                    <li key={j} className="flex gap-2 text-[#4a4b5c]">
                      <span className="w-4 shrink-0 text-right tabular-nums text-[#9a9bb0]">{j + 1}.</span>
                      <span>{shotLine(s)}</span>
                    </li>
                  ))}
                </ol>
              </Item>
              {c?.taglines?.length ? (
                <Item label={L.taglines}>
                  <ol className="mt-1 space-y-1">
                    {c.taglines.slice(0, 3).map((t, j) => (
                      <li key={j} className="flex gap-2 text-[#4a4b5c]">
                        <span className="w-4 shrink-0 text-right tabular-nums text-[#9a9bb0]">{j + 1}.</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </Item>
              ) : null}
              {c?.tone && <Item label={L.tone}>{c.tone}</Item>}
            </ul>
          </section>
        );
      })}

      {chosen === undefined && (
        <>
          <hr className="border-[#ececf1]" />
          <p>
            {zh
              ? `请看看上面 ${options.length} 个方案，告诉我你最喜欢哪一个（回 ${letters}），或者直接提修改意见。选定后我会排出完整分镜。`
              : `Have a look and tell me which one you like best (reply ${letters}), or tell me what to change. Once you pick, I'll lay out the full storyboard.`}
          </p>
        </>
      )}
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#c6c8d4]" />
      <div className="min-w-0">
        <span className="font-semibold text-[#1a1a2e]">{label}：</span>
        {children}
      </div>
    </li>
  );
}

function MessageRow({
  message,
  onOpenCanvas,
  onCancelPlan,
  onRetry,
  profiles,
}: {
  message: Message;
  onRetry?: () => void;
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
      return (
        <AgentBlock>
          {message.text}
          {(message.retry || /^(分析失败|Analysis failed)/.test(message.text)) && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fff7f1]"
            >
              <RotateCcw className="size-3.5" /> Retry
            </button>
          )}
        </AgentBlock>
      );

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

    case "options":
      return (
        <AgentBlock>
          <OptionsText options={message.options} chosen={message.chosen} profiles={profiles} />
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
/* 执行计划里每一项的序号,和成片里的镜头顺序一致 */
function PlanSeq({ n }: { n: number }) {
  return (
    <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-[#ececf1] text-[11px] font-semibold tabular-nums text-[#4a4b5c]">
      {n}
    </span>
  );
}

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
                  <PlanSeq n={i + 1} />
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
                  <PlanSeq n={i + 1} />
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
                  <PlanSeq n={i + 1} />
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

function OutlineCard({
  outline,
  profiles,
  hideStructure,
}: {
  outline: Outline;
  profiles: ClipProfile[];
  hideStructure?: boolean;
}) {
  const total = outline.shots.reduce((n, s) => n + s.durationSec, 0);
  const zh = /[\u4e00-\u9fff]/.test(outline.direction);

  return (
    <div className="space-y-3">
      {outline.structure && !hideStructure && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ec] px-2.5 py-1 text-[12px] font-semibold text-[#d24f14]">
          <Layers className="size-3.5" /> {outline.structure.name}
        </span>
      )}
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
