"use client";

/* Canvas —— agent 里点 Edit in canvas 之后落到这里。
   从 agent 带过来的素材各成一个节点(图片 / 视频 / AI 补拍),全部连进一个剪辑器节点;
   剪辑器节点里能直接预览和剪,点 Full-screen edit 进全屏剪辑。
   生成和扣费都在这里发生:AI 补拍节点点 Generate 才扣这一镜的 credits。

   工程(节点位置、时间线、字幕、配乐…)写回 sessionStorage 的 handoff 里,硬刷新后原样恢复;
   素材 blob URL 失效的问题由 rehydrateUrls 从 IndexedDB 换回。 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { HANDOFF_KEY, type Handoff } from "../agent/chat/types";
import { fixImageRefs } from "@/lib/hybrid-reel/prompt";
import { APPLE_FONT, AccountCluster } from "../agent/chat/shell";
import { putMedia, rehydrateUrls, type MediaRef } from "../agent/chat/handoff";
import { Board } from "./board";
import { FullEditor } from "./fulleditor";
import { usePlayer, type Scrub } from "./player";
import { CoverDialog, composeCover, coverView } from "./cover";
import { AutoSubDialog } from "./autosub";
import { AudioSettings, NodeSettings } from "./settings";
import { VOICES, VOICE_COST } from "@/lib/hybrid-reel/voices";
import type { EditApi, PanelId, SelectPart } from "./timeline";
import type { ClipMenuApi } from "./clipmenu";
import {
  COVER_PROMPT,
  DEMO_MUSIC_URL,
  IMAGE_COST,
  IMAGE_HOLD_MAX,
  IMAGE_MODELS,
  VIDEO_MODELS,
  LIBRARY_IMAGES,
  MIN_CLIP,
  clipLen,
  MOCK_AI_RESULTS,
  aiRefs,
  arrange,
  buildProject,
  newId,
  segmentAt,
  subSpan,
  MIN_SUB,
  type CoverRef,
  type Project,
  withVoiceover,
  splitVoiceLines,
  voiceAt,
  isSegmentedVoice,
  layoutClips,
  voiceKey,
} from "./project";

type Stored = Handoff & { project?: Project };

/** 走真实 Seedance 生成的模型(和 src/lib/hybrid-reel/video.ts 的 SEEDANCE_MODELS 对应) */
const REAL_VIDEO_MODELS = new Set(["Seedance 2.0", "Seedance 2.0 Fast", "Seedance 2.5"]);

/** 视频某一秒的画面,压成长边 1280 的 JPEG data URL(当 Seedance 的参考图) */
async function videoFrameDataUrl(src: string, at: number): Promise<string> {
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  v.src = src;
  await new Promise<void>((ok, fail) => {
    v.onloadedmetadata = () => ok();
    v.onerror = () => fail(new Error("video load failed"));
  });
  v.currentTime = Math.min(Math.max(0, at), Math.max(0, v.duration - 0.1));
  await new Promise<void>((ok, fail) => {
    v.onseeked = () => ok();
    v.onerror = () => fail(new Error("video seek failed"));
  });
  const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(v.videoWidth * k);
  c.height = Math.round(v.videoHeight * k);
  c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
  v.removeAttribute("src");
  return c.toDataURL("image/jpeg", 0.88);
}

/** 参考图压到长边 1280 的 JPEG data URL,Seedance 直接收 base64 */
async function imageDataUrl(src: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.88);
}

export default function HybridReelCanvas() {
  const [handoff, setHandoff] = useState<Stored | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let parsed: Stored | null = null;
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      if (raw) parsed = JSON.parse(raw) as Stored;
    } catch {
      /* 读不到就走空态 */
    }
    if (!parsed) {
      setLoaded(true);
      return;
    }
    const initial = parsed;
    void rehydrateUrls(initial, initial.media ?? []).then(({ data, media }) => {
      const next: Stored = { ...data, media };
      /* 旧版工程(或第一次进来)按分镜重新建;生成中的状态刷新后没法续,退回未生成 */
      const project =
        next.project?.v === 1
          ? {
              ...next.project,
              assets: next.project.assets.map((a) => {
                /* 生成中被刷新:有任务 id 的(Seedance 真生成)保持生成中,进画布后接着查;其他的(模拟生成)退回 */
                const b =
                  a.status === "generating" && !a.taskId
                    ? { ...a, status: a.url ? ("ready" as const) : ("idle" as const), progress: undefined }
                    : a;
                if (b.origin !== "ai" || b.kind !== "video") return b;
                /* 旧工程补上:分镜里的一句话描述(时间线上显示)、从 @Image 1 开始的参考图编号 */
                const shot = next.outline.shots[Number(b.id.replace(/^ai-/, ""))];
                const summary = b.summary ?? (shot?.source.kind === "generate" ? shot.source.summary : undefined);
                return { ...b, summary, prompt: b.prompt && fixImageRefs(b.prompt, b.refIds?.length) };
              }),
              /* 旧工程补上方案里每一镜的台词(加配音时当默认文案) */
              clips: next.project.clips.map((c) => {
                if (c.line !== undefined) return c;
                const shot = next.outline.shots[Number(c.id.replace(/^c-/, ""))];
                return /^c-\d+$/.test(c.id) && shot?.subtitle?.text && shot.subtitle.source !== "stt" ? { ...c, line: shot.subtitle.text } : c;
              }),
            }
          : buildProject(next);
      /* 旧工程一个节点装 6 句的,拆成一句一个节点 */
      const split = next.project?.v === 1 ? arrange(splitVoiceLines(project)) : project;
      setHandoff({ ...next, project: split });
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="min-h-dvh bg-[#f7f7f9]" />;

  if (!handoff?.project) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#f7f7f9] px-6 text-center" style={{ fontFamily: APPLE_FONT }}>
        <div>
          <p className="text-[16px] font-bold text-[#1a1a2e]">Nothing on the canvas yet</p>
          <p className="mt-1.5 text-[14px] text-[#6a6b7b]">
            Upload footage in the agent, confirm the plan, then choose Edit in canvas.
          </p>
          <Link
            href="/prototypes/hybrid-reel/agent/chat"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-5 py-2.5 text-[14px] font-bold text-white"
          >
            <ArrowLeft className="size-4" /> Back to agent
          </Link>
        </div>
      </div>
    );
  }

  return <Workspace handoff={handoff} initial={handoff.project} />;
}

/* 撤销 / 重做只回退用户的编辑,不回退「生成」这件事本身:生成状态、进度、任务 id、结果、失败原因、已扣积分都保留现在的。
   否则撤销会把节点卡在 Generating、白拿到结果或把积分扣成负数 */
function keepRuntime(snap: Project, cur: Project): Project {
  return {
    ...snap,
    spentCredits: cur.spentCredits,
    assets: snap.assets.map((a) => {
      const now = cur.assets.find((x) => x.id === a.id);
      if (!now) return a;
      const { status, progress, taskId, taskStartedAt, url, takes, error, durationSec, aspect } = now;
      return { ...a, status, progress, taskId, taskStartedAt, url, takes, error, durationSec, aspect };
    }),
    /* 分段配音每句自己的音频也算生成结果 */
    voice: snap.voice?.map((v) => {
      const now = cur.voice?.find((x) => x.id === v.id);
      /* 这一句重新生成过(音频换了)才用新的长度;没换就保留撤销回去那一版的 trim */
      return now && now.url !== v.url ? { ...v, url: now.url, len: now.url ? now.len : v.len, offset: undefined, srcLen: undefined } : v;
    }),
  };
}

function Workspace({ handoff, initial }: { handoff: Stored; initial: Project }) {
  /* 打开时按当前规则重排一次(旧工程也会排成「素材 → 生成节点 → 剪辑器」) */
  const [project, setProject] = useState<Project>(() => arrange(initial));
  /* 事件回调里要读最新工程;每次 setProject 都经过 apply,同步更新 ref */
  const projectRef = useRef(project);
  const past = useRef<Project[]>([]);
  const future = useRef<Project[]>([]);
  const apply = useCallback((fn: (p: Project) => Project) => {
    const next = arrange(fn(projectRef.current));
    projectRef.current = next;
    setProject(next);
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdState = selectedId;
  const [selectedPart, setSelectedPart] = useState<SelectPart>("clip");
  const selectedPartState = selectedPart;
  const select = useCallback((id: string | null, part: SelectPart = "clip") => {
    setSelectedId(id);
    setSelectedPart(part);
  }, []);
  const [scrub, setScrub] = useState<Scrub>(null);
  const [full, setFull] = useState(false);
  const [panel, setPanel] = useState<PanelId | null>(null);
  /** 导出进度 0–100;null = 没在导出。点 Export 直接开始,不弹窗 */
  const [exportPct, setExportPct] = useState<number | null>(null);
  const [toast, setToast] = useState<{ title: string; file: string; pendingAi: number } | null>(null);
  const [autoSubOpen, setAutoSubOpen] = useState(false);
  /* 画布里新上传的文件(配音):存进 IndexedDB,记下 key,硬刷新时和 Agent 带来的素材一起换回 blob URL */
  const extraMedia = useRef<MediaRef[]>([]);
  /** 右侧 Settings 面板打开的节点 */
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const player = usePlayer(project);

  /* ── 编辑 + 撤销 ── */
  /* 撤销 / 重做按钮要知道还能不能点:栈的深度同步到 state */
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const syncHist = useCallback(() => setHist({ undo: past.current.length, redo: future.current.length }), []);
  const edit: EditApi = {
    begin: () => {
      past.current = [...past.current.slice(-59), projectRef.current];
      future.current = [];
      syncHist();
    },
    update: apply,
    commit: (fn) => {
      past.current = [...past.current.slice(-59), projectRef.current];
      future.current = [];
      syncHist();
      apply(fn);
    },
  };
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(projectRef.current);
    syncHist();
    apply((cur) => keepRuntime(prev, cur));
  }, [apply, syncHist]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(projectRef.current);
    syncHist();
    apply((cur) => keepRuntime(next, cur));
  }, [apply, syncHist]);
  const history = { onUndo: undo, onRedo: redo, canUndo: hist.undo > 0, canRedo: hist.redo > 0 };

  /* ── 存回 handoff,硬刷新可恢复 ── */
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        sessionStorage.setItem(
          HANDOFF_KEY,
          JSON.stringify({ ...handoff, media: [...(handoff.media ?? []), ...extraMedia.current], project }),
        );
      } catch {}
    }, 250);
    return () => window.clearTimeout(id);
  }, [project, handoff]);

  /* ── AI 生成(模拟):进度走完换上一条已有的 Seedance 成片 ── */
  const timers = useRef(new Map<string, number>());
  useEffect(() => () => timers.current.forEach((t) => window.clearInterval(t)), []);
  const generate = useCallback((assetId: string) => {
    const a = projectRef.current.assets.find((x) => x.id === assetId);
    if (!a || a.status === "generating") return;
    /* Seedance 系列走真实生成;其他模型(Veo 3)和配乐、封面仍是模拟 */
    if (a.kind === "video" && a.origin === "ai" && REAL_VIDEO_MODELS.has(a.model ?? VIDEO_MODELS[0])) {
      void generateVideo(assetId);
      return;
    }
    const isMusic = a.kind === "audio";
    const isImage = a.kind === "image";
    const cost = isMusic ? 0 : a.cost ?? projectRef.current.creditsPerShot;
    /* Image Generator(原型):用参考帧合成封面;没有参考图就给一张资产库图 */
    const imageJob = isImage
      ? a.refSrc
        ? composeCover(a.refSrc).catch(() => LIBRARY_IMAGES[0].src)
        : Promise.resolve(LIBRARY_IMAGES[(a.takes ?? 0) % LIBRARY_IMAGES.length].src)
      : null;
    edit.commit((p) => ({
      ...p,
      spentCredits: p.spentCredits + cost,
      assets: p.assets.map((x) => (x.id === assetId ? { ...x, status: "generating", progress: 0 } : x)),
    }));
    /* 进度按真实经过时间算,后台标签页计时器被限速也不会卡住 */
    const startedAt = Date.now();
    const duration = isMusic ? 3500 : 4500 + Math.random() * 1500;
    const tick = window.setInterval(() => {
      const cur = projectRef.current.assets.find((x) => x.id === assetId);
      if (!cur) return window.clearInterval(tick);
      const progress = Math.min(100, Math.round(((Date.now() - startedAt) / duration) * 100));
      if (progress < 100) {
        edit.update((p) => ({ ...p, assets: p.assets.map((x) => (x.id === assetId ? { ...x, progress } : x)) }));
        return;
      }
      window.clearInterval(tick);
      timers.current.delete(assetId);
      if (imageJob) {
        void imageJob.then((url) =>
          edit.update((p) => ({
            ...p,
            assets: p.assets.map((x) =>
              x.id === assetId ? { ...x, status: "ready", progress: undefined, url, takes: (cur.takes ?? 0) + 1 } : x,
            ),
          })),
        );
        return;
      }
      edit.update((p) => {
        const aiIndex = p.assets.filter((x) => x.origin === "ai" && x.kind === "video").findIndex((x) => x.id === assetId);
        const takes = (cur.takes ?? 0) + 1;
        const url = isMusic ? DEMO_MUSIC_URL : MOCK_AI_RESULTS[(Math.max(0, aiIndex) + takes - 1) % MOCK_AI_RESULTS.length];
        return {
          ...p,
          musicId: isMusic && !p.musicId ? assetId : p.musicId,
          assets: p.assets.map((x) => (x.id === assetId ? { ...x, status: "ready", progress: undefined, url, takes } : x)),
        };
      });
    }, 260);
    timers.current.set(assetId, tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* AI 补拍真实生成:BytePlus Seedance 异步任务 → 轮询 → mp4 存进 IndexedDB(刷新可恢复)。
     参考素材按顺序作为 reference_image 传过去,对应 prompt 里的 @Image 1、@Image 2…;
     视频参考截分镜指定那一秒的画面(Seedance 的视频参考要公网 URL,原型里用截帧代替) */
  const generateVideo = async (assetId: string) => {
    const a = projectRef.current.assets.find((x) => x.id === assetId);
    if (!a || !a.prompt?.trim()) return;
    const cost = a.cost ?? projectRef.current.creditsPerShot;
    const ratio = a.genAspect ?? projectRef.current.aspect;
    edit.commit((p) => ({
      ...p,
      spentCredits: p.spentCredits + cost,
      assets: p.assets.map((x) => (x.id === assetId ? { ...x, status: "generating", progress: 0, error: undefined } : x)),
    }));
    const setProgress = (progress: number) =>
      edit.update((p) => ({ ...p, assets: p.assets.map((x) => (x.id === assetId && x.status === "generating" ? { ...x, progress } : x)) }));
    /* 接口不回进度:按经过时间估(一般 1–2 分钟),封顶 95%,拿到成片再跳 100% */
    const startedAt = Date.now();
    const expected = 70_000 + Math.max(0, Math.ceil(a.durationSec) - 4) * 8_000;
    const tick = window.setInterval(() => setProgress(Math.min(95, Math.round(((Date.now() - startedAt) / expected) * 100))), 500);
    try {
      const images = (
        await Promise.all(
          aiRefs(projectRef.current, a)
            .filter((r) => r.url && r.kind !== "audio")
            .map((r) =>
              (r.kind === "image" ? imageDataUrl(r.url!) : videoFrameDataUrl(r.url!, a.refAt?.[r.id] ?? r.durationSec / 2)).catch(() => null),
            ),
        )
      ).filter((x): x is string => !!x);
      const res = await fetch("/api/hybrid-reel/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: a.prompt,
          model: a.model ?? VIDEO_MODELS[0],
          ratio,
          duration: a.durationSec,
          resolution: a.resolution ?? "720p",
          withAudio: a.withAudio !== false,
          images,
        }),
      });
      const created = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !created.id) throw new Error(created.error || `HTTP ${res.status}`);
      /* 任务 id 记进工程(会存进 sessionStorage):中途刷新也能接着查同一个任务 */
      const taskId = created.id;
      edit.update((p) => ({ ...p, assets: p.assets.map((x) => (x.id === assetId ? { ...x, taskId, taskStartedAt: startedAt } : x)) }));
      window.clearInterval(tick);
      await pollVideo(assetId, taskId, { cost, ratio, startedAt });
    } catch (e) {
      failVideo(assetId, cost, e);
    } finally {
      window.clearInterval(tick);
    }
  };

  /* 失败:退回未生成(有旧结果就留着旧结果),积分退回,原因显示在 Video Settings 里 */
  const failVideo = (assetId: string, cost: number, e: unknown) =>
    edit.update((p) => ({
      ...p,
      spentCredits: p.spentCredits - cost,
      assets: p.assets.map((x) =>
        x.id === assetId
          ? {
              ...x,
              status: x.url ? "ready" : "idle",
              progress: undefined,
              taskId: undefined,
              taskStartedAt: undefined,
              error: e instanceof Error ? e.message : String(e),
            }
          : x,
      ),
    }));

  /* 查任务直到出结果。生成一般 1–4 分钟;超过 15 分钟算超时。网络抖一下不算失败,连续 3 次查不到才放弃 */
  const VIDEO_TIMEOUT = 15 * 60_000;
  const pollVideo = async (assetId: string, taskId: string, meta: { cost: number; ratio: string; startedAt: number }) => {
    const a0 = projectRef.current.assets.find((x) => x.id === assetId);
    if (!a0) return;
    const expected = 70_000 + Math.max(0, Math.ceil(a0.durationSec) - 4) * 8_000;
    const tick = window.setInterval(() => {
      const progress = Math.min(95, Math.round(((Date.now() - meta.startedAt) / expected) * 100));
      edit.update((p) => ({ ...p, assets: p.assets.map((x) => (x.id === assetId && x.status === "generating" ? { ...x, progress } : x)) }));
    }, 500);
    try {
      let task: { status?: string; duration?: number; error?: string } = {};
      let misses = 0;
      while (!["succeeded", "failed", "expired", "cancelled"].includes(task.status ?? "")) {
        if (Date.now() - meta.startedAt > VIDEO_TIMEOUT) {
          throw new Error("This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.");
        }
        await new Promise((r) => window.setTimeout(r, 5000));
        const cur = projectRef.current.assets.find((x) => x.id === assetId);
        /* 节点被删了,或者用户已经重新点了生成(换了任务):这一轮不再管 */
        if (!cur || cur.taskId !== taskId) return;
        try {
          const q = await fetch(`/api/hybrid-reel/video?id=${encodeURIComponent(taskId)}`);
          const next = (await q.json()) as typeof task;
          if (!q.ok) throw new Error(next.error || `HTTP ${q.status}`);
          task = next;
          misses = 0;
        } catch (err) {
          if (++misses >= 3) throw err;
        }
      }
      if (task.status !== "succeeded") throw new Error(task.error || `Generation ${task.status}`);

      const file = await fetch(`/api/hybrid-reel/video?id=${encodeURIComponent(taskId)}&file=1`);
      if (!file.ok) throw new Error(`Download failed (HTTP ${file.status})`);
      const blob = await file.blob();
      const url = URL.createObjectURL(blob);
      const key = `hr-shot:${assetId}:${(a0.takes ?? 0) + 1}`;
      void putMedia(key, blob);
      extraMedia.current.push({ key, url });
      const [w, h] = meta.ratio.split(":").map(Number);
      edit.update((p) => ({
        ...p,
        assets: p.assets.map((x) =>
          x.id === assetId
            ? {
                ...x,
                status: "ready",
                progress: undefined,
                taskId: undefined,
                taskStartedAt: undefined,
                url,
                aspect: w / h,
                durationSec: task.duration || x.durationSec,
                takes: (x.takes ?? 0) + 1,
              }
            : x,
        ),
      }));
    } catch (e) {
      failVideo(assetId, meta.cost, e);
    } finally {
      window.clearInterval(tick);
    }
  };

  /* 刷新前还在生成的镜头:接着查原来的任务(不重新建、不再扣费) */
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    for (const a of projectRef.current.assets) {
      if (a.status === "generating" && a.taskId) {
        void pollVideo(a.id, a.taskId, {
          cost: a.cost ?? projectRef.current.creditsPerShot,
          ratio: a.genAspect ?? projectRef.current.aspect,
          startedAt: a.taskStartedAt ?? Date.now(),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAll = () =>
    projectRef.current.assets
      .filter((a) => a.origin === "ai" && a.kind === "video" && a.status === "idle")
      .forEach((a) => generate(a.id));

  /* ── 切分 / 删除 ── */
  const split = () => {
    const seg = segmentAt(player.segs, player.t);
    if (!seg) return;
    const offset = player.t - seg.start;
    if (offset < MIN_CLIP || seg.len - offset < MIN_CLIP) return;
    const c = seg.clip;
    const asset = projectRef.current.assets.find((a) => a.id === c.assetId);
    const cut = c.inSec + offset * c.speed;
    const id = newId("c");
    edit.commit((p) => {
      const clips = [...p.clips];
      const i = clips.findIndex((x) => x.id === c.id);
      /* 字幕按切点分开:切点前的留在第一段,之后的挪到第二段;某一段没剩字幕就清空 */
      const span = subSpan(c, seg.len);
      const firstSub = { subIn: span.from, subOut: Math.min(span.to, offset) };
      const secondSub = { subIn: Math.max(0, span.from - offset), subOut: span.to - offset };
      const keep = (x: { subIn: number; subOut: number }) => x.subOut - x.subIn >= MIN_SUB;
      const first = {
        ...c,
        outSec: cut,
        ...firstSub,
        subtitle: keep(firstSub) ? c.subtitle : "",
      };
      const secondBase =
        asset?.kind === "video"
          ? { ...c, id, inSec: cut }
          : { ...c, id, inSec: c.inSec, outSec: c.outSec - offset * c.speed };
      /* 台词只跟前半段走,免得配音文案里重复一遍 */
      const second = { ...secondBase, ...secondSub, subtitle: keep(secondSub) ? c.subtitle : "", line: undefined };
      clips.splice(i, 1, first, second);
      return { ...p, clips };
    });
    select(id, "clip");
  };

  /* 删除选中的块;右键菜单删某一段时直接传它的 id */
  const remove = (targetId: string | null = selectedIdState, targetPart: SelectPart = selectedPartState) => {
    const selectedId = targetId;
    const selectedPart = targetPart;
    if (!selectedId) return;
    /* 选中的是背景音乐:从音乐轨上拿掉(画布上的配乐节点留着,之后还能再用) */
    if (selectedPart === "music") {
      edit.commit((p) => ({ ...p, musicId: p.musicId === selectedId ? null : p.musicId }));
      select(null);
      return;
    }
    /* 选中的是一个音效:从音效轨上删掉 */
    if (selectedPart === "sfx") {
      edit.commit((p) => ({ ...p, sfx: (p.sfx ?? []).filter((x) => x.id !== selectedId) }));
      select(null);
      return;
    }
    /* 选中的是一段配音:从音频轨上删掉;还没生成的,画布上对应的 Audio Generator 一起删,免得留下空节点 */
    if (selectedPart === "voice") {
      edit.commit((p) => {
        const gone = (p.voice ?? []).find((v) => v.id === selectedId);
        const voice = (p.voice ?? []).filter((v) => v.id !== selectedId);
        const a = gone && p.assets.find((x) => x.id === gone.assetId);
        const orphan = !!gone && !voice.some((v) => v.assetId === gone.assetId) && a?.status !== "ready";
        return { ...p, voice, assets: orphan ? p.assets.filter((x) => x.id !== gone!.assetId) : p.assets };
      });
      select(null);
      return;
    }
    /* 选中的是字幕:只清掉这段字幕,画面片段留着 */
    if (selectedPart === "sub") {
      edit.commit((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === selectedId ? { ...c, subtitle: "", subIn: undefined, subOut: undefined } : c)),
      }));
      select(selectedId, "clip");
      return;
    }
    const clips = projectRef.current.clips;
    const i = clips.findIndex((c) => c.id === selectedId);
    if (i < 0) return;
    edit.commit((p) => ({ ...p, clips: p.clips.filter((c) => c.id !== selectedId) }));
    select(clips[i + 1]?.id ?? clips[i - 1]?.id ?? null, "clip");
  };

  /* ── 封面 ── */
  const saveCover = (cover: CoverRef) => {
    edit.commit((p) => ({ ...p, cover }));
    setCoverOpen(false);
  };
  /* 删除封面只清掉封面引用,画布上的节点(包括 AI 生成的封面节点)保留 */
  const removeCover = () => edit.commit((p) => ({ ...p, cover: undefined }));
  /* Design with AI:在画布上加一个 Image Generator 节点,参数预填,打开它的 Settings,封面先指向它 */
  const designCover = (refSrc: string) => {
    const id = newId("img");
    edit.commit((p) =>
      arrange({
        ...p,
        cover: { kind: "asset", assetId: id },
        assets: [
          ...p.assets,
          {
            id,
            kind: "image",
            origin: "ai",
            purpose: "cover",
            label: "Image Generator",
            durationSec: IMAGE_HOLD_MAX,
            aspect: 16 / 9,
            genAspect: "16:9",
            prompt: COVER_PROMPT,
            refSrc,
            model: IMAGE_MODELS[0],
            resolution: "Low",
            background: "Auto",
            cost: IMAGE_COST,
            status: "idle",
            takes: 0,
            x: p.editor.x,
            y: p.editor.y + 640,
          },
        ],
      }),
    );
    setCoverOpen(false);
    if (full) setFull(false);
    setSettingsId(id);
    setFocusId(id);
  };

  /* 删除节点:时间线里引用它的片段变成缺素材,封面 / 配乐引用一并清掉 */
  const removeNode = (id: string) => {
    edit.commit((p) => ({
      ...p,
      assets: p.assets.filter((a) => a.id !== id),
      clips: p.clips.map((c) => (c.assetId === id ? { ...c, assetId: null } : c)),
      cover: p.cover?.kind === "asset" && p.cover.assetId === id ? undefined : p.cover,
      musicId: p.musicId === id ? null : p.musicId,
      voice: p.voice?.filter((v) => v.assetId !== id),
    }));
    setSettingsId(null);
  };

  /* ── 配音:AI 生成(不支持上传)。点音频轨的入口 → 画布上加一个 Audio Generator 节点(连到剪辑器),
     音频轨上先占一段(从播放头开始),打开它的 Settings 填文案、选音色,生成后换成真实音频 ── */
  const addVoiceGen = () => {
    const p0 = projectRef.current;
    const open = (id: string) => {
      if (full) setFull(false);
      setSettingsId(id);
      setFocusId(id);
    };
    /* 第一次加配音、方案里有台词:按镜头分段配好(和从方案带过来时自动配的一样),每句对齐它的镜头 */
    if ((p0.voice ?? []).length === 0 && p0.clips.some((c) => c.line?.trim())) {
      const next = withVoiceover(p0, VOICES[0].id, VOICE_COST);
      const added = next.assets.find((a) => !p0.assets.some((x) => x.id === a.id));
      edit.commit(() => next);
      if (added) open(added.id);
      return;
    }
    /* 再加的是补充的一段:文案留空让用户写,接在最后一段配音后面;后面没地方了才放在播放头 */
    const total = player.total;
    const { segs } = layoutClips(p0.clips);
    const end = Math.max(0, ...(p0.voice ?? []).map((v) => voiceAt(v, segs) + v.len));
    const at = end < total - 1 ? end : Math.max(0, Math.min(player.t, Math.max(0, total - 1)));
    const len = Math.max(1, Math.min(4, total - at));
    const id = newId("vo");
    edit.commit((p) => ({
      ...p,
      assets: [
        ...p.assets,
        {
          id,
          kind: "audio",
          origin: "ai",
          purpose: "voice",
          label: "Audio Generator",
          prompt: "",
          voiceId: VOICES[0].id,
          cost: VOICE_COST,
          durationSec: len,
          aspect: 1,
          status: "idle",
          takes: 0,
          x: 0,
          y: 0,
        },
      ],
      voice: [...(p.voice ?? []), { id: newId("vc"), assetId: id, at, len }],
    }));
    open(id);
  };
  /* 音频面板里上传自己的音乐 / 音效:文件存进 IndexedDB(刷新可恢复),读出时长后放进工程。
     音乐 → 画布上多一个音乐节点并直接用作配乐;音效 → 加在播放头位置 */
  const uploadAudio = (file: File, as: "music" | "sfx") => {
    const url = URL.createObjectURL(file);
    const key = `hr-upload-audio:${newId("ua")}`;
    void putMedia(key, file);
    extraMedia.current.push({ key, url });
    const name = file.name.replace(/\.[^.]+$/, "") || "Audio";
    const place = (d: number) => {
      if (as === "music") {
        const id = newId("mu");
        edit.commit((p) =>
          arrange({
            ...p,
            musicId: id,
            assets: [...p.assets, { id, kind: "audio", origin: "upload", label: name, url, durationSec: d, aspect: 2, status: "ready", x: 0, y: 0 }],
          }),
        );
      } else {
        edit.commit((p) => ({ ...p, sfx: [...(p.sfx ?? []), { id: newId("sfx"), kind: "click", at: Math.round(player.t * 10) / 10, url, name, len: d }] }));
      }
    };
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => place(Number.isFinite(probe.duration) ? Math.round(probe.duration * 10) / 10 : 5);
    probe.onerror = () => place(5);
    probe.src = url;
  };
  /* 点音频轨上的配音段:回到画布,打开它的 Audio Settings */
  const openVoice = (assetId: string) => {
    if (full) setFull(false);
    setSettingsId(assetId);
    setFocusId(assetId);
  };

  /* AI 配音真实生成:BytePlus Seed-Audio → mp3 存进 IndexedDB(刷新可恢复)→ 更新音频轨这一段的长度 */
  /* 按镜头分段的配音:每句单独调一次配音接口(最多 3 句并行),各自换成真实音频和长度;
     积分按句数扣,失败的那几句退回,原因显示在 Settings 里 */
  const generateVoiceSegments = async (assetId: string) => {
    const p0 = projectRef.current;
    const a = p0.assets.find((x) => x.id === assetId);
    const all = (p0.voice ?? []).filter((v) => v.assetId === assetId && v.text?.trim());
    /* 只改了其中几句:只生成还没有音频的那几句;全都有音频时点的是「重新生成」,全部重来 */
    const missing = all.filter((v) => !v.url);
    const lines = missing.length ? missing : all;
    if (!a || a.status === "generating" || !lines.length) return;
    const cost = VOICE_COST * lines.length;
    const take = (a.takes ?? 0) + 1;
    edit.commit((p) => ({
      ...p,
      spentCredits: p.spentCredits + cost,
      assets: p.assets.map((x) => (x.id === assetId ? { ...x, status: "generating", progress: 0, error: undefined, cost } : x)),
    }));
    let done = 0;
    let failed = 0;
    let lastError = "";
    const queue = [...lines];
    const worker = async () => {
      for (let v = queue.shift(); v; v = queue.shift()) {
        try {
          const res = await fetch("/api/hybrid-reel/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: v.text, voice: a.voiceId }),
          });
          const data = (await res.json()) as { audio?: string; duration?: number; error?: string };
          if (!res.ok || !data.audio) throw new Error(data.error || `HTTP ${res.status}`);
          const bin = atob(data.audio);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          const url = URL.createObjectURL(blob);
          const key = `hr-voice:${assetId}:${v.id}:${take}`;
          void putMedia(key, blob);
          extraMedia.current.push({ key, url });
          const id = v.id;
          const len = Math.max(0.5, data.duration || v.len);
          edit.update((p) => ({ ...p, voice: (p.voice ?? []).map((x) => (x.id === id ? { ...x, url, len, offset: undefined, srcLen: undefined } : x)) }));
        } catch (e) {
          failed++;
          lastError = e instanceof Error ? e.message : String(e);
        }
        done++;
        const progress = Math.round((done / lines.length) * 100);
        edit.update((p) => ({ ...p, assets: p.assets.map((x) => (x.id === assetId ? { ...x, progress } : x)) }));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    edit.update((p) => {
      const mine = (p.voice ?? []).filter((v) => v.assetId === assetId);
      const first = mine.find((v) => v.url)?.url;
      return {
        ...p,
        spentCredits: p.spentCredits - VOICE_COST * failed,
        assets: p.assets.map((x) =>
          x.id === assetId
            ? {
                ...x,
                status: first ? "ready" : "idle",
                progress: undefined,
                url: first,
                durationSec: mine.reduce((n, v) => n + v.len, 0),
                takes: failed === lines.length ? x.takes : take,
                cost: VOICE_COST * mine.filter((v) => v.text?.trim()).length,
                prompt: mine.map((v) => v.text ?? "").join(" "),
                error: failed ? `${failed} of ${lines.length} lines failed: ${lastError}` : undefined,
              }
            : x,
        ),
      };
    });
  };
  const generateVoice = async (assetId: string) => {
    if (isSegmentedVoice(projectRef.current, assetId)) return generateVoiceSegments(assetId);
    const a = projectRef.current.assets.find((x) => x.id === assetId);
    if (!a || a.status === "generating" || !a.prompt?.trim()) return;
    const cost = a.cost ?? VOICE_COST;
    edit.commit((p) => ({
      ...p,
      spentCredits: p.spentCredits + cost,
      assets: p.assets.map((x) => (x.id === assetId ? { ...x, status: "generating", progress: 0, error: undefined } : x)),
    }));
    /* 进度条按经过时间估(接口不回进度),拿到结果直接跳到 100% */
    const startedAt = Date.now();
    const expected = 2500 + (a.prompt.length / 4.5) * 400;
    const tick = window.setInterval(() => {
      const progress = Math.min(95, Math.round(((Date.now() - startedAt) / expected) * 100));
      edit.update((p) => ({ ...p, assets: p.assets.map((x) => (x.id === assetId && x.status === "generating" ? { ...x, progress } : x)) }));
    }, 250);
    try {
      const res = await fetch("/api/hybrid-reel/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: a.prompt, voice: a.voiceId }),
      });
      const data = (await res.json()) as { audio?: string; duration?: number; error?: string };
      if (!res.ok || !data.audio) throw new Error(data.error || `HTTP ${res.status}`);
      const bin = atob(data.audio);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const key = `hr-voice:${assetId}:${(a.takes ?? 0) + 1}`;
      void putMedia(key, blob);
      extraMedia.current.push({ key, url });
      const dur = data.duration || a.durationSec;
      edit.update((p) => ({
        ...p,
        assets: p.assets.map((x) =>
          x.id === assetId ? { ...x, status: "ready", progress: undefined, url, durationSec: dur, takes: (x.takes ?? 0) + 1 } : x,
        ),
        voice: (p.voice ?? []).map((v) =>
          v.assetId === assetId ? { ...v, len: Math.max(0.5, Math.min(dur, player.total - v.at)), offset: undefined, srcLen: dur } : v,
        ),
      }));
    } catch (e) {
      /* 失败退回未生成,积分退回,原因显示在 Settings 里 */
      edit.update((p) => ({
        ...p,
        spentCredits: p.spentCredits - cost,
        assets: p.assets.map((x) =>
          x.id === assetId
            ? { ...x, status: x.url ? "ready" : "idle", progress: undefined, error: e instanceof Error ? e.message : String(e) }
            : x,
        ),
      }));
    } finally {
      window.clearInterval(tick);
    }
  };

  /* ── 片段右键菜单 ── */
  /* 复制:直接在这一段后面复制出一段(没有粘贴这一步),新片段自动选中 */
  const copyClip = (clipId: string) => {
    const src = projectRef.current.clips.find((x) => x.id === clipId);
    if (!src) return;
    const id = newId("c");
    edit.commit((p) => {
      const i = p.clips.findIndex((c) => c.id === clipId);
      const clips = [...p.clips];
      clips.splice(i + 1, 0, { ...src, id, line: undefined });
      return { ...p, clips };
    });
    select(id, "clip");
  };
  /* 作为参考素材生成视频:画布上加一个 Video Generator 节点,参考只用这一段素材,打开它的 Settings */
  const aiFromClip = (clipId: string) => {
    const p0 = projectRef.current;
    const c = p0.clips.find((x) => x.id === clipId);
    const src = c && p0.assets.find((a) => a.id === c.assetId);
    if (!c || !src) return;
    const id = newId("ai");
    edit.commit((p) =>
      arrange({
        ...p,
        assets: [
          ...p.assets,
          {
            id,
            kind: "video",
            origin: "ai",
            label: "Video Generator",
            durationSec: Math.max(2, Math.round(clipLen(c))),
            aspect: src.aspect,
            prompt: `Create a new shot based on the reference clip — keep the same subject, product and lighting, with a fresh camera move.`,
            refIds: [src.id],
            model: VIDEO_MODELS[0],
            resolution: "720p",
            withAudio: true,
            status: "idle",
            role: c.role,
            takes: 0,
            x: p.editor.x,
            y: p.editor.y + 640,
          },
        ],
      }),
    );
    if (full) setFull(false);
    setSettingsId(id);
    setFocusId(id);
  };
  /* ── 快捷键 ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : document.body;
      if (t.closest("input,textarea,select,[contenteditable=true]")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "c" && selectedId && selectedPart === "clip") {
        e.preventDefault();
        copyClip(selectedId);
      } else if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === " " && !t.closest("button")) {
        e.preventDefault();
        player.toggle();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        remove();
      } else if (!mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        split();
      } else if (e.key === "Escape" && full) {
        setFull(false);
      } else if (e.key === "Escape" && settingsId) {
        setSettingsId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const title = `Hybrid Reel — ${handoff.brief.platform} ${handoff.brief.durationSec}s`;
  const settingsAsset = settingsId ? project.assets.find((a) => a.id === settingsId) : undefined;
  const settingsClip = settingsAsset ? project.clips.find((c) => c.assetId === settingsAsset.id) : undefined;
  const settingsClipLen = settingsClip ? clipLen(settingsClip) : undefined;

  /* ── 导出:按钮上走进度,完成后直接下载(原型里下载的是时间线上第一段真实视频),再弹一条轻提示 ── */
  /* 时间线上还没生成的 AI 镜头:导出前先拦一下,别导出一片空白 */
  const pendingShots = project.assets.filter(
    (a) => a.origin === "ai" && a.kind === "video" && a.status !== "ready" && project.clips.some((c) => c.assetId === a.id),
  );
  const pending = {
    count: pendingShots.length,
    running: pendingShots.filter((a) => a.status === "generating").length,
    cost: pendingShots.filter((a) => a.status !== "generating").reduce((n, a) => n + (a.cost ?? project.creditsPerShot), 0),
  };
  const [exportGate, setExportGate] = useState(false);
  const requestExport = () => {
    if (pending.count > 0) setExportGate(true);
    else startExport();
  };

  const startExport = (clipId?: string) => {
    if (exportPct !== null) return;
    let startedAt = 0;
    setToast(null);
    setExportPct(0);
    const id = window.setInterval(() => {
      startedAt ||= Date.now() - 100;
      const pct = Math.min(100, Math.round(((Date.now() - startedAt) / 2400) * 100));
      setExportPct(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        void finishExport(clipId);
      }
    }, 100);
  };
  const finishExport = async (clipId?: string) => {
    const p = projectRef.current;
    const base = title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    /* 导出所选片段:下载这一段的素材;导出成片:原型里下载时间线上第一段真实视频 */
    const clip = clipId ? p.clips.find((c) => c.id === clipId) : undefined;
    const clipAsset = clip ? p.assets.find((a) => a.id === clip.assetId) : undefined;
    const file = clip ? `${base}-${clip.role}-${p.clips.indexOf(clip) + 1}.mp4` : `${base}.mp4`;
    const src = clip
      ? clipAsset?.status === "ready"
        ? clipAsset.url
        : undefined
      : p.clips
          .map((c) => p.assets.find((a) => a.id === c.assetId))
          .find((a) => a?.kind === "video" && a.status === "ready" && a.url)?.url;
    try {
      if (src) {
        const blob = await (await fetch(src)).blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch {
      /* 素材拉不到也照样提示导出完成 —— 原型不做真实渲染 */
    }
    setExportPct(null);
    setToast({
      title: clip ? "Clip exported" : "Reel exported",
      file,
      pendingAi: clip ? 0 : p.assets.filter((a) => a.origin === "ai" && a.kind === "video" && a.status !== "ready").length,
    });
  };
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.pendingAi ? 8000 : 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const clipMenu: ClipMenuApi = {
    onCopy: copyClip,
    /* 右键时已经选中了这一段;播放头在这一段里才可分割(菜单里判断) */
    onSplit: () => split(),
    onReplace: (id) => {
      select(id, "clip");
      if (full) setPanel("media");
      else openFull("media");
    },
    onDelete: (id) => remove(id, "clip"),
    onAiGenerate: aiFromClip,
    onSpeed: (id, speed) => edit.commit((p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, speed } : c)) })),
    onExportClip: (id) => startExport(id),
    onExportAll: () => requestExport(),
    onDeletePart: (id, part) => remove(id, part),
  };

  /* 改时长 = 改时间线上这一镜的长度;还没生成的镜头,素材长度跟着变(画布和全屏编辑的 Video Settings 共用) */
  const setShotDuration = (assetId: string, sec: number) =>
    edit.commit((p) => ({
      ...p,
      assets: p.assets.map((x) => (x.id === assetId && x.status !== "ready" ? { ...x, durationSec: Math.max(sec, 0.5) } : x)),
      clips: p.clips.map((c) => (c.assetId === assetId ? { ...c, outSec: c.inSec + sec * c.speed } : c)),
    }));

  const openFull = (p?: PanelId) => {
    player.setPlaying(false);
    setPanel(p ?? (selectedId ? "clip" : null));
    setFull(true);
  };

  return (
    <div className="relative flex h-dvh flex-col bg-[#f7f7f9] text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      {/* 顶栏照真实产品画布:浮在画布上,左边 logo + 项目名,右边积分与账号。余额按这里的 AI 生成花费实时扣减 */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-4 py-3">
        <Link
          href="/prototypes/hybrid-reel/agent/chat"
          title="Back to agent"
          aria-label="Back to agent"
          className="pointer-events-auto grid size-9 place-items-center rounded-xl border border-[#ececf1] bg-white shadow-[0_2px_8px_rgba(26,26,46,0.06)] transition hover:border-[#ffbd99]"
        >
          <span className="grid size-6 place-items-center rounded-[7px] bg-gradient-to-br from-[#FFA73C] to-[#FF5255]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prototypes/marketing-agent/brand-logo-white.svg" alt="" className="size-3.5" />
          </span>
        </Link>
        <span className="pointer-events-auto max-w-[260px] truncate rounded-xl border border-[#ececf1] bg-white px-3 py-2 text-[14px] font-bold shadow-[0_2px_8px_rgba(26,26,46,0.06)]">
          {title}
        </span>
        <AccountCluster className="pointer-events-auto ml-auto" credits={35600 - project.spentCredits} />
      </header>

      <Board
        project={project}
        edit={edit}
        player={player}
        selectedId={selectedId}
        selectedPart={selectedPart}
        onSelect={(id, part) => {
          select(id, part);
          /* 点画布空白处:取消选中,顺手关掉 Settings */
          if (id === null) setSettingsId(null);
          else if (part !== "sub") {
            /* 点时间线上的片段:是 AI 生成的镜头就在右侧打开它的 Settings(和点画布上的生成节点一样),别的片段收起 */
            const p = projectRef.current;
            const a = p.assets.find((x) => x.id === p.clips.find((c) => c.id === id)?.assetId);
            setSettingsId(a?.origin === "ai" && a.kind !== "audio" ? a.id : null);
          }
        }}
        scrub={scrub}
        setScrub={setScrub}
        onGenerate={generate}
        onOpenFull={openFull}
        onExport={requestExport}
        exportPct={exportPct}
        clipMenu={clipMenu}
        onAutoSubtitle={() => setAutoSubOpen(true)}
        onAddVoice={addVoiceGen}
        onVoiceClick={openVoice}
        onSplit={split}
        {...history}
        onDelete={() => remove()}
        fullOpen={full}
        settingsId={settingsId}
        onNodeClick={(id) => {
          const a = projectRef.current.assets.find((x) => x.id === id);
          /* 生成节点(视频 / 图片 / AI 配音)有 Settings;上传的素材和 AI 音乐点了只是选中高亮 */
          setSettingsId(a?.origin === "ai" ? id : null);
        }}
        focusId={focusId}
        cover={coverView(project)}
        onCover={() => setCoverOpen(true)}
        onCoverRemove={removeCover}
      />

      {settingsAsset?.kind === "audio" ? (
        <AudioSettings
          key={settingsAsset.id}
          asset={settingsAsset}
          project={project}
          edit={edit}
          onGenerate={() => (settingsAsset.purpose === "voice" ? void generateVoice(settingsAsset.id) : generate(settingsAsset.id))}
          onDelete={() => removeNode(settingsAsset.id)}
          onClose={() => setSettingsId(null)}
        />
      ) : settingsAsset && (
        <NodeSettings
          key={settingsAsset.id}
          asset={settingsAsset}
          project={project}
          edit={edit}
          durationSec={settingsClipLen}
          onDuration={(sec) => setShotDuration(settingsAsset.id, sec)}
          onGenerate={() => generate(settingsAsset.id)}
          onDelete={() => removeNode(settingsAsset.id)}
          onClose={() => setSettingsId(null)}
        />
      )}

      {full && (
        <FullEditor
          project={project}
          edit={edit}
          player={player}
          selectedId={selectedId}
          selectedPart={selectedPart}
          onSelect={select}
          scrub={scrub}
          setScrub={setScrub}
          panel={panel}
          setPanel={setPanel}
          onClose={() => {
            player.setPlaying(false);
            setFull(false);
          }}
          onGenerate={generate}
          onDeleteNode={removeNode}
          onShotDuration={setShotDuration}
          onExport={requestExport}
          exportPct={exportPct}
          pending={pending}
          onGenerateAll={generateAll}
          clipMenu={clipMenu}
          onAutoSubtitle={() => setAutoSubOpen(true)}
          onAddVoice={addVoiceGen}
          onVoiceClick={openVoice}
          onSplit={split}
          {...history}
          onUploadAudio={uploadAudio}
          onDelete={() => remove()}
          cover={coverView(project)}
          onCover={() => setCoverOpen(true)}
          onCoverRemove={removeCover}
        />
      )}

      {exportGate && (
        <ExportGate
          pending={pending}
          onGenerateAll={() => {
            generateAll();
            setExportGate(false);
          }}
          onExportAnyway={() => {
            setExportGate(false);
            startExport();
          }}
          onClose={() => setExportGate(false)}
        />
      )}


      {autoSubOpen && (
        <AutoSubDialog
          project={project}
          /* 不做自动识别(接口的自动只认普通话 / 英语 / 粤语):默认语言按 brief 的字幕语言猜 —— 粤语 → Cantonese,其他中文 → Mandarin,其余 → English;用户可以再改 */
          defaultLang={/粤|cantonese/i.test(handoff.brief.subtitleLang ?? "") ? "yue" : /中|chinese|mandarin/i.test(handoff.brief.subtitleLang ?? "") ? "zh" : "en"}
          replacing={project.clips.some((c) => c.subtitle.trim())}
          onApply={(subs) =>
            /* 重新识别就整批换掉:旧字幕是按上一版的声音识别的,没识别出声音的镜头也清空,免得留下对不上的字幕 */
            edit.commit((p) => ({
              ...p,
              subsVoiceKey: voiceKey(p),
              clips: p.clips.map((c) =>
                subs[c.id]
                  ? { ...c, subtitle: subs[c.id].text, subtitleSource: "stt", subIn: subs[c.id].subIn, subOut: subs[c.id].subOut }
                  : { ...c, subtitle: "", subIn: undefined, subOut: undefined },
              ),
            }))
          }
          onGenerateAll={generateAll}
          onClose={() => setAutoSubOpen(false)}
        />
      )}

      {coverOpen && (
        <CoverDialog
          project={project}
          initialTime={player.t}
          onSave={saveCover}
          onDesign={designCover}
          onClose={() => setCoverOpen(false)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-[60px] z-[210] flex w-[min(92vw,420px)] -translate-x-1/2 items-start gap-3 rounded-xl bg-white p-3 pr-2 text-[#1a1a2e] shadow-[0_12px_32px_rgba(26,26,46,0.16),0_0_0_1px_rgba(26,26,46,0.06)] motion-safe:animate-[toast-in_220ms_cubic-bezier(0.22,1,0.36,1)]"
        >
          <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-[#1f9d6b]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">{toast.title}</p>
            <p className="truncate text-[12px] text-[#6a6b7b]">Downloaded {toast.file} · 1080p</p>
            {toast.pendingAi > 0 && (
              <p className="mt-1.5 text-[12px] leading-snug text-[#4a4b5c]">
                {toast.pendingAi} AI {toast.pendingAi === 1 ? "shot wasn't" : "shots weren't"} generated and exported as blank frames.{" "}
                <button
                  type="button"
                  onClick={() => {
                    generateAll();
                    setToast(null);
                  }}
                  className="font-semibold text-[#ff5e1a] hover:underline"
                >
                  Generate {toast.pendingAi === 1 ? "it" : "them"} · {toast.pendingAi * project.creditsPerShot} credits
                </button>
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f3f4f6] hover:text-[#1a1a2e]"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <style>{`@keyframes toast-in{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}

/* 导出前的检查:还有 AI 镜头没生成时先问一下 —— 一键全部生成(显示要花多少),或者照样导出(空镜头会是空白帧) */
function ExportGate({
  pending,
  onGenerateAll,
  onExportAnyway,
  onClose,
}: {
  pending: { count: number; running: number; cost: number };
  onGenerateAll: () => void;
  onExportAnyway: () => void;
  onClose: () => void;
}) {
  const idle = pending.count - pending.running;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[260] grid place-items-center bg-[rgba(26,26,46,0.45)] px-4" onPointerDown={onClose}>
      <div
        role="alertdialog"
        aria-label="Some shots aren't generated yet"
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-2xl bg-white p-5 text-[#1a1a2e] shadow-[0_24px_60px_rgba(26,26,46,0.28)]"
      >
        <h2 className="text-[16px] font-bold">
          {pending.count} AI {pending.count === 1 ? "shot isn't" : "shots aren't"} ready yet
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#4a4b5c]">
          {pending.running > 0 && idle === 0
            ? "They're still generating. Exporting now leaves them as blank frames."
            : `Exporting now leaves ${pending.count === 1 ? "it" : "them"} as blank frames.${pending.running > 0 ? ` ${pending.running} still generating.` : ""}`}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {idle > 0 && (
            <button
              type="button"
              onClick={onGenerateAll}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1a1a2e] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2c2c44]"
            >
              Generate {idle === 1 ? "it" : `all ${idle}`} ({pending.cost} credits)
            </button>
          )}
          <button
            type="button"
            onClick={onExportAnyway}
            className="rounded-lg py-2.5 text-[13px] font-semibold text-[#1a1a2e] ring-1 ring-inset ring-[#e1e3e9] transition hover:bg-[#f7f8fa]"
          >
            Export anyway
          </button>
          <button type="button" onClick={onClose} className="rounded-lg py-2 text-[13px] font-medium text-[#6a6b7b] transition hover:text-[#1a1a2e]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
