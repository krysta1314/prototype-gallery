"use client";

/* Blog 落地页。浅色主题 —— 与文章详情页、后台一致,整条链路一个主题。
   列表是统一的卡片网格(封面在上 / 分类 / 标题 / Read article 胶囊),
   往下滚自动续载 —— 用 IntersectionObserver 哨兵,不挂 scroll 监听。
   页尾是行动号召色块 + 站点 footer。
   数据全部来自 store:在 admin 发一篇,这里就多一张卡。 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header/site-header";
import { isLive, type Post } from "./content";
import { useCategories, usePosts } from "./store";
import { DemoBar } from "./demo-bar";
import { BlogBanner } from "./banner";
import { MediaSlot } from "./media";
import { ReadyBand, SiteFooter } from "./site-tail";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const INK = "#1a1a2e";
/** 每次续载多少张 */
const PAGE = 9;

function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/prototypes/blog/${post.slug}`}
      className="group flex flex-col isolate rounded-[14px] bg-[#f7f8f9] transition-colors hover:bg-[#eff1f2]"
    >
      <MediaSlot flush label="Cover · 16:9" ratio="aspect-[16/9]" />

      <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
        <span className="text-[13px] font-semibold text-[#ff5e1a]">{post.category}</span>
        <h3 className="mt-2 flex-1 text-[22px] font-bold leading-[1.22] tracking-[-0.02em] text-[#1a1a2e]">
          {post.title}
        </h3>
        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#d4d3df] px-5 py-2.5 text-[14px] font-semibold text-[#1a1a2e] transition-colors group-hover:border-[#1a1a2e] group-hover:bg-[#1a1a2e] group-hover:text-white">
          Read article
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </span>
      </div>
    </Link>
  );
}

export default function BlogLandingPage() {
  const posts = usePosts();
  const cats = useCategories();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [scrolled, setScrolled] = useState(false);
  const topSentinel = useRef<HTMLDivElement>(null);
  const loadMore = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  /* 顶栏滚离首屏后转实底,保证对比度 */
  useEffect(() => {
    const el = topSentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const live = useMemo(
    () =>
      posts
        .filter((p) => isLive(p))
        .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")),
    [posts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return live.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [live, category, query]);

  /* 换筛选条件就回到第一页,否则会停在上一次滚到的深度 */
  useEffect(() => setShown(PAGE), [category, query]);

  const visible = filtered.slice(0, shown);
  const hasMore = shown < filtered.length;

  /* 续载哨兵:滚到它就多放一页。
     依赖里必须带上 shown —— IntersectionObserver 只在进出视口的瞬间回调,
     哨兵一直留在视口里时不会再触发,不重建的话加载到第二页就卡住。 */
  useEffect(() => {
    const el = loadMore.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShown((n) => Math.min(n + PAGE, filtered.length));
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown, filtered.length]);

  const activeCats = useMemo(
    () => ["All", ...cats.map((c) => c.name).filter((n) => live.some((p) => p.category === n))],
    [cats, live],
  );

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]" style={{ fontFamily: APPLE_FONT }}>
      <DemoBar />
      <SiteHeader solid notify={notify} sticky brandInert />
      <div ref={topSentinel} aria-hidden className="h-px" />

      <BlogBanner />

      <main className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* 分类条 */}
        <nav className="flex flex-wrap items-center gap-3 py-8">
          <div className="flex flex-wrap items-center gap-2">
            {activeCats.map((c) => {
              const active = category === c;
              const n = c === "All" ? live.length : live.filter((p) => p.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[16px] font-bold tracking-[-0.01em] transition ${
                    active
                      ? "border-[#1a1a2e] bg-[#1a1a2e] text-white"
                      : "border-[#ececf1] text-[#6a6b7b] hover:border-[#1a1a2e] hover:text-[#1a1a2e]"
                  }`}
                >
                  {c}
                  <span className={active ? "text-white/50" : "text-[#9a9aa8]"}>{n}</span>
                </button>
              );
            })}
          </div>

          <label className="ml-auto flex w-full items-center gap-2.5 border-b border-[#d4d3df] pb-2.5 transition-colors focus-within:border-[#ff5e1a] sm:w-[230px]">
            <Search className="size-[18px] shrink-0 text-[#9a9aa8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[16px] text-[#1a1a2e] outline-none placeholder:text-[#9a9aa8]"
            />
          </label>
        </nav>

        {filtered.length === 0 ? (
          <div className="border-t border-[#ececf1] py-32 text-center">
            <p className="text-[28px] font-bold tracking-[-0.02em] text-[#1a1a2e]">Nothing here yet</p>
            <p className="mx-auto mt-3 max-w-[42ch] text-[16.5px] leading-relaxed text-[#6a6b7b]">
              No published article matches this filter. Publish one from the admin and it appears
              here automatically.
            </p>
            <Link
              href="/prototypes/blog/admin"
              className="mt-8 inline-flex items-center gap-1.5 border-b-2 border-[#ff5e1a] pb-1 text-[16px] font-bold text-[#1a1a2e]"
            >
              Open blog admin
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>

            {/* 续载哨兵 */}
            <div ref={loadMore} className="py-14 text-center">
              {hasMore ? (
                <span className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-[#9a9aa8]">
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                  Loading more articles
                </span>
              ) : (
                <span className="text-[14px] text-[#9a9aa8]">You&rsquo;re all caught up</span>
              )}
            </div>
          </>
        )}
      </main>

      <ReadyBand onCta={() => notify("Sign Up 将跳转到注册流程")} />
      <SiteFooter />

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-[6px] bg-[#1a1a2e] px-5 py-3 text-[14px] font-semibold text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
