/* 剪辑器评审旅程(左栏「画布剪辑器」部分,单独从 1 编号:第 1 步进画布、第 2 步剪辑器引导,共 25 步;编号以 Inspector 按位置算出的为准):工程 = RELLET 录制分镜经 buildProject 搭出(和开发版画布同一函数),再按步骤改状态;
   界面状态通过 Workspace 的 initialUi / autorun 打开。不新造剪辑器里没有的界面。 */

import { activateEditor, arrange, buildProject, layoutClips, newEditorWith,  type Project } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import type { InitialUi, Stored } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/workspace";
import { SHOT_TIMEOUT_TEXT, canvasError } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/errors";
import type { Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { shapeOutline } from "../app/fixture/api";
import type { FixtureData } from "../app/fixture/types";
import { applyAnswers, buildQuestions } from "../app/logic/questions";
import { DEMO_REEL } from "../app/reel";
import type { ReviewOpts } from "./journeys";

/** 「积分不足」时的余额:比任何一次单独扣费都少(配音一句 5、AI 封面 3、补拍几十起),所以开关打开后剪辑器里任何生成都会弹
    「Not enough credits」。Agent 与剪辑器共用(放这里而不是 journeys.ts,免得两个文件互相 import 值) */
export const LOW_CREDITS = 2;

export type EditorStepId =
  | "editorGuide" | "canvas" | "shotsGenerating" | "shotsReady" | "nodeSettings" | "multiEditor" | "timeline" | "undoRedo" | "split" | "deleteClip" | "speed" | "cards" | "subtitles"
  | "media" | "fullScreen" | "voice" | "music" | "sfx" | "cover" | "exportGate" | "exporting"
  | "shotFailed" | "voiceFailed" | "noSpeech" | "coverNoFootage";

export const EDITOR_JOURNEYS: { id: EditorStepId; group: string; title: string }[] = [
  { id: "canvas", group: "画布", title: "进画布" },
  { id: "editorGuide", group: "画布", title: "剪辑器引导" },
  { id: "shotsGenerating", group: "画布", title: "素材生成中" },
  { id: "shotsReady", group: "画布", title: "补拍完成" },
  { id: "nodeSettings", group: "画布", title: "节点设置" },
  { id: "multiEditor", group: "画布", title: "多个剪辑器" },
  { id: "timeline", group: "剪辑", title: "时间线与镜头" },
  { id: "undoRedo", group: "剪辑", title: "撤销 / 重做" },
  { id: "split", group: "剪辑", title: "分割" },
  { id: "deleteClip", group: "剪辑", title: "删除" },
  { id: "speed", group: "剪辑", title: "变速" },
  { id: "cards", group: "剪辑", title: "字卡" },
  { id: "subtitles", group: "剪辑", title: "字幕" },
  { id: "media", group: "剪辑", title: "替换素材" },
  { id: "fullScreen", group: "剪辑", title: "全屏编辑" },
  { id: "voice", group: "声音", title: "配音" },
  { id: "music", group: "声音", title: "音乐" },
  { id: "sfx", group: "声音", title: "音效" },
  { id: "cover", group: "封面与导出", title: "封面" },
  { id: "exportGate", group: "封面与导出", title: "导出拦截" },
  { id: "exporting", group: "封面与导出", title: "导出完成" },
  { id: "shotFailed", group: "剪辑器异常", title: "补拍失败" },
  { id: "voiceFailed", group: "剪辑器异常", title: "配音部分失败" },
  { id: "noSpeech", group: "剪辑器异常", title: "没识别到语音" },
  { id: "coverNoFootage", group: "剪辑器异常", title: "封面无可用画面" },
];

/** 评审里补拍的「生成结果」:轮流用本地的 RELLET 成片与预览,不依赖外链 */
export const SHOT_VIDEOS = [DEMO_REEL.src, "/prototypes/hybrid-reel-agent/fixture/IMG_3716.mp4", "/prototypes/hybrid-reel-agent/fixture/saveclip.mp4"];

/** 评审「接口」在这一步要模拟的异常:识别 / 配音接口失败,或识别结果为空(见 fixtureFetch.ts、ReviewApp EditorStep) */
export type EditorFixture = { failStt?: boolean; failTts?: boolean; noSpeech?: boolean };

/** startCredits:这一步固定的起始余额(「积分不足」步骤 = LOW_CREDITS);不填时 ReviewApp 按「积分不足」开关决定 */
export type EditorPreset = {
  handoff: Stored;
  project: Project;
  initialUi: InitialUi;
  autorun?: "generateAll" | "export";
  fixture?: EditorFixture;
  startCredits?: number;
};

/** 补拍轮询超时的报错,与 canvas/workspace.tsx pollVideo 抛出的文案逐字一致 */
export const SHOT_TIMEOUT_ERROR = SHOT_TIMEOUT_TEXT;
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
  const waiting =
    id === "editorGuide" || id === "canvas" || id === "shotsGenerating" || id === "exportGate" || id === "coverNoFootage";
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
    /* 和 workspace 一样过 canvasError:红框里是看得懂的一句,接口原文折叠在 Details 里 */
    const err = canvasError(SPEECH_BUSY_ERROR);
    project = {
      ...project,
      assets: project.assets.map((a) =>
        a.id === baseVoice.assetId
          ? { ...a, status: "idle", progress: undefined, error: `1 of 1 lines failed: ${err.text}`, errorDetails: err.details || undefined }
          : a,
      ),
    };
  }

  /* 多个剪辑器:从第一个上传素材「+ → Video Editor」新建了第二个 Video Editor,再切回第一个;画布上第二个是静止的完整剪辑器节点 */
  const firstUpload = project.assets.find((a) => a.origin === "upload" && a.kind === "video");
  if (id === "multiEditor" && firstUpload) {
    const two = newEditorWith(project, firstUpload.id);
    project = activateEditor(two, project.editorId ?? "editor-1");
  }
  /* 变速:第一段实拍已经调成 1.5×(时间线上这一段变短);右键这一段看 Speed 子菜单 */
  if (id === "speed") {
    const target = project.clips.find((c) => project.assets.find((a) => a.id === c.assetId)?.origin === "upload");
    if (target) project = arrange({ ...project, clips: project.clips.map((c) => (c.id === target.id ? { ...c, speed: 1.5 } : c)) });
  }

  const assetOf = (assetId: string | null) => project.assets.find((a) => a.id === assetId);
  const firstAi = project.assets.find((a) => a.origin === "ai" && a.kind === "video");
  /* 实拍片段:选中只高亮,不出面板 */
  const uploadClips = project.clips.filter((c) => assetOf(c.assetId)?.origin === "upload");
  const firstVideoClip = uploadClips.find((c) => assetOf(c.assetId)?.kind === "video") ?? uploadClips[0];
  const firstVideoSeg = firstVideoClip ? layoutClips(project.clips).segs.find((x) => x.clip.id === firstVideoClip.id) : undefined;
  const firstCard = project.cards?.[0];
  const firstVoice = (project.voice ?? [])[0];
  const autoSub: InitialUi = { autoSubOpen: true };

  const ui: Record<EditorStepId, InitialUi> = {
    /* 和「进画布」同一个画布,只是剪辑器引导停在第 1 步(guide 在下面统一设) */
    editorGuide: {},
    canvas: {},
    shotsGenerating: {},
    /* 剪辑器节点不是资产(Project.editor 只是位置),画布上它本来就在播整条预览,不需要选中 */
    shotsReady: {},
    nodeSettings: { settingsId: firstAi?.id ?? null },
    multiEditor: {},
    /* 第 7–14 步都在画布上的剪辑器节点里演示(选中实拍只高亮,不出面板);全屏编辑只有第 15 步 */
    timeline: { selectedId: firstVideoClip?.id ?? null, selectedPart: "clip" },
    /* 撤销 / 重做:剪辑器工具栏左侧 Undo / Redo;评审者自己改一下再撤销 */
    undoRedo: {},
    /* 分割:选中第一段实拍,播放头放在这一段正中间,按 S 或点 Split at playhead 就能切 */
    split: { selectedId: firstVideoClip?.id ?? null, selectedPart: "clip", seek: firstVideoSeg ? firstVideoSeg.start + firstVideoSeg.len / 2 : undefined },
    /* 删除:选中第一段实拍,按 ⌫ 或点工具栏删除 */
    deleteClip: { selectedId: firstVideoClip?.id ?? null, selectedPart: "clip" },
    speed: { selectedId: firstVideoClip?.id ?? null, selectedPart: "clip" },
    /* 选中第一张字卡,画布右侧浮出 Text settings */
    cards: { selectedId: firstCard?.id ?? null, selectedPart: "card" },
    subtitles: { autoSubOpen: true },
    /* 和右键片段「Replace footage」一致(clipMenu.onReplace):选中这段 + 画布左侧打开 Media 面板 */
    media: { panel: "media", selectedId: firstVideoClip?.id ?? null, selectedPart: "clip" },
    /* 唯一一步全屏:点剪辑器工具栏右侧「Full-screen edit」进来的样子 */
    fullScreen: { full: true },
    /* 画布上点配音块 = 右侧打开这句的 Audio Settings */
    voice: { selectedId: firstVoice?.id ?? null, selectedPart: "voice", settingsId: firstVoice?.assetId ?? null },
    music: { panel: "audio" },
    sfx: { panel: "sfx" },
    cover: { coverOpen: true },
    exportGate: { exportGate: true },
    exporting: {},
    shotFailed: { settingsId: baseAi?.id ?? null },
    /* 画布上选中这句配音,右侧 Audio Settings 底部出红框 */
    voiceFailed: { selectedId: firstVoice?.id ?? null, selectedPart: "voice", settingsId: firstVoice?.assetId ?? null },
    noSpeech: autoSub,
    /* 封面弹窗没有「定位到某一秒」的入口(起点 = 已设封面那一帧或播放头),评审者要自己拖到补拍那一段 */
    coverNoFootage: { coverOpen: true },
  };
  const fixture: Partial<Record<EditorStepId, EditorFixture>> = {
    /* 再点 Generate Audio 也会失败,看到的还是同一个红框 */
    voiceFailed: { failTts: true },
    noSpeech: { noSpeech: true },
  };
  return {
    handoff: { ...handoff, project },
    project,
    /* 剪辑器引导只在「剪辑器引导」这一步弹,其他步骤不管 localStorage 一律不弹 */
    initialUi: { ...ui[id], guide: id === "editorGuide" },
    autorun: id === "shotsGenerating" ? "generateAll" : id === "exporting" ? "export" : undefined,
    ...(fixture[id] ? { fixture: fixture[id] } : {}),
  };
}
