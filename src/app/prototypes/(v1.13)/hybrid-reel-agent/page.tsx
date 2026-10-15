"use client";

/* Hybrid Reel Agent 落地页(开发原型)。界面在 app/AgentHome;File 经 v1.13 handoff 模块带去对话页。 */

import { useRouter } from "next/navigation";
import { setPendingHandoff } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/handoff";
import { AgentHome } from "./app/AgentHome";

export default function HybridReelAgentHome() {
  const router = useRouter();
  return (
    <AgentHome
      onCreate={(items, prompt) => {
        setPendingHandoff({ files: items.flatMap((it) => (it.file ? [it.file] : [])), prompt });
        router.push("/prototypes/hybrid-reel-agent/chat");
      }}
    />
  );
}
