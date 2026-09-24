/* BytePlus ModelArk · Dreamina Seedance 视频生成(AI 补拍)。和素材理解共用 BYTEPLUS_ARK_API_KEY。
   异步任务:POST /api/v3/contents/generations/tasks 建任务 → GET .../tasks/{id} 轮询 → content.video_url(临时链接,24h 内有效)。
   参数:ratio 21:9/16:9/4:3/1:1/3:4/9:16,duration 4–15 秒整数,resolution 480p/720p/1080p(1080p 仅标准版)。
   参考图用 role=reference_image,最多 9 张;含真人脸的参考图会被输入审核拦下。 */

const HOST = () => process.env.BYTEPLUS_ARK_HOST || "https://ark.ap-southeast.bytepluses.com";

/** 画布上的模型名 → ModelArk 模型 ID;不在表里的(如 Veo 3)前端继续走模拟 */
export const SEEDANCE_MODELS: Record<string, string> = {
  "Seedance 2.0": "dreamina-seedance-2-0-260128",
  "Seedance 2.0 Fast": "dreamina-seedance-2-0-fast-260128",
  "Seedance 2.5": "dreamina-seedance-2-5-260628",
};

const RATIOS = new Set(["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]);

function key() {
  const k = process.env.BYTEPLUS_ARK_API_KEY;
  if (!k) throw new Error("BYTEPLUS_ARK_API_KEY 未设置 —— 在 .env.local 里加上 ModelArk 的 API Key");
  return k;
}

async function ark(path: string, init?: RequestInit) {
  const res = await fetch(`${HOST()}/api/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", ...init?.headers },
  });
  const raw = await res.text();
  if (!res.ok) {
    let msg = raw.slice(0, 300);
    try {
      const e = JSON.parse(raw) as { error?: { code?: string; message?: string } };
      if (e.error) msg = `${e.error.code ?? ""} ${e.error.message ?? ""}`.trim();
    } catch {}
    throw new Error(`Seedance ${res.status}:${msg}`);
  }
  return JSON.parse(raw);
}

export type VideoRequest = {
  prompt: string;
  model?: string;
  ratio?: string;
  duration?: number;
  resolution?: string;
  withAudio?: boolean;
  /** data:image/...;base64 或公网 URL */
  images?: string[];
};

export async function createVideoTask(r: VideoRequest): Promise<string> {
  const prompt = r.prompt.trim();
  if (!prompt) throw new Error("Prompt 是空的");
  const model = SEEDANCE_MODELS[r.model ?? ""] ?? SEEDANCE_MODELS["Seedance 2.0"];
  const std = model === SEEDANCE_MODELS["Seedance 2.0"];
  const resolution = ["480p", "720p", "1080p"].includes(r.resolution ?? "") ? r.resolution! : "720p";
  const body = {
    model,
    content: [
      { type: "text", text: prompt },
      ...(r.images ?? []).slice(0, 9).map((url) => ({ type: "image_url", image_url: { url }, role: "reference_image" })),
    ],
    ratio: RATIOS.has(r.ratio ?? "") ? r.ratio : "9:16",
    duration: Math.min(15, Math.max(4, Math.ceil(r.duration ?? 5))),
    resolution: resolution === "1080p" && !std ? "720p" : resolution,
    generate_audio: r.withAudio !== false,
    watermark: false,
  };
  const data = (await ark("/contents/generations/tasks", { method: "POST", body: JSON.stringify(body) })) as { id?: string };
  if (!data.id) throw new Error("Seedance 没有返回任务 ID");
  return data.id;
}

export type VideoTask = {
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "expired";
  videoUrl?: string;
  duration?: number;
  ratio?: string;
  error?: string;
};

export async function getVideoTask(id: string): Promise<VideoTask> {
  const d = (await ark(`/contents/generations/tasks/${encodeURIComponent(id)}`)) as {
    status: VideoTask["status"];
    content?: { video_url?: string };
    duration?: number;
    ratio?: string;
    error?: { code?: string; message?: string } | null;
  };
  return {
    status: d.status,
    videoUrl: d.content?.video_url,
    duration: d.duration,
    ratio: d.ratio,
    error: d.error ? `${d.error.code ?? ""} ${d.error.message ?? ""}`.trim() : undefined,
  };
}
