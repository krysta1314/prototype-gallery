"use client";

/* Blog 落地页。
   这一版不放任何封面图/视频(素材要等真实内容,原型里不做演示),
   所以版面完全靠排版立住:整幅橙色 banner 当视觉锚点,下面用字号层级、
   一条橙色规则线和留白拉开头条 / 次条 / 存档三级,避免一排等宽卡片。
   列表由 store 驱动,在 admin 发一篇这里就多一条。 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/site-header/site-header";
import { CATEGORIES, formatDate, isLive, readingMinutes, type Post } from "./content";
import { usePosts } from "./store";
import { DemoBar } from "./demo-bar";
import { BlogBanner } from "./banner";
import { MediaSlot } from "./media";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const INK = "#0a0a0c";

function Meta({ post, className = "" }: { post: Post; className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px] text-white/45 ${className}`}
    >
      <span className="font-semibold text-white/65">{post.author.name}</span>
      <span className="h-2.5 w-px bg-current opacity-40" aria-hidden />
      <span>{formatDate(post.publishedAt || post.scheduledAt)}</span>
      <span className="h-2.5 w-px bg-current opacity-40" aria-hidden />
      <span>{readingMinutes(post.blocks)} min</span>
    </div>
  );
}

function Cat({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-bold tracking-[0.06em] text-[#ff7a3d]">{children}</span>;
}

/* 头条:5/7 非对称分栏,文字在左、封面位在右,字号明显压过其它条目 */
function LeadStory({ post }: { post: Post }) {
  return (
    <Link
      href={`/prototypes/blog/${post.slug}`}
      className="group grid items-center gap-9 border-t-2 border-[#ff5e1a] pt-10 lg:grid-cols-12 lg:gap-14"
    >
      <div className="lg:col-span-5">
        <Cat>{post.category}</Cat>
        <h2 className="mt-4 text-[clamp(30px,4.2vw,50px)] font-extrabold leading-[1.04] tracking-[-0.035em] text-white transition-colors group-hover:text-[#ff7a3d]">
          {post.title}
        </h2>
        <p className="mt-5 max-w-[46ch] text-[clamp(16.5px,1.4vw,19px)] leading-[1.55] text-white/60">
          {post.excerpt}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
          <Meta post={post} />
          <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-white">
            Read
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
          </span>
        </div>
      </div>
      <MediaSlot label="Cover · 16:10" ratio="aspect-[16/10]" className="lg:col-span-7" />
    </Link>
  );
}

/* 次条:两栏,靠中缝竖线分隔,不用卡片 */
function SecondaryStory({ post }: { post: Post }) {
  return (
    <Link href={`/prototypes/blog/${post.slug}`} className="group block">
      <MediaSlot label="Cover · 3:2" ratio="aspect-[3/2]" className="mb-6" />
      <Cat>{post.category}</Cat>
      <h3 className="mt-3 text-[clamp(22px,2.3vw,28px)] font-bold leading-[1.18] tracking-[-0.025em] text-white transition-colors group-hover:text-[#ff7a3d]">
        {post.title}
      </h3>
      <p className="mt-3.5 max-w-[48ch] text-[16.5px] leading-[1.6] text-white/55">
        {post.excerpt}
      </p>
      <Meta post={post} className="mt-5" />
    </Link>
  );
}

/* 存档:编号 + 标题的紧凑行,靠细线分隔 */
function ArchiveRow({ post, index }: { post: Post; index: number }) {
  return (
    <Link
      href={`/prototypes/blog/${post.slug}`}
      className="group flex items-baseline gap-5 border-t border-white/12 py-7 sm:gap-8"
    >
      <span className="hidden w-9 shrink-0 text-[15px] font-bold tabular-nums text-white/25 transition-colors group-hover:text-[#ff7a3d] sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <Cat>{post.category}</Cat>
        <h3 className="mt-2 text-[22px] font-bold leading-[1.28] tracking-[-0.02em] text-white transition-colors group-hover:text-[#ff7a3d]">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-[66ch] text-[16px] leading-[1.6] text-white/55">
          {post.excerpt}
        </p>
        <Meta post={post} className="mt-3.5" />
      </div>
      <MediaSlot
        compact
        ratio="aspect-[4/3]"
        className="hidden w-[148px] shrink-0 self-center sm:block"
      />
      <ArrowUpRight className="hidden size-5 shrink-0 self-center text-white/25 transition-colors duration-300 group-hover:text-[#ff7a3d] md:block motion-reduce:transition-none" />
    </Link>
  );
}

export default function BlogLandingPage() {
  const posts = usePosts();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const topSentinel = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  /* 顶栏滚离首屏后转实底,保证对比度。用 IO,不挂 scroll 监听 */
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

  const curated = category === "All" && !query;
  const lead = curated ? filtered.find((p) => p.featured) ?? filtered[0] : undefined;
  const afterLead = lead ? filtered.filter((p) => p.id !== lead.id) : filtered;
  const secondary = curated ? afterLead.slice(0, 2) : [];
  const archive = curated ? afterLead.slice(2) : filtered;

  const activeCats = useMemo(
    () => ["All", ...CATEGORIES.filter((c) => live.some((p) => p.category === c))],
    [live],
  );

  return (
    <div className="min-h-screen text-white" style={{ fontFamily: APPLE_FONT, background: INK }}>
      <DemoBar />
      <SiteHeader solid={scrolled} notify={notify} sticky />
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
                      ? "border-white bg-white text-[#0a0a0c]"
                      : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
                  }`}
                >
                  {c}
                  <span className={active ? "text-[#0a0a0c]/45" : "text-white/35"}>{n}</span>
                </button>
              );
            })}
          </div>

          <label className="ml-auto flex w-full items-center gap-2.5 border-b border-white/25 pb-2.5 transition-colors focus-within:border-[#ff7a3d] sm:w-[230px]">
            <Search className="size-[18px] shrink-0 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[16px] text-white outline-none placeholder:text-white/35"
            />
          </label>
          <Link
            href="/prototypes/blog/admin"
            className="hidden shrink-0 items-center gap-1.5 text-[14px] font-semibold text-white/40 transition-colors hover:text-white sm:flex"
          >
            <SlidersHorizontal className="size-4" />
            Manage
          </Link>
        </nav>

        {filtered.length === 0 ? (
          <div className="border-t border-white/12 py-32 text-center">
            <p className="text-[28px] font-bold tracking-[-0.02em] text-white">Nothing here yet</p>
            <p className="mx-auto mt-3 max-w-[42ch] text-[16.5px] leading-relaxed text-white/55">
              No published article matches this filter. Publish one from the admin and it appears
              here automatically.
            </p>
            <Link
              href="/prototypes/blog/admin"
              className="mt-8 inline-flex items-center gap-1.5 border-b-2 border-[#ff7a3d] pb-1 text-[16px] font-bold text-white"
            >
              Open blog admin
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            {lead && (
              <section className="pb-16">
                <LeadStory post={lead} />
              </section>
            )}

            {secondary.length > 0 && (
              <section className="grid gap-12 border-t border-white/12 pt-12 md:grid-cols-2 md:gap-x-16 md:divide-x md:divide-white/12">
                {secondary.map((p, i) => (
                  <div key={p.id} className={i === 1 ? "md:pl-16" : ""}>
                    <SecondaryStory post={p} />
                  </div>
                ))}
              </section>
            )}

            {archive.length > 0 && (
              <section className="mt-20 sm:mt-24">
                <h2 className="mb-7 text-[16px] font-bold tracking-[-0.01em] text-white/45">
                  {curated
                    ? "More stories"
                    : `${archive.length} article${archive.length > 1 ? "s" : ""}`}
                </h2>
                <div>
                  {archive.map((p, i) => (
                    <ArchiveRow key={p.id} post={p} index={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="h-24" />
      </main>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-[6px] bg-white px-5 py-3 text-[14px] font-semibold text-[#0a0a0c]">
          {toast}
        </div>
      )}
    </div>
  );
}
