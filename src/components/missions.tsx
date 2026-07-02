"use client";

import { useRef, useState } from "react";
import {
  Globe,
  Search,
  Swords,
  Image as ImageIcon,
  Link2,
  Sparkles,
  Radar,
  Lightbulb,
  Users,
  Video,
  LayoutGrid,
  Wand2,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
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
  /** Resize card: 4 mixed-ratio images [square 1:1, feed 4:5, story 9:16, wide 16:9] shown as a staggered stack */
  stack?: [string, string, string, string];
  /** Social Posts card: swipeable set of images, browsed with left/right arrows in a fanned trio */
  carousel?: string[];
};

// use-case categories — written for how a marketer scans the gallery and
// instantly knows "I can do that here": find trends → make content → make
// short videos → grow with creators → advertise & measure.
export const MISSION_GROUPS: { group: string; items: Mission[] }[] = [
  {
    group: "Trends & Research",
    items: [
      {
        title: "Trend & Hashtag Discovery",
        desc: "See what's trending in your niche right now.",
        group: "Trends & Research",
        web: "search",
        Icon: Radar,
        cover:
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331018256989085696.png",
        prompt:
          "Find what's trending in the <your niche> space right now on TikTok, Reels and X, plus the hashtags and sounds worth using.",
      },
      {
        title: "Competitor Analysis",
        desc: "Break down a competitor's posts, ads and angles.",
        group: "Trends & Research",
        web: "search",
        Icon: Swords,
        cover:
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331020393630457856.png",
        prompt:
          "Analyze my competitor <paste URL or @handle>: their best posts, ad angles and messaging, and what I should learn from it.",
      },
      {
        title: "Audience & Persona Research",
        desc: "Build a persona from real comments and reviews.",
        group: "Trends & Research",
        web: "search",
        Icon: Users,
        cover:
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331022074325819392.png",
        prompt:
          "Research my audience for <product/category>: pull their real pain points, wording and objections from comments and reviews, and build a one-page persona.",
      },
      {
        title: "Keyword & SEO Research",
        desc: "Find keywords and topics worth targeting.",
        group: "Trends & Research",
        web: "search",
        cover:
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331022789286879232.png",
        Icon: Search,
        prompt:
          "Research keywords and content topics for <product/category>: search volume, intent and low-competition opportunities to target.",
      },
      {
        title: "Competitor Gap Finder",
        desc: "Spot topics rivals miss and own them.",
        group: "Trends & Research",
        web: "search",
        Icon: Lightbulb,
        cover:
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331023961368354816.png",
        prompt:
          "Analyze my competitors' content and find the topics, angles and keywords they are missing so I can own those gaps.",
      },
    ],
  },
  {
    group: "Create Content",
    items: [
      {
        title: "Create image ad for this product",
        desc: "",
        group: "Create Content",
        web: null,
        Icon: ImageIcon,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330975981340778496.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330976063083569152.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330975999460171776.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330973148713377792.png",
            label: "Image 1",
          },
        ],
        prompt:
          "Create 5 aesthetic and creative image ads for the product from @Image1",
      },
      {
        title: "Turn a product link into image ad",
        desc: "",
        group: "Create Content",
        web: "read",
        Icon: Link2,
        landscape: true,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631043537231872.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631017700319232.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330631030883016704.png",
        ],
        prompt: "Create 5 product images using the info from <paste URL>",
      },
      {
        title: "Create AI Avatar for this product",
        desc: "",
        group: "Create Content",
        web: null,
        Icon: Sparkles,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330986398129643520.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330980230531440640.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330986422989283328.png",
        ],
        attachments: [
          {
            type: "image",
            url: "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330973148713377792.png",
            label: "Image 1",
          },
        ],
        prompt:
          "Create 5 image ads for the product from @Image1 . Every image should have an AI model wearing the product. AI model should match the product perfectly.",
      },
      {
        title: "Social Posts & Carousels",
        desc: "Turn one idea into ready-to-post images and carousels.",
        group: "Create Content",
        web: null,
        Icon: LayoutGrid,
        prompt:
          "Turn <topic/idea> into ready-to-post social images and a swipeable carousel for IG, FB and LinkedIn.",
        carousel: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331011464359895040.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331018887908876288.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331011714659180544.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331011632618594304.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/331011495695540224.png",
        ],
      },
      {
        title: "Localize Existing Creative",
        desc: "Adapt an ad creative for another market or language.",
        group: "Create Content",
        web: "search",
        Icon: Globe,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330988518392258560.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330988534439665664.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330988534439665664.png",
        ],
        prompt: "Localize this creative for <market>",
      },
      {
        title: "Resize Creative For Placements",
        desc: "Adapt one creative into platform-ready sizes.",
        group: "Create Content",
        web: null,
        Icon: LayoutGrid,
        prompt: "Resize this creative for all social placements",
        stack: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330992966313238528.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330992884960518144.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330991751063986176.png",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330992717372907520.png",
        ],
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
        title: "Batch-create 5 UGC ads for this product",
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
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330945818867589120.mp4",
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
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-02/330951725844324352.mp4",
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
        prompt: "Create a product intro video using the info from <paste URL>",
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
          "https://assets.presslogic.com/buzzvideo/users/system-gemini-generate/2026-07-02/330911349427200000.jpg",
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
        title: "Create an AI avatar spokesperson video",
        desc: "",
        group: "Marketing Video",
        web: null,
        Icon: Video,
        frames: [
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330657569574019072.jpg",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330656482720800768.jpg",
          "https://assets.presslogic.com/buzzvideo/users/271472545172074496/2026-07-01/330658527779545088.jpg",
        ],
        hoverVideo:
          "https://asset.buzzvideo.ai/buzzvideo/video/2026/07/02/67776bf7-279d-4fa5-9650-49ab9c6573b9_5b288fba.mp4",
        prompt: "Create a video of a digital presenter reading my script: <paste script>",
      },
      {
        title: "Create an intro video for a bakery",
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
      <div className="relative aspect-video overflow-hidden bg-[#f5f4f8]">
        {m.cover && (
          <img
            src={m.cover}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        )}
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
// icon tile — for text/copy missions that have no meaningful cover imagery
function IconTile({ m, onPick }: { m: Mission; onPick: (m: Mission) => void }) {
  return (
    <div
      onClick={() => onPick(m)}
      style={{ fontFamily: APPLE_FONT }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#f5f4f8] shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h4 className="min-h-[40px] px-4 pt-4 text-[14px] font-semibold leading-snug text-[#1a1a2e]">
        {m.title}
      </h4>
      <div className="flex flex-1 items-center justify-center py-10">
        <span className="grid size-[72px] place-items-center rounded-2xl bg-white text-[#ff5e1a] shadow-sm ring-1 ring-black/5">
          <m.Icon className="size-8" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

// Resize card: same creative shown at 4 placement ratios, staggered stack with slight tilt
function StackTile({ m, onPick }: { m: Mission; onPick: (m: Mission) => void }) {
  const [square, feed, story, wide] = m.stack ?? ["", "", "", ""];
  const img =
    "absolute rounded-[10px] object-cover shadow-[0_6px_18px_rgba(26,26,46,0.14)]";
  return (
    <div
      onClick={() => onPick(m)}
      style={{ fontFamily: APPLE_FONT }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#f5f4f8] shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
    >
      <h4 className="min-h-[40px] px-4 pt-4 text-[14px] font-semibold leading-snug text-[#1a1a2e]">
        {m.title}
      </h4>
      <div className="relative flex h-[196px] items-center justify-center">
        <img src={story} alt="" className={`${img} z-10 h-[140px] w-[79px] -translate-x-[80px] -translate-y-[6px] -rotate-9`} />
        <img src={square} alt="" className={`${img} z-20 size-[86px] -translate-x-[20px] -translate-y-[34px] rotate-3`} />
        <img src={feed} alt="" className={`${img} z-10 h-[120px] w-[96px] translate-x-[62px] -translate-y-[6px] rotate-8`} />
        <img src={wide} alt="" className={`${img} z-30 h-[68px] w-[122px] translate-x-[8px] translate-y-[52px] -rotate-4`} />
      </div>
    </div>
  );
}

// Social Posts card: swipeable carousel shown as a fanned trio; arrows on both
// sides rotate through the set without triggering the card's onPick
function CarouselTile({ m, onPick }: { m: Mission; onPick: (m: Mission) => void }) {
  const imgs = m.carousel ?? [];
  const n = imgs.length;
  const [idx, setIdx] = useState(0);
  const go = (e: React.MouseEvent, d: number) => {
    e.stopPropagation();
    setIdx((i) => (i + d + n) % n);
  };
  const SLIDE = 138; // per-slide slot width in px (image + side gap)
  const arrow =
    "absolute top-1/2 z-40 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1a1a2e] shadow-[0_4px_12px_rgba(26,26,46,0.18)] ring-1 ring-black/5 transition hover:scale-105 hover:text-[#ff5e1a]";
  return (
    <div
      onClick={() => onPick(m)}
      style={{ fontFamily: APPLE_FONT }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#f5f4f8] shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
    >
      <h4 className="min-h-[40px] px-4 pt-4 text-[14px] font-semibold leading-snug text-[#1a1a2e]">
        {m.title}
      </h4>
      <div className="relative mt-3 h-[210px] overflow-hidden">
        {/* sliding track: whole strip translates horizontally like a phone swipe */}
        <div
          className="absolute left-1/2 top-0 flex h-full items-center transition-transform duration-[350ms] ease-out"
          style={{ transform: `translateX(-${idx * SLIDE + SLIDE / 2}px)` }}
        >
          {imgs.map((src, i) => (
            <div
              key={i}
              className="flex shrink-0 justify-center"
              style={{ width: SLIDE }}
            >
              <div
                className={`h-[168px] w-[134px] overflow-hidden rounded-2xl ring-1 transition-all duration-[350ms] ease-out ${
                  i === idx
                    ? "scale-100 opacity-100 shadow-md ring-black/10"
                    : "scale-90 opacity-55 ring-black/5"
                }`}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </div>
            </div>
          ))}
        </div>

        <button onClick={(e) => go(e, -1)} aria-label="Previous" className={`${arrow} left-3`}>
          <ChevronLeft className="size-4" />
        </button>
        <button onClick={(e) => go(e, 1)} aria-label="Next" className={`${arrow} right-3`}>
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex justify-center gap-1.5 pb-4 pt-1">
        {imgs.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-4 bg-[#ff5e1a]" : "w-1.5 bg-[#d5d4de]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
  const wrapH = ls ? "h-[188px]" : "h-[210px]";
  const sideCls = ls
    ? "h-[92px] w-[164px] -translate-y-1"
    : "h-[152px] w-[88px]";
  const sideLeftX = ls ? "-translate-x-[52px]" : "-translate-x-[64px]";
  const sideRightX = ls ? "translate-x-[52px]" : "translate-x-[64px]";
  const centerCls = ls ? "h-[106px] w-[188px]" : "h-[182px] w-[104px]";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
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
        setMuted(true);
      }}
      style={{ fontFamily: APPLE_FONT }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#f5f4f8] shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
    >
      {m.hoverVideo && (
        <>
          <video
            ref={videoRef}
            src={m.hoverVideo}
            muted={muted}
            loop
            playsInline
            preload="auto"
            className="pointer-events-none absolute inset-0 z-20 size-full rounded-2xl object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              const v = videoRef.current;
              setMuted((prev) => {
                const next = !prev;
                if (v) {
                  v.muted = next;
                  if (!next) v.play();
                }
                return next;
              });
            }}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="absolute bottom-3 right-3 z-30 grid size-8 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 hover:bg-white/25"
          >
            {muted ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
        </>
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
};

// display order for the category pills (edit this to reorder the capsules)
const TAB_ORDER = ["Marketing Video", "Create Content", "Trends & Research"];

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
  // Marketing Video and Create Content share the fanned-frame tile style
  const isVideo = active === "Marketing Video" || active === "Create Content";

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
          className="mt-7 grid animate-in fade-in slide-in-from-bottom-2 grid-cols-1 items-stretch gap-4 duration-300 sm:grid-cols-2 lg:grid-cols-3"
        >
          {missions.map((m) =>
            isVideo ? (
              m.carousel ? (
                <CarouselTile key={m.title} m={m} onPick={onPick} />
              ) : m.stack ? (
                <StackTile key={m.title} m={m} onPick={onPick} />
              ) : m.frames ? (
                <MarketingVideoTile key={m.title} m={m} onPick={onPick} />
              ) : (
                <IconTile key={m.title} m={m} onPick={onPick} />
              )
            ) : (
              <MissionTile key={m.title} m={m} onPick={onPick} full />
            ),
          )}
        </div>
      )}
    </div>
  );
}
