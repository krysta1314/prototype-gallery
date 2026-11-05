"use client";

/* Custom Avatar 工具页(入口:侧边栏 Avatar › Custom Avatar;spec 2026-11-04 §5)。版式同 Upscale Image(ToolLayout)。
   左栏 = 建分身的三步:① 拍摄素材(拍摄指引 + 上传 / 录制,30s–2min)② 授权声明(朗读屏幕上的一句话 → 人脸比对,通过才能提交)
   ③ 名字 + 可选「Also clone my voice」→「Create avatar」(扣积分,进入训练)。
   右侧 = 我的分身列表(名字 / 状态 / 创建时间;改名、删除要确认;训练好的可「Use in Product Avatar」)。
   分身数据和训练在外壳(useMyAvatars),训练完成在任何页面都会弹 toast;Product Avatar 的「My avatars」读同一份。
   录制是模拟的(不开摄像头 / 麦克风);人脸比对是 fixture(?outcome=fail 时第一次比对失败、重试通过)。 */

import { useEffect, useReducer, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Clock3, Film, Lightbulb, Loader2, Mic, Pencil, RotateCcw, ScanFace, ShieldCheck, Square, Trash2, Upload, Video, X, ArrowRight } from "lucide-react";
import type { ToolsApi } from "../tools/api";
import type { Wallet } from "../tools/jobs";
import { captureFrame, isVideoFile, probeVideo, VIDEO_TYPES } from "../tools/media";
import { formatClock } from "../video-resize/logic";
import type { Notify } from "../components/TopToast";
import { DemoTile, ToolEmptyDemo, FIELD, FieldLabel, ToolLayout, UploadDrop, ctaBtn, fileDropProps, ghostBtn, CtaCost } from "../components/ToolKit";
import type { AvatarStore } from "./useMyAvatars";
import {
  CONSENT_START,
  MAX_AVATAR_NAME,
  MAX_FOOTAGE_SECONDS,
  MIN_FOOTAGE_SECONDS,
  VOICE_CLONE_CREDITS,
  canSubmitAvatar,
  checkFootage,
  consentReduce,
  faceMatchPassed,
  formatCreated,
  nextAvatarName,
  trainCredits,
  type FootageCheck,
  type MyAvatar,
} from "./logic";
import { CONSENT_SENTENCE, SAMPLE_FOOTAGE, TRAINING_ETA } from "./fixture";

type Footage = { url: string; name: string; duration: number; poster: string | null; recorded?: boolean };

const ACCEPT_ATTR = VIDEO_TYPES.map((t) => `.${t}`).join(",");
const FOOTAGE_ERROR: Record<Exclude<FootageCheck, "ok">, string> = {
  "too-short": `This video is too short. We need at least ${MIN_FOOTAGE_SECONDS} seconds of you talking.`,
  "too-long": `This video is too long. Keep it under ${MAX_FOOTAGE_SECONDS / 60} minutes.`,
};
/** 模拟录制:真实 1 秒 = 录了 6 秒(不用真等 30 秒) */
const RECORD_SPEED = 6;

const newId = () => `ca-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function Step({ n, title, done, children, disabled }: { n: number; title: string; done?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <section aria-label={title} className={disabled ? "opacity-45" : ""} inert={disabled}>
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${done ? "bg-[#1A7F4B] text-white" : "bg-[#fff3ec] text-[#ff5e1a]"}`}
          aria-hidden="true"
        >
          {done ? <CircleCheck className="size-3.5" /> : n}
        </span>
        <h3 className="text-[13.5px] font-bold text-[#1a1a2e]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** 模拟摄像头录制:脸部取景框 + REC 计时;Stop 结束 */
function Recorder({ onStop, onCancel }: { onStop: (seconds: number) => void; onCancel: () => void }) {
  const [sec, setSec] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    start.current = performance.now();
    const id = window.setInterval(() => setSec(((performance.now() - start.current) / 1000) * RECORD_SPEED), 200);
    return () => window.clearInterval(id);
  }, []);
  const enough = sec >= MIN_FOOTAGE_SECONDS;
  return (
    <div className="max-w-[360px] space-y-2">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SAMPLE_FOOTAGE.poster} alt="" className="size-full object-cover opacity-90" />
        <div className="pointer-events-none absolute left-1/2 top-[44%] h-[62%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-white/80" />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white">
          <span className="size-2 animate-pulse rounded-full bg-[#ff3b30]" /> REC {formatClock(sec)}
        </span>
        <span className="absolute inset-x-0 bottom-2 text-center text-[11.5px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
          {enough ? "Looking good. Stop whenever you're ready." : `Keep talking… at least ${MIN_FOOTAGE_SECONDS}s`}
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onStop(Math.round(sec))} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1a1a2e] text-[13px] font-semibold text-white transition hover:bg-[#2c2c44]">
          <Square className="size-3.5 fill-current" /> Stop recording
        </button>
        <button type="button" onClick={onCancel} className={`${ghostBtn} h-9`}>
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-[#9a9bb0]">Recording is simulated in this prototype (sped up 6×).</p>
    </div>
  );
}

function StatusBadge({ a }: { a: MyAvatar }) {
  if (a.status === "training")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] px-2 py-[2px] text-[11px] font-semibold text-[#c2410c]">
        <Loader2 className="size-3 animate-spin" /> Training
      </span>
    );
  if (a.status === "ready") return <span className="rounded-full bg-[#E8F7EF] px-2 py-[2px] text-[11px] font-semibold text-[#166C40]">Ready</span>;
  return <span className="rounded-full bg-[#FFF0F0] px-2 py-[2px] text-[11px] font-semibold text-[#C22F32]">Failed</span>;
}

function AvatarRow({
  a,
  onRename,
  onDelete,
  onUse,
  onRetry,
}: {
  a: MyAvatar;
  onRename: (name: string) => void;
  onDelete: () => void;
  onUse: () => void;
  onRetry: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim()) onRename(draft);
    setDraft(null);
  };
  return (
    <li className="flex gap-3 rounded-2xl border border-[#ececf1] bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.image} alt="" className={`size-[72px] shrink-0 rounded-xl object-cover ${a.status === "training" ? "opacity-60" : ""}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          {draft !== null ? (
            <input
              autoFocus
              aria-label="Avatar name"
              value={draft}
              maxLength={MAX_AVATAR_NAME}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setDraft(null);
              }}
              className={`${FIELD} h-8 min-w-0 flex-1 px-2.5`}
            />
          ) : (
            <p className="truncate text-[14px] font-bold text-[#1a1a2e]" title={a.name}>
              {a.name}
            </p>
          )}
          <StatusBadge a={a} />
        </div>
        <p className="text-[12px] text-[#9a9bb0]">
          Created {formatCreated(a.createdAt)}
          {a.voice && " · Voice cloned"}
        </p>
        {a.status === "training" && (
          <p className="flex items-center gap-1 text-[12px] text-[#6a6b7b]">
            <Clock3 className="size-3.5" /> Usually ready in {TRAINING_ETA}. We&apos;ll let you know.
          </p>
        )}
        {a.status === "failed" && (
          <p role="alert" className="text-[12px] text-[#e5484d]">
            Training failed. Your credits have been refunded.
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {a.status === "ready" && (
            <button type="button" onClick={onUse} className={`${ghostBtn} h-8 border-[#ffbd99] text-[#c2410c] hover:border-[#ff5e1a] hover:bg-[#fffaf7]`}>
              Use in Product Avatar
            </button>
          )}
          {a.status === "failed" && (
            <button type="button" onClick={onRetry} className={`${ghostBtn} h-8`}>
              <RotateCcw className="size-3.5" /> Retry · {a.cost} credits
            </button>
          )}
          <button type="button" onClick={() => setDraft(a.name)} className={`${ghostBtn} h-8`} aria-label={`Rename ${a.name}`}>
            <Pencil className="size-3.5" /> Rename
          </button>
          <button type="button" onClick={onDelete} className={`${ghostBtn} h-8 hover:text-[#C22F32]`} aria-label={`Delete ${a.name}`}>
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      </div>
    </li>
  );
}

function ConfirmDelete({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/30 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-avatar-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-2xl bg-white p-5 text-[#1a1a2e] shadow-[0_16px_48px_rgba(26,26,46,0.22)]"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-[#FFF0F0] text-[#C22F32]">
          <Trash2 className="size-5" />
        </span>
        <h2 id="delete-avatar-title" className="mt-3 text-[16px] font-bold">
          Delete &ldquo;{name}&rdquo;?
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6a6b7b]">
          It can&apos;t be used in new videos after this, and its cloned voice is removed too. Videos you already made stay in your assets. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className="rounded-full border border-[#ececf1] px-4 py-2 text-[13px] font-semibold transition hover:bg-[#f6f5f8]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-[#e5484d] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#d13438]">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomAvatarTool({
  api,
  wallet,
  store,
  onUse,
  notify: say,
  onMenu,
  onInvite,
}: {
  api: ToolsApi;
  wallet: Wallet;
  store: AvatarStore;
  /** 「Use in Product Avatar」:外壳选中这个分身并切到 Product Avatar */
  onUse: (id: string) => void;
  notify: Notify;
  onMenu?: () => void;
  onInvite?: () => void;
}) {
  const { avatars, dispatch } = store;
  const [footage, setFootage] = useState<Footage | null>(null);
  const [recording, setRecording] = useState(false);
  const [consent, consentDispatch] = useReducer(consentReduce, CONSENT_START);
  const [name, setName] = useState<string | null>(null);
  const [cloneVoice, setCloneVoice] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<MyAvatar | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const check = useRef<AbortController | null>(null);
  /* 换 / 删素材(或离开)时,还在比对的结果作废 */
  useEffect(() => () => check.current?.abort(), [footage]);

  const footageCheck = footage ? checkFootage(footage.duration) : null;
  const shownName = name ?? nextAvatarName(avatars);
  const cost = trainCredits(cloneVoice);
  const canSubmit = canSubmitAvatar({ footage: footageCheck, consent: consent.step, name: shownName });

  const applyFootage = (f: Footage | null) => {
    setFootage(f);
    setRecording(false);
    consentDispatch({ type: "reset" });
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isVideoFile(file.name)) return say("This format isn't supported. Use MP4, MOV, WEBM or M4V.", "error");
    const url = URL.createObjectURL(file);
    const meta = await probeVideo(url);
    if (!meta) {
      URL.revokeObjectURL(url);
      return say("We couldn't read this video. Try another file.", "error");
    }
    const poster = await captureFrame(url, Math.min(1, meta.duration / 2));
    applyFootage({ url, name: file.name, duration: meta.duration, poster });
  };

  /* 授权声明:录完 → 人脸比对(fixture) */
  const stopStatement = () => {
    if (consent.step !== "recording") return;
    const attempt = consent.attempts + 1;
    consentDispatch({ type: "stop" });
    const ac = new AbortController();
    check.current?.abort();
    check.current = ac;
    api
      .run("face-match", { signal: ac.signal })
      .then(
        () => true,
        () => false,
      )
      .then((ok) => {
        if (ac.signal.aborted) return;
        consentDispatch({ type: "result", ok: faceMatchPassed(ok, attempt) });
      });
  };

  const submit = () => {
    if (!canSubmit || !footage) return;
    if (!wallet.charge(cost)) return;
    const avatar: MyAvatar = {
      id: newId(),
      name: shownName.trim().slice(0, MAX_AVATAR_NAME),
      status: "training",
      createdAt: Date.now(),
      image: footage.poster ?? SAMPLE_FOOTAGE.poster,
      voice: cloneVoice,
      cost,
    };
    dispatch({ type: "add", avatar });
    say(`Training "${avatar.name}". We'll let you know when it's ready.`, "success");
    applyFootage(null);
    setName(null);
    /* 手机单列时列表在表单下面:滚过去让人看到「Training」 */
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const retry = (a: MyAvatar) => {
    if (!wallet.charge(a.cost)) return;
    dispatch({ type: "retry", id: a.id });
  };

  /* ---------- 左栏 ---------- */
  const guide = (
    <ul className="space-y-1.5 rounded-xl bg-[#f7f8fa] p-3 text-[12.5px] leading-snug text-[#4a4b5c] ring-1 ring-[#ececf1]">
      {[
        { Icon: ScanFace, text: "Face the camera, head and shoulders in frame" },
        { Icon: Mic, text: `Talk naturally for ${MIN_FOOTAGE_SECONDS}s – ${MAX_FOOTAGE_SECONDS / 60} min` },
        { Icon: Lightbulb, text: "Even, soft light. No hats, sunglasses or other people" },
      ].map(({ Icon, text }) => (
        <li key={text} className="flex items-start gap-2">
          <Icon className="mt-px size-4 shrink-0 text-[#ff5e1a]" /> {text}
        </li>
      ))}
    </ul>
  );

  const footageSlot = recording ? (
    <Recorder
      onCancel={() => setRecording(false)}
      onStop={(sec) => applyFootage({ url: SAMPLE_FOOTAGE.url, name: "Recording", duration: sec, poster: SAMPLE_FOOTAGE.poster, recorded: true })}
    />
  ) : footage ? (
    <div className={`rounded-xl p-2.5 ring-1 ${footageCheck === "ok" ? "bg-[#f7f8fa] ring-[#ececf1]" : "bg-[#fff5f5] ring-[#ffd1d1]"}`}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {footage.poster ? <img src={footage.poster} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <span className="grid size-14 place-items-center rounded-lg bg-black text-white"><Film className="size-5" /></span>}
        <div className="min-w-0 flex-1 text-[12px]">
          <p className="truncate font-semibold text-[#1a1a2e]">{footage.name}</p>
          <p className="tabular-nums text-[#9a9bb0]">{formatClock(footage.duration)}</p>
          {footageCheck === "ok" && (
            <p className="flex items-center gap-1 font-medium text-[#166C40]">
              <CircleCheck className="size-3.5" /> Length looks good
            </p>
          )}
        </div>
        <button type="button" aria-label="Remove footage" onClick={() => applyFootage(null)} className="grid size-6 shrink-0 place-items-center self-start rounded-full bg-[#1a1a2e]/70 text-white transition hover:bg-[#1a1a2e]">
          <X className="size-3.5" />
        </button>
      </div>
      {footageCheck && footageCheck !== "ok" && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-[#C22F32]">
          <CircleAlert className="mt-px size-3.5 shrink-0" /> {FOOTAGE_ERROR[footageCheck]}
        </p>
      )}
    </div>
  ) : (
    /* 2026-11-05:上传用共用上传框(和 Upscale Image 同高同宽),现场录放在下面 */
    <div className="space-y-2">
      <UploadDrop
        icon={<Upload className="size-5" />}
        title="Upload a video"
        hint={`You talking to the camera, ${MIN_FOOTAGE_SECONDS}s – ${MAX_FOOTAGE_SECONDS / 60} min. Or drop it here.`}
        dragging={dragging}
        onPick={() => fileRef.current?.click()}
      />
      <button
        type="button"
        onClick={() => setRecording(true)}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#e1e3e9] bg-white text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fffaf7]"
      >
        <Video className="size-4 text-[#ff5e1a]" /> Record now
      </button>
    </div>
  );

  const consentBody =
    consent.step === "recording" ? (
      <button type="button" onClick={stopStatement} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1a1a2e] text-[13px] font-semibold text-white transition hover:bg-[#2c2c44]">
        <Square className="size-3.5 fill-current" /> I&apos;ve finished reading
      </button>
    ) : consent.step === "checking" ? (
      <p role="status" className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#f7f8fa] text-[13px] text-[#6a6b7b]">
        <Loader2 className="size-4 animate-spin text-[#ff5e1a]" /> Matching your face to the footage…
      </p>
    ) : consent.step === "passed" ? (
      <p role="status" className="flex items-center gap-1.5 rounded-lg bg-[#E8F7EF] px-3 py-2 text-[12.5px] font-semibold text-[#166C40]">
        <ShieldCheck className="size-4" /> Face matched. You&apos;re verified.
      </p>
    ) : consent.step === "failed" ? (
      <div role="alert" className="space-y-2 rounded-lg bg-[#fff5f5] p-2.5 ring-1 ring-[#ffd1d1]">
        <p className="flex items-start gap-1.5 text-[12.5px] leading-snug text-[#C22F32]">
          <CircleAlert className="mt-px size-3.5 shrink-0" />
          <span>
            <b className="font-semibold">We couldn&apos;t match your face to the footage.</b> Make sure it&apos;s the same person, face the camera in good light, and read the full sentence.
          </span>
        </p>
        <button type="button" onClick={() => consentDispatch({ type: "record" })} className={`${ghostBtn} h-8 w-full`}>
          <RotateCcw className="size-3.5" /> Record again
        </button>
      </div>
    ) : (
      <button type="button" onClick={() => consentDispatch({ type: "record" })} className={`${ghostBtn} h-9 w-full`}>
        <Mic className="size-4 text-[#ff5e1a]" /> Record statement
      </button>
    );

  const settings = (
    <>
      <Step n={1} title="Your footage" done={footageCheck === "ok"}>
        <div className="space-y-2.5">
          {guide}
          {footageSlot}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void pickFile(f);
          }}
        />
      </Step>

      <Step n={2} title="Confirm it's you" done={consent.step === "passed"} disabled={footageCheck !== "ok"}>
        <p className="mb-2 text-[12.5px] leading-snug text-[#6a6b7b]">Record yourself reading this out loud. We match your face to the footage so no one can make an avatar of someone else.</p>
        <blockquote
          className={`mb-2.5 rounded-xl border-l-[3px] px-3 py-2.5 text-[13.5px] font-medium leading-relaxed ${
            consent.step === "recording" ? "border-[#ff5e1a] bg-[#fff7f1] text-[#1a1a2e]" : "border-[#e1e3e9] bg-[#f7f8fa] text-[#4a4b5c]"
          }`}
        >
          {consent.step === "recording" && (
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#ff5e1a]">
              <span className="size-2 animate-pulse rounded-full bg-[#ff3b30]" /> Recording · read aloud
            </span>
          )}
          &ldquo;{CONSENT_SENTENCE}&rdquo;
        </blockquote>
        {consentBody}
      </Step>

      <Step n={3} title="Name and voice" disabled={consent.step !== "passed"}>
        <FieldLabel>Avatar Name</FieldLabel>
        <input
          aria-label="Avatar name"
          value={shownName}
          maxLength={MAX_AVATAR_NAME}
          onChange={(e) => setName(e.target.value)}
          className={`${FIELD} h-10 w-full px-3`}
        />
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#ececf1] p-3 transition hover:border-[#c9cad4]">
          <input type="checkbox" checked={cloneVoice} onChange={(e) => setCloneVoice(e.target.checked)} className="mt-0.5 size-4 accent-[#ff5e1a]" />
          <span className="min-w-0 text-[12.5px] leading-snug text-[#6a6b7b]">
            <span className="block text-[13px] font-semibold text-[#1a1a2e]">Also clone my voice · +{VOICE_CLONE_CREDITS} credits</span>
            Uses the voice from your footage. It shows up in the voice list of Product Avatar.
          </span>
        </label>
        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-snug text-[#9a9bb0]">
          <ShieldCheck className="mt-px size-3.5 shrink-0" /> Only people in this workspace can use your avatar. Delete it any time.
        </p>
      </Step>
    </>
  );

  const hint = footageCheck !== "ok" ? "Add footage of 30s – 2 min first." : consent.step !== "passed" ? "Confirm it's you first." : !shownName.trim() ? "Give your avatar a name." : undefined;
  const action = (
    <>
      <span title={hint} className="block">
        <button type="button" onClick={submit} disabled={!canSubmit} className={ctaBtn} aria-label={hint ? `Create avatar. ${hint}` : undefined}>Create avatar
          <CtaCost cost={footageCheck === "ok" ? cost : null} />
        </button>
      </span>
    </>
  );

  const results = !avatars.length ? (
    <ToolEmptyDemo title="An avatar that looks and sounds like you" body="Upload or record a short video of yourself, confirm it's you, and we'll train an avatar that looks and sounds like you.">
      <DemoTile kind="video" url="/prototypes/ai-tools/avatar-footage-sample.mp4" label="Your video" tall />
      <ArrowRight className="size-5 shrink-0 text-[#c9cad4]" aria-hidden="true" />
      <DemoTile kind="video" url="/prototypes/ai-tools/samples/avatar-result.mp4" label="Your avatar" tall />
    </ToolEmptyDemo>
  ) : (
    <div className="w-full pb-6">
      <ul className="grid gap-2.5 xl:grid-cols-2">
        {avatars.map((a) => (
          <AvatarRow
            key={a.id}
            a={a}
            onRename={(n) => dispatch({ type: "rename", id: a.id, name: n })}
            onDelete={() => setDeleting(a)}
            onUse={() => onUse(a.id)}
            onRetry={() => retry(a)}
          />
        ))}
      </ul>
    </div>
  );

  return (
    <ToolLayout
      title="Custom Avatar"
      subtitle="Turn yourself into an avatar that can present any product."
      settingsLabel="Create avatar"
      credits={wallet.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      dragging={dragging}
      dropProps={fileDropProps(setDragging, (f) => void pickFile(f))}
      settings={settings}
      action={action}
      results={results}
      resultsLabel="My avatars"
      resultsRef={listRef}
      resultsMeta={avatars.length ? <span className="text-[12px] text-[#9a9bb0]">{avatars.length} total</span> : undefined}
    >
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            dispatch({ type: "remove", id: deleting.id });
            say(`Deleted "${deleting.name}"`);
            setDeleting(null);
          }}
        />
      )}
    </ToolLayout>
  );
}
