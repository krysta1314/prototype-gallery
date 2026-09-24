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
} from "./project";

type Stored = Handoff & { project?: Project };

/** 走真实 Seedance 生成的模型(和 src/lib/hybrid-reel/video.ts 的 SEEDANCE_MODELS 对应) */
const REAL_VIDEO_MODELS = new Set(["Seedance 2.0", "Seedance 2.0 Fast", "Seedance 2.5"]);

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
              assets: next.project.assets.map((a) =>
                a.status === "generating" ? { ...a, status: a.url ? ("ready" as const) : ("idle" as const), progress: undefined } : a,
              ),
            }
          : buildProject(next);
      setHandoff({ ...next, project });
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
  const [selectedPart, setSelectedPart] = useState<SelectPart>("clip");
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
  const edit: EditApi = {
    begin: () => {
      past.current = [...past.current.slice(-59), projectRef.current];
      future.current = [];
    },
    update: apply,
    commit: (fn) => {
      past.current = [...past.current.slice(-59), projectRef.current];
      future.current = [];
      apply(fn);
    },
  };
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(projectRef.current);
    apply(() => prev);
  }, [apply]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(projectRef.current);
    apply(() => next);
  }, [apply]);

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
     参考素材里的图片作为 reference_image 传过去;视频参考要公网 URL,原型里先不传 */
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
            .filter((r) => r.kind === "image" && r.url)
            .map((r) => imageDataUrl(r.url!).catch(() => null)),
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

      let task: { status?: string; duration?: number; error?: string } = {};
      while (!["succeeded", "failed", "expired", "cancelled"].includes(task.status ?? "")) {
        await new Promise((r) => window.setTimeout(r, 5000));
        if (!projectRef.current.assets.some((x) => x.id === assetId)) return;
        const q = await fetch(`/api/hybrid-reel/video?id=${encodeURIComponent(created.id)}`);
        task = await q.json();
        if (!q.ok) throw new Error(task.error || `HTTP ${q.status}`);
      }
      if (task.status !== "succeeded") throw new Error(task.error || `Generation ${task.status}`);

      const file = await fetch(`/api/hybrid-reel/video?id=${encodeURIComponent(created.id)}&file=1`);
      if (!file.ok) throw new Error(`Download failed (HTTP ${file.status})`);
      const blob = await file.blob();
      const url = URL.createObjectURL(blob);
      const key = `hr-shot:${assetId}:${(a.takes ?? 0) + 1}`;
      void putMedia(key, blob);
      extraMedia.current.push({ key, url });
      const [w, h] = ratio.split(":").map(Number);
      edit.update((p) => ({
        ...p,
        assets: p.assets.map((x) =>
          x.id === assetId
            ? { ...x, status: "ready", progress: undefined, url, aspect: w / h, durationSec: task.duration || x.durationSec, takes: (x.takes ?? 0) + 1 }
            : x,
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
      const second = { ...secondBase, ...secondSub, subtitle: keep(secondSub) ? c.subtitle : "" };
      clips.splice(i, 1, first, second);
      return { ...p, clips };
    });
    select(id, "clip");
  };

  const remove = () => {
    if (!selectedId) return;
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
    const subs = p0.clips.map((c) => c.subtitle.trim()).filter(Boolean);
    const cjk = subs.some((t) => /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(t));
    const script = subs.join(cjk ? "" : " ");
    const total = player.total;
    const at = Math.max(0, Math.min(player.t, Math.max(0, total - 1)));
    /* 先按文案长度估个时长占位,生成后按真实时长更新 */
    const guess = script ? script.length / (cjk ? 4.5 : 15) : 4;
    const len = Math.max(1, Math.min(guess, total - at));
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
          prompt: script,
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
    if (full) setFull(false);
    setSettingsId(id);
    setFocusId(id);
  };
  /* 点音频轨上的配音段:回到画布,打开它的 Audio Settings */
  const openVoice = (assetId: string) => {
    if (full) setFull(false);
    setSettingsId(assetId);
    setFocusId(assetId);
  };

  /* AI 配音真实生成:BytePlus Seed-Audio → mp3 存进 IndexedDB(刷新可恢复)→ 更新音频轨这一段的长度 */
  const generateVoice = async (assetId: string) => {
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
          v.assetId === assetId ? { ...v, len: Math.max(0.5, Math.min(dur, player.total - v.at)) } : v,
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
      clips.splice(i + 1, 0, { ...src, id });
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
    onAiGenerate: aiFromClip,
    onSpeed: (id, speed) => edit.commit((p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, speed } : c)) })),
    onExportClip: (id) => startExport(id),
    onExportAll: () => startExport(),
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
        <span className="pointer-events-auto max-w-[260px] truncate rounded-xl border border-[#ececf1] bg-white px-3 py-2 text-[13.5px] font-bold shadow-[0_2px_8px_rgba(26,26,46,0.06)]">
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
        onExport={() => startExport()}
        exportPct={exportPct}
        clipMenu={clipMenu}
        onAutoSubtitle={() => setAutoSubOpen(true)}
        onAddVoice={addVoiceGen}
        onVoiceClick={openVoice}
        onSplit={split}
        onDelete={remove}
        fullOpen={full}
        settingsId={settingsId}
        onNodeClick={(id) => {
          const a = projectRef.current.assets.find((x) => x.id === id);
          /* 生成节点(视频 / 图片 / AI 配音)有 Settings;上传的素材和 AI 音乐点了只是选中高亮 */
          setSettingsId(a?.origin === "ai" && (a.kind !== "audio" || a.purpose === "voice") ? id : null);
        }}
        focusId={focusId}
        cover={coverView(project)}
        onCover={() => setCoverOpen(true)}
        onCoverRemove={removeCover}
      />

      {settingsAsset?.purpose === "voice" ? (
        <AudioSettings
          key={settingsAsset.id}
          asset={settingsAsset}
          project={project}
          edit={edit}
          onGenerate={() => void generateVoice(settingsAsset.id)}
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
          onExport={() => startExport()}
          exportPct={exportPct}
          clipMenu={clipMenu}
          onAutoSubtitle={() => setAutoSubOpen(true)}
          onAddVoice={addVoiceGen}
          onVoiceClick={openVoice}
          onSplit={split}
          onDelete={remove}
          cover={coverView(project)}
          onCover={() => setCoverOpen(true)}
          onCoverRemove={removeCover}
        />
      )}


      {autoSubOpen && (
        <AutoSubDialog
          project={project}
          defaultLang={/中/.test(handoff.brief.subtitleLang ?? "") ? "zh" : "auto"}
          onApply={(subs) =>
            edit.commit((p) => ({
              ...p,
              clips: p.clips.map((c) =>
                subs[c.id] ? { ...c, subtitle: subs[c.id].text, subtitleSource: "stt", subIn: subs[c.id].subIn, subOut: subs[c.id].subOut } : c,
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
