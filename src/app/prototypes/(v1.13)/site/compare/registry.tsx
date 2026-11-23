"use client";

/* 竞品替代页 + 榜单页的注册表(2026-11-23)。key = 一级网址(不带斜杠);标题和描述在 meta.ts(服务端也读)。
   TopView 替代页(/buzzvideo-vs-topview)已在 UAT 上线，不在这里重做。 */

import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { ALTERNATIVES, BEST_OF } from "./content";
import { AlternativesTemplate, BestOfTemplate } from "./CompareTemplates";
import { META } from "./meta";

type Page = { title: string; description: string; render: (onLink: OnLink) => ReactNode };

export const PAGES: Record<string, Page> = {
  ...Object.fromEntries(ALTERNATIVES.map((p) => [p.slug, { ...META[p.slug], render: (onLink: OnLink) => <AlternativesTemplate p={p} onLink={onLink} /> }])),
  ...Object.fromEntries(BEST_OF.map((p) => [p.slug, { ...META[p.slug], render: (onLink: OnLink) => <BestOfTemplate p={p} onLink={onLink} /> }])),
};
