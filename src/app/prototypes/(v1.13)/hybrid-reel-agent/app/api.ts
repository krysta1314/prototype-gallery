/* 数据接口:产品只认 AgentApi。开发原型注入 liveApi(真调 /api/hybrid-reel/*),评审原型注入 fixtureApi(录好的数据)。 */

import { analyzeFiles, videoLength } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/analyze";
import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import type { Lang, MediaKind, OutlineReq } from "./store";

export type HomeItem = { name: string; url: string; kind: MediaKind; file?: File };
export type BriefResult = { reply: string; brief: Brief; assumed?: string[] };

export interface AgentApi {
  analyze(items: HomeItem[], lang: Lang): Promise<ClipProfile[]>;
  brief(prompt: string, profiles: ClipProfile[], lang: Lang): Promise<BriefResult>;
  outline(req: OutlineReq): Promise<Outline>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export const liveApi: AgentApi = {
  async analyze(items, lang) {
    const files = items.map((it) => {
      if (!it.file) throw new Error(`${it.name} is not a local file`);
      return it.file;
    });
    const analyzed = await analyzeFiles(files, lang === "zh", () => {});
    const lengths = await Promise.all(
      analyzed.profiles.map((p, i) => (p.kind !== "image" && items[i] ? videoLength(items[i].url) : Promise.resolve(undefined))),
    );
    return analyzed.profiles.map((p, i) => ({ ...p, objectUrl: items[i]?.url, durationSec: lengths[i] }));
  },
  async brief(prompt, profiles, lang) {
    const data = await postJson<Partial<BriefResult>>("/api/hybrid-reel/brief", { prompt, profiles, lang });
    if (!data.brief) throw new Error("No brief returned");
    return { reply: data.reply ?? "", brief: data.brief, assumed: data.assumed };
  },
  async outline(req) {
    const data = await postJson<Outline>("/api/hybrid-reel/outline", { profiles: req.profiles, brief: req.brief, ...(req.revise ?? {}) });
    if (!data.shots) throw new Error("No storyboard returned");
    return data;
  },
};
