"use client";

/* Hybrid Reel Agent 对话页(开发原型):真调模型。界面与流程都在 app/,评审原型共用同一份。 */

import { useEffect, useRef } from "react";
import { takePendingHandoff } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/handoff";
import { AgentChat } from "../app/AgentChat";
import { liveApi } from "../app/api";
import { AgentProvider, useAgent } from "../app/provider";
import type { MediaKind } from "../app/store";

const kindOf = (f: File): MediaKind =>
  f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name) ? "image" : f.type.startsWith("audio/") ? "audio" : "video";

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

export default function HybridReelAgentChat() {
  return (
    <AgentProvider api={liveApi}>
      <Boot />
      <AgentChat />
    </AgentProvider>
  );
}
