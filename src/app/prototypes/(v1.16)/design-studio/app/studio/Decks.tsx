"use client";

/* Decks(照 Notion HTML 示意原型):顶部「Generate deck」输入框 + 品牌主题 chip +「Generate outline」;
   左边页缩略图，中间当前页(可直接改字),右边 Deck(Present / Download PPTX / Download PDF / Share view link)和 AI on this slide。
   新增(调研):先出大纲(免费)再生成(按页扣积分、先确认总价)、PPTX 要 Pro / PDF 要 Starter、AI 动作标积分、分享权限。 */

import { useState } from "react";
import { GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import { can, requiredPlan } from "../entitlements";
import { costOf } from "../pricing";
import { DECK_SLIDES, IMG, deckFromOutline, uid, type Design, type Layer } from "../data";
import { DesignCanvas } from "./DesignCanvas";
import { PresentMode, ShareDialog } from "./EditorDialogs";
import { CreditPill, Modal, PlanTag, ctaBtn, ghostBtn, iconBtn, kitOf, useStudio } from "./ui";

const label = "text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a9bb0]";

export function Decks({ design, onOpen }: { design: Design | undefined; onOpen: (id: string) => void }) {
  const s = useStudio();
  const kit = kitOf(s, design?.brandId ?? s.kitId);
  const [prompt, setPrompt] = useState("8-slide sales deck: BuzzVideo enterprise plan for retail brands, in BusinessFocus style");
  const [outline, setOutline] = useState<string[] | null>(null);
  const [writing, setWriting] = useState(false);
  const [slide, setSlide] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"present" | "share" | null>(null);
  const [status, setStatus] = useState("");

  const say = (m: string) => {
    setStatus(m);
    s.notify(m);
  };
  const genOutline = () => {
    setWriting(true);
    window.setTimeout(() => {
      setWriting(false);
      setOutline(["Enterprise AI video, on brand", "The problem today", "BuzzVideo Studio", "How teams use it", "What admins control", "Customer story", "Plans and pricing", "Next step"]);
    }, 900);
  };
  const genDeck = (titles: string[]) =>
    s.confirmCredits({
      title: `Generate ${titles.length} slides`,
      credits: costOf("deck_slide", titles.length),
      detail: `${costOf("deck_slide")} credits per slide, themed with ${kit?.name ?? "no brand"}. Failed slides are refunded.`,
      onConfirm: () => {
        const bodies = Object.fromEntries(DECK_SLIDES);
        const d = deckFromOutline(
          kit,
          prompt.split(":")[0].slice(0, 40) || "New deck",
          titles.map((t) => [t, bodies[t] ?? "[KEY POINTS FOR THIS SLIDE]"]),
        );
        s.add([d]);
        onOpen(d.id);
        setOutline(null);
        setSlide(0);
        say(`Deck ready: ${titles.length} slides on ${kit?.name ?? "neutral"} theme`);
      },
    });

  const page = design?.pages[Math.min(slide, design.pages.length - 1)];
  const update = (fn: (d: Design) => Design) => design && s.save({ ...fn(design), edited: "Just now" });
  const patch = (id: string, p: Partial<Layer>) => update((d) => ({ ...d, pages: d.pages.map((pg, i) => (i === slide ? { ...pg, layers: pg.layers.map((l) => (l.id === id ? { ...l, ...p } : l)) } : pg)) }));
  const ai = (a: "rewrite_shorter" | "slide_image" | "to_chart" | "video", msg: string) => {
    if (!design || !page) return;
    if (a === "video") return say("Sent to BuzzVideo: 15s video from slide");
    if (!s.charge(costOf(a))) return;
    if (a === "rewrite_shorter") {
      const body = page.layers.find((l) => l.name === "Body");
      if (body) patch(body.id, { text: (body.text ?? "").split(/[,.]/)[0] + "." });
    }
    if (a === "slide_image")
      update((d) => ({ ...d, pages: d.pages.map((pg, i) => (i === slide ? { ...pg, layers: [...pg.layers.map((l) => (l.name === "Body" || l.name === "Title" ? { ...l, w: Math.min(l.w, 48) } : l)), { id: uid("l"), kind: "image" as const, name: "Slide image", x: 58, y: 24, w: 36, h: 56, src: IMG.promo, radius: 1.2, ai: true }] } : pg)) }));
    say(`${msg} · ${costOf(a)} credits`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-[#f1f1f4] bg-white px-5 py-3">
        <label htmlFor="ds-deckprompt" className={label}>
          Generate deck
        </label>
        <input id="ds-deckprompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="h-10 min-w-0 flex-[1_1_360px] rounded-lg border border-[#e1e3e9] px-3 text-[13.5px] outline-none focus:border-[#ff5e1a] focus:ring-[3px] focus:ring-[#ff5e1a]/15" />
        <span className="inline-flex h-6 items-center rounded-md bg-[#fff0e6] px-2 text-[11.5px] font-medium text-[#ff5e1a]">{kit?.name ?? "No brand"} theme</span>
        <button type="button" disabled={!prompt.trim() || writing} onClick={genOutline} className={ctaBtn}>
          <Sparkles className="size-3.5" /> {writing ? "Writing outline…" : "Generate outline"}
        </button>
      </div>

      {!design || !page ? (
        <div className="grid flex-1 place-items-center bg-[#f3f1ee] text-[13px] text-[#9a9bb0]">Describe your deck above to start.</div>
      ) : (
        <div className="flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-y-auto">
          <aside className="flex w-[220px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-[#f1f1f4] bg-[#fcfcfd] p-3 max-lg:w-full max-lg:flex-row max-lg:overflow-x-auto max-lg:border-b max-lg:border-r-0 max-lg:[&>button]:w-[150px] max-lg:[&>button]:shrink-0">
            {design.pages.map((p, i) => (
              <button key={p.id} type="button" onClick={() => (setSlide(i), setSel(null))} className={`flex items-start gap-2 rounded-lg border-[1.5px] p-1.5 text-left ${i === slide ? "border-[#ff9a3d]" : "border-transparent hover:border-[#ececf1]"}`}>
                <span className="w-4 pt-0.5 text-[11px] text-[#9a9bb0]">{i + 1}</span>
                <span className="flex-1 overflow-hidden rounded ring-1 ring-black/5">
                  <DesignCanvas page={p} ratio={16 / 9} kit={kit} />
                </span>
              </button>
            ))}
          </aside>

          <main className="relative min-w-0 flex-1 bg-[#f3f1ee] max-lg:min-h-[300px] max-lg:shrink-0" onPointerDown={() => setSel(null)}>
            <div className="absolute inset-6 grid place-items-center [container-type:size] sm:inset-8">
              <div className="overflow-hidden rounded-[10px] shadow-[0_12px_32px_rgba(26,26,46,0.16)]" style={{ width: `min(100cqw, ${16 / 9} * 100cqh, 820px)` }} onPointerDown={(e) => e.stopPropagation()}>
                <DesignCanvas page={page} ratio={16 / 9} kit={kit} selected={sel} onSelect={setSel} onChange={patch} editable />
              </div>
            </div>
          </main>

          <aside className="flex w-[260px] shrink-0 flex-col gap-2 overflow-y-auto border-l border-[#f1f1f4] bg-white p-4 max-lg:w-full max-lg:border-l-0 max-lg:border-t">
            <p className={label}>Deck</p>
            <button type="button" onClick={() => setDialog("present")} className={ctaBtn}>
              Present
            </button>
            <button type="button" onClick={() => (s.gate("export_pptx") ? say("PPTX downloaded · text stays editable in PowerPoint") : undefined)} className={`${ghostBtn} justify-between`}>
              Download PPTX {!can(s.plan, "export_pptx") && <PlanTag plan={requiredPlan("export_pptx")} />}
            </button>
            <button type="button" onClick={() => (s.gate("export_pdf") ? say("PDF downloaded") : undefined)} className={`${ghostBtn} justify-between`}>
              Download PDF {!can(s.plan, "export_pdf") && <PlanTag plan={requiredPlan("export_pdf")} />}
            </button>
            <button type="button" onClick={() => setDialog("share")} className={ghostBtn}>
              Share view link
            </button>
            <p className={`${label} mt-2.5`}>AI on this slide</p>
            {(
              [
                ["rewrite_shorter", "Rewrite shorter", "Rewritten shorter"],
                ["slide_image", "Generate image for slide", "Slide image generated on brand"],
                ["to_chart", "Turn into chart", "Converted to chart"],
                ["video", "Add 15s video from slide", ""],
              ] as const
            ).map(([a, t, m]) => (
              <button key={a} type="button" onClick={() => ai(a, m)} className={`${ghostBtn} justify-between`}>
                {t} {a === "video" ? <span className="text-[11px] font-semibold text-[#9a9bb0]">Video Gen</span> : <CreditPill credits={costOf(a)} />}
              </button>
            ))}
            <span role="status" className="mt-1 text-[12.5px] font-medium text-[#ff5e1a]">
              {status}
            </span>
            {page.note && (
              <>
                <p className={`${label} mt-2`}>Speaker notes</p>
                <p className="rounded-xl bg-[#faf8f6] p-2.5 text-[12.5px] text-[#4a4b5c]">{page.note}</p>
              </>
            )}
          </aside>
        </div>
      )}

      {outline && (
        <Modal
          title={`Outline · ${outline.length} slides`}
          onClose={() => setOutline(null)}
          width={520}
          footer={
            <>
              <span className="mr-auto text-[12.5px] text-[#6a6b7b]">
                {outline.length} × {costOf("deck_slide")} = <b className="text-[#1a1a2e]">{costOf("deck_slide", outline.length)} credits</b>
              </span>
              <button type="button" onClick={() => setOutline(null)} className={ghostBtn}>
                Cancel
              </button>
              <button type="button" disabled={!outline.length} onClick={() => genDeck(outline.filter((t) => t.trim()))} className={ctaBtn}>
                Generate deck
              </button>
            </>
          }
        >
          <p className="mb-3 text-[12.5px] text-[#6a6b7b]">Outlines are free. Edit, add or remove slides before you spend credits.</p>
          <ol className="space-y-1.5">
            {outline.map((t, i) => (
              <li key={i} className="group flex items-center gap-2 rounded-xl border border-[#ececf1] px-2.5 py-2">
                <GripVertical className="size-4 text-[#d4d3df]" />
                <span className="w-5 text-[12px] font-semibold tabular-nums text-[#9a9bb0]">{i + 1}</span>
                <input value={t} onChange={(e) => setOutline(outline.map((x, j) => (j === i ? e.target.value : x)))} className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-[#1a1a2e] outline-none" />
                <button type="button" aria-label="Remove slide" onClick={() => setOutline(outline.filter((_, j) => j !== i))} className={`${iconBtn} size-7 opacity-0 group-hover:opacity-100`}>
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setOutline([...outline, "New slide"])} className={`${ghostBtn} mt-2 h-8 text-[12.5px]`}>
            <Plus className="size-3.5" /> Add slide
          </button>
        </Modal>
      )}
      {dialog === "present" && design && <PresentMode design={design} start={slide} onClose={() => setDialog(null)} />}
      {dialog === "share" && design && <ShareDialog design={design} onClose={() => setDialog(null)} />}
    </div>
  );
}

