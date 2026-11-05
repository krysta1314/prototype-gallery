"use client";

/* Product Avatar 工具页(入口:侧边栏 Avatar › Product Avatar;spec 2026-11-04 §4)。版式同 Upscale Image(ToolLayout)。
   左栏:商品图 1–3 张 → 选数字人(预设 UGC 库 / My avatars)→ 脚本(可「Write it for me」:卖点 → 15s / 30s)→ 声音 → 手持方式。
   主按钮两步:先「Preview first frame」(便宜,1 credit,可重做)→ 首帧和当前设置对得上才能「Generate video」(按脚本时长计积分)。
   右侧:首帧预览 + 视频结果(最新在上),结果卡带商品保真检查提示。
   合规:脚本里有第一人称证言说法时,脚本框下方提示「AI avatar — not a real customer testimonial」(检测见 logic.ts)。
   画面是 fixture(AvatarFrame 用数字人照片 + 商品图摆出构图),不调真实模型。 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Box, CircleAlert, Download, Hand, Package, Pause, Play, Plus, RotateCcw, ScanEye, Sparkles, TriangleAlert, UserRoundPlus, Volume2, WandSparkles, X, ArrowRight } from "lucide-react";
import type { ToolsApi } from "../tools/api";
import { jobsReduce, nowMs, type ToolJob, type Wallet } from "../tools/jobs";
import { useJobRunner } from "../tools/useJobRunner";
import type { Notify } from "../components/TopToast";
import { DemoTile, ToolEmptyDemo, FIELD, FieldLabel, RunningTile, Segmented, ToolLayout, ctaBtn, fileDropProps, ghostBtn, CtaCost } from "../components/ToolKit";
import { SourceUpload } from "../components/SourceUpload";
import { AvatarFrame } from "./AvatarFrame";
import {
  FRAME_CREDITS,
  MAX_PRODUCT_IMAGES,
  MAX_SCRIPT_CHARS,
  TESTIMONIAL_NOTICE,
  clonedVoices,
  defaultHold,
  detectTestimonials,
  scriptSeconds,
  usableAvatars,
  videoCredits,
  voiceNameOf,
  writeScript,
  type HoldStyle,
  type MyAvatar,
  type ProductCategory,
  type ScriptLength,
} from "./logic";
import { PRESET_AVATARS, PRESET_VOICES, VOICE_PREVIEW_LINE, type ProductImage } from "./fixture";

type Look = { avatarId: string; avatarImg: string; focus?: string; avatarName: string; product: string; productIds: string; hold: HoldStyle; variant: number };
type Input = { kind: "frame"; look: Look } | { kind: "video"; look: Look; script: string; seconds: number; voice: string };
type Job = ToolJob<Input>;

const IMAGE_TYPES = ["jpg", "jpeg", "png", "webp"];
const HOLDS: { value: HoldStyle; label: string; Icon: typeof Hand }[] = [
  { value: "hold", label: "Hold", Icon: Hand },
  { value: "show", label: "Show to camera", Icon: ScanEye },
  { value: "unbox", label: "Unbox", Icon: Box },
  { value: "use", label: "Use", Icon: Sparkles },
];
const LENGTHS = [
  { value: "15", label: "15s" },
  { value: "30", label: "30s" },
] as const;

const newId = () => `pa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const lookKey = (l: Pick<Look, "avatarId" | "productIds" | "hold">) => `${l.avatarId}|${l.productIds}|${l.hold}`;

/** 浏览器朗读试听(speechSynthesis);没有就返回 false */
function speak(pitch: number, rate: number, prefer: "female" | "male", index: number): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(VOICE_PREVIEW_LINE);
  const en = synth.getVoices().filter((v) => v.lang.startsWith("en"));
  const byGender = en.filter((v) => (prefer === "male" ? /male|daniel|alex|fred|david|guy|tom/i : /female|samantha|karen|victoria|zira|moira|tessa/i).test(v.name));
  const list = byGender.length ? byGender : en;
  if (list.length) u.voice = list[index % list.length];
  u.pitch = pitch;
  u.rate = rate;
  synth.speak(u);
  return true;
}

/** 结果视频(fixture):数字人画面 + 按脚本走的字幕;无声(原型) */
function VideoCard({ job, onRetry, onDownload, productThumb }: { job: Job; onRetry: () => void; onDownload: () => void; productThumb: string }) {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  if (job.input.kind !== "video") return null;
  const { look, script, seconds, voice } = job.input;
  const lines = script.split(/(?<=[.!?])\s+/).filter(Boolean);
  const line = lines[Math.min(lines.length - 1, Math.floor((t / seconds) * lines.length))];
  const toggle = () => {
    if (playing) {
      cancelAnimationFrame(raf.current);
      setPlaying(false);
      return;
    }
    const start = performance.now() - (t >= seconds ? 0 : t) * 1000;
    const tick = () => {
      const now = (performance.now() - start) / 1000;
      if (now >= seconds) {
        setT(seconds);
        setPlaying(false);
        return;
      }
      setT(now);
      raf.current = requestAnimationFrame(tick);
    };
    setPlaying(true);
    raf.current = requestAnimationFrame(tick);
  };
  return (
    <article className="flex flex-col gap-3 rounded-[22px] border border-[#ececf1] bg-white p-3 sm:flex-row" aria-label={`Product avatar video, ${seconds} seconds`}>
      <div className="relative mx-auto w-[min(100%,220px)] shrink-0 overflow-hidden rounded-xl">
        {job.status === "done" ? (
          <AvatarFrame avatar={look.avatarImg} focus={look.focus} product={look.product} hold={look.hold} variant={look.variant} playing={playing}>
            {line && t > 0 && (
              <p className="absolute inset-x-[6%] bottom-[16%] text-center text-[5.4cqw] font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{line}</p>
            )}
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className={`absolute inset-0 grid place-items-center transition ${playing ? "opacity-0 hover:opacity-100" : ""}`}
            >
              <span className="grid size-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
              </span>
            </button>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
              <div className="h-full bg-white" style={{ width: `${(t / seconds) * 100}%` }} />
            </div>
          </AvatarFrame>
        ) : (
          <div className="relative aspect-[9/16]">
            {job.status === "running" ? <RunningTile label="Generating video" /> : <div className="absolute inset-0 bg-[#fff7f5]" />}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="text-[14px] font-bold text-[#1a1a2e]">
            {look.avatarName} · {seconds}s
          </p>
          <p className="text-[12px] text-[#9a9bb0]">
            {voice} · {HOLDS.find((h) => h.value === look.hold)?.label}
          </p>
        </div>
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-[#6a6b7b]">{script}</p>
        {job.status === "running" && <p className="text-[12.5px] text-[#6a6b7b]">Animating your avatar. This takes a few minutes; you can leave this page.</p>}
        {job.status === "failed" && (
          <p role="alert" className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#e5484d]">
            <CircleAlert className="size-3.5" /> Generation failed. Your credits have been refunded.
            <button type="button" onClick={onRetry} className="font-semibold text-[#ff5e1a] hover:underline">
              Retry · {videoCredits(seconds)} credits
            </button>
          </p>
        )}
        {job.status === "done" && (
          <>
            {/* 商品保真检查 */}
            <div className="flex gap-2.5 rounded-xl bg-[#fff8eb] p-2.5 ring-1 ring-[#fde3b5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productThumb} alt="Your product photo" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-black/5" />
              <div className="min-w-0 text-[12px] leading-relaxed text-[#7a4a06]">
                <p className="font-semibold text-[#5c3700]">Check your product before posting</p>
                AI can blur small print or warp a logo. Compare the packaging text and logo with your photo.
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5">
              <button type="button" onClick={onDownload} className={`${ghostBtn} h-8`}>
                <Download className="size-3.5" /> Download
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function ProductAvatarTool({
  api,
  wallet,
  myAvatars,
  avatarId,
  onAvatar,
  onCreateAvatar,
  notify: say,
  onMenu,
  onInvite,
}: {
  api: ToolsApi;
  wallet: Wallet;
  /** Custom Avatar 建的分身(外壳共享) */
  myAvatars: MyAvatar[];
  avatarId: string;
  onAvatar: (id: string) => void;
  onCreateAvatar: () => void;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  const [products, setProducts] = useState<ProductImage[]>([]);
  const [productName, setProductName] = useState("");
  const [benefits, setBenefits] = useState("");
  const [writer, setWriter] = useState(false);
  const [length, setLength] = useState<ScriptLength>(15);
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState(PRESET_VOICES[0].id);
  const [hold, setHold] = useState<HoldStyle>("show");
  /** 商品品类:样例 = 美妆;自己上传的原型里不识别,当「其他」 */
  const [category, setCategory] = useState<ProductCategory>("other");
  const [tabPick, setTabPick] = useState<{ tab: "presets" | "mine"; forId: string } | null>(null);
  const [jobs, dispatch] = useReducer(jobsReduce<Input>, []);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* 选中的数字人:预设或我的分身;删掉 / 还没训练好的回到第一个预设 */
  const ready = usableAvatars(myAvatars);
  const mine = ready.find((a) => a.id === avatarId);
  const preset = PRESET_AVATARS.find((a) => a.id === avatarId);
  const avatar = mine
    ? { id: mine.id, name: mine.name, image: mine.image, focus: "50% 35%" }
    : preset
      ? { id: preset.id, name: preset.name, image: preset.image, focus: preset.focus }
      : { ...PRESET_AVATARS[0] };
  const tab = tabPick && tabPick.forId === avatarId ? tabPick.tab : mine ? "mine" : "presets";

  const cloned = clonedVoices(myAvatars);
  const voices = [...PRESET_VOICES.map((v) => ({ id: v.id, name: v.name, desc: v.desc })), ...cloned.map((a) => ({ id: `clone-${a.id}`, name: voiceNameOf(a), desc: "Cloned voice" }))];
  const voice = voices.find((v) => v.id === voiceId) ?? voices[0];

  const hits = useMemo(() => detectTestimonials(script), [script]);
  const seconds = scriptSeconds(script);

  const current: Look | null = products.length
    ? {
        avatarId: avatar.id,
        avatarImg: avatar.image,
        focus: avatar.focus,
        avatarName: avatar.name,
        product: products[0].url,
        productIds: products.map((p) => p.id).join(","),
        hold,
        variant: 0,
      }
    : null;

  const frames = jobs.filter((j) => j.input.kind === "frame");
  const lastFrame = frames[frames.length - 1];
  const frameRunning = lastFrame?.status === "running";
  const frameReady = lastFrame?.status === "done" && current && lookKey(lastFrame.input.look) === lookKey(current) ? lastFrame : null;
  const frameStale = lastFrame?.status === "done" && !frameReady;
  const videos = jobs.filter((j) => j.input.kind === "video").reverse();

  useJobRunner({
    jobs,
    api,
    task: (j) => (j.input.kind === "frame" ? "avatar-frame" : "avatar-video"),
    onDone: (j) => {
      dispatch({ type: "done", id: j.id });
      if (j.input.kind === "video") say("Your product avatar video is ready", "success");
    },
    onFail: (j) => {
      dispatch({ type: "fail", id: j.id });
      wallet.refund(j.cost);
      say(j.input.kind === "frame" ? "Couldn't create the preview. Your credit has been refunded." : "Video generation failed. Your credits have been refunded.", "error");
    },
  });

  /* ---------- 商品图 ---------- */
  const addFiles = (files: File[]) => {
    const ok = files.filter((f) => IMAGE_TYPES.includes(f.name.split(".").pop()?.toLowerCase() ?? ""));
    if (ok.length < files.length) say("Use JPG, PNG or WEBP images.", "error");
    const room = MAX_PRODUCT_IMAGES - products.length;
    if (ok.length > room) say(`Up to ${MAX_PRODUCT_IMAGES} product images.`, "error");
    const add = ok.slice(0, Math.max(0, room)).map((f) => ({ id: newId(), url: URL.createObjectURL(f), name: f.name }));
    if (!add.length) return;
    if (!products.length) {
      setCategory("other");
      setHold(defaultHold("other"));
    }
    setProducts((p) => [...p, ...add]);
  };

  const writeForMe = () => {
    const text = writeScript({ product: productName, benefits: benefits.split(/\n|;/), length });
    setScript(text);
    setWriter(false);
    say(`Wrote a ${length}s script. Edit it however you like.`, "success");
  };

  const preview = (variant: number) => {
    if (!current || frameRunning) return;
    if (!wallet.charge(FRAME_CREDITS)) return;
    dispatch({ type: "start", now: nowMs(), jobs: [{ id: newId(), batch: "frame", cost: FRAME_CREDITS, input: { kind: "frame", look: { ...current, variant } } }] });
  };

  const generate = () => {
    if (!frameReady || frameReady.input.kind !== "frame" || !seconds) return;
    const cost = videoCredits(seconds);
    if (!wallet.charge(cost)) return;
    dispatch({
      type: "start",
      now: nowMs(),
      jobs: [{ id: newId(), batch: newId(), cost, input: { kind: "video", look: frameReady.input.look, script: script.trim(), seconds, voice: voice.name } }],
    });
  };

  const retry = (j: Job) => {
    if (!wallet.charge(j.cost)) return;
    dispatch({ type: "restart", id: j.id, now: nowMs() });
  };

  const previewVoice = (id: string) => {
    const i = PRESET_VOICES.findIndex((v) => v.id === id);
    if (i < 0) return say("Cloned voice previews aren't available in this prototype.");
    const v = PRESET_VOICES[i];
    if (!speak(v.pitch, v.rate, v.prefer, i)) say("Voice preview isn't available in this browser.");
  };

  /* ---------- 左栏 ---------- */
  const productSlot = products.length ? (
    <div className="grid max-w-[360px] grid-cols-3 gap-2">
      {products.map((p, i) => (
        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f8fa] ring-1 ring-[#ececf1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.name} className="size-full object-cover" />
          {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-black/55 px-1.5 py-px text-[10px] font-semibold text-white">Main</span>}
          <button
            type="button"
            aria-label={`Remove ${p.name}`}
            onClick={() => setProducts((l) => l.filter((x) => x.id !== p.id))}
            className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-[#1a1a2e]/70 text-white transition hover:bg-[#1a1a2e]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {products.length < MAX_PRODUCT_IMAGES && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid aspect-square place-items-center rounded-xl border border-[#e1e3e9] bg-[#fafafb] text-[#9a9bb0] transition hover:border-[#ffbd99] hover:text-[#ff5e1a]"
          aria-label="Add product image"
        >
          <Plus className="size-5" />
        </button>
      )}
    </div>
  ) : (
    <SourceUpload
      kinds={["image"]}
      icon={<Package className="size-4" />}
      title="Add product photos"
      hint="1–3 images. A plain white background works best."
      label="Product"
      multiple
      dragging={dragging}
      onFiles={addFiles}
    />
  );

  const avatarTile = (a: { id: string; name: string; image: string; focus?: string; sub: string; disabled?: boolean }) => {
    const on = a.id === avatar.id;
    return (
      <button
        key={a.id}
        type="button"
        role="radio"
        aria-checked={on}
        disabled={a.disabled}
        onClick={() => onAvatar(a.id)}
        className={`group relative overflow-hidden rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:cursor-not-allowed ${
          on ? "ring-2 ring-[#ff5e1a]" : "ring-1 ring-[#ececf1] hover:ring-[#c9cad4]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.image} alt="" className={`aspect-[3/4] w-full object-cover ${a.disabled ? "opacity-40 grayscale" : ""}`} style={{ objectPosition: a.focus }} />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4">
          <span className="block truncate text-[11.5px] font-semibold text-white">{a.name}</span>
          <span className="block truncate text-[10px] text-white/75">{a.sub}</span>
        </span>
      </button>
    );
  };

  const training = myAvatars.filter((a) => a.status === "training");
  const avatarPicker = (
    <div>
      <FieldLabel>Avatar</FieldLabel>
      <Segmented
        label="Avatar library"
        size="sm"
        value={tab}
        options={[
          { value: "presets", label: "UGC avatars" },
          { value: "mine", label: `My avatars${ready.length ? ` (${ready.length})` : ""}` },
        ]}
        onChange={(v) => setTabPick({ tab: v, forId: avatarId })}
      />
      <div role="radiogroup" aria-label="Choose an avatar" className="mt-2.5 grid max-w-[520px] grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4">
        {tab === "presets"
          ? PRESET_AVATARS.map((a) => avatarTile({ ...a, sub: a.tag.split(" · ")[0] }))
          : [
              ...ready.map((a) => avatarTile({ id: a.id, name: a.name, image: a.image, focus: "50% 35%", sub: a.voice ? "With voice" : "Custom" })),
              ...training.map((a) => avatarTile({ id: a.id, name: a.name, image: a.image, focus: "50% 35%", sub: "Training…", disabled: true })),
              <button
                key="new"
                type="button"
                onClick={onCreateAvatar}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border border-[#e1e3e9] bg-[#fafafb] px-1 text-center text-[11px] font-semibold text-[#6a6b7b] transition hover:border-[#ffbd99] hover:text-[#ff5e1a]"
              >
                <UserRoundPlus className="size-4" />
                Create avatar
              </button>,
            ]}
      </div>
      {tab === "mine" && !ready.length && (
        <p className="mt-2 text-[12px] leading-relaxed text-[#9a9bb0]">
          {training.length ? "Your avatar is still training. It shows up here when it's ready." : "Turn yourself into an avatar in Custom Avatar. It takes a short video and a few minutes."}
        </p>
      )}
    </div>
  );

  const settings = (
    <>
      <div>
        <FieldLabel hint={products.length ? `${products.length}/${MAX_PRODUCT_IMAGES}` : undefined}>Product</FieldLabel>
        {productSlot}
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_TYPES.map((t) => `.${t}`).join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            const f = Array.from(e.target.files ?? []);
            e.target.value = "";
            addFiles(f);
          }}
        />
      </div>

      {avatarPicker}

      <div>
        <FieldLabel hint={seconds ? `≈ ${seconds}s` : undefined}>Script</FieldLabel>
        <div className="mb-2 flex items-center gap-2">
          <button type="button" onClick={() => setWriter((w) => !w)} aria-expanded={writer} className={`${ghostBtn} h-8`}>
            <WandSparkles className="size-3.5 text-[#ff5e1a]" /> Write it for me
          </button>
        </div>
        {writer && (
          <div className="mb-2.5 space-y-2 rounded-xl bg-[#f7f8fa] p-3 ring-1 ring-[#ececf1]">
            <input aria-label="Product name" placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} className={`${FIELD} h-9 w-full px-3`} />
            <textarea
              aria-label="Selling points"
              placeholder={"Selling points, one per line\ne.g. fades dark spots in four weeks"}
              rows={3}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className={`${FIELD} block w-full resize-none px-3 py-2 leading-snug`}
            />
            <div className="flex items-center gap-2">
              <div className="w-[120px]">
                <Segmented label="Script length" size="sm" value={String(length) as "15" | "30"} options={LENGTHS} onChange={(v) => setLength(Number(v) as ScriptLength)} />
              </div>
              <button
                type="button"
                onClick={writeForMe}
                disabled={!productName.trim() && !benefits.trim()}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1a1a2e] px-3 text-[12.5px] font-semibold text-white transition hover:bg-[#2c2c44] disabled:opacity-40"
              >
                {script.trim() ? "Rewrite" : "Write script"}
              </button>
            </div>
            <p className="text-[11.5px] text-[#9a9bb0]">Free. Replaces what&apos;s in the script box.</p>
          </div>
        )}
        <textarea
          aria-label="Script"
          aria-describedby={hits.length ? "testimonial-notice" : undefined}
          placeholder="What should your avatar say? Keep it short and talk to the viewer."
          rows={5}
          maxLength={MAX_SCRIPT_CHARS}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className={`${FIELD} block w-full resize-none px-3 py-2.5 leading-relaxed`}
        />
        {hits.length > 0 && (
          <div id="testimonial-notice" role="note" className="mt-2 flex gap-2 rounded-xl bg-[#fff8eb] p-2.5 text-[12px] leading-relaxed text-[#7a4a06] ring-1 ring-[#fde3b5]">
            <TriangleAlert className="mt-px size-4 shrink-0 text-[#d97706]" />
            <div>
              <p className="font-semibold text-[#5c3700]">{TESTIMONIAL_NOTICE}</p>
              Lines like {hits.slice(0, 3).map((h, i) => (
                <span key={h.index}>
                  {i > 0 && ", "}&ldquo;<b className="font-semibold">{h.phrase}</b>&rdquo;
                </span>
              ))}{" "}
              sound like a real customer&apos;s experience. Ads must not present an AI avatar as a real customer (FTC). Rewrite them, or label the video as AI when you post.
            </div>
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Voice</FieldLabel>
        <div role="radiogroup" aria-label="Voice" className="space-y-1.5">
          {voices.map((v) => {
            const on = v.id === voice.id;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${on ? "border-[#ff5e1a] bg-[#fffaf7]" : "border-[#ececf1] hover:border-[#c9cad4]"}`}
              >
                <button type="button" role="radio" aria-checked={on} onClick={() => setVoiceId(v.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none">
                  <span className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${on ? "border-[#ff5e1a]" : "border-[#c9cad4]"}`}>
                    {on && <span className="size-1.5 rounded-full bg-[#ff5e1a]" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[#1a1a2e]">{v.name}</span>
                    <span className="block truncate text-[11.5px] text-[#9a9bb0]">{v.desc}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => previewVoice(v.id)}
                  aria-label={`Preview ${v.name}`}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-[#6a6b7b] transition hover:bg-[#f0f1f4] hover:text-[#ff5e1a]"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel hint={products.length && hold === defaultHold(category) ? (category === "beauty" ? "Suggested for beauty" : "Suggested") : undefined}>
          How They Hold It
        </FieldLabel>
        <div role="radiogroup" aria-label="Holding style" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {HOLDS.map(({ value, label, Icon }) => {
            const on = value === hold;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setHold(value)}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                  on ? "border-[#ff5e1a] bg-[#fffaf7] text-[#1a1a2e]" : "border-[#ececf1] text-[#4a4b5c] hover:border-[#c9cad4]"
                }`}
              >
                <Icon className={`size-4 ${on ? "text-[#ff5e1a]" : "text-[#9a9bb0]"}`} /> {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  /* ---------- 主按钮:先首帧,再视频 ---------- */
  const videoHint = !script.trim() ? "Write a script first." : undefined;
  const action = frameReady ? (
    <>
      <span title={videoHint} className="block">
        <button type="button" onClick={generate} disabled={!!videoHint} className={ctaBtn} aria-label={videoHint ? `Generate video. ${videoHint}` : undefined}>Generate video
          <CtaCost cost={seconds ? videoCredits(seconds) : null} />
        </button>
      </span>
    </>
  ) : (
    <>
      <span title={!products.length ? "Add a product photo first." : undefined} className="block">
        <button type="button" onClick={() => preview(frames.length)} disabled={!products.length || frameRunning} className={ctaBtn}>{frameRunning ? "Creating preview…" : "Preview first frame"}
          <CtaCost cost={products.length ? FRAME_CREDITS : null} />
        </button>
      </span>
    </>
  );

  /* ---------- 右侧 ---------- */
  const shownFrame = lastFrame?.input.kind === "frame" ? lastFrame : null;
  const results = !products.length && !videos.length ? (
    <ToolEmptyDemo title="Your product, in an avatar's hands" body="Add a product photo and pick an avatar. Preview the first frame for 1 credit, then generate the video.">
      <div className="flex flex-col gap-3">
        <DemoTile kind="image" url="/prototypes/mcp-skill-showcase/aurelia-ecom.jpg" label="Product" />
        <DemoTile kind="image" url="/prototypes/asset-library/avatars/avatar-01.png" label="Avatar" />
      </div>
      <ArrowRight className="size-5 shrink-0 text-[#c9cad4]" aria-hidden="true" />
      <DemoTile kind="image" url="/prototypes/mcp-skill-showcase/avatar-ugc-product-review.jpg" label="Result" tall />
    </ToolEmptyDemo>
  ) : (
    <div className="w-full space-y-4 pb-6">
      <section aria-label="First frame" className="rounded-[22px] border border-[#ececf1] bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative mx-auto w-[min(100%,220px)] shrink-0 overflow-hidden rounded-xl sm:mx-0">
            {frameRunning ? (
              <div className="relative aspect-[9/16]">
                <RunningTile label="Generating" />
              </div>
            ) : shownFrame && shownFrame.status === "done" && shownFrame.input.kind === "frame" ? (
              <AvatarFrame {...frameProps(shownFrame.input.look)} dim={frameStale} />
            ) : current ? (
              <AvatarFrame avatar={current.avatarImg} focus={current.focus} product={null} hold={hold} dim>
                <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center text-[12.5px] font-semibold text-[#4a4b5c]">Preview shows {avatar.name} holding your product</span>
              </AvatarFrame>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-[14px] font-bold text-[#1a1a2e]">First frame</h3>
            {frameReady ? (
              <p className="text-[12.5px] leading-relaxed text-[#6a6b7b]">This is how your video opens. Happy with it? Generate the video. Not quite? Redo the frame for {FRAME_CREDITS} credit.</p>
            ) : frameStale ? (
              <p className="text-[12.5px] leading-relaxed text-[#b45309]">You changed the product, avatar or holding style. Preview the first frame again before generating.</p>
            ) : shownFrame?.status === "failed" ? (
              <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-[#e5484d]">
                <CircleAlert className="size-3.5" /> Couldn&apos;t create the preview. Your credit has been refunded.
              </p>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-[#6a6b7b]">Check the pose and how the product looks before you spend credits on the video. Script and voice can still change after this.</p>
            )}
            {(frameReady || shownFrame?.status === "failed") && (
              <div className="mt-auto flex flex-wrap gap-1.5">
                <button type="button" onClick={() => preview(frames.length)} disabled={frameRunning} className={`${ghostBtn} h-8`}>
                  <RotateCcw className="size-3.5" /> {shownFrame?.status === "failed" ? "Retry" : "Redo frame"} · {FRAME_CREDITS} credit
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {videos.length > 0 && (
        <section aria-label="Videos" className="space-y-2.5">
          <h3 className="px-1 text-[13.5px] font-bold text-[#1a1a2e]">Videos</h3>
          {videos.map((j) => (
            <VideoCard
              key={j.id}
              job={j}
              productThumb={j.input.look.product}
              onRetry={() => retry(j)}
              onDownload={() => say("Downloading isn't available in this prototype.")}
            />
          ))}
        </section>
      )}
    </div>
  );

  return (
    <ToolLayout
      title="Product Avatar"
      subtitle="An AI presenter holds, shows and talks about your product."
      settingsLabel="Product avatar settings"
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      dragging={dragging}
      dropProps={{
        ...fileDropProps(setDragging, () => {}),
        onDrop: (e: React.DragEvent) => {
          if (!Array.from(e.dataTransfer.types).includes("Files")) return;
          e.preventDefault();
          setDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        },
      }}
      settings={settings}
      action={action}
      results={results}
      resultsLabel="Preview"
    />
  );
}

const frameProps = (l: Look) => ({ avatar: l.avatarImg, focus: l.focus, product: l.product, hold: l.hold, variant: l.variant });
