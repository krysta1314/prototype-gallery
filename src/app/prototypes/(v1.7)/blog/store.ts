"use client";

/* 前台与 admin 读写同一份数据。模块级 state + localStorage 持久化 + useSyncExternalStore,
   所以在 admin 里改一个字段,另开的前台页面刷新就能看到 —— 这是这个原型要演示的闭环。 */

import { useSyncExternalStore } from "react";
import { SEED_CATEGORIES, SEED_POSTS, type Category, type Post } from "./content";

const KEY = "buzz-blog-posts-v6";
const CAT_KEY = "buzz-blog-categories-v2";

let posts: Post[] = SEED_POSTS;
let categories: Category[] = SEED_CATEGORIES;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/* 写失败过一次就记下来。以前是静默 catch:导入一篇带图的文章看着成功,
   刷新后内容没了,编辑会以为是我们丢稿。现在让调用方能提示出来。 */
let persistFailed = false;

export const storageFailed = () => persistFailed;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(posts));
    localStorage.setItem(CAT_KEY, JSON.stringify(categories));
    persistFailed = false;
    return true;
  } catch {
    /* 配额满、隐私模式、存储被禁用 —— 退化成内存态 */
    persistFailed = true;
    return false;
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Post[];
      if (Array.isArray(parsed) && parsed.length) posts = parsed.map(migrate);
    }
    const rawCats = localStorage.getItem(CAT_KEY);
    if (rawCats) {
      const parsed = JSON.parse(rawCats) as Category[];
      if (Array.isArray(parsed) && parsed.length) categories = parsed;
    }
  } catch {
    /* 坏数据直接用种子 */
  }
}

const KNOWN_STATUS = new Set(["draft", "published", "archived"]);

/* 旧版本存下来的文章可能带已下线的状态(scheduled)或已删除的字段。
   读的时候就地归一,免得一个历史遗留把整个后台打崩。 */
function migrate(p: Post): Post {
  if (KNOWN_STATUS.has(p.status)) return p;
  return { ...p, status: "draft" };
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    hydrated = false;
    hydrate();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => posts;
const getServerSnapshot = () => SEED_POSTS;

export function usePosts(): Post[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const getCats = () => categories;
const getCatsServer = () => SEED_CATEGORIES;

export function useCategories(): Category[] {
  return useSyncExternalStore(subscribe, getCats, getCatsServer);
}

/* ── 分类管理 ───────────────────────────────────────── */

export function addCategory(name: string): boolean {
  const clean = name.trim();
  if (!clean || categories.some((c) => c.name.toLowerCase() === clean.toLowerCase())) return false;
  categories = [...categories, { id: `c${Date.now()}`, name: clean }];
  persist();
  emit();
  return true;
}

/** 改名要把文章里的引用一起改,否则文章会挂在一个不存在的分类上 */
export function renameCategory(id: string, name: string): boolean {
  const clean = name.trim();
  const target = categories.find((c) => c.id === id);
  if (!clean || !target) return false;
  if (categories.some((c) => c.id !== id && c.name.toLowerCase() === clean.toLowerCase()))
    return false;
  const old = target.name;
  categories = categories.map((c) => (c.id === id ? { ...c, name: clean } : c));
  posts = posts.map((p) => (p.category === old ? { ...p, category: clean } : p));
  persist();
  emit();
  return true;
}

/** 有文章在用就不让删 —— 静默把文章扔进一个不存在的分类比报错更糟 */
export function deleteCategory(id: string): { ok: boolean; inUse: number } {
  const target = categories.find((c) => c.id === id);
  if (!target) return { ok: false, inUse: 0 };
  const inUse = posts.filter((p) => p.category === target.name).length;
  if (inUse) return { ok: false, inUse };
  categories = categories.filter((c) => c.id !== id);
  persist();
  emit();
  return { ok: true, inUse: 0 };
}

/** 把 id 拖到 toIndex 的位置 */
export function reorderCategory(id: string, toIndex: number) {
  const from = categories.findIndex((c) => c.id === id);
  if (from < 0 || toIndex < 0 || toIndex >= categories.length || from === toIndex) return;
  const next = [...categories];
  const [moved] = next.splice(from, 1);
  next.splice(toIndex, 0, moved);
  categories = next;
  persist();
  emit();
}

export function moveCategory(id: string, dir: -1 | 1) {
  const i = categories.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= categories.length) return;
  const next = [...categories];
  [next[i], next[j]] = [next[j], next[i]];
  categories = next;
  persist();
  emit();
}

export function savePost(next: Post): boolean {
  const i = posts.findIndex((p) => p.id === next.id);
  const stamped = { ...next, updatedAt: "2026-09-14" };
  posts = i >= 0 ? posts.map((p) => (p.id === next.id ? stamped : p)) : [stamped, ...posts];
  const ok = persist();
  emit();
  return ok;
}

export function deletePost(id: string) {
  posts = posts.filter((p) => p.id !== id);
  persist();
  emit();
}

export function duplicatePost(id: string) {
  const src = posts.find((p) => p.id === id);
  if (!src) return;
  const copy: Post = {
    ...src,
    id: `p${Date.now()}`,
    slug: `${src.slug}-copy`,
    title: `${src.title} (copy)`,
    status: "draft",
    publishedAt: "",
    updatedAt: "2026-09-14",
  };
  posts = [copy, ...posts];
  persist();
  emit();
}

export function createPost(): Post {
  const draft: Post = {
    id: `p${Date.now()}`,
    slug: "untitled-post",
    title: "Untitled post",
    excerpt: "",
    category: "Product",
    tags: [],
    author: SEED_POSTS[0].author,
    status: "draft",
    publishedAt: "",
    updatedAt: "2026-09-14",
    seo: { metaTitle: "", metaDescription: "", canonical: "" },
    blocks: [{ id: `b${Date.now()}`, type: "paragraph", text: "Start writing…" }],
  };
  posts = [draft, ...posts];
  persist();
  emit();
  return draft;
}

export function resetPosts() {
  posts = SEED_POSTS;
  categories = SEED_CATEGORIES;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(CAT_KEY);
  } catch {
    /* 同上 */
  }
  emit();
}
