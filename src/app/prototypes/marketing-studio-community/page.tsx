import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

type CommunityCreation = {
  source: string;
  kind: "image" | "video";
  ratio: string;
  alt: string;
};

const creations: CommunityCreation[] = [
  {
    source: "/prototypes/asset-library/videos/video-01.mp4",
    kind: "video",
    ratio: "aspect-[4/5]",
    alt: "A product advertising film",
  },
  {
    source: "/prototypes/asset-library/images/img-02.jpg",
    kind: "image",
    ratio: "aspect-[3/4]",
    alt: "Creator product story",
  },
  {
    source: "/prototypes/homepage/hero-1.mp4",
    kind: "video",
    ratio: "aspect-[4/5]",
    alt: "Fashion campaign video",
  },
  {
    source: "/prototypes/asset-library/images/img-03.jpg",
    kind: "image",
    ratio: "aspect-[3/4]",
    alt: "Bright product campaign",
  },
  {
    source: "/prototypes/asset-library/images/img-01.jpg",
    kind: "image",
    ratio: "aspect-square",
    alt: "Editorial beauty image",
  },
  {
    source: "/prototypes/homepage/seedance-2.0.mp4",
    kind: "video",
    ratio: "aspect-video",
    alt: "High-energy visual story",
  },
  {
    source: "/prototypes/homepage/hero-4.mp4",
    kind: "video",
    ratio: "aspect-[3/4]",
    alt: "Animated campaign work",
  },
  {
    source: "/prototypes/asset-library/videos/video-01.mp4",
    kind: "video",
    ratio: "aspect-[4/3]",
    alt: "Product film made in Marketing Studio",
  },
];

export default function MarketingStudioCommunityPage() {
  return (
    <main className="min-h-screen bg-[#fffaf7] text-[#1a1a2e]">
      <header className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link href="/prototypes/homepage" className="inline-flex items-center gap-2 rounded-full border border-[#ebe5e2] bg-white px-4 py-2 text-sm font-semibold text-[#4f5060] shadow-sm transition hover:border-[#ff9a72] hover:text-[#ff5e1a]">
          <ArrowLeft className="size-4" />
          Back to Homepage
        </Link>
        <span className="hidden text-sm font-extrabold tracking-[-0.04em] text-[#1a1a2e] sm:block">Buzz<span className="text-[#ff5e1a]">Video</span></span>
      </header>

      <section className="relative overflow-hidden px-5 pb-14 pt-7 sm:px-8 sm:pb-20 sm:pt-12">
        <div className="relative mx-auto max-w-[1600px]">
          <h1 className="max-w-6xl text-balance text-3xl font-bold leading-[0.95] tracking-[-0.055em] sm:text-4xl lg:text-[56px]">
            Marketing Studio <span className="bg-gradient-to-r from-[#ff9b49] to-[#ff5e55] bg-clip-text text-transparent">Community</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-[#6f7080] sm:text-lg">
            See what creators and brands are making with Marketing Studio. Browse campaign ideas, product films, and ad formats made to move people.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/prototypes/homepage" className="inline-flex items-center gap-2 rounded-[18px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:shadow-[0_5px_0_#b65a42] active:translate-y-1 active:shadow-none">
              <Image src="/prototypes/homepage/member-sparkle.svg" alt="" width={42} height={42} className="size-5" />
              Start creating
            </Link>
            <a href="#community-work" className="inline-flex items-center gap-2 rounded-[18px] border border-[#eadfd9] bg-white px-5 py-3 text-sm font-bold text-[#555565] transition hover:border-[#ffb292] hover:text-[#ff5e1a]">
              Browse the work
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="community-work" className="px-3 pb-8 sm:px-5 sm:pb-12 lg:px-6">
        <div className="mx-auto max-w-[1600px] columns-2 gap-2.5 sm:columns-3 sm:gap-3 lg:columns-4">
          {creations.map((creation, index) => (
            <article key={`${creation.source}-${index}`} className={`group relative mb-2.5 break-inside-avoid overflow-hidden rounded-2xl bg-[#fff0e7] sm:mb-3 ${creation.ratio}`}>
              {creation.kind === "video" ? (
                <video autoPlay muted loop playsInline src={creation.source} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
              ) : (
                <img src={creation.source} alt={creation.alt} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-[#1a1a2e]/15 opacity-0 transition group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
