"use client";

/* 弹窗:Export、Share、Present(Magic Resize 改成 Image Builder 底部格式条，照 HTML)。 */

import { useEffect, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, Copy, Eye, Link2, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { ALL_FORMATS, FORMAT_FEATURE, FORMAT_LABEL, can, formatAllowed, requiredPlan, type ExportFormat } from "../entitlements";
import type { Design } from "../data";
import { brandCheck } from "../store";
import { DesignCanvas } from "./DesignCanvas";
import { GateTag, Modal, PlanTag, ctaBtn, ghostBtn, iconBtn, kitOf, useStudio } from "./ui";

export function ExportDialog({ design, onClose, onFixIssues }: { design: Design; onClose: () => void; onFixIssues: () => void }) {
  const s = useStudio();
  const kit = kitOf(s, design.brandId);
  const formats = ALL_FORMATS.filter((f) => (design.type === "deck" ? f !== "svg" : f !== "pptx"));
  const [fmt, setFmt] = useState<ExportFormat>("png");
  const [c2pa, setC2pa] = useState(true);
  const issues = can(s.plan, "brand_check") ? brandCheck(design, kit) : [];
  const aiLayers = design.pages.flatMap((p) => p.layers).filter((l) => l.ai).length;
  return (
    <Modal
      title="Export"
      onClose={onClose}
      width={460}
      footer={
        <>
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!formatAllowed(s.plan, fmt)) return s.upgrade({ feature: FORMAT_FEATURE[fmt]! });
              onClose();
              s.notify(`Exported ${FORMAT_LABEL[fmt]}${aiLayers && c2pa ? " · Content Credentials added" : ""}`);
            }}
            className={ctaBtn}
          >
            Download {FORMAT_LABEL[fmt]}
          </button>
        </>
      }
    >
      <p className="mb-2 text-[12px] font-semibold text-[#6a6b7b]">Format</p>
      <div className="grid grid-cols-2 gap-1.5">
        {formats.map((f) => {
          const ok = formatAllowed(s.plan, f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => (ok ? setFmt(f) : s.upgrade({ feature: FORMAT_FEATURE[f]! }))}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold ring-1 transition ${fmt === f ? "bg-[#fff7f1] text-[#1a1a2e] ring-[#ff9a3d]" : ok ? "text-[#1a1a2e] ring-[#ececf1] hover:ring-[#d4d3df]" : "text-[#9a9bb0] ring-[#ececf1]"}`}
            >
              {FORMAT_LABEL[f]}
              {!ok && <PlanTag plan={requiredPlan(FORMAT_FEATURE[f]!)} />}
            </button>
          );
        })}
      </div>
      {design.type === "deck" && fmt === "pptx" && <p className="mt-2 text-[12px] text-[#9a9bb0]">Text stays editable in PowerPoint. Fonts that can’t be embedded are converted to outlines.</p>}

      {issues.length > 0 && (
        <div className="mt-4 rounded-xl bg-[#fdecec] p-3 text-[12.5px] text-[#b91c1c]">
          <p className="flex items-center gap-1.5 font-semibold">
            <TriangleAlert className="size-3.5" /> Brand Check found {issues.length} issue{issues.length > 1 ? "s" : ""}
          </p>
          <p className="mt-0.5 text-[#b91c1c]/80">{issues[0].message}</p>
          <button type="button" onClick={onFixIssues} className="mt-2 text-[12px] font-semibold underline">
            Review and fix
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2 rounded-xl bg-[#faf8f6] p-3">
        <label className="flex items-start gap-2.5 text-[12.5px]">
          <input type="checkbox" checked={c2pa} disabled={!can(s.plan, "c2pa_policy")} onChange={(e) => setC2pa(e.target.checked)} className="mt-0.5 accent-[#ff5e1a]" />
          <span className="flex-1">
            <span className="flex items-center gap-1.5 font-semibold text-[#1a1a2e]">
              <ShieldCheck className="size-3.5" /> Content Credentials (C2PA) <GateTag feature="c2pa_policy" />
            </span>
            <span className="block text-[#6a6b7b]">
              {aiLayers ? `${aiLayers} AI-generated layer${aiLayers > 1 ? "s" : ""} will be labelled. ` : ""}Platforms like Meta and TikTok read this label.
            </span>
          </span>
        </label>
        <p className="text-[12px] text-[#6a6b7b]">{can(s.plan, "commercial_use") ? "Cleared for commercial use." : "Free plan: personal use only. Upgrade to Starter for commercial use."}</p>
      </div>
    </Modal>
  );
}

type Gate = Parameters<ReturnType<typeof useStudio>["gate"]>[0];
function ToggleRow({ on, onClick, label, sub, f }: { on: boolean; onClick: () => void; label: string; sub: string; f?: Gate }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f7f6f9]">
      <span className="flex-1">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a2e]">
          {label} {f && <GateTag feature={f} />}
        </span>
        <span className="block text-[11.5px] text-[#9a9bb0]">{sub}</span>
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-[#ff5e1a]" : "bg-[#d4d3df]"}`}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function ShareDialog({ design, onClose }: { design: Design; onClose: () => void }) {
  const s = useStudio();
  const [pw, setPw] = useState(false);
  const [domain, setDomain] = useState(false);
  const [dl, setDl] = useState(true);
  const link = `buzzvideo.ai/v/${design.id.slice(-6)}`;
  const toggle = (on: boolean, set: (v: boolean) => void, f: Parameters<typeof s.gate>[0]) => () => (on ? set(false) : s.gate(f) && set(true));
  return (
    <Modal title="Share" onClose={onClose} width={460}>
      <div className="flex items-center gap-2 rounded-xl border border-[#ececf1] p-1.5 pl-3">
        <Link2 className="size-4 text-[#9a9bb0]" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#1a1a2e]">{link}</span>
        <button type="button" onClick={() => s.notify("Link copied")} className={`${ghostBtn} h-8 px-3`}>
          <Copy className="size-3.5" /> Copy
        </button>
      </div>
      {!can(s.plan, "remove_badge") && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#9a9bb0]">
          The view page shows “Made with BuzzVideo”.
          <button type="button" onClick={() => s.upgrade({ feature: "remove_badge" })} className="font-semibold text-[#ff5e1a]">
            Remove badge
          </button>
          <PlanTag plan="starter" />
        </p>
      )}
      <div className="mt-3 space-y-0.5">
        <ToggleRow on={pw} onClick={toggle(pw, setPw, "share_password")} label="Password" sub="Viewers enter a password first" f="share_password" />
        <ToggleRow on={domain} onClick={toggle(domain, setDomain, "share_email_domain")} label="Only people at @presslogic.com" sub="Viewers sign in with a company email" f="share_email_domain" />
        <ToggleRow on={dl} onClick={() => setDl(!dl)} label="Allow download" sub="Viewers can save a copy" />
      </div>
      <div className="mt-3 rounded-xl bg-[#faf8f6] p-3">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1a1a2e]">
          <BarChart3 className="size-3.5" /> Viewer analytics <GateTag feature="share_analytics" />
        </p>
        {can(s.plan, "share_analytics") ? (
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[
              ["24", "Views"],
              ["9", "Viewers"],
              ["1m 42s", "Avg. time"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-lg bg-white py-2">
                <p className="text-[15px] font-bold text-[#1a1a2e]">{n}</p>
                <p className="text-[11px] text-[#9a9bb0]">{l}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[12px] text-[#6a6b7b]">See who viewed and how long they spent on each page.</p>
        )}
      </div>
      {design.type === "deck" && (
        <button type="button" onClick={() => s.notify("Presenter link copied")} className={`${ghostBtn} mt-3 w-full`}>
          <Eye className="size-3.5" /> Present link · opens in presenter view
        </button>
      )}
    </Modal>
  );
}

export function PresentMode({ design, start, onClose }: { design: Design; start: number; onClose: () => void }) {
  const s = useStudio();
  const kit = kitOf(s, design.brandId);
  const [i, setI] = useState(start);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === " ") setI((x) => Math.min(design.pages.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [design.pages.length, onClose]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0d14]">
      <div className="flex h-12 shrink-0 items-center gap-3 px-4 text-white/70">
        <span className="text-[12.5px]">
          {i + 1} / {design.pages.length}
        </span>
        {!can(s.plan, "remove_badge") && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
            <Sparkles className="size-3" /> Made with BuzzVideo
          </span>
        )}
        <button type="button" onClick={onClose} aria-label="Exit presentation" className={`${iconBtn} ml-auto text-white/70 hover:bg-white/10 hover:text-white`}>
          <X className="size-4" />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center px-14">
        <div className="w-full max-w-[1100px] overflow-hidden rounded-lg">
          <DesignCanvas page={design.pages[i]} ratio={design.ratio} kit={kit} />
        </div>
      </div>
      <div className="flex h-14 shrink-0 items-center justify-center gap-3">
        <button type="button" aria-label="Previous slide" onClick={() => setI((x) => Math.max(0, x - 1))} className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" aria-label="Next slide" onClick={() => setI((x) => Math.min(design.pages.length - 1, x + 1))} className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

