"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Monitor, Search, Smartphone } from "lucide-react";
import { PROTOTYPES, SHIPPED_VERSIONS, type Platform, type Version } from "@/lib/prototypes";
import { countFor, filterPrototypes, versionChips, type VersionFilter } from "@/lib/gallery";

const isShipped = (v: VersionFilter) => v === "shipped" || SHIPPED_VERSIONS.includes(v as Version);

/** 切平台时落到的默认分类:网页版落在当前在做的版本,APP 看全部 */
const DEFAULT_VERSION: Record<Platform, VersionFilter> = { web: "v1.8", app: "all" };

const PLATFORMS: { id: Platform; label: string; icon: typeof Monitor }[] = [
  { id: "web", label: "Web", icon: Monitor },
  { id: "app", label: "APP", icon: Smartphone },
];

export default function GalleryPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<Platform>("web");
  const [version, setVersion] = useState<VersionFilter>(DEFAULT_VERSION.web);

  const items = useMemo(
    () => filterPrototypes(PROTOTYPES, { platform, version, query }),
    [platform, version, query],
  );

  const switchPlatform = (p: Platform) => {
    setPlatform(p);
    setVersion(DEFAULT_VERSION[p]);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[#1a1a2e]">
          原型画廊
        </h1>
        <p className="mt-3 max-w-2xl text-lg font-semibold text-[#1a1a2e]">
          Monica 的需求原型集合
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="size-3.5" />
            <span className="font-bold">Web 原型</span>
            <span className="text-muted-foreground">— Next.js + Tailwind + shadcn/ui + lucide</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="size-3.5" />
            <span className="font-bold">APP 原型</span>
            <span className="text-muted-foreground">— React Native（经 react-native-web 在浏览器里渲染）+ lucide 图标</span>
          </div>
        </div>
      </header>

      {/* 平台切换:网页版原型 / 手机 APP 原型 */}
      <div className="mb-8 inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
        {PLATFORMS.map(({ id, label, icon: PlatformIcon }) => {
          const active = platform === id;
          return (
            <button
              key={id}
              onClick={() => switchPlatform(id)}
              className={`flex h-12 items-center gap-2 rounded-full px-7 text-base font-extrabold transition ${
                active
                  ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_16px_rgba(255,82,85,0.26)]"
                  : "text-[#6a6b7b] hover:text-[#1a1a2e]"
              }`}
            >
              <PlatformIcon className="size-5" />
              {label}
              <span className={`text-sm font-semibold ${active ? "text-white/80" : "text-muted-foreground"}`}>
                {countFor(PROTOTYPES, id, "all")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-8 space-y-3">
        {/* 一级:在做的版本 + 专题 + 归档 + 已上线(APP 平台只有自己的版本线) */}
        <div className="flex flex-wrap items-center gap-2">
          {versionChips(platform).map((v) => {
            // 选中二级里的某个版本时,一级的「已上线」保持高亮,不然会看不出自己在哪一层
            const active = v === "shipped" ? isShipped(version) : version === v;
            return (
              <button
                key={v}
                onClick={() => setVersion(v)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-[#FFA73C] to-[#FF5255] text-white shadow-[0_6px_16px_rgba(255,82,85,0.26)]"
                    : "border border-border bg-card text-[#6a6b7b] hover:border-[#ff5e1a] hover:text-[#1a1a2e]"
                }`}
              >
                {v === "all" ? "All" : v === "shipped" ? "已上线" : v}
                <span className={`text-xs font-semibold ${active ? "text-white/80" : "text-muted-foreground"}`}>
                  {countFor(PROTOTYPES, platform, v)}
                </span>
              </button>
            );
          })}

          {/* 搜索框靠右对齐 */}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索原型…"
              className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition focus-visible:border-[#ff5e1a] focus-visible:ring-2 focus-visible:ring-[#ff5e1a]/20"
            />
          </div>
        </div>

        {/* 二级:点了「已上线」才出现,再往下钻具体版本 */}
        {platform === "web" && isShipped(version) && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-[#faf8f6] px-3 py-2.5">
            {(["shipped", ...SHIPPED_VERSIONS] as VersionFilter[]).map((v) => {
              const active = version === v;
              return (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                    active
                      ? "bg-[#1a1a2e] text-white"
                      : "border border-border bg-card text-[#6a6b7b] hover:border-[#ff5e1a] hover:text-[#1a1a2e]"
                  }`}
                >
                  {v === "shipped" ? "全部" : v}
                  <span className={`text-[11px] font-semibold ${active ? "text-white/70" : "text-muted-foreground"}`}>
                    {countFor(PROTOTYPES, "web", v)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
            <div
              className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br px-6 ${
                p.accent === "violet" ? "from-[#f3efff] to-[#e2daff]" : "from-[#fff3ec] to-[#ffe7d6]"
              }`}
            >
              <span
                className={`w-full break-words text-center font-[family-name:var(--font-display)] text-xl font-extrabold leading-snug ${
                  p.accent === "violet" ? "text-[#7b5cf0]/85" : "text-[#ff5e1a]/80"
                }`}
              >
                {p.title}
              </span>
              {p.pinned && (
                <span className="absolute left-3 top-3 rounded-full bg-[#7b5cf0] px-2 py-0.5 text-[10px] font-bold text-white">
                  评审索引
                </span>
              )}
              <ArrowUpRight
                className={`absolute right-3 top-3 size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                  p.accent === "violet" ? "text-[#7b5cf0]/60" : "text-[#ff5e1a]/60"
                }`}
              />
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
            还没有 {version === "all" ? "" : version === "shipped" ? "已上线" : version} 原型
          </p>
          <p className="mt-1 text-sm text-muted-foreground">换个版本看看,或清空搜索关键词。</p>
        </div>
      )}
    </main>
  );
}
