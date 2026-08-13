"use client";

import { useState } from "react";
import { Heart, Download, Play } from "lucide-react";

/* ------------------------------------------------------------------ *
 * Asset Library 图片 grid — 4 个无圆角 / 无间距方案对比(纯演示页)
 * 滚动对比 A/B/C/D,选定后把对应布局套回真正的 Asset Library。
 * ------------------------------------------------------------------ */

type Media = { id: string; type: "image" | "video"; src: string };

const IMG = (n: string, ext: string): Media => ({
  id: `img-${n}`,
  type: "image",
  src: `/prototypes/asset-library/images/img-${n}.${ext}`,
});
const VID = (n: string): Media => ({
  id: `vid-${n}`,
  type: "video",
  src: `/prototypes/asset-library/videos/video-${n}.mp4`,
});

const MEDIA: Media[] = [
  IMG("01", "jpg"),
  VID("01"),
  IMG("02", "webp"),
  IMG("03", "png"),
  IMG("08", "jpg"),
  IMG("04", "png"),
  IMG("09", "jpg"),
  VID("03"),
  IMG("05", "png"),
  IMG("10", "jpg"),
  IMG("06", "png"),
  IMG("11", "jpg"),
  IMG("13", "jpg"),
  VID("04"),
  IMG("07", "webp"),
  IMG("12", "png"),
  IMG("14", "jpg"),
  IMG("15", "jpg"),
  IMG("16", "png"),
  IMG("17", "webp"),
];

/* deterministic aspect ratios (w/h) for the justified variant — no Math.random */
const RATIOS = [1.5, 0.8, 1.2, 1, 1.7, 0.7, 1.3, 1.1, 0.9, 1.6];

export default function AssetGridComparison() {
  const [fav, setFav] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setFav((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <main className="min-h-[100dvh] bg-white px-6 py-10 sm:px-10">
      <header className="mx-auto mb-10 max-w-[1400px]">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,36px)] font-extrabold leading-tight tracking-tight text-[#1a1a2e]">
          Asset Library · grid 方案对比
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6a6b7b]">
          四种无圆角、无间距的网格布局。滚动对比,选定一个我再套回真正的 Asset Library。
        </p>
      </header>

      <Section
        tag="A"
        title="等大方块拼贴(Uniform mosaic)"
        note="全部裁成正方形,5 列铺满,最规整、像 contact sheet。"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {MEDIA.map((m) => (
            <Tile
              key={m.id}
              m={m}
              fav={fav.has(m.id)}
              onFav={() => toggle(m.id)}
              className="aspect-square"
            />
          ))}
        </div>
      </Section>

      <Section
        tag="B"
        title="Bento 重点位(Gapless bento)"
        note="部分图占 2×2 / 2×1 大格,有节奏、有重点,适合突出精选产出。"
      >
        <div className="grid auto-rows-[clamp(96px,11vw,150px)] grid-cols-4 [grid-auto-flow:dense] lg:grid-cols-6">
          {MEDIA.map((m, i) => (
            <Tile
              key={m.id}
              m={m}
              fav={fav.has(m.id)}
              onFav={() => toggle(m.id)}
              className={bentoSpan(i)}
            />
          ))}
        </div>
      </Section>

      <Section
        tag="C"
        title="瀑布流(Masonry columns)"
        note="保留每张图原始比例,按列堆叠、列间无缝,信息密度高、最自然。"
      >
        <div className="columns-2 gap-0 sm:columns-3 lg:columns-5 [&>*]:mb-0">
          {MEDIA.map((m) => (
            <Tile
              key={m.id}
              m={m}
              fav={fav.has(m.id)}
              onFav={() => toggle(m.id)}
              className="block w-full break-inside-avoid"
              natural
            />
          ))}
        </div>
      </Section>

      <Section
        tag="D"
        title="等高自适应行(Justified rows)"
        note="每行等高、按比例铺满整行(类似 Flickr / Google 相册),原型为近似实现。"
      >
        <div className="flex flex-wrap">
          {MEDIA.map((m, i) => {
            const r = RATIOS[i % RATIOS.length];
            return (
              <Tile
                key={m.id}
                m={m}
                fav={fav.has(m.id)}
                onFav={() => toggle(m.id)}
                className="h-[clamp(120px,15vw,200px)] grow"
                style={{ flexBasis: `${r * 160}px` }}
              />
            );
          })}
          {/* 撑住最后一行,避免最后一张被拉伸 */}
          <span className="h-0 grow-[10]" />
        </div>
      </Section>
    </main>
  );
}

/* a span pattern that tiles without holes (dense flow fills the gaps) */
function bentoSpan(i: number): string {
  const big = i % 7 === 0; // 2×2 highlight
  const wide = i % 11 === 5; // 2×1
  if (big) return "col-span-2 row-span-2";
  if (wide) return "col-span-2 row-span-1";
  return "col-span-1 row-span-1";
}

function Section({
  tag,
  title,
  note,
  children,
}: {
  tag: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mb-16 max-w-[1400px]">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#1a1a2e] text-xs font-bold text-white">
          {tag}
        </span>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-[#1a1a2e]">
          {title}
        </h2>
      </div>
      <p className="mb-4 text-sm text-[#9a9bb0]">{note}</p>
      <div className="overflow-hidden border border-[#ececf1]">{children}</div>
    </section>
  );
}

function Tile({
  m,
  fav,
  onFav,
  className = "",
  natural = false,
  style,
}: {
  m: Media;
  fav: boolean;
  onFav: () => void;
  className?: string;
  natural?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`group relative overflow-hidden bg-[#f1f0f4] ${className}`}
      style={style}
    >
      {m.type === "video" ? (
        <video
          src={m.src}
          muted
          playsInline
          preload="metadata"
          className={
            natural
              ? "block w-full align-top"
              : "absolute inset-0 size-full object-cover"
          }
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.src}
          alt=""
          loading="lazy"
          className={
            natural
              ? "block w-full align-top"
              : "absolute inset-0 size-full object-cover"
          }
        />
      )}

      {/* hover scrim + actions (无圆角网格靠 overlay 给操作) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent opacity-0 transition group-hover:opacity-100" />

      {m.type === "video" && (
        <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          <Play className="size-3 fill-white" /> 0:15
        </span>
      )}

      <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
        <button
          aria-label="Download"
          className="grid size-8 place-items-center bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <Download className="size-4" />
        </button>
        <button
          onClick={onFav}
          aria-label="Favorite"
          className={`grid size-8 place-items-center backdrop-blur-sm transition ${
            fav
              ? "bg-black/45 text-[#ff5e1a]"
              : "bg-black/45 text-white hover:bg-black/65"
          }`}
        >
          <Heart className={`size-4 ${fav ? "fill-[#ff5e1a]" : ""}`} />
        </button>
      </div>

      {/* favorited 时角标常驻 */}
      {fav && (
        <span className="pointer-events-none absolute left-2 top-2 grid size-7 place-items-center bg-black/45 opacity-100 transition group-hover:opacity-0">
          <Heart className="size-3.5 fill-[#ff5e1a] text-[#ff5e1a]" />
        </span>
      )}
    </div>
  );
}
