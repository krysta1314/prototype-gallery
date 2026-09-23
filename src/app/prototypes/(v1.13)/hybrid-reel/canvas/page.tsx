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
import { rehydrateUrls } from "../agent/chat/handoff";
import { Board } from "./board";
import { FullEditor } from "./fulleditor";
import { usePlayer, type Scrub } from "./player";
import { CoverDialog, composeCover, coverView } from "./cover";
import { NodeSettings } from "./settings";
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
  arrange,
  buildProject,
  newId,
  segmentAt,
  subSpan,
  MIN_SUB,
  type Clip,
  type CoverRef,
  type Project,
} from "./project";

type Stored = Handoff & { project?: Project };

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
  const [project, setProject] = useState<Project>(initial);
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
  /** 右键 / ⌘C 复制的片段 */
  const [clipboard, setClipboard] = useState<Clip | null>(null);
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
        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ ...handoff, project }));
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
    }));
    setSettingsId(null);
  };

  /* ── 片段右键菜单 ── */
  const copyClip = (id: string) => {
    const c = projectRef.current.clips.find((x) => x.id === id);
    if (c) setClipboard(c);
  };
  /* 粘贴:插在右键的那一段后面,新片段自动选中 */
  const pasteClip = (afterId?: string | null) => {
    if (!clipboard) return;
    const id = newId("c");
    edit.commit((p) => {
      const i = afterId ? p.clips.findIndex((c) => c.id === afterId) : -1;
      const clips = [...p.clips];
      clips.splice(i < 0 ? clips.length : i + 1, 0, { ...clipboard, id });
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
            refAssetId: src.id,
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
      } else if (mod && e.key.toLowerCase() === "v" && clipboard) {
        e.preventDefault();
        pasteClip(selectedPart === "clip" ? selectedId : null);
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
    canPaste: !!clipboard,
    onCopy: copyClip,
    onPaste: pasteClip,
    onAiGenerate: aiFromClip,
    onSpeed: (id, speed) => edit.commit((p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, speed } : c)) })),
    onExportClip: (id) => startExport(id),
    onExportAll: () => startExport(),
  };

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
        onSplit={split}
        onDelete={remove}
        fullOpen={full}
        settingsId={settingsId}
        onNodeClick={(id) => {
          const a = projectRef.current.assets.find((x) => x.id === id);
          /* 只有生成节点有 Settings;上传的素材点了只是选中高亮 */
          setSettingsId(a?.origin === "ai" && a.kind !== "audio" ? id : null);
        }}
        focusId={focusId}
        cover={coverView(project)}
        onCover={() => setCoverOpen(true)}
        onCoverRemove={removeCover}
      />

      {settingsAsset && (
        <NodeSettings
          key={settingsAsset.id}
          asset={settingsAsset}
          project={project}
          edit={edit}
          durationSec={settingsClipLen}
          onDuration={(sec) =>
            /* 改时长 = 改时间线上这一镜的长度;还没生成的镜头,素材长度跟着变 */
            edit.commit((p) => ({
              ...p,
              assets: p.assets.map((x) =>
                x.id === settingsAsset.id && x.status !== "ready" ? { ...x, durationSec: Math.max(sec, 0.5) } : x,
              ),
              clips: p.clips.map((c) =>
                c.assetId === settingsAsset.id ? { ...c, outSec: c.inSec + sec * c.speed } : c,
              ),
            }))
          }
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
          onExport={() => startExport()}
          exportPct={exportPct}
          clipMenu={clipMenu}
          onSplit={split}
          onDelete={remove}
          cover={coverView(project)}
          onCover={() => setCoverOpen(true)}
          onCoverRemove={removeCover}
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
