"use client";

// 视频库：所有宣传片 / 示例片的成片与历史版本。数据由 scripts/video-library/build.py 扫桌面工程生成，
// 视频文件放 Vercel Blob(upload.mjs 上传后把链接写回 library.json)。加新片：改 build.py 的来源列表再跑一遍。
import { useEffect, useMemo, useState } from "react";
import { Clock, Download, Film, Layers, Play, Search, X, FolderOpen, Check, Copy } from "lucide-react";
import data from "./library.json";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const gradText = "bg-gradient-to-r from-[#ffc078] to-[#ff5e1a] bg-clip-text text-transparent";
const kicker =
  "inline-block rounded-full bg-[#fff3ec] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#ff5e1a]";

type VFile = {
  label: string; name: string; size: number; mtime: string;
  w: number | null; h: number | null; dur: number | null;
  key: string; url: string | null; local: string;
};
type Ver = { label: string; date: string; note: string; files: VFile[] };
type FilmT = {
  id: string; category: string; title: string; desc: string; order: number;
  versions: Ver[]; poster: string; updated: string;
};

const FILMS = (data as { generated: string; films: FilmT[] }).films;
const CATEGORIES = ["宣讲片", "模型宣传片", "产品 Demo", "教程", "产品内视频", "Enterprise 画布案例", "Skill 示例", "博客视频"];

const fmtSize = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${Math.max(1, Math.round(b / 1e6))} MB`);
const fmtDur = (s: number | null) => (s == null ? "" : s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}` : `${Math.round(s)}s`);
const resLabel = (f: VFile) => {
  if (!f.w || !f.h) return "";
  const long = Math.max(f.w, f.h);
  return long >= 3800 ? "4K" : long >= 2500 ? "2.5K" : long >= 1900 ? "1080p" : long >= 1270 ? "720p" : `${f.w}×${f.h}`;
};
const ratioOf = (f: VFile) => (f.w && f.h ? f.w / f.h : 16 / 9);
const fileCount = (f: FilmT) => f.versions.reduce((n, v) => n + v.files.length, 0);
// Vercel Blob 加 ?download=1 会返回 attachment，跨域也能直接下载
const dlUrl = (u: string) => `${u}${u.includes("?") ? "&" : "?"}download=1`;

export default function VideoLibrary() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("全部");
  const [open, setOpen] = useState<FilmT | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILMS) c[f.category] = (c[f.category] ?? 0) + 1;
    return c;
  }, []);

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return FILMS.filter((f) => (cat === "全部" || f.category === cat) &&
      (!kw || [f.title, f.desc, f.category, ...f.versions.flatMap((v) => [v.label, ...v.files.map((x) => x.name)])].join(" ").toLowerCase().includes(kw)));
  }, [q, cat]);

  const grouped = useMemo(() => {
    const cats = cat === "全部" ? CATEGORIES : [cat];
    return cats
      .map((c) => ({ c, films: shown.filter((f) => f.category === c).sort((a, b) => a.order - b.order || b.updated.localeCompare(a.updated)) }))
      .filter((g) => g.films.length);
  }, [shown, cat]);

  const recent = useMemo(() => [...FILMS].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6), []);
  const totalFiles = FILMS.reduce((n, f) => n + fileCount(f), 0);
  const totalSize = FILMS.reduce((n, f) => n + f.versions.reduce((m, v) => m + v.files.reduce((k, x) => k + x.size, 0), 0), 0);

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      {/* hero */}
      <header className="bg-[linear-gradient(160deg,#ffe7d2_0%,#ffffff_52%,#ffdedf_100%)] px-6 pb-10 pt-16">
        <div className="mx-auto max-w-6xl">
          <span className={kicker}>Video Library</span>
          <h1 className="mt-4 text-[clamp(34px,5vw,56px)] font-extrabold leading-[1.08] tracking-tight">
            所有宣传片，<span className={gradText}>一个地方找齐</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#6a6b7b]">
            宣讲片、模型宣传片、教程、产品内视频、画布案例、Skill 示例和博客视频的成片与历史版本。点开任意一支，可以在线看、选版本、选格式直接下载。
          </p>
          <div className="mt-7 flex flex-wrap gap-8">
            {[
              [FILMS.length, "支片子"],
              [totalFiles, "个文件（含历史版本和各种格式）"],
              [fmtSize(totalSize), "总大小"],
            ].map(([n, l]) => (
              <div key={String(l)}>
                <div className="text-[clamp(28px,4vw,40px)] font-extrabold tabular-nums">{n}</div>
                <div className="text-[13px] text-[#6a6b7b]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* sticky search + category bar */}
      <div className="sticky top-0 z-20 border-b border-[#ececf1] bg-white/90 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <label className="relative flex min-w-[240px] flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-[#9a9aab]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜片名、版本或文件名，比如 3D Studio、round3、share"
              className="h-10 w-full rounded-xl border border-[#e1e3e9] bg-white pl-10 pr-9 text-[14px] outline-none transition focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
            />
            {q && (
              <button aria-label="清空搜索" onClick={() => setQ("")} className="absolute right-2.5 rounded-full p-1 text-[#9a9aab] hover:bg-[#f3f4f6]">
                <X className="size-3.5" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {["全部", ...CATEGORIES.filter((c) => counts[c])].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  cat === c
                    ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_16px_rgba(255,82,85,0.25)]"
                    : "border border-[#ececf1] bg-white text-[#4a4b5c] hover:border-[#d4d3df]"
                }`}
              >
                {c}
                <span className={`ml-1.5 tabular-nums ${cat === c ? "text-white/80" : "text-[#9a9aab]"}`}>{c === "全部" ? FILMS.length : counts[c]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* recently updated */}
        {cat === "全部" && !q && (
          <section className="pt-10">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#4a4b5c]">
              <Clock className="size-4 text-[#ff5e1a]" /> 最近更新
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {recent.map((f) => <FilmCard key={f.id} f={f} onOpen={setOpen} compact />)}
            </div>
          </section>
        )}

        {grouped.map(({ c, films }) => (
          <section key={c} className="pt-12">
            <div className="flex items-baseline gap-3">
              <h2 className="text-[clamp(22px,3vw,28px)] font-extrabold tracking-tight">{c}</h2>
              <span className="text-[13px] text-[#9a9aab] tabular-nums">{films.length} 支</span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {films.map((f) => <FilmCard key={f.id} f={f} onOpen={setOpen} />)}
            </div>
          </section>
        ))}

        {!grouped.length && (
          <div className="mt-16 rounded-2xl border border-[#ececf1] bg-[#faf8f6] px-6 py-14 text-center text-[#6a6b7b]">
            没有找到「{q}」相关的片子。
          </div>
        )}

        <p className="mt-16 text-[12px] leading-relaxed text-[#9a9aab]">
          清单更新于 {(data as { generated: string }).generated}。新成片做好后，在 <code>scripts/video-library/build.py</code> 里加来源，跑 build.py 和 upload.mjs 就会出现在这里。
        </p>
      </main>

      {open && <FilmDrawer f={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FilmCard({ f, onOpen, compact }: { f: FilmT; onOpen: (f: FilmT) => void; compact?: boolean }) {
  const vers = f.versions.filter((v) => v.files.length).length;
  const tall = ratioOf(f.versions.find((v) => v.files.length)!.files[0]) < 0.8;
  return (
    <button
      onClick={() => onOpen(f)}
      className="group overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-left shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden bg-[#14151b]">
        {/* 竖版片子：模糊铺底 + 居中原比例，不裁头 */}
        {tall && <img src={f.poster} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-xl" />}
        <img src={f.poster} alt={f.title} loading="lazy" className={`relative size-full ${tall ? "object-contain" : "object-cover"} transition duration-300 group-hover:scale-[1.03]`} />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="ml-0.5 size-5 fill-[#1a1a2e] text-[#1a1a2e]" />
          </span>
        </span>
        {vers > 1 && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            <Layers className="size-3" /> {vers} 个版本
          </span>
        )}
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        <div className={`font-bold leading-snug ${compact ? "line-clamp-1 text-[13px]" : "text-[15px]"}`}>{f.title}</div>
        {!compact && f.desc && <div className="mt-1 line-clamp-1 text-[13px] text-[#6a6b7b]">{f.desc}</div>}
        <div className={`flex items-center gap-2 text-[12px] text-[#9a9aab] ${compact ? "mt-0.5" : "mt-2"}`}>
          <span className="tabular-nums">{f.updated}</span>
          {!compact && <><span>·</span><span>{fileCount(f)} 个文件</span></>}
        </div>
      </div>
    </button>
  );
}

function FilmDrawer({ f, onClose }: { f: FilmT; onClose: () => void }) {
  const firstVer = f.versions.findIndex((v) => v.files.length);
  const [vi, setVi] = useState(firstVer);
  const [fi, setFi] = useState(0);
  const [copied, setCopied] = useState("");
  const ver = f.versions[vi];
  const file = ver?.files[fi] ?? ver?.files[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // 播放用该版本里最小的可播放文件，省流量；下载列表里再挑大的
  const playable = ver?.files.filter((x) => x.url && x.name.toLowerCase().endsWith(".mp4")).sort((a, b) => a.size - b.size)[0];
  const playing = file?.url && file.name.toLowerCase().endsWith(".mp4") && file.size < 120e6 ? file : playable;

  const copy = (s: string) => {
    navigator.clipboard?.writeText(s);
    setCopied(s);
    setTimeout(() => setCopied(""), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0c10]/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label={f.title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)] lg:flex-row"
      >
        {/* player */}
        <div className="flex min-h-[260px] flex-1 items-center justify-center bg-[#0e0f14] lg:min-h-[560px]">
          {playing ? (
            <video
              key={playing.url!}
              src={playing.url!}
              poster={f.poster}
              controls
              autoPlay
              playsInline
              className="max-h-[70vh] w-full lg:max-h-[86vh]"
              style={{ aspectRatio: String(ratioOf(playing)) }}
            />
          ) : (
            <div className="px-8 text-center text-[14px] text-white/60">
              <img src={f.poster} alt="" className="mx-auto mb-4 max-h-[46vh] rounded-xl opacity-80" />
              {ver?.files.length ? "这个版本的视频还没上传到云端，可以先从本机路径打开。" : "这个版本暂时没有文件。"}
            </div>
          )}
        </div>

        {/* side panel */}
        <aside className="flex w-full flex-col border-t border-[#ececf1] lg:w-[400px] lg:border-l lg:border-t-0">
          <div className="flex items-start gap-3 px-6 pb-4 pt-6">
            <div className="flex-1">
              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">{f.category}</div>
              <h3 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight">{f.title}</h3>
              {f.desc && <p className="mt-1.5 text-[13px] leading-relaxed text-[#6a6b7b]">{f.desc}</p>}
            </div>
            <button aria-label="关闭" onClick={onClose} className="rounded-full p-1.5 text-[#6a6b7b] hover:bg-[#f3f4f6]">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* versions */}
            <div className="text-[12px] font-bold text-[#9a9aab]">版本</div>
            <div className="mt-2 space-y-1.5">
              {f.versions.map((v, i) => (
                <button
                  key={v.label + i}
                  onClick={() => { setVi(i); setFi(0); }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition ${
                    i === vi ? "border-[#ff5e1a] bg-[#fff7f1]" : "border-[#ececf1] hover:border-[#d4d3df]"
                  } ${v.files.length ? "" : "opacity-70"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold">{v.label}</span>
                    {i === firstVer && <span className="rounded-full bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-2 py-0.5 text-[10px] font-bold text-white">最新</span>}
                    <span className="ml-auto text-[12px] tabular-nums text-[#9a9aab]">{v.date}</span>
                  </div>
                  {v.note && <div className="mt-1 text-[12px] leading-relaxed text-[#6a6b7b]">{v.note}</div>}
                </button>
              ))}
            </div>

            {/* files of the chosen version */}
            {!!ver?.files.length && (
              <>
                <div className="mt-6 text-[12px] font-bold text-[#9a9aab]">这个版本的文件</div>
                <div className="mt-2 space-y-2">
                  {ver.files.map((x, i) => (
                    <div
                      key={x.key}
                      className={`rounded-xl border px-3.5 py-3 transition ${i === fi ? "border-[#1a1a2e]" : "border-[#ececf1]"}`}
                    >
                      <button onClick={() => setFi(i)} className="block w-full text-left">
                        <div className="flex items-center gap-2">
                          <Film className="size-4 shrink-0 text-[#ff5e1a]" />
                          <span className="truncate text-[13px] font-bold">{x.label || x.name}</span>
                        </div>
                        <div className="mt-1 truncate text-[12px] text-[#6a6b7b]">{x.name}</div>
                        <div className="mt-1 flex flex-wrap gap-x-2 text-[12px] tabular-nums text-[#9a9aab]">
                          {[resLabel(x), x.w && x.h ? `${x.w}×${x.h}` : "", fmtDur(x.dur), fmtSize(x.size)].filter(Boolean).map((t) => <span key={t}>{t}</span>)}
                        </div>
                      </button>
                      <div className="mt-2.5 flex gap-2">
                        {x.url ? (
                          <a
                            href={dlUrl(x.url)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_6px_14px_rgba(255,82,85,0.25)] transition hover:brightness-105"
                          >
                            <Download className="size-3.5" /> 下载
                          </a>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-[#f3f4f6] px-3 py-1.5 text-[12px] font-semibold text-[#9a9aab]">未上传</span>
                        )}
                        {x.url && (
                          <button
                            onClick={() => copy(x.url!)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ececf1] px-3 py-1.5 text-[12px] font-semibold text-[#4a4b5c] transition hover:border-[#d4d3df]"
                          >
                            {copied === x.url ? <Check className="size-3.5 text-[#1A7F4B]" /> : <Copy className="size-3.5" />} 复制链接
                          </button>
                        )}
                        <button
                          onClick={() => copy(x.local)}
                          title={x.local}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ececf1] px-3 py-1.5 text-[12px] font-semibold text-[#4a4b5c] transition hover:border-[#d4d3df]"
                        >
                          {copied === x.local ? <Check className="size-3.5 text-[#1A7F4B]" /> : <FolderOpen className="size-3.5" />} 本机路径
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
