"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { PROTOTYPES } from "@/lib/prototypes";

export default function GalleryPage() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const sorted = [...PROTOTYPES].sort((a, b) => b.date.localeCompare(a.date));
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) =>
      [p.title, p.desc, p.slug].some((f) => f.toLowerCase().includes(q)),
    );
  }, [query]);

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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={p.href}
            target={p.legacy ? "_blank" : undefined}
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
    </main>
  );
}
