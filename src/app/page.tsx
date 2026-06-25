"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { PROTOTYPES, VERSIONS, type Version } from "@/lib/prototypes";

type VersionFilter = "all" | Version;

export default function GalleryPage() {
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState<VersionFilter>("v1.3");

  const items = useMemo(() => {
    const sorted = [...PROTOTYPES].sort((a, b) => b.date.localeCompare(a.date));
    const byVersion =
      version === "all" ? sorted : sorted.filter((p) => p.version === version);
    const q = query.trim().toLowerCase();
    if (!q) return byVersion;
    return byVersion.filter((p) =>
      [p.title, p.desc, p.slug].some((f) => f.toLowerCase().includes(q)),
    );
  }, [query, version]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[#1a1a2e]">
          原型画廊
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Monica 的需求原型集合 · Next.js + Tailwind + shadcn/ui + lucide
        </p>
      </header>

      <div className="relative mb-10 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索原型…"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
        />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {(["all", ...VERSIONS] as VersionFilter[]).map((v) => {
          const active = version === v;
          const count =
            v === "all"
              ? PROTOTYPES.length
              : PROTOTYPES.filter((p) => p.version === v).length;
          return (
            <button
              key={v}
              onClick={() => setVersion(v)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-gradient-to-br from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_16px_rgba(255,82,85,0.26)]"
                  : "border border-border bg-card text-[#6a6b7b] hover:border-[#ff5e1a] hover:text-[#1a1a2e]"
              }`}
            >
              {v === "all" ? "All" : v}
              <span
                className={`text-xs font-semibold ${active ? "text-white/80" : "text-muted-foreground"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={p.href}
            target={p.legacy || p.external ? "_blank" : undefined}
            rel={p.external ? "noopener noreferrer" : undefined}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff3ec] to-[#ffe7d6] px-6">
              <span className="w-full break-words text-center font-[family-name:var(--font-display)] text-xl font-extrabold leading-snug text-[#ff5e1a]/80">
                {p.title}
              </span>
              <ArrowUpRight className="absolute right-3 top-3 size-5 text-[#ff5e1a]/60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="font-semibold text-[#1a1a2e]">{p.title}</h2>
                {p.legacy && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    legacy
                  </span>
                )}
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{p.desc}</p>
              <time className="mt-4 text-xs text-muted-foreground">{p.date}</time>
            </div>
          </Link>
        ))}
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[#1a1a2e]">
            还没有 {version === "all" ? "" : version} 原型
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            换个版本看看,或清空搜索关键词。
          </p>
        </div>
      )}
    </main>
  );
}
