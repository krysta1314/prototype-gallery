"use client";

/* BuzzVideo Academy 注册表:一级网址 slug → 页面。由 [...slug]/SitePage 接入。 */
import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { GUIDES } from "./content";
import { GuidePage } from "./LearnTemplate";
import { META } from "./meta";

export const PAGES: Record<string, { title: string; description: string; render: (onLink: OnLink) => ReactNode }> = {
  /* /learn(Academy 总页)2026-11-24 Monica 删除;各解答页保留 */
  ...Object.fromEntries(GUIDES.map((g) => [g.slug, { ...META[g.slug], render: (onLink: OnLink) => <GuidePage g={g} onLink={onLink} /> }])),
};
