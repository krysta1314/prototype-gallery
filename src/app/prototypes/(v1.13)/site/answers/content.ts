// 新增规划批(2026-11-26):GEO 问答页、原创数据页、信任与政策页。都用 learn 的 Guide 格式和 GuidePage 模板，一级网址。
// 各文件由不同的人 / 子代理分别写，这里只汇总。
import type { Guide } from "../learn/content";
import { TRACKED } from "./content-tracked";
import { FACTS } from "./content-facts";
import { SUGGEST_A } from "./content-suggest-a";
import { SUGGEST_B } from "./content-suggest-b";
import { RESEARCH } from "./content-research";
import { POLICY } from "./content-policy";

/** 问答页(进 /answers 汇总页) */
export const ANSWER_GUIDES: Guide[] = [...TRACKED, ...FACTS, ...SUGGEST_A, ...SUGGEST_B];
/** 本批全部页面 */
export const NEW_GUIDES: Guide[] = [...ANSWER_GUIDES, ...RESEARCH, ...POLICY];
