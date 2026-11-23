"use client";
// 各批落地页的渲染注册表汇总(SitePage 用)。新一批做完：在这里加一行 import + 展开。
import { PAGES as GUIDES } from "./guides/registry";
import { PAGES as LEARN } from "./learn/registry";
import { PAGES as FREE } from "./free/registry";
import { PAGES as COMPARE } from "./compare/registry";
import { PAGES as USECASES } from "./usecases/registry";

export const PAGE_REGISTRY = { ...GUIDES, ...LEARN, ...FREE, ...COMPARE, ...USECASES };
