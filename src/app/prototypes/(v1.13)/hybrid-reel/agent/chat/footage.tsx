"use client";

/* 素材拆解卡。从 agent/chat/page.tsx 原样搬出;新增 defaultOpen,hybrid-reel-agent 里默认收起。 */

import { useState } from "react";
import { ChevronDown, ChevronRight, Film, Image as ImageIcon, Music, Play, Volume2 } from "lucide-react";
import { MediaViewer, type ViewerItem } from "./viewer";
import { IDENTITY_META, ROLE_META, SHOWCASE_LABEL, SOUND_META, type ClipProfile, type Identity, type Role } from "./types";

/* 素材拆解的两种颜色:能用 / 废片(时间条、图例、列表圆点、预览里的小标共用) */
const SEG_USABLE = "#ff9563";
const SEG_CUT = "#c9cad4";

/* ── 素材拆解:每个上传文件一行,标出 AI 判断的身份(可改)和原声;视频再给一条时间条 + 片段清单,
   能用的段标出能当什么镜头、证明了什么卖点、原声是什么,废片标出原因。
   点缩略图看整条素材;点某一段只播这一段,用来核对 Agent 说能用 / 不能用的到底是哪几秒 ── */
export function FootageBreakdown({ profiles, defaultOpen = true }: { profiles: ClipProfile[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [view, setView] = useState<{ items: ViewerItem[]; index: number } | null>(null);
  /* 时间条和列表联动:悬停哪一段(「素材名#序号」),两边一起高亮 */
  const [hover, setHover] = useState<string | null>(null);
  const cuttable = (p: ClipProfile) => ["footage", "showcase", "evidence"].includes(p.identity ?? "footage");
  const videos = profiles.filter((p) => p.kind === "video" && p.segments?.length && cuttable(p));
  const usable = videos.reduce((n, p) => n + (p.segments ?? []).filter((g) => g.usable).length, 0);
  const cut = videos.reduce((n, p) => n + (p.segments ?? []).filter((g) => !g.usable).length, 0);
  const roleName = (r: string) => ROLE_META[r as Role]?.label ?? r;
  /* 同一条视频的每一段都放进预览,可以左右切着看 */
  const segmentItems = (p: ClipProfile): ViewerItem[] =>
    (p.segments ?? []).map((g) => ({
      kind: "video",
      src: p.objectUrl!,
      title: p.label,
      start: g.start,
      end: g.end,
      usable: g.usable,
      tag: g.usable ? (g.roles.length ? g.roles.map(roleName).join(" / ") : "Usable") : "Cut",
      caption: g.usable ? g.description : g.reason || g.description,
      note: g.usable ? g.sellingPoint : undefined,
    }));
  const preview = (p: ClipProfile) =>
    setView({ items: [{ kind: p.kind === "image" ? "image" : "video", src: p.objectUrl!, title: p.label }], index: 0 });

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {open ? <ChevronDown className="size-4 text-[#6a6b7b]" /> : <ChevronRight className="size-4 text-[#6a6b7b]" />}
        <span className="text-[14px] font-semibold text-[#1a1a2e]">Footage breakdown</span>
        {/* 计数带同色圆点,兼作时间条的图例 */}
        <span className="ml-auto flex items-center gap-1.5 text-[12px] tabular-nums text-[#6a6b7b]">
          {profiles.length} {profiles.length === 1 ? "file" : "files"}
          {videos.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="size-2 rounded-full" style={{ background: SEG_USABLE }} aria-hidden />
              {usable} usable
              <span aria-hidden>·</span>
              <span className="size-2 rounded-full" style={{ background: SEG_CUT }} aria-hidden />
              {cut} cut
            </>
          )}
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-[#ececf1] px-4 pb-4 pt-3">
          {profiles.map((p, index) => {
            const identity: Identity = p.identity ?? (p.kind === "audio" ? "audio" : "footage");
            const showSegments = p.kind === "video" && !!p.segments?.length && cuttable(p);
            const len = p.durationSec ?? p.segments?.[p.segments.length - 1]?.end ?? 0;
            const kindLine = [
              p.kind === "audio" ? (p.audioKind === "voice" ? "Voice recording" : p.audioKind === "sfx" ? "Sound effect" : "Music") : undefined,
              identity === "showcase" && p.showcase ? SHOWCASE_LABEL[p.showcase] : undefined,
              p.kind !== "image" && len ? `${Math.round(len * 10) / 10}s` : undefined,
            ].filter(Boolean);
            return (
              <div key={`${p.label}-${index}`}>
                <div className="flex items-center gap-2.5">
                  {p.kind === "audio" ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#f1f2f5] text-[#6a6b7b]">
                      <Music className="size-4" />
                    </span>
                  ) : p.objectUrl ? (
                    <button
                      type="button"
                      title={p.label}
                      aria-label={`Preview ${p.label}`}
                      onClick={() => preview(p)}
                      className="group/thumb relative size-9 shrink-0 overflow-hidden rounded-md bg-[#f1f2f5] ring-1 ring-[#ececf1] outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/60"
                    >
                      {p.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.objectUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <video src={`${p.objectUrl}#t=0.5`} muted preload="metadata" className="size-full object-cover" />
                      )}
                      <span aria-hidden className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition duration-150 group-hover/thumb:bg-black/25 group-hover/thumb:opacity-100 group-focus-visible/thumb:bg-black/25 group-focus-visible/thumb:opacity-100">
                        {p.kind === "image" ? <ImageIcon className="size-3.5" /> : <Play className="ml-px size-3.5 fill-current" />}
                      </span>
                    </button>
                  ) : (
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#f1f2f5] text-[#9a9bb0]">
                      {p.kind === "image" ? <ImageIcon className="size-4" /> : <Film className="size-4" />}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#1a1a2e]" title={p.label}>
                      {p.label}
                    </span>
                    <span className="block truncate text-[11.5px] tabular-nums text-[#9a9bb0]">
                      {[...kindLine, p.identityEdited ? "Changed as you asked" : p.identityWhy].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {p.kind === "video" && p.sound && p.sound !== "silent" && (
                    <span
                      className="hidden shrink-0 items-center gap-1 rounded-full bg-[#f6f5f8] px-2 py-[3px] text-[11px] font-semibold text-[#4a4b5c] sm:inline-flex"
                      title={`${SOUND_META[p.sound].plan}${p.soundNote ? ` · ${p.soundNote}` : ""}`}
                    >
                      <Volume2 className="size-3" /> {SOUND_META[p.sound].label}
                    </span>
                  )}
                  {/* 身份:AI 判断,不给下拉;用户要改就在对话里说 */}
                  <span className="shrink-0 rounded-full bg-[#fff3ec] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#d24f14]">
                    {IDENTITY_META[identity].label}
                  </span>
                </div>
                {identity === "reference" && (
                  <p className="mt-1.5 pl-[46px] text-[12px] text-[#6a6b7b]">
                    Only its colours, tone and copy style are borrowed — it stays out of the cut.
                  </p>
                )}
                {showSegments && (
                  <>
                    {/* 时间条:能用的段橙色,废片灰色。悬停某一段,下面对应那一行跟着高亮;点了播这一段 */}
                    <div className="mt-2 flex h-1.5 gap-px overflow-hidden rounded-full bg-[#f1f2f5]">
                      {p.segments!.map((g, i) => {
                        const key = `${p.label}#${i}`;
                        const hot = hover === key;
                        return (
                          <button
                            key={i}
                            type="button"
                            tabIndex={-1}
                            aria-hidden
                            disabled={!p.objectUrl}
                            title={`${g.start}–${g.end}s · ${g.usable ? "Usable" : "Cut"}`}
                            onMouseEnter={() => setHover(key)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => setView({ items: segmentItems(p), index: i })}
                            className="h-full cursor-pointer transition-opacity disabled:cursor-default"
                            style={{
                              width: `${((g.end - g.start) / len) * 100}%`,
                              background: g.usable ? SEG_USABLE : SEG_CUT,
                              opacity: hover && hover.startsWith(`${p.label}#`) && !hot ? 0.45 : 1,
                            }}
                          />
                        );
                      })}
                    </div>
                    <ul className="mt-1.5">
                      {p.segments!.map((g, i) => {
                        const body = (
                          <>
                            {/* 圆点跟第一行文字对齐:这一栏只有一行高(不被右边多行描述撑高),圆点在这一行里居中 */}
                            <span className="flex h-[1.5em] w-[86px] shrink-0 items-center gap-1.5 self-start tabular-nums text-[#9a9bb0]">
                              <span className="size-2 shrink-0 rounded-full" style={{ background: g.usable ? SEG_USABLE : SEG_CUT }} aria-hidden />
                              {g.start}–{g.end}s
                            </span>
                            <span className={`min-w-0 flex-1 ${g.usable ? "text-[#1a1a2e]" : "text-[#9a9bb0]"}`}>
                              {g.usable ? g.description : `Cut · ${g.reason || g.description}`}
                              {g.usable && (g.roles.length > 0 || g.sellingPoint || (g.sound && g.sound !== "silent")) && (
                                <span className="mt-0.5 block text-[11.5px] text-[#6a6b7b]">
                                  {[g.roles.map(roleName).join(" / "), g.sellingPoint, g.sound && g.sound !== "silent" ? `Sound: ${SOUND_META[g.sound].label}` : ""]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              )}
                            </span>
                          </>
                        );
                        return (
                          <li key={i}>
                            {p.objectUrl ? (
                              /* 整行可点:悬停出底色和播放图标,点了只播这一段 */
                              <button
                                type="button"
                                aria-label={`Play ${g.start}–${g.end}s of ${p.label}`}
                                onClick={() => setView({ items: segmentItems(p), index: i })}
                                onMouseEnter={() => setHover(`${p.label}#${i}`)}
                                onMouseLeave={() => setHover(null)}
                                className={`group/seg -mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-lg px-2 py-[3px] text-left text-[12.5px] leading-snug outline-none transition-colors hover:bg-[#f6f7f9] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40 ${
                                  hover === `${p.label}#${i}` ? "bg-[#f6f7f9]" : ""
                                }`}
                              >
                                {body}
                                <Play
                                  aria-hidden
                                  className="mt-[3px] size-3 shrink-0 fill-current text-[#6a6b7b] opacity-0 transition-opacity group-hover/seg:opacity-100 group-focus-visible/seg:opacity-100"
                                />
                              </button>
                            ) : (
                              <div className="flex gap-3 py-[3px] text-[12.5px] leading-snug">{body}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {view && (
        <MediaViewer
          items={view.items}
          index={view.index}
          onIndex={(index) => setView((v) => (v ? { ...v, index } : v))}
          onClose={() => setView(null)}
        />
      )}
    </div>
  );
}
