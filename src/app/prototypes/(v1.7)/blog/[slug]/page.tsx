"use client";

/* 文章详情页 -- 一套模板服务所有文章。
   URL 里的 slug 从 store 找文章,正文交给 BlockList 渲染,TOC 由 heading block 自动生成。 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Eye, Pencil } from "lucide-react";
import { SiteHeader } from "@/components/site-header/site-header";
import { formatDate, isLive, readingMinutes, type Post } from "../content";
import { DemoBar } from "../demo-bar";
import { BlockList, headingId } from "../blocks";
import { MediaSlot } from "../media";
import { usePosts } from "../store";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

function RelatedCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/prototypes/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[4px] transition"
    >
      <MediaSlot compact ratio="aspect-[16/9]" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">
          {post.category}
        </span>
        <h3 className="text-[16.5px] font-bold leading-[1.35] tracking-tight text-[#1a1a2e] transition group-hover:text-[#ff5e1a]">
          {post.title}
        </h3>
        <span className="mt-auto pt-1 text-[12.5px] text-[#9a9aa8]">
          {formatDate(post.publishedAt || post.scheduledAt)} · {readingMinutes(post.blocks)} min
        </span>
      </div>
    </Link>
  );
}

export default function BlogArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const posts = usePosts();
  const [toast, setToast] = useState("");
  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const post = useMemo(() => posts.find((p) => p.slug === slug), [posts, slug]);

  const toc = useMemo(
    () =>
      post
        ? post.blocks
            .filter((b) => b.type === "heading")
            .map((b) => ({ text: (b as { text: string }).text, level: (b as { level: 2 | 3 }).level }))
        : [],
    [post],
  );

  const related = useMemo(
    () =>
      post
        ? posts
            .filter((p) => p.id !== post.id && isLive(p) && p.category === post.category)
            .slice(0, 3)
        : [],
    [posts, post],
  );

  if (!post) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: APPLE_FONT }}>
        <DemoBar />
        <DemoBar />
      <SiteHeader solid notify={notify} sticky brandInert />
        <div className="mx-auto max-w-[560px] px-6 py-32 text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1a1a2e]">
            Article not found
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6a6b7b]">
            This post may have been unpublished or its slug changed in the admin.
          </p>
          <Link
            href="/prototypes/blog"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(255,82,85,0.28)] transition hover:brightness-105"
          >
            Back to blog
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const live = isLive(post);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: APPLE_FONT }}>
      <DemoBar />
      <SiteHeader solid notify={notify} sticky brandInert />

      {/* 未发布的文章仍可从 admin 预览,顶部给出明确状态条 */}
      {!live && (
        <div className="flex items-center justify-center gap-2 bg-[#1a1a2e] px-6 py-2.5 text-[13px] font-semibold text-white">
          <Eye className="size-4" />
          Preview: this post is {post.status} and is not visible on the public blog
        </div>
      )}

      <article>
        <header className="border-b border-[#ececf1] px-6 pb-10 pt-12">
          <div className="mx-auto max-w-[760px]">
            <Link
              href="/prototypes/blog"
              className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
            >
              <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
              All articles
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#fff3ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">
                {post.category}
              </span>
              {post.featured && (
                <span className="rounded-full border border-[#ececf1] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a9aa8]">
                  Featured
                </span>
              )}
            </div>
            <h1 className="mt-4 text-[clamp(30px,5vw,46px)] font-extrabold leading-[1.12] tracking-tight text-[#1a1a2e]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-[19px] leading-relaxed text-[#6a6b7b]">{post.excerpt}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-[13px] font-bold text-white">
                {post.author.initials}
              </span>
              <div>
                <div className="text-[14.5px] font-bold text-[#1a1a2e]">{post.author.name}</div>
                <div className="text-[13px] text-[#9a9aa8]">{post.author.role}</div>
              </div>
              <span className="mx-1 h-8 w-px bg-[#ececf1]" aria-hidden />
              <div className="flex items-center gap-3 text-[13px] text-[#9a9aa8]">
                <span>{formatDate(post.publishedAt || post.scheduledAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {readingMinutes(post.blocks)} min read
                </span>
              </div>
              <Link
                href={`/prototypes/blog/admin?edit=${post.id}`}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-[#ececf1] bg-white px-4 py-2 text-[13px] font-semibold text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
              >
                <Pencil className="size-3.5" />
                Edit in admin
              </Link>
            </div>
          </div>
        </header>


        <div className="px-6 pt-10">
          <MediaSlot
            label="Cover · 16:9"
            ratio="aspect-[16/9]"
            className="mx-auto w-full max-w-[1040px]"
          />
        </div>

        <div className="mx-auto grid max-w-[1040px] gap-12 px-6 py-14 lg:grid-cols-[200px_minmax(0,1fr)]">
          {/* TOC */}
          <aside className="hidden lg:block">
            {toc.length > 0 && (
              <nav className="sticky top-28">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9aa8]">
                  On this page
                </div>
                <ul className="mt-3.5 space-y-2.5 border-l border-[#ececf1]">
                  {toc.map((h) => (
                    <li key={h.text}>
                      <a
                        href={`#${headingId(h.text)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById(headingId(h.text))
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`block border-l-2 border-transparent text-[13.5px] leading-snug text-[#6a6b7b] transition hover:border-[#ff5e1a] hover:text-[#ff5e1a] ${
                          h.level === 3 ? "pl-6" : "pl-4"
                        }`}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>

          {/* 正文 */}
          <div className="max-w-[720px]">
            <BlockList blocks={post.blocks} />

            {post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[#ececf1] pt-7">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#ececf1] px-3 py-1.5 text-[12.5px] font-semibold text-[#6a6b7b]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-[#ececf1] bg-[#faf8f6] px-6 py-14">
          <div className="mx-auto max-w-[1040px]">
            <h2 className="text-[26px] font-extrabold tracking-tight text-[#1a1a2e]">
              Keep reading
            </h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <RelatedCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}


      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-[#1a1a2e] px-5 py-3 text-[14px] font-medium text-white shadow-[0_16px_36px_rgba(26,26,46,0.2)]">
          {toast}
        </div>
      )}
    </div>
  );
}
