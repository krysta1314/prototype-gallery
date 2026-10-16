"use client";

/* 评审原型:左栏是用户旅程,产品下方横条是这一屏的需求要点 + 状态开关 + 模拟事件;两块可一起收起,收起后产品铺满。
   点旅程 / 改开关 = 用新预置状态重新挂载产品(key 变化)。
   产品界面与开发原型同一份:左栏「Agent」部分 25 步(app/),「画布剪辑器」部分 25 步、单独从 1 编号(hybrid-reel/canvas 的 Workspace);
   这里只决定初始状态和数据接口。 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Handoff, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { Project } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/project";
import { Workspace } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/workspace";
import { AgentChat } from "../app/AgentChat";
import { AgentHome } from "../app/AgentHome";
import type { HomeItem } from "../app/api";
import type { CreationType } from "../app/components/CreationTypePicker";
import { createFixtureApi } from "../app/fixture/api";
import RELLET from "../app/fixture/rellet.json";
import type { FixtureData } from "../app/fixture/types";
import { AgentProvider, useAgent } from "../app/provider";
import { SHOT_VIDEOS, buildEditorPreset, type EditorStepId } from "./editorJourneys";
import { createFixtureFetch } from "./fixtureFetch";
import { DemoPanel, ExpandStrip, JourneyNav, PANEL_H, clampPanelH } from "./Inspector";
import {
  DEFAULT_OPTS,
  LOW_CREDITS,
  agentFailFor,
  buildPreset,
  isEditorStep,
  type ReviewOpts,
  type StepId,
} from "./journeys";

const DATA = RELLET as unknown as FixtureData;
const COLLAPSE_KEY = "hybrid-reel-agent:review-collapsed";
const PANEL_H_KEY = "hybrid-reel-agent:review-panel-h";
const MISSING = "/prototypes/hybrid-reel-agent/fixture/__missing.mp4";

function Screens({
  homeItems,
  homePrompt,
  homeNotices,
  homeTypeMenuOpen,
  creationType,
  onSync,
}: {
  homeItems: HomeItem[];
  homePrompt?: string;
  homeNotices?: string[];
  homeTypeMenuOpen?: boolean;
  creationType: CreationType;
  onSync: (generating: boolean, send: (text: string) => void) => void;
}) {
  const { state, actions, homeItems: items } = useAgent();
  /* 把 generating 和 send 同步给钉在 provider 之外的侧栏,侧栏才不用随 key 重挂载 */
  useEffect(() => {
    onSync(state.generating, actions.send);
  }, [onSync, state.generating, actions.send]);
  return state.screen === "home" ? (
    /* 素材不可用选「Add more footage」回到落地页:用 provider 里这次的素材和 prompt 预填 */
    <AgentHome
      initialItems={state.files.length ? items : homeItems}
      initialPrompt={state.prompt || homePrompt}
      initialNotices={homeNotices}
      credits={state.credits}
      initialType={creationType}
      initialTypeMenuOpen={homeTypeMenuOpen}
      onCreate={actions.start}
    />
  ) : (
    <AgentChat />
  );
}

/** 自动字幕会识别的片段(和 canvas/autosub.tsx 的 withFootage 同一规则:有配音的镜头,或已就绪的视频),按时间线顺序;
    每段回放这一镜的台词(没有就用现有字幕),时长 = 同句录音长度,否则配音长度 / 片段原始长度 */
function sttFor(project: Project, voice: { text: string; durationSec: number }[]) {
  const voiceOf = (id: string) => (project.voice ?? []).find((v) => v.clipId === id && v.url);
  const rows = project.clips
    .filter((c) => {
      if (voiceOf(c.id)) return true;
      const a = project.assets.find((x) => x.id === c.assetId);
      return a?.status === "ready" && !!a.url && a.kind === "video";
    })
    .map((c) => {
      const text = c.line?.trim() || c.subtitle.trim();
      const vo = voiceOf(c.id);
      const recorded = voice.find((v) => v.text.trim() === text)?.durationSec;
      return { text, dur: vo ? vo.len : (recorded ?? c.outSec - c.inSec) };
    })
    .filter((r) => r.text);
  return { sttLines: rows.map((r) => r.text), sttDurations: rows.map((r) => r.dur) };
}

/** 剪辑器步骤:每次挂载(key = run)按当前步骤 / 开关 / 分镜搭一次工程和一个新的录播接口,补拍任务计数从零开始。
    预置带的 fixture 合并进接口:failStt / failTts 原样传,noSpeech = 识别结果全空(sttLines: [])。
    credits:从 Agent 点 Edit in canvas 进来时带的余额(已扣过生成费用),这一次进入就用它起步;左栏直接点进来 = null,照旧 */
function EditorStep({
  step,
  opts,
  outline,
  credits,
  onBack,
}: {
  step: EditorStepId;
  opts: ReviewOpts;
  outline: Outline | null;
  credits: number | null;
  onBack: () => void;
}) {
  const [editor] = useState(() => buildEditorPreset(step, opts, DATA, outline ?? undefined));
  const [fetcher] = useState(() => {
    const fx = editor.fixture ?? {};
    const stt = sttFor(editor.project, DATA[opts.lang].voice);
    return createFixtureFetch({
      voice: DATA[opts.lang].voice,
      ...(fx.noSpeech ? { sttLines: [] } : stt),
      shotVideos: SHOT_VIDEOS,
      failShot: opts.failShot,
      failStt: fx.failStt,
      failTts: fx.failTts,
    });
  });
  return (
    <Workspace
      handoff={editor.handoff}
      initial={editor.project}
      initialUi={editor.initialUi}
      autorun={editor.autorun}
      fetcher={fetcher}
      onBack={onBack}
      persist={false}
      startCredits={credits ?? editor.startCredits ?? (opts.noCredits ? LOW_CREDITS : undefined)}
      /* 画布顶部的深色演示栏是开发原型的演示控件,和评审自己的面板冲突;引导弹不弹由步骤决定(initialUi.guide) */
      demoBar={false}
    />
  );
}

export default function ReviewApp() {
  const [step, setStep] = useState<StepId>("creationType");
  const [opts, setOpts] = useState<ReviewOpts>(DEFAULT_OPTS);
  const [run, setRun] = useState(0);
  /* null = 还没读到 localStorage:这一帧什么都不渲染,免得侧栏先展开再收起、产品左右跳 */
  const [collapsed, setCollapsed] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [panelH, setPanelH] = useState(PANEL_H);
  /* 从评审里点 Edit in canvas 时记下当时那份分镜(可能是改稿后的);直接点左栏进剪辑器 = null,用录制首版 */
  const [canvasOutline, setCanvasOutline] = useState<Outline | null>(null);
  /* 同一次 Edit in canvas 带进来的 Agent 余额;只管这一次进入,换步骤 / 重播 / 改开关就清掉 */
  const [canvasCredits, setCanvasCredits] = useState<number | null>(null);
  const sendRef = useRef<(text: string) => void>(() => {});
  const onSync = useCallback((g: boolean, send: (text: string) => void) => {
    sendRef.current = send;
    setGenerating(g);
  }, []);

  useEffect(() => {
    let stored = false;
    let h = PANEL_H;
    try {
      /* 挂载后才读 localStorage(服务端渲染时没有),避免水合不一致 */
      stored = localStorage.getItem(COLLAPSE_KEY) === "1";
      const n = Number(localStorage.getItem(PANEL_H_KEY));
      if (n > 0) h = clampPanelH(n);
    } catch {
      /* 存储不可用就默认展开、默认高度 */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPanelH(h);
    setCollapsed(stored);
  }, []);
  const collapse = (c: boolean) => {
    setCollapsed(c);
    try {
      localStorage.setItem(COLLAPSE_KEY, c ? "1" : "0");
    } catch {
      /* 忽略 */
    }
  };

  const resizePanel = useCallback((h: number, done: boolean) => {
    setPanelH(h);
    if (!done) return;
    try {
      localStorage.setItem(PANEL_H_KEY, String(h));
    } catch {
      /* 忽略 */
    }
  }, []);

  const editorStep = isEditorStep(step);
  /* 剪辑器步骤不搭 Agent 预置 */
  const preset = useMemo(() => (isEditorStep(step) ? null : buildPreset(step, opts, DATA)), [step, opts]);
  const api = useMemo(
    () =>
      createFixtureApi(DATA, {
        lang: opts.lang,
        voiceover: opts.voiceover,
        aiShots: opts.aiShots,
        failAnalyze: opts.failAnalyze,
        failOutline: opts.failOutline,
        longScript: opts.longScript,
      }),
    [opts],
  );
  const reelSrc = step === "failVideo" || opts.failVideo ? MISSING : undefined;
  /* 在产品里新开一轮生成时会失败什么:只看开关("plan" 不是自带失败的步骤) */
  const liveFail = useMemo(() => agentFailFor("plan", opts, DATA), [opts]);
  const go = (s: StepId) => {
    if (!isEditorStep(s)) setCanvasOutline(null);
    setCanvasCredits(null);
    setStep(s);
    setRun((r) => r + 1);
  };
  /* Agent 里点 Edit in canvas:不跳页,带着这份分镜进剪辑器「进画布」那一步(剪辑器第 2 步;第 1 步是引导) */
  const openCanvas = useCallback((h: Handoff) => {
    setCanvasOutline(h.outline);
    setCanvasCredits(h.credits ?? null);
    setStep("canvas");
    setRun((r) => r + 1);
  }, []);
  const change = (o: ReviewOpts) => {
    /* 语言 / 旁白 / AI 补拍 / 旁白超长会改分镜本身:带进来的那份分镜作废,回到按开关搭的录制版;只改失败类开关就保留 */
    if (o.lang !== opts.lang || o.voiceover !== opts.voiceover || o.aiShots !== opts.aiShots || o.longScript !== opts.longScript) setCanvasOutline(null);
    setCanvasCredits(null);
    setOpts(o);
    setRun((r) => r + 1);
  };

  if (collapsed === null) return null;

  const sendWhileGenerating = () =>
    sendRef.current(opts.lang === "zh" ? "开头换成雪山溪流" : "Open with a snowy mountain stream instead");

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      {/* 产品外壳写死了 h-dvh(开发原型要铺满整屏);评审里让它填满上方区域,给下方面板留位置 */}
      {/* transform 让 .review-product 成为 fixed 后代的包含块:剪辑器全屏浮层只铺满产品区,不铺满整个窗口 */}
      <style>{`.review-product > * { height: 100% !important; } .review-product { transform: translateZ(0); }`}</style>
      {!collapsed && <JourneyNav step={step} onStep={go} onCollapse={() => collapse(true)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="review-product min-h-0 flex-1 overflow-hidden">
          {isEditorStep(step) ? (
            <EditorStep key={run} step={step} opts={opts} outline={canvasOutline} credits={canvasCredits} onBack={() => go("plan")} />
          ) : (
            preset && (
              <AgentProvider
                key={run}
                api={api}
                initialState={preset.state}
                initialItems={preset.items}
                autorun={preset.autorun}
                reelSrc={reelSrc}
                onOpenCanvas={openCanvas}
                initialCredits={opts.noCredits ? LOW_CREDITS : undefined}
                /* 只按「生成失败(Agent)」开关(异常步骤自带的失败已在预置里发生过,重新生成不再失败) */
                failShot={liveFail.shot}
                failKind={liveFail.shotKind}
                failVoice={liveFail.voice}
                failEdit={opts.failEdit}
                failSend={opts.failSend}
              >
                <Screens
                  homeItems={preset.items}
                  homePrompt={preset.homePrompt}
                  homeNotices={preset.homeNotices}
                  homeTypeMenuOpen={preset.homeTypeMenuOpen}
                  creationType={opts.creationType}
                  onSync={onSync}
                />
              </AgentProvider>
            )
          )}
        </div>
        {!collapsed && (
          <DemoPanel
            step={step}
            opts={opts}
            onOpts={change}
            onReplay={() => go(step)}
            generating={editorStep ? false : generating}
            onSendWhileGenerating={sendWhileGenerating}
            editorStep={editorStep}
            height={panelH}
            onHeight={resizePanel}
          />
        )}
      </div>
      {collapsed && <ExpandStrip onExpand={() => collapse(false)} />}
    </div>
  );
}
