"use client";

/* 免费工具 + 公司 / 帮助页注册表(2026-11-23)。key = 一级网址(不带斜杠),SitePage 按 key 渲染;标题和描述在 meta.ts。 */

import type { ReactNode } from "react";
import type { OnLink } from "../../site-nav/SiteNavHeader";
import { ChangelogPage, FaqPage } from "./CompanyPages";
import { HelpPage } from "./HelpPage";
import { EnterprisePage } from "./EnterprisePage";
import { FREE_TOOLS } from "./content";
import { FreeToolPage } from "./FreePages";
import { META } from "./meta";

type Page = { title: string; description: string; render: (onLink: OnLink) => ReactNode };

export const PAGES: Record<string, Page> = {
  ...Object.fromEntries(FREE_TOOLS.map((t) => [t.slug, { ...META[t.slug], render: (onLink: OnLink) => <FreeToolPage t={t} onLink={onLink} /> }])),
  help: { ...META.help, render: (onLink) => <HelpPage onLink={onLink} /> },
  faq: { ...META.faq, render: (onLink) => <FaqPage onLink={onLink} /> },
  "whats-new": { ...META["whats-new"], render: (onLink) => <ChangelogPage onLink={onLink} /> },
  enterprise: { ...META.enterprise, render: (onLink) => <EnterprisePage onLink={onLink} /> },
};
