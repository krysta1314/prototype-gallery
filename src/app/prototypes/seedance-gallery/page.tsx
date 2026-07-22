"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Play, X } from "lucide-react";

type GalleryCategory = "Product films" | "Cinematic" | "Animation";

type GalleryVideo = {
  title: string;
  prompt: string;
  source: string;
  kind: "image" | "video";
  ratio: string;
  category: GalleryCategory;
};

const galleryVideos: GalleryVideo[] = [
  {
    title: "Flying through the forest",
    prompt: "A sunlit flight through a lush forest, shot with a fast cinematic camera move.",
    source: "/prototypes/homepage/seedance-2.0.mp4",
    kind: "video",
    ratio: "aspect-[4/3]",
    category: "Cinematic",
  },
  {
    title: "Prismatic worlds",
    prompt: "An impossible bioluminescent world with rich blue and magenta light.",
    source: "/prototypes/homepage/hero-3.mp4",
    kind: "video",
    ratio: "aspect-video",
    category: "Animation",
  },
  {
    title: "The eye of a story",
    prompt: "Extreme close-up of a human eye, realistic macro photography, soft studio reflections.",
    source: "/prototypes/asset-library/images/img-01.jpg",
    kind: "image",
    ratio: "aspect-[3/4]",
    category: "Cinematic",
  },
  {
    title: "A product in motion",
    prompt: "A premium product film with sculptural lighting and an editorial camera reveal.",
    source: "/prototypes/asset-library/videos/video-01.mp4",
    kind: "video",
    ratio: "aspect-[4/3]",
    category: "Product films",
  },
  {
    title: "Soft-focus portrait",
    prompt: "A fashion portrait with natural texture, soft daylight, and a slow camera drift.",
    source: "/prototypes/asset-library/images/img-02.jpg",
    kind: "image",
    ratio: "aspect-[3/4]",
    category: "Cinematic",
  },
  {
    title: "Future in bloom",
    prompt: "A vibrant animated landscape that shifts from cloud to color in one seamless shot.",
    source: "/prototypes/homepage/hero-4.mp4",
    kind: "video",
    ratio: "aspect-[4/3]",
    category: "Animation",
  },
  {
    title: "A playful launch",
    prompt: "A joyful product reveal with warm gradients and tactile, close-up detail.",
    source: "/prototypes/asset-library/images/img-03.jpg",
    kind: "image",
    ratio: "aspect-video",
    category: "Product films",
  },
  {
    title: "Velocity studies",
    prompt: "A high-speed camera move through shifting color and reflected light.",
    source: "/prototypes/homepage/hero-1.mp4",
    kind: "video",
    ratio: "aspect-video",
    category: "Animation",
  },
];

function GalleryCard({ item, onOpen }: { item: GalleryVideo; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-[#fff3ec] text-left shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(255,94,26,0.16)] ${item.ratio}`}
    >
      {item.kind === "video" ? (
        <video autoPlay muted loop playsInline src={item.source} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
      ) : (
        <img src={item.source} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
      )}
      <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-[#ff5e1a] opacity-0 shadow-sm transition group-hover:opacity-100">
        <Play className="ml-0.5 size-4 fill-current" />
      </span>
    </button>
  );
}

export default function SeedanceGalleryPage() {
  const [selected, setSelected] = useState<GalleryVideo | null>(null);

  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#1a1a2e]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link href="/prototypes/homepage" className="inline-flex items-center gap-2 rounded-full border border-[#ebe5e2] bg-white px-4 py-2 text-sm font-semibold text-[#4f5060] shadow-sm transition hover:border-[#ff9a72] hover:text-[#ff5e1a]">
          <ArrowLeft className="size-4" />
          Back to Homepage
        </Link>
        <span className="hidden text-sm font-extrabold tracking-[-0.04em] text-[#1a1a2e] sm:block">Buzz<span className="text-[#ff5e1a]">Video</span></span>
      </header>

      <section className="relative overflow-hidden px-5 pb-12 pt-7 sm:px-8 sm:pb-16 sm:pt-10">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[min(760px,90vw)] -translate-x-1/2 rounded-full bg-[#ffd7c1]/60 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto w-[min(500px,86vw)]">
            <img src="/prototypes/seedance-gallery/seedance-4k-title.png" alt="Seedance 2.0 4K" className="w-full" />
          </div>
          <h1 className="mx-auto mt-6 whitespace-nowrap text-[clamp(26px,3.4vw,44px)] font-bold leading-[1.05] tracking-[-0.05em] text-[#1a1a2e] max-sm:whitespace-normal">
            Make every frame feel like a film.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-[#6f7080] sm:text-base">
            Create cinematic 4K video in seconds.
          </p>
          <Link href="/prototypes/homepage" className="mt-7 inline-flex items-center gap-2 rounded-[18px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#b65a42] active:translate-y-1 active:shadow-none">
            <Image src="/prototypes/homepage/member-sparkle.svg" alt="" width={42} height={42} className="size-5" />
            Start creating with Seedance
          </Link>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
            {galleryVideos.map((item) => <GalleryCard key={item.title} item={item} onOpen={() => setSelected(item)} />)}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1a2e]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={selected.title}>
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close preview" onClick={() => setSelected(null)} />
          <article className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button type="button" aria-label="Close preview" onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/90 text-[#1a1a2e] shadow-sm transition hover:bg-white">
              <X className="size-4" />
            </button>
            <div className="relative aspect-video bg-[#16151d]">
              {selected.kind === "video" ? (
                <video autoPlay controls muted loop playsInline src={selected.source} className="size-full object-cover" />
              ) : (
                <img src={selected.source} alt={selected.title} className="size-full object-cover" />
              )}
            </div>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
              <div><p className="text-xs font-bold tracking-[0.12em] text-[#ff7444]">{selected.category.toUpperCase()}</p><h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{selected.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7080]">{selected.prompt}</p></div>
              <Link href="/prototypes/homepage" className="shrink-0 rounded-xl bg-[#fff1e9] px-4 py-2.5 text-sm font-bold text-[#ff5e1a] transition hover:bg-[#ffe3d4]">Try this idea</Link>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
