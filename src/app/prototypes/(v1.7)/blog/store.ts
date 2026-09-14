"use client";

/* 前台与 admin 读写同一份数据。模块级 state + localStorage 持久化 + useSyncExternalStore,
   所以在 admin 里改一个字段,另开的前台页面刷新就能看到 —— 这是这个原型要演示的闭环。 */

import { useSyncExternalStore } from "react";
import { SEED_POSTS, type Post } from "./content";

const KEY = "buzz-blog-posts-v5";

let posts: Post[] = SEED_POSTS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(posts));
  } catch {
    /* 隐私模式 / 存储被禁用时忽略,原型退化成内存态 */
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Post[];
      if (Array.isArray(parsed) && parsed.length) posts = parsed;
    }
  } catch {
    /* 坏数据直接用种子 */
  }
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

export function savePost(next: Post) {
  const i = posts.findIndex((p) => p.id === next.id);
  const stamped = { ...next, updatedAt: "2026-09-14" };
  posts = i >= 0 ? posts.map((p) => (p.id === next.id ? stamped : p)) : [stamped, ...posts];
  persist();
  emit();
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
    featured: false,
    publishedAt: "",
    scheduledAt: "",
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
    scheduledAt: "",
    updatedAt: "2026-09-14",
    featured: false,
    seo: { metaTitle: "", metaDescription: "", canonical: "", noindex: false },
    blocks: [{ id: `b${Date.now()}`, type: "paragraph", text: "Start writing…" }],
  };
  posts = [draft, ...posts];
  persist();
  emit();
  return draft;
}

export function resetPosts() {
  posts = SEED_POSTS;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 同上 */
  }
  emit();
}
