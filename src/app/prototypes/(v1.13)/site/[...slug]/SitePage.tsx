"use client";

/* 官网落地页的通配路由(2026-11-18):/prototypes/site/<真实网址> 渲染导航里还没上线的页面。
   网址和真实站点一一对应(/prototypes/site/wan-3-0 ↔ buzzvideo.ai/wan-3-0;2026-11-19 起落地页是一级网址)。
   线上 / UAT 已有的页面不在这里重做(导航直接打开真页面,见 SiteNavHeader 的 targetOf);
   还没做的页面不放占位，返回 404 —— 按批次做完一族就放开一族(BUILT)。 */

import { notFound, useParams } from "next/navigation";
import { useToast } from "../../../(v1.7)/blog/toast";
import { APPLE_FONT } from "../../../(v1.12)/hybrid-reel/agent/chat/shell";
import { SiteNavHeader, type OnLink } from "../../site-nav/SiteNavHeader";
import { SiteFooter } from "../../site-nav/SiteFooter";
import { modelPageData } from "../models/model-content";
import { ModelTemplate } from "../models/ModelTemplate";
import { toolBySlug } from "../tools/tool-content";
import { ToolTemplate } from "../tools/ToolTemplate";
import { CanvasLanding } from "../tools/CanvasLanding";
import { ThreeDLanding } from "../tools/ThreeDLanding";
import { PAGE_REGISTRY } from "../pages-registry";

export function SitePage() {
  const params = useParams<{ slug: string[] }>();
  const parts = params.slug ?? [];
  const [notify, toast] = useToast();
  const info = (t: string) => notify(t, "info");
  const onLink: OnLink = (l) => info(`${l.label} → ${l.href}(待建，后续批次)`);

  let body: React.ReactNode = null;
  if (parts[0] === "models" && parts.length === 2) {
    /* 分类页已并进唯一的聚合页(2026-11-24);旧网址仍能打开，上线后 301 到 /models */
    if (["video", "image", "audio"].includes(parts[1])) body = PAGE_REGISTRY.models?.render(onLink) ?? null;
    else {
      const d = modelPageData(parts[1]);
      if (d) body = <ModelTemplate d={d} onLink={onLink} />;
    }
  }
  /* 2026-11-19 落地页改成一级网址(照 Higgsfield):/prototypes/site/ai-image-generator、/prototypes/site/kling-4-0;旧的 tools/、models/ 路径也还能打开 */
  if (parts.length === 1 && parts[0] !== "tools") {
    const hub = parts[0].match(/^ai-(video|image|audio)-models$/);
    if (hub) body = PAGE_REGISTRY.models?.render(onLink) ?? null;
    const t = hub ? undefined : toolBySlug(parts[0]);
    /* 2026-11-25 /canvas 照 Higgsfield Canvas 页单独做(CanvasLanding.tsx),不走工具模板 */
    if (t && parts[0] === "canvas") body = <CanvasLanding onLink={onLink} />;
    /* 2026-11-27 /3d-to-video 照 TopView 3D Builder 单独做，按钮都进 3D Studio(ThreeDLanding.tsx) */
    else if (t && parts[0] === "3d-to-video") body = <ThreeDLanding onLink={onLink} />;
    else if (t) body = <ToolTemplate t={t} onLink={onLink} />;
    else {
      const d = modelPageData(parts[0] === "seedance" ? "seedance-2-5" : parts[0]);
      if (d) body = <ModelTemplate d={d} onLink={onLink} />;
    }
  }
  /* /tools 聚合页已删(2026-11-24);旧的 tools/<slug> 路径仍能打开 */
  if (parts[0] === "tools" && parts.length === 2) {
    const t = toolBySlug(parts[1]);
    if (t) body = <ToolTemplate t={t} onLink={onLink} />;
  }
  /* 2026-11-23 指南 / 对比 / 模板 / 教程 / 免费工具等各批落地页(一级网址) */
  if (!body && parts.length === 1 && PAGE_REGISTRY[parts[0] as keyof typeof PAGE_REGISTRY]) body = PAGE_REGISTRY[parts[0] as keyof typeof PAGE_REGISTRY].render(onLink);
  /* 2026-11-27 Monica:竞品对比页统一成 /compare/<竞品>(和线上 /compare/topview 一致),注册表 key = "compare/<竞品>" */
  if (!body && parts.length === 2 && parts[0] === "compare") {
    const k = `compare/${parts[1]}` as keyof typeof PAGE_REGISTRY;
    if (PAGE_REGISTRY[k]) body = PAGE_REGISTRY[k].render(onLink);
  }
  if (!body) notFound();

  return (
    <div className="min-h-dvh bg-black text-[#240A03]" style={{ fontFamily: APPLE_FONT }}>
      {toast}
      <SiteNavHeader overlay mark={false} onLink={onLink} onAuth={(w) => info(w === "login" ? "Log in 将打开登录弹窗" : "Start free 将打开注册弹窗")} />
      {body}
      <SiteFooter mark={false} onLink={onLink} notify={info} />
    </div>
  );
}
