"use client";

/* 模型指南 / 对比 / 模型总页的注册表(2026-11-19)。key = 一级网址(不带斜杠),SitePage 按 key 渲染;
   标题和描述在 meta.ts(服务端 generateMetadata 也读那份)。 */

import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { COMPARISONS, GUIDES } from "./content";
import { ComparisonTemplate } from "./ComparisonTemplate";
import { GuideTemplate } from "./GuideTemplate";
import { META } from "./meta";
import { ModelsHub } from "./ModelsHub";

type Page = { title: string; description: string; render: (onLink: OnLink) => ReactNode };

export const PAGES: Record<string, Page> = {
  ...Object.fromEntries(GUIDES.map((g) => [g.slug, { ...META[g.slug], render: (onLink: OnLink) => <GuideTemplate g={g} onLink={onLink} /> }])),
  ...Object.fromEntries(COMPARISONS.map((c) => [c.slug, { ...META[c.slug], render: (onLink: OnLink) => <ComparisonTemplate c={c} onLink={onLink} /> }])),
  models: { ...META.models, render: (onLink: OnLink) => <ModelsHub onLink={onLink} /> },
};
