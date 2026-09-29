"use client";

/* Footage details:点画布上用户上传的素材节点,右侧弹出 Agent 对这条素材的全部分析 ——
   身份和理由、画面里有什么、原声、口播内容、画质问题、标签,以及视频的场记(每一段能不能用、能当什么、证明了什么卖点、原声是什么)。
   场记上标出这一段在时间线上的第几个镜头用到了;能用但还没用上的段,一键加到时间线末尾。
   参考 / 品牌资产 / 产品图:写清它被哪几个 AI 镜头当参考、当尾帧。分析结果只读 —— 要改身份在对话里说。 */

import { Plus, X } from "lucide-react";
import { IDENTITY_META, ROLE_META, SHOWCASE_LABEL, SOUND_META, type Role } from "../agent/chat/types";
import { layoutClips, newId, type Asset, type Project } from "./project";
import type { EditApi } from "./timeline";

const USABLE = "#ff9563";
const CUT = "#c9cad4";

export function FootageDetails({ asset, project, edit, onClose }: { asset: Asset; project: Project; edit: EditApi; onClose: () => void }) {
  const an = asset.analysis ?? {};
  const identity = asset.identity ?? (asset.kind === "audio" ? "audio" : "footage");
  const { segs } = layoutClips(project.clips);
  /* 哪几个镜头用到了这条素材的哪一段 */
  const uses = segs.filter((s) => s.clip.assetId === asset.id);
  const shotOf = (start: number, end: number) =>
    uses.filter((s) => Math.min(end, s.clip.outSec) - Math.max(start, s.clip.inSec) > 0.2).map((s) => s.index + 1);
  const aiUsers = project.assets.filter((a) => a.origin === "ai" && a.kind === "video");
  const asRef = aiUsers.filter((a) => a.refIds?.includes(asset.id)).map((a) => a.label);
  const asLast = aiUsers.filter((a) => a.lastFrameId === asset.id).map((a) => a.label);
  const isMusic = project.musicId === asset.id;

  const addSegment = (start: number, end: number, roles: string[]) =>
    edit.commit((p) => ({
      ...p,
      clips: [
        ...p.clips,
        {
          id: newId("c"),
          assetId: asset.id,
          role: (roles.find((r) => r in ROLE_META) as Role | undefined) ?? "usage",
          inSec: start,
          outSec: end,
          speed: 1,
          muted: false,
          subtitle: "",
          subtitleSource: "stt",
        },
      ],
    }));

  const kindLine = [
    asset.kind === "audio" ? (an.audioKind === "voice" ? "Voice recording" : an.audioKind === "sfx" ? "Sound effect" : "Music") : asset.kind === "image" ? "Image" : "Video",
    identity === "showcase" && an.showcase ? SHOWCASE_LABEL[an.showcase] : undefined,
    asset.kind !== "image" ? `${Math.round(asset.durationSec * 10) / 10}s` : undefined,
  ].filter(Boolean);

  return (
    <aside data-guide-panel
      data-nodrag
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Footage details"
      className="absolute bottom-3 right-3 top-16 z-30 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-[#1a1a2e] shadow-[0_18px_48px_rgba(26,26,46,0.16)]"
    >
      <header className="flex items-start gap-2 border-b border-[#ececf1] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-bold">Footage details</h3>
          <p className="mt-0.5 truncate text-[13px] text-[#6a6b7b]" title={asset.label}>
            {asset.label}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close footage details"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-[#4a4b5c] transition hover:bg-[#f3f4f6]"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 text-[13px] leading-snug [scrollbar-width:thin] [scrollbar-color:#d9dae2_transparent]">
        <Section label="What the agent sees">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#fff3ec] px-2.5 py-[3px] text-[11.5px] font-semibold text-[#d24f14]">{IDENTITY_META[identity].label}</span>
            <span className="text-[12px] text-[#6a6b7b]">{kindLine.join(" · ")}</span>
          </div>
          <p className="mt-2 text-[12px] text-[#6a6b7b]">{an.identityEdited ? "Changed as you asked in the chat." : an.why}</p>
          {an.description && <p className="mt-2">{an.description}</p>}
          {an.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {an.tags.map((t) => (
                <span key={t} className="rounded-md bg-[#f6f5f8] px-1.5 py-0.5 text-[11.5px] text-[#4a4b5c]">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </Section>

        {/* 它在这条片子里怎么用 */}
        <Section label="How it's used">
          <ul className="space-y-1">
            {uses.length > 0 && <li>On the timeline in shot {uses.map((u) => u.index + 1).join(", ")}</li>}
            {asRef.length > 0 && <li>Reference for {asRef.join(", ")}</li>}
            {asLast.length > 0 && <li>Last frame of {asLast.join(", ")}</li>}
            {isMusic && <li>Background music</li>}
            {identity === "reference" && <li className="text-[#6a6b7b]">Style only — its colours, tone and copy style are borrowed; it stays out of the cut.</li>}
            {identity === "unused" && <li className="text-[#6a6b7b]">Left out of this ad.</li>}
            {!uses.length && !asRef.length && !asLast.length && !isMusic && identity !== "reference" && identity !== "unused" && (
              <li className="text-[#6a6b7b]">Not used yet.</li>
            )}
          </ul>
        </Section>

        {(an.sound || an.voiceSummary) && asset.kind !== "image" && (
          <Section label="Sound">
            {an.sound && an.sound !== "silent" && (
              <p>
                <span className="font-semibold">{SOUND_META[an.sound].label}</span>
                {an.soundNote ? ` · ${an.soundNote}` : ""}
                <span className="block text-[12px] text-[#6a6b7b]">{SOUND_META[an.sound].plan}</span>
              </p>
            )}
            {an.voiceSummary && <p className="mt-1.5">&ldquo;{an.voiceSummary}&rdquo;</p>}
          </Section>
        )}

        {an.issues?.length ? (
          <Section label="Quality notes">
            <ul className="list-disc space-y-0.5 pl-4 text-[#8a3d0c]">
              {an.issues.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        {asset.segments?.length ? (
          <Section label="Shot log">
            <div className="mb-2 flex h-1.5 gap-px overflow-hidden rounded-full bg-[#f1f2f5]">
              {asset.segments.map((g, i) => (
                <span key={i} style={{ width: `${((g.end - g.start) / Math.max(0.1, asset.durationSec)) * 100}%`, background: g.usable ? USABLE : CUT }} />
              ))}
            </div>
            <ul className="space-y-2.5">
              {asset.segments.map((g, i) => {
                const shots = shotOf(g.start, g.end);
                return (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-[1.4em] w-[74px] shrink-0 items-center gap-1.5 tabular-nums text-[#9a9bb0]">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: g.usable ? USABLE : CUT }} />
                      {g.start}–{g.end}s
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={g.usable ? "" : "text-[#9a9bb0]"}>{g.usable ? g.description : `Cut · ${g.reason || g.description}`}</span>
                      {g.usable && (
                        <span className="mt-0.5 block text-[11.5px] text-[#6a6b7b]">
                          {[g.roles.map((r) => ROLE_META[r as Role]?.label ?? r).join(" / "), g.sellingPoint, g.sound && g.sound !== "silent" ? `Sound: ${SOUND_META[g.sound].label}` : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                      {shots.length > 0 ? (
                        <span className="mt-1 inline-block rounded-md bg-[#fff7f1] px-1.5 py-0.5 text-[11px] font-semibold text-[#b8430f]">In shot {shots.join(", ")}</span>
                      ) : (
                        g.usable && (
                          <button
                            type="button"
                            onClick={() => addSegment(g.start, g.end, g.roles)}
                            className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-[#ff5e1a] ring-1 ring-inset ring-[#ffd9c4] transition hover:bg-[#fff7f1]"
                          >
                            <Plus className="size-3" /> Add to timeline
                          </button>
                        )
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9a9bb0]">{label}</p>
      {children}
    </section>
  );
}
