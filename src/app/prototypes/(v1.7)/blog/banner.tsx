"use client";

/* 报头 banner。整幅 Buzz 橙色块,右半铺几何纹样。
   纹样母题是「播放三角 + 菱形」,取自视频产品本身,不是随手找的装饰花纹;
   左侧用一道遮罩把纹样淡出,保证标题区域干净。 */

export function BlogBanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg,#ff6a1f 0%,#ef4a12 100%)" }}
    >
      {/* 纹样 */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-full opacity-[0.28] sm:w-[62%]"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 38%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 38%)",
        }}
      >
        <defs>
          {/* 四分之一圆弧交替铺排,构成连续的流动网格。
              选圆弧而不是尖角图形:Buzz 的品牌语言是圆润的,弧线也不会跟标题抢注意力。 */}
          <pattern id="buzz-lattice" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round">
              {/* 方格骨架 */}
              <path d="M0 0 H120 M0 0 V120" />
              {/* 格内由两条对角线切出四个三角,每个三角各自内缩描边,
                  所以看到的是四枚独立的三角形而不是一个 X */}
              <path d="M7 6 L113 6 L60 55 Z" />
              <path d="M114 7 L114 113 L65 60 Z" />
              <path d="M113 114 L7 114 L60 65 Z" />
              <path d="M6 113 L6 7 L55 60 Z" />
              {/* 交点与边中点上的小菱形 */}
              <path d="M0 -9 L9 0 L0 9 L-9 0 Z" />
              <path d="M120 -9 L129 0 L120 9 L111 0 Z" />
              <path d="M60 -7 L67 0 L60 7 L53 0 Z" />
              <path d="M0 53 L7 60 L0 67 L-7 60 Z" />
              <path d="M120 53 L127 60 L120 67 L113 60 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#buzz-lattice)" />
      </svg>

      <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <h1 className="whitespace-nowrap text-[clamp(28px,6.2vw,68px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-white">
          BuzzVideo Resources
        </h1>
        <p className="mt-5 max-w-[54ch] text-[clamp(17px,1.5vw,20px)] leading-[1.55] text-white/90">
          Product updates, step-by-step guides and stories from teams shipping video at volume.
        </p>
      </div>
    </section>
  );
}
