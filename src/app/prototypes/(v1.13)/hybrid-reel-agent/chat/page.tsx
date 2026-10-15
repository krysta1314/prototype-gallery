"use client";

/* Hybrid Reel Agent 对话页(开发原型):真调模型。界面与流程都在 app/,评审原型共用同一份。 */

import { useEffect, useRef } from "react";
import { takePendingHandoff } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/handoff";
import { AgentChat } from "../app/AgentChat";
import { AgentHome } from "../app/AgentHome";
import { liveApi } from "../app/api";
import { AgentProvider, useAgent } from "../app/provider";
import { mediaKind } from "../app/logic/upload";

const kindOf = (f: File) => mediaKind(f.name, f.type) ?? "video";

function Boot() {
  const { actions } = useAgent();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const handoff = takePendingHandoff();
    if (!handoff?.files.length) {
      actions.showEmpty();
      return;
    }
    actions.start(
      handoff.files.map((file) => ({ file, name: file.name, url: URL.createObjectURL(file), kind: kindOf(file) })),
      handoff.prompt,
    );
  }, [actions]);
  return null;
}

/* 素材不可用选「Add more footage」:回到落地页界面(素材和 prompt 预填),再 Create 就在这一页重新分析全部文件。
   刚进页面时还没 start(files 为空),不显示落地页,免得闪一下 */
function Screen() {
  const { state, actions, homeItems } = useAgent();
  if (state.screen === "home" && state.files.length)
    return <AgentHome initialItems={homeItems} initialPrompt={state.prompt} credits={state.credits} onCreate={actions.start} />;
  return <AgentChat />;
}

export default function HybridReelAgentChat() {
  return (
    <AgentProvider api={liveApi}>
      <Boot />
      <Screen />
    </AgentProvider>
  );
}
