import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from "react-native";
import { GZButton, GZIconButton, GZSticker, gz } from "../../kit/gz";
import { isSubscribed } from "../../../buzzvideo-app/app/store";
import { poster, video } from "../data";
import { useCredits, useV2, type JobS } from "../store";
import { useStill } from "../still";
import { BottomSheet, useV1Routes } from "../ui";
import { Icon, MediaVideo, useInsets, useStore, type IconName } from "../v1";
import { IosShareSheet, LIBRARY, PhotoPicker } from "./EditorIos";

const c = gz.color;

/**
 * 新版设计 · 剪辑器(spec: docs/superpowers/specs/2026-11-16-buzzvideo-app-editor-design.md;审核: docs/superpowers/reviews/2026-11-17-app-editor-review.md)。
 * Monica 定：剪映那种剪辑器 —— 预览 + 时间码 / 播放 / 撤销重做 / 全屏，时间线最左「关闭原声」「封面」，主轨是帧条，片段之间是转场按钮，
 * 下面「添加文字」「添加音频」空轨;底部两级工具栏。手势：拖把手裁剪、长按拖动排序、捏合 / ± 缩放时间线。
 * AI:导入后可选「AI 一键成片」;同时自动(免费)找缺的镜头，时间线上标「+ AI shot」(同 Hybrid Reel),生成前可先看一帧预览，每段可免费重做一次。
 * 还有转场(含 AI morph)、滤镜、自动字幕(选语言 / 双语)+ 剪字幕(改字 / 切开 / 删除 / 调时间)、导出 / 去水印导出;
 * 导出后发到 BuzzVideo(公开发布才有积分，含 AI 的标 Contains AI)或用系统分享面板发到其他 APP(没有奖励)。视觉沿用新版设计的贴纸组件库
 */

type Clip = { id: string; postId: string; dur: number; max: number; speed: number; vol: number; filter?: string; reversed?: boolean; ai?: { status: "making" | "ready" | "failed"; p: number; prompt: string; freeRemake: boolean } };
type Gap = { id: string; before: number; role: string; why: string; prompt: string; postId: string; picked: boolean; preview: "none" | "loading" | "ready" };
type Line = { id: string; t0: number; t1: number; text: string; tr?: string };
type Caps = { status: "none" | "making" | "ready" | "nospeech"; style: string; lines: Line[]; p: number; lang: string; bilingual: boolean };
type TextItem = { id: string; at: number; dur: number; text: string };
type AudioItem = { id: string; kind: "sfx" | "voice" | "extract"; at: number; dur: number; name: string };
type Ratio = "9:16" | "1:1" | "16:9";
type Exp = null | { stage: "sheet" | "running" | "done" | "failed"; res: "720p" | "1080p"; fps: 30 | 60; clean: boolean; p: number };
type Project = { clips: Clip[]; trans: Record<string, string>; caps: Caps; texts: TextItem[]; music: string | null; audio: AudioItem[]; ratio: Ratio; muteAll: boolean; analyzed: "no" | "running" | "done"; gaps: Gap[] };
type Menu = null | "edit" | "audio" | "text";
type Panel = null | "speed" | "volume" | "broll" | "transition" | "filters" | "captions" | "captionsEdit" | "text" | "music" | "sfx" | "voice" | "ratio";
type Ui = { sel: string | null; junction: string | null; menu: Menu; panel: Panel; picker: "add" | "replace" | null; exp: Exp; share: boolean; full: boolean; t: number; auto: boolean; reorder: boolean; capSel: string | null };

const FRAME = 34; // 帧条每帧的宽度
const AI_SHOT_COST = 50; // 每段 AI 镜头(同网页版 Hybrid Reel:50 / 补拍段，Seedance 2.5,4–6s)
const AI_SHOT_DUR = 4;
const AI_TRANSITION_COST = 20;
const ZOOMS = [14, 20, 26, 36, 50]; // 时间线缩放档位(每秒多少像素)

/** 字幕样式：从网页版 30 套里挑了 8 套适合竖屏手机的 */
const CAP_STYLES: { id: string; label: string; render: (t: string, tr?: string) => ReactNode }[] = [
  { id: "classic", label: "Classic", render: (t, tr) => withTr(<Text style={[cap.base, cap.outline]}>{t}</Text>, tr) },
  { id: "yellow-box", label: "Yellow box", render: (t, tr) => withTr(<Text style={[cap.base, cap.box, { backgroundColor: c.butter, color: c.ink }]}>{t}</Text>, tr) },
  { id: "hormozi", label: "Hormozi", render: (t, tr) => withTr(<Text style={[cap.base, cap.outline, { textTransform: "uppercase", fontSize: 19 }]}>{hiLast(t, c.lime)}</Text>, tr) },
  { id: "karaoke", label: "Karaoke", render: (t, tr) => withTr(<Text style={[cap.base, cap.outline]}>{hiFirst(t, c.orange)}</Text>, tr) },
  { id: "pop", label: "Pop by word", render: (t, tr) => withTr(<Text style={[cap.base, cap.outline, { fontSize: 22, textTransform: "uppercase" }]}>{t.split(" ").slice(-1)[0]}</Text>, tr) },
  { id: "black-box", label: "Black box", render: (t, tr) => withTr(<Text style={[cap.base, cap.box, { backgroundColor: "rgba(0,0,0,0.78)" }]}>{t}</Text>, tr) },
  { id: "neon", label: "Neon", render: (t, tr) => withTr(<Text style={[cap.base, { color: c.pink, textShadowColor: c.pink, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } }]}>{t}</Text>, tr) },
  { id: "bubble", label: "Bubble", render: (t, tr) => withTr(<Text style={[cap.base, cap.box, { backgroundColor: c.white, color: c.ink, borderRadius: 14 }]}>{t}</Text>, tr) },
];
/** 双语字幕：第二行小一号 */
function withTr(main: ReactNode, tr?: string) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      {main}
      {tr ? <Text style={[cap.base, cap.outline, { fontSize: 13, lineHeight: 16, fontWeight: "600" }]}>{tr}</Text> : null}
    </View>
  );
}
function hiLast(t: string, color: string) {
  const w = t.split(" ");
  return (
    <>
      {w.slice(0, -1).join(" ")} <Text style={{ color }}>{w[w.length - 1]}</Text>
    </>
  );
}
function hiFirst(t: string, color: string) {
  const w = t.split(" ");
  return (
    <>
      <Text style={{ color }}>{w.slice(0, 2).join(" ")}</Text> {w.slice(2).join(" ")}
    </>
  );
}

const FILTERS: { id: string; label: string; tint: string }[] = [
  { id: "none", label: "None", tint: "transparent" },
  { id: "vivid", label: "Vivid", tint: "rgba(255,94,26,0.14)" },
  { id: "warm", label: "Warm", tint: "rgba(255,180,80,0.22)" },
  { id: "film", label: "Film", tint: "rgba(120,90,40,0.25)" },
  { id: "bw", label: "B&W", tint: "rgba(128,128,128,0.55)" },
  { id: "pastel", label: "Pastel", tint: "rgba(255,170,220,0.2)" },
  { id: "cinema", label: "Cinema", tint: "rgba(20,60,90,0.3)" },
];
const TRANSITIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "none", label: "None", icon: "x" },
  { id: "fade", label: "Fade", icon: "sparkles" },
  { id: "zoom", label: "Zoom", icon: "zoom-in" },
  { id: "swipe", label: "Swipe", icon: "chevron-right" },
  { id: "spin", label: "Spin", icon: "rotate-ccw" },
  { id: "glitch", label: "Glitch", icon: "split" },
];
const SFX = ["Whoosh", "Pop", "Record scratch", "Crowd laugh", "Camera click", "Ding"];
/** 曲库：标明能不能放心发到 TikTok / Reels(版权) */
const TRACKS = [
  { id: "sunny", name: "Sunny Paws", mood: "Happy · 0:45", safe: true },
  { id: "strut", name: "Runway Strut", mood: "Confident · 0:38", safe: true },
  { id: "lofi", name: "Lo-fi Nap", mood: "Chill · 1:02", safe: true },
  { id: "drama", name: "Drama Strings", mood: "Cinematic · 0:52", safe: false },
];
const LANGS = [
  { id: "auto", label: "Auto-detect" },
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
];
const LINES: Line[] = [
  { id: "l1", t0: 0.4, t1: 3.2, text: "okay so this is mochi", tr: "bueno, esta es mochi" },
  { id: "l2", t0: 3.4, t1: 6.6, text: "she does NOT do interviews", tr: "ella NO da entrevistas" },
  { id: "l3", t0: 7, t1: 10.2, text: "but for treats… maybe", tr: "pero por premios… quizás" },
  { id: "l4", t0: 10.6, t1: 15.4, text: "she's a star and she knows it", tr: "es una estrella y lo sabe" },
];
/** AI 看完素材找到的缺口(同 Hybrid Reel:按缺的叙事环节给镜头，默认勾重要的) */
const GAPS: Gap[] = [
  { id: "g1", before: 0, role: "Hook", why: "Your video starts mid-scene. A bold first shot stops the scroll.", prompt: "Slow push-in on a poodle in white sunglasses and a red polka-dot scarf, studio blue, dramatic light", postId: "poodle", picked: true, preview: "none" },
  { id: "g2", before: 2, role: "Cutaway", why: "Clip 2 jumps straight to clip 3. A cutaway smooths the cut.", prompt: "Close-up of a paw tapping a glass treat jar on a kitchen counter, warm morning light", postId: "catfan", picked: true, preview: "none" },
  { id: "g3", before: 3, role: "Ending", why: "No clear ending. A closing shot makes it feel finished.", prompt: "The poodle walks away from camera down a sunny hallway, slow motion, film look", postId: "collie", picked: false, preview: "none" },
];

const mk = (id: string, postId: string, dur: number): Clip => ({ id, postId, dur, max: dur, speed: 1, vol: 100 });
const BASE_CLIPS: Clip[] = [mk("c1", "poodle", 6), mk("c2", "dogcam", 5), mk("c3", "collie", 6)];
const CAPS0: Caps = { status: "none", style: "hormozi", lines: [], p: 0, lang: "auto", bilingual: false };
const EMPTY: Project = { clips: [], trans: {}, caps: CAPS0, texts: [], music: null, audio: [], ratio: "9:16", muteAll: false, analyzed: "no", gaps: [] };
const BASE: Project = { ...EMPTY, clips: BASE_CLIPS };
const READY_CAPS: Caps = { ...CAPS0, status: "ready", lines: LINES, p: 1 };
const UI0: Ui = { sel: null, junction: null, menu: null, panel: null, picker: null, exp: null, share: false, full: false, t: 2.2, auto: false, reorder: false, capSel: null };
const aiClip = (g: Gap, status: "making" | "ready" | "failed", p: number): Clip => ({ ...mk("ai-" + g.id, g.postId, AI_SHOT_DUR), ai: { status, p, prompt: g.prompt, freeRemake: true } });
const ANALYZED: Project = { ...BASE, analyzed: "done", gaps: GAPS };
/** 「我的」草稿里示例的剪辑工程(评审原型 / 旅程图用) */
export const DEMO_EDIT_DRAFT = { id: "demo", postId: "poodle", dur: 17, updated: 0, project: { ...ANALYZED, caps: READY_CAPS, music: "strut" } as unknown };

/** 进剪辑器时的预置状态(旅程图 / 评审原型用;真机从 pick 开始) */
function seedOf(seed: string | undefined, postId?: string): { p: Project; u: Ui } {
  const polished: Project = { ...ANALYZED, caps: READY_CAPS, music: "strut", trans: { c1: "fade" } };
  const exp = (stage: "sheet" | "running" | "done" | "failed", p = 1, clean = false): Exp => ({ stage, res: "720p", fps: 30, clean, p });
  switch (seed) {
    case "main":
      return { p: ANALYZED, u: UI0 };
    case "autoedit":
      return { p: { ...BASE, analyzed: "running" }, u: { ...UI0, auto: true, t: 0 } };
    case "autoedited":
      return { p: autoEdit(ANALYZED), u: { ...UI0, t: 3.6 } };
    case "clip":
      return { p: ANALYZED, u: { ...UI0, sel: "c2", menu: "edit", t: 7.4 } };
    case "reorder":
      return { p: ANALYZED, u: { ...UI0, reorder: true, sel: "c2" } };
    case "speed":
      return { p: ANALYZED, u: { ...UI0, sel: "c2", menu: "edit", panel: "speed", t: 7.4 } };
    case "broll-start":
      return { p: BASE, u: { ...UI0, panel: "broll" } };
    case "broll-analyzing":
      return { p: { ...BASE, analyzed: "running" }, u: { ...UI0, panel: "broll" } };
    case "broll":
      return { p: ANALYZED, u: { ...UI0, panel: "broll" } };
    case "broll-preview":
      return { p: { ...ANALYZED, gaps: GAPS.map((g, i) => (i === 0 ? { ...g, preview: "ready" } : i === 1 ? { ...g, preview: "loading" } : g)) }, u: { ...UI0, panel: "broll" } };
    case "broll-making":
      return { p: { ...ANALYZED, clips: [aiClip(GAPS[0], "making", 0.46), BASE_CLIPS[0], BASE_CLIPS[1], aiClip(GAPS[1], "making", 0.22), BASE_CLIPS[2]] }, u: { ...UI0, t: 1 } };
    case "broll-ready":
      return { p: { ...ANALYZED, clips: [aiClip(GAPS[0], "ready", 1), BASE_CLIPS[0], BASE_CLIPS[1], aiClip(GAPS[1], "ready", 1), BASE_CLIPS[2]] }, u: { ...UI0, sel: "ai-g1", menu: "edit", t: 1.5 } };
    case "broll-failed":
      return { p: { ...ANALYZED, clips: [aiClip(GAPS[0], "ready", 1), BASE_CLIPS[0], BASE_CLIPS[1], aiClip(GAPS[1], "failed", 0), BASE_CLIPS[2]] }, u: { ...UI0, sel: "ai-g2", menu: "edit", t: 16 } };
    case "transition":
      return { p: { ...ANALYZED, trans: { c1: "fade" } }, u: { ...UI0, junction: "c1", panel: "transition", t: 5.6 } };
    case "filters":
      return { p: { ...ANALYZED, clips: BASE_CLIPS.map((x) => ({ ...x, filter: "film" })) }, u: { ...UI0, sel: "c1", menu: "edit", panel: "filters", t: 2 } };
    case "captions-start":
      return { p: ANALYZED, u: { ...UI0, menu: "text", panel: "captions" } };
    case "captions":
      return { p: { ...ANALYZED, caps: READY_CAPS }, u: { ...UI0, menu: "text", panel: "captions", t: 4.4 } };
    case "bilingual":
      return { p: { ...ANALYZED, caps: { ...READY_CAPS, bilingual: true, lang: "en" } }, u: { ...UI0, menu: "text", panel: "captions", t: 4.4 } };
    case "captions-edit":
      return { p: { ...ANALYZED, caps: READY_CAPS }, u: { ...UI0, menu: "text", panel: "captionsEdit", capSel: "l2", t: 4.4 } };
    case "nospeech":
      return { p: { ...ANALYZED, caps: { ...READY_CAPS, status: "nospeech", lines: [] } }, u: { ...UI0, menu: "text", panel: "captions" } };
    case "text":
      return { p: { ...ANALYZED, caps: READY_CAPS, texts: [{ id: "x1", at: 0, dur: 3, text: "Meet Mochi 🕶️" }] }, u: { ...UI0, menu: "text", panel: "text", t: 1.2 } };
    case "audio":
      return { p: { ...ANALYZED, music: "strut", audio: [{ id: "a1", kind: "sfx", at: 5.6, dur: 1, name: "Whoosh" }] }, u: { ...UI0, menu: "audio", t: 5.4 } };
    case "music":
      return { p: { ...ANALYZED, caps: READY_CAPS, music: "strut" }, u: { ...UI0, menu: "audio", panel: "music" } };
    case "export":
      return { p: polished, u: { ...UI0, exp: exp("sheet", 0) } };
    case "exporting":
      return { p: polished, u: { ...UI0, exp: exp("running", 0.62) } };
    case "exported":
      return { p: polished, u: { ...UI0, exp: exp("done") } };
    case "exported-clean":
      return { p: polished, u: { ...UI0, exp: exp("done", 1, true) } };
    case "exported-music":
      return { p: { ...polished, music: "drama" }, u: { ...UI0, exp: exp("done", 1, true) } };
    case "share":
      return { p: polished, u: { ...UI0, exp: exp("done"), share: true } };
    case "export-failed":
      return { p: polished, u: { ...UI0, exp: exp("failed", 0.4) } };
    case "from-job":
      return { p: { ...EMPTY, clips: [mk("c1", postId ?? "poodle", 8)] }, u: { ...UI0, t: 1 } };
    default:
      return { p: EMPTY, u: { ...UI0, picker: "add", t: 0 } };
  }
}

/** AI 一键成片：按音乐卡点剪(每段最长 4 秒)、加转场 / 滤镜 / 音乐，字幕开始识别 */
function autoEdit(x: Project): Project {
  const clips = x.clips.map((cl) => ({ ...cl, dur: Math.min(cl.dur, 4), filter: "vivid" }));
  return { ...x, clips, trans: Object.fromEntries(clips.slice(0, -1).map((cl, i) => [cl.id, i % 2 ? "swipe" : "zoom"])), music: "strut", caps: x.caps.status === "ready" ? x.caps : { ...x.caps, status: "making", p: 0.2 } };
}

const fmtT = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
/** 外层有缩放(评审原型里手机是缩小显示的)时，把量到的宽度换回手机里的点数 */
const scaleOf = (el: HTMLElement) => (el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 拖拽手柄：裁剪片段 / 调字幕时间 / 排序(按下时记一次撤销) */
function Drag({ onStart, onMove, onEnd, style, label, children }: { onStart: () => void; onMove: (dx: number) => void; onEnd?: (dx: number) => void; style: object; label: string; children?: ReactNode }) {
  const cb = useRef({ onStart, onMove, onEnd });
  useEffect(() => {
    cb.current = { onStart, onMove, onEnd };
  });
  // 回调里才读 ref(手势事件时),不是渲染时
  // eslint-disable-next-line react-hooks/refs
  const [pr] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => cb.current.onStart(),
      onPanResponderMove: (_, g) => cb.current.onMove(g.dx),
      onPanResponderRelease: (_, g) => cb.current.onEnd?.(g.dx),
    }),
  );
  return (
    <View {...pr.panHandlers} style={style} accessibilityLabel={label} accessibilityRole="adjustable">
      {children}
    </View>
  );
}

/** 转场按钮的图标：剪映那种「领结」(两个相对的三角) */
function Bowtie({ color }: { color: string }) {
  const tri = (dir: "l" | "r") => ({ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderTopColor: "transparent", borderBottomColor: "transparent", [dir === "l" ? "borderLeftWidth" : "borderRightWidth"]: 5, [dir === "l" ? "borderLeftColor" : "borderRightColor"]: color });
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={tri("l")} />
      <View style={tri("r")} />
    </View>
  );
}

export default function Editor({ seed, postId }: { seed?: string; postId?: string }) {
  const { s, d } = useV2();
  const v1 = useStore();
  const v1r = useV1Routes();
  const credits = useCredits();
  const insets = useInsets();
  const still = useStill();
  const free = !isSubscribed(v1.state);
  // 草稿：从「我的」点剪辑草稿进来时 seed = draft:<id>,载入当时的工程
  const [init] = useState(() => {
    const id = seed?.startsWith("draft:") ? seed.slice(6) : "e" + Date.now();
    const dr = s.edits?.find((x) => x.id === id);
    return { id, ...(dr ? { p: dr.project as Project, u: { ...UI0, t: 0 } } : seedOf(seed, postId)) };
  });
  const draftId = init.id;
  const [p, setP] = useState<Project>(init.p);
  const [u, setU] = useState<Ui>(init.u);
  const [past, setPast] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const [playing, setPlaying] = useState(false);
  const [w, setW] = useState(0);
  const [zi, setZi] = useState(2);
  const pps = ZOOMS[zi];
  const tl = useRef<ScrollViewInstance | null>(null);
  const placed = useRef(false);
  const base = useRef(0);
  const wrap = useRef<unknown>(null);
  // 时间线区域的宽度(播放头居中、预览尺寸都靠它);onLayout 在网页里不一定触发，直接监听元素尺寸。触控板捏合(ctrl + 滚轮)缩放时间线
  useEffect(() => {
    const el = wrap.current as HTMLElement | null;
    if (!el?.getBoundingClientRect) return;
    const read = () => setW(el.getBoundingClientRect().width / scaleOf(el));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZi((z) => clamp(z + (e.deltaY < 0 ? 1 : -1), 0, ZOOMS.length - 1));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", wheel);
    };
  }, [u.picker, u.exp?.stage, u.full]);

  const pushPast = () => {
    setPast((h) => [...h.slice(-30), p]);
    setFuture([]);
  };
  const edit = (fn: (x: Project) => Project) => {
    pushPast();
    setP(fn);
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [p, ...f]);
    setP(past[past.length - 1]);
    setPast((h) => h.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((h) => [...h, p]);
    setP(future[0]);
    setFuture((f) => f.slice(1));
  };
  const toast = (text: string) => d({ type: "toast", text });

  const spans = useMemo(
    () =>
      p.clips.reduce<{ clip: Clip; t0: number; t1: number }[]>((acc, cl) => {
        const t0 = acc.length ? acc[acc.length - 1].t1 : 0;
        return [...acc, { clip: cl, t0, t1: t0 + cl.dur / cl.speed }];
      }, []),
    [p.clips],
  );
  const total = spans.length ? spans[spans.length - 1].t1 : 0;
  const t = Math.min(u.t, Math.max(0, total - 0.01));
  const cur = spans.find((x) => t >= x.t0 && t < x.t1) ?? spans[0];
  const line = p.caps.status === "ready" ? p.caps.lines.find((l) => t >= l.t0 && t < l.t1) : undefined;
  const textHere = p.texts.find((x) => t >= x.at && t < x.at + x.dur);
  const capStyle = CAP_STYLES.find((x) => x.id === p.caps.style) ?? CAP_STYLES[0];
  const tint = FILTERS.find((f) => f.id === cur?.clip.filter)?.tint ?? "transparent";
  const sel = p.clips.find((x) => x.id === u.sel);
  const realClips = p.clips.filter((x) => !x.ai);
  const hasAi = p.clips.some((x) => x.ai?.status === "ready") || Object.values(p.trans).includes("ai");
  // 还没补的缺口在时间线上的位置(before = 第几段实拍片段前面)
  const gapMarks = p.analyzed === "done" ? p.gaps.filter((g) => !p.clips.some((x) => x.id === "ai-" + g.id)).map((g) => ({ g, x: (g.before >= realClips.length ? total : spans.find((sp) => sp.clip.id === realClips[g.before]?.id)?.t0 ?? 0) * pps })) : [];

  useEffect(() => {
    if (!playing || still) return;
    const id = setInterval(() => {
      setU((x) => {
        const nt = x.t + 0.1;
        if (nt >= total) {
          setPlaying(false);
          return { ...x, t: 0 };
        }
        tl.current?.scrollTo({ x: nt * pps, animated: false });
        return { ...x, t: nt };
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, still, total, pps]);
  // 缩放后保持播放头位置
  const tNow = useRef(u.t);
  useEffect(() => {
    tNow.current = u.t;
  });
  useEffect(() => {
    tl.current?.scrollTo({ x: tNow.current * pps, animated: false });
  }, [w, pps]);

  // AI 进度(演示：计时器往前走;旅程图静帧不走)
  useEffect(() => {
    if (still) return;
    const busy = p.clips.some((x) => x.ai?.status === "making") || p.caps.status === "making" || p.analyzed === "running" || u.exp?.stage === "running" || p.gaps.some((g) => g.preview === "loading");
    if (!busy) return;
    const id = setTimeout(() => {
      setP((x) => ({
        ...x,
        analyzed: x.analyzed === "running" ? "done" : x.analyzed,
        gaps: x.analyzed === "running" ? GAPS : x.gaps.map((g) => (g.preview === "loading" ? { ...g, preview: "ready" } : g)),
        clips: x.clips.map((cl) => (cl.ai?.status !== "making" ? cl : { ...cl, ai: cl.ai.p >= 0.95 ? { ...cl.ai, status: "ready", p: 1 } : { ...cl.ai, p: cl.ai.p + 0.07 } })),
        caps: x.caps.status !== "making" ? x.caps : x.caps.p >= 0.95 ? { ...x.caps, status: "ready", lines: LINES, p: 1 } : { ...x.caps, p: x.caps.p + 0.12 },
      }));
      setU((x) => (x.exp?.stage === "running" ? { ...x, exp: x.exp.p >= 0.95 ? { ...x.exp, stage: "done", p: 1 } : { ...x.exp, p: x.exp.p + 0.1 } } : x));
    }, p.analyzed === "running" ? 1600 : 260);
    return () => clearTimeout(id);
  }, [p, u.exp, still]);

  const setPanel = (x: Panel) => setU((y) => ({ ...y, panel: y.panel === x ? null : x }));
  const openMenu = (m: Menu) => setU((y) => ({ ...y, menu: m, panel: null, reorder: false, sel: m === "edit" ? y.sel ?? cur?.clip.id ?? null : y.sel }));
  const back = () => setU((y) => (y.panel ? { ...y, panel: null } : { ...y, menu: null, sel: null, junction: null, capSel: null }));
  const spend = (n: number) => {
    if (!navigator.onLine) {
      toast("You're offline. AI tools need a connection.");
      return false;
    }
    if (credits < n) {
      toast("Not enough credits");
      v1r.paywall();
      return false;
    }
    d({ type: "demo", patch: { spent: s.spent + n } });
    return true;
  };

  const updClip = (id: string, patch: Partial<Clip>) => edit((x) => ({ ...x, clips: x.clips.map((cl) => (cl.id === id ? { ...cl, ...patch } : cl)) }));
  const split = () => {
    const sp = spans.find((x) => x.clip.id === u.sel);
    if (!sp || t - sp.t0 < 0.5 || sp.t1 - t < 0.5) return toast("Move the playhead inside the clip to split");
    const cut = (t - sp.t0) * sp.clip.speed;
    edit((x) => ({ ...x, clips: x.clips.flatMap((cl) => (cl.id !== sp.clip.id ? [cl] : [{ ...cl, dur: cut, max: cut }, { ...cl, id: cl.id + "s" + Math.round(t * 10), dur: cl.dur - cut, max: cl.max - cut }])) }));
  };
  const genGaps = (gaps: Gap[]) => {
    if (!gaps.length || !spend(gaps.length * AI_SHOT_COST)) return;
    edit((x) => {
      const redoIds = new Set(gaps.map((g) => "ai-" + g.id));
      const out: Clip[] = [];
      let real = 0;
      for (const cl of x.clips) {
        if (!cl.ai) {
          gaps.filter((g) => g.before === real).forEach((g) => out.push(aiClip(g, "making", 0.05)));
          real++;
        }
        if (!redoIds.has(cl.id)) out.push(cl);
      }
      gaps.filter((g) => g.before >= real).forEach((g) => out.push(aiClip(g, "making", 0.05)));
      return { ...x, clips: out };
    });
    setU((y) => ({ ...y, panel: null }));
  };
  const remake = (cl: Clip) => {
    if (!cl.ai) return;
    if (cl.ai.status === "failed") {
      if (spend(AI_SHOT_COST)) updClip(cl.id, { ai: { ...cl.ai, status: "making", p: 0.05 } });
    } else if (cl.ai.freeRemake) {
      updClip(cl.id, { ai: { ...cl.ai, status: "making", p: 0.05, freeRemake: false } });
      toast("Remaking for free. Next remake is 50 credits.");
    } else if (spend(AI_SHOT_COST)) updClip(cl.id, { ai: { ...cl.ai, status: "making", p: 0.05 } });
  };
  const saveDraft = (proj: Project) => {
    const first = proj.clips.find((x) => !x.ai)?.postId ?? "poodle";
    const dur = proj.clips.reduce((n, x) => n + x.dur / x.speed, 0);
    // eslint-disable-next-line react-hooks/purity -- 事件里调用，不在渲染里
    d({ type: "demo", patch: { edits: [{ id: draftId, postId: first, dur, updated: Date.now(), project: proj }, ...(s.edits ?? []).filter((x) => x.id !== draftId)] } });
  };
  const post = () => {
    const job: JobS = { id: "job-edit", postId: realClips[0]?.postId ?? "poodle", title: "My edit", prompt: "Edited in BuzzVideo", withTwin: false, progress: 1, status: "done", fromCreate: true, fromEdit: true, hasAi, editId: draftId } as JobS;
    saveDraft(p);
    d({ type: "demo", patch: { jobs: [job, ...s.jobs.filter((j) => j.id !== job.id)] } });
    d({ type: "push", route: { name: "result", jobId: job.id } });
  };
  const close = () => {
    if (p.clips.length) {
      saveDraft(p);
      toast("Saved to your drafts in Me");
    }
    d({ type: "pop" });
  };

  const box = useMemo(() => {
    const maxW = Math.max(0, w - 24);
    // 面板打开时预览保底一半左右(审核 #11):面板本身控制在约 40% 屏高
    const maxH = u.panel ? 250 : u.menu ? 300 : 320;
    const r = p.ratio === "9:16" ? 9 / 16 : p.ratio === "1:1" ? 1 : 16 / 9;
    const h = Math.min(maxH, maxW / r);
    return { width: h * r, height: h };
  }, [w, p.ratio, u.panel, u.menu]);

  /* ---------- 系统相册(添加 / 替换片段) ---------- */
  if (u.picker)
    return (
      <PhotoPicker
        onCancel={() => (p.clips.length ? setU((x) => ({ ...x, picker: null })) : d({ type: "pop" }))}
        onAdd={(ids) => {
          if (u.picker === "replace" && sel) {
            const dur = LIBRARY.find((l) => l.id === ids[0])!.dur;
            updClip(sel.id, { postId: ids[0], dur, max: dur, ai: undefined });
            toast("Clip replaced");
          } else {
            const first = !p.clips.length;
            // 导入后自动(免费)看素材找缺口(同 Hybrid Reel);第一次导入两段以上，先问要不要 AI 一键成片
            edit((x) => ({ ...x, analyzed: "running", clips: [...x.clips, ...ids.map((id, i) => mk(`c${x.clips.length + i + 1}`, id, LIBRARY.find((l) => l.id === id)!.dur))] }));
            if (first && ids.length > 1) setU((x) => ({ ...x, auto: true }));
          }
          setU((x) => ({ ...x, picker: null }));
        }}
      />
    );

  /* ---------- 导出完成 ---------- */
  if (u.exp?.stage === "done") {
    const cover = realClips[0]?.postId ?? "poodle";
    const marked = free && !u.exp.clean;
    const track = TRACKS.find((x) => x.id === p.music);
    return (
      <View style={{ flex: 1, backgroundColor: c.page, paddingTop: insets.top }}>
        <View style={st.doneTop}>
          <GZIconButton icon="chevron-left" size={36} label="Back to editor" onPress={() => setU((x) => ({ ...x, exp: null }))} />
        </View>
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center", gap: 16 }}>
          <View style={st.donePhoto}>
            <MediaVideo uri={video(cover)} poster={poster(cover)} style={StyleSheet.absoluteFill} />
            {marked ? <Text style={st.watermark}>Made with BuzzVideo</Text> : null}
          </View>
          <View style={{ alignItems: "center", gap: 4, paddingHorizontal: 24 }}>
            <Text style={[gz.display.title, { color: c.white }]}>Your video is ready</Text>
            <Text style={[gz.body.caption, { color: c.text2 }]}>
              {u.exp.res} · {u.exp.fps} fps · {fmtT(total)} · {marked ? "with watermark" : "no watermark"}
            </Text>
            {/* 去水印引导(审核 #10):Free 带水印时直接给升级入口 */}
            {marked ? (
              <Pressable onPress={v1r.paywall} accessibilityRole="button" hitSlop={8}>
                <Text style={[gz.display.label, { color: c.lilac, marginTop: 4 }]}>Remove watermark with Starter ›</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 14, gap: 10 }}>
          <GZButton label={s.claimed.includes("firstPost") ? "Post to BuzzVideo" : "Post to BuzzVideo · +20 credits"} onPress={post} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <GZButton label="Share to…" icon="share" variant="dark" block onPress={() => setU((x) => ({ ...x, share: true }))} />
            </View>
            <View style={{ flex: 1 }}>
              <GZButton label="Save" icon="download" variant="dark" block onPress={() => toast("Saved to Photos")} />
            </View>
          </View>
          {/* 版权提示(审核 #8):这首歌发到其他 APP 可能被静音 */}
          {track && !track.safe ? (
            <View style={st.warnRow}>
              <Icon name="circle-alert" size={14} color={c.butter} strokeWidth={2.4} />
              <Text style={[gz.body.caption, { color: c.text2, flex: 1 }]}>“{track.name}” is licensed for BuzzVideo only. It may be muted if you share to TikTok or Instagram.</Text>
            </View>
          ) : (
            <Text style={[gz.body.caption, { color: c.text3, textAlign: "center" }]}>Posting to BuzzVideo puts it in For You. Sharing to other apps has no credits.</Text>
          )}
        </View>
        {u.share ? (
          <IosShareSheet
            postId={cover}
            dur={total}
            onClose={(msg) => {
              setU((x) => ({ ...x, share: false }));
              if (msg) toast(msg);
            }}
          />
        ) : null}
      </View>
    );
  }

  /* ---------- 剪辑主界面(剪映版式) ---------- */
  const preview = (
    <View style={[st.preview, u.full ? { width: "100%", height: "100%", borderRadius: 0 } : box]}>
      {cur ? (
        cur.clip.ai && cur.clip.ai.status !== "ready" ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface, alignItems: "center", justifyContent: "center", gap: 6, padding: 16 }]}>
            <Icon name={cur.clip.ai.status === "failed" ? "circle-alert" : "wand-sparkles"} size={22} color={cur.clip.ai.status === "failed" ? c.red : c.sky} strokeWidth={2.4} />
            <Text style={[gz.display.label, { color: c.white, textAlign: "center" }]}>{cur.clip.ai.status === "failed" ? "This AI shot didn't work" : `Making AI shot ${Math.round(cur.clip.ai.p * 100)}%`}</Text>
          </View>
        ) : (
          <MediaVideo key={cur.clip.id} uri={video(cur.clip.postId)} poster={poster(cur.clip.postId)} style={StyleSheet.absoluteFill} paused={!playing} autoPlay={playing} muted />
        )
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      {cur?.clip.ai?.status === "ready" ? (
        <View style={st.aiTag}>
          <GZSticker label="AI shot" color="sky" size="s" rotate={-3} />
        </View>
      ) : null}
      {textHere ? (
        <View style={st.textOverlay}>
          <Text style={[gz.display.title, { color: c.white, textAlign: "center" }, gz.textShadow]}>{textHere.text}</Text>
        </View>
      ) : null}
      {line ? <View style={st.capOverlay}>{capStyle.render(line.text, p.caps.bilingual ? line.tr : undefined)}</View> : null}
    </View>
  );

  if (u.full)
    return (
      <View style={{ flex: 1, backgroundColor: c.black }}>
        {preview}
        <View style={[st.fullBar, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable onPress={() => setPlaying((x) => !x)} accessibilityLabel={playing ? "Pause" : "Play"} style={st.play}>
            <Icon name={playing ? "pause" : "play"} size={18} color={c.ink} fill={c.ink} strokeWidth={1} />
          </Pressable>
          <Text style={[gz.body.micro, { color: c.white, flex: 1 }]}>
            {fmtT(t)} / {fmtT(total)}
          </Text>
          <GZIconButton icon="x" size={36} onVideo label="Exit full screen" onPress={() => setU((x) => ({ ...x, full: false }))} />
        </View>
      </View>
    );

  const openExport = () => p.clips.length && setU((x) => ({ ...x, exp: { stage: "sheet", res: "720p", fps: 30, clean: !free, p: 0 }, panel: null }));

  return (
    <View style={{ flex: 1, backgroundColor: c.black }}>
      {/* 顶栏：关闭 · 分辨率 · 导出 */}
      <View style={[st.top, { paddingTop: insets.top + 4 }]}>
        <GZIconButton icon="x" size={36} label="Close editor" onPress={close} />
        <View style={{ flex: 1 }} />
        <Pressable onPress={openExport} style={st.resChip} accessibilityRole="button" accessibilityLabel="Export settings">
          <Text style={[gz.display.label, { color: c.white }]}>{free ? "720P" : "1080P"}</Text>
          <Icon name="chevron-down" size={14} color={c.white} strokeWidth={2.6} />
        </Pressable>
        <GZButton label="Export" size="s" onPress={openExport} disabled={!p.clips.length} />
      </View>

      {/* 预览 */}
      <View style={{ alignItems: "center", paddingTop: 4 }}>{p.clips.length ? preview : <EmptyPreview onAdd={() => setU((x) => ({ ...x, picker: "add" }))} />}</View>

      {/* 时间码 · 播放 · 撤销重做 · 全屏 */}
      <View style={st.transport}>
        <Text style={[gz.body.micro, { color: c.white, fontVariant: ["tabular-nums"], flex: 1 }]}>
          {fmtT(t)} <Text style={{ color: c.text3 }}>/ {fmtT(total)}</Text>
        </Text>
        <Pressable onPress={() => setPlaying((x) => !x)} disabled={!p.clips.length} accessibilityLabel={playing ? "Pause" : "Play"} style={st.play}>
          <Icon name={playing ? "pause" : "play"} size={18} color={c.ink} fill={c.ink} strokeWidth={1} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 2 }}>
          <Pressable onPress={undo} disabled={!past.length} accessibilityLabel="Undo" style={[st.topBtn, !past.length && { opacity: 0.35 }]}>
            <Icon name="undo-2" size={19} color={c.white} strokeWidth={2.2} />
          </Pressable>
          <Pressable onPress={redo} disabled={!future.length} accessibilityLabel="Redo" style={[st.topBtn, !future.length && { opacity: 0.35 }]}>
            <Icon name="redo-2" size={19} color={c.white} strokeWidth={2.2} />
          </Pressable>
          <Pressable onPress={() => setU((x) => ({ ...x, full: true }))} accessibilityLabel="Full screen" style={st.topBtn}>
            <Icon name="maximize" size={18} color={c.white} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {/* 时间线 */}
      <View ref={wrap as never} style={{ flex: 1, minHeight: 140, overflow: "hidden" }}>
        {p.clips.length ? (
          <ScrollView
            ref={tl}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              if (placed.current || !w) return;
              placed.current = true;
              tl.current?.scrollTo({ x: init.u.t * pps, animated: false });
            }}
            onScroll={(e) => !playing && setU((x) => ({ ...x, t: Math.max(0, e.nativeEvent.contentOffset.x / pps) }))}
            contentContainerStyle={{ paddingHorizontal: w / 2, paddingTop: 6 }}
          >
            <View style={{ width: total * pps + 56 }}>
              {/* 刻度 */}
              <View style={{ height: 16 }}>
                {Array.from({ length: Math.ceil(total / 2) + 1 }, (_, i) => (
                  <View key={i} style={[st.tickWrap, { left: i * 2 * pps - 15, width: 2 * pps + 15 }]}>
                    <Text style={st.tick}>{fmtT(i * 2)}</Text>
                    <View style={[st.dot, { left: 15 + pps - 1 }]} />
                  </View>
                ))}
              </View>

              {/* 缺口标记：AI 找到的缺镜头位置(审核 #3),点了进 AI B-roll */}
              <View style={{ height: gapMarks.length && !u.reorder ? 22 : 0 }}>
                {!u.reorder &&
                  gapMarks.map(({ g, x }) => (
                    <Pressable key={g.id} onPress={() => setU((y) => ({ ...y, panel: "broll", menu: null }))} style={[st.gapMark, { left: clamp(x - 34, -40, total * pps) }]} accessibilityRole="button" accessibilityLabel={`Add an AI ${g.role} shot`}>
                      <Text style={[gz.display.tiny, { color: c.ink, fontSize: 10 }]}>+ AI shot</Text>
                    </Pressable>
                  ))}
              </View>

              {/* 主轨 */}
              <View style={{ flexDirection: "row", alignItems: "center", height: 58 }}>
                <View style={st.leadCol}>
                  <Pressable onPress={() => edit((x) => ({ ...x, muteAll: !x.muteAll }))} style={st.lead} accessibilityRole="button" accessibilityLabel={p.muteAll ? "Turn clip audio on" : "Mute clip audio"}>
                    <Icon name={p.muteAll ? "volume-x" : "volume-2"} size={16} color={c.white} strokeWidth={2.2} />
                    <Text style={st.leadText}>{p.muteAll ? "Audio\noff" : "Mute\naudio"}</Text>
                  </Pressable>
                  <Pressable onPress={() => toast("Pick a frame for your cover")} style={st.cover} accessibilityRole="button" accessibilityLabel="Set cover">
                    <Image source={{ uri: poster(p.clips[0].postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <Text style={st.coverText}>Cover</Text>
                  </Pressable>
                </View>
                {u.reorder ? (
                  <ReorderRow clips={p.clips} onStart={pushPast} onMove={(from, to) => setP((x) => ({ ...x, clips: moveItem(x.clips, from, to) }))} />
                ) : (
                  spans.map((sp, i) => {
                    const on = sp.clip.id === u.sel;
                    const width = (sp.t1 - sp.t0) * pps;
                    const ai = sp.clip.ai;
                    const next = spans[i + 1];
                    const tr = p.trans[sp.clip.id];
                    const trim = (side: "l" | "r") => (
                      <Drag
                        label={side === "l" ? "Trim start" : "Trim end"}
                        style={[st.handle, side === "l" ? { left: -6 } : { right: -6 }]}
                        onStart={() => {
                          pushPast();
                          base.current = sp.clip.dur;
                        }}
                        onMove={(dx) => {
                          const nd = clamp(base.current + ((side === "r" ? dx : -dx) / pps) * sp.clip.speed, 0.5, sp.clip.max);
                          setP((x) => ({ ...x, clips: x.clips.map((cl) => (cl.id === sp.clip.id ? { ...cl, dur: Math.round(nd * 10) / 10 } : cl)) }));
                        }}
                      >
                        <View style={st.handleGrip} />
                      </Drag>
                    );
                    return (
                      <View key={sp.clip.id} style={{ flexDirection: "row", alignItems: "center" }}>
                        <Pressable
                          onPress={() => setU((x) => ({ ...x, sel: on ? null : sp.clip.id, menu: on ? null : "edit", panel: null, junction: null }))}
                          onLongPress={() => setU((x) => ({ ...x, reorder: true, sel: sp.clip.id, menu: null, panel: null }))}
                          delayLongPress={350}
                          style={[st.clip, { width }, on && st.clipOn, ai && !on && { borderWidth: 2, borderColor: ai.status === "failed" ? c.red : c.sky }]}
                          accessibilityLabel={`${ai ? "AI shot" : "Clip"} ${(sp.t1 - sp.t0).toFixed(1)} seconds`}
                          accessibilityHint="Tap to edit, long press to reorder"
                        >
                          <View style={{ flex: 1, borderRadius: 6, overflow: "hidden" }}>
                            {ai && ai.status !== "ready" ? (
                              <View style={[StyleSheet.absoluteFill, { backgroundColor: ai.status === "failed" ? "rgba(255,59,48,0.25)" : "rgba(124,203,255,0.25)", alignItems: "center", justifyContent: "center" }]}>
                                <Text style={[gz.display.tiny, { color: ai.status === "failed" ? c.red : c.sky, fontSize: 11 }]}>{ai.status === "failed" ? "Failed" : `${Math.round(ai.p * 100)}%`}</Text>
                              </View>
                            ) : (
                              <View style={{ flexDirection: "row", height: "100%" }}>
                                {Array.from({ length: Math.max(1, Math.ceil(width / FRAME)) }, (_, k) => (
                                  <Image key={k} source={{ uri: poster(sp.clip.postId) }} style={{ width: FRAME, height: "100%", opacity: sp.clip.reversed ? 0.8 : 1 }} resizeMode="cover" />
                                ))}
                              </View>
                            )}
                            <View style={st.clipBadges}>
                              {ai ? <Text style={[st.badge, { backgroundColor: c.sky, color: c.ink }]}>AI</Text> : null}
                              {sp.clip.speed !== 1 ? <Text style={st.badge}>{sp.clip.speed}×</Text> : null}
                              {sp.clip.filter && sp.clip.filter !== "none" ? <Text style={st.badge}>{FILTERS.find((f) => f.id === sp.clip.filter)?.label}</Text> : null}
                              {sp.clip.reversed ? <Text style={st.badge}>Reversed</Text> : null}
                              {sp.clip.vol === 0 || p.muteAll ? <Icon name="volume-x" size={11} color={c.white} strokeWidth={2.6} /> : null}
                            </View>
                            <Text style={st.clipDur}>{(sp.t1 - sp.t0).toFixed(1)}s</Text>
                          </View>
                          {on ? (
                            <>
                              {trim("l")}
                              {trim("r")}
                            </>
                          ) : null}
                        </Pressable>
                        {/* 选中片段时两边的转场按钮先收起来，给裁剪把手让位(剪映也是) */}
                        {next && !on && next.clip.id !== u.sel ? (
                          <Pressable onPress={() => setU((x) => ({ ...x, junction: sp.clip.id, panel: "transition", menu: null, sel: null }))} style={[st.junction, tr && tr !== "none" && { backgroundColor: tr === "ai" ? c.sky : c.orange }, u.junction === sp.clip.id && { borderColor: c.white, borderWidth: 2 }]} accessibilityRole="button" accessibilityLabel="Transition">
                            <Bowtie color={tr && tr !== "none" ? c.white : c.ink} />
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })
                )}
                {!u.reorder ? (
                  <Pressable onPress={() => setU((x) => ({ ...x, picker: "add" }))} accessibilityRole="button" accessibilityLabel="Add clips" style={st.addClip}>
                    <Icon name="plus" size={20} color={c.ink} strokeWidth={3} />
                  </Pressable>
                ) : null}
              </View>

              {/* 文字 / 字幕轨 */}
              <View style={st.lane}>
                {p.caps.status === "ready" || p.texts.length ? (
                  <>
                    {p.caps.status === "ready"
                      ? p.caps.lines.map((l) => {
                          const on = u.capSel === l.id;
                          const edge = (side: "l" | "r") => (
                            <Drag
                              label={side === "l" ? "Caption start" : "Caption end"}
                              style={[st.capHandle, side === "l" ? { left: -5 } : { right: -5 }]}
                              onStart={() => {
                                pushPast();
                                base.current = side === "l" ? l.t0 : l.t1;
                              }}
                              onMove={(dx) => {
                                const v = Math.round((base.current + dx / pps) * 10) / 10;
                                setP((x) => ({ ...x, caps: { ...x.caps, lines: x.caps.lines.map((y) => (y.id !== l.id ? y : side === "l" ? { ...y, t0: clamp(v, 0, y.t1 - 0.3) } : { ...y, t1: clamp(v, y.t0 + 0.3, total) })) } }));
                              }}
                            />
                          );
                          return (
                            <Pressable key={l.id} onPress={() => setU((x) => ({ ...x, menu: "text", panel: "captionsEdit", capSel: l.id }))} style={[st.capBlock, { left: l.t0 * pps, width: (l.t1 - l.t0) * pps - 2 }, on && st.capBlockOn]} accessibilityLabel={`Caption: ${l.text}`}>
                              <Text style={[gz.display.tiny, { color: c.ink, fontSize: 11 }]} numberOfLines={1}>
                                {l.text}
                              </Text>
                              {on ? (
                                <>
                                  {edge("l")}
                                  {edge("r")}
                                </>
                              ) : null}
                            </Pressable>
                          );
                        })
                      : null}
                    {p.texts.map((x) => (
                      <Pressable key={x.id} onPress={() => setU((y) => ({ ...y, menu: "text", panel: "text" }))} style={[st.textBlock, { left: x.at * pps, width: x.dur * pps - 2, top: p.caps.status === "ready" ? -2 : 2 }]}>
                        <Icon name="type" size={10} color={c.white} strokeWidth={2.6} />
                        <Text style={[gz.display.tiny, { color: c.white, fontSize: 11 }]} numberOfLines={1}>
                          {x.text}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                ) : (
                  <Pressable onPress={() => openMenu("text")} style={st.addLane} accessibilityRole="button">
                    <Icon name="plus" size={11} color={c.text2} strokeWidth={2.6} />
                    <Text style={[gz.display.tiny, { color: c.text2, fontSize: 11 }]}>Add text</Text>
                  </Pressable>
                )}
              </View>

              {/* 音频轨 */}
              <View style={st.lane}>
                {p.music || p.audio.length ? (
                  <>
                    {p.music ? (
                      <Pressable onPress={() => setU((x) => ({ ...x, menu: "audio", panel: "music" }))} style={[st.musicBlock, { width: total * pps - 2 }]}>
                        <Icon name="music" size={11} color={c.ink} strokeWidth={2.6} />
                        <Text style={[gz.display.tiny, { color: c.ink, fontSize: 11 }]}>{TRACKS.find((x) => x.id === p.music)?.name}</Text>
                        <View style={st.wave}>
                          {Array.from({ length: Math.floor((total * pps) / 6) }, (_, i) => (
                            <View key={i} style={{ width: 2, height: 4 + ((i * 7) % 11), backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 1 }} />
                          ))}
                        </View>
                      </Pressable>
                    ) : null}
                    {p.audio.map((a) => (
                      <View key={a.id} style={[st.sfxBlock, { left: a.at * pps, width: Math.max(30, a.dur * pps) }]}>
                        <Icon name={a.kind === "voice" ? "mic" : "audio-lines"} size={10} color={c.ink} strokeWidth={2.6} />
                        <Text style={[gz.display.tiny, { color: c.ink, fontSize: 10 }]} numberOfLines={1}>
                          {a.name}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Pressable onPress={() => openMenu("audio")} style={st.addLane} accessibilityRole="button">
                    <Icon name="plus" size={11} color={c.text2} strokeWidth={2.6} />
                    <Text style={[gz.display.tiny, { color: c.text2, fontSize: 11 }]}>Add audio</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        ) : null}
        {p.clips.length && !u.reorder ? <View pointerEvents="none" style={[st.playhead, { left: w / 2 - 1 }]} /> : null}
        {/* 缩放(捏合之外的兜底按钮)/ 排序模式的完成 */}
        {p.clips.length ? (
          u.reorder ? (
            <View style={st.zoomBox}>
              <Text style={[gz.body.micro, { color: c.text2, marginRight: 6 }]}>Drag to reorder</Text>
              <GZButton label="Done" size="s" variant="white" onPress={() => setU((x) => ({ ...x, reorder: false }))} />
            </View>
          ) : (
            <View style={st.zoomBox}>
              <Pressable onPress={() => setZi((z) => clamp(z - 1, 0, ZOOMS.length - 1))} disabled={zi === 0} accessibilityRole="button" accessibilityLabel="Zoom out timeline" style={[st.zoomBtn, zi === 0 && { opacity: 0.35 }]}>
                <Text style={st.zoomText}>−</Text>
              </Pressable>
              <Pressable onPress={() => setZi((z) => clamp(z + 1, 0, ZOOMS.length - 1))} disabled={zi === ZOOMS.length - 1} accessibilityRole="button" accessibilityLabel="Zoom in timeline" style={[st.zoomBtn, zi === ZOOMS.length - 1 && { opacity: 0.35 }]}>
                <Text style={st.zoomText}>+</Text>
              </Pressable>
            </View>
          )
        ) : null}
      </View>

      {/* 底部：面板 > 二级工具栏 > 一级工具栏 */}
      <View style={[st.bottom, { paddingBottom: insets.bottom + 6 }]}>
        {u.panel ? (
          <PanelArea
            panel={u.panel}
            p={p}
            sel={sel}
            t={t}
            credits={credits}
            junction={u.junction}
            capSel={u.capSel}
            onDone={() => setU((y) => ({ ...y, panel: null, junction: y.panel === "transition" ? null : y.junction }))}
            api={{ updClip, edit, setP, toast, spend, genGaps, setPanel, selectCap: (id) => setU((y) => ({ ...y, capSel: id })), analyze: () => edit((x) => ({ ...x, analyzed: "running" })) }}
          />
        ) : u.menu ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={st.backBtn}>
              <Icon name="chevron-left" size={18} color={c.white} strokeWidth={2.6} />
              <Icon name="chevron-left" size={18} color={c.white} strokeWidth={2.6} />
            </Pressable>
            <ToolScroll>
              {u.menu === "edit" && sel ? (
                <>
                  <Tool icon="split" label="Split" onPress={split} />
                  <Tool icon="gauge" label="Speed" onPress={() => setPanel("speed")} />
                  <Tool icon={sel.vol === 0 ? "volume-x" : "volume-2"} label="Volume" onPress={() => setPanel("volume")} />
                  <Tool icon="sparkles" label="Filters" onPress={() => setPanel("filters")} />
                  <Tool icon="rotate-ccw" label="Reverse" onPress={() => updClip(sel.id, { reversed: !sel.reversed })} />
                  <Tool icon="copy" label="Duplicate" onPress={() => edit((x) => ({ ...x, clips: x.clips.flatMap((cl) => (cl.id === sel.id ? [cl, { ...cl, id: cl.id + "d" + x.clips.length }] : [cl])) }))} />
                  <Tool icon="images" label="Replace" onPress={() => setU((x) => ({ ...x, picker: "replace" }))} />
                  {sel.ai ? <Tool icon="wand-sparkles" label={sel.ai.status === "failed" ? `Retry · ${AI_SHOT_COST}` : sel.ai.freeRemake ? "Remake · free" : `Remake · ${AI_SHOT_COST}`} onPress={() => remake(sel)} /> : null}
                  <Tool
                    icon="trash"
                    label="Delete"
                    danger
                    onPress={() => {
                      edit((x) => ({ ...x, clips: x.clips.filter((cl) => cl.id !== sel.id) }));
                      setU((x) => ({ ...x, sel: null, menu: null }));
                    }}
                  />
                </>
              ) : u.menu === "audio" ? (
                <>
                  <Tool icon="music" label="Music" onPress={() => setPanel("music")} />
                  <Tool icon="audio-lines" label="Sound FX" onPress={() => setPanel("sfx")} />
                  <Tool icon="mic" label="Voiceover" onPress={() => setPanel("voice")} />
                  <Tool
                    icon="film"
                    label="Extract audio"
                    onPress={() => {
                      edit((x) => ({ ...x, audio: [...x.audio, { id: "a" + (x.audio.length + 1), kind: "extract", at: t, dur: 5, name: "Extracted audio" }] }));
                      toast("Audio extracted from the video");
                    }}
                  />
                </>
              ) : (
                <>
                  <Tool icon="type" label="Add text" onPress={() => setPanel("text")} />
                  <Tool icon="captions" label="Auto captions" badge="FREE" onPress={() => setPanel("captions")} />
                  <Tool icon="scissors" label="Edit captions" onPress={() => (p.caps.status === "ready" ? setPanel("captionsEdit") : toast("Make captions first"))} />
                </>
              )}
            </ToolScroll>
          </View>
        ) : (
          <ToolScroll>
            <Tool icon="wand-sparkles" label="Auto edit" badge="AI" onPress={() => setU((x) => ({ ...x, auto: true }))} />
            <Tool icon="scissors" label="Edit" onPress={() => openMenu("edit")} />
            <Tool icon="film" label="AI B-roll" badge={gapMarks.length ? String(gapMarks.length) : "AI"} onPress={() => setPanel("broll")} />
            <Tool icon="audio-lines" label="Audio" onPress={() => openMenu("audio")} />
            <Tool icon="type" label="Text" onPress={() => openMenu("text")} />
            <Tool
              icon="captions"
              label="Captions"
              onPress={() => {
                openMenu("text");
                setPanel("captions");
              }}
            />
            <Tool
              icon="sparkles"
              label="Filters"
              onPress={() => {
                openMenu("edit");
                setPanel("filters");
              }}
            />
            <Tool icon="crop" label="Ratio" onPress={() => setPanel("ratio")} />
          </ToolScroll>
        )}
      </View>

      {/* AI 一键成片(审核 #2):第一次导入两段以上时问一次;一级工具栏也有入口 */}
      {u.auto ? (
        <BottomSheet title="Let AI make the first cut?" onClose={() => setU((x) => ({ ...x, auto: false }))}>
          <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}>
            <Text style={[gz.body.body, { color: c.text2 }]}>We&apos;ll cut your clips to the beat and add music, transitions and captions. Change anything after. Free.</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { icon: "music" as IconName, label: "Cut to the beat" },
                { icon: "split" as IconName, label: "Transitions" },
                { icon: "captions" as IconName, label: "Captions" },
              ].map((x) => (
                <View key={x.label} style={st.autoChip}>
                  <Icon name={x.icon} size={16} color={c.white} strokeWidth={2.2} />
                  <Text style={[gz.body.micro, { color: c.text2 }]}>{x.label}</Text>
                </View>
              ))}
            </View>
            <GZButton
              label="Auto edit"
              icon="wand-sparkles"
              onPress={() => {
                edit(autoEdit);
                setU((x) => ({ ...x, auto: false }));
                toast("Here's a first cut. Change anything you like.");
              }}
            />
            <GZButton label="I'll edit myself" variant="dark" onPress={() => setU((x) => ({ ...x, auto: false }))} />
          </View>
        </BottomSheet>
      ) : null}

      {/* 导出设置 */}
      {u.exp?.stage === "sheet" ? (
        <BottomSheet title="Export" onClose={() => setU((x) => ({ ...x, exp: null }))}>
          <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}>
            <Text style={[gz.display.label, { color: c.text2 }]}>Resolution</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["720p", "1080p"] as const).map((r) => (
                <Choice key={r} label={r} on={u.exp?.res === r} locked={free && r === "1080p"} onPress={() => (free && r === "1080p" ? v1r.paywall() : setU((x) => ({ ...x, exp: { ...x.exp!, res: r } })))} />
              ))}
            </View>
            <Text style={[gz.display.label, { color: c.text2 }]}>Frame rate</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {([30, 60] as const).map((f) => (
                <Choice key={f} label={`${f} fps`} on={u.exp?.fps === f} onPress={() => setU((x) => ({ ...x, exp: { ...x.exp!, fps: f } }))} />
              ))}
            </View>
            <Pressable onPress={() => (free ? v1r.paywall() : setU((x) => ({ ...x, exp: { ...x.exp!, clean: !x.exp!.clean } })))} style={st.cleanRow} accessibilityRole="switch" accessibilityState={{ checked: !!u.exp?.clean }}>
              <View style={{ flex: 1 }}>
                <Text style={[gz.body.strong, { color: c.white }]}>Remove watermark</Text>
                <Text style={[gz.body.caption, { color: c.text3 }]}>{free ? "Free exports carry a small “Made with BuzzVideo” mark." : "Your plan exports without a watermark."}</Text>
              </View>
              {free ? <GZSticker label="PAID" color="lilac" size="s" rotate={4} /> : null}
              <View style={[st.switch, u.exp?.clean && { backgroundColor: c.white }]}>
                <View style={[st.knob, u.exp?.clean && { alignSelf: "flex-end", backgroundColor: c.ink }]} />
              </View>
            </Pressable>
            <Text style={[gz.body.caption, { color: c.text3 }]}>
              {fmtT(total)} · about {Math.max(4, Math.round(total * (u.exp?.res === "1080p" ? 1.6 : 0.9)))} MB{hasAi ? " · labeled “Contains AI” when posted" : ""}
            </Text>
            <GZButton label="Export video" onPress={() => (navigator.onLine ? setU((x) => ({ ...x, exp: { ...x.exp!, stage: "running", p: 0.05 } })) : toast("You're offline. Exporting needs a connection."))} />
          </View>
        </BottomSheet>
      ) : null}
      {u.exp?.stage === "running" || u.exp?.stage === "failed" ? (
        <View style={st.exporting}>
          <Text style={[gz.display.hero, { color: c.white, fontSize: 56, lineHeight: 56 }]}>{Math.round(u.exp.p * 100)}%</Text>
          <Text style={[gz.display.title, { color: c.white }]}>{u.exp.stage === "failed" ? "Export didn't finish" : "Exporting your video"}</Text>
          <View style={st.expTrack}>
            <View style={[st.expFill, { width: `${Math.round(u.exp.p * 100)}%` }, u.exp.stage === "failed" && { backgroundColor: c.red }]} />
          </View>
          <Text style={[gz.body.caption, { color: c.text2, textAlign: "center" }]}>{u.exp.stage === "failed" ? "Your draft is safe. Check your connection and try again." : "Keep the app open. Your draft is saved."}</Text>
          {u.exp.stage === "failed" ? (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <GZButton label="Cancel" variant="dark" size="m" onPress={() => setU((x) => ({ ...x, exp: null }))} />
              <GZButton label="Try again" size="m" onPress={() => setU((x) => ({ ...x, exp: { ...x.exp!, stage: "running", p: 0.05 } }))} />
            </View>
          ) : (
            <GZButton label="Cancel" variant="dark" size="m" onPress={() => setU((x) => ({ ...x, exp: null }))} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function moveItem<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
}

/** 排序模式：片段缩成一样大的方块(剪映长按后的样子)，按住拖到新位置 */
function ReorderRow({ clips, onStart, onMove }: { clips: Clip[]; onStart: () => void; onMove: (from: number, to: number) => void }) {
  const SLOT = 58;
  const [drag, setDrag] = useState<{ i: number; dx: number } | null>(null);
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {clips.map((cl, i) => (
        <Drag
          key={cl.id}
          label={`Reorder clip ${i + 1}`}
          style={[st.reTile, drag?.i === i && { transform: [{ translateX: drag.dx }, { scale: 1.08 }], zIndex: 5, borderColor: c.orange }]}
          onStart={() => {
            onStart();
            setDrag({ i, dx: 0 });
          }}
          onMove={(dx) => setDrag({ i, dx })}
          onEnd={(dx) => {
            const to = clamp(i + Math.round(dx / SLOT), 0, clips.length - 1);
            if (to !== i) onMove(i, to);
            setDrag(null);
          }}
        >
          <Image source={{ uri: poster(cl.postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {cl.ai ? <Text style={[st.badge, { position: "absolute", left: 3, top: 3, backgroundColor: c.sky, color: c.ink }]}>AI</Text> : null}
        </Drag>
      ))}
    </View>
  );
}

/* ---------- 面板 ---------- */

type Api = {
  updClip: (id: string, patch: Partial<Clip>) => void;
  edit: (fn: (x: Project) => Project) => void;
  setP: (fn: (x: Project) => Project) => void;
  toast: (t: string) => void;
  spend: (n: number) => boolean;
  genGaps: (g: Gap[]) => void;
  analyze: () => void;
  setPanel: (x: Panel) => void;
  selectCap: (id: string | null) => void;
};

function PanelArea({ panel, p, sel, t, credits, junction, capSel, onDone, api }: { panel: Panel; p: Project; sel?: Clip; t: number; credits: number; junction: string | null; capSel: string | null; onDone: () => void; api: Api }) {
  const applyAll = (fn: () => void) => (
    <Pressable onPress={fn} hitSlop={8} accessibilityRole="button">
      <Text style={[gz.display.label, { color: c.white, marginRight: 12 }]}>Apply to all</Text>
    </Pressable>
  );
  switch (panel) {
    case "speed":
      return (
        <PanelHead title="Speed" onDone={onDone}>
          <View style={st.chipRow}>
            {[0.5, 1, 1.5, 2, 3].map((v) => (
              <Choice key={v} label={`${v}×`} on={sel?.speed === v} onPress={() => sel && api.updClip(sel.id, { speed: v })} />
            ))}
          </View>
          <Text style={[gz.body.caption, { color: c.text3, paddingHorizontal: 16 }]}>Clip length updates on the timeline. Voices keep their pitch.</Text>
        </PanelHead>
      );
    case "volume":
      return (
        <PanelHead title="Volume" onDone={onDone}>
          <View style={st.chipRow}>
            {[0, 50, 100, 150, 200].map((v) => (
              <Choice key={v} label={v === 0 ? "Mute" : `${v}%`} on={sel?.vol === v} onPress={() => sel && api.updClip(sel.id, { vol: v })} />
            ))}
          </View>
        </PanelHead>
      );
    case "filters":
      return (
        <PanelHead title="Filters" onDone={onDone} right={applyAll(() => api.edit((x) => ({ ...x, clips: x.clips.map((cl) => ({ ...cl, filter: sel?.filter })) })))}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 8 }}>
            {FILTERS.map((f) => {
              const on = (sel?.filter ?? "none") === f.id;
              return (
                <Pressable key={f.id} onPress={() => sel && api.updClip(sel.id, { filter: f.id })} style={{ alignItems: "center", gap: 6 }} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={f.label}>
                  <View style={[st.filterThumb, on && st.thumbOn]}>
                    <Image source={{ uri: poster(sel?.postId ?? "poodle") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: f.tint }]} />
                  </View>
                  <Text style={[gz.display.tiny, { color: on ? c.white : c.text3 }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </PanelHead>
      );
    case "transition": {
      const cur = junction ? p.trans[junction] ?? "none" : "none";
      const set = (id: string) => junction && api.edit((x) => ({ ...x, trans: { ...x.trans, [junction]: id } }));
      return (
        <PanelHead title="Transition" onDone={onDone} right={applyAll(() => api.edit((x) => ({ ...x, trans: Object.fromEntries(x.clips.slice(0, -1).map((cl) => [cl.id, cur])) })))}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 8 }}>
            {TRANSITIONS.map((tr) => (
              <Pressable key={tr.id} onPress={() => set(tr.id)} style={{ alignItems: "center", gap: 6 }} accessibilityRole="radio" accessibilityState={{ checked: cur === tr.id }} accessibilityLabel={tr.label}>
                <View style={[st.transThumb, cur === tr.id && st.thumbOn]}>
                  <Icon name={tr.icon} size={20} color={c.white} strokeWidth={2.2} />
                </View>
                <Text style={[gz.display.tiny, { color: cur === tr.id ? c.white : c.text3 }]}>{tr.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                if (!api.spend(AI_TRANSITION_COST)) return;
                set("ai");
                api.toast("Making an AI transition…");
              }}
              style={{ alignItems: "center", gap: 6 }}
              accessibilityRole="radio"
              accessibilityState={{ checked: cur === "ai" }}
              accessibilityLabel="AI morph"
            >
              <View style={[st.transThumb, { backgroundColor: c.sky }, cur === "ai" && st.thumbOn]}>
                <Icon name="wand-sparkles" size={20} color={c.ink} strokeWidth={2.4} />
              </View>
              <Text style={[gz.display.tiny, { color: c.sky }]}>AI morph · {AI_TRANSITION_COST}</Text>
            </Pressable>
          </ScrollView>
          <Text style={[gz.body.caption, { color: c.text3, paddingHorizontal: 16 }]}>AI morph turns the end of one clip into the start of the next.</Text>
        </PanelHead>
      );
    }
    case "broll":
      return (
        <BrollPanel
          p={p}
          credits={credits}
          onAnalyze={api.analyze}
          onToggle={(id) => api.setP((x) => ({ ...x, gaps: x.gaps.map((g) => (g.id === id ? { ...g, picked: !g.picked } : g)) }))}
          onPrompt={(id, prompt) => api.setP((x) => ({ ...x, gaps: x.gaps.map((g) => (g.id === id ? { ...g, prompt, preview: "none" } : g)) }))}
          onPreview={(id) => api.setP((x) => ({ ...x, gaps: x.gaps.map((g) => (g.id === id ? { ...g, preview: "loading" } : g)) }))}
          onGenerate={api.genGaps}
          onDone={onDone}
        />
      );
    case "captions":
      return (
        <CaptionsPanel
          caps={p.caps}
          onLang={(lang) => api.setP((x) => ({ ...x, caps: { ...x.caps, lang } }))}
          onBilingual={() => api.edit((x) => ({ ...x, caps: { ...x.caps, bilingual: !x.caps.bilingual } }))}
          onAuto={() => api.edit((x) => ({ ...x, caps: { ...x.caps, status: "making", p: 0.1 } }))}
          onStyle={(id) => api.edit((x) => ({ ...x, caps: { ...x.caps, style: id } }))}
          onEdit={() => api.setPanel("captionsEdit")}
          onText={() => api.setPanel("text")}
          onDone={onDone}
        />
      );
    case "captionsEdit":
      return (
        <PanelHead title="Edit captions" onDone={onDone}>
          {p.caps.lines.map((l) => {
            const here = t >= l.t0 && t < l.t1;
            const on = capSel === l.id;
            const nudge = (k: "t0" | "t1", by: number) => api.edit((x) => ({ ...x, caps: { ...x.caps, lines: x.caps.lines.map((y) => (y.id !== l.id ? y : k === "t0" ? { ...y, t0: clamp(Math.round((y.t0 + by) * 10) / 10, 0, y.t1 - 0.3) } : { ...y, t1: Math.max(y.t0 + 0.3, Math.round((y.t1 + by) * 10) / 10) })) } }));
            return (
              <View key={l.id} style={on ? { backgroundColor: c.raised } : undefined}>
                <View style={st.lineRow}>
                  <Pressable onPress={() => api.selectCap(on ? null : l.id)} accessibilityRole="button" accessibilityLabel="Adjust timing" hitSlop={6} style={[st.timeChip, on && { backgroundColor: c.white }]}>
                    <Text style={[gz.body.micro, { color: on ? c.ink : here ? c.white : c.text2, fontVariant: ["tabular-nums"] }]}>{fmtT(l.t0)}</Text>
                  </Pressable>
                  <TextInput value={l.text} onChangeText={(v) => api.setP((x) => ({ ...x, caps: { ...x.caps, lines: x.caps.lines.map((y) => (y.id === l.id ? { ...y, text: v } : y)) } }))} style={[gz.body.body, { flex: 1, color: c.white, outlineStyle: "none" } as object]} accessibilityLabel={`Caption at ${fmtT(l.t0)}`} />
                  <Pressable
                    onPress={() => {
                      if (!here || t - l.t0 < 0.4 || l.t1 - t < 0.4) return api.toast("Move the playhead inside this caption to split it");
                      const words = l.text.split(" ");
                      const k = Math.max(1, Math.round((words.length * (t - l.t0)) / (l.t1 - l.t0)));
                      api.edit((x) => ({ ...x, caps: { ...x.caps, lines: x.caps.lines.flatMap((y) => (y.id !== l.id ? [y] : [{ ...y, t1: t, text: words.slice(0, k).join(" ") }, { ...y, id: y.id + "s", t0: t, text: words.slice(k).join(" ") || "…" }])) } }));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Split caption"
                    hitSlop={6}
                    style={st.lineBtn}
                  >
                    <Icon name="scissors" size={15} color={c.text2} strokeWidth={2.2} />
                  </Pressable>
                  <Pressable onPress={() => api.edit((x) => ({ ...x, caps: { ...x.caps, lines: x.caps.lines.filter((y) => y.id !== l.id) } }))} accessibilityRole="button" accessibilityLabel="Delete caption" hitSlop={6} style={st.lineBtn}>
                    <Icon name="trash" size={15} color={c.text2} strokeWidth={2.2} />
                  </Pressable>
                </View>
                {/* 调时间(审核 #14):±0.1 秒微调;时间线上选中的字幕块两头也能拖 */}
                {on ? (
                  <View style={st.nudgeRow}>
                    {(["t0", "t1"] as const).map((k) => (
                      <View key={k} style={st.nudgeGroup}>
                        <Text style={[gz.body.micro, { color: c.text2, width: 62 }]}>
                          {k === "t0" ? "Start" : "End"} {(k === "t0" ? l.t0 : l.t1).toFixed(1)}s
                        </Text>
                        <Pressable onPress={() => nudge(k, -0.1)} accessibilityRole="button" accessibilityLabel={`${k === "t0" ? "Start" : "End"} 0.1 seconds earlier`} style={st.nudgeBtn}>
                          <Text style={st.zoomText}>−</Text>
                        </Pressable>
                        <Pressable onPress={() => nudge(k, 0.1)} accessibilityRole="button" accessibilityLabel={`${k === "t0" ? "Start" : "End"} 0.1 seconds later`} style={st.nudgeBtn}>
                          <Text style={st.zoomText}>+</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </PanelHead>
      );
    case "text":
      return <TextPanel texts={p.texts} onAdd={(text) => api.edit((x) => ({ ...x, texts: [...x.texts, { id: "x" + (x.texts.length + 1), at: t, dur: 3, text }] }))} onDelete={(id) => api.edit((x) => ({ ...x, texts: x.texts.filter((y) => y.id !== id) }))} onDone={onDone} />;
    case "music":
      return (
        <PanelHead title="Music" onDone={onDone}>
          {TRACKS.map((tr) => {
            const on = p.music === tr.id;
            return (
              <Pressable key={tr.id} onPress={() => api.edit((x) => ({ ...x, music: on ? null : tr.id }))} style={st.trackRow} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                <View style={[st.trackIcon, on && { backgroundColor: c.butter }]}>
                  <Icon name="music" size={16} color={on ? c.ink : c.white} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[gz.body.strong, { color: c.white }]}>{tr.name}</Text>
                  {/* 版权(审核 #8) */}
                  <Text style={[gz.body.caption, { color: tr.safe ? c.text3 : c.butter }]}>
                    {tr.mood} · {tr.safe ? "Safe for TikTok & Reels" : "BuzzVideo only"}
                  </Text>
                </View>
                <Text style={[gz.display.label, { color: on ? c.butter : c.text2 }]}>{on ? "Added" : "Use"}</Text>
              </Pressable>
            );
          })}
        </PanelHead>
      );
    case "sfx":
      return (
        <PanelHead title="Sound FX" onDone={onDone}>
          <View style={[st.chipRow, { flexWrap: "wrap" }]}>
            {SFX.map((name) => (
              <Choice
                key={name}
                label={name}
                onPress={() => {
                  api.edit((x) => ({ ...x, audio: [...x.audio, { id: "a" + (x.audio.length + 1), kind: "sfx", at: t, dur: 1, name }] }));
                  api.toast(`Added “${name}” at ${fmtT(t)}`);
                }}
              />
            ))}
          </View>
        </PanelHead>
      );
    case "voice":
      return <VoicePanel onAdd={(dur) => api.edit((x) => ({ ...x, audio: [...x.audio, { id: "a" + (x.audio.length + 1), kind: "voice", at: t, dur, name: "Voiceover" }] }))} onDone={onDone} />;
    case "ratio":
      return (
        <PanelHead title="Ratio" onDone={onDone}>
          <View style={st.chipRow}>
            {(["9:16", "1:1", "16:9"] as Ratio[]).map((r) => (
              <Choice key={r} label={r === "9:16" ? "9:16 · TikTok" : r === "1:1" ? "1:1 · Post" : "16:9 · YouTube"} on={p.ratio === r} onPress={() => api.edit((x) => ({ ...x, ratio: r }))} />
            ))}
          </View>
        </PanelHead>
      );
    default:
      return null;
  }
}

/** AI 补镜头(同 Hybrid Reel):导入后已免费找好缺口 → 每个缺口可先看一帧预览 → 勾选的一起生成，插进主轨 */
function BrollPanel({ p, credits, onAnalyze, onToggle, onPrompt, onPreview, onGenerate, onDone }: { p: Project; credits: number; onAnalyze: () => void; onToggle: (id: string) => void; onPrompt: (id: string, prompt: string) => void; onPreview: (id: string) => void; onGenerate: (g: Gap[]) => void; onDone: () => void }) {
  const realCount = p.clips.filter((x) => !x.ai).length;
  const done = (g: Gap) => p.clips.some((x) => x.id === "ai-" + g.id);
  const picked = p.gaps.filter((g) => g.picked && !done(g));
  return (
    <PanelHead title="AI B-roll" onDone={onDone} right={<Text style={[gz.body.micro, { color: c.text2, marginRight: 10 }]}>{credits} credits</Text>}>
      {p.analyzed === "no" ? (
        <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 6 }}>
          <Text style={[gz.body.body, { color: c.text2 }]}>We&apos;ll watch your {realCount} clips, find the shots your story is missing, and make them with AI. Each shot is about 4s and {AI_SHOT_COST} credits.</Text>
          <GZButton label="Find missing shots" icon="wand-sparkles" onPress={onAnalyze} />
        </View>
      ) : p.analyzed === "running" ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 14, alignItems: "center", gap: 6 }}>
          <Text style={[gz.display.head, { color: c.white }]}>Watching your clips…</Text>
          <Text style={[gz.body.caption, { color: c.text3 }]}>Checking the opening, cuts and ending. Free.</Text>
        </View>
      ) : (
        <>
          <Text style={[gz.body.caption, { color: c.text3, paddingHorizontal: 16, marginBottom: 6 }]}>We found {p.gaps.length} shots that would help. Preview a frame for free before you spend credits.</Text>
          {p.gaps.map((g) => (
            <View key={g.id} style={st.gapRow}>
              <Pressable onPress={() => !done(g) && onToggle(g.id)} accessibilityRole="checkbox" accessibilityState={{ checked: g.picked || done(g), disabled: done(g) }} accessibilityLabel={`${g.role} shot`} style={[st.gapCheck, (g.picked || done(g)) && { backgroundColor: c.sky, borderColor: c.sky }]}>
                {g.picked || done(g) ? <Icon name="check" size={13} color={c.ink} strokeWidth={3.2} /> : null}
              </Pressable>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[gz.display.label, { color: c.sky }]}>
                  {g.role} · {g.before === 0 ? "at the start" : g.before >= realCount ? "at the end" : `after clip ${g.before}`}
                  {done(g) ? <Text style={{ color: c.text3 }}> · added</Text> : null}
                </Text>
                <Text style={[gz.body.caption, { color: c.text2 }]}>{g.why}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <TextInput value={g.prompt} onChangeText={(v) => onPrompt(g.id, v)} multiline editable={!done(g)} style={[gz.body.caption, st.gapPrompt, { outlineStyle: "none" } as object]} accessibilityLabel={`${g.role} shot description`} />
                  {/* 先看一帧(审核 #6):免费，确认再花积分 */}
                  {g.preview === "ready" ? (
                    <Image source={{ uri: poster(g.postId) }} style={st.gapThumb} accessibilityLabel="Preview frame" />
                  ) : (
                    <Pressable onPress={() => !done(g) && g.preview === "none" && onPreview(g.id)} style={[st.gapThumb, st.gapThumbEmpty]} accessibilityRole="button" accessibilityLabel="Preview a frame for free">
                      <Icon name={g.preview === "loading" ? "loader" : "image"} size={16} color={c.sky} strokeWidth={2.4} />
                      <Text style={[gz.display.tiny, { color: c.sky, fontSize: 10, textAlign: "center" }]}>{g.preview === "loading" ? "…" : "Preview"}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}
          <View style={{ paddingHorizontal: 16, paddingTop: 4, gap: 6 }}>
            <GZButton label={picked.length ? `Make ${picked.length} shot${picked.length > 1 ? "s" : ""} · ${picked.length * AI_SHOT_COST} credits` : "All shots added"} disabled={!picked.length} onPress={() => onGenerate(picked)} />
            <Text style={[gz.body.micro, { color: c.text3, textAlign: "center", fontWeight: "400" }]}>Each AI shot comes with one free remake.</Text>
          </View>
        </>
      )}
    </PanelHead>
  );
}

function CaptionsPanel({ caps, onLang, onBilingual, onAuto, onStyle, onEdit, onText, onDone }: { caps: Caps; onLang: (l: string) => void; onBilingual: () => void; onAuto: () => void; onStyle: (id: string) => void; onEdit: () => void; onText: () => void; onDone: () => void }) {
  const bilingualRow = (
    <Pressable onPress={onBilingual} style={st.cleanRow} accessibilityRole="switch" accessibilityState={{ checked: caps.bilingual }}>
      <View style={{ flex: 1 }}>
        <Text style={[gz.body.strong, { color: c.white }]}>Add Spanish translation</Text>
        <Text style={[gz.body.caption, { color: c.text3 }]}>A second, smaller line under each caption.</Text>
      </View>
      <View style={[st.switch, caps.bilingual && { backgroundColor: c.white }]}>
        <View style={[st.knob, caps.bilingual && { alignSelf: "flex-end", backgroundColor: c.ink }]} />
      </View>
    </Pressable>
  );
  return (
    <PanelHead title="Auto captions" onDone={onDone} right={<Text style={[gz.body.micro, { color: c.lime, marginRight: 10 }]}>Free</Text>}>
      {caps.status === "none" ? (
        <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 6 }}>
          {/* 语言(审核 #9) */}
          <Text style={[gz.display.label, { color: c.text2 }]}>Spoken language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LANGS.map((l) => (
              <Choice key={l.id} label={l.label} on={caps.lang === l.id} onPress={() => onLang(l.id)} />
            ))}
          </ScrollView>
          {bilingualRow}
          <GZButton label="Make captions" icon="captions" onPress={onAuto} />
        </View>
      ) : caps.status === "making" ? (
        <View style={{ paddingHorizontal: 16, gap: 10, paddingVertical: 12, alignItems: "center" }}>
          <Text style={[gz.display.title, { color: c.white }]}>Listening… {Math.round(caps.p * 100)}%</Text>
          <View style={[st.expTrack, { width: "100%" }]}>
            <View style={[st.expFill, { width: `${Math.round(caps.p * 100)}%`, backgroundColor: c.white }]} />
          </View>
        </View>
      ) : caps.status === "nospeech" ? (
        <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 6 }}>
          <Text style={[gz.display.head, { color: c.white }]}>No speech found</Text>
          <Text style={[gz.body.body, { color: c.text2 }]}>We didn&apos;t hear anyone talking. Add your own text instead.</Text>
          <GZButton label="Add text" icon="type" variant="white" onPress={onText} />
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
            {CAP_STYLES.map((cs) => {
              const on = caps.style === cs.id;
              return (
                <Pressable key={cs.id} onPress={() => onStyle(cs.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={cs.label} style={[st.styleCard, on && st.thumbOn]}>
                  <View style={{ transform: [{ scale: 0.62 }] }}>{cs.render("Hey there")}</View>
                  <Text style={[gz.display.tiny, { color: on ? c.white : c.text3, fontSize: 10 }]}>{cs.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            {bilingualRow}
            <GZButton label={`Edit ${caps.lines.length} captions`} icon="scissors" variant="dark" size="m" block onPress={onEdit} />
          </View>
        </>
      )}
    </PanelHead>
  );
}

function TextPanel({ texts, onAdd, onDelete, onDone }: { texts: TextItem[]; onAdd: (t: string) => void; onDelete: (id: string) => void; onDone: () => void }) {
  const [text, setText] = useState("");
  return (
    <PanelHead title="Add text" onDone={onDone}>
      <View style={st.inputRow}>
        <TextInput value={text} onChangeText={setText} placeholder="Type something" placeholderTextColor={c.text3} style={[gz.body.body, { flex: 1, color: c.white, outlineStyle: "none" } as object]} accessibilityLabel="Text" />
        <GZButton
          label="Add"
          size="s"
          disabled={!text.trim()}
          onPress={() => {
            onAdd(text.trim());
            setText("");
          }}
        />
      </View>
      {texts.map((x) => (
        <View key={x.id} style={st.lineRow}>
          <Text style={[gz.body.micro, { color: c.text3, width: 44 }]}>{fmtT(x.at)}</Text>
          <Text style={[gz.body.body, { color: c.white, flex: 1 }]}>{x.text}</Text>
          <Pressable onPress={() => onDelete(x.id)} accessibilityRole="button" accessibilityLabel="Delete text" hitSlop={8} style={st.lineBtn}>
            <Icon name="trash" size={15} color={c.text3} strokeWidth={2.2} />
          </Pressable>
        </View>
      ))}
    </PanelHead>
  );
}

function VoicePanel({ onAdd, onDone }: { onAdd: (dur: number) => void; onDone: () => void }) {
  const [rec, setRec] = useState(0);
  useEffect(() => {
    if (!rec) return;
    const id = setInterval(() => setRec((x) => x + 0.5), 500);
    return () => clearInterval(id);
  }, [rec]);
  return (
    <PanelHead title="Voiceover" onDone={onDone}>
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <Pressable
          onPress={() => {
            if (rec) {
              onAdd(Math.max(1, rec));
              setRec(0);
            } else setRec(0.01);
          }}
          accessibilityRole="button"
          accessibilityLabel={rec ? "Stop recording" : "Start recording"}
          style={[st.recBtn, rec ? { backgroundColor: c.red } : null]}
        >
          <Icon name={rec ? "square" : "mic"} size={24} color={c.white} strokeWidth={2.4} />
        </Pressable>
        <Text style={[gz.body.caption, { color: c.text2 }]}>{rec ? `Recording ${rec.toFixed(1)}s · tap to stop` : "Tap to record at the playhead"}</Text>
      </View>
    </PanelHead>
  );
}

/* ---------- 小件 ---------- */

/** 工具栏：横滑，右边一层渐隐暗示还有(审核 #15) */
function ToolScroll({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.toolbar}>
        {children}
      </ScrollView>
      <View pointerEvents="none" style={[st.fade, { backgroundImage: `linear-gradient(to right, rgba(0,0,0,0), ${c.page})` } as object]} />
    </View>
  );
}

function Tool({ icon, label, onPress, badge, danger }: { icon: IconName; label: string; onPress: () => void; badge?: string; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [st.tool, pressed && { transform: [{ scale: 0.94 }] }]}>
      <View>
        <Icon name={icon} size={22} color={danger ? c.red : c.white} strokeWidth={2} />
        {badge ? (
          <View style={{ position: "absolute", top: -9, left: 12 }}>
            <GZSticker label={badge} color={badge === "FREE" ? "lime" : /^\d+$/.test(badge) ? "orange" : "sky"} size="s" rotate={6} />
          </View>
        ) : null}
      </View>
      <Text style={[gz.body.micro, { color: danger ? c.red : c.text, fontWeight: "500" }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Choice({ label, on, onPress, locked }: { label: string; on?: boolean; onPress: () => void; locked?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[st.choice, on && st.choiceOn]} accessibilityRole="radio" accessibilityState={{ checked: !!on }} accessibilityLabel={label}>
      <Text style={[gz.display.label, { color: on ? c.ink : c.white }]}>{label}</Text>
      {locked ? (
        <View style={{ position: "absolute", top: -8, right: -6 }}>
          <GZSticker label="PAID" color="lilac" size="s" rotate={4} />
        </View>
      ) : null}
    </Pressable>
  );
}

function PanelHead({ title, onDone, children, right }: { title: string; onDone: () => void; children: ReactNode; right?: ReactNode }) {
  return (
    <View>
      <View style={st.panelHead}>
        <Text style={[gz.display.head, { color: c.white, flex: 1 }]}>{title}</Text>
        {right}
        <Pressable onPress={onDone} accessibilityRole="button" accessibilityLabel="Done" hitSlop={8} style={st.doneBtn}>
          <Icon name="check" size={18} color={c.ink} strokeWidth={3} />
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 170 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

function EmptyPreview({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ height: 260, width: "90%", borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: c.surface }}>
      <Text style={[gz.body.body, { color: c.text2 }]}>Add clips to start editing</Text>
      <GZButton label="Add clips" icon="plus" size="m" onPress={onAdd} />
    </View>
  );
}

const cap = StyleSheet.create({
  base: { fontFamily: gz.display.head.fontFamily, fontWeight: "800", fontSize: 17, lineHeight: 22, color: c.white, textAlign: "center" },
  outline: { textShadowColor: "#000", textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } },
  box: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
});

const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  resChip: { flexDirection: "row", alignItems: "center", gap: 2, height: 30, paddingHorizontal: 10, borderRadius: 8, backgroundColor: c.raised },
  topBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  preview: { borderRadius: 12, overflow: "hidden", backgroundColor: c.surface },
  aiTag: { position: "absolute", top: 10, left: 10 },
  textOverlay: { position: "absolute", left: 12, right: 12, top: "18%", alignItems: "center" },
  capOverlay: { position: "absolute", left: 12, right: 12, bottom: "14%", alignItems: "center" },
  transport: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 8, paddingBottom: 2 },
  play: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
  fullBar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 30, backgroundColor: "rgba(0,0,0,0.4)" },
  tickWrap: { position: "absolute", top: 0, height: 16 },
  tick: { fontSize: 10, color: c.text3, fontVariant: ["tabular-nums"] },
  dot: { position: "absolute", top: 6, width: 3, height: 3, borderRadius: 2, backgroundColor: c.text3 },
  gapMark: { position: "absolute", top: 0, height: 18, paddingHorizontal: 7, borderRadius: 9, backgroundColor: c.sky, justifyContent: "center" },
  leadCol: { position: "absolute", right: "100%", marginRight: 10, flexDirection: "row", gap: 8, alignItems: "center" },
  lead: { width: 42, alignItems: "center", gap: 2 },
  leadText: { fontSize: 10, lineHeight: 12, color: c.text2, textAlign: "center" },
  cover: { width: 46, height: 46, borderRadius: 8, overflow: "hidden", alignItems: "center", justifyContent: "flex-end", borderWidth: 1.5, borderColor: c.white },
  coverText: { width: "100%", textAlign: "center", fontSize: 10, fontWeight: "700", color: c.white, backgroundColor: "rgba(0,0,0,0.55)", paddingVertical: 1 },
  clip: { height: 52, borderRadius: 6, backgroundColor: c.raised },
  clipOn: { borderWidth: 2.5, borderColor: c.white },
  clipBadges: { position: "absolute", left: 3, top: 3, flexDirection: "row", gap: 3, alignItems: "center" },
  badge: { fontSize: 9, fontWeight: "800", color: c.white, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, overflow: "hidden" },
  clipDur: { position: "absolute", right: 4, bottom: 3, fontSize: 11, fontWeight: "800", color: c.white, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  handle: { position: "absolute", top: -2, bottom: -2, width: 14, borderRadius: 4, backgroundColor: c.white, alignItems: "center", justifyContent: "center", zIndex: 3, cursor: "ew-resize" } as object,
  handleGrip: { width: 2, height: 16, borderRadius: 1, backgroundColor: c.ink },
  capHandle: { position: "absolute", top: -2, bottom: -2, width: 10, borderRadius: 3, backgroundColor: c.white, zIndex: 3, cursor: "ew-resize" } as object,
  junction: { width: 20, height: 20, borderRadius: 6, backgroundColor: c.white, alignItems: "center", justifyContent: "center", marginHorizontal: -10, zIndex: 2 },
  addClip: { width: 38, height: 38, borderRadius: 8, backgroundColor: c.white, alignItems: "center", justifyContent: "center", marginLeft: 14 },
  reTile: { width: 52, height: 52, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: c.white, backgroundColor: c.raised, cursor: "grab" } as object,
  lane: { height: 26, justifyContent: "center", marginTop: 4 },
  addLane: { position: "absolute", left: 0, height: 22, paddingHorizontal: 10, borderRadius: 6, backgroundColor: c.raised, flexDirection: "row", alignItems: "center", gap: 4 },
  // 字幕块：白底黑字(审核 #16,青柠留给「朋友 / 新的」);选中时外圈加一道白框，两头出把手
  capBlock: { position: "absolute", height: 20, borderRadius: 5, backgroundColor: c.white, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, overflow: "hidden" },
  capBlockOn: { overflow: "visible", outlineWidth: 2, outlineColor: c.orange, outlineStyle: "solid", outlineOffset: 1 } as object,
  textBlock: { position: "absolute", height: 20, borderRadius: 5, backgroundColor: c.raised, borderWidth: 1, borderColor: c.white, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, overflow: "hidden" },
  musicBlock: { position: "absolute", left: 0, height: 22, borderRadius: 5, backgroundColor: c.butter, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, overflow: "hidden", opacity: 0.85 },
  sfxBlock: { position: "absolute", top: 2, height: 20, borderRadius: 5, backgroundColor: c.pink, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 4, overflow: "hidden", zIndex: 2 },
  wave: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 6 },
  playhead: { position: "absolute", top: 4, bottom: 0, width: 2, borderRadius: 1, backgroundColor: c.white },
  zoomBox: { position: "absolute", right: 10, bottom: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  zoomBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" },
  zoomText: { color: c.white, fontSize: 18, lineHeight: 20, fontWeight: "700" },
  bottom: { backgroundColor: c.page, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 10 },
  toolbar: { gap: 2, paddingHorizontal: 8, paddingRight: 28, alignItems: "center" },
  fade: { position: "absolute", right: 0, top: 0, bottom: 0, width: 32 },
  tool: { alignItems: "center", gap: 6, minWidth: 60, paddingHorizontal: 8, paddingVertical: 6 },
  backBtn: { flexDirection: "row", width: 44, height: 56, alignItems: "center", justifyContent: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.line, marginLeft: 4 },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  choice: { minWidth: 56, height: 40, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" },
  choiceOn: { backgroundColor: c.white },
  filterThumb: { width: 60, height: 60, borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  transThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: c.raised, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  thumbOn: { borderColor: c.white },
  panelHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 },
  doneBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
  gapRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  gapCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: c.text3, alignItems: "center", justifyContent: "center", marginTop: 1 },
  gapPrompt: { flex: 1, color: c.white, backgroundColor: c.raised, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  gapThumb: { width: 48, height: 64, borderRadius: 8, backgroundColor: c.raised },
  gapThumbEmpty: { alignItems: "center", justifyContent: "center", gap: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 4, paddingLeft: 14, paddingRight: 6, height: 44, borderRadius: 14, backgroundColor: c.raised },
  styleCard: { width: 84, height: 70, borderRadius: 12, backgroundColor: c.raised, alignItems: "center", justifyContent: "center", gap: 2, borderWidth: 2, borderColor: "transparent" },
  lineRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
  lineBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  timeChip: { height: 24, paddingHorizontal: 6, borderRadius: 6, backgroundColor: c.raised, justifyContent: "center" },
  nudgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, paddingHorizontal: 16, paddingBottom: 8 },
  nudgeGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  nudgeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.black, alignItems: "center", justifyContent: "center" },
  trackRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  trackIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" },
  recBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.orange, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: c.white },
  cleanRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, backgroundColor: c.raised },
  switch: { width: 46, height: 28, borderRadius: 14, backgroundColor: c.line, padding: 3, justifyContent: "center" },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.white },
  autoChip: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: c.raised },
  exporting: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32, zIndex: 30 },
  expTrack: { width: "80%", height: 8, borderRadius: 4, backgroundColor: c.raised, overflow: "hidden", marginVertical: 6 },
  expFill: { height: 8, borderRadius: 4, backgroundColor: c.orange },
  doneTop: { paddingHorizontal: 12, paddingTop: 4 },
  donePhoto: { width: 200, height: 356, borderRadius: 18, overflow: "hidden", borderWidth: gz.cut, borderColor: c.white, backgroundColor: c.surface },
  watermark: { position: "absolute", right: 8, bottom: 8, fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.85)" },
  warnRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 12, backgroundColor: c.raised },
});
