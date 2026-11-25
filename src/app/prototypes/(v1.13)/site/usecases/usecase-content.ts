// 用例 / 广告模板页的数据汇总(纯数据，meta.ts 在服务端也读这里)。
import { CHANNEL_PAGES } from "./content/channels";
import { SOLUTION_PAGES } from "./content/solutions";
import { TEMPLATE_PAGES } from "./content/templates";
import type { UseCase } from "./usecase-types";

/* 2026-11-25 Monica:所有套餐都可商用 —— 没写商用问题的页统一补一条 FAQ */
export const USE_CASES: UseCase[] = [...TEMPLATE_PAGES, ...SOLUTION_PAGES, ...CHANNEL_PAGES].map((u) =>
  /commercially|commercial use/i.test(JSON.stringify(u.faq)) ? u : { ...u, faq: [...u.faq, { q: "Can I run these ads commercially?", a: "Yes. Everything you generate on BuzzVideo can be used commercially on every plan, including Free." }] },
);

const BY_SLUG = new Map(USE_CASES.map((u) => [u.slug, u]));
export const caseBySlug = (slug: string): UseCase | undefined => BY_SLUG.get(slug);
