"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, Upload, Play, Pause, Loader2, Sparkles, Film } from "lucide-react";

const BACKEND = "http://localhost:8899";

type ClipResult = { prompt: string; videoUrl: string; lastFrameUrl: string | null; firstFrameUsed: string };
type Phase = "idle" | "uploading" | "generating" | "done" | "error";

async function uploadImage(file: File, projectId: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("project_id", projectId);
  const r = await fetch(`${BACKEND}/upload`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "upload failed");
  return j.url as string;
}

async function genClip(prompt: string, imageUrl: string, duration: number): Promise<{ video_url: string; last_frame_url: string | null }> {
  const fd = new FormData();
  fd.append("prompt", prompt);
  fd.append("image_url", imageUrl);
  fd.append("duration", String(duration));
  const r = await fetch(`${BACKEND}/generate_consecutive_clip`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.error || "clip generation failed");
  return { video_url: j.video_url, last_frame_url: j.last_frame_url ?? null };
}

export default function ConsecutiveVideoDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([""]);
  const [duration, setDuration] = useState(5);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusText, setStatusText] = useState("");
  const [clips, setClips] = useState<ClipResult[]>([]);
  const [error, setError] = useState("");
  const [playIdx, setPlayIdx] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // 自动播放(autoPlay 属性会被策略挡,主动 play,失败降级静音)
  useEffect(() => {
    if (playIdx === null) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }, [playIdx]);

  const setPrompt = (i: number, val: string) => setPrompts((p) => p.map((x, idx) => (idx === i ? val : x)));
  const addPrompt = () => setPrompts((p) => [...p, ""]);
  const removePrompt = (i: number) => setPrompts((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const busy = phase === "uploading" || phase === "generating";
  const cleanPrompts = prompts.map((p) => p.trim()).filter(Boolean);
  const canGenerate = !!file && cleanPrompts.length > 0 && !busy;

  const run = useCallback(async () => {
    if (!file) return;
    setError(""); setClips([]); setPlayIdx(null);
    try {
      setPhase("uploading"); setStatusText("上传产品图…");
      const projectId = "consec" + Math.floor(Date.now() % 1e8).toString(36);
      const productUrl = await uploadImage(file, projectId);

      setPhase("generating");
      const results: ClipResult[] = [];
      let img = productUrl;
      for (let i = 0; i < cleanPrompts.length; i++) {
        setStatusText(`生成第 ${i + 1} / ${cleanPrompts.length} 段…(约 1-2 分钟/段)`);
        const res = await genClip(cleanPrompts[i], img, duration);
        results.push({ prompt: cleanPrompts[i], videoUrl: res.video_url, lastFrameUrl: res.last_frame_url, firstFrameUsed: img });
        setClips([...results]);
        if (!res.last_frame_url) { setStatusText("该段未返回尾帧,停止串联"); break; }
        img = res.last_frame_url; // 尾帧接下一段首帧
      }
      setPhase("done"); setStatusText(`完成,共 ${results.length} 段`);
      if (results.length) setPlayIdx(0);
    } catch (e: any) {
      setError(String(e?.message || e)); setPhase("error"); setStatusText("");
    }
  }, [file, cleanPrompts, duration]);

  const onEnded = () => {
    if (playIdx === null) return;
    if (playIdx + 1 < clips.length) setPlayIdx(playIdx + 1);
    else setPlayIdx(null);
  };
  const togglePlay = () => {
    if (playIdx !== null) { setPlayIdx(null); return; }
    if (clips.length) setPlayIdx(0);
  };

  return (
    <div className="min-h-[100dvh] bg-[#faf8f5] text-[#1a1a2e]">
      <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-8">
        <header className="mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff5e1a]">Consecutive Video · Demo</span>
          <h1 className="mt-1 font-[var(--font-display)] text-[26px] font-extrabold tracking-tight">连续视频生成</h1>
          <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-[#5b5b6b]">
            上传一张产品图,写几段分镜 prompt(每段一条)。点生成后,用 Seedance 2.0 的「连续生成」——上一段视频的最后一帧作为下一段的首帧,逐段串联,最后在下方播放器连贯播放。
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-[300px_1fr]">
          {/* 左:产品图 + 参数 */}
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#b0aeb8]">Product image</p>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <button
                onClick={() => fileInput.current?.click()}
                className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#dcd8d2] bg-white transition hover:border-[#ff5e1a]"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="product" className="size-full object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-[#9a9aa8]">
                    <Upload className="size-5 text-[#ff5e1a]" />
                    <span className="text-[12px] font-medium">点击上传产品图</span>
                  </span>
                )}
              </button>
            </div>
            <div>
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#b0aeb8]">每段时长</p>
              <div className="inline-flex rounded-lg border border-[#ececf1] bg-white p-0.5">
                {[5, 8, 10, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition ${duration === d ? "bg-[#ff5e1a] text-white" : "text-[#9a9aa8] hover:text-[#5b5b6b]"}`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#9a9aa8]">模型 Seedance 2.0 · 比例跟随产品图</p>
            </div>
            <button
              onClick={run}
              disabled={!canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff5e1a] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#ea5313] active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "生成中…" : `生成 ${cleanPrompts.length || ""} 段连续视频`}
            </button>
            {statusText ? <p className="text-center text-[12px] text-[#5b5b6b]">{statusText}</p> : null}
            {error ? <p className="rounded-lg border border-[#ff5e1a]/40 bg-[#ff5e1a]/10 px-3 py-2 text-[12.5px] text-[#1a1a2e]">生成失败:{error}</p> : null}
          </div>

          {/* 右:prompts + 播放器 */}
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#b0aeb8]">分镜 Prompts(每段一条,按顺序串联)</p>
                <button onClick={addPrompt} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[#ff5e1a] transition hover:bg-[#fff1ea]">
                  <Plus className="size-3.5" />加一段
                </button>
              </div>
              <div className="space-y-2">
                {prompts.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-2.5 w-5 shrink-0 text-right font-[var(--font-display)] text-[13px] font-bold tabular-nums text-[#c9c5be]">{i + 1}</span>
                    <textarea
                      value={p}
                      onChange={(e) => setPrompt(i, e.target.value)}
                      rows={2}
                      placeholder={i === 0 ? "第 1 段:镜头/动作描述,产品会作为首帧出现…" : "下一段:承接上一段最后画面的动作…"}
                      className="min-w-0 flex-1 resize-none rounded-lg border border-[#ececf1] bg-white px-3 py-2 text-[13.5px] leading-relaxed outline-none transition focus:border-[#ff5e1a]"
                    />
                    <button onClick={() => removePrompt(i)} disabled={prompts.length <= 1} className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-lg text-[#9a9aa8] transition hover:bg-[#f5f3f0] hover:text-[#1a1a2e] disabled:opacity-30">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 播放器 */}
            <div>
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#b0aeb8]">Result</p>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                {playIdx !== null && clips[playIdx] ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    key={playIdx}
                    ref={videoRef}
                    src={clips[playIdx].videoUrl}
                    autoPlay
                    playsInline
                    controls
                    onEnded={onEnded}
                    onError={onEnded}
                    className="size-full object-contain"
                  />
                ) : clips.length ? (
                  <button onClick={togglePlay} className="absolute inset-0 grid place-items-center bg-black/20 transition hover:bg-black/30">
                    <span className="grid size-14 place-items-center rounded-full bg-white/95 shadow-lg"><Play className="ml-0.5 size-6 fill-[#1a1a2e] text-[#1a1a2e]" /></span>
                  </button>
                ) : (
                  <div className="grid size-full place-items-center text-[13px] text-white/45">
                    {busy ? <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />{statusText}</span> : "生成后在这里连贯播放"}
                  </div>
                )}
              </div>
              {/* 分段 + 串联可视化 */}
              {clips.length ? (
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={togglePlay} className="flex items-center gap-1.5 rounded-lg bg-[#ff5e1a] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#ea5313]">
                    {playIdx !== null ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                    {playIdx !== null ? "暂停" : "连贯播放"}
                  </button>
                  <span className="text-[12px] text-[#9a9aa8]">{clips.length} 段 · 共 {clips.length * duration}s</span>
                </div>
              ) : null}
              {clips.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {clips.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setPlayIdx(i)}
                      className={"relative aspect-video w-[150px] shrink-0 overflow-hidden rounded-lg border transition " + (playIdx === i ? "border-[#ff5e1a] ring-2 ring-[#ff5e1a]/30" : "border-[#ececf1] hover:border-[#d8d5df]")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.firstFrameUsed} alt={`clip ${i + 1} first frame`} className="size-full object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">{String(i + 1).padStart(2, "0")}</span>
                      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-3 text-[9.5px] font-medium text-white">
                        <Film className="size-3" />clip
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              {clips.length ? (
                <p className="mt-2 text-[11px] leading-relaxed text-[#9a9aa8]">
                  每段缩略图 = 该段用的<b className="font-semibold text-[#5b5b6b]">首帧</b>(第 1 段=产品图,后续=上一段的尾帧),这就是「连续生成」的接续点。
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
