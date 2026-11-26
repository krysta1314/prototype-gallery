"use client";
/* 教程中心外壳(v1.14,2026-11-26):复用 v1.13 官网的顶栏 / 页脚 / 解答页模板。
   不带 slug = 教程中心首页(教程卡片列表);带 slug = 单篇教程(GuidePage:视频位 + 步骤 + FAQ)。
   视频：现在放站内现有成片;发布到 YouTube 后把链接填进 content.ts 的 YOUTUBE,页面出现「Watch on YouTube」。 */
import { ArrowUpRight, Play } from "lucide-react";
import { useToast } from "../../../(v1.7)/blog/toast";
import { APPLE_FONT } from "../../../(v1.12)/hybrid-reel/agent/chat/shell";
import { SiteNavHeader, type OnLink } from "../../../(v1.13)/site-nav/SiteNavHeader";
import { SiteFooter } from "../../../(v1.13)/site-nav/SiteFooter";
import { OA_WRAP, PicView } from "../../../(v1.13)/site/oa/kit";
import { GuidePage, resolveMedia } from "../../../(v1.13)/site/learn/LearnTemplate";
import { TUTORIALS, YOUTUBE } from "./content";

const BASE = "/prototypes/site/tutorials";

function Hub() {
  return (
    <main className="bg-black text-white">
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute left-[-10%] top-[-260px] -z-10 h-[520px] w-[900px] rounded-full bg-[#FF744D]/[0.14] blur-[120px]" />
        <div className={`${OA_WRAP} pb-12 pt-14 md:pb-16 md:pt-24`}>
          <h1 className="max-w-[14ch] text-[clamp(40px,5.6vw,76px)] font-black leading-[0.98] tracking-[-0.035em] [text-wrap:balance]">BuzzVideo tutorials</h1>
          <p className="mt-7 max-w-[40rem] text-[19px] leading-[1.6] text-white/85 [text-wrap:pretty]">
            Step-by-step guides to making ads, product videos, avatars and workflows on BuzzVideo. Each one shows the steps, the settings to pick and a finished example.
          </p>
        </div>
      </section>
      <div className={`${OA_WRAP} pb-24 md:pb-32`}>
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {TUTORIALS.map((t) => {
            const pic = resolveMedia(t.media);
            return (
              <li key={t.slug}>
                <a href={`${BASE}/${t.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
                    {pic ? <PicView p={pic} className="size-full" /> : <div className="grid size-full place-items-center text-white/40"><Play className="size-8" aria-hidden /></div>}
                  </div>
                  <h2 className="mt-4 text-[19px] font-bold leading-snug transition group-hover:text-[#FF744D]">{t.h1}</h2>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#B5B5B5]">{t.card}</p>
                  {t.howto && <p className="mt-2 text-[13px] text-[#9F9F9F]">{t.howto.steps.length} steps</p>}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

export function TutorialsShell({ slug }: { slug?: string }) {
  const [notify, toast] = useToast();
  const info = (t: string) => notify(t, "info");
  const onLink: OnLink = (l) => info(`${l.label} → ${l.href}(待建，后续批次)`);
  const g = slug ? TUTORIALS.find((t) => t.slug === slug) : undefined;
  const yt = slug ? YOUTUBE[slug] : undefined;
  return (
    <div className="min-h-dvh bg-black text-[#240A03]" style={{ fontFamily: APPLE_FONT }}>
      {toast}
      <SiteNavHeader overlay mark={false} onLink={onLink} onAuth={(w) => info(w === "login" ? "Log in 将打开登录弹窗" : "Start free 将打开注册弹窗")} />
      {g ? (
        <>
          <nav aria-label="Breadcrumb" className="bg-black pt-24 text-white md:pt-28">
            <div className={`${OA_WRAP} flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-[#9F9F9F]`}>
              <a href={BASE} className="font-semibold text-white/80 transition hover:text-white">
                ← All tutorials
              </a>
              {yt && (
                <a href={yt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#FF744D] hover:underline">
                  Watch on YouTube <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
          </nav>
          <GuidePage g={g} onLink={onLink} />
        </>
      ) : (
        <Hub />
      )}
      <SiteFooter mark={false} onLink={onLink} notify={info} />
    </div>
  );
}
