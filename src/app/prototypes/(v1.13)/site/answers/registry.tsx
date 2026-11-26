"use client";
/* 新增规划批注册表(2026-11-26):问答页 / 数据页 / 政策页 + /answers 汇总页。由 pages-registry 接入。 */
import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { GuidePage } from "../learn/LearnTemplate";
import { NEW_GUIDES } from "./content";
import { META } from "./meta";
import { AnswersHub } from "./AnswersHub";

export const PAGES: Record<string, { title: string; description: string; render: (onLink: OnLink) => ReactNode }> = {
  answers: { ...META.answers, render: (onLink: OnLink) => <AnswersHub onLink={onLink} /> },
  ...Object.fromEntries(NEW_GUIDES.map((g) => [g.slug, { ...META[g.slug], render: (onLink: OnLink) => <GuidePage g={g} onLink={onLink} /> }])),
};
