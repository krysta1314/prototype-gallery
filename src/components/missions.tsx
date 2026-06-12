"use client";

import { useState } from "react";
import {
  X,
  ArrowRight,
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
  ChevronRight,
} from "lucide-react";

const ctaGrad = "bg-gradient-to-br from-[#FFA73C] to-[#FF5255]";

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
    group: "Research & Intelligence",
    items: [
      {
        title: "Product Page → Content Plan",
        desc: "Read a product page and plan educational content.",
        group: "Research & Intelligence",
        web: "read",
        Icon: Link2,
        prompt:
          "I'm the marketing lead for a supplement brand. Here's my product: <paste product URL>. Please plan 3 educational consideration IG carousels that teach consumers why the ingredients solve their pain points.",
      },
      {
        title: "Brand Voice From Website",
        desc: "Read the brand site and distill tone & selling points.",
        group: "Research & Intelligence",
        web: "read",
        Icon: Globe,
        prompt:
          "Read our brand website <paste URL> and distill the brand voice, key selling points and tone of voice we should reuse across content.",
      },
      {
        title: "Competitor Ad Report",
        desc: "Analyze competitors' recent ad activity.",
        group: "Research & Intelligence",
        web: "search",
        Icon: Swords,
        prompt:
          "Research and summarize my competitors' recent ad activity and creative angles across Meta and TikTok.",
      },
      {
        title: "Weekly Competitor Ad Watch",
        desc: "Monitor competitor ads and suggest new ideas.",
        group: "Research & Intelligence",
        web: "search",
        Icon: Swords,
        prompt:
          "Monitor my competitors' latest ads this week and suggest new creative ideas we should test.",
      },
      {
        title: "Find Market Opportunities",
        desc: "Research trends and turn them into actions.",
        group: "Research & Intelligence",
        web: "search",
        Icon: TrendingUp,
        prompt:
          "Research current trends in my category and turn the most promising ones into concrete campaign actions.",
      },
      {
        title: "Ingredient / Claim Research",
        desc: "Look up efficacy and compliant claim wording.",
        group: "Research & Intelligence",
        web: "search",
        Icon: Search,
        prompt:
          "Research the efficacy of <ingredient> and give me compliant claim wording I can safely use in marketing content.",
      },
      {
        title: "Trending Hashtags & Topics",
        desc: "Find what's trending on social right now.",
        group: "Research & Intelligence",
        web: "search",
        Icon: Tags,
        prompt:
          "Find the hashtags and topics trending on Instagram and TikTok right now for my category.",
      },
      {
        title: "Influencer / KOL Discovery",
        desc: "Find creators to collaborate with.",
        group: "Research & Intelligence",
        web: "search",
        Icon: Users,
        prompt:
          "Find potential KOLs and creators in my category that would be a good fit for a collaboration.",
      },
      {
        title: "Review & Sentiment Mining",
        desc: "Mine product reviews for content angles.",
        group: "Research & Intelligence",
        web: "search",
        Icon: MessageSquareQuote,
        prompt:
          "Search reviews of my product and key competitors, and surface the angles and objections I should address in content.",
      },
      {
        title: "News-Jacking Campaign",
        desc: "Turn a real-time news moment into a campaign.",
        group: "Research & Intelligence",
        web: "search",
        Icon: Newspaper,
        prompt:
          "Find a relevant real-time news moment my brand can tap into, and draft a news-jacking campaign idea.",
      },
    ],
  },
  {
    group: "Web-Powered Creatives",
    items: [
      {
        title: "Turn Landing Page Into Ads",
        desc: "Use a landing page to make ad concepts.",
        group: "Web-Powered Creatives",
        web: "read",
        Icon: Link2,
        prompt:
          "Read this landing page <paste URL> and turn it into a set of ad concepts.",
        cover: "/prototypes/marketing-agent-missions/turn-landing-page-into-ads.png",
      },
      {
        title: "Create Ads From Competitor Signals",
        desc: "Turn competitor ad patterns into new concepts.",
        group: "Web-Powered Creatives",
        web: "search",
        Icon: Swords,
        prompt:
          "Research my competitors' ad patterns and turn them into fresh ad concepts for my brand.",
      },
      {
        title: "Localize Existing Creative",
        desc: "Adapt a creative for another market or language.",
        group: "Web-Powered Creatives",
        web: "search",
        Icon: Languages,
        prompt:
          "Adapt my existing ad creative for the <market> market — research local context and localize copy and angle.",
      },
      {
        title: "Create Short Video Ads",
        desc: "Produce short video ad concepts from brand assets.",
        group: "Web-Powered Creatives",
        web: null,
        Icon: Video,
        prompt: "Produce short video ad concepts from my brand assets.",
        cover: "/prototypes/marketing-agent-missions/short-video-ads.png",
      },
      {
        title: "Create From Saved Inspiration",
        desc: "Use saved references to create a new image ad.",
        group: "Web-Powered Creatives",
        web: null,
        Icon: ImageIcon,
        prompt: "Use my saved inspiration references to create a new image ad.",
      },
      {
        title: "UGC Video Ads",
        desc: "Create creator-style talking-head video ads.",
        group: "Web-Powered Creatives",
        web: null,
        Icon: Video,
        prompt: "Create creator-style talking-head UGC video ads.",
      },
      {
        title: "Resize Creative For Placements",
        desc: "Adapt one creative into platform-ready sizes.",
        group: "Web-Powered Creatives",
        web: null,
        Icon: Crop,
        prompt: "Adapt one creative into all the platform-ready sizes I need.",
      },
    ],
  },
  {
    group: "Ad Launch",
    items: [
      {
        title: "Google Keyword Ads",
        desc: "Research keywords and plan a Google Search campaign.",
        group: "Ad Launch",
        web: "search",
        Icon: Search,
        prompt:
          "Research keywords for my product and plan a Google Search campaign.",
      },
      {
        title: "Google Performance Max Plan",
        desc: "Prepare assets and structure for a PMax campaign.",
        group: "Ad Launch",
        web: "search",
        Icon: Rocket,
        prompt:
          "Research my category and prepare the assets and structure for a Google Performance Max campaign.",
      },
      {
        title: "Seasonal Campaign Ideas",
        desc: "Find seasonal moments and create campaign angles.",
        group: "Ad Launch",
        web: "search",
        Icon: TrendingUp,
        prompt:
          "Find upcoming seasonal moments for my category and create campaign angles around them.",
      },
      {
        title: "TikTok Video Campaign",
        desc: "Create TikTok-style videos and prepare launch.",
        group: "Ad Launch",
        web: null,
        Icon: Rocket,
        prompt: "Create TikTok-style videos and prepare them for launch.",
      },
      {
        title: "Launch Meta Image Campaign",
        desc: "Create image ads and prepare a Meta launch plan.",
        group: "Ad Launch",
        web: null,
        Icon: Rocket,
        prompt: "Create image ads and prepare a Meta launch plan.",
      },
      {
        title: "Meta Reels Video Campaign",
        desc: "Create Reels video ads and prepare a Meta launch.",
        group: "Ad Launch",
        web: null,
        Icon: Rocket,
        prompt: "Create Reels-style video ads and prepare a Meta launch plan.",
      },
      {
        title: "UGC Campaign",
        desc: "Create UGC videos and prepare campaign execution.",
        group: "Ad Launch",
        web: null,
        Icon: Megaphone,
        prompt: "Create UGC videos and prepare the campaign execution.",
      },
    ],
  },
  {
    group: "Analysis & Reporting",
    items: [
      {
        title: "Daily Performance Report",
        desc: "Review yesterday's performance and today's priorities.",
        group: "Analysis & Reporting",
        web: null,
        Icon: BarChart3,
        prompt:
          "Review yesterday's performance and lay out today's priorities.",
      },
      {
        title: "Weekly Performance Report",
        desc: "Summarize last week and next priorities.",
        group: "Analysis & Reporting",
        web: null,
        Icon: BarChart3,
        prompt:
          "Summarize last week's performance and recommend next week's priorities.",
      },
      {
        title: "Campaign Health Check",
        desc: "Inspect current campaign health and risks.",
        group: "Analysis & Reporting",
        web: null,
        Icon: AlertTriangle,
        prompt: "Inspect my current campaign health and flag any risks.",
      },
      {
        title: "Check Creative Fatigue",
        desc: "Find tired creatives and generate replacements.",
        group: "Analysis & Reporting",
        web: null,
        Icon: Repeat,
        prompt:
          "Find my fatigued creatives and generate fresh replacement angles.",
      },
      {
        title: "Diagnose Performance Drop",
        desc: "Find what drove a recent decline.",
        group: "Analysis & Reporting",
        web: null,
        Icon: AlertTriangle,
        prompt: "Diagnose what drove my recent performance decline.",
      },
      {
        title: "Review Budget Reallocation",
        desc: "Find where budget should move next.",
        group: "Analysis & Reporting",
        web: null,
        Icon: Wallet,
        prompt:
          "Review my campaigns and recommend where budget should move next.",
      },
    ],
  },
  {
    group: "Automation",
    items: [
      {
        title: "Schedule Weekly Creative Refresh",
        desc: "Regularly review performance and make new creatives.",
        group: "Automation",
        web: null,
        Icon: CalendarClock,
        prompt:
          "Set up a recurring weekly job that reviews performance and makes new creatives.",
      },
      {
        title: "Schedule Daily Report",
        desc: "Set up a recurring daily performance digest.",
        group: "Automation",
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

// mission card — cover illustration + title + desc + Run button
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
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#ececf1] bg-white text-left shadow-[0_4px_16px_rgba(26,26,46,0.06)] transition hover:border-[#d4d3df] hover:shadow-md ${
        full ? "w-full" : "w-[260px] shrink-0"
      }`}
    >
      {/* cover */}
      <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#fff3ec] via-[#ffe7d6] to-[#ffd9c2]">
        {m.cover ? (
          <img
            src={m.cover}
            alt={m.title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute -right-6 -top-6 size-28 rounded-full bg-white/40 blur-xl"
            />
            <div className="absolute inset-0 grid place-items-center">
              <span className={`grid size-14 place-items-center rounded-2xl ${ctaGrad} text-white shadow-[0_10px_24px_rgba(255,82,85,0.3)] transition group-hover:scale-105`}>
                <m.Icon className="size-7" />
              </span>
            </div>
          </>
        )}
        {m.web && (
          <span className="absolute left-3 top-3">
            <Tag web={m.web} />
          </span>
        )}
      </div>
      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-[family-name:var(--font-display)] text-sm font-extrabold leading-snug tracking-tight text-[#1a1a2e]">
          {m.title}
        </h4>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6a6b7b]">
          {m.desc}
        </p>
        <div className="mt-auto flex items-center justify-end pt-3">
          <span className="inline-flex items-center gap-1 rounded-lg border border-[#ececf1] bg-white px-3 py-1.5 text-xs font-bold text-[#1a1a2e] transition group-hover:border-[#ff5e1a] group-hover:bg-[#fff7f1] group-hover:text-[#ff5e1a]">
            Run <ChevronRight className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

// shared "Preset use case" block: horizontal MissionTile row + "View all" → modal.
// onPick fires when a mission is chosen (modal is closed internally first).
export function PresetUseCases({ onPick }: { onPick: (m: Mission) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<string>("All");
  const modalTabs = ["All", ...MISSION_GROUPS.map((g) => g.group)];
  const modalGroups =
    modalTab === "All"
      ? MISSION_GROUPS
      : MISSION_GROUPS.filter((g) => g.group === modalTab);

  const handlePick = (m: Mission) => {
    setModalOpen(false);
    onPick(m);
  };

  return (
    <>
      <div className="flex items-stretch gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ALL_MISSIONS.map((m) => (
          <MissionTile key={m.title} m={m} onPick={handlePick} />
        ))}
        <button
          onClick={() => setModalOpen(true)}
          className="group flex w-[200px] shrink-0 flex-col items-center justify-center gap-2 self-stretch rounded-2xl border border-dashed border-[#d4d3df] bg-white/60 p-4 text-center transition hover:border-[#ff5e1a] hover:bg-[#fff7f1]"
        >
          <span className={`grid size-10 place-items-center rounded-full ${ctaGrad} text-white transition group-hover:scale-105`}>
            <ArrowRight className="size-5" />
          </span>
          <span className="text-sm font-bold text-[#1a1a2e]">View all</span>
          <span className="text-xs text-[#6a6b7b]">{ALL_MISSIONS.length} presets</span>
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 sm:p-10"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-full w-full max-w-[1000px] overflow-y-auto rounded-[22px] bg-white p-6 shadow-[0_16px_48px_rgba(26,26,46,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">
                All presets
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-[#ececf1] text-[#6a6b7b] transition hover:bg-[#faf8f6]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {modalTabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setModalTab(t)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    modalTab === t
                      ? `${ctaGrad} text-white shadow-[0_8px_20px_rgba(255,82,85,0.28)]`
                      : "border border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#ff5e1a] hover:text-[#ff5e1a]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="space-y-7">
              {modalGroups.map(({ group, items }) => (
                <section key={group}>
                  <h3 className="mb-3 text-sm font-bold text-[#1a1a2e]">{group}</h3>
                  <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => (
                      <MissionTile key={m.title} m={m} onPick={handlePick} full />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
