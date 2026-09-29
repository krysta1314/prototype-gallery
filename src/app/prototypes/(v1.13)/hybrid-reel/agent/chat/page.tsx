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
  Music,
  Volume2,
  Type,
  Loader2,
} from "lucide-react";
import { voiceOf } from "@/lib/hybrid-reel/voices";
import { CARD_STYLES } from "@/lib/hybrid-reel/cards";
import { subtitlePreset } from "../../canvas/subtitles";
import { APPLE_FONT, Composer, HistoryRail, IconRail, TopBar } from "./shell";
import { getCanvas, getMedia, getSession, hydrateSession, latestSession, putMedia, saveSession, takePendingHandoff } from "./handoff";
import { MediaViewer, type ViewerItem } from "./viewer";
import { DemoBar } from "./guides";
import {
  HANDOFF_KEY,
  IDENTITY_META,
  PRODUCT_TYPE_LABEL,
  ROLE_META,
  SHOWCASE_LABEL,
  SOUND_META,
  MOTION_LABEL,
  CARD_KIND_LABEL,
  onScreenSec,
  PACE_LABEL,
  type Pace,
  type Treatment,
  type Identity,
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
  | { id: string; kind: "files"; files: MediaFile[] }
  | { id: string; kind: "thinking"; text: string }
  /* AI 看完素材后的一段完整回复(含 brief 六项),结尾问用户确认;没有按钮 */
  | { id: string; kind: "reply"; markdown: string; brief: Brief; model?: string; confirmed?: boolean; superseded?: boolean }
  | { id: string; kind: "outline"; outline: Outline; confirmed?: boolean; superseded?: boolean }
  /* 按投放目的给的 3 个不同结构的方案;chosen 之前可切换查看,选定后收起 */
  | { id: string; kind: "options"; options: Outline[]; chosen?: number }
  /* 生成计划卡(照真实产品的 Generation plan):每个 AI 补拍段 + 最终合成各一项,主按钮进画布 */
  | { id: string; kind: "plan"; outline: Outline; status: "awaiting" | "cancelled" };

type MediaFile = { name: string; url: string; isImage: boolean; isAudio?: boolean };

let seq = 0;
/* 带上页面加载时刻:刷新后计数归零,但恢复出来的旧消息 id 不会和新消息撞 */
const idBase = Date.now().toString(36);
const nextId = () => `m${idBase}-${(seq += 1)}`;

/** 读视频时长(秒);读不到就不给,分镜按描述估 */
function videoLength(url: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = (d?: number) => {
      v.removeAttribute("src");
      resolve(d && Number.isFinite(d) ? Math.round(d * 10) / 10 : undefined);
    };
    v.onloadedmetadata = () => done(v.duration);
    v.onerror = () => done();
    window.setTimeout(() => done(), 5000);
    v.src = url;
  });
}

/* 素材分析:一条素材一个请求(一条出错不拖累整批)。
   线上开了 Vercel Blob:浏览器先把文件直传到 Blob,再把链接交给分析接口 —— Vercel 接口的请求体上限 4.5MB,视频直接发会被拦。
   本地没开 Blob 就照旧把文件直接发过去(本地没有这个限制)。onUpload 报整体上传进度 */
async function analyzeFiles(files: File[], zh: boolean, onUpload: (pct: number) => void): Promise<{ profiles: ClipProfile[]; model: string }> {
  const lang = zh ? "zh" : "en";
  const blob = await fetch("/api/hybrid-reel/upload")
    .then((r) => (r.ok ? (r.json() as Promise<{ enabled: boolean }>) : { enabled: false }))
    .catch(() => ({ enabled: false }));
  const loaded = files.map(() => 0);
  const total = files.reduce((n, f) => n + f.size, 0) || 1;
  const report = () => onUpload(Math.min(100, Math.round((loaded.reduce((n, x) => n + x, 0) / total) * 100)));
  /* 等每一条都结束(成功或失败)再汇总:一条先失败时别的还在传,直接抛错的话后面的进度会把错误信息盖掉 */
  const settled = await Promise.allSettled(
    files.map(async (file, i) => {
      let init: RequestInit;
      if (blob.enabled) {
        const { upload } = await import("@vercel/blob/client");
        const put = await upload(`hybrid-reel/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/hybrid-reel/upload",
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (e) => {
            loaded[i] = Math.min(e.loaded, file.size - 1);
            report();
          },
        });
        loaded[i] = file.size;
        report();
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, items: [{ url: put.url, name: file.name, type: file.type, size: file.size }] }),
        };
      } else {
        const form = new FormData();
        form.append("file", file);
        form.append("lang", lang);
        init = { method: "POST", body: form };
      }
      const res = await fetch("/api/hybrid-reel/analyze", init);
      /* 被网关拦下时回来的不是 JSON(比如 "Request Entity Too Large"),给一句看得懂的 */
      const data = (await res.json().catch(() => ({ error: `${file.name}: HTTP ${res.status} ${res.statusText}` }))) as {
        profiles?: ClipProfile[];
        model?: string;
        error?: string;
      };
      if (!res.ok || !data.profiles) throw new Error(data.error ?? `HTTP ${res.status}`);
      return data;
    }),
  );
  const bad = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (bad) throw bad.reason;
  const results = settled.map((r) => (r as PromiseFulfilledResult<{ profiles?: ClipProfile[]; model?: string }>).value);
  return { profiles: results.flatMap((r) => r.profiles ?? []), model: results[0]?.model ?? "" };
}

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

  /* 出方案要 2–3 分钟:「思考中」那条按阶段换说法,并带上已用时间,不让人以为卡住了。
     只改还在的那条思考消息;结果回来被替换掉之后就不再动 */
  const startTicker = (id: string, stages: string[], hint: string) => {
    const t0 = Date.now();
    const timer = window.setInterval(() => {
      const sec = Math.floor((Date.now() - t0) / 1000);
      const stage = stages[Math.min(stages.length - 1, Math.floor(sec / 35))];
      const clock = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.id === id && last.kind === "thinking" ? [...prev.slice(0, -1), { ...last, text: `${stage} · ${clock} ${hint}` }] : prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  };

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
        isAudio: f.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(f.name),
      })),
    });
    if (prompt) push({ id: nextId(), kind: "user", text: prompt });
    push(watchingMsg(files.length, zh));
    await analyze(files, prompt, urls, zh);
  };

  const watchingMsg = (n: number, zh: boolean): Message => ({
    id: nextId(),
    kind: "thinking",
    text: zh ? `正在看这 ${n} 个文件…` : `Reviewing ${n} ${n === 1 ? "file" : "files"}…`,
  });

  /* 看素材 → 写提案。失败时留一条可重试的消息,素材不用重新上传 */
  const analyze = async (files: File[], prompt: string, urls: string[], zh: boolean) => {
    setBusy(true);

    try {
      /* 上传进度:全部传完就换成「正在看素材」;出错之后不再更新,免得把错误信息盖掉 */
      let failed = false;
      const analyzed = await analyzeFiles(files, zh, (pct) => {
        if (failed) return;
        replaceLast(
          pct >= 100
            ? watchingMsg(files.length, zh)
            : { id: nextId(), kind: "thinking", text: zh ? `正在上传素材… ${pct}%` : `Uploading footage… ${pct}%` },
        );
      }).catch((e: unknown) => {
        failed = true;
        throw e;
      });

      /* 视频的真实长度在浏览器里读,分镜才知道 in / out 点能取到哪 */
      const lengths = await Promise.all(
        (analyzed.profiles as ClipProfile[]).map((p, i) => (p.kind !== "image" && urls[i] ? videoLength(urls[i]) : Promise.resolve(undefined))),
      );
      const withUrls: ClipProfile[] = analyzed.profiles.map((p: ClipProfile, i: number) => ({
        ...p,
        objectUrl: urls[i],
        durationSec: lengths[i],
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
    const thinkingId = nextId();
    push({
      id: thinkingId,
      kind: "thinking",
      text: T("正在按投放目的挑选叙事结构…", "Picking narrative structures for this goal…"),
    });
    const stop = startTicker(
      thinkingId,
      [
        T("正在按投放目的挑选叙事结构…", "Picking narrative structures for this goal…"),
        T("正在为 3 个方案排镜头…", "Laying out shots for 3 routes…"),
        T("正在写旁白、字卡和音效…", "Writing voiceover, text and sound…"),
        T("正在定音乐、踩点和封面…", "Choosing music, beat sync and cover…"),
      ],
      T("（一般要 2–3 分钟）", "(usually 2–3 min)"),
    );
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
      stop();
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
    const thinkingId = nextId();
    const first = revision ? T("正在调整分镜…", "Updating the storyboard…") : T("正在把素材排进叙事结构…", "Matching your footage to a narrative…");
    push({ id: thinkingId, kind: "thinking", text: first });
    const stop = startTicker(thinkingId, [first, T("正在重算时长、字卡和音效…", "Rechecking timing, text and sound…")], T("（一般要 1 分钟左右）", "(usually about 1 min)"));
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
      stop();
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
      applyIdentities(data.identities);
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

  /* 用户在对话里纠正某个文件是干什么的(「SaveClip 那个只是参考」):AI 返回 identities,这里写回素材 */
  const applyIdentities = (list: { index: number; identity: Identity }[] | undefined) => {
    if (!list?.length) return;
    setProfiles((prev) =>
      prev.map((p, i) => {
        const hit = list.find((x) => x.index === i);
        if (!hit) return p;
        const identity = hit.identity;
        return { ...p, identity, identityEdited: true, showcase: identity === "showcase" ? p.showcase ?? (p.kind === "image" ? "photo" : "recording") : undefined };
      }),
    );
  };

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
    /* 这个对话之前进过画布:带上上次的工程(生成好的镜头、剪辑都在里面),不再按方案重搭 */
    const stored = getCanvas(sessionId);
    const saved = stored && JSON.stringify(stored.outline) === JSON.stringify(outline) ? stored : null;
    const handoff: Handoff & { project?: unknown } = {
      brief: brief as Brief,
      profiles,
      outline,
      sessionId: sessionId ?? undefined,
      /* 存下来的工程里写的是上次画布页的 URL,用它存的那份对照表(同一个 key 以它为准)才换得回来 */
      media: saved ? [...saved.media, ...mediaRef.current.filter((m) => !saved.media.some((x) => x.key === m.key))] : mediaRef.current,
      ...(saved ? { project: saved.project } : {}),
    };
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
    <div className="flex h-dvh flex-col bg-white" style={{ fontFamily: APPLE_FONT }}>
    {/* 演示栏:切换操作引导会不会弹(评审用,不是产品界面) */}
    <DemoBar note="Tab 采纳建议:对话里出现灰字建议时弹" />
    <div className="flex min-h-0 flex-1">
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
    ? { insight: "核心洞察", structure: "叙事结构", hook: "开场钩子", shots: "镜头安排", taglines: "标语建议", tone: "调性", mine: "你的素材", ai: "AI 补拍", self: "待补", pick: "推荐" }
    : { insight: "Insight", structure: "Structure", hook: "Opening", shots: "Shots", taglines: "Tagline options", tone: "Tone", mine: "your footage", ai: "AI shot", self: "gap", pick: "Top pick" };
  const letters = options.map((_, i) => OPTION_LETTERS[i]).join(zh ? "、" : " / ");

  const shotLine = (s: Outline["shots"][number]) => {
    const src =
      s.source.kind === "clip"
        ? `${L.mine} ${profiles[s.source.clipIndex]?.label ?? ""}`
        : s.source.kind === "generate"
          ? L.ai
          : L.self;
    const sub = s.subtitle?.text ? (zh ? `「${s.subtitle.text}」` : ` “${s.subtitle.text}”`) : "";
    return `${beatName(s.role)} · ${onScreenSec(s)}s · ${src}${sub ? (zh ? ` —${sub}` : ` —${sub}`) : ""}`;
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
      return <FilesMessage files={message.files} />;

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
            {/* 素材拆解:第一次提案下面给出每条素材哪几段能用,用户看得到 Agent 看懂了什么 */}
            {message.model && profiles.length > 0 && (
              <FootageBreakdown profiles={profiles} />
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

/* 用户发出的素材:图片一行、视频一行、音频一行;点缩略图弹出预览,同一条消息里的图片和视频可以左右切换(顺序同排布:先图后视频)。
   音频不进预览,点一下就地播放 / 暂停 */
function FilesMessage({ files }: { files: MediaFile[] }) {
  const [at, setAt] = useState<number | null>(null);
  const images = files.filter((f) => f.isImage);
  const videos = files.filter((f) => !f.isImage && !f.isAudio);
  const audios = files.filter((f) => f.isAudio);
  const ordered = [...images, ...videos];
  const items: ViewerItem[] = ordered.map((f) => ({ kind: f.isImage ? "image" : "video", src: f.url, title: f.name }));
  const rows = [images, videos].filter((r) => r.length > 0);
  return (
    <div className="flex flex-col items-end gap-2">
      {audios.length > 0 && (
        <div className="order-last flex flex-wrap justify-end gap-2">
          {audios.map((f) => (
            <AudioChip key={f.url} file={f} />
          ))}
        </div>
      )}
      {/* 每行放得下就一排;窗口窄到放不下才换行 */}
      {rows.map((row, r) => (
        <div key={r} className="flex flex-wrap justify-end gap-2">
          {row.map((f) => {
            const i = ordered.indexOf(f);
            return (
              <button
                key={f.url}
                type="button"
                title={f.name}
                aria-label={`Preview ${f.name}`}
                onClick={() => setAt(i)}
                className="group/thumb relative block size-16 overflow-hidden rounded-[14px] bg-[#e7e6ec] ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/60 focus-visible:ring-offset-2"
              >
                {f.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="size-full object-cover" />
                ) : (
                  <VideoThumb src={f.url} />
                )}
                {/* 悬停压暗一点,告诉用户能点开 */}
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover/thumb:bg-black/15" />
                {!f.isImage && (
                  <span aria-hidden className="absolute inset-0 grid place-items-center">
                    <span className="grid size-6 place-items-center rounded-full bg-white/90 text-[#1a1a2e] shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform duration-150 group-hover/thumb:scale-110">
                      <Play className="ml-[1px] size-3 fill-current" />
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
      {at !== null && <MediaViewer items={items} index={at} onIndex={setAt} onClose={() => setAt(null)} />}
    </div>
  );
}

function AudioChip({ file }: { file: MediaFile }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      title={file.name}
      aria-label={`${playing ? "Pause" : "Play"} ${file.name}`}
      onClick={() => {
        const a = ref.current;
        if (!a) return;
        if (a.paused) void a.play();
        else a.pause();
      }}
      className="flex h-16 max-w-[220px] items-center gap-2.5 rounded-[14px] bg-[#f6f5f8] px-3.5 text-left ring-1 ring-black/5 outline-none transition-colors hover:bg-[#efeef3] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/60"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
        {playing ? <span className="flex gap-[3px]"><span className="h-3 w-[3px] rounded-sm bg-current" /><span className="h-3 w-[3px] rounded-sm bg-current" /></span> : <Play className="ml-[1px] size-3.5 fill-current" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold text-[#1a1a2e]">{file.name}</span>
        <span className="flex items-center gap-1 text-[11px] text-[#9a9bb0]">
          <Music className="size-3" /> Audio
        </span>
      </span>
      <audio ref={ref} src={file.url} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </button>
  );
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
   用户选定方案后,把之后剪辑器里要用的东西全部 plan 出来(剪辑方案 spec):
   顶部一块整片设定(旁白、音乐与踩点、字幕、字卡色、封面),下面每个镜头一项:
   自有素材标「无需生成」、AI 补拍带 prompt / 参数 / 参考图 / 尾帧;每项再列画面处理、原声、字卡、音效。
   这里不生成、不扣费 —— 不显示任何 credits 数字;底部一句说明 + Cancel + Edit in canvas,生成和扣费都在画布里。 */
/* 执行计划里每一项的序号,和成片里的镜头顺序一致 */
function PlanSeq({ n }: { n: number }) {
  return (
    <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-[#ececf1] text-[11px] font-semibold tabular-nums text-[#4a4b5c]">
      {n}
    </span>
  );
}

function Chip({ children, tone = "plain", title }: { children: React.ReactNode; tone?: "plain" | "accent"; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-md border px-2 py-[3px] text-[11.5px] ${
        tone === "accent" ? "border-[#ffd9c4] bg-[#fff7f1] text-[#b8430f]" : "border-[#ececf1] bg-white text-[#1a1a2e]"
      }`}
    >
      {children}
    </span>
  );
}

/** 一格参考缩略图(视频取那一秒的画面) */
function RefThumb({ p, at, badge }: { p?: ClipProfile; at?: number; badge?: string }) {
  if (!p?.objectUrl) return null;
  return (
    <span className="relative" title={`${p.label}${badge ? ` · ${badge}` : ""}`}>
      {p.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.objectUrl} alt="" className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
      ) : (
        <video src={`${p.objectUrl}#t=${at ?? 0.5}`} muted preload="metadata" className="size-7 rounded-md object-cover ring-1 ring-[#ececf1]" />
      )}
      {badge && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#1a1a2e] px-1 text-[8.5px] font-bold uppercase leading-[13px] text-white">
          {badge}
        </span>
      )}
    </span>
  );
}

/** 画面处理的意图:创作意图才上卡(变速、动效、局部放大…),画幅适配这类技术细节默认处理不展示 */
function treatmentChips(t: Treatment | undefined): string[] {
  if (!t) return [];
  const out: string[] = [];
  if (t.speed && t.speed !== 1) out.push(`${t.speed}× ${t.speed < 1 ? "slow-mo" : "speed-up"}`);
  if (t.motion && t.motion !== "none") out.push(MOTION_LABEL[t.motion]);
  if (t.zoom) out.push(`Zoom to ${t.zoom.target || "detail"}${t.zoom.follow ? " · follows cursor" : ""}`);
  if (t.device) out.push(t.device === "phone" ? "Phone frame" : "Laptop frame");
  if (t.highlight) out.push("Click highlight");
  if (t.asCard) out.push("Review card");
  if (t.stabilize) out.push("Stabilize");
  if (t.cutout) out.push("Cut out product");
  if (t.pip) out.push("Picture-in-picture");
  if (t.keepWhole) out.push("Keep whole on beat sync");
  return out;
}

function PlanDetail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[12px] leading-snug">
      <span className="w-[74px] shrink-0 pt-[3px] font-semibold text-[#9a9bb0]">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/** 每个镜头下面的明细:画面处理、原声、字幕 / 旁白、字卡、音效 */
function ShotDetails({ shot, delivery, pace }: { shot: Shot; delivery?: string; pace?: Pace }) {
  const chips = treatmentChips(shot.treatment);
  const spoken = shot.subtitle?.text?.trim();
  return (
    <div className="mt-2.5 space-y-1.5 border-t border-dashed border-[#ececf1] pt-2.5">
      {(chips.length > 0 || shot.treatment?.note) && (
        <PlanDetail label="Picture">
          {chips.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {shot.treatment?.note && <span className="text-[#6a6b7b]">{shot.treatment.note}</span>}
        </PlanDetail>
      )}
      {shot.sound && (
        <PlanDetail label="Sound">
          <Chip>{shot.sound.keep ? `Original sound ${shot.sound.volume}%` : "Original sound muted"}</Chip>
          {shot.sound.note && <span className="text-[#6a6b7b]">{shot.sound.note}</span>}
        </PlanDetail>
      )}
      {shot.source.kind === "generate" && (
        <PlanDetail label="Sound">
          <Chip>{shot.source.withAudio === false ? "No generated sound" : "Generated with its own sound"}</Chip>
        </PlanDetail>
      )}
      {spoken && (
        <PlanDetail label={shot.subtitle.source === "stt" ? "Speech" : "Voiceover"}>
          <span className="text-[#1a1a2e]">&ldquo;{spoken}&rdquo;</span>
          {shot.subtitle.source !== "stt" && (shot.delivery || delivery) && <Chip>{shot.delivery || delivery}</Chip>}
          {shot.subtitle.source !== "stt" && <Chip>{PACE_LABEL[shot.pace || pace || "normal"]} pace</Chip>}
        </PlanDetail>
      )}
      {spoken && (
        <PlanDetail label="Subtitles">
          <span className="text-[#6a6b7b]">Same words, filled in on the subtitle track</span>
        </PlanDetail>
      )}
      {shot.cards?.length ? (
        <PlanDetail label="Text">
          {shot.cards.map((c, i) => (
            <Chip key={i} tone="accent" title={`${CARD_KIND_LABEL[c.kind] ?? c.kind} · ${c.style} · ${c.anim} · ${c.inSec}–${c.outSec}s`}>
              <Type className="size-3 shrink-0" />
              <span className="truncate">{c.text}</span>
              <span className="shrink-0 tabular-nums text-[#d9875a]">
                {c.inSec}–{c.outSec}s{c.sfx ? ` · ${c.sfx}` : ""}
              </span>
            </Chip>
          ))}
        </PlanDetail>
      ) : null}
      {shot.sfx?.length ? (
        <PlanDetail label="SFX">
          {shot.sfx.map((x, i) => (
            <Chip key={i}>
              <Volume2 className="size-3" /> {x.kind} @ {x.atSec}s
            </Chip>
          ))}
        </PlanDetail>
      ) : null}
      {!chips.length && !shot.treatment?.note && !shot.sound && !spoken && !shot.cards?.length && !shot.sfx?.length && shot.source.kind !== "generate" && (
        <span className="text-[12px] text-[#9a9bb0]">Default handling</span>
      )}
    </div>
  );
}

/* 整片设定:产品类型、旁白(音色 + 语气)、音乐与踩点、字幕、屏幕文字、封面 —— 剪辑器里每条轨的起点。
   分镜表和执行计划卡共用,出方案时就写全 */
function WholeCut({ outline, profiles }: { outline: Outline; profiles: ClipProfile[] }) {
  const vo = outline.voiceover;
  const music = outline.music;
  const hasSpeech = outline.shots.some((s) => s.subtitle?.text?.trim());
  const cardCount = outline.shots.reduce((n, s) => n + (s.cards?.length ?? 0), 0);
  const musicFile = music?.source === "upload" && typeof music.clipIndex === "number" ? profiles[music.clipIndex] : undefined;
  return (
    <div className="space-y-1.5 rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
      <span className="mb-1 block text-[12px] font-bold uppercase tracking-[0.06em] text-[#9a9bb0]">Whole cut</span>
      {outline.productType && (
        <PlanDetail label="Product">
          <Chip>{PRODUCT_TYPE_LABEL[outline.productType]}</Chip>
        </PlanDetail>
      )}
      <PlanDetail label="Voiceover">
        <Chip>{vo?.on === false ? "No voiceover" : `Voiceover · ${voiceOf(vo?.voice).label}`}</Chip>
        {vo?.on !== false && vo?.delivery && <Chip>{vo.delivery}</Chip>}
        {vo?.on !== false && <Chip>{PACE_LABEL[vo?.pace ?? "normal"]} pace</Chip>}
        {vo?.why && <span className="text-[#6a6b7b]">{vo.why}</span>}
      </PlanDetail>
      <PlanDetail label="Music">
        <Chip>
          <Music className="size-3" />
          {music?.source === "upload" ? `Your track · ${musicFile?.label ?? ""}` : music?.source === "library" ? "From library" : "AI-generated"}
          {music?.bpm ? ` · ${music.bpm} BPM` : ""}
        </Chip>
        {music?.beatSync !== false && <Chip>Cuts on the beat</Chip>}
        <Chip>Ducks under voice</Chip>
        {(music?.prompt || outline.bgmPrompt) && music?.source !== "upload" && <span className="text-[#6a6b7b]">{music?.prompt || outline.bgmPrompt}</span>}
      </PlanDetail>
      <PlanDetail label="Subtitles">
        <Chip>{hasSpeech ? `From what's said · ${subtitlePreset(outline.subtitleStyle ?? "classic").name} style` : "None — nobody speaks"}</Chip>
      </PlanDetail>
      <PlanDetail label="Text">
        <Chip>
          {cardCount} on-screen {cardCount === 1 ? "text" : "texts"}
        </Chip>
        {outline.cardAccent && (
          <Chip title={`Accent colour ${outline.cardAccent}`}>
            <span className="size-2.5 rounded-sm ring-1 ring-inset ring-black/10" style={{ background: outline.cardAccent }} /> Accent colour
          </Chip>
        )}
      </PlanDetail>
      {outline.cover && (
        <PlanDetail label="Cover">
          <Chip>
            Shot {outline.cover.shot + 1} @ {outline.cover.atSec}s
          </Chip>
          {outline.cover.title && <span className="text-[#1a1a2e]">&ldquo;{outline.cover.title}&rdquo;</span>}
          {outline.cover.prompt && <PromptToggle label="View cover prompt" text={outline.cover.prompt} />}
        </PlanDetail>
      )}
    </div>
  );
}

/** 「View prompt」:点开看完整 prompt,和执行计划卡里 AI 镜头的同一个样式 */
function PromptToggle({ label = "View prompt", text }: { label?: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="block w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[12px] text-[#6a6b7b] hover:text-[#1a1a2e]"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {label}
      </button>
      {open && <span className="mt-1 block whitespace-pre-line rounded-lg bg-white px-2.5 py-2 text-[12px] leading-relaxed text-[#1a1a2e] ring-1 ring-inset ring-[#ececf1]">{text}</span>}
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
  const [openPrompt, setOpenPrompt] = useState<number | null>(null);
  /* 点了进画布:画布页第一次打开要编译 / 加载素材,按钮先转起来,别让人以为没点到 */
  const [opening, setOpening] = useState(false);
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
          <Layers className="size-3.5" /> {itemCount} {itemCount === 1 ? "shot" : "shots"}
        </span>
      </div>

      <div className="mx-3 mb-2">
        <WholeCut outline={outline} profiles={profiles} />
      </div>

      <div className="space-y-2 px-3 pb-3">
        {outline.shots.map((shot, i) => {
          const role = ROLE_META[shot.role] ?? ROLE_META.hook;
          const roleName = role.label ?? String(shot.role);

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
                      Your footage · {roleName} ({onScreenSec(shot)}s)
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="max-w-[360px] truncate rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]" title={clip?.label}>
                        {clip?.label ?? `clip ${shot.source.clipIndex}`}
                        {clip?.kind === "image" ? "" : ` | ${shot.source.inSec}s–${shot.source.outSec}s`} | no generation
                      </span>
                      <RefThumb p={clip} at={shot.source.inSec} />
                    </div>
                    <ShotDetails shot={shot} delivery={outline.voiceover?.delivery} pace={outline.voiceover?.pace} />
                  </span>
                </div>
              </div>
            );
          }

          /* 旧会话里的「请自己拍」:新方案不再产出,只照原样显示 */
          if (shot.source.kind === "blocked") {
            return (
              <div key={i} className="rounded-xl border border-dashed border-[#e0dfe6] bg-white p-3">
                <div className="flex items-start gap-2">
                  <PlanSeq n={i + 1} />
                  <Ban className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                      {roleName} ({onScreenSec(shot)}s)
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
          const refs = (src.refs ?? []).map((r) => ({ p: profiles[r.clipIndex], at: r.atSec })).filter((r) => r.p?.objectUrl);
          const last = src.lastFrame ? profiles[src.lastFrame.clipIndex] : undefined;
          return (
            <div key={i} className="rounded-xl border border-[#ececf1] bg-[#fbfbfc] p-3">
              <div className="flex items-start gap-2">
                <PlanSeq n={i + 1} />
                <Wand2 className="mt-[3px] size-4 shrink-0 text-[#6a6b7b]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-[#1a1a2e]">
                    AI shot · {roleName} ({shot.durationSec}s)
                  </span>
                  {src.summary && <span className="mt-0.5 block text-[12.5px] leading-snug text-[#4a4b5c]">{src.summary}</span>}
                  <button
                    type="button"
                    onClick={() => setOpenPrompt(openPrompt === i ? null : i)}
                    className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-[#6a6b7b] hover:text-[#1a1a2e]"
                  >
                    {openPrompt === i ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                    View prompt
                  </button>
                  {openPrompt === i && (
                    <p className="mt-1.5 whitespace-pre-line rounded-lg bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-[#1a1a2e]">
                      {src.prompt}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[#ececf1] bg-white px-2 py-[3px] text-[11.5px] text-[#1a1a2e]">
                      Seedance 2.0 | 9:16 | 720p | {shot.durationSec}s | {src.genType}
                    </span>
                    {/* 参考图每镜由 AI 挑(最多 9 张);尾帧图单独标出来 */}
                    {(refs.length > 0 || last) && (
                      <span className="flex flex-wrap items-center gap-1 pb-1">
                        {refs.map((r, k) => (
                          <RefThumb key={k} p={r.p} at={r.at} />
                        ))}
                        {last && <RefThumb p={last} badge="Last" />}
                      </span>
                    )}
                  </div>
                  <ShotDetails shot={shot} delivery={outline.voiceover?.delivery} pace={outline.voiceover?.pace} />
                </span>
              </div>
            </div>
          );
        })}

      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf1] bg-[#faf8f6] px-4 py-3">
        <span className="text-[13px] text-[#6a6b7b]">
          Confirm to open this plan in the canvas — generation and credits happen there.
        </span>
        {status === "awaiting" && (
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={opening}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13.5px] font-semibold text-[#1a1a2e] transition hover:border-[#d4d3df] hover:bg-[#faf8f6] disabled:opacity-50"
            >
              <X className="size-3.5" /> Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (opening) return;
                setOpening(true);
                onConfirm();
              }}
              aria-busy={opening}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-4 py-2 text-[13.5px] font-bold text-white shadow-[0_6px_18px_rgba(255,82,85,0.24)] transition hover:brightness-105 aria-busy:cursor-progress aria-busy:brightness-95"
            >
              {opening ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Opening canvas…
                </>
              ) : (
                <>
                  Edit in canvas <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

/* 分镜表:出方案时就把剪辑器里要用的东西全部写出来 —— 顶部整片设定,每个镜头一行:
   画面(素材 / AI 补拍 prompt 与参考图 + 画面处理)、声音(旁白与语气、原声、音效)、字幕、屏幕文字 */
function OutlineCard({
  outline,
  profiles,
  hideStructure,
}: {
  outline: Outline;
  profiles: ClipProfile[];
  hideStructure?: boolean;
}) {
  const total = Math.round(outline.shots.reduce((n, s) => n + onScreenSec(s), 0) * 10) / 10;
  const styleName = (id: string) => CARD_STYLES.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="space-y-3">
      {outline.structure && !hideStructure && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3ec] px-2.5 py-1 text-[12px] font-semibold text-[#d24f14]">
          <Layers className="size-3.5" /> {outline.structure.name}
        </span>
      )}
      <p>{outline.direction}</p>
      <p className="text-[12.5px] tabular-nums text-[#6a6b7b]">
        {outline.shots.length} shots · {total}s on screen
      </p>

      <WholeCut outline={outline} profiles={profiles} />

      <div className="overflow-x-auto rounded-2xl border border-[#ececf1]">
        <table className="w-full min-w-[1040px] border-collapse text-[12.5px] leading-snug">
          <thead>
            <tr className="bg-[#faf8f6] text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[#9a9bb0]">
              <th className="w-8 px-3 py-2.5">#</th>
              <th className="w-[86px] px-3 py-2.5">Beat</th>
              <th className="w-[26%] px-3 py-2.5">Picture</th>
              <th className="w-[24%] px-3 py-2.5">Sound</th>
              <th className="w-[16%] px-3 py-2.5">Subtitles</th>
              <th className="px-3 py-2.5">Text</th>
            </tr>
          </thead>
          <tbody>
            {outline.shots.map((shot, i) => {
              const meta = ROLE_META[shot.role] ?? ROLE_META.hook;
              const clip = shot.source.kind === "clip" ? profiles[shot.source.clipIndex] : undefined;
              const chips = treatmentChips(shot.treatment);
              const spoken = shot.subtitle?.text?.trim();
              const src = shot.source;
              return (
                <tr key={i} className="border-t border-[#ececf1] align-top">
                  <td className="px-3 py-3 tabular-nums text-[#9a9bb0]">{i + 1}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11px] font-bold" style={{ background: meta.soft, color: meta.color }}>
                      <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
                      {meta.label ?? String(shot.role)}
                    </span>
                    <span className="mt-1.5 block tabular-nums text-[#1a1a2e]">{onScreenSec(shot)}s</span>
                  </td>
                  {/* 画面:素材从哪到哪 / AI 补拍拍什么(prompt、参考图、尾帧),再加画面处理 */}
                  <td className="space-y-1.5 px-3 py-3 text-[#1a1a2e]">
                    {src.kind === "clip" && (
                      <div>
                        <span className="block max-w-[260px] truncate font-semibold" title={clip?.label}>
                          {clip?.label ?? `clip ${src.clipIndex}`}
                        </span>
                        {clip?.kind !== "image" && <span className="text-[#9a9bb0]">{src.inSec}s – {src.outSec}s</span>}
                      </div>
                    )}
                    {src.kind === "generate" && (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1a1a2e] px-2 py-[2px] text-[10.5px] font-bold text-white">
                          <Wand2 className="size-3" /> AI shot
                        </span>
                        <span className="block text-[#4a4b5c]">{src.summary || src.prompt}</span>
                        {(src.refs?.length || src.lastFrame) && (
                          <span className="flex flex-wrap items-center gap-1 pb-1">
                            {(src.refs ?? []).map((r, k) => (
                              <RefThumb key={k} p={profiles[r.clipIndex]} at={r.atSec} />
                            ))}
                            {src.lastFrame && <RefThumb p={profiles[src.lastFrame.clipIndex]} badge="Last" />}
                          </span>
                        )}
                        {src.prompt && <PromptToggle text={src.prompt} />}
                      </div>
                    )}
                    {src.kind === "blocked" && <span className="text-[#6a6b7b]">{src.reason} {src.suggestion}</span>}
                    {chips.length > 0 && (
                      <span className="flex flex-wrap gap-1">
                        {chips.map((c) => (
                          <Chip key={c}>{c}</Chip>
                        ))}
                      </span>
                    )}
                    {shot.treatment?.note && <span className="block text-[#6a6b7b]">{shot.treatment.note}</span>}
                  </td>
                  {/* 声音:旁白(语气)/ 口播、原声怎么处理、补拍自带的声音、镜头外的音效 */}
                  <td className="space-y-1.5 px-3 py-3 text-[#1a1a2e]">
                    {spoken ? (
                      <span className="block">
                        <span className="mr-1.5 rounded bg-[#f6f5f8] px-1.5 text-[10px] font-bold uppercase text-[#9a9bb0]">
                          {shot.subtitle.source === "stt" ? "speech" : "voiceover"}
                        </span>
                        &ldquo;{spoken}&rdquo;
                        {shot.subtitle.source !== "stt" && (
                          <span className="mt-0.5 block text-[11.5px] text-[#6a6b7b]">
                            {[shot.delivery || outline.voiceover?.delivery, `${PACE_LABEL[shot.pace || outline.voiceover?.pace || "normal"]} pace`].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="block text-[#9a9bb0]">No voiceover</span>
                    )}
                    <span className="flex flex-wrap gap-1">
                      {shot.sound && <Chip>{shot.sound.keep ? `Original ${shot.sound.volume}%` : "Original muted"}</Chip>}
                      {src.kind === "generate" && <Chip>{src.withAudio === false ? "No generated sound" : "Own generated sound"}</Chip>}
                      {shot.sfx?.map((x, k) => (
                        <Chip key={k}>
                          <Volume2 className="size-3" /> {x.kind} @ {x.atSec}s
                        </Chip>
                      ))}
                    </span>
                    {shot.sound?.note && <span className="block text-[#6a6b7b]">{shot.sound.note}</span>}
                  </td>
                  {/* 字幕 = 说出来的话;进画布就预填好 */}
                  <td className="px-3 py-3 text-[#1a1a2e]">{spoken ? spoken : <span className="text-[#c6c8d4]">—</span>}</td>
                  {/* 屏幕文字:类型、文案、出现时间、样式、动效、进场音效 */}
                  <td className="px-3 py-3 text-[#1a1a2e]">
                    {shot.cards?.length ? (
                      <ul className="space-y-1.5">
                        {shot.cards.map((c, k) => (
                          <li key={k}>
                            <span className="mr-1 text-[10px] font-bold uppercase text-[#d9875a]">{CARD_KIND_LABEL[c.kind] ?? c.kind}</span>
                            {c.text}
                            <span className="block text-[11.5px] tabular-nums text-[#6a6b7b]">
                              {c.inSec}–{c.outSec}s · {styleName(c.style)} style · {c.anim} in
                              {c.sfx ? ` · sound: ${c.sfx}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[#c6c8d4]">—</span>
                    )}
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

/* 素材拆解的两种颜色:能用 / 废片(时间条、图例、列表圆点、预览里的小标共用) */
const SEG_USABLE = "#ff9563";
const SEG_CUT = "#c9cad4";

/* ── 素材拆解:每个上传文件一行,标出 AI 判断的身份(可改)和原声;视频再给一条时间条 + 片段清单,
   能用的段标出能当什么镜头、证明了什么卖点、原声是什么,废片标出原因。
   点缩略图看整条素材;点某一段只播这一段,用来核对 Agent 说能用 / 不能用的到底是哪几秒 ── */
function FootageBreakdown({ profiles }: { profiles: ClipProfile[] }) {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<{ items: ViewerItem[]; index: number } | null>(null);
  /* 时间条和列表联动:悬停哪一段(「素材名#序号」),两边一起高亮 */
  const [hover, setHover] = useState<string | null>(null);
  const cuttable = (p: ClipProfile) => ["footage", "showcase", "evidence"].includes(p.identity ?? "footage");
  const videos = profiles.filter((p) => p.kind === "video" && p.segments?.length && cuttable(p));
  const usable = videos.reduce((n, p) => n + (p.segments ?? []).filter((g) => g.usable).length, 0);
  const cut = videos.reduce((n, p) => n + (p.segments ?? []).filter((g) => !g.usable).length, 0);
  const roleName = (r: string) => ROLE_META[r as Role]?.label ?? r;
  /* 同一条视频的每一段都放进预览,可以左右切着看 */
  const segmentItems = (p: ClipProfile): ViewerItem[] =>
    (p.segments ?? []).map((g) => ({
      kind: "video",
      src: p.objectUrl!,
      title: p.label,
      start: g.start,
      end: g.end,
      usable: g.usable,
      tag: g.usable ? (g.roles.length ? g.roles.map(roleName).join(" / ") : "Usable") : "Cut",
      caption: g.usable ? g.description : g.reason || g.description,
      note: g.usable ? g.sellingPoint : undefined,
    }));
  const preview = (p: ClipProfile) =>
    setView({ items: [{ kind: p.kind === "image" ? "image" : "video", src: p.objectUrl!, title: p.label }], index: 0 });

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {open ? <ChevronDown className="size-4 text-[#6a6b7b]" /> : <ChevronRight className="size-4 text-[#6a6b7b]" />}
        <span className="text-[14px] font-semibold text-[#1a1a2e]">Footage breakdown</span>
        {/* 计数带同色圆点,兼作时间条的图例 */}
        <span className="ml-auto flex items-center gap-1.5 text-[12px] tabular-nums text-[#6a6b7b]">
          {profiles.length} {profiles.length === 1 ? "file" : "files"}
          {videos.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="size-2 rounded-full" style={{ background: SEG_USABLE }} aria-hidden />
              {usable} usable
              <span aria-hidden>·</span>
              <span className="size-2 rounded-full" style={{ background: SEG_CUT }} aria-hidden />
              {cut} cut
            </>
          )}
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-[#ececf1] px-4 pb-4 pt-3">
          {profiles.map((p, index) => {
            const identity: Identity = p.identity ?? (p.kind === "audio" ? "audio" : "footage");
            const showSegments = p.kind === "video" && !!p.segments?.length && cuttable(p);
            const len = p.durationSec ?? p.segments?.[p.segments.length - 1]?.end ?? 0;
            const kindLine = [
              p.kind === "audio" ? (p.audioKind === "voice" ? "Voice recording" : p.audioKind === "sfx" ? "Sound effect" : "Music") : undefined,
              identity === "showcase" && p.showcase ? SHOWCASE_LABEL[p.showcase] : undefined,
              p.kind !== "image" && len ? `${Math.round(len * 10) / 10}s` : undefined,
            ].filter(Boolean);
            return (
              <div key={`${p.label}-${index}`}>
                <div className="flex items-center gap-2.5">
                  {p.kind === "audio" ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#f1f2f5] text-[#6a6b7b]">
                      <Music className="size-4" />
                    </span>
                  ) : p.objectUrl ? (
                    <button
                      type="button"
                      title={p.label}
                      aria-label={`Preview ${p.label}`}
                      onClick={() => preview(p)}
                      className="group/thumb relative size-9 shrink-0 overflow-hidden rounded-md bg-[#f1f2f5] ring-1 ring-[#ececf1] outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/60"
                    >
                      {p.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.objectUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <video src={`${p.objectUrl}#t=0.5`} muted preload="metadata" className="size-full object-cover" />
                      )}
                      <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition duration-150 group-hover/thumb:bg-black/25 group-hover/thumb:opacity-100 group-focus-visible/thumb:bg-black/25 group-focus-visible/thumb:opacity-100">
                        {p.kind === "image" ? <ImageIcon className="size-3.5" /> : <Play className="ml-px size-3.5 fill-current" />}
                      </span>
                    </button>
                  ) : (
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#f1f2f5] text-[#9a9bb0]">
                      {p.kind === "image" ? <ImageIcon className="size-4" /> : <Film className="size-4" />}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#1a1a2e]" title={p.label}>
                      {p.label}
                    </span>
                    <span className="block truncate text-[11.5px] tabular-nums text-[#9a9bb0]">
                      {[...kindLine, p.identityEdited ? "Changed as you asked" : p.identityWhy].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {p.kind === "video" && p.sound && p.sound !== "silent" && (
                    <span
                      className="hidden shrink-0 items-center gap-1 rounded-full bg-[#f6f5f8] px-2 py-[3px] text-[11px] font-semibold text-[#4a4b5c] sm:inline-flex"
                      title={`${SOUND_META[p.sound].plan}${p.soundNote ? ` · ${p.soundNote}` : ""}`}
                    >
                      <Volume2 className="size-3" /> {SOUND_META[p.sound].label}
                    </span>
                  )}
                  {/* 身份:AI 判断,不给下拉;用户要改就在对话里说 */}
                  <span className="shrink-0 rounded-full bg-[#fff3ec] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#d24f14]">
                    {IDENTITY_META[identity].label}
                  </span>
                </div>
                {identity === "reference" && (
                  <p className="mt-1.5 pl-[46px] text-[12px] text-[#6a6b7b]">
                    Only its colours, tone and copy style are borrowed — it stays out of the cut.
                  </p>
                )}
                {showSegments && (
                  <>
                    {/* 时间条:能用的段橙色,废片灰色。悬停某一段,下面对应那一行跟着高亮;点了播这一段 */}
                    <div className="mt-2 flex h-1.5 gap-px overflow-hidden rounded-full bg-[#f1f2f5]">
                      {p.segments!.map((g, i) => {
                        const key = `${p.label}#${i}`;
                        const hot = hover === key;
                        return (
                          <button
                            key={i}
                            type="button"
                            tabIndex={-1}
                            aria-hidden
                            disabled={!p.objectUrl}
                            title={`${g.start}–${g.end}s · ${g.usable ? "Usable" : "Cut"}`}
                            onMouseEnter={() => setHover(key)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => setView({ items: segmentItems(p), index: i })}
                            className="h-full cursor-pointer transition-opacity disabled:cursor-default"
                            style={{
                              width: `${((g.end - g.start) / len) * 100}%`,
                              background: g.usable ? SEG_USABLE : SEG_CUT,
                              opacity: hover && hover.startsWith(`${p.label}#`) && !hot ? 0.45 : 1,
                            }}
                          />
                        );
                      })}
                    </div>
                    <ul className="mt-1.5">
                      {p.segments!.map((g, i) => {
                        const body = (
                          <>
                            {/* 圆点跟第一行文字对齐:这一栏只有一行高(不被右边多行描述撑高),圆点在这一行里居中 */}
                            <span className="flex h-[1.5em] w-[86px] shrink-0 items-center gap-1.5 self-start tabular-nums text-[#9a9bb0]">
                              <span className="size-2 shrink-0 rounded-full" style={{ background: g.usable ? SEG_USABLE : SEG_CUT }} aria-hidden />
                              {g.start}–{g.end}s
                            </span>
                            <span className={`min-w-0 flex-1 ${g.usable ? "text-[#1a1a2e]" : "text-[#9a9bb0]"}`}>
                              {g.usable ? g.description : `Cut · ${g.reason || g.description}`}
                              {g.usable && (g.roles.length > 0 || g.sellingPoint || (g.sound && g.sound !== "silent")) && (
                                <span className="mt-0.5 block text-[11.5px] text-[#6a6b7b]">
                                  {[g.roles.map(roleName).join(" / "), g.sellingPoint, g.sound && g.sound !== "silent" ? `Sound: ${SOUND_META[g.sound].label}` : ""]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              )}
                            </span>
                          </>
                        );
                        return (
                          <li key={i}>
                            {p.objectUrl ? (
                              /* 整行可点:悬停出底色和播放图标,点了只播这一段 */
                              <button
                                type="button"
                                aria-label={`Play ${g.start}–${g.end}s of ${p.label}`}
                                onClick={() => setView({ items: segmentItems(p), index: i })}
                                onMouseEnter={() => setHover(`${p.label}#${i}`)}
                                onMouseLeave={() => setHover(null)}
                                className={`group/seg -mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-lg px-2 py-[3px] text-left text-[12.5px] leading-snug outline-none transition-colors hover:bg-[#f6f7f9] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                                  hover === `${p.label}#${i}` ? "bg-[#f6f7f9]" : ""
                                }`}
                              >
                                {body}
                                <Play
                                  aria-hidden
                                  className="mt-[3px] size-3 shrink-0 fill-current text-[#6a6b7b] opacity-0 transition-opacity group-hover/seg:opacity-100 group-focus-visible/seg:opacity-100"
                                />
                              </button>
                            ) : (
                              <div className="flex gap-3 py-[3px] text-[12.5px] leading-snug">{body}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {view && (
        <MediaViewer
          items={view.items}
          index={view.index}
          onIndex={(index) => setView((v) => (v ? { ...v, index } : v))}
          onClose={() => setView(null)}
        />
      )}
    </div>
  );
}
