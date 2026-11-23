"use client";

/* 用例 / 广告模板页注册表:一级网址 slug → 页面。由 [...slug]/SitePage 接入(pages-registry.tsx)。 */
import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { META } from "./meta";
import { UseCaseTemplate } from "./UseCaseTemplate";
import { USE_CASES } from "./usecase-content";

export const PAGES: Record<string, { title: string; description: string; render: (onLink: OnLink) => ReactNode }> = Object.fromEntries(
  USE_CASES.map((u) => [u.slug, { ...META[u.slug], render: (onLink: OnLink) => <UseCaseTemplate u={u} onLink={onLink} /> }]),
);
