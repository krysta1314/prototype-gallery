/* 评审原型里剪辑器的「接口」:按 URL 回放录好的数据,不联网。
   补拍:建任务立刻给 id,readyAfterMs 后查询变成功,取文件按建任务顺序轮流给 shotVideos;failShot 时建任务就失败。
   配音:按句子找录音(找不到用第一条),返回 { audio: base64, duration } —— 和真实 /api/hybrid-reel/tts 同形。
   自动字幕:按调用顺序依次返回分镜旁白(剪辑器按时间线顺序逐段识别),用完从头再来;sttLines 为空 = 每段都没识别到语音。
   failStt / failTts:识别 / 配音接口每次都返回 502 + error(和真实接口出错同形),演示「全部识别失败」「配音失败」。
   字幕时间轴:剪辑器 toSub 用 end 决定字幕盖到片段的哪里,所以 end 取该句的录音时长(或 sttDurations),不写死。 */

import type { Fetcher } from "@/app/prototypes/(v1.13)/hybrid-reel/canvas/fetcher";
import type { VoiceLine } from "../app/fixture/types";

export type FixtureFetchOpts = {
  voice: VoiceLine[];
  sttLines: string[];
  /** 每句字幕的时长(秒),与 sttLines 对应;不传则取同句录音的时长,再不行用 1.5 */
  sttDurations?: number[];
  shotVideos: string[];
  failShot: boolean;
  /** 自动字幕接口每次都失败(502) */
  failStt?: boolean;
  /** 配音接口每次都失败(502) */
  failTts?: boolean;
  /** 建任务后多久算生成完成;默认 3000ms(剪辑器每 5 秒查一次,所以实际约 5 秒出结果) */
  readyAfterMs?: number;
  /** 读本地文件;默认用全局 fetch(测试里注入) */
  load?: (url: string) => Promise<Blob>;
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

async function toBase64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function createFixtureFetch(opts: FixtureFetchOpts): Fetcher {
  const ready = opts.readyAfterMs ?? 3000;
  const load = opts.load ?? (async (url: string) => (await fetch(url)).blob());
  const tasks = new Map<string, { at: number; video: string }>();
  let made = 0;
  let stt = 0;

  const handler = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.startsWith("/api/hybrid-reel/video")) {
      const q = new URL(url, "http://x").searchParams;
      const id = q.get("id");
      if (!id) {
        if (opts.failShot) return json({ error: "The video model is busy right now (simulated) — try again." }, 502);
        const tid = `fixture-${(made += 1)}`;
        tasks.set(tid, { at: Date.now(), video: opts.shotVideos[(made - 1) % opts.shotVideos.length] });
        return json({ id: tid });
      }
      /* 任务表丢了(评审里重置/重新挂载后编辑器还在轮询旧任务)就当已完成,取文件给第一条 */
      const t = tasks.get(id);
      if (q.get("file")) return new Response(await load(t?.video ?? opts.shotVideos[0]));
      if (!t) return json({ status: "succeeded" });
      return json(Date.now() - t.at >= ready ? { status: "succeeded" } : { status: "running" });
    }
    if (url.startsWith("/api/hybrid-reel/tts")) {
      if (opts.failTts) return json({ error: "The speech service is busy right now (simulated) — try again." }, 502);
      const line = opts.voice.find((v) => v.text.trim() === String(body.text ?? "").trim()) ?? opts.voice[0];
      if (!line) return json({ error: "No recorded voice" }, 404);
      /* 模拟真实配音接口的耗时(约 2.5 秒),评审时看得到配音和同段字幕一起「生成中」 */
      await new Promise((r) => setTimeout(r, 2500));
      return json({ audio: await toBase64(await load(line.url)), duration: line.durationSec });
    }
    if (url.startsWith("/api/hybrid-reel/stt")) {
      if (opts.failStt) return json({ error: "The speech service is busy right now (simulated) — try again." }, 502);
      if (!opts.sttLines.length) return json({ utterances: [] });
      /* 轮流回放:评审可能在同一次挂载里跑两遍自动字幕 */
      const i = stt % opts.sttLines.length;
      stt += 1;
      const text = opts.sttLines[i];
      const end = opts.sttDurations?.[i] ?? opts.voice.find((v) => v.text.trim() === text.trim())?.durationSec ?? 1.5;
      return json({ utterances: [{ start: 0, end, text }] });
    }
    return new Response(await load(url));
  };
  return handler as Fetcher;
}
