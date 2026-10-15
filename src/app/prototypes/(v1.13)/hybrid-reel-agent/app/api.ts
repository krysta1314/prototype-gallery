/* 数据接口:产品只认 AgentApi。开发原型注入 liveApi(真调 /api/hybrid-reel/*),评审原型注入 fixtureApi(录好的数据)。 */

import { analyzeEach, videoLength } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/analyze";
import type { Brief, ClipProfile, Outline } from "@/app/prototypes/(v1.13)/hybrid-reel/agent/chat/types";
import { FileError, friendlyError } from "./logic/errors";
import type { Lang, MediaKind, OutlineReq, Skipped } from "./store";

export type HomeItem = { name: string; url: string; kind: MediaKind; file?: File };
export type BriefResult = { reply: string; brief: Brief; assumed?: string[] };

/** 分析结果:读成功的素材 + 被跳过的(单个失败跳过继续;全部失败时 analyze 直接抛错) */
export type AnalyzeResult = { profiles: ClipProfile[]; skipped: Skipped[] };
/** onProgress(done, total):已读完几个文件;signal:Cancel 用,取消后 analyze 以 AbortError 结束 */
export type AnalyzeOpts = { onProgress?: (done: number, total: number) => void; signal?: AbortSignal };

export interface AgentApi {
  analyze(items: HomeItem[], lang: Lang, opts?: AnalyzeOpts): Promise<AnalyzeResult>;
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
  async analyze(items, lang, opts = {}) {
    const files = items.map((it) => {
      if (!it.file) throw new Error(`${it.name} is not a local file`);
      return it.file;
    });
    const settled = await analyzeEach(files, lang === "zh", { onFile: opts.onProgress, signal: opts.signal });
    const ok = settled.flatMap((r, i) => (r.status === "fulfilled" ? [{ i, profiles: r.value.profiles ?? [] }] : []));
    const failed = settled.flatMap((r, i) => (r.status === "rejected" ? [{ i, error: r.reason as unknown }] : []));
    /* 全部失败才整体报错;带上第一个失败的文件名,friendlyError 拼 "{file} is too large to upload."。跳过的那几行 reason 不带文件名(「The file / 该文件」),按回复语言出 */
    if (!ok.length && failed.length) {
      const first = failed[0];
      throw new FileError(items[first.i].name, first.error instanceof Error ? first.error.message : String(first.error));
    }
    const skipped = failed.map(({ i, error }) => ({ name: items[i].name, reason: friendlyError(error, lang === "zh" ? "该文件" : "The file", lang).text }));
    /* 一个文件一般对应一条 profile;按文件把预览地址和时长挂回去 */
    const profiles = await Promise.all(
      ok.flatMap(({ i, profiles: ps }) =>
        ps.map(async (p) => ({
          ...p,
          objectUrl: items[i].url,
          durationSec: p.kind !== "image" ? await videoLength(items[i].url) : undefined,
        })),
      ),
    );
    return { profiles, skipped };
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
