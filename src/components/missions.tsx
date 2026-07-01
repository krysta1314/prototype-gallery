"use client";

import { useRef, useState } from "react";
import {
  Globe,
  Search,
  Swords,
  Image as ImageIcon,
  Type,
  Mail,
  Rocket,
  CalendarDays,
  Radar,
  Lightbulb,
  Clapperboard,
  Film,
  FlaskConical,
  Video,
  Share2,
  LayoutGrid,
  Wand2,
} from "lucide-react";

// ── web capability tags ───────────────────────────────────────────
export type WebTag = "read" | "search" | null;

const TAG_META: Record<
  Exclude<WebTag, null>,
  { label: string; cls: string; Icon: typeof Globe }
> = {
  read: {
    label: "Web Read",
    cls: "bg-[#eaf2ff] text-[#2563eb] ring-1 ring-[#cfe0ff]",
    Icon: Globe,
  },
  search: {
    label: "Web Search",
    cls: "bg-[#fff3ec] text-[#ff5e1a] ring-1 ring-[#ffd9c2]",
    Icon: Search,
  },
};

export type Mission = {
  title: string;
  desc: string;
  group: string;
  web: WebTag;
  Icon: typeof Globe;
  prompt: string;
  /** optional cover image (under /public); falls back to gradient + icon */
  cover?: string;
  /** Marketing Video only: [left, center, right] frame image URLs */
  frames?: [string, string, string];
  /** Marketing Video only: render the frames as 16:9 landscape instead of 9:16 */
  landscape?: boolean;
  /** optional reference assets shown as attachments in the composer on pick */
  attachments?: { type: "image" | "video"; url: string; label: string }[];
  /** Marketing Video only: full-card video shown on hover */
  hoverVideo?: string;
};

// use-case categories — written for how a marketer scans the gallery and
// instantly knows "I can do that here": find trends → make content → make
// short videos → grow with creators → advertise & measure.
export const MISSION_GROUPS: { group: string; items: Mission[] }[] = [
  {
    group: "Trends & Research",
    items: [
      {
        title: "Create Ads From Competitor Signals",
        desc: "Turn competitor ad patterns into new concepts.",
        group: "Trends & Research",
        web: "search",
        Icon: Wand2,
        prompt:
          "Research my competitors' ad patterns and turn them into fresh ad concepts for my brand.",
      },
      {
        title: "Competitor Ad Report",
        desc: "Analyze competitors' recent ad activity.",
        group: "Trends & Research",
        web: "search",
        Icon: Swords,
        prompt:
          "Research and summarize my competitors' recent ad activity and creative angles across Meta and TikTok.",
      },
      {
        title: "Google Keyword Ads",
        desc: "Research keywords and plan a Google Search campaign.",
        group: "Trends & Research",
        web: "search",
        Icon: Search,
        prompt:
          "Research keywords for my product and plan a Google Search campaign.",
      },
      {
        title: "Competitor Signal To Campaign Plan",
        desc: "Research competitors, create concepts, and plan launch.",
        group: "Trends & Research",
        web: "search",
        Icon: Radar,
        prompt:
          "Research my competitors, turn the signals into fresh concepts, and plan a launch campaign.",
      },
      {
        title: "Find Market Opportunities",
        desc: "Research trends and turn them into actions.",
        group: "Trends & Research",
        web: "search",
        Icon: Lightbulb,
        prompt:
          "Research current trends in my category and turn the most promising ones into concrete campaign actions.",
      },
    ],
  },
  {
    group: "Create Content",
    items: [
      {
        title: "Product Image Ads",
        desc: "Turn a product photo into 5 scroll-stopping image ads.",
        group: "Create Content",
        web: null,
        Icon: ImageIcon,
        prompt:
          "Turn my product photo into 5 scroll-stopping image ads: <paste product URL or upload photo>.",
      },
      {
        title: "Ad Copy & Captions",
        desc: "Headlines, primary text and captions in your voice.",
        group: "Create Content",
        web: null,
        Icon: Type,
        prompt:
          "Write headlines, primary text and captions in my brand voice for <product/campaign>.",
      },
      {
        title: "Email / Newsletter",
        desc: "Launch, promo and re-engagement emails.",
        group: "Create Content",
        web: null,
        Icon: Mail,
        prompt:
          "Write a launch, promo or re-engagement email for <product/campaign>.",
      },
      {
        title: "Localize Existing Creative",
        desc: "Adapt an ad creative for another market or language.",
        group: "Create Content",
        web: "search",
        Icon: Globe,
        prompt:
          "Adapt my existing ad creative for the <market> market — research local context and localize the copy and angle.",
      },
      {
        title: "High-Quality UGC Campaign",
        desc: "Produce premium creator-style videos and plan launch.",
        group: "Create Content",
        web: null,
        Icon: Film,
        prompt:
          "Produce premium creator-style UGC videos and prepare the campaign launch.",
      },
      {
        title: "Resize Creative For Placements",
        desc: "Adapt one creative into platform-ready sizes.",
        group: "Create Content",
        web: null,
        Icon: LayoutGrid,
        prompt: "Adapt one creative into all the platform-ready sizes I need.",
      },
      {
        title: "A/B Test Planner",
        desc: "Structure a clean, conclusive creative test.",
        group: "Create Content",
        web: null,
        Icon: FlaskConical,
        prompt:
          "Design a clean A/B test for my <product> ads: what to test, variants, budget split and how to read the result.",
      },
    ],
  },
  {
    group: "Marketing Video",
    items: [
      {
        title: "Create a UGC ad for this product",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330608821661655040.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330606655119089664.png",
          "https://assets.presslogic.com/buzzvideo/users/273004174491336704/2026-01-30/275553228433690624.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330599160594096128.jpg",
            label: "Image 1",
          },
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/01/907949c8-339f-46bb-9813-5c3857bc72d1_11316804.mp4",
        prompt:
          "Create a 15s vertical UGC-style video for @Image1 . Let the AI generate the creator, home setting, natural handheld shots, authentic excited voiceover",
      },
      {
        title: "Batch-create 10 UGC ads for this product",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330612429845225472.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330612545176002560.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330612416196960256.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330603014412886016.png",
            label: "Image 1",
          },
        ],
        hoverVideo:
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330667985582743552.mp4",
        prompt:
          "Create 5 videos for my product @Image1 , showcasing different styles of UGC promotional videos featuring various ethnicities and genders to promote this product. Increase the number of scene shots and B-roll/empty shots in the videos, and add some camera shake to enhance the texture of these UGC promotional videos.",
      },
      {
        title: "Clone this viral product ad",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330626771449864192.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330625260154052608.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330626793218301952.png",
        ],
        attachments: [
          {
            type: "video",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330614339386007552.mp4",
            label: "Video 1",
          },
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330617304301756416.png",
            label: "Image 1",
          },
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/01/e666f1bc-10e0-4824-a8e0-911291d43a5f_102289b5.mp4",
        prompt:
          "Create a new product high-end \"Lifestyle Unboxing\" UGC-style ad using @Video1 as the reference for pacing, shot rhythm, captions, and hook structure. Replace the advertised item with @Image1 while keeping the overall viral ad energy.",
      },
      {
        title: "Turn a product link into a promo video",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        landscape: true,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631043537231872.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631017700319232.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631030883016704.png",
        ],
        prompt:
          "Create a product intro video using the info from https://www.soundcore.com/products/d2426-capsule-3-laser?variant=45548461621438",
      },
      {
        title: "Create a cinematic TVC brand commercial",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330635333039349760.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330635237258223616.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330635318787104768.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330624100349304832.png",
            label: "Image 1",
          },
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/01/ebb7a9fb-8bb2-430e-ad0d-0630377fbfb1_bf284286.mp4",
        prompt:
          "Create a 15s cinematic TVC-style brand commercial for @Image1 . Premium look with dramatic lighting, smooth slow-motion product shots, an aspirational lifestyle scene, and an elegant tagline reveal at the end.",
      },
      {
        title: "Create a virtual try-on video for this outfit",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330640853716492288.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330642990152343552.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330640868216201216.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330632680108515328.png",
            label: "Image 1",
          },
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330633043767255040.png",
            label: "Image 2",
          },
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330633179276828672.png",
            label: "Image 3",
          },
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/01/185e9eb2-dfd8-4ac4-84d8-a0e683f99ff2_993f2e9b.mp4",
        prompt:
          "Create a 12-second fashion try-on video where a model wears the dress from @Image1 , the shoes from @Image2 , the hand bag from @Image3 and shows it off with natural turns and walks. Clean studio or street-style background in Paris, flattering lighting, trendy fashion-reel pacing.",
      },
      {
        title: "Make an intro video for a bakery",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        landscape: true,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-24/328064461522919424.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-24/328064643744456704.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-24/328064729949986816.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330640597985583104.png",
            label: "Image 1",
          },
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330640663991345152.png",
            label: "Image 2",
          },
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330640725316263936.png",
            label: "Image 3",
          },
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330641494782304256.png",
            label: "Image 4",
          },
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/01/41773f69-6c95-4415-b91c-315bb31858f0_602be601.mp4",
        prompt:
          "Create a 12s promo video for my local bakery using @Image1 , @Image2 , @Image3 and @Image4 . Show the storefront, warm interior atmosphere, signature bread, happy customers, an inviting voiceover, and on-screen text for the bakery name and recommended menu.",
      },
      {
        title: "Create Landing Page Hero Video",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        landscape: true,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-01/319721394151677952.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-01/319721167978029056.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-06-01/319721255160832000.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330646728929763328.png",
            label: "Image 1",
          },
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/01/3331f3ca-29be-4ab9-8381-0a3864da494c_48c3eb95.mp4",
        prompt:
          "@Image1 is an image for a hero section; make it animate while keeping the image structure unchanged. The product slowly spinning, the flowers slowly drop, and the flowers in the back slowly sway left and right",
      },
      {
        title: "AI Avatar Spokesperson",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330657569574019072.jpg",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330656482720800768.jpg",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330658527779545088.jpg",
        ],
        prompt:
          "Create a video of a digital presenter reading my script: <paste script>.",
      },
    ],
  },
  {
    group: "Social Media",
    items: [
      {
        title: "TikTok Video Campaign",
        desc: "Create TikTok-style videos and prepare launch.",
        group: "Social Media",
        web: null,
        Icon: Clapperboard,
        prompt: "Create TikTok-style videos and prepare them for launch.",
      },
      {
        title: "Launch Meta Image Campaign",
        desc: "Create image ads and prepare a Meta launch plan.",
        group: "Social Media",
        web: null,
        Icon: Rocket,
        prompt: "Create image ads and prepare a Meta launch plan.",
      },
      {
        title: "UGC Campaign",
        desc: "Create UGC videos and prepare campaign execution.",
        group: "Social Media",
        web: null,
        Icon: Film,
        prompt: "Create UGC videos and prepare the campaign execution.",
      },
      {
        title: "Seasonal Campaign Ideas",
        desc: "Find seasonal moments and create campaign angles.",
        group: "Social Media",
        web: "search",
        Icon: CalendarDays,
        prompt:
          "Find upcoming seasonal moments for my category and create campaign angles around them.",
      },
    ],
  },
];

const _flatMissions: Mission[] = MISSION_GROUPS.flatMap((g) => g.items);
// pull the cover-art cards to the front of the horizontal row, in this order
export const FEATURED = ["Trend Pulse Scan", "Product Shot Set"];
export const ALL_MISSIONS: Mission[] = [
  ...FEATURED.map((t) => _flatMissions.find((m) => m.title === t)!),
  ..._flatMissions.filter((m) => !FEATURED.includes(m.title)),
];

export function Tag({ web }: { web: Exclude<WebTag, null> }) {
  const t = TAG_META[web];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${t.cls}`}
    >
      <t.Icon className="size-3" />
      {t.label}
    </span>
  );
}

// default cover for missions that ship without their own artwork
const DEFAULT_COVER =
  "/prototypes/marketing-agent-missions/turn-landing-page-into-ads.png";

// Apple system font stack (renders SF Pro on Apple devices)
const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

// mission card — illustration on top, title + subtitle on a white block below
export function MissionTile({
  m,
  onPick,
  full,
}: {
  m: Mission;
  onPick: (m: Mission) => void;
  full?: boolean;
}) {
  return (
    <div
      onClick={() => onPick(m)}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)] ${
        full ? "w-full" : "w-[275px] shrink-0"
      }`}
    >
      {/* illustration */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f4f8]">
        <img
          src={m.cover ?? DEFAULT_COVER}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      {/* title + subtitle */}
      <div className="p-4" style={{ fontFamily: APPLE_FONT }}>
        <h4 className="text-[15px] font-extrabold leading-snug tracking-tight text-[#1a1a2e]">
          {m.title}
        </h4>
        <p className="mt-1 text-[13px] leading-snug text-[#6a6b7b]">
          {m.desc}
        </p>
      </div>
    </div>
  );
}

// Marketing Video card — dark tile, title on top, a fanned trio of vertical
// video frames below (matches the video-preset gallery style)
function MarketingVideoTile({
  m,
  onPick,
}: {
  m: Mission;
  onPick: (m: Mission) => void;
}) {
  const seed = m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // per-card frames: [left, center, right]; falls back to distinct placeholders
  const [left, center, right] = m.frames ?? [
    `https://picsum.photos/seed/${seed}-a/180/320`,
    `https://picsum.photos/seed/${seed}-b/180/320`,
    `https://picsum.photos/seed/${seed}-c/180/320`,
  ];
  const ls = m.landscape;
  const wrapH = ls ? "h-[190px]" : "h-[210px]";
  const sideCls = ls
    ? "h-[104px] w-[184px] -translate-y-1"
    : "h-[152px] w-[88px]";
  const sideLeftX = ls ? "-translate-x-[56px]" : "-translate-x-[64px]";
  const sideRightX = ls ? "translate-x-[56px]" : "translate-x-[64px]";
  const centerCls = ls ? "h-[120px] w-[210px]" : "h-[182px] w-[104px]";
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div
      onClick={() => onPick(m)}
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
      style={{ fontFamily: APPLE_FONT }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#f5f4f8] shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
    >
      {m.hoverVideo && (
        <video
          ref={videoRef}
          src={m.hoverVideo}
          muted
          loop
          playsInline
          preload="auto"
          className="pointer-events-none absolute inset-0 z-20 size-full rounded-2xl object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
      )}
      <h4 className="min-h-[40px] px-4 pt-4 text-[14px] font-semibold leading-snug text-[#1a1a2e]">
        {m.title}
      </h4>
      <div className={`relative mt-3 flex items-center justify-center ${wrapH}`}>
        <div
          className={`absolute ${sideCls} ${sideLeftX} -rotate-[9deg] overflow-hidden rounded-2xl opacity-90 ring-1 ring-black/5`}
        >
          <img src={left} alt="" className="size-full object-cover" />
        </div>
        <div
          className={`absolute ${sideCls} ${sideRightX} rotate-[9deg] overflow-hidden rounded-2xl opacity-90 ring-1 ring-black/5`}
        >
          <img src={right} alt="" className="size-full object-cover" />
        </div>
        <div
          className={`relative z-10 ${centerCls} overflow-hidden rounded-2xl shadow-md ring-1 ring-black/10`}
        >
          <img
            src={center}
            alt=""
            className="size-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

// "Agent use cases" block: small category capsules under the composer →
// clicking one reveals that category's cards. "All" shows every preset.
// Labels are written for how marketers actually work: research → make
// creatives → launch → measure → automate.
const GROUP_ICONS: Record<string, typeof Globe> = {
  "Trends & Research": Search,
  "Create Content": Wand2,
  "Marketing Video": Video,
  "Social Media": Share2,
};

// display order for the category pills (edit this to reorder the capsules)
const TAB_ORDER = [
  "Marketing Video",
  "Create Content",
  "Social Media",
  "Trends & Research",
];

export function PresetUseCases({ onPick }: { onPick: (m: Mission) => void }) {
  // no category selected by default; clicking a pill reveals its cards,
  // clicking the active pill again unselects and collapses them.
  const [active, setActive] = useState<string | null>(null);
  const tabs = TAB_ORDER.filter((g) =>
    MISSION_GROUPS.some((x) => x.group === g),
  );

  const missions = active
    ? (MISSION_GROUPS.find((g) => g.group === active)?.items ?? [])
    : [];
  const isVideo = active === "Marketing Video";

  return (
    <div>
      {/* small capsules — constrained to the composer width, wrap & center */}
      <div className="mx-auto flex max-w-[720px] flex-wrap justify-center gap-2">
        {tabs.map((t) => {
          const isActive = t === active;
          const Icon = GROUP_ICONS[t] ?? LayoutGrid;
          return (
            <button
              key={t}
              onClick={() => setActive((prev) => (prev === t ? null : t))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
                isActive
                  ? "border-[#ff5e1a] bg-[#fff3ec] text-[#ff5e1a]"
                  : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#ffd9c2] hover:text-[#ff5e1a]"
              }`}
            >
              <Icon className="size-3.5" />
              {t}
            </button>
          );
        })}
      </div>

      {/* cards for the selected category (hidden when nothing is selected) */}
      {active && (
        <div
          key={active}
          className={`mt-7 grid animate-in fade-in slide-in-from-bottom-2 grid-cols-1 items-stretch justify-center gap-4 duration-300 sm:grid-cols-2 ${
            isVideo
              ? "lg:grid-cols-[repeat(3,320px)]"
              : "lg:grid-cols-[repeat(3,275px)]"
          }`}
        >
          {missions.map((m) =>
            isVideo ? (
              <MarketingVideoTile key={m.title} m={m} onPick={onPick} />
            ) : (
              <MissionTile key={m.title} m={m} onPick={onPick} full />
            ),
          )}
        </div>
      )}
    </div>
  );
}
