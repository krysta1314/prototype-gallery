// 数据 / 研究页(2026-11-26)。格式同 learn/content.ts 的 Guide;GEO 写法见该文件头注释。
// 口径(Monica 已定):我们没有自己的美英投放数据 → 只汇总公开数据 + 自家模型数据，每个数字标来源和核对日期(2026-11-26)。
//   不编数字、不外推;没有可靠来源的格子写 "Not published"。
// 来源(2026-11-26 逐个 WebFetch 打开核对):
//   - best-time-to-post-ads:Meta Marketing API 文档(Pacing and scheduling、Budgets、Bidding overview);
//     Sprout Social(2026-03-31)、Hootsuite Facebook(2025-11-19)/ Instagram(2026-07-14)、Buffer Facebook(2026-10-19)/ Instagram(2026-09-23)。
//     Later 的页面打不开(域名被拦)，没用。Meta 帮助中心「每日预算最多超支 75%」只查到二手转述，和开发者文档的 25% 不一致 → 不写。
//   - ai-video-model-benchmarks:Artificial Analysis 文生视频 / 图生视频榜单(2026-11-26 现行榜单;另有 2026-11-24 抓取存档
//     docs/research/keywords/2026-11-24-artificial-analysis-leaderboards.json,两天内 Kling 4.0 新上榜，其余名次小幅变动);
//     BuzzVideo 自家参数 models/model-facts.ts,积分价 models/pricing-live.json(2026-11-23 导出，version 121)+ model-content.ts 的 UAT 报价。
//   - tiktok-ads-benchmarks / tiktok-ads-cpm:TwoMinuteReports(2,500+ 广告主，2025 全年，全球中位数)、Focus Digital 转引的 Triple Whale
//     (5,900 品牌,2025-08 至 2026-07;Triple Whale 原页 403 打不开)、Lebesgue(电商、样本量和时段未写)、Gupta Media CPM Tracker
//     (月度 CPM 2023-01 至 2025-05;转引 TikTok H1 2024 TopView 国家刊例价);TikTok Ads 帮助中心 Budget、Bidding strategies。
//     各家口径不同，分开列，不合并成一个数。没写方法的国家 CPM 表(若干厂商博客)一律不用。

import type { Guide } from "../learn/content";
import { SIGNUP_CREDITS } from "../tools/credits";

const CHECKED = "Checked Nov 26, 2026.";
const VIDEO_PLAN_NOTE = `Video models on BuzzVideo need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5, Seedream 5.0 lite (images) and Seed Audio 1.0 (voice and music).`;

export const RESEARCH: Guide[] = [
  /* ───────────── Best time to post ads on Facebook & Instagram ───────────── */
  {
    slug: "best-time-to-post-ads",
    group: "Specs and reference",
    title: "Best Time to Post Ads on Facebook & Instagram | BuzzVideo",
    description: "Best time to post ads on Facebook and Instagram: why paid ads have no posting time, Meta's ad scheduling rules, and what 5 organic posting studies found.",
    h1: "What is the best time to post ads on Facebook and Instagram?",
    answer:
      "Paid ads don't have a posting time: Meta enters them into auctions all day while they are active, and you control timing with ad scheduling, which Meta's documentation says to use only with a lifetime budget. For organic posts, Sprout Social's 2026 study of nearly 2 billion engagements found Tuesdays and Wednesdays from midday into the evening, local time, worked best on both Facebook and Instagram.",
    card: "Ad scheduling rules from Meta, plus what 5 organic posting studies found.",
    sections: [
      {
        id: "ads-vs-posts",
        h2: "Do paid ads have a best time to post?",
        blocks: [
          { kind: "p", text: "Not in the way organic posts do. An organic post goes out once and gets most of its reach soon after. A paid ad keeps competing for impressions for as long as the ad set runs. Meta's Marketing API documentation says that with standard pacing, Meta \"enters your ad into every relevant auction and adjusts your bid over a day\", spreading the budget across the day." },
          { kind: "table", head: ["", "Organic post", "Paid ad"], rows: [
            ["How it reaches people", "Shown to followers and in recommendations after you publish", "Wins impressions in Meta's ad auction while the ad set is active"],
            ["Does publish time matter?", "Yes. Studies below measure engagement by hour", "Less. Delivery runs across the whole schedule"],
            ["How you control timing", "Choose when to publish", "Start and end dates, plus ad scheduling with a lifetime budget"],
            ["Time zone", "Your audience's local time", "Ad scheduling follows the viewer's time zone by default"],
          ] },
          { kind: "p", text: "So for ads, the useful question is whether to limit delivery to certain hours. Test that against your own Ads Manager results by hour, not against organic posting studies." },
        ],
      },
      {
        id: "meta-scheduling",
        h2: "What are Meta's rules for ad scheduling?",
        blocks: [
          { kind: "p", text: `These rules come from Meta's Marketing API documentation on pacing, scheduling and budgets. ${CHECKED}` },
          { kind: "table", head: ["Rule", "What Meta's documentation says"], rows: [
            ["Budget type", "Use ad scheduling only with lifetime budgets"],
            ["Schedule blocks", "Must start and end on the hour and be at least one hour long"],
            ["Reach and Frequency campaigns", "Day parts must be at least four hours long"],
            ["Time zone", "Schedules follow the target audience's time zone; the advertiser's time zone is an option"],
            ["Daily budget", "The average amount you're willing to spend each day; paces spending across each day"],
            ["Lifetime budget", "The most you're willing to spend over the whole run; paces spending over the ad set's lifetime"],
            ["Standard pacing (default)", "Enters the ad into every relevant auction and adjusts the bid over the day"],
            ["No pacing (accelerated)", "Enters all eligible auctions at full maximum bid; the budget can run out early"],
          ] },
          { kind: "note", text: "Meta's Help Center also describes how much a daily budget can be exceeded on a single day. We found conflicting figures for this, so we left it out. Check the live Help Center page in your Ads Manager language before you plan around it." },
        ],
      },
      {
        id: "organic-studies",
        h2: "When do organic posts get the most engagement?",
        blocks: [
          { kind: "p", text: "Each study below uses its own customers' posts, its own engagement measure and its own time-zone handling, so the answers differ. Read them as starting points for testing, not as one combined answer." },
          { kind: "table", head: ["Study", "Published", "Sample", "Time zone", "Facebook", "Instagram"], rows: [
            ["Sprout Social", "Mar 31, 2026", "Nearly 2 billion engagements, about 307,000 profiles, Nov 27, 2025 to Feb 27, 2026", "Local time", "Tue and Wed, 12 to 8 p.m.", "Tue 1 to 7 p.m., Wed 12 to 9 p.m."],
            ["Hootsuite (Facebook)", "Nov 19, 2025", "Over 1 million posts, 118 countries", "Localized", "Best overall: Tue 5 a.m.", "See next row"],
            ["Hootsuite (Instagram)", "Jul 14, 2026", "Over 1 million posts, 118 countries", "Localized", "See previous row", "Mon 3 to 9 p.m.; Tue 5 to 8 a.m. and 3 to 7 p.m."],
            ["Buffer (Facebook)", "Oct 19, 2026", "More than 14 million posts; period Not published", "Local time", "Best slot: Thu 9 a.m.; best day: Wed", "See next row"],
            ["Buffer (Instagram)", "Sep 23, 2026", "9.6 million posts, Jan 2024 to Dec 2025", "Local time", "See previous row", "Thu 9 a.m., Wed 12 p.m., Wed 6 p.m.; best day: Wed"],
          ] },
          { kind: "p", text: "Where they agree: midweek beats the weekend. Sprout Social names weekends as the weakest days on both networks, and Buffer names Friday and Saturday as the weakest for Instagram. Where they disagree: the hour. Hootsuite's Facebook data favors early mornings, while Sprout Social favors midday to evening." },
        ],
      },
      {
        id: "how-compiled",
        h2: "How did we compile this?",
        blocks: [
          { kind: "p", text: `BuzzVideo does not run ads on behalf of customers, so we have no paid-delivery data of our own. We opened each source and copied its figures as published, with its date, sample and time-zone method. ${CHECKED}` },
          { kind: "ul", items: [
            "Meta's rules come from its Marketing API documentation. The Business Help Center pages did not load fully for us, so we did not quote them.",
            "Later's posting study could not be opened when we checked, so it is not included.",
            "Hootsuite's general article gives a different Facebook time from its dedicated Facebook article. We used the dedicated articles.",
            "None of these studies separate paid from organic engagement in a way that applies to ad delivery.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to make ads for Facebook and Instagram on BuzzVideo",
      steps: [
        "Describe the ad or upload your product photo in the AI Video Generator.",
        "Generate a 9:16 version for Reels and Stories and a 4:5 or 1:1 version for Feed.",
        "Make two or three hook variations so your scheduled ad sets have fresh creative to rotate.",
        "Download the MP4s and upload them in Meta Ads Manager.",
      ],
      cta: { label: "Make a video ad", href: "/ai-video-generator" },
      note: VIDEO_PLAN_NOTE,
    },
    faq: [
      { q: "What is the best time to run Facebook ads?", a: "There is no single best time. Meta enters active ads into auctions throughout the day, so start with all hours on, then use your Ads Manager breakdown by hour to decide whether ad scheduling is worth it." },
      { q: "Can I schedule Facebook ads for certain hours?", a: "Yes. Meta's documentation says ad scheduling should be used with a lifetime budget, and each block must start on the hour and last at least one hour." },
      { q: "Does ad scheduling use my time zone or the viewer's?", a: "By default, the viewer's. Meta's documentation says ad scheduling applies to the target audience's time zone, with the advertiser's time zone available as an option." },
      { q: "What is the best time to post on Instagram?", a: "Midweek, around midday to early evening, in the two studies we checked, though they differ on the exact hours. Sprout Social (2026) found Tuesdays 1 to 7 p.m. and Wednesdays 12 to 9 p.m. local time; Buffer (2026) found Thursday 9 a.m. and Wednesday 12 p.m. and 6 p.m. Test against your own audience." },
      { q: "What is the best day to post on Facebook?", a: "Sprout Social's 2026 data points to Tuesday and Wednesday, and Buffer's 2026 data to Wednesday, with Thursday close behind. Both are organic posting studies, not ad delivery data." },
      { q: "Are weekends bad for Facebook and Instagram?", a: "For organic posts, Sprout Social's 2026 study names weekends as the weakest days on both networks. For ads, auction costs and results vary by account, so check your own weekday breakdown." },
    ],
    sources: [
      { label: "Meta Marketing API: Pacing and scheduling", url: "https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling" },
      { label: "Meta Marketing API: Budgets", url: "https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets" },
      { label: "Meta Marketing API: Bidding overview", url: "https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview" },
      { label: "Sprout Social: Best times to post on social media", url: "https://sproutsocial.com/insights/best-times-to-post-on-social-media/" },
      { label: "Hootsuite: Best time to post on Facebook", url: "https://blog.hootsuite.com/best-time-to-post-on-facebook/" },
      { label: "Hootsuite: Best time to post on Instagram", url: "https://blog.hootsuite.com/best-time-to-post-on-instagram/" },
      { label: "Buffer: Best time to post on Facebook", url: "https://buffer.com/resources/best-time-to-post-on-facebook/" },
      { label: "Buffer: Best time to post on Instagram", url: "https://buffer.com/resources/when-is-the-best-time-to-post-on-instagram/" },
    ],
    related: ["/instagram-reels", "/write-a-good-hook", "/ai-ugc-ads", "/ai-in-advertising-examples", "/tiktok-ad-specs"],
  },

  /* ───────────── AI video model benchmarks ───────────── */
  {
    slug: "ai-video-model-benchmarks",
    group: "Specs and reference",
    title: "AI Video Model Benchmarks (Nov 2026) | BuzzVideo",
    description: "AI video model benchmarks: Artificial Analysis arena rankings for text- and image-to-video, plus length, resolution, inputs and credit prices on BuzzVideo.",
    h1: "AI video model benchmarks",
    answer:
      "On Artificial Analysis' blind-vote leaderboards (checked Nov 26, 2026), Wan 3.0 leads text-to-video at 1175 Elo, and Seedance 2.5 ranks second in image-to-video at 1158 Elo. On BuzzVideo, Seedance 2.5, Kling 4.0 and Wan 3.0 make the longest single clips, up to 30 seconds.",
    card: "Arena rankings plus length, resolution and credit price for each video model on BuzzVideo.",
    sections: [
      {
        id: "rankings",
        h2: "How do the video models on BuzzVideo rank?",
        blocks: [
          { kind: "p", text: `Artificial Analysis ranks models with an Elo score from blind comparisons judged by its evaluators. Kling 3.0 1080p (Pro) is fixed at 1000 as the reference point. The table lists only models you can use on BuzzVideo, with their rank on the full leaderboard. ${CHECKED}` },
          { kind: "table", head: ["Model on BuzzVideo", "Name on leaderboard", "Text-to-video rank", "Text-to-video Elo", "Image-to-video rank", "Image-to-video Elo"], rows: [
            ["Wan 3.0", "Wan 3.0", "1", "1175", "15", "1110"],
            ["MiniMax H3", "MiniMax H3 (768p)", "3", "1164", "7", "1135"],
            ["Seedance 2.5", "Dreamina Seedance 2.5", "5", "1154", "2", "1158"],
            ["Gemini Omni 1.2 Flash", "Gemini Omni Flash 1.2", "6", "1152", "18", "1086"],
            ["FLUX 3 Max Video", "FLUX 3 Max", "8", "1150", "20", "1065"],
            ["HeyGen Video", "HeyGen Video 1", "9", "1150", "10", "1123"],
            ["MiniMax H3 Max", "MiniMax H3 Max", "10", "1145", "13", "1117"],
            ["Kling 4.0", "Kling 4.0", "11", "1144", "6", "1139"],
            ["FLUX 3 Video", "FLUX 3", "12", "1138", "19", "1070"],
            ["Seedance 2.0", "Dreamina Seedance 2.0", "14", "1135", "5", "1140"],
            ["Gemini Omni Flash", "Gemini Omni Flash 1.1", "16", "1124", "23", "1043"],
            ["Seedance 2.5 Flash", "Dreamina Seedance 2.5 Flash (720p)", "18", "1122", "8", "1135"],
            ["Grok Imagine Video 1.5", "Grok Imagine Video 1.5", "20", "1051", "22", "1047"],
            ["Kling 3.0 Omni", "Kling 3.0 Omni 1080p (Pro)", "26", "1016", "27", "1003"],
            ["Kling 3.0", "Kling 3.0 1080p (Pro)", "27", "1000", "28", "1000"],
            ["Seedance 2.0 Fast", "Not listed", "Not published", "Not published", "Not published", "Not published"],
            ["Seedance 2.0 Mini", "Not listed", "Not published", "Not published", "Not published", "Not published"],
            ["Wan 3.0 Prime", "Not listed", "Not published", "Not published", "Not published", "Not published"],
          ] },
          { kind: "p", text: "Elo scores carry a 95% interval of roughly plus or minus 12 to 17 points, and the leaderboard shows overlapping rank ranges. Models a few points apart are effectively tied. Artificial Analysis tests some models at one setting, such as MiniMax H3 at 768p and Seedance 2.5 Flash at 720p." },
        ],
      },
      {
        id: "specs",
        h2: "How long, how sharp and with what inputs?",
        blocks: [
          { kind: "p", text: "These are the settings each model offers on BuzzVideo, from our own model configuration. They are not benchmark results." },
          { kind: "table", head: ["Model", "Clip length", "Resolutions", "Sound", "Reference inputs (max)"], rows: [
            ["Seedance 2.5", "4 to 30 s", "480p, 720p, 1080p", "On or off", "30 images, 10 videos, 10 audio"],
            ["Seedance 2.5 Flash", "4 to 30 s", "480p, 720p", "On or off", "10 images, 5 videos, 5 audio"],
            ["Seedance 2.0", "4 to 15 s", "480p, 720p, 1080p, 4K", "On or off", "9 images, 3 videos, 3 audio"],
            ["Seedance 2.0 Fast", "4 to 15 s", "480p, 720p", "On or off", "9 images, 3 videos, 3 audio"],
            ["Seedance 2.0 Mini", "4 to 15 s", "480p, 720p", "On or off", "9 images, 3 videos, 3 audio"],
            ["Kling 4.0", "3 to 30 s", "720p, 1080p", "Always on", "10 images, 5 videos"],
            ["Kling 3.0", "3 to 15 s", "720p, 1080p, 4K", "On or off", "2 images"],
            ["Kling 3.0 Omni", "3 to 15 s", "Standard, Pro, 4K", "On or off", "7 images"],
            ["Wan 3.0", "2 to 30 s", "480p, 720p, 1080p", "On or off", "10 images, 5 videos, 5 audio"],
            ["Wan 3.0 Prime", "2 to 30 s", "480p, 720p, 1080p", "On or off", "10 images, 5 videos, 5 audio"],
            ["MiniMax H3", "5 to 15 s", "768p, 2K, 4K", "Always on", "9 images, 3 videos, 3 audio"],
            ["MiniMax H3 Max", "5 to 15 s", "480p, 768p, 1080p", "Always on", "9 images, 3 videos, 3 audio"],
            ["Gemini Omni Flash", "4, 6, 8 or 10 s", "720p", "Always on", "5 images"],
            ["Gemini Omni 1.2 Flash", "3 to 15 s", "360p, 720p, 1080p, 4K (1080p and 4K upscaled)", "Always on", "6 images, 3 videos"],
            ["Grok Imagine Video 1.5", "1 to 15 s", "480p, 720p, 1080p", "On or off", "7 images"],
            ["FLUX 3 Max Video", "5 to 20 s", "720p, 1080p", "On or off", "First and optional last frame, keyframes"],
            ["FLUX 3 Video", "5 to 20 s", "720p, 1080p, 1440p, 2160p", "On or off", "10 images"],
            ["HeyGen Video", "5 to 15 s", "480p, 768p, 1080p, 2K", "Always on", "9 images, 3 videos, 3 audio"],
          ] },
        ],
      },
      {
        id: "price",
        h2: "How much does each model cost on BuzzVideo?",
        blocks: [
          { kind: "p", text: "Credit prices for a 10-second clip, from BuzzVideo's price list exported Nov 23, 2026. Seedance 2.5 Flash and Wan 3.0 Prime are quotes from the BuzzVideo app on Nov 18, 2026. Prices for clips that use a reference video can be higher. The app shows the exact price before you generate." },
          { kind: "table", head: ["Model", "10 s at lowest resolution", "10 s at 720p (or nearest)", "10 s at highest resolution"], rows: [
            ["Seedance 2.5", "206 (480p)", "463", "1,138 (1080p)"],
            ["Seedance 2.5 Flash", "Not published", "303", "Not published"],
            ["Seedance 2.0", "137 (480p)", "289", "1,556 (4K)"],
            ["Seedance 2.0 Fast", "109 (480p)", "231", "231 (720p)"],
            ["Seedance 2.0 Mini", "68 (480p)", "145", "145 (720p)"],
            ["Kling 4.0", "314 (720p)", "314", "470 (1080p)"],
            ["Kling 3.0", "200 (Standard)", "270 (Pro)", "670 (4K)"],
            ["Wan 3.0", "100 (480p)", "200", "400 (1080p)"],
            ["Wan 3.0 Prime", "Not published", "280", "Not published"],
            ["MiniMax H3", "150 (768p)", "150 (768p)", "400 (4K)"],
            ["MiniMax H3 Max", "100 (480p)", "160 (768p)", "320 (1080p)"],
            ["Gemini Omni Flash", "203 (720p)", "203", "203 (720p)"],
          ] },
          { kind: "p", text: "Kling 3.0 Omni, Gemini Omni 1.2 Flash, Grok Imagine Video 1.5, FLUX 3 Max Video, FLUX 3 Video and HeyGen Video were not in the Nov 23 export, so their prices are Not published here. Check the price in the app." },
        ],
      },
      {
        id: "how-compiled",
        h2: "How did we compile this?",
        blocks: [
          { kind: "p", text: `Rankings are copied from Artificial Analysis' text-to-video and image-to-video leaderboards as they stood on Nov 26, 2026. We also saved a copy on Nov 24, 2026; in those two days Kling 4.0 joined the boards and a few positions moved by one or two places. Specs come from BuzzVideo's model configuration, and prices from BuzzVideo's credit price list.` },
          { kind: "ul", items: [
            "We matched BuzzVideo models to leaderboard entries by name. Where the leaderboard tests one setting (for example 768p or 1080p Pro), that is the setting the score refers to.",
            "Artificial Analysis lists its own per-minute API prices. We don't repeat them, because BuzzVideo charges in credits.",
            "Seedance 2.0 Fast, Seedance 2.0 Mini and Wan 3.0 Prime are not on the leaderboards, so they have no score.",
            "Leaderboards change as new votes and models arrive. Check the live boards before quoting a rank.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to compare these models yourself on BuzzVideo",
      steps: [
        "Open the AI Video Generator and write one prompt, or add the same product photo.",
        "Generate it with two or three models from the table, at 480p or 720p to keep the test cheap.",
        "Compare the clips side by side in your library, then re-run the winner at full resolution.",
      ],
      cta: { label: "Try the video models", href: "/ai-video-generator" },
      note: VIDEO_PLAN_NOTE,
    },
    faq: [
      { q: "Which AI video model is best in 2026?", a: "No single model leads every category. On Artificial Analysis (Nov 26, 2026), Wan 3.0 leads text-to-video at 1175 Elo and MAGI-2 leads image-to-video at 1163 Elo, with Seedance 2.5 second at 1158. Several models sit within a few points of each other." },
      { q: "What is Artificial Analysis' video leaderboard?", a: "A public ranking built from blind side-by-side comparisons. Evaluators pick the better of two clips, and the votes become an Elo score, with Kling 3.0 1080p (Pro) fixed at 1000." },
      { q: "Which AI video model makes the longest clips?", a: "On BuzzVideo, Seedance 2.5, Seedance 2.5 Flash, Kling 4.0, Wan 3.0 and Wan 3.0 Prime each make up to 30 seconds in one generation." },
      { q: "Is Seedance 2.5 better than Kling 4.0?", a: "On the Nov 26, 2026 leaderboards, Seedance 2.5 scores higher in both text-to-video (1154 vs 1144) and image-to-video (1158 vs 1139). On BuzzVideo, Kling 4.0 costs less at 1080p: 470 credits for 10 seconds against 1,138." },
      { q: "Which AI video model is cheapest on BuzzVideo?", a: "Seedance 2.0 Mini, at 68 credits for 10 seconds at 480p and 145 at 720p in the Nov 23, 2026 price list. It is not on the Artificial Analysis leaderboards." },
      { q: "Do the benchmarks test ads specifically?", a: "No. The leaderboards rate general video quality across many prompts. For ads, test your own product and hook on two or three models before you scale." },
    ],
    sources: [
      { label: "Artificial Analysis: Text-to-video leaderboard", url: "https://artificialanalysis.ai/video/leaderboard/text-to-video" },
      { label: "Artificial Analysis: Image-to-video leaderboard", url: "https://artificialanalysis.ai/video/leaderboard/image-to-video" },
    ],
    related: ["/best-ai-video-models", "/models", "/seedance-2-5", "/kling-4-0", "/wan-3-0"],
  },

  /* ───────────── TikTok ads benchmarks by industry ───────────── */
  {
    slug: "tiktok-ads-benchmarks",
    group: "Specs and reference",
    title: "TikTok Ads Benchmarks by Industry (2026) | BuzzVideo",
    description: "TikTok ads benchmarks by industry: median CTR, CPC, conversion rate and CPA from public reports, with each report's sample, period and method listed.",
    h1: "TikTok ads benchmarks by industry",
    answer:
      "TikTok does not publish average CTR, CPC or CPM, so every benchmark comes from a third party. Triple Whale's data on 5,900 brands (Aug 2025 to Jul 2026) puts the median CTR at 0.61% and CPM at $4.08, and TwoMinuteReports' 2025 data on 2,500+ advertisers ranges from 0.22% CTR in Travel to 2.59% in Consumer Electronics.",
    card: "Median CTR, CPC, CVR and CPA by industry from public reports, each with its method.",
    sections: [
      {
        id: "overall",
        h2: "What are the average TikTok ad benchmarks?",
        blocks: [
          { kind: "p", text: `The reports below measure different advertisers over different periods, so their numbers are listed side by side, not averaged. ${CHECKED}` },
          { kind: "table", head: ["Report", "Sample and period", "CTR", "CPM", "Conversion rate", "CPA"], rows: [
            ["Triple Whale (via Focus Digital)", "5,900+ brands, Aug 2025 to Jul 2026, medians", "0.61%", "$4.08", "1.56%", "$17.07"],
            ["Lebesgue", "Ecommerce brands using Complete Payment as the conversion; sample size and period Not published", "0.61%", "$4.80", "1.92%", "Not published"],
            ["Gupta Media CPM Tracker", "Monthly averages, Jan 2023 to May 2025", "Not published", "$5.14 (May 2025)", "Not published", "Not published"],
          ] },
          { kind: "p", text: "Triple Whale's figures above also show change from the prior 12 months: median CTR fell from 0.70%, median CPM from $5.71 and median conversion rate from 2.46%. Median ROAS was 1.51." },
        ],
      },
      {
        id: "by-industry",
        h2: "What are TikTok CTR, CPC and conversion rates by industry?",
        blocks: [
          { kind: "p", text: "TwoMinuteReports analyzed 2,500+ advertisers on its reporting platform for Jan 1 to Dec 31, 2025. All figures are global medians in USD. It does not report CPM by industry, and it does not say which conversion events each advertiser counted, so conversion rates vary a lot between industries." },
          { kind: "table", head: ["Industry", "Median CTR", "Median CPC", "Median CVR", "Median CPA", "CPM"], rows: [
            ["Consumer Electronics and Electric Appliances", "2.59%", "$0.12", "2.05%", "$4.38", "Not published"],
            ["Transport", "1.62%", "$0.56", "4.21%", "$8.51", "Not published"],
            ["Internet Finance", "1.36%", "$0.08", "3.03%", "$10.07", "Not published"],
            ["Retail and E-commerce", "0.82%", "$0.26", "2.83%", "$3.78", "Not published"],
            ["Machinery Equipment", "0.76%", "$0.10", "0.79%", "Not published", "Not published"],
            ["Healthcare and Pharmaceutical", "0.69%", "$0.30", "4.14%", "$2.48", "Not published"],
            ["Fast-Moving Consumer Goods", "0.62%", "$0.24", "2.69%", "$5.77", "Not published"],
            ["Automotive", "0.59%", "$0.58", "9.13%", "$5.50", "Not published"],
            ["Media and Content", "0.56%", "$0.24", "5.73%", "$0.83", "Not published"],
            ["Clothing and Accessories", "0.53%", "$0.17", "1.96%", "$4.97", "Not published"],
            ["Public Administration", "0.52%", "$0.30", "2.96%", "Not published", "Not published"],
            ["Culture", "0.48%", "$0.37", "9.24%", "$2.04", "Not published"],
            ["Games", "0.48%", "$0.49", "14.91%", "$0.09", "Not published"],
            ["Catering Services", "0.48%", "$0.24", "3.58%", "Not published", "Not published"],
            ["Food and Drinks", "0.46%", "$0.25", "3.06%", "$9.95", "Not published"],
            ["Chemicals and Energy", "0.45%", "$0.47", "1.65%", "$29.10", "Not published"],
            ["Convenience Services", "0.45%", "$0.40", "10.53%", "$0.14", "Not published"],
            ["Education and Training", "0.42%", "$0.49", "3.97%", "$3.80", "Not published"],
            ["Electronics and Electrical", "0.42%", "$0.98", "3.30%", "$22.03", "Not published"],
            ["Professional Services", "0.40%", "$1.04", "5.55%", "$12.49", "Not published"],
            ["Traditional Finance", "0.35%", "$0.49", "6.73%", "$5.70", "Not published"],
            ["Utility Software", "0.34%", "$1.22", "5.50%", "$9.62", "Not published"],
            ["Home Furnishing Materials", "0.32%", "$0.44", "4.69%", "$4.19", "Not published"],
            ["Real Estate", "0.31%", "$0.66", "5.45%", "$34.17", "Not published"],
            ["Primary Sector", "0.31%", "$0.44", "18.95%", "$1.78", "Not published"],
            ["Franchising", "0.30%", "$0.21", "14.64%", "$28.90", "Not published"],
            ["Telecommunications", "0.26%", "$0.72", "10.21%", "$0.90", "Not published"],
            ["Travel", "0.22%", "$0.98", "1.04%", "$66.54", "Not published"],
          ] },
        ],
      },
      {
        id: "ecommerce-cpm",
        h2: "Is there CPM data by industry?",
        blocks: [
          { kind: "p", text: "Only in part. Focus Digital's write-up of Triple Whale's ecommerce data states two vertical CPMs in its text; the full vertical table is published as an image that we could not verify line by line." },
          { kind: "table", head: ["Ecommerce vertical (Triple Whale via Focus Digital)", "Median CPM", "Median ROAS"], rows: [
            ["Home and garden", "$4.61 (highest of the ten verticals)", "2.02"],
            ["Health and wellness", "$3.67 (among the lowest)", "0.42"],
            ["Other verticals", "Not published in text", "Not published in text"],
          ] },
          { kind: "p", text: "For CPM by country, see [TikTok Ads CPM by Country](/tiktok-ads-cpm)." },
        ],
      },
      {
        id: "how-compiled",
        h2: "How did we compile this?",
        blocks: [
          { kind: "p", text: `BuzzVideo does not run TikTok campaigns for customers, so these are not our numbers. We kept only reports that we could open and that state where the data comes from. ${CHECKED}` },
          { kind: "ul", items: [
            "Triple Whale's own benchmark page refused automated access, so its figures come from Focus Digital's Oct 8, 2026 report, which cites Triple Whale with the sample and period shown.",
            "Focus Digital's CTR and CPC by industry match TwoMinuteReports' table, so we list the original source.",
            "Medians from different reports are not comparable: Lebesgue counts only Complete Payment conversions in ecommerce, while TwoMinuteReports covers all industries and does not name the conversion event.",
            "We left out benchmark pages that give no sample size, period or data source.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to make TikTok ad creative on BuzzVideo",
      steps: [
        "Upload your product photo or paste a product link in the TikTok AI Video Generator.",
        "Generate a 9:16 ad at 1080p with the hook in the first seconds.",
        "Make three to five hook variations, so you can test which one lifts your CTR against these benchmarks.",
        "Download the MP4s and upload them in TikTok Ads Manager with the AI-generated content label on.",
      ],
      cta: { label: "Make a TikTok ad", href: "/tiktok-ai-video-generator" },
      note: VIDEO_PLAN_NOTE,
    },
    faq: [
      { q: "What is a good CTR for TikTok ads?", a: "Public medians sit around 0.6%: Triple Whale reports 0.61% across 5,900+ brands (Aug 2025 to Jul 2026), and Lebesgue reports 0.61% for ecommerce. By industry, TwoMinuteReports' 2025 medians range from 0.22% (Travel) to 2.59% (Consumer Electronics)." },
      { q: "What is the average CPC on TikTok?", a: "It varies by industry. TwoMinuteReports' 2025 global medians run from $0.08 (Internet Finance) to $1.22 (Utility Software), with Retail and E-commerce at $0.26." },
      { q: "What is a good conversion rate for TikTok ads?", a: "Triple Whale's median is 1.56% and Lebesgue's ecommerce figure is 1.92% for purchase conversions. Industry medians in TwoMinuteReports run much higher in some sectors because they count different conversion events." },
      { q: "Does TikTok publish official ad benchmarks?", a: "Not as averages. We found no TikTok page that publishes average CTR, CPC or CPM, so all the figures here are from third-party reports." },
      { q: "What is the average CPA for TikTok ads?", a: "Triple Whale reports a $17.07 median CPA across 5,900+ brands (Aug 2025 to Jul 2026). TwoMinuteReports' industry medians range from $0.09 in Games to $66.54 in Travel." },
      { q: "Why do TikTok benchmark reports disagree?", a: "They measure different advertisers, periods, industries and conversion events. Compare your results with the report closest to your business, and with your own account history." },
    ],
    sources: [
      { label: "TwoMinuteReports: TikTok Ads benchmarks", url: "https://twominutereports.com/tiktok-ads-benchmarks" },
      { label: "Focus Digital: Average TikTok Ads CTR and CPM by industry", url: "https://focus-digital.co/average-tiktok-ads-ctr-and-cpm-by-industry/" },
      { label: "Lebesgue: TikTok Ads benchmarks for CTR, CR and CPM", url: "https://lebesgue.io/tiktok-ads/tiktok-ads-benchmarks" },
      { label: "Gupta Media: TikTok Ads cost", url: "https://guptamedia.com/insights/tiktok-ads-cost" },
    ],
    related: ["/tiktok-ads-cpm", "/tiktok-ad-specs", "/write-a-good-hook", "/tiktok-shop-videos", "/ai-ugc-ads"],
  },

  /* ───────────── TikTok ads CPM by country ───────────── */
  {
    slug: "tiktok-ads-cpm",
    group: "Specs and reference",
    title: "TikTok Ads CPM by Country: What's Published | BuzzVideo",
    description: "TikTok ads CPM by country: TikTok's TopView rates by market, platform-wide median CPMs from public reports, and TikTok's official minimum ad budgets.",
    h1: "TikTok ads CPM by country",
    answer:
      "We found no public source with a stated method that gives TikTok auction CPM by country. The closest country data is TikTok's H1 2024 TopView rate card, as reported by Gupta Media, which lists a $10 CPM for the United States with a $375,000 daily minimum. Platform-wide, Triple Whale's median CPM across 5,900+ brands was $4.08 for Aug 2025 to Jul 2026.",
    card: "What is actually published about TikTok CPM by market, plus TikTok's minimum budgets.",
    sections: [
      {
        id: "by-country",
        h2: "What is the TikTok CPM in each country?",
        blocks: [
          { kind: "p", text: `For regular auction ads (in-feed ads bought in Ads Manager), we found no country-level CPM table that states its sample and period. The only country rates we could verify are TikTok's TopView rates, a reserved full-screen format sold at a fixed CPM. ${CHECKED}` },
          { kind: "table", head: ["Market", "TopView CPM", "TopView CPM with targeting", "Minimum spend per day", "Minimum impressions per day"], rows: [
            ["United States", "$10", "$10", "$375,000", "37,500,000"],
            ["Luxembourg", "$11.90", "$14.28", "$1,273.30", "107,000"],
            ["Taiwan", "$6.06", "$7.58", "$3,636", "649,286"],
            ["UAE", "$4.48", "$5.60", "$6,300", "1,400,000"],
            ["Brazil", "$1.89", "$2.36", "$8,684.55", "4,595,000"],
            ["Mexico", "$1.47", "$1.84", "$10,000.41", "5,435,005"],
            ["United Kingdom, Canada, Australia, Germany", "Not published", "Not published", "Not published", "Not published"],
          ] },
          { kind: "p", text: "Source: Gupta Media, citing TikTok's rates for H1 2024. Gupta Media adds that TikTok charges extra for weekend and holiday placements. These are reservation prices for one premium format, not what an auction in-feed ad costs." },
          { kind: "p", text: "One country-level auction row we could verify: TwoMinuteReports' 2025 data for Automotive advertisers in the United States shows a median CPC of $0.84 and CTR of 0.61%, against $0.58 and 0.59% globally. It does not report CPM." },
        ],
      },
      {
        id: "platform-cpm",
        h2: "What is the average TikTok CPM overall?",
        blocks: [
          { kind: "p", text: "These figures cover all markets in each report's sample. They are listed separately because each report uses different advertisers and periods." },
          { kind: "table", head: ["Report", "Sample and period", "CPM", "Markets"], rows: [
            ["Triple Whale (via Focus Digital)", "5,900+ brands, Aug 2025 to Jul 2026, median", "$4.08 (prior 12 months: $5.71)", "Not published"],
            ["Lebesgue", "Ecommerce brands; sample size and period Not published", "$4.80", "Not published"],
            ["Gupta Media CPM Tracker", "Monthly averages", "$5.14 (May 2025); $2.87 (Jan 2025); $5.84 (Oct 2024)", "Not published"],
          ] },
          { kind: "p", text: "Gupta Media's tracker also shows CPM peaking on shopping days: $6.26 on Black Friday 2024 and $6.28 on Cyber Monday 2024." },
        ],
      },
      {
        id: "minimums",
        h2: "What are TikTok's minimum ad budgets?",
        blocks: [
          { kind: "p", text: "TikTok does not set a minimum CPM for auction ads in the help articles we checked. It does set minimum budgets, and it bills by impression, click or view depending on the bid strategy." },
          { kind: "table", head: ["Setting", "TikTok Ads Manager rule"], rows: [
            ["Campaign daily budget", "Must exceed $50"],
            ["Campaign lifetime budget", "Must exceed $50"],
            ["Ad group daily budget", "Must exceed $20"],
            ["Ad group lifetime budget", "Total days (including past days) x minimum daily budget, for example $620 for 31 days"],
            ["Changing budget type", "Not possible once the campaign or ad group is live"],
            ["Bid strategies", "Target cost per result; Maximum Results"],
            ["Billing events", "oCPM, CPM, CPC and CPV"],
            ["Minimum bid", "Not published in the bidding article"],
          ] },
          { kind: "note", text: "TikTok's budget article shows amounts in dollars and doesn't list minimums in other currencies." },
        ],
      },
      {
        id: "how-compiled",
        h2: "How did we compile this?",
        blocks: [
          { kind: "p", text: `BuzzVideo does not buy TikTok media, so we have no CPM data of our own. We opened each source and kept only figures with a named data source. ${CHECKED}` },
          { kind: "ul", items: [
            "Several vendor blogs publish CPM ranges for the US, UK and other countries without a sample size, period or data source. We left them out rather than repeat unverifiable numbers.",
            "Triple Whale's own pages refused automated access, so its figures come from Focus Digital's Oct 8, 2026 report.",
            "Gupta Media's monthly series stops at May 2025, and its TopView rates are for H1 2024. Newer rates may differ.",
            "Creator payout rates (RPM) are sometimes labeled \"TikTok CPM\". They are a different metric and are not included.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to get more from each impression with BuzzVideo",
      steps: [
        "Generate a 9:16 TikTok ad from your product photo or link.",
        "Make several hook variations, since CPM is what you pay per thousand views and the creative decides what those views do.",
        "Localize the voiceover for each country you target with Seed Audio 1.0, which speaks 21 languages.",
        "Upload in TikTok Ads Manager and compare CPM and CTR per country in your own reports.",
      ],
      cta: { label: "Make a TikTok ad", href: "/tiktok-ai-video-generator" },
      note: VIDEO_PLAN_NOTE,
    },
    faq: [
      { q: "What is the average CPM on TikTok?", a: "Triple Whale reports a $4.08 median across 5,900+ brands for Aug 2025 to Jul 2026. Lebesgue reports $4.80 for ecommerce brands, and Gupta Media's tracker shows $5.14 for May 2025." },
      { q: "What is the TikTok CPM in the United States?", a: "For auction ads, we found no source with a stated method. For TopView, TikTok's H1 2024 rate card (reported by Gupta Media) lists a $10 CPM in the US with a $375,000 minimum daily spend." },
      { q: "What is the TikTok CPM in the UK?", a: "Not published by any source we could verify. Use the CPM column in your own TikTok Ads Manager reports, filtered by country, as your benchmark." },
      { q: "What is the minimum budget for TikTok ads?", a: "TikTok's help center says a campaign budget must exceed $50 and an ad group daily budget must exceed $20. A lifetime ad group budget must cover the minimum daily budget for every day it runs." },
      { q: "Is TopView CPM the same as regular TikTok CPM?", a: "No. TopView is a reserved full-screen placement sold at a fixed rate with large daily minimums. Regular in-feed ads are bought in an auction, so their CPM changes with competition." },
      { q: "Why is TikTok CPM higher in Q4?", a: "More advertisers compete for the same impressions. Gupta Media's tracker shows US-dollar CPM at $6.26 on Black Friday 2024 and $6.28 on Cyber Monday 2024, above most months in its series." },
    ],
    sources: [
      { label: "Gupta Media: TikTok Ads cost (CPM Tracker and TopView rates)", url: "https://guptamedia.com/insights/tiktok-ads-cost" },
      { label: "Focus Digital: Average TikTok Ads CTR and CPM by industry", url: "https://focus-digital.co/average-tiktok-ads-ctr-and-cpm-by-industry/" },
      { label: "Lebesgue: TikTok Ads benchmarks for CTR, CR and CPM", url: "https://lebesgue.io/tiktok-ads/tiktok-ads-benchmarks" },
      { label: "TwoMinuteReports: TikTok Ads benchmarks", url: "https://twominutereports.com/tiktok-ads-benchmarks" },
      { label: "TikTok Ads Manager: Budget", url: "https://ads.tiktok.com/help/article/budget" },
      { label: "TikTok Ads Manager: Bidding strategies", url: "https://ads.tiktok.com/help/article/bidding-strategies" },
    ],
    related: ["/tiktok-ads-benchmarks", "/tiktok-ad-specs", "/tiktok-ai-video-generator", "/tiktok-videos", "/write-a-good-hook"],
  },
];
