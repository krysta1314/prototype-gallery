"use client";

/* BuzzVideo Academy 注册表:一级网址 slug → 页面。由 [...slug]/SitePage 接入。 */
import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { GUIDES } from "./content";
import { GuidePage, LearnHub } from "./LearnTemplate";
import { META } from "./meta";

export const PAGES: Record<string, { title: string; description: string; render: (onLink: OnLink) => ReactNode }> = {
  learn: { ...META.learn, render: (onLink) => <LearnHub onLink={onLink} /> },
  ...Object.fromEntries(GUIDES.map((g) => [g.slug, { ...META[g.slug], render: (onLink: OnLink) => <GuidePage g={g} onLink={onLink} /> }])),
};
