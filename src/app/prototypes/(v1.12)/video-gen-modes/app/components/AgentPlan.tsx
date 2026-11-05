"use client";

/* Marketing Agent 的「Video plan」卡：写明用哪个模型、哪个模式、为什么;直接开始生成。
   Change → 展开模型 / 模式下拉(规则同输入框),Regenerate 用改过的组合重新生成。 */

import { RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { MODE_LABEL, modelCaps } from "../capabilities";
import type { Asset } from "../assets";
import { replan } from "../agent";
import { selectModel, type ComposerState } from "../state";
import { validate } from "../validate";
import { ModeMenu, ModelIcon, ModelMenu } from "./BarMenus";
import { switchToast } from "./Composer";

export function AgentPlanCard({
  state,
  reason,
  picked,
  files,
  inUK,
  onRegenerate,
  notify,
}: {
  state: ComposerState;
  reason: string;
  /** 用户在卡片上改过模型 / 模式 */
  picked?: boolean;
  /** 对话里的原始文件：改模式时重新放进新模式的素材位 */
  files: Asset[];
  inUK?: boolean;
  onRegenerate: (s: ComposerState) => void;
  notify: (t: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state);
  const issue = validate(draft, { inUK }).issues[0];
  return (
    <div className="rounded-2xl border border-[#ececf1] bg-white p-3.5">
      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#a0a1aa]">
        <Sparkles className="size-3.5 text-[#ff5e1a]" /> Video plan
      </p>
      {!editing ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1a1a2e]">
            <ModelIcon model={state.model} /> {modelCaps(state.model).label}
          </span>
          <span className="rounded-md bg-[#fff3ec] px-2 py-0.5 text-[12.5px] font-semibold text-[#ff5e1a]">{MODE_LABEL[state.mode]}</span>
          <button type="button" onClick={() => (setDraft(state), setEditing(true))} className="ml-auto text-[12.5px] font-semibold text-[#6a6b7b] underline-offset-2 hover:text-[#1a1a2e] hover:underline">
            Change
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ModelMenu
            value={draft.model}
            placement="down"
            onChange={(k) => {
              const r = selectModel(draft, k);
              setDraft(replan(draft, { model: k }, files));
              if (r.switchedFrom) notify(switchToast(k, r.switchedFrom, r.state.mode));
            }}
          />
          <ModeMenu model={draft.model} value={draft.mode} placement="down" onChange={(m) => setDraft(replan(draft, { mode: m }, files))} />
          <button
            type="button"
            disabled={!!issue}
            title={issue?.message}
            onClick={() => {
              onRegenerate(draft);
              setEditing(false);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#1a1a2e] px-3 text-[13px] font-semibold text-white transition hover:bg-[#2a2a42] disabled:opacity-40"
          >
            <RefreshCw className="size-3.5" /> Regenerate
          </button>
          <button type="button" onClick={() => setEditing(false)} className="h-9 px-2 text-[12.5px] font-medium text-[#9a9bb0] hover:text-[#1a1a2e]">
            Cancel
          </button>
          {issue && <p className="w-full text-[12px] text-[#c2410c]">{issue.message}</p>}
        </div>
      )}
      <p className="mt-2 text-[13px] leading-relaxed text-[#6a6b7b]">
        {picked ? `You picked ${modelCaps(state.model).label} with ${MODE_LABEL[state.mode]}.` : `Using ${MODE_LABEL[state.mode]} because ${reason}.`}
      </p>
    </div>
  );
}
