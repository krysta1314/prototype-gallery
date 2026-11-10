"use client";

/* Upscale Image 工具页(入口:侧边栏 Image › Upscale Image)。版式参照 Freepik / Krea 的放大工具:
   左栏 = 标题 + 上传位 + 参数面板(UpscalePanel)+ 预计积分 + Upscale;右侧 = 结果列表(最新在上),
   每单一张卡:处理中 / 结果(ResultCard)/ 失败 + Retry。状态机在 store.ts。
   jobs + 余额写 sessionStorage(JOBS_KEY),离开再回来 running 的任务接着等结果,不重新扣费。
   外壳(侧边栏 + toast)在 ProductApp;这里只管顶栏和工具区。
   开发原型和评审原型共用;评审原型传 persist={false}(不读写 sessionStorage)。 */

import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { checkCredits } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { DOWNLOAD_FAILED } from "@/app/prototypes/(v1.12)/hybrid-reel-agent/app/download";
import { CANVAS_KEY, type CanvasPayload } from "./canvasProject";
import { UPSCALE_ERROR_TEXT, UpscaleError, type UpscaleApi, type UpscaleSource } from "./api";
import { ACCEPTED_TYPES, DEFAULT_PARAMS, isAcceptedFile, outputSize } from "./logic";
import { JOBS_KEY, initialState, jobCost, parseSaved, reduce, serialize, type Job, type UpscaleState } from "./store";
import { CompareSlider, RESULT_MAX_H, ResultCard } from "./components/ResultCard";
import type { Notify } from "./components/TopToast";
import { downloadWithProgress, resultFileName } from "./files";
import { UpscalePanel } from "./components/UpscalePanel";
import { MAX_MB, SourceUpload, sizeProblem } from "./components/SourceUpload";
import { ConfirmDeleteDialog, NotEnoughCreditsDialog, useRememberedSettings, ToolLayout, ctaBtn, fileDropProps, CtaCost } from "./components/ToolKit";
import { UploadedCard } from "./components/UploadedCard";
import { useMediaPreview } from "./components/MediaPreview";
import { ShareButton } from "./components/TeamSharing";
import { unshareResult } from "./components/sharing";
import { ToolGuide } from "./components/ToolGuide";
import { UPSCALE_GUIDE } from "./seo/content";
import type { ToolKey } from "./sidebarMenus";

const UNSUPPORTED = "This format isn't supported. Use JPG, PNG, WEBP, GIF, AVIF or HEIC.";
const UNREADABLE = "We couldn't read this image. Try another file.";
const NO_IMAGE_HINT = "Upload an image to upscale.";
const ACCEPT_ATTR = ACCEPTED_TYPES.map((t) => `.${t}`).join(",");
/** 小图转成 data URL,刷新后结果卡的 Before 还能显示;大图用 blob URL(sessionStorage 放不下) */
const DATA_URL_MAX_BYTES = 1_500_000;

const fmt = (n: number) => n.toLocaleString("en-US");
const paramLabel = (j: Job) => (j.params.mode === "factor" ? `${j.params.factor}x` : j.params.target);
/** 结果卡标题行的参数：和左栏同名(Upscale Mode / Factor 或 Target Resolution / Noise Scale / Format) */
const paramSummary = (j: Job) =>
  [j.params.mode === "factor" ? `Factor ${j.params.factor}x` : `Target ${j.params.target}`, `Noise Scale ${j.params.noiseScale}`, j.params.format.toUpperCase()].join(" · ");
/** 事件里取当前时间(提交 / 重试的开始时间) */
const nowMs = () => Date.now();
export const newId = () => `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** 载入图片读原始宽高;读不出来(浏览器解不了,如 Chrome 里的 HEIC)返回 null */
function naturalSize(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0 ? { width: img.naturalWidth, height: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function UpscaleTool({
  api,
  notify: say,
  initial,
  persist = true,
  onOpenCanvas,
  balance,
  onBalance,
  onMenu,
  onInvite,
  onOpenTool,
  showGuide = true,
}: {
  api: UpscaleApi;
  /** 顶部 toast(外壳 ProductApp 管) */
  notify: Notify;
  initial?: Partial<UpscaleState>;
  /** false = 不读写 sessionStorage(评审原型) */
  persist?: boolean;
  /** 结果图已写进 CANVAS_KEY 之后怎么进画布;不传就跳开发版画布页 */
  onOpenCanvas?: () => void;
  /** 外壳钱包的余额(别的工具页扣 / 退了积分,这里跟着同步) */
  balance?: number;
  /** 余额变了告诉外壳(首页顶栏同步显示) */
  onBalance?: (n: number) => void;
  /** 手机宽度顶栏的菜单按钮(打开侧边栏抽屉) */
  onMenu?: () => void;
  /** 顶栏 Invite(原型里出 Coming soon) */
  onInvite?: () => void;
  /** 空状态内容区「Related tools」点了在外壳里切到那个工具页;不传就按链接整页跳 */
  onOpenTool?: (tool: ToolKey) => void;
  /** 外壳会在别的工具页里也预先挂着这一页(藏起来):这时不输出 Guide,免得别的工具页源码里多出一份 Upscale 的落地页和 H1 */
  showGuide?: boolean;
}) {
  const router = useRouter();
  const [s, dispatch] = useReducer(reduce, initial, (i) => initialState(i));
  const [credits, setCredits] = useState<{ needed: number; balance: number } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [downloads, setDownloads] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const persisted = persist;
  const [confirmDel, setConfirmDel] = useState<Job | null>(null);
  const preview = useMediaPreview();
  /* 记住上次的参数(没有记录就用默认值) */
  useRememberedSettings("upscale-image", s.params, (p) => dispatch({ type: "setParams", params: { ...DEFAULT_PARAMS, ...p } }), persisted);

  /* 外壳的余额变了(其他工具页扣费 / 退款)→ 同步进来;要放在 hydrate 之前 */
  useEffect(() => {
    if (balance !== undefined) dispatch({ type: "syncBalance", balance });
  }, [balance]);

  /* 读回上次的 jobs + 余额(只在开发原型;评审原型摆的是 initial) */
  useEffect(() => {
    if (!persisted) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(JOBS_KEY);
    } catch {
      /* 存储不可用:当没有记录 */
    }
    const saved = parseSaved(raw);
    if (saved) dispatch({ type: "hydrate", jobs: saved.jobs, balance: saved.balance });
  }, [persisted]);

  /* jobs / 余额一变就写回;第一次运行跳过,免得在 hydrate 之前把空状态写进去 */
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (!persisted) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      sessionStorage.setItem(JOBS_KEY, serialize(s));
    } catch {
      /* 放不下(大图 data URL)就算了,不影响当前页面 */
    }
  }, [persisted, s]);

  /* 只把「本页自己改了余额」(扣费 / 退款 / 读回存档)推给外壳。
     刚挂载或刚换成当前工作区时不推 —— 那时 s.balance 还是旧值，推出去会盖掉外壳里新工作区的余额(切账号时积分来回跳) */
  const lastBalance = useRef<number | null>(null);
  useEffect(() => {
    const prev = lastBalance.current;
    lastBalance.current = s.balance;
    if (prev === null || prev === s.balance || s.balance === balance) return;
    onBalance?.(s.balance);
  }, [onBalance, s.balance, balance]);

  /* 跑 running 的任务:每个 job 的每次开跑(id + startedAt)只调一次 api。
     刷新回来的 running job 也走这里 —— 再调一次 api 等结果,不扣费(扣费只在 submit / retry) */
  const inflight = useRef(new Map<string, AbortController>());
  useEffect(() => {
    for (const j of s.jobs) {
      if (j.status !== "running") continue;
      const key = `${j.id}:${j.startedAt}`;
      if (inflight.current.has(key)) continue;
      const ac = new AbortController();
      inflight.current.set(key, ac);
      api
        .upscale(j.source, j.params, { signal: ac.signal })
        .then((result) => dispatch({ type: "succeed", id: j.id, result }))
        .catch((e: unknown) => {
          if (ac.signal.aborted) return;
          dispatch({ type: "fail", id: j.id, kind: e instanceof UpscaleError ? e.kind : "fail" });
        })
        .finally(() => {
          /* 只删自己的;同 key 已换成新的 controller(StrictMode 重挂载)就别动 */
          if (inflight.current.get(key) === ac) inflight.current.delete(key);
        });
    }
  }, [s.jobs, api]);
  useEffect(() => {
    const map = inflight.current;
    return () => {
      map.forEach((ac) => ac.abort());
      map.clear();
    };
  }, []);

  /* 新任务提交时结果区回到顶部(最新的在最上面) */
  const jobCount = s.jobs.length;
  useEffect(() => {
    if (jobCount) resultsRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [jobCount]);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isAcceptedFile(file.name)) return say(UNSUPPORTED, "error");
    const tooBig = sizeProblem(file, "image");
    if (tooBig) return say(tooBig, "error");
    let url: string;
    try {
      url = file.size <= DATA_URL_MAX_BYTES ? await readAsDataUrl(file) : URL.createObjectURL(file);
    } catch {
      return say(UNREADABLE, "error");
    }
    const size = await naturalSize(url);
    if (!size) {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      return say(UNREADABLE, "error");
    }
    dispatch({ type: "setSource", source: { url, width: size.width, height: size.height, name: file.name } });
  };

  const cost = s.source ? jobCost(s.source, s.params) : null;

  const submit = () => {
    if (!s.source || cost === null) return;
    const check = checkCredits(s.balance, cost);
    if (!check.ok) return setCredits({ needed: check.needed, balance: check.balance });
    dispatch({ type: "submit", id: newId(), now: nowMs() });
  };

  const retry = (j: Job) => {
    const check = checkCredits(s.balance, j.cost);
    if (!check.ok) return setCredits({ needed: check.needed, balance: check.balance });
    dispatch({ type: "retry", id: j.id, now: nowMs() });
  };

  const download = async (j: Job) => {
    const r = j.result;
    if (!r || downloads[j.id] !== undefined) return;
    setDownloads((d) => ({ ...d, [j.id]: 0 }));
    const ok = await downloadWithProgress(r.url, resultFileName(r), (pct) => setDownloads((d) => ({ ...d, [j.id]: pct })));
    setDownloads((d) => {
      const next = { ...d };
      delete next[j.id];
      return next;
    });
    if (!ok) {
      say(DOWNLOAD_FAILED, "error", () => void download(j));
    }
  };

  const toggleFavorite = (id: string) => {
    const on = !favorites.has(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    say(on ? "Added to Favorites" : "Removed from Favorites", "success");
  };

  /* Upscale again:结果当新源图放回左栏,倍数回到 2x;窄屏把左栏滚回可见处 */
  const upscaleAgain = (j: Job) => {
    const r = j.result;
    if (!r) return;
    const source: UpscaleSource = { url: r.url, width: r.width, height: r.height, name: resultFileName(r) };
    dispatch({ type: "upscaleAgain", source });
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  /* 把结果图(原图尺寸)和当前余额写进 CANVAS_KEY,再进画布;存储不可用也照样进(画布退回样图) */
  const openInCanvas = (j: Job) => {
    const r = j.result;
    if (r) {
      const payload: CanvasPayload = { images: [{ url: r.url, width: r.width, height: r.height, name: resultFileName(r) }], credits: s.balance };
      try {
        sessionStorage.setItem(CANVAS_KEY, JSON.stringify(payload));
      } catch {
        /* 放不下就算了 */
      }
    }
    if (onOpenCanvas) onOpenCanvas();
    else router.push("/prototypes/ai-tools/canvas");
  };

  /* ---------- 左栏:上传 + 参数 + Upscale ---------- */
  const dropProps = fileDropProps(setDragging, (f) => void pickFile(f));

  const uploadSlot = s.source ? (
    <UploadedCard
      kind="image"
      url={s.source.url}
      name={s.source.name}
      meta={`${fmt(s.source.width)} × ${fmt(s.source.height)}`}
      onReplace={() => fileRef.current?.click()}
      onRemove={() => dispatch({ type: "setSource", source: null })}
    />
  ) : (
    <SourceUpload
      notify={say}
      kinds={["image"]}
      icon={<ImagePlus className="size-4" strokeWidth={1.8} />}
      title="Upload an image"
      hint={`Click or drop a file here. JPG, PNG, WEBP, GIF, AVIF or HEIC, up to ${MAX_MB.image} MB.`}
      dragging={dragging}
      onFiles={(fs) => void pickFile(fs[0])}
    />
  );

  /* 预计积分 + Upscale:宽屏在左栏底部;窄屏(< lg)单列滚动,改成固定在底部的操作条,滚到结果区也按得到 */
  const actionBar = (
    <>
    {/* 禁用的按钮不出 tooltip,提示挂在外层 */}
    <span title={s.source ? undefined : NO_IMAGE_HINT} className="block">
      <button type="button" onClick={submit} disabled={!s.source} aria-label={s.source ? "Generate" : `Generate. ${NO_IMAGE_HINT}`} className={ctaBtn}>Generate
        <CtaCost cost={cost} />
      </button>
    </span>
    </>
  );

  const settings = (
    <>
      {uploadSlot}
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
      <UpscalePanel params={s.params} onChange={(params) => dispatch({ type: "setParams", params })} source={s.source} />
    </>
  );

  /* ---------- 右侧:结果列表(最新在上) ---------- */
  const jobCard = (j: Job) => {
    const out = outputSize(j.source.width, j.source.height, j.params);
    return (
      <article key={j.id} className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]" aria-label={`Upscale ${paramLabel(j)}`}>
        {/* 2026-11-05 Monica 定：参考图(原图)放最上面，下面一行只写模型 + 参数 */}
        <header className="relative mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={j.source.url} alt="Reference image" className="size-11 rounded-lg object-cover ring-1 ring-[#ececf1]" />
          <p className="mt-2 truncate text-[12.5px] tabular-nums text-[#6a6b7b]">
            <span className="font-semibold text-[#1a1a2e]">SeedVR</span> · {paramSummary(j)}
          </p>
          <button
            type="button"
            aria-label="Delete"
            title={j.status === "running" ? "You can delete it once it's done" : "Delete"}
            disabled={j.status === "running"}
            onClick={() => setConfirmDel(j)}
            className="absolute right-0 top-0 grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#fff1f0] hover:text-[#e5484d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 disabled:cursor-not-allowed disabled:text-[#d4d5de] disabled:hover:bg-transparent disabled:hover:text-[#d4d5de]"
          >
            <Trash2 className="size-4" />
          </button>
        </header>
        {j.status === "running" && (
          <div
            role="status"
            aria-label="Generating"
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: `${out.w} / ${out.h}`, maxWidth: `min(100%, ${Math.round((RESULT_MAX_H * out.w) / out.h)}px)` }}
          >
            <div className="gen-anim absolute inset-0" />
            <span className="absolute left-3 top-3 rounded-full bg-white/55 px-2 py-[3px] text-[11px] font-semibold text-[#1a1a2e] backdrop-blur-sm">
              Generating<span>.</span>
              <span className="gg-d2">.</span>
              <span className="gg-d3">.</span>
            </span>
          </div>
        )}
        {j.status === "done" && j.result && (
          <ResultCard
            source={j.source}
            result={j.result}
            favorite={favorites.has(j.id)}
            downloadPct={downloads[j.id] ?? null}
            onDownload={() => void download(j)}
            onToggleFavorite={() => toggleFavorite(j.id)}
            onUpscaleAgain={() => upscaleAgain(j)}
            onOpenInCanvas={() => openInCanvas(j)}
            onPreview={() => preview.open({ kind: "image", url: j.result!.url, alt: `Upscaled from ${j.source.name}` })}
            extra={
              <ShareButton
                tool="upscale"
                id={j.id}
                title={j.source.name}
                build={() => ({ kind: "image", url: j.result!.url, summary: `SeedVR · ${paramSummary(j)}` })}
                notify={say}
              />
            }
          />
        )}
        {j.status === "failed" && (
          <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-[#fff7f5] px-4 py-3.5 text-[13.5px] text-[#e5484d]">
            <CircleAlert className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">{UPSCALE_ERROR_TEXT[j.error === "unsafe" ? "unsafe" : "fail"]}</span>
            {j.error !== "unsafe" && (
              <button
                type="button"
                onClick={() => retry(j)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#ffd2c8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#ff5e1a] transition hover:bg-[#fffaf7]"
              >
                <RotateCcw className="size-3.5" /> Retry
              </button>
            )}
          </div>
        )}
      </article>
    );
  };

  /* 生成历史：每条占满结果区宽度、靠左(2026-11-05 Monica 定)。功能演示 + 介绍内容 2026-11-10 起放在结果区的 Guide tab(没有结果时默认停在那),这里没记录时只留一句话 */
  const results = s.jobs.length ? (
    <div className="w-full space-y-4 pb-6">{[...s.jobs].reverse().map(jobCard)}</div>
  ) : (
    <p className="px-6 py-16 text-center text-[14px] text-[#5b5c6e]">Your upscaled images show up here.</p>
  );

  return (
    <ToolLayout
      tool="upscale"
      notify={say}
      title="Upscale Image"
      guide={showGuide ? <UpscaleEmptyDemo onOpenTool={onOpenTool} onStart={() => fileRef.current?.click()} /> : undefined}
      resultCount={s.jobs.length}
      badge="SeedVR"
      subtitle="Sharper detail, up to 10x and print-ready."
      settingsLabel="Upscale settings"
      credits={balance ?? s.balance}
      onMenu={onMenu}
      onInvite={onInvite}
      panelRef={panelRef}
      dragging={dragging}
      dropProps={dropProps}
      settings={settings}
      action={actionBar}
      results={results}
      resultsRef={resultsRef}
    >
      {confirmDel && (
        <ConfirmDeleteDialog
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => {
            dispatch({ type: "remove", id: confirmDel.id });
            unshareResult(confirmDel.id);
            setConfirmDel(null);
            say("Deleted from your results and Assets");
          }}
        />
      )}
      {credits && (
        <NotEnoughCreditsDialog
          needed={credits.needed}
          balance={credits.balance}
          message="Top up to keep upscaling. Nothing was charged."
          onClose={() => setCredits(null)}
        />
      )}
      {preview.preview}
    </ToolLayout>
  );
}

/* 空状态(2026-11-05,版式照 Monica 给的「AI Upscale Imager」参考):功能标题 → 一句描述 → 可拖动的前后对比。
   底图是 Monica 给的产品素材(assets.presslogic.com,4:3:女生举着 BuzzVideo Lip Balm,自家虚构品牌);Before 是同一张缩小再放大的低清版 */
const DEMO_BEFORE = "/prototypes/ai-tools/upscale-demo-before.jpg";
const DEMO_AFTER = { url: "/prototypes/ai-tools/upscale-demo-after.jpg", width: 1600, height: 1198 };

/** 首屏演示图的宽度：最宽 640,屏幕矮时按 52vh 的高度收窄。下面的落地页开头用同一个宽度，边缘对齐 */
const DEMO_MAX_W = `min(640px, calc(52vh * ${DEMO_AFTER.width / DEMO_AFTER.height}))`;

function UpscaleEmptyDemo({ onOpenTool, onStart }: { onOpenTool?: (tool: ToolKey) => void; /** 页尾「Upload an image」:打开文件选择框 */ onStart?: () => void }) {
  return (
    /* 2026-11-10(SEO / GEO):首屏不再撑满整屏居中，下面接着是内容区(ToolGuide),首屏底下露出下一节的标题，看得出还能往下滚 */
    <article className="w-full">
    <div className="flex w-full flex-col items-center px-6 pb-2 pt-[clamp(16px,5vh,56px)] text-center">
      <h1 className="text-balance text-[26px] font-extrabold tracking-[-0.02em] text-[#1a1a2e]">{UPSCALE_GUIDE.h1}</h1>
      <p className="mt-2 max-w-[52ch] text-balance text-[14px] leading-relaxed text-[#5b5c6e]">{UPSCALE_GUIDE.tagline}</p>
      {/* 外框宽度 = 对比图实际宽度(竖一点的图会被 560px 高度限制收窄),不然右边会多出一条带阴影的空白 */}
      <div className="mt-5 w-full overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(26,26,46,0.16)]" style={{ maxWidth: DEMO_MAX_W }}>
        {/* 分割线默认居中(2026-11-05 Monica 定) */}
        <CompareSlider before={DEMO_BEFORE} after={DEMO_AFTER} afterAlt="Product photo after AI upscaling: sharp label text and skin detail" beforeAlt="Low-resolution product photo before AI upscaling" />
      </div>
    </div>
    <ToolGuide guide={UPSCALE_GUIDE} onOpenTool={onOpenTool} onStart={onStart} />
    </article>
  );
}
