"use client";

/* /3d-to-video 落地页(2026-11-27 重做)。
   Monica:「这个 3D to video 页面的点击是要去到 3D studio，所以这个落地页按照这个落地页去设计 https://www.topview.ai/3d-builder」。
   照 TopView 3D Builder 的结构：首屏(产品界面) → 案例(3D 白模 → 渲染成片) → 四段功能(参考图生成场景 / 先定镜头 / 一个场景多机位 / 场景可编辑)
   → 预演三点 → 和 Motion Control 的对比表 → 三步用法 → 收尾 CTA → FAQ。
   所有按钮都进产品里的 3D Studio(appOf("/3d-studio"));文案沿用本页 SEO 关键词(3d to video / 3d blockout / previz)。 */

import { ArrowRight, Box, Clapperboard, Crosshair, Layers } from "lucide-react";
import { appOf, go, type OnLink } from "../../site-nav/SiteNavHeader";
import { statusOf } from "../../site-nav/nav-data";
import { OA_CTA, OA_H2, OA_WRAP, OACompare, OACta, OAFaq, OAFeatureRows, OASteps, PicView, type OARow } from "../oa/kit";
import type { Pic } from "../oa/pool";
import { CONTENT_UPDATED } from "../content-date";
import { SIGNUP_CREDITS, toolBySlug } from "./tool-content";
import { ThreeDBuildDemo } from "./ThreeDBuildDemo";

const PG = "/prototypes/site/pages/3d-to-video";
const v = (n: string, alt: string, aspect = "16:9"): Pic => ({ kind: "video", src: `${PG}/${n}.mp4`, poster: `${PG}/${n}-poster.webp`, aspect, alt, prompt: "", source: "" });
const img = (src: string, alt: string, aspect = "16:9"): Pic => ({ kind: "image", src, aspect, alt, prompt: "", source: "" });

const CASES = [
  { key: "moto", title: "Coastal motorcycle ride", before: v("what-before", "Grey 3D blockout of a motorcycle rider on a coastal road with a moving camera"), after: v("what-after", "The same shot rendered as a realistic motorcycle ride along a sunset coastal highway") },
  { key: "duel", title: "Bamboo forest duel", before: v("use1-before", "Grey mannequins blocking a sword duel in a bamboo forest"), after: v("use1-after", "The same blocking as a misty samurai duel in a bamboo forest") },
  { key: "chase", title: "Helicopter chase", before: v("use3-before", "Grey 3D layout of a helicopter chasing a motorbike down a beach road"), after: v("use3-after", "The same chase rendered with a real helicopter and motorbike on a wet neon street at dusk") },
];

const PREVIS = [
  { icon: Crosshair, title: "Rehearse the move", body: "Set the camera position, height, lens and move in 3D, and watch the framing before you spend a credit." },
  { icon: Layers, title: "Spend credits on shots you keep", body: "Test composition and camera paths on the stage first, instead of paying for takes that miss the layout." },
  { icon: Clapperboard, title: "Generate from a locked plan", body: "The render follows the staging, timing and camera you set, so the finished shot starts from your plan, not a lucky prompt." },
];

const VERSUS = [
  ["When you use it", "Before generation: build the scene and rehearse the camera", "During generation: copy a performance onto a character"],
  ["What you control", "The set, objects, where people stand, camera angle, lens and move", "Body movement, gestures and dance from a reference clip"],
  ["Best for", "Previz, product hero shots, multi-shot coverage, hard-to-film scenes", "Dance trends, gestures and matching an actor's performance"],
  ["Typical question", "Where should the scene and the camera be?", "How should the subject move?"],
];

export function ThreeDLanding({ onLink }: { onLink: OnLink }) {
  const t = toolBySlug("3d-to-video")!;
  /* 所有按钮进 3D Studio;产品页没接上时给 toast */
  const enter = (label: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const app = appOf("/3d-studio");
    if (app && !app.startsWith("/prototypes/site")) window.location.href = app;
    else go("/3d-studio", statusOf("/3d-studio"), label, onLink);
  };
  const toStudio = (label: string) => ({ href: "/3d-studio", onClick: enter(label) });

  const rows: OARow[] = [
    {
      key: "scene",
      title: "Generate a 3D scene from a prompt or one reference",
      body: "Describe the scene or drop in a reference image, and 3D Studio builds an editable 3D stage with the set, props and people in place. You start from a blocked-out scene instead of an empty viewport, with no Blender or Unreal Engine needed.",
      media: <div className="aspect-video"><PicView p={{ kind: "video", src: "/prototypes/site/nav/studios/3d.mp4", aspect: "16:10", alt: "A 3D stage built in BuzzVideo 3D Studio with a camera placed around the subject", prompt: "", source: "" }} /></div>,
      cta: { label: "Open 3D Studio", link: toStudio("Open 3D Studio") },
    },
    {
      key: "camera",
      title: "Set the camera before you generate",
      body: "Place the camera, pick the angle, height and lens, and animate a push-in, pan, orbit or tracking move. The exact-shot preview shows the frame the AI will render, so you see the composition before the video exists.",
      /* 2026-11-27 Monica「图文不符」:原图是 2400×940 长条，16:9 卡片裁掉了右侧预览面板 → 改用围绕机位 + 轨迹 + 镜头参数面板裁的 16:9 图 */
      media: <div className="aspect-video"><PicView p={img(`${PG}/camera-preview.webp`, "A camera on a stand in BuzzVideo 3D Studio tracking a skateboarder along a curved path, with the exact-shot preview showing angle, lens, distance and tracking speed", "16:9")} /></div>,
      cta: { label: "Set a camera move", link: toStudio("Set a camera move") },
    },
    {
      key: "shots",
      title: "Keep one scene across multiple shots",
      body: "Move cameras on the same stage instead of rebuilding the world in every prompt. A wide, a close-up and a side angle come from one scene, so space, props and style stay consistent from shot to shot.",
      media: <div className="aspect-video"><OACompare before={img(`${PG}/faq-before.webp`, "Grey 3D layout of a skier jumping between white peaks", "4:3")} after={img(`${PG}/faq-after.webp`, "The same frame as a realistic skier in a yellow jacket mid-jump", "4:3")} beforeLabel="3D layout" afterLabel="Rendered" /></div>,
      cta: { label: "Try it now", link: toStudio("Try it now") },
    },
    {
      key: "blockout",
      title: "Bring your own blockout from Blender or Unreal",
      body: "Already have a previz? Export a viewport or clay render from Blender, Unreal Engine, Cinema 4D or Maya, up to 15 seconds and 32 shots, and MiniMax H3 Max renders it as a realistic video that keeps your camera moves, staging and timing at up to 1080p.",
      media: <div className="aspect-video"><PicView p={v("models", "A skier in a red jacket carving down a sunny mountain slope, rendered from a 3D layout with a tracking camera")} /></div>,
      cta: { label: "Render a blockout", link: toStudio("Render a blockout") },
    },
  ];

  const tile = (Icon: typeof Box, label: string) => (
    <div className="grid aspect-[4/3] place-items-center rounded-[14px] bg-[#240A03] text-white">
      <div className="text-center"><Icon className="mx-auto size-10 text-[#FF744D]" strokeWidth={1.6} /><p className="mt-3 text-[13px] font-semibold text-white/70">{label}</p></div>
    </div>
  );
  const steps = [
    { title: "Build the scene", body: "Describe the scene or upload a reference image. 3D Studio builds an editable 3D stage, or upload your own blockout render.", visual: tile(Box, "Prompt or reference → 3D stage") },
    { title: "Direct the camera and objects", body: "Move objects, set where people stand and animate the camera with a push, pan, orbit or follow. Preview the move from the camera view.", visual: tile(Crosshair, "Angle · lens · move") },
    { title: "Generate the video", body: "Keep the stage and generate the shot at 480p, 768p or 1080p. Move the camera when you need another angle of the same scene.", visual: tile(Clapperboard, "Render at up to 1080p") },
  ];

  return (
    <main className="bg-black text-white">
      {/* ── 首屏：H1 + 说明 + 进 3D Studio,下面是产品界面 ── */}
      <section className="relative isolate overflow-hidden pb-16 pt-[96px] md:pb-24 md:pt-[104px]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-260px] -z-10 h-[560px] w-[min(1100px,90vw)] -translate-x-1/2 rounded-full bg-[#FF744D]/[0.16] blur-[120px]" />
        <div className={`${OA_WRAP} text-center`}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-semibold text-[#E8E8E8] ring-1 ring-white/10">
            <Box className="size-3.5 text-[#FF744D]" />
            BuzzVideo 3D Studio
          </p>
          <h1 className="mx-auto mt-6 max-w-[min(1320px,94vw)] font-black uppercase leading-[0.92] tracking-[-0.035em] [text-wrap:balance] text-[clamp(44px,calc(24px+4.6vw),112px)]">
            <span className="block">3D to Video</span>
            <span className="mt-2 block text-[clamp(24px,calc(12px+2.4vw),56px)] leading-[1] tracking-[-0.02em] text-[#FF744D]">Block the shot in 3D, render it real</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[760px] text-[15px] leading-[24px] text-white/75 [text-wrap:pretty] md:text-[16px] md:leading-[26px]">
            BuzzVideo&apos;s 3D to Video turns a 3D scene into a realistic video. Build the stage in 3D Studio from a prompt or a reference, or upload a blockout from Blender, Unreal Engine, Cinema 4D or Maya, set the camera, and render the shot with your staging and timing intact.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a {...toStudio("Open 3D Studio")} className={`${OA_CTA} px-6 py-3.5`}>
              Open 3D Studio <ArrowRight className="size-4" />
            </a>
            <a href="#cases" className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-3 text-[15px] font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15">
              See 3D to video examples
            </a>
          </div>
          <p className="mt-3 text-[12.5px] text-white/50">{SIGNUP_CREDITS} free credits when you sign up · runs in your browser, no 3D software needed</p>
        </div>
        <div className="mx-auto mt-12 w-[min(1320px,calc(100vw-32px))] md:mt-14">
          <ThreeDBuildDemo />
        </div>
      </section>

      {/* ── 案例：白模 → 成片 ── */}
      <section id="cases" className="scroll-mt-28 py-20 md:py-28">
        <div className={OA_WRAP}>
          <h2 className={OA_H2}>3D to video examples</h2>
          <p className="mt-5 max-w-[60rem] text-[18px] leading-[28px] text-[#CACACA]">Each shot started as a grey 3D blockout. The camera move, staging and timing stayed the same; BuzzVideo added the materials, lighting and world.</p>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {CASES.map((c) => (
              <li key={c.key}>
                <div className="aspect-video overflow-hidden rounded-[20px] bg-[#111] ring-1 ring-white/10"><OACompare before={c.before} after={c.after} beforeLabel="3D blockout" afterLabel="Rendered" /></div>
                <p className="mt-3 text-[15px] font-semibold">{c.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <OAFeatureRows id="features" title="Key 3D to Video features" sub="Build and direct the stage in 3D Studio, then render it with MiniMax H3 Max on the same BuzzVideo account and credits." rows={rows} />

      {/* ── 预演三点 ── */}
      <section className="py-20 md:py-28">
        <div className={OA_WRAP}>
          <div className="mx-auto max-w-[52rem] text-center">
            <h2 className={OA_H2}>Previz you can rehearse before you render</h2>
            <p className="mt-5 text-[18px] leading-[28px] text-[#CACACA]">Set the blocking first, so your credits go to shots that already have the right layout and camera.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PREVIS.map((x, i) => (
              <div key={x.title} className="rounded-[20px] bg-white/[0.04] p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#FF744D]/15 text-[#FF744D]"><x.icon className="size-5" /></span>
                  <span className="text-[13px] font-bold tabular-nums text-white/30">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-[19px] font-bold">{x.title}</h3>
                <p className="mt-2 text-[15px] leading-[24px] text-[#CACACA]">{x.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 对比表 ── */}
      <section className="pb-20 md:pb-28">
        <div className={OA_WRAP}>
          <div className="mx-auto max-w-[52rem] text-center">
            <h2 className={OA_H2}>3D Studio vs. Motion Control</h2>
            <p className="mt-5 text-[18px] leading-[28px] text-[#CACACA]">Use 3D Studio to build and direct the stage. Use Motion Control when the job is how the subject moves.</p>
          </div>
          <div className="mt-10 overflow-x-auto rounded-[20px] ring-1 ring-white/10">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead className="bg-white/[0.04] text-[13px] uppercase tracking-[0.06em] text-white/50">
                <tr><th className="px-5 py-4 font-semibold">Focus</th><th className="px-5 py-4 font-semibold text-[#FF744D]">3D Studio · 3D to Video</th><th className="px-5 py-4 font-semibold">Motion Control</th></tr>
              </thead>
              <tbody>
                {VERSUS.map(([k, a, b]) => (
                  <tr key={k} className="border-t border-white/[0.08]"><td className="px-5 py-4 font-semibold text-white/80">{k}</td><td className="px-5 py-4 text-white">{a}</td><td className="px-5 py-4 text-[#CACACA]">{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <OASteps title="How to make a video from a 3D scene" steps={steps} />
      <OAFaq items={[t.definition, ...t.faq]} />
      <OACta title="Start with 3D Studio" sub="Build the scene from a prompt or reference, rehearse the camera, and render video from a stage you can still edit." cta={{ label: "Open 3D Studio", link: toStudio("Open 3D Studio") }} />
      <div className="pb-14" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "BuzzVideo 3D to Video", applicationCategory: "MultimediaApplication", operatingSystem: "Web", description: t.lead, dateModified: CONTENT_UPDATED, publisher: { "@type": "Organization", name: "BuzzVideo AI", url: "https://buzzvideo.ai" } },
            { "@context": "https://schema.org", "@type": "HowTo", name: "How to make a video from a 3D scene", step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body })) },
            { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [t.definition, ...t.faq].map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
          ]),
        }}
      />
    </main>
  );
}
