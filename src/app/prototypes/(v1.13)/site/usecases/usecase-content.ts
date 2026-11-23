// 用例 / 广告模板页的数据汇总(纯数据，meta.ts 在服务端也读这里)。
import { CHANNEL_PAGES } from "./content/channels";
import { SOLUTION_PAGES } from "./content/solutions";
import { TEMPLATE_PAGES } from "./content/templates";
import type { UseCase } from "./usecase-types";

export const USE_CASES: UseCase[] = [...TEMPLATE_PAGES, ...SOLUTION_PAGES, ...CHANNEL_PAGES];

const BY_SLUG = new Map(USE_CASES.map((u) => [u.slug, u]));
export const caseBySlug = (slug: string): UseCase | undefined => BY_SLUG.get(slug);
