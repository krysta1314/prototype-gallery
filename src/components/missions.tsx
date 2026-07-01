"use client";

import { useState } from "react";
import {
  Globe,
  Search,
  Swords,
  Image as ImageIcon,
  Images,
  Rocket,
  BarChart3,
  LineChart,
  CalendarDays,
  Users,
  UserSearch,
  Radar,
  Hash,
  Ear,
  Lightbulb,
  PenLine,
  GalleryHorizontalEnd,
  Repeat,
  Camera,
  Clapperboard,
  Mic,
  Music2,
  Film,
  ScrollText,
  Captions,
  ClipboardList,
  Send,
  Gift,
  Star,
  Target,
  FlaskConical,
  Wallet,
  Megaphone,
  Video,
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

// use-case categories — written for how a marketer scans the gallery and
// instantly knows "I can do that here": find trends → make content → make
// short videos → grow with creators → advertise & measure.
export const MISSION_GROUPS: { group: string; items: Mission[] }[] = [
  {
    group: "Find Trends & Research",
    items: [
      {
        title: "Trend Pulse Scan",
        desc: "See what's spiking in your niche this week.",
        group: "Find Trends & Research",
        web: "search",
        Icon: Radar,
        prompt:
          "Scan TikTok and Reels for what's spiking in the <your niche> space this week, and turn the 5 hottest trends into post ideas I can act on today.",
      },
      {
        title: "Competitor Teardown",
        desc: "Break down a rival's best posts and ads.",
        group: "Find Trends & Research",
        web: "read",
        Icon: Swords,
        prompt:
          "Read my competitor's page <paste URL or @handle> and break down their best-performing formats, hooks and ad angles — tell me what to copy and what to avoid.",
      },
      {
        title: "Audience Insight",
        desc: "Build a real persona from comments and reviews.",
        group: "Find Trends & Research",
        web: "search",
        Icon: Users,
        prompt:
          "Research my audience for <product/category>: pull their real pain points, wording and objections from social comments and reviews, and build me a one-page persona.",
      },
      {
        title: "Hashtag Finder",
        desc: "Trending, low-competition tags to ride.",
        group: "Find Trends & Research",
        web: "search",
        Icon: Hash,
        prompt:
          "Find 15 trending but low-competition hashtags for <topic> on Instagram and TikTok right now, grouped by reach.",
      },
      {
        title: "Brand Listening",
        desc: "Hear what people are saying about you right now.",
        group: "Find Trends & Research",
        web: "search",
        Icon: Ear,
        prompt:
          "Search what people are saying about <brand name> across social this week and summarize sentiment, top praise and top complaints.",
      },
      {
        title: "Idea Bank",
        desc: "One topic into 20 fresh post ideas.",
        group: "Find Trends & Research",
        web: "search",
        Icon: Lightbulb,
        prompt:
          "Give me 20 content ideas for <brand>, blending current trends with our evergreen topics, each with a one-line hook.",
      },
    ],
  },
  {
    group: "Create Content",
    items: [
      {
        title: "Caption Pack",
        desc: "10 on-brand caption options for one post.",
        group: "Create Content",
        web: null,
        Icon: PenLine,
        prompt:
          "Write 10 on-brand caption variants for a post about <topic>, from punchy to storytelling, each with a CTA.",
      },
      {
        title: "Carousel Builder",
        desc: "One idea into a swipeable carousel.",
        group: "Create Content",
        web: null,
        Icon: GalleryHorizontalEnd,
        prompt:
          "Turn <topic/angle> into a 6-slide educational carousel — give me a cover hook plus a headline and body copy for each slide.",
      },
      {
        title: "Content Calendar",
        desc: "Plan a month of posts in minutes.",
        group: "Create Content",
        web: null,
        Icon: CalendarDays,
        prompt:
          "Plan a 4-week social calendar for <brand> across IG and TikTok, balancing educational, promo and UGC posts, with a theme per week.",
      },
      {
        title: "Repurpose It",
        desc: "One blog or video into a week of posts.",
        group: "Create Content",
        web: "read",
        Icon: Repeat,
        prompt:
          "Read this <paste URL> and repurpose it into a week of posts: 3 captions, 2 short-video hooks and 1 carousel outline.",
      },
      {
        title: "Product Shot Set",
        desc: "Generate 5 on-brand product images for posts.",
        group: "Create Content",
        web: null,
        Icon: ImageIcon,
        prompt:
          "Generate 5 on-brand product images for <product> I can post — clean studio, lifestyle and flat-lay styles.",
      },
      {
        title: "Photo to Post",
        desc: "Drop a product photo, get a ready post.",
        group: "Create Content",
        web: null,
        Icon: Camera,
        prompt:
          "Here's my product photo. Write a ready-to-publish post — caption, hashtags and CTA in my brand voice.",
      },
    ],
  },
  {
    group: "Make Short Videos",
    items: [
      {
        title: "Video Hook Lab",
        desc: "10 first-3-second hooks for a Reel.",
        group: "Make Short Videos",
        web: null,
        Icon: Clapperboard,
        prompt:
          "Give me 10 first-3-second hooks for a Reel about <topic>, each designed to stop the scroll.",
      },
      {
        title: "UGC Script Writer",
        desc: "Authentic creator-style talking script.",
        group: "Make Short Videos",
        web: null,
        Icon: Mic,
        prompt:
          "Write an authentic 30-second UGC-style talking script for <product> — hook, relatable problem, soft CTA.",
      },
      {
        title: "Trend Remix",
        desc: "Adapt a viral sound or format to your product.",
        group: "Make Short Videos",
        web: "search",
        Icon: Music2,
        prompt:
          "Find a viral sound or video format trending now and adapt it into a short-video concept for <product>.",
      },
      {
        title: "Storyboard + B-roll",
        desc: "Shot list and B-roll plan for one video.",
        group: "Make Short Videos",
        web: null,
        Icon: Film,
        prompt:
          "Create a shot-by-shot storyboard and B-roll list for a 20-second video about <topic>.",
      },
      {
        title: "Explainer Script",
        desc: "A tight 30-second product explainer.",
        group: "Make Short Videos",
        web: null,
        Icon: ScrollText,
        prompt:
          "Write a tight 30-second explainer script for <product>: what it is, who it's for, and why it's better.",
      },
      {
        title: "Captions & Subtitles",
        desc: "On-screen captions plus a closing CTA.",
        group: "Make Short Videos",
        web: null,
        Icon: Captions,
        prompt:
          "Write punchy on-screen captions and subtitles for my <topic> video, ending with a clear CTA.",
      },
    ],
  },
  {
    group: "Grow with Creators",
    items: [
      {
        title: "Creator Shortlist",
        desc: "Find micro-influencers that fit your brand.",
        group: "Grow with Creators",
        web: "search",
        Icon: UserSearch,
        prompt:
          "Find 10 micro-influencers (10k–100k) in the <niche> space who fit my brand — handles, audience and why they match.",
      },
      {
        title: "UGC Brief Builder",
        desc: "Brief creators with hooks and do's & don'ts.",
        group: "Grow with Creators",
        web: null,
        Icon: ClipboardList,
        prompt:
          "Write a UGC creator brief for <product>: 3 hook options, key talking points, must-says and do's & don'ts.",
      },
      {
        title: "Outreach DM Pack",
        desc: "Personalized first-contact messages.",
        group: "Grow with Creators",
        web: null,
        Icon: Send,
        prompt:
          "Write 5 personalized outreach DMs inviting creators to collab with <brand> — friendly, not spammy.",
      },
      {
        title: "Affiliate Launch Kit",
        desc: "Set up an affiliate offer with creator assets.",
        group: "Grow with Creators",
        web: null,
        Icon: Gift,
        prompt:
          "Help me launch an affiliate program for <product>: suggest commission, a creator pitch, and the assets to give them.",
      },
      {
        title: "Review to Post",
        desc: "Turn 5-star reviews into UGC-style posts.",
        group: "Grow with Creators",
        web: null,
        Icon: Star,
        prompt:
          "Turn these customer reviews into 3 UGC-style social posts with captions: <paste reviews>.",
      },
      {
        title: "Boost Best Posts",
        desc: "Turn a creator post into a paid spark ad.",
        group: "Grow with Creators",
        web: "read",
        Icon: Rocket,
        prompt:
          "Take my best creator post <paste URL> and adapt it into a paid spark ad with 3 caption variants.",
      },
    ],
  },
  {
    group: "Advertise & Optimize",
    items: [
      {
        title: "Ad Creative Set",
        desc: "5 ad variants per angle in one go.",
        group: "Advertise & Optimize",
        web: null,
        Icon: Images,
        prompt:
          "Generate 5 ad creative variants for <product> around the <angle> angle — headline, primary text and a visual idea each.",
      },
      {
        title: "Audience Builder",
        desc: "Targeting and lookalike audience ideas.",
        group: "Advertise & Optimize",
        web: null,
        Icon: Target,
        prompt:
          "Suggest Meta targeting and lookalike audiences for <product> — interests, demographics and a reason for each.",
      },
      {
        title: "A/B Test Planner",
        desc: "Structure a clean, conclusive creative test.",
        group: "Advertise & Optimize",
        web: null,
        Icon: FlaskConical,
        prompt:
          "Design a clean A/B test for my <product> ads: what to test, variants, budget split and how to read the result.",
      },
      {
        title: "Budget Reallocator",
        desc: "Shift spend off tired creatives, live.",
        group: "Advertise & Optimize",
        web: null,
        Icon: Wallet,
        prompt:
          "Here's my campaign data <paste>. Flag underperformers and tell me how to reallocate budget this week.",
      },
      {
        title: "Weekly Wrap",
        desc: "Auto-generate a weekly performance recap.",
        group: "Advertise & Optimize",
        web: null,
        Icon: BarChart3,
        prompt:
          "Turn my last 7 days of social and ad metrics into a clear weekly recap with wins, misses and next steps.",
      },
      {
        title: "What Worked",
        desc: "Decode why a post over- or under-performed.",
        group: "Advertise & Optimize",
        web: "read",
        Icon: LineChart,
        prompt:
          "Look at this post <paste URL> and explain why it over- or under-performed, plus what to do next time.",
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
  "Find Trends & Research": Search,
  "Create Content": Wand2,
  "Make Short Videos": Video,
  "Grow with Creators": Users,
  "Advertise & Optimize": Megaphone,
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
