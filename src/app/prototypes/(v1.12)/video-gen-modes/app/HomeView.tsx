"use client";

/* 首页:History 栏 + 标题 + 输入框(Creation type 切换)+ 下方结果。
   - Video Gen:共享 Composer(先模型、再模式),Create 后结果卡排在输入框下面，最新在上;
   - Marketing Agent:输入框不加模式控件;Create 后进一段演示对话:用户消息 → Video plan 卡(agent 自己定模式和模型)→ 结果卡;
   - Image Gen:2026-11-05 加了输入框(侧边栏 Image 里跳 Agent 的项进这里并预填);
   - Audio Gen:2026-11-06 加了输入框(侧边栏 Audio 菜单 5 项都进这里，预选模型并预填)。
   结果卡上的 Extend / Edit / Use last frame → 切到 Video Gen,模式和素材预填，滚回输入框。 */

import { useRef, useState } from "react";
import localFont from "next/font/local";
import { ChevronDown, Globe, PanelLeft, Plus, SlidersHorizontal, X } from "lucide-react";
import { HistoryRail } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/shell";
import { ToolsTopBar } from "@/app/prototypes/(v1.12)/ai-tools/app/components/ToolsTopBar";
import { LlmSwitcher } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/llm";
import type { Asset } from "./assets";
import { planFromChat } from "./agent";
import { initialComposer, selectMode, selectModel, type ComposerState } from "./state";
import type { ModeKey, ModelKey } from "./capabilities";
import { validate } from "./validate";
import { AssetPicker, AssetThumb } from "./components/AssetPicker";
import { AgentPlanCard } from "./components/AgentPlan";
import { Composer } from "./components/Composer";
import { ImageGenComposer } from "./components/ImageGenComposer";
import { AudioGenComposer } from "./components/AudioGenComposer";
import { AllModelComposers } from "./components/AllModelComposers";
import { CreationTypeMenu, type CreationType } from "./components/CreationTypeMenu";

const bricolage = localFont({ src: "../../../../fonts/BricolageGrotesque-ExtraBold.ttf", weight: "800", display: "swap" });
const gradText = "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const agentCta =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[15px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none";

/* 标题跟着创作模式换(2026-11-05:Image Gen / Audio Gen 的标题 Monica 定稿) */
const HEADLINE: Record<CreationType, [string, string, string]> = {
  marketing: ["Marketing Agent:", "Your ideas,", "campaign-ready in seconds"],
  image: ["Image Gen:", "Ad-ready product shots,", "no photoshoot needed"],
  video: ["Video Gen:", "Ad-ready video clips,", "with sound, from one prompt"],
  audio: ["Audio Gen:", "Voiceovers, music and SFX,", "no recording studio needed"],
};

type Turn = { id: string; prompt: string; files: Asset[]; plan: ComposerState; reason: string; picked?: boolean };

export function HomeView({
  credits,
  notify,
  inUK,
  navReq,
  start,
  onMenu,
  onInvite,
}: {
  credits: number;
  notify: (t: string) => void;
  inUK: boolean;
  /** 生成相关(点 Create 之后不在本需求范围，原型不再演示;保留参数，调用方不用改) */
  failNext?: () => boolean;
  generateMs?: number;
  /** 侧边栏点 Home / Marketing Agent:每次一个新 id,切到对应的 Creation type */
  navReq?: { id: string; type: CreationType };
  /** 从侧边栏进来时的初始状态(外壳用 key 重新挂载):
      model + mode = 生成类专项能力(Camera Control / Video Styles),直接切到 Video Gen 的这个模型和模式;
      prompt = 通用模型菜单项(Image to Video 等)预填的提示词 */
  start?: { id: string; type: CreationType; model?: ModelKey; mode?: ModeKey; prompt?: string; audioModel?: string };
  /** 窄屏打开侧边栏抽屉(外壳给) */
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  const applyStart = (c: ComposerState, st: NonNullable<typeof start>) => {
    if (st.model) c = selectModel(c, st.model).state;
    if (st.mode) c = selectMode(c, st.mode);
    if (st.prompt && st.type === "video") c = { ...c, prompt: st.prompt };
    return c;
  };
  const [type, setType] = useState<CreationType>(start?.type ?? navReq?.type ?? "video");
  const [composer, setComposer] = useState<ComposerState>(() => (start ? applyStart(initialComposer(), start) : initialComposer()));
  /* 侧边栏带来的切换(渲染时对比 id,不用 effect、不重新挂载，已有结果保留) */
  const [seenNav, setSeenNav] = useState(navReq?.id);
  if (navReq && navReq.id !== seenNav) {
    setSeenNav(navReq.id);
    setType(navReq.type);
  }
  const [historyOpen, setHistoryOpen] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState(start?.type === "marketing" ? (start.prompt ?? "") : "");
  /* Image Gen:侧边栏 Image 里跳 Agent 的项带进来的提示词(2026-11-05 起进 Image Gen,不进 Marketing Agent) */
  const [imagePrompt, setImagePrompt] = useState(start?.type === "image" ? (start.prompt ?? "") : "");
  const [imageSelect, setImageSelect] = useState(start?.type === "image" ? start.id : undefined);
  /* Audio Gen:侧边栏 Audio 菜单带进来的模型和提示词(2026-11-06) */
  const [audioPrompt, setAudioPrompt] = useState(start?.type === "audio" ? (start.prompt ?? "") : "");
  const [audioSelect, setAudioSelect] = useState(start?.type === "audio" ? start.id : undefined);
  const [audioModel, setAudioModel] = useState(start?.type === "audio" ? start.audioModel : undefined);
  const [seenStart, setSeenStart] = useState(start?.id);
  if (start && start.id !== seenStart) {
    setSeenStart(start.id);
    setType(start.type);
    if (start.type === "video") setComposer((c) => applyStart(c, start));
    else if (start.type === "image") {
      setImagePrompt(start.prompt ?? "");
      setImageSelect(start.id);
    } else if (start.type === "audio") {
      setAudioPrompt(start.prompt ?? "");
      setAudioSelect(start.id);
      setAudioModel(start.audioModel);
    } else if (start.prompt) setAgentPrompt(start.prompt);
  }
  const [agentFiles, setAgentFiles] = useState<Asset[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const top = useRef<HTMLDivElement>(null);

  const pickType = (t: CreationType) => {
    setType(t);
  };

  /* 2026-11-05:点 Create 之后的交互(生成中、结果卡、Extend / Edit / Use last frame)不在本需求范围，只提示已提交 */
  const createVideo = () => notify(composer.count > 1 ? `${composer.count} videos are generating` : "Your video is generating");

  const createAgent = () => {
    const { state, reason } = planFromChat(agentPrompt.trim(), agentFiles);
    const v = validate(state, { inUK });
    const ok = v.ok;
    if (ok) notify("Your video is generating");
    setTurns((t) => [...t, { id: `t${t.length}`, prompt: agentPrompt.trim(), files: agentFiles, plan: state, reason }]);
    if (!ok) notify(v.issues[0].message);
    setAgentPrompt("");
    setAgentFiles([]);
  };

  const [kicker, rest, line2] = HEADLINE[type];

  return (
    <div className="flex h-full min-w-0 flex-1">
      {/* History 栏默认收起;展开后点栏头的图标再收起(共用的 HistoryRail 图标本身不可点，这里盖一个按钮) */}
      {historyOpen && (
        <div className="relative hidden lg:flex">
          <HistoryRail />
          <button
            type="button"
            aria-label="Collapse history"
            onClick={() => setHistoryOpen(false)}
            className="absolute right-2.5 top-3 grid size-7 place-items-center rounded-lg text-transparent transition hover:bg-[#f4f3f6]"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
      )}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* 顶栏悬浮在渐变内容区上面(照真实产品):不占高度，只有按钮可点 */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-14 items-center px-4 sm:px-5 [&>*]:pointer-events-auto">
          {!historyOpen && (
            <button
              type="button"
              aria-label="Show history"
              title="History"
              onClick={() => setHistoryOpen(true)}
              className="hidden size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-white/70 hover:text-[#1a1a2e] lg:grid"
            >
              <PanelLeft className="size-4" />
            </button>
          )}
        </header>
        {/* 右侧积分 / 账号和窄屏的菜单按钮用 ai-tools 的顶栏(md 以下有菜单按钮打开侧边栏抽屉;手机宽只留积分 + 头像) */}
        <ToolsTopBar credits={credits} notify={notify} onMenu={onMenu} onInvite={onInvite ?? (() => notify("Coming soon in this prototype"))} />
        <main className="relative isolate min-h-0 flex-1 overflow-y-auto bg-[#fffdfb] px-4 text-[#1a1a2e] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <div className="marketing-agent-brand-field" aria-hidden="true" />
          <div ref={top} className="relative z-10 pb-16">
            <h1 className={`${bricolage.className} mt-[7vh] text-center text-[clamp(32px,4.2vw,60px)] leading-[1.08] tracking-[-0.04em]`}>
              <span className={gradText}>{kicker}</span> {rest}
              <br />
              {line2}
            </h1>

            <div className="mx-auto mt-7 w-[922px] max-w-full">
              <div className="rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                {type === "audio" ? (
                  <AudioGenComposer prompt={audioPrompt} onPrompt={setAudioPrompt} modelKey={audioModel} selectKey={audioSelect} notify={notify} leading={<CreationTypeMenu value={type} onChange={pickType} />} />
                ) : type === "image" ? (
                  <ImageGenComposer prompt={imagePrompt} onPrompt={setImagePrompt} selectKey={imageSelect} notify={notify} leading={<CreationTypeMenu value={type} onChange={pickType} />} />
                ) : type === "video" ? (
                  <Composer
                    state={composer}
                    balance={credits}
                    onChange={setComposer}
                    onCreate={createVideo}
                    notify={notify}
                    inUK={inUK}
                    variant="home"
                    leading={<CreationTypeMenu value={type} onChange={pickType} />}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex max-w-[55%] shrink-0 flex-wrap items-start gap-2">
                        {agentFiles.map((a) => (
                          <div key={a.id} className="group relative size-[56px] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5">
                            <AssetThumb asset={a} />
                            <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAgentFiles((f) => f.filter((x) => x.id !== a.id))} className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        <AssetPicker
                          accept={["image", "video", "audio"]}
                          multiple
                          placement="down"
                          uploadHint="Support image, video, pdf, audio"
                          onPick={(a) => setAgentFiles((f) => [...f, ...a])}
                          trigger={(open, isOpen) => (
                            <button type="button" onClick={open} aria-label="Upload files" className={`grid size-[56px] place-items-center rounded-xl border transition ${isOpen ? "border-[#ff5e1a] bg-[#fff7f1] text-[#ff5e1a]" : "border-transparent bg-[#f3f4f6] text-[#9a9bb0] hover:bg-[#ececf1] hover:text-[#4a4b5c]"}`}>
                              <Plus className="size-5" />
                            </button>
                          )}
                        />
                      </div>
                      <textarea
                        value={agentPrompt}
                        onChange={(e) => setAgentPrompt(e.target.value)}
                        aria-label="Prompt"
                        rows={4}
                        placeholder="Describe your idea, campaign with marketing agent. Use @ to reference uploaded files."
                        className="min-w-0 flex-1 resize-none bg-transparent px-1 text-[15px] leading-relaxed text-[#1a1a2e] outline-none placeholder:text-[#a5a6b6]"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CreationTypeMenu value={type} onChange={pickType} />
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ececf1] px-3 text-[13px] font-semibold text-[#4a4b5c]">
                        <SlidersHorizontal className="size-3.5" /> Manual
                        <ChevronDown className="size-3.5 text-[#9a9bb0]" />
                      </span>
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#ececf1] px-3 text-[13px] font-semibold text-[#4a4b5c]">
                        <Globe className="size-3.5" /> Web Explore
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <LlmSwitcher placement="down" />
                        <button type="button" disabled={!agentPrompt.trim()} onClick={createAgent} className={agentCta}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/prototypes/homepage/member-sparkle.svg" alt="" className="size-[18px]" />
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {type === "video" && <AllModelComposers credits={credits} inUK={inUK} notify={notify} onPickType={pickType} />}

              {type === "marketing" && turns.length > 0 && (
                <section aria-label="Conversation" className="mt-6 space-y-5">
                  {turns.map((t) => (
                    <div key={t.id} className="space-y-3">
                      <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-md bg-[#1a1a2e] px-3.5 py-2.5 text-[14px] leading-relaxed text-white">
                        {t.files.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {t.files.map((a) => (
                              <span key={a.id} className="size-10 overflow-hidden rounded-lg">
                                <AssetThumb asset={a} />
                              </span>
                            ))}
                          </div>
                        )}
                        {t.prompt}
                      </div>
                      <div className="max-w-[86%] space-y-3">
                        <AgentPlanCard
                          state={t.plan}
                          reason={t.reason}
                          picked={t.picked}
                          files={t.files}
                          inUK={inUK}
                          notify={notify}
                          onRegenerate={(s) => {
                            notify("Your video is generating");
                            setTurns((all) => all.map((x) => (x.id === t.id ? { ...x, plan: s, picked: true } : x)));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
