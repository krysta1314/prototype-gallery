"use client";

import { useState } from "react";
import {
  Globe,
  Search,
  Swords,
  Image as ImageIcon,
  Rocket,
  BarChart3,
  CalendarClock,
  TrendingUp,
  Tags,
  Users,
  MessageSquareQuote,
  Newspaper,
  Link2,
  Languages,
  Megaphone,
  Video,
  Repeat,
  AlertTriangle,
  Wallet,
  Crop,
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
};

// use-case categories, appended to the gallery like Campaign Creation / Branding
export const MISSION_GROUPS: { group: string; items: Mission[] }[] = [
  {
    group: "Research",
    items: [
      {
        title: "Product Page → Content Plan",
        desc: "Read a product page and plan educational content.",
        group: "Research",
        web: "read",
        Icon: Link2,
        prompt:
          "I'm the marketing lead for a supplement brand. Here's my product: <paste product URL>. Please plan 3 educational consideration IG carousels that teach consumers why the ingredients solve their pain points.",
      },
      {
        title: "Brand Voice From Website",
        desc: "Read the brand site and distill tone & selling points.",
        group: "Research",
        web: "read",
        Icon: Globe,
        prompt:
          "Read our brand website <paste URL> and distill the brand voice, key selling points and tone of voice we should reuse across content.",
      },
      {
        title: "Competitor Ad Report",
        desc: "Analyze competitors' recent ad activity.",
        group: "Research",
        web: "search",
        Icon: Swords,
        prompt:
          "Research and summarize my competitors' recent ad activity and creative angles across Meta and TikTok.",
      },
      {
        title: "Weekly Competitor Ad Watch",
        desc: "Monitor competitor ads and suggest new ideas.",
        group: "Research",
        web: "search",
        Icon: Swords,
        prompt:
          "Monitor my competitors' latest ads this week and suggest new creative ideas we should test.",
      },
      {
        title: "Find Market Opportunities",
        desc: "Research trends and turn them into actions.",
        group: "Research",
        web: "search",
        Icon: TrendingUp,
        prompt:
          "Research current trends in my category and turn the most promising ones into concrete campaign actions.",
      },
      {
        title: "Ingredient / Claim Research",
        desc: "Look up efficacy and compliant claim wording.",
        group: "Research",
        web: "search",
        Icon: Search,
        prompt:
          "Research the efficacy of <ingredient> and give me compliant claim wording I can safely use in marketing content.",
      },
      {
        title: "Trending Hashtags & Topics",
        desc: "Find what's trending on social right now.",
        group: "Research",
        web: "search",
        Icon: Tags,
        prompt:
          "Find the hashtags and topics trending on Instagram and TikTok right now for my category.",
      },
      {
        title: "Influencer / KOL Discovery",
        desc: "Find creators to collaborate with.",
        group: "Research",
        web: "search",
        Icon: Users,
        prompt:
          "Find potential KOLs and creators in my category that would be a good fit for a collaboration.",
      },
      {
        title: "Review & Sentiment Mining",
        desc: "Mine product reviews for content angles.",
        group: "Research",
        web: "search",
        Icon: MessageSquareQuote,
        prompt:
          "Search reviews of my product and key competitors, and surface the angles and objections I should address in content.",
      },
      {
        title: "News-Jacking Campaign",
        desc: "Turn a real-time news moment into a campaign.",
        group: "Research",
        web: "search",
        Icon: Newspaper,
        prompt:
          "Find a relevant real-time news moment my brand can tap into, and draft a news-jacking campaign idea.",
      },
    ],
  },
  {
    group: "Ad Creatives",
    items: [
      {
        title: "Turn Landing Page Into Ads",
        desc: "Use a landing page to make ad concepts.",
        group: "Ad Creatives",
        web: "read",
        Icon: Link2,
        prompt:
          "Read this landing page <paste URL> and turn it into a set of ad concepts.",
        cover: "/prototypes/marketing-agent-missions/turn-landing-page-into-ads.png",
      },
      {
        title: "Create Ads From Competitor Signals",
        desc: "Turn competitor ad patterns into new concepts.",
        group: "Ad Creatives",
        web: "search",
        Icon: Swords,
        prompt:
          "Research my competitors' ad patterns and turn them into fresh ad concepts for my brand.",
      },
      {
        title: "Localize Existing Creative",
        desc: "Adapt a creative for another market or language.",
        group: "Ad Creatives",
        web: "search",
        Icon: Languages,
        prompt:
          "Adapt my existing ad creative for the <market> market — research local context and localize copy and angle.",
      },
      {
        title: "Create Short Video Ads",
        desc: "Produce short video ad concepts from brand assets.",
        group: "Ad Creatives",
        web: null,
        Icon: Video,
        prompt: "Produce short video ad concepts from my brand assets.",
        cover: "/prototypes/marketing-agent-missions/short-video-ads.png",
      },
      {
        title: "Create From Saved Inspiration",
        desc: "Use saved references to create a new image ad.",
        group: "Ad Creatives",
        web: null,
        Icon: ImageIcon,
        prompt: "Use my saved inspiration references to create a new image ad.",
      },
      {
        title: "UGC Video Ads",
        desc: "Create creator-style talking-head video ads.",
        group: "Ad Creatives",
        web: null,
        Icon: Video,
        prompt: "Create creator-style talking-head UGC video ads.",
      },
      {
        title: "Resize Creative For Placements",
        desc: "Adapt one creative into platform-ready sizes.",
        group: "Ad Creatives",
        web: null,
        Icon: Crop,
        prompt: "Adapt one creative into all the platform-ready sizes I need.",
      },
    ],
  },
  {
    group: "Launch Ads",
    items: [
      {
        title: "Google Keyword Ads",
        desc: "Research keywords and plan a Google Search campaign.",
        group: "Launch Ads",
        web: "search",
        Icon: Search,
        prompt:
          "Research keywords for my product and plan a Google Search campaign.",
      },
      {
        title: "Google Performance Max Plan",
        desc: "Prepare assets and structure for a PMax campaign.",
        group: "Launch Ads",
        web: "search",
        Icon: Rocket,
        prompt:
          "Research my category and prepare the assets and structure for a Google Performance Max campaign.",
      },
      {
        title: "Seasonal Campaign Ideas",
        desc: "Find seasonal moments and create campaign angles.",
        group: "Launch Ads",
        web: "search",
        Icon: TrendingUp,
        prompt:
          "Find upcoming seasonal moments for my category and create campaign angles around them.",
      },
      {
        title: "TikTok Video Campaign",
        desc: "Create TikTok-style videos and prepare launch.",
        group: "Launch Ads",
        web: null,
        Icon: Rocket,
        prompt: "Create TikTok-style videos and prepare them for launch.",
      },
      {
        title: "Launch Meta Image Campaign",
        desc: "Create image ads and prepare a Meta launch plan.",
        group: "Launch Ads",
        web: null,
        Icon: Rocket,
        prompt: "Create image ads and prepare a Meta launch plan.",
      },
      {
        title: "Meta Reels Video Campaign",
        desc: "Create Reels video ads and prepare a Meta launch.",
        group: "Launch Ads",
        web: null,
        Icon: Rocket,
        prompt: "Create Reels-style video ads and prepare a Meta launch plan.",
      },
      {
        title: "UGC Campaign",
        desc: "Create UGC videos and prepare campaign execution.",
        group: "Launch Ads",
        web: null,
        Icon: Megaphone,
        prompt: "Create UGC videos and prepare the campaign execution.",
      },
    ],
  },
  {
    group: "Reports",
    items: [
      {
        title: "Daily Performance Report",
        desc: "Review yesterday's performance and today's priorities.",
        group: "Reports",
        web: null,
        Icon: BarChart3,
        prompt:
          "Review yesterday's performance and lay out today's priorities.",
      },
      {
        title: "Weekly Performance Report",
        desc: "Summarize last week and next priorities.",
        group: "Reports",
        web: null,
        Icon: BarChart3,
        prompt:
          "Summarize last week's performance and recommend next week's priorities.",
      },
      {
        title: "Campaign Health Check",
        desc: "Inspect current campaign health and risks.",
        group: "Reports",
        web: null,
        Icon: AlertTriangle,
        prompt: "Inspect my current campaign health and flag any risks.",
      },
      {
        title: "Check Creative Fatigue",
        desc: "Find tired creatives and generate replacements.",
        group: "Reports",
        web: null,
        Icon: Repeat,
        prompt:
          "Find my fatigued creatives and generate fresh replacement angles.",
      },
      {
        title: "Diagnose Performance Drop",
        desc: "Find what drove a recent decline.",
        group: "Reports",
        web: null,
        Icon: AlertTriangle,
        prompt: "Diagnose what drove my recent performance decline.",
      },
      {
        title: "Review Budget Reallocation",
        desc: "Find where budget should move next.",
        group: "Reports",
        web: null,
        Icon: Wallet,
        prompt:
          "Review my campaigns and recommend where budget should move next.",
      },
    ],
  },
  {
    group: "Automations",
    items: [
      {
        title: "Schedule Weekly Creative Refresh",
        desc: "Regularly review performance and make new creatives.",
        group: "Automations",
        web: null,
        Icon: CalendarClock,
        prompt:
          "Set up a recurring weekly job that reviews performance and makes new creatives.",
      },
      {
        title: "Schedule Daily Report",
        desc: "Set up a recurring daily performance digest.",
        group: "Automations",
        web: null,
        Icon: CalendarClock,
        prompt: "Set up a recurring daily performance digest.",
      },
    ],
  },
];

const _flatMissions: Mission[] = MISSION_GROUPS.flatMap((g) => g.items);
// pull the cover-art cards to the front of the horizontal row, in this order
export const FEATURED = ["Create Short Video Ads", "Turn Landing Page Into Ads"];
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

// mission card — full-bleed cover, title over a warm scrim, Run on hover
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
      className={`group relative flex aspect-[275/155] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border border-[#ececf1] shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition hover:-translate-y-0.5 hover:shadow-md ${
        full ? "w-full" : "w-[275px] shrink-0"
      }`}
    >
      {/* fill: own cover photo, else the shared default cover */}
      <img
        src={m.cover ?? DEFAULT_COVER}
        alt=""
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />

      {/* warm scrim keeps the white title legible on any fill */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#1f1206]/72 via-[#1f1206]/24 to-transparent"
      />

      {/* title */}
      <h4 className="relative p-4 font-[family-name:var(--font-display)] text-sm font-extrabold leading-snug tracking-tight text-white">
        {m.title}
      </h4>
    </div>
  );
}

// "Agent use cases" block: small category capsules under the composer →
// clicking one reveals that category's cards. "All" shows every preset.
// Labels are written for how marketers actually work: research → make
// creatives → launch → measure → automate.
const GROUP_ICONS: Record<string, typeof Globe> = {
  Research: Search,
  "Ad Creatives": Wand2,
  "Launch Ads": Rocket,
  Reports: BarChart3,
  Automations: Repeat,
};

export function PresetUseCases({ onPick }: { onPick: (m: Mission) => void }) {
  // no category selected by default; clicking a pill reveals its cards,
  // clicking the active pill again unselects and collapses them.
  const [active, setActive] = useState<string | null>(null);
  const tabs = MISSION_GROUPS.map((g) => g.group);

  // cap each category at 6 cards (3 columns × 2 rows)
  const missions = active
    ? (MISSION_GROUPS.find((g) => g.group === active)?.items ?? []).slice(0, 6)
    : [];

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
          className="mt-7 grid animate-in fade-in slide-in-from-bottom-2 grid-cols-1 justify-center items-start gap-4 duration-300 sm:grid-cols-2 lg:grid-cols-[repeat(3,275px)]"
        >
          {missions.map((m) => (
            <MissionTile key={m.title} m={m} onPick={onPick} full />
          ))}
        </div>
      )}
    </div>
  );
}
