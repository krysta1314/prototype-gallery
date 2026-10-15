/* 剪辑器评审旅程(第 16–36 步):工程 = RELLET 录制分镜经 buildProject 搭出(和开发版画布同一函数),再按步骤改状态;
   界面状态通过 Workspace 的 initialUi / autorun 打开。不新造剪辑器里没有的界面。 */

import { arrange, buildProject, layoutClips, resolveOverlaps, type Project } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import type { InitialUi, Stored } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/workspace";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { shapeOutline } from "../app/fixture/api";
import type { FixtureData } from "../app/fixture/types";
import { applyAnswers, buildQuestions } from "../app/logic/questions";
import { DEMO_REEL } from "../app/reel";
import type { ReviewOpts } from "./journeys";

export type EditorStepId =
  | "canvas" | "shotsGenerating" | "shotsReady" | "nodeSettings" | "timeline" | "cards" | "subtitles"
  | "media" | "voice" | "music" | "sfx" | "cover" | "exportGate" | "exporting"
  | "shotFailed" | "voiceFailed" | "voiceTooLong" | "subPending" | "subFailed" | "noSpeech" | "coverNoFootage";

export const EDITOR_JOURNEYS: { id: EditorStepId; group: string; title: string }[] = [
  { id: "canvas", group: "画布", title: "进画布" },
  { id: "shotsGenerating", group: "画布", title: "补拍生成中" },
  { id: "shotsReady", group: "画布", title: "补拍完成" },
  { id: "nodeSettings", group: "画布", title: "节点设置" },
  { id: "timeline", group: "全屏剪辑", title: "时间线与镜头" },
  { id: "cards", group: "全屏剪辑", title: "字卡" },
  { id: "subtitles", group: "全屏剪辑", title: "字幕" },
  { id: "media", group: "全屏剪辑", title: "替换素材" },
  { id: "voice", group: "声音", title: "配音" },
  { id: "music", group: "声音", title: "音乐" },
  { id: "sfx", group: "声音", title: "音效" },
  { id: "cover", group: "封面与导出", title: "封面" },
  { id: "exportGate", group: "封面与导出", title: "导出拦截" },
  { id: "exporting", group: "封面与导出", title: "导出中到完成" },
  { id: "shotFailed", group: "剪辑器异常", title: "补拍失败" },
  { id: "voiceFailed", group: "剪辑器异常", title: "配音部分失败" },
  { id: "voiceTooLong", group: "剪辑器异常", title: "旁白超出镜头" },
  { id: "subPending", group: "剪辑器异常", title: "字幕:补拍未生成" },
  { id: "subFailed", group: "剪辑器异常", title: "字幕识别部分失败" },
  { id: "noSpeech", group: "剪辑器异常", title: "没识别到语音" },
  { id: "coverNoFootage", group: "剪辑器异常", title: "封面无可用画面" },
];

/** 评审里补拍的「生成结果」:轮流用本地的 RELLET 成片与预览,不依赖外链 */
export const SHOT_VIDEOS = [DEMO_REEL.src, "/prototypes/hybrid-reel-agent/fixture/IMG_3716.mp4", "/prototypes/hybrid-reel-agent/fixture/saveclip.mp4"];

/** 评审「接口」在这一步要模拟的异常:识别 / 配音接口失败,或识别结果为空(见 fixtureFetch.ts、ReviewApp EditorStep) */
export type EditorFixture = { failStt?: boolean; failTts?: boolean; noSpeech?: boolean };

export type EditorPreset = { handoff: Stored; project: Project; initialUi: InitialUi; autorun?: "generateAll" | "export"; fixture?: EditorFixture };

/** 补拍轮询超时的报错,与 canvas/workspace.tsx pollVideo 抛出的文案逐字一致 */
export const SHOT_TIMEOUT_ERROR = "This is taking much longer than usual, so we stopped waiting. Your credits are back — try again.";
/** 评审演示接口的配音 / 识别报错(fixtureFetch.ts failTts / failStt 返回的 error) */
export const SPEECH_BUSY_ERROR = "The speech service is busy right now (simulated) — try again.";

function readyShots(p: Project): Project {
  let k = 0;
  return {
    ...p,
    assets: p.assets.map((a) =>
      a.origin === "ai" && a.kind === "video" ? { ...a, status: "ready", progress: undefined, url: SHOT_VIDEOS[k++ % SHOT_VIDEOS.length], takes: 1 } : a,
    ),
  };
}

export function buildEditorPreset(id: EditorStepId, opts: ReviewOpts, data: FixtureData, outline?: Outline): EditorPreset {
  const set = data[opts.lang];
  const fx = { lang: opts.lang, voiceover: opts.voiceover, aiShots: opts.aiShots, failAnalyze: false, failOutline: false };
  const o = outline ?? (opts.aiShots === "recorded" && opts.voiceover ? set.outline : shapeOutline(set.outline, set, fx));
  /* 分镜是按提问卡答案排的,所以交给编辑器的 brief 也要是答完之后的(与 journeys.ts plan 步一致) */
  const questions = buildQuestions(set.brief.assumed, set.brief.brief, set.profiles, opts.lang);
  const answers = Object.fromEntries(questions.map((q) => [q.id, set.answers[q.id] ?? { picked: q.defaults }]));
  const brief = applyAnswers(set.brief.brief, questions, answers, opts.lang);
  const handoff: Stored = {
    brief,
    profiles: set.profiles,
    outline: o,
    /* key 不在 IndexedDB 里,只在硬刷新画布时才用到;评审不刷新画布 */
    media: set.profiles.map((p, i) => ({ key: `fixture:${i}`, url: p.objectUrl ?? "" })),
  };
  const base = arrange(buildProject(handoff));
  /* 补拍都还没生成的工程:字幕「补拍未生成」提示、封面「这一刻没有画面」都要靠它 */
  const waiting = id === "canvas" || id === "shotsGenerating" || id === "exportGate" || id === "subPending" || id === "coverNoFootage";
  let project = waiting ? base : readyShots(base);

  /* 补拍失败(workspace failVideo):退回未生成、积分退回(spentCredits 不变)、error 存下来,Video Settings 里出红框。
     其余补拍已生成;只有第一个失败 */
  const baseAi = base.assets.find((a) => a.origin === "ai" && a.kind === "video");
  if (id === "shotFailed" && baseAi) {
    project = { ...project, assets: project.assets.map((a) => (a.id === baseAi.id ? { ...baseAi, status: "idle", progress: undefined, error: SHOT_TIMEOUT_ERROR } : a)) };
  }
  /* 配音失败(workspace generateVoiceSegments):一句一个节点,所以真实形状是「1 of 1 lines failed: …」;
     失败的句子积分退回、没有音频,节点退回 idle */
  const baseVoice = (base.voice ?? [])[0];
  if (id === "voiceFailed" && baseVoice) {
    project = {
      ...project,
      assets: project.assets.map((a) => (a.id === baseVoice.assetId ? { ...a, status: "idle", progress: undefined, error: `1 of 1 lines failed: ${SPEECH_BUSY_ERROR}` } : a)),
    };
  }
  /* 旁白超出镜头(settings.tsx AudioSettings 的 over):这一句已生成(有 url),配音长度 > 镜头长度 + 0.1s。
     优先挑录音本身就比镜头长的那一句(和真实生成一样,len = 录音时长);都不超就用第一句,长度设成镜头 + 1 秒 */
  let longVoiceId: string | undefined;
  if (id === "voiceTooLong" && project.voice?.length) {
    const { segs } = layoutClips(project.clips);
    const rows = project.voice.map((v) => ({
      v,
      seg: segs.find((x) => x.clip.id === v.clipId),
      rec: set.voice.find((r) => r.text.trim() === v.text?.trim()),
    }));
    const hit = rows.find((r) => r.seg && r.rec && r.rec.durationSec > r.seg.len + 0.1) ?? rows[0];
    const url = hit.rec?.url ?? set.voice[0]?.url;
    const len = hit.rec && hit.seg && hit.rec.durationSec > hit.seg.len + 0.1 ? hit.rec.durationSec : (hit.seg?.len ?? hit.v.len) + 1;
    longVoiceId = hit.v.id;
    project = resolveOverlaps({
      ...project,
      voice: project.voice.map((v) => (v.id === hit.v.id ? { ...v, url, len, offset: undefined, srcLen: undefined } : v)),
      assets: project.assets.map((a) =>
        a.id === hit.v.assetId ? { ...a, status: "ready", progress: undefined, url, durationSec: len, takes: (a.takes ?? 0) + 1 } : a,
      ),
    });
  }

  const assetOf = (assetId: string | null) => project.assets.find((a) => a.id === assetId);
  const firstAi = project.assets.find((a) => a.origin === "ai" && a.kind === "video");
  /* 实拍片段:全屏剪辑里选中它,右侧出 Clip 设置(时长、原声、画面适配) */
  const uploadClips = project.clips.filter((c) => assetOf(c.assetId)?.origin === "upload");
  const firstVideoClip = uploadClips.find((c) => assetOf(c.assetId)?.kind === "video") ?? uploadClips[0];
  const firstCard = project.cards?.[0];
  const firstVoice = (project.voice ?? [])[0];
  const autoSub: InitialUi = { full: true, autoSubOpen: true };

  const ui: Record<EditorStepId, InitialUi> = {
    canvas: {},
    shotsGenerating: {},
    /* 剪辑器节点不是资产(Project.editor 只是位置),画布上它本来就在播整条预览,不需要选中 */
    shotsReady: {},
    nodeSettings: { settingsId: firstAi?.id ?? null },
    /* panel "clip" 与真实 openFull 带选中时一致;全屏里右侧面板跟着选中走 */
    timeline: { full: true, panel: "clip", selectedId: firstVideoClip?.id ?? null, selectedPart: "clip" },
    /* 全屏剪辑没有独立的 text 面板(panel "text" 不渲染);字卡设置要选中一张字卡才出(Text settings) */
    cards: { full: true, selectedId: firstCard?.id ?? null, selectedPart: "card" },
    subtitles: { full: true, autoSubOpen: true },
    /* 和右键片段「Replace」一致(clipMenu.onReplace):选中这段 + 打开左侧 Media 面板,右侧同时出 Clip 设置 */
    media: { full: true, panel: "media", selectedId: firstVideoClip?.id ?? null, selectedPart: "clip" },
    voice: { full: true, selectedId: firstVoice?.id ?? null, selectedPart: "voice" },
    music: { full: true, panel: "audio" },
    sfx: { full: true, panel: "sfx" },
    cover: { coverOpen: true },
    exportGate: { exportGate: true },
    exporting: {},
    shotFailed: { settingsId: baseAi?.id ?? null },
    /* 全屏剪辑里选中这句配音,右侧 Audio Settings 底部出红框 */
    voiceFailed: { full: true, selectedId: firstVoice?.id ?? null, selectedPart: "voice" },
    voiceTooLong: { full: true, selectedId: longVoiceId ?? null, selectedPart: "voice" },
    subPending: autoSub,
    subFailed: autoSub,
    noSpeech: autoSub,
    /* 封面弹窗没有「定位到某一秒」的入口(起点 = 已设封面那一帧或播放头),评审者要自己拖到补拍那一段 */
    coverNoFootage: { coverOpen: true },
  };
  const fixture: Partial<Record<EditorStepId, EditorFixture>> = {
    /* 再点 Generate Audio 也会失败,看到的还是同一个红框 */
    voiceFailed: { failTts: true },
    subFailed: { failStt: true },
    noSpeech: { noSpeech: true },
  };
  return {
    handoff: { ...handoff, project },
    project,
    initialUi: ui[id],
    autorun: id === "shotsGenerating" ? "generateAll" : id === "exporting" ? "export" : undefined,
    ...(fixture[id] ? { fixture: fixture[id] } : {}),
  };
}
