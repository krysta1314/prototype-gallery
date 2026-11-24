// 2026-11-24 第二批模型子页。纯数据，只 import type(content.ts 会 import 这里，别反向 import 运行时值)。
import type { ComparisonEntry } from "./content";

export const MORE_COMPARISONS: ComparisonEntry[] = [];

/** 这些页的 <title> / description(meta.ts 合并进去) */
export const COMPARE_META: Record<string, { title: string; description: string }> = {};
