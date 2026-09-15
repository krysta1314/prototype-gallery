"use client";

/* 文章详情页 -- 一套模板服务所有文章。
   URL 里的 slug 从 store 找文章,正文交给 BlockList 渲染,TOC 由 heading block 自动生成。 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ChevronRight, Eye } from "lucide-react";
import { SiteHeader } from "@/components/site-header/site-header";
import { formatDate, isLive, type Post } from "../content";
import { DemoBar } from "../demo-bar";
import { BlockList, headingId } from "../blocks";
import { MediaSlot } from "../media";
import { ReadyBand, SiteFooter } from "../site-tail";
import { usePosts } from "../store";
import { useToast } from "../toast";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

function RelatedCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/prototypes/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[4px] transition"
    >
      <MediaSlot compact ratio="aspect-[16/9]" src={post.cover} />
      <div className="flex flex-1 flex-col gap-2 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">
          {post.category}
        </span>
        <h3 className="text-[16.5px] font-bold leading-[1.35] tracking-tight text-[#1a1a2e] transition group-hover:text-[#ff5e1a]">
          {post.title}
        </h3>
        <span className="mt-auto pt-1 text-[12.5px] text-[#9a9aa8]">
          {formatDate(post.publishedAt)}
        </span>
      </div>
    </Link>
  );
}

export default function BlogArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const posts = usePosts();
  const [notify, toastNode] = useToast();

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

  /* 相关文章:同分类、排除自己、只取已发布的,按发布时间倒序取最新 6 篇。
     同分类不足 6 篇就少显示几张,不跨分类补位 —— 补位会让「相关」名不副实。 */
  const related = useMemo(
    () =>
      post
        ? posts
            .filter((p) => p.id !== post.id && isLive(p) && p.category === post.category)
            .sort((a, b) =>
              (b.publishedAt || "").localeCompare(a.publishedAt || ""),
            )
            .slice(0, 6)
        : [],
    [posts, post],
  );

  /* 后台 SEO 面板不是摆设:标题和描述真的写进文档头。
     真实站点这些会在服务端由 generateMetadata 输出(爬虫才读得到);
     这个原型是 client 页,用 effect 写同样的标签,用来验证「改后台 → 前台生效」这条链路。 */
  useEffect(() => {
    if (!post) return;
    /* Next 的 metadata 会在路由切换后再写一次 title,直接赋值会被它盖掉,
       所以用 observer 把标题按住,组件卸载时断开。 */
    const title = `${post.seo.metaTitle || post.title} | BuzzVideo Blog`;
    document.title = title;
    const titleEl = document.head.querySelector("title");
    const obs = titleEl
      ? new MutationObserver(() => {
          if (document.title !== title) document.title = title;
        })
      : null;
    obs?.observe(titleEl!, { childList: true, characterData: true, subtree: true });

    const tag = (selector: string, make: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = make();
        document.head.appendChild(el);
      }
      return el;
    };
    const meta = (name: string, content: string) => {
      const el = tag(`meta[name="${name}"]`, () => {
        const m = document.createElement("meta");
        m.setAttribute("name", name);
        return m;
      });
      el.setAttribute("content", content);
    };

    meta("description", post.seo.metaDescription || post.excerpt);

    const link = tag('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    });
    /* canonical 不给编辑填 —— 自家原创文章的权威地址永远是它自己 */
    link.setAttribute("href", `https://buzzvideo.ai/blog/${post.slug}`);

    return () => obs?.disconnect();
  }, [post]);

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
            {/* 面包屑。分类那一级是真链接:回列表页并自动选中该分类 */}
            <nav aria-label="Breadcrumb" className="text-[14px] text-[#9a9aa8]">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link
                    href="/prototypes/blog"
                    className="font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
                  >
                    Blog
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="size-3.5 text-[#c4c3cf]" />
                </li>
                <li>
                  <Link
                    href={`/prototypes/blog?category=${encodeURIComponent(post.category)}`}
                    className="font-semibold text-[#6a6b7b] transition hover:text-[#ff5e1a]"
                  >
                    {post.category}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="size-3.5 text-[#c4c3cf]" />
                </li>
                <li aria-current="page" className="max-w-[46ch] truncate text-[#9a9aa8]">
                  {post.title}
                </li>
              </ol>
            </nav>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#fff3ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff5e1a]">
                {post.category}
              </span>
            </div>
            <h1 className="mt-4 text-[clamp(30px,5vw,46px)] font-extrabold leading-[1.12] tracking-tight text-[#1a1a2e]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-[19px] leading-relaxed text-[#6a6b7b]">{post.excerpt}</p>
            )}
            <div className="mt-6 text-[14px] text-[#9a9aa8]">
              {formatDate(post.publishedAt)}
            </div>
          </div>
        </header>


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
              <div className="mt-10 flex flex-wrap items-center gap-2">
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
        <section className="px-6 pb-16 pt-4">
          <div className="mx-auto max-w-[1040px]">
            <h2 className="text-[26px] font-extrabold tracking-tight text-[#1a1a2e]">
              Related Posts
            </h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <RelatedCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ReadyBand onCta={() => notify("Sign Up 将跳转到注册流程", "info")} />
      <SiteFooter />

      {toastNode}
    </div>
  );
}
