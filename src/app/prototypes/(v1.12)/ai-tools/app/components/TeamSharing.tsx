"use client";

/* 工具页结果的团队共享 UI(规则见 sharing.ts):
   - ShareButton:结果卡操作行里的「Share」,只在团队工作区出现;已共享显示「Shared」;
   - ShareDialog:照 Canvas 的共享弹窗(Add people / People with access / General access / Copy link);
   - ResultsTabs + TeamResults:结果区的 My Results / Team Results 两个 tab,Team Results 是队友和本人共享出来的结果(只读，可下载)。 */

import { useEffect, useState } from "react";
import { Building2, Check, ChevronDown, Download, Heart, Link2, Lock, Users, X } from "lucide-react";
import { CURRENT_USER, useWorkspace, type Workspace } from "./workspace";
import { shareResult, teammateItems, unshareResult, useSharedItems, type SharedItem } from "./sharing";
import type { Notify } from "./TopToast";
import { RESULT_MAX_H } from "./ResultCard";
import { ExpandButton, useMediaPreview, zoomable } from "./MediaPreview";
import type { ToolKey } from "../sidebarMenus";

const ACTION =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap max-sm:flex-1 sm:h-9 rounded-lg border border-[#ececf1] bg-white px-3 text-[13px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fffaf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40";

const SMALL =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#ececf1] bg-white px-2.5 text-[12.5px] font-semibold text-[#1a1a2e] transition hover:border-[#ffbd99] hover:bg-[#fffaf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/40";

const ME = { name: CURRENT_USER.name, color: CURRENT_USER.color, me: true };

/* ---------------- Share 弹窗 ---------------- */
function ShareDialog({ title, ws, shared, onAccess, onClose, notify }: { title: string; ws: Workspace; shared: boolean; onAccess: (team: boolean) => void; onClose: () => void; notify?: Notify }) {
  const [menu, setMenu] = useState(false);
  const [people, setPeople] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (menu ? setMenu(false) : onClose());
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, onClose]);
  const teamLabel = `Anyone at ${ws.name}`;
  const options = [
    { team: false, label: "Restricted", Icon: Lock, help: "Only people with access can open this link" },
    { team: true, label: teamLabel, Icon: Building2, help: `${teamLabel} can open this link` },
  ];
  const cur = options[shared ? 1 : 0]!;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-[440px] rounded-[20px] bg-white text-[#1a1a2e] shadow-[0_24px_64px_rgba(26,26,46,0.24)]">
        <div className="px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="share-title" className="min-w-0 truncate text-[17px] font-bold">
              Share &ldquo;{title}&rdquo;
            </h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#6a6b7b] transition hover:bg-[#f4f3f6]">
              <X className="size-4" />
            </button>
          </div>
          <input
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && people.trim()) {
                notify?.("Adding people isn't available in this prototype.", "info");
                setPeople("");
              }
            }}
            placeholder="Add people"
            aria-label="Add people"
            className="mt-4 h-11 w-full rounded-xl border border-[#e1e3e9] px-3.5 text-[14px] outline-none transition placeholder:text-[#9a9bb0] focus:border-[#ff5e1a]"
          />
          <p className="mt-5 text-[13px] font-semibold text-[#4a4b5c]">People with access</p>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold text-white" style={{ background: CURRENT_USER.color }} aria-hidden>
              {CURRENT_USER.name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">
                {CURRENT_USER.name} <span className="font-normal text-[#6a6b7b]">(you)</span>
              </span>
              <span className="block truncate text-[12.5px] text-[#6a6b7b]">{CURRENT_USER.email}</span>
            </span>
            <span className="text-[13px] text-[#9a9bb0]">Owner</span>
          </div>
          <p className="mt-5 text-[13px] font-semibold text-[#4a4b5c]">General access</p>
          <div className="relative mt-2.5 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f1f0f4] text-[#4a4b5c]" aria-hidden>
              <cur.Icon className="size-[18px]" />
            </span>
            <button type="button" onClick={() => setMenu((v) => !v)} aria-haspopup="listbox" aria-expanded={menu} className="flex min-w-0 items-center gap-1 rounded-lg py-1 text-[14px] font-semibold transition hover:text-[#ff5e1a]">
              <span className="truncate">{cur.label}</span>
              <ChevronDown className="size-4 shrink-0" />
            </button>
            {shared && <span className="ml-auto text-[13px] text-[#6a6b7b]">Viewer</span>}
            {menu && (
              <div role="listbox" aria-label="General access" className="absolute left-12 top-[calc(100%+4px)] z-10 w-[260px] rounded-xl border border-[#ececf1] bg-white p-1.5 shadow-[0_12px_32px_rgba(26,26,46,0.16)]">
                {options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    role="option"
                    aria-selected={o.team === shared}
                    onClick={() => {
                      setMenu(false);
                      if (o.team !== shared) onAccess(o.team);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-semibold transition hover:bg-[#f6f4f7]"
                  >
                    <o.Icon className="size-4 shrink-0 text-[#6a6b7b]" />
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.team === shared && <Check className="size-4 shrink-0 text-[#ff5e1a]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[#f0eef2] px-6 py-4">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-[#6a6b7b]">{cur.help}</p>
          <button
            type="button"
            onClick={() => {
              try {
                void navigator.clipboard?.writeText(window.location.href);
              } catch {
                /* 原型里复制失败也照样提示 */
              }
              notify?.("Link copied", "success");
            }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#e1e3e9] px-3.5 text-[13px] font-semibold transition hover:bg-[#f6f4f7]"
          >
            <Link2 className="size-4" /> Copy link
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 结果卡上的 Share 按钮 ---------------- */
export function ShareButton({
  tool,
  id,
  title,
  build,
  notify,
  small = false,
}: {
  tool: ToolKey;
  /** 结果 id(job id) */
  id: string;
  /** 弹窗标题里的名字 */
  title: string;
  /** 共享时记下的媒体和摘要 */
  build: () => Pick<SharedItem, "kind" | "url" | "poster" | "summary">;
  notify?: Notify;
  /** 行内小按钮(和 h-8 的 ghost 按钮并排时用) */
  small?: boolean;
}) {
  const ws = useWorkspace();
  const shared = useSharedItems().some((x) => x.id === id && x.ws === ws.id);
  const [open, setOpen] = useState(false);
  if (ws.personal) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${small ? SMALL : ACTION} ${shared ? "border-[#ffd2b8] bg-[#fff7f1] text-[#c2410c]" : ""}`} aria-label={shared ? `Shared with ${ws.name}. Change access` : "Share"}>
        <Users className="size-4" />
        {shared ? "Shared" : "Share"}
      </button>
      {open && (
        <ShareDialog
          title={title}
          ws={ws}
          shared={shared}
          notify={notify}
          onClose={() => setOpen(false)}
          onAccess={(team) => {
            if (team) {
              shareResult({ ...build(), id, tool, ws: ws.id, author: ME, at: Date.now() });
              notify?.(`Shared with ${ws.name}`, "success");
            } else {
              unshareResult(id);
              notify?.("Only you can see it now", "info");
            }
          }}
        />
      )}
    </>
  );
}

/* ---------------- 结果区 tab ---------------- */
export type ResultsTab = "mine" | "team";
/** 结果区的全部 tab:自己的结果 / 团队结果 / 工具介绍(Guide,2026-11-10:有了结果后介绍内容还能从这里回去看) */
export type PanelTab = ResultsTab | "guide";

export function ResultsTabs({ tab, onTab, team = true, guide = false }: { tab: PanelTab; onTab: (t: PanelTab) => void; /** 团队工作区才有 Team Results */ team?: boolean; /** 这个工具有介绍内容时多一个 Guide */ guide?: boolean }) {
  const tabs: { key: PanelTab; label: string }[] = [
    { key: "mine", label: team ? "My Results" : "Results" },
    ...(team ? [{ key: "team" as const, label: "Team Results" }] : []),
    ...(guide ? [{ key: "guide" as const, label: "Guide" }] : []),
  ];
  return (
    <div role="tablist" aria-label="Results" className="flex items-center gap-5 border-b border-[#ececf1]">
      {tabs.map((t) => {
        const on = t.key === tab;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onTab(t.key)}
            className={`relative -mb-px flex items-center gap-1.5 pb-2.5 text-[15px] font-bold transition ${on ? "text-[#1a1a2e]" : "text-[#8a8b9c] hover:text-[#1a1a2e]"}`}
          >
            {t.label}
            {on && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#ff5e1a]" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/** 当前工作区、当前工具在 Team Results 里的全部条目(本人共享的在前，再是队友的) */
export function useTeamItems(tool: ToolKey): SharedItem[] {
  const ws = useWorkspace();
  const mine = useSharedItems().filter((x) => x.ws === ws.id && x.tool === tool);
  return ws.personal ? [] : [...mine, ...teammateItems(ws.id, tool)];
}


/** 和各工具页 My Results 的结果同一个尺寸(2026-11-06 Monica 定):
    图片 / 视频最高 RESULT_MAX_H、按原比例;Product Avatar 是 220 宽的竖版;声音占满整行 */
function Media({ item, onPreview }: { item: SharedItem; onPreview: () => void }) {
  if (item.kind === "image")
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.url} alt={item.summary} {...zoomable(onPreview)} className="block w-auto max-w-full cursor-zoom-in rounded-2xl bg-[#f1f2f5] object-contain ring-1 ring-[#ececf1]" style={{ maxHeight: RESULT_MAX_H }} />;
  if (item.kind === "video")
    return (
      <div className="relative w-fit max-w-full">
        <video src={item.url} poster={item.poster} controls playsInline className="block max-w-full rounded-2xl bg-black object-contain" style={{ maxHeight: RESULT_MAX_H }} />
        <ExpandButton onClick={onPreview} />
      </div>
    );
  return <audio src={item.url} controls className="w-full" />;
}

/** Team Results:只读卡片(作者 + 时间 + 摘要、结果、Download / Favorites);本人共享的那条还能改共享范围 */
export function TeamResults({ tool, notify }: { tool: ToolKey; notify?: Notify }) {
  const ws = useWorkspace();
  const items = useTeamItems(tool);
  const [fav, setFav] = useState<Set<string>>(() => new Set());
  const preview = useMediaPreview();
  if (!items.length)
    return (
      <div className="grid h-full min-h-[320px] place-items-center px-6 text-center">
        <div>
          <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#fff3ec] text-[#ff5e1a]">
            <Users className="size-5" />
          </span>
          <p className="mt-3 text-[15px] font-bold text-[#1a1a2e]">No team results yet</p>
          <p className="mt-1 text-[13px] text-[#6a6b7b]">Share a result from My Results so everyone in {ws.name} can use it.</p>
        </div>
      </div>
    );
  return (
    <div className="space-y-4 pb-6">
      {items.map((it) => (
        <article key={`${it.ws}-${it.id}`} aria-label={`Shared by ${it.author.me ? "you" : it.author.name}`} className="rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
          <header className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#6a6b7b]">
            <span className="grid size-6 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: it.author.color }} aria-hidden>
              {it.author.name[0]}
            </span>
            <span className="font-semibold text-[#1a1a2e]">{it.author.me ? "You" : it.author.name}</span>
            <span className="min-w-0 truncate">· {it.summary}</span>
            {!it.author.me && <span className="ml-auto rounded-md bg-[#f1f0f4] px-1.5 py-[1px] text-[11px] font-semibold text-[#6a6b7b]">View only</span>}
          </header>
          <Media item={it} onPreview={() => it.kind !== "audio" && preview.open({ kind: it.kind, url: it.url, poster: it.poster, alt: it.summary })} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={it.url} download className={`${ACTION} sm:min-w-[120px]`}>
              <Download className="size-4" /> Download
            </a>
            <button
              type="button"
              aria-pressed={fav.has(it.id)}
              onClick={() => {
                const on = !fav.has(it.id);
                setFav((s) => {
                  const n = new Set(s);
                  if (on) n.add(it.id);
                  else n.delete(it.id);
                  return n;
                });
                notify?.(on ? "Added to Favorites" : "Removed from Favorites", "success");
              }}
              className={ACTION}
            >
              <Heart className={`size-4 ${fav.has(it.id) ? "fill-[#ff5e1a] text-[#ff5e1a]" : ""}`} /> Favorites
            </button>
            {it.author.me && <ShareButton tool={tool} id={it.id} title={it.summary} build={() => it} notify={notify} />}
          </div>
        </article>
      ))}
      {preview.preview}
    </div>
  );
}

/** ToolLayout 用:团队工作区下给结果区套上 My Results / Team Results */
export function useResultsTabs(tool: ToolKey | undefined) {
  const ws = useWorkspace();
  const [tab, setTab] = useState<ResultsTab>("mine");
  /* 每个工作区是各自的页面实例(外壳按工作区分开挂载),tab 状态不会串 */
  const enabled = !!tool && !ws.personal;
  return { enabled, tab: enabled ? tab : "mine", setTab } as const;
}

