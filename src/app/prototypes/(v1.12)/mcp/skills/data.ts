// BuzzVideo MCP Skills 介绍页的数据。卡片、分类、一键试用的提示词都在这里，页面只负责展示。
// 效果素材在 public/prototypes/mcp-skill-showcase/<slug>.mp4 / .jpg(来自 2026-10-30 第 2 轮实测成片);没有的走占位。

export const MCP_URL = "https://mcp.buzzvideo.ai/mcp";
/** ChatGPT 插件目录里 BuzzVideo 的安装页(照 Higgsfield 的写法推测，上线前要和 ChatGPT 上架的实际地址核对) */
export const CHATGPT_PLUGIN_URL = "https://chatgpt.com/plugins/buzzvideo?open_in_app=1";
export const CLAUDE_CONNECT_URL = `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=BuzzVideo&connectorUrl=${MCP_URL}`;

export type Category = "Ads" | "UGC" | "E-commerce" | "Video tools" | "Stories" | "3D" | "Research";
export const CATEGORIES: Category[] = ["Ads", "UGC", "E-commerce", "Video tools", "Stories", "3D", "Research"];
export const CATEGORY_NOTE: Record<Category, string> = {
  Ads: "Make, remix and scale paid creative",
  UGC: "Creator-style product videos",
  "E-commerce": "Studio photos and listing images",
  "Video tools": "Edit, clip, analyse and key",
  Stories: "Series and explainers",
  "3D": "Turntables, previs and figures",
  Research: "What the market is running",
};

export type Skill = {
  slug: string;
  name: string;
  category: Category;
  /** 卡片上一句话 */
  line: string;
  /** 详情里「你会得到什么」 */
  gets: string[];
  /** 一键带进 ChatGPT / Claude 输入框的话 */
  prompt: string;
  media: "video" | "image" | "none";
  /** 产品里现成的素材(uat-app.buzzvideo.ai 用例库 / 画布项目),有就优先用，没有才用 public 里的本地文件 */
  video?: string;
  poster?: string;
  /** 素材比例，用来决定卡片里怎么摆 */
  ratio: "9:16" | "1:1" | "wide";
  featured?: boolean;
  minutes: number;
  /** 详情页大标题：这条 Skill 带来的结果 */
  headline: string;
  /** 详情页对话演示里的 3 条进度 */
  steps: [string, string, string];
  /** 详情页「More ways to use it」 */
  variations: { title: string; prompt: string }[];
};

export const SKILLS: Skill[] = [
  {
    slug: "video-editor",
    name: "AI Video Editor",
    category: "Video tools",
    line: "Raw clips in, a fast-cut Reel out. Captions, beat cuts and punch-ins included.",
    gets: ["A finished 9:16 edit in the style you pick", "Word-by-word captions that stay off your product", "A clean file plus a music-free master for in-app tracks"],
    prompt: "Use the BuzzVideo video-editor skill. Cut my clips into a 15-second day-in-my-life Reel with captions. Ask me to upload the clips and pick an editing style first.",
    media: "video",
    video: "/prototypes/mcp-skill-showcase/video-editing-demo.mp4",
    poster: "/prototypes/mcp-skill-showcase/video-editing-demo.jpg",
    ratio: "9:16",
    featured: true,
    minutes: 8,
    headline: "Raw footage in. A Reel that stops the scroll out.",
    steps: ["Reading your clips and marking the best moments", "Cutting on the beat with punch-ins and speed ramps", "Adding word-by-word captions and checking every frame"],
    variations: [
      { title: "Talking-head cleanup", prompt: "Use the BuzzVideo video-editor skill to cut the pauses, filler words and retakes from my talking-head video and add captions." },
      { title: "Match a reference style", prompt: "Use the BuzzVideo video-editor skill to edit my clips in the same style as a reference video I will upload." },
      { title: "Real footage + AI shots", prompt: "Use the BuzzVideo video-editor skill to mix my product footage with AI shots that fill the gaps, then cut a 15-second ad." },
    ],
  },
  {
    slug: "viral-remix",
    name: "Viral Remix",
    category: "Ads",
    line: "Pick a viral reel. Get the same edit, starring your product.",
    gets: ["Shot-by-shot match of pacing, moves and transitions", "Your product swapped into every shot", "A side-by-side of reference vs. remix"],
    prompt: "Use the BuzzVideo viral-remix skill. Recreate a viral reel shot by shot with my product: same pacing, camera moves and transitions. Ask me for the reference video and my product photos first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-07-31/341459635628204032.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-07-31/341459690191904768.jpg",
    ratio: "9:16",
    featured: true,
    minutes: 12,
    headline: "Any trend. Your product. Same edit.",
    steps: ["Breaking the reference down shot by shot", "Generating each shot with your product", "Cutting to the original timing and grade"],
    variations: [
      { title: "Glow-up trend", prompt: "Use the BuzzVideo viral-remix skill to do this glow-up trend with my product." },
      { title: "Transition trend", prompt: "Use the BuzzVideo viral-remix skill to remake this transition reel with my outfit photos." },
      { title: "POV format", prompt: "Use the BuzzVideo viral-remix skill to recreate this POV video in my café." },
    ],
  },
  {
    slug: "ad-remake",
    name: "Ad Remake",
    category: "Ads",
    line: "Find what's already working in your category, then rebuild it for your brand.",
    gets: ["10-20 in-market reference ads, shortlisted", "A breakdown of why the winner works", "An original ad on the same structure"],
    prompt: "Use the BuzzVideo ad-remake skill. Find ads running now in my category and rebuild the best structure for my product. Ask me about my product and market first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-08-04/342955960098152448.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-08-04/342962755302645760.jpg",
    ratio: "9:16",
    minutes: 15,
    headline: "Rebuild what's already winning in your category.",
    steps: ["Searching live ads in your market", "Breaking down why the best one works", "Rebuilding it with your product and copy"],
    variations: [
      { title: "From a competitor ad", prompt: "Use the BuzzVideo ad-remake skill to rebuild this competitor ad structure for my product." },
      { title: "From the ad library", prompt: "Use the BuzzVideo ad-remake skill to find the top-running ads for hydrating mists in Hong Kong and remake one for my brand." },
    ],
  },
  {
    slug: "link-to-ad",
    name: "Link to Ad",
    category: "Ads",
    line: "Paste a product page. Get three ad angles as images and short videos.",
    gets: ["A confirmed claims sheet from the page", "Problem/solution, social proof and offer angles", "Feed and story images plus a 15-second video"],
    prompt: "Use the BuzzVideo link-to-ad skill. Turn my product page into ready-to-run ads. Ask me for the product link first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-10-20/370857779251961856.mp4",
    ratio: "wide",
    minutes: 10,
    headline: "Paste a link. Get a week of ads.",
    steps: ["Reading your product page and claims", "Writing three angles and the copy", "Making feed, story and video creatives"],
    variations: [
      { title: "Shopify product", prompt: "Use the BuzzVideo link-to-ad skill to make ads from my Shopify product link." },
      { title: "Social proof angle", prompt: "Use the BuzzVideo link-to-ad skill to make a social-proof ad from my product page using real reviews." },
    ],
  },
  {
    slug: "ad-hook-variants",
    name: "Hook Variants",
    category: "Ads",
    line: "Keep the ad and swap only the first three seconds. Built for A/B tests.",
    gets: ["3-5 new hooks of different types", "Spliced onto your original body and audio", "A labelled test sheet"],
    prompt: "Use the BuzzVideo ad-hook-variants skill. My ad's first 3 seconds aren't stopping the scroll. Give me new hooks to A/B test. Ask me to upload the ad first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324763909321973760.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-08-11/345388630765789184.jpg",
    ratio: "9:16",
    minutes: 8,
    headline: "Same ad. Five new first seconds.",
    steps: ["Finding the splice point in your ad", "Writing pain, contrast and result-first hooks", "Rendering each variant for an A/B test"],
    variations: [
      { title: "Result-first hook", prompt: "Use the BuzzVideo ad-hook-variants skill to open my ad on the result instead of the problem." },
      { title: "Pattern interrupt", prompt: "Use the BuzzVideo ad-hook-variants skill to give my ad a pattern-interrupt opening." },
    ],
  },
  {
    slug: "ad-variations",
    name: "Ad Variations",
    category: "Ads",
    line: "Same script, new faces and places. One ad becomes many.",
    gets: ["New talent, outfits or settings per variant", "Product, timing and audio locked", "A cast sheet and variant matrix"],
    prompt: "Use the BuzzVideo ad-variations skill. Make versions of my ad with a different model and setting. Ask me to upload the ad first.",
    media: "video",
    video: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-10-20/2310e4ae-6431-4690-b11c-7d1046380012.mp4",
    ratio: "wide",
    minutes: 10,
    headline: "One winning ad. Ten fresh faces.",
    steps: ["Locking your product, script and timing", "Casting new talent and settings", "Generating each variant consistently"],
    variations: [
      { title: "New model", prompt: "Use the BuzzVideo ad-variations skill to make my ad with a different model." },
      { title: "New location", prompt: "Use the BuzzVideo ad-variations skill to move my ad to a Hong Kong office setting." },
      { title: "Seasonal refresh", prompt: "Use the BuzzVideo ad-variations skill to make a winter version of my ad." },
    ],
  },
  {
    slug: "ad-localizer",
    name: "Ad Localizer",
    category: "Ads",
    line: "One ad for every market: new voiceover, captions and on-screen text.",
    gets: ["Adapted copy with back-translations", "New voiceover timed to the picture", "Old captions cleanly replaced"],
    prompt: "Use the BuzzVideo ad-localizer skill. Make an English version of my ad for another market. Ask me to upload the ad and pick the markets first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324747284346626048.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-06-25/328354626652921856.jpg",
    ratio: "9:16",
    minutes: 8,
    headline: "One ad. Every market it needs to speak to.",
    steps: ["Reading the captions as the script", "Adapting the copy and recording new voiceover", "Replacing every line of on-screen text"],
    variations: [
      { title: "English version", prompt: "Use the BuzzVideo ad-localizer skill to make an English version of my Cantonese ad." },
      { title: "Taiwan market", prompt: "Use the BuzzVideo ad-localizer skill to localise my ad for Taiwan in Traditional Chinese." },
    ],
  },
  {
    slug: "ad-resizer",
    name: "Ad Resizer",
    category: "Ads",
    line: "9:16 in, 1:1 and 16:9 out. Reframed shot by shot, with text kept safe.",
    gets: ["A file per placement", "Crops that follow the subject", "A placement checklist"],
    prompt: "Use the BuzzVideo ad-resizer skill. Make 1:1 and 16:9 versions of my 9:16 ad. Ask me to upload the ad first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324750593371463680.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-06-25/328354813672742912.jpg",
    ratio: "9:16",
    minutes: 5,
    headline: "Every placement, without reshooting.",
    steps: ["Tracking the subject in every shot", "Reframing to each ratio", "Keeping text inside the safe zones"],
    variations: [
      { title: "Feed versions", prompt: "Use the BuzzVideo ad-resizer skill to make 1:1 and 4:5 versions of my 9:16 ad." },
      { title: "YouTube version", prompt: "Use the BuzzVideo ad-resizer skill to turn my vertical ad into a 16:9 YouTube version." },
    ],
  },
  {
    slug: "festival-campaign",
    name: "Festival Campaign",
    category: "Ads",
    line: "Christmas, CNY, 11.11: a key visual, every size and a short video.",
    gets: ["2-3 concepts researched for the festival", "Key visual with space for your copy", "Story, feed, square and banner sizes"],
    prompt: "Use the BuzzVideo festival-campaign skill. Make a Christmas campaign for my brand: key visual, all sizes and a short video. Ask me about my product first.",
    media: "video",
    video: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-10-27/b860a516-2896-4d8f-a970-d6e1b6fb1207.mp4",
    ratio: "wide",
    minutes: 12,
    headline: "Own the season, without the agency timeline.",
    steps: ["Researching this year’s festival and trends", "Proposing concepts and the key visual", "Producing every size and a short video"],
    variations: [
      { title: "Christmas", prompt: "Use the BuzzVideo festival-campaign skill to make a Christmas campaign for my brand." },
      { title: "Chinese New Year", prompt: "Use the BuzzVideo festival-campaign skill to make a Chinese New Year campaign pack." },
      { title: "11.11 sale", prompt: "Use the BuzzVideo festival-campaign skill to make 11.11 sale creatives." },
    ],
  },
  {
    slug: "product-ad",
    name: "Product Ad",
    category: "Ads",
    line: "One product photo becomes a multi-scene video ad.",
    gets: ["3-5 scene images with your product", "A 15-second ad with voiceover or text cards", "9:16 and 16:9 versions"],
    prompt: "Use the BuzzVideo product-ad skill. Turn my product photo into a 15-second Reels ad. Ask me to upload the product photo first.",
    media: "video",
    video: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-09-21/875e3ee2-2873-45d8-a38f-0c85ba4dc132.mp4",
    poster: "/prototypes/mcp-skill-showcase/aurelia-ecom.jpg",
    ratio: "9:16",
    minutes: 10,
    headline: "One product photo. A full video ad.",
    steps: ["Making a clean, high-res product master", "Building scenes around your product", "Animating and cutting the ad"],
    variations: [
      { title: "15-second Reel", prompt: "Use the BuzzVideo product-ad skill to turn my product photo into a 15-second Reel." },
      { title: "Text-card fast cut", prompt: "Use the BuzzVideo product-ad skill to make a fast text-card ad from my product photo." },
    ],
  },
  {
    slug: "ugc-product-review",
    name: "UGC Review",
    category: "UGC",
    line: "A creator holds your product and tells people why it works.",
    gets: ["An approved short script", "The same face in every clip", "A captioned talking-head edit"],
    prompt: "Use the BuzzVideo ugc-product-review skill. Make a 15-second UGC review where a creator talks about my product. Ask me to upload the product photo first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-07-31/341423296862019584.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-07-31/341423363324960768.jpg",
    ratio: "9:16",
    featured: true,
    minutes: 10,
    headline: "A creator review, without the creator.",
    steps: ["Writing a short, natural script", "Keeping the same face in every clip", "Cutting a captioned talking-head ad"],
    variations: [
      { title: "Testimonial", prompt: "Use the BuzzVideo ugc-product-review skill to make a testimonial ad for my product." },
      { title: "Problem-solution", prompt: "Use the BuzzVideo ugc-product-review skill to make a problem-solution UGC ad." },
    ],
  },
  {
    slug: "unboxing-ugc",
    name: "Unboxing",
    category: "UGC",
    line: "Ribbon, lid, tissue, reveal. A satisfying unboxing in seconds.",
    gets: ["Shots that stay consistent box to box", "A slow-motion reveal", "ASMR or music edit"],
    prompt: "Use the BuzzVideo unboxing-ugc skill. Make a 12-second unboxing of my product in a gift box, hands only. Ask me to upload the product photo first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340793513685868544.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340794197307088896.jpg",
    ratio: "9:16",
    minutes: 8,
    headline: "The reveal people watch twice.",
    steps: ["Designing the box and inserts", "Generating each shot to continue the last", "Cutting on the satisfying sounds"],
    variations: [
      { title: "Gift box", prompt: "Use the BuzzVideo unboxing-ugc skill to make a gift-box unboxing of my product." },
      { title: "PR package", prompt: "Use the BuzzVideo unboxing-ugc skill to make a PR-package unboxing video." },
    ],
  },
  {
    slug: "try-on-ugc",
    name: "Try-on",
    category: "UGC",
    line: "Put your garment on a model: turn, walk, detail close-up.",
    gets: ["A model that keeps the same face", "Pattern, buttons and colour kept exact", "A fit-check style edit"],
    prompt: "Use the BuzzVideo try-on-ugc skill. Show my garment on a model, try-on style. Ask me to upload the garment photos first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340804197911945216.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340805824760832000.jpg",
    ratio: "9:16",
    minutes: 8,
    headline: "Your garment, worn, in every shot.",
    steps: ["Casting a model for your customer", "Keeping pattern, buttons and colour exact", "Cutting a fit-check edit"],
    variations: [
      { title: "Fit check", prompt: "Use the BuzzVideo try-on-ugc skill to make a fit-check video of my dress." },
      { title: "Accessory", prompt: "Use the BuzzVideo try-on-ugc skill to show my bag on a model." },
    ],
  },
  {
    slug: "talking-product",
    name: "Talking Product",
    category: "UGC",
    line: "Give your product a face and a voice, and let it sell itself.",
    gets: ["A character sheet with the label kept readable", "Lines timed to your length", "A playful 10-30 second clip"],
    prompt: "Use the BuzzVideo talking-product skill. Make my sports drink bottle talk about why it's great, 8 seconds. Ask me to upload the product photo first.",
    media: "video",
    video: "/prototypes/mcp-skill-showcase/talking-oasys.mp4",
    poster: "/prototypes/mcp-skill-showcase/talking-oasys.jpg",
    ratio: "9:16",
    featured: true,
    minutes: 8,
    headline: "Let your product do the talking.",
    steps: ["Designing a face that keeps the label readable", "Writing lines to your exact length", "Animating the character and checking the speech"],
    variations: [
      { title: "Mascot intro", prompt: "Use the BuzzVideo talking-product skill to make my product introduce itself." },
      { title: "Comparison skit", prompt: "Use the BuzzVideo talking-product skill to make my product explain why it beats the old way." },
    ],
  },
  {
    slug: "product-photos",
    name: "Product Photos",
    category: "E-commerce",
    line: "A phone snap becomes a studio set: white background plus lifestyle scenes.",
    gets: ["A pure-white main image", "Lifestyle, detail and in-hand shots in one light", "Every ratio your channels need"],
    prompt: "Use the BuzzVideo product-photos skill. Make my product look professional: a white-background main image plus lifestyle shots. Ask me to upload the product photo first.",
    media: "image",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-07-29/340769233996668928.png",
    ratio: "1:1",
    minutes: 5,
    headline: "A studio shoot from one phone photo.",
    steps: ["Building a clean master of your product", "Shooting lifestyle and detail scenes", "Checking label text and pure-white backgrounds"],
    variations: [
      { title: "White background", prompt: "Use the BuzzVideo product-photos skill to make a pure-white main image of my product." },
      { title: "Lifestyle set", prompt: "Use the BuzzVideo product-photos skill to make three lifestyle photos of my product." },
    ],
  },
  {
    slug: "marketplace-listing",
    name: "Marketplace Listing",
    category: "E-commerce",
    line: "Shopee, Amazon or Taobao detail images with text set precisely.",
    gets: ["Main image to platform rules", "Selling-point and spec images", "Text overlaid exactly, with no AI typos"],
    prompt: "Use the BuzzVideo marketplace-listing skill. Make Shopee listing images for my product: main image plus selling-point images. Ask me to upload the product photo first.",
    media: "image",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324756900195393536.png",
    ratio: "wide",
    minutes: 6,
    headline: "Listing images that sell, and spell right.",
    steps: ["Reading the platform rules", "Generating clean backgrounds with copy space", "Setting every word as exact text"],
    variations: [
      { title: "Shopee", prompt: "Use the BuzzVideo marketplace-listing skill to make Shopee listing images for my product." },
      { title: "Amazon A+", prompt: "Use the BuzzVideo marketplace-listing skill to make Amazon A+ modules for my product." },
    ],
  },
  {
    slug: "long-to-shorts",
    name: "Long to Shorts",
    category: "Video tools",
    line: "A livestream or webinar becomes a stack of vertical clips.",
    gets: ["The strongest moments, scored", "9:16 reframes that follow the speaker", "Word-by-word captions"],
    prompt: "Use the BuzzVideo long-to-shorts skill. Turn my long video into vertical shorts with captions. Ask me to upload the video first.",
    media: "video",
    video: "https://assets.presslogic.com/aigc/tasks/videos/5aa41036-7a0b-479b-aa81-687043ee33df/2026-10-20/fde5f6c8-3855-4f9d-b7cb-d598ead6c8c1.mp4",
    ratio: "wide",
    minutes: 10,
    headline: "One livestream. A month of shorts.",
    steps: ["Transcribing and scoring every moment", "Reframing to vertical around the speaker", "Adding captions and a hook title"],
    variations: [
      { title: "Podcast clips", prompt: "Use the BuzzVideo long-to-shorts skill to cut my podcast into five vertical clips." },
      { title: "Webinar highlights", prompt: "Use the BuzzVideo long-to-shorts skill to pull the best moments from my webinar." },
    ],
  },
  {
    slug: "video-understand",
    name: "Video Breakdown",
    category: "Video tools",
    line: "Why does this ad work? A shot-by-shot breakdown and a style card.",
    gets: ["Every cut, shot size and camera move", "Hook, pacing and caption style", "A style card other skills can reuse"],
    prompt: "Use the BuzzVideo video-understand skill. Break down this ad. How is it cut and why does it work? Ask me to upload the video first.",
    media: "image",
    ratio: "wide",
    minutes: 4,
    headline: "Know exactly why an ad works.",
    steps: ["Detecting every cut and shot", "Reading captions, voiceover and music", "Writing the style card"],
    variations: [
      { title: "Ad breakdown", prompt: "Use the BuzzVideo video-understand skill to break down this ad shot by shot." },
      { title: "Style card", prompt: "Use the BuzzVideo video-understand skill to write a style card from this reel so I can reuse it." },
    ],
  },
  {
    slug: "transparent-video",
    name: "Transparent Video",
    category: "Video tools",
    line: "Sparkles, smoke, cut-out products, all with a real alpha channel.",
    gets: ["ProRes 4444, WebM and PNG sequence", "Versions for light and dark backgrounds", "Clean edges, checked at full size"],
    prompt: "Use the BuzzVideo transparent-video skill. Make a transparent sparkle burst I can overlay on product shots.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-06-15/324791914417152000.mp4",
    poster: "https://assets.presslogic.com/buzzvideo/public/2026-06-25/328377095942103040.jpg",
    ratio: "wide",
    minutes: 6,
    headline: "Overlays that drop onto anything.",
    steps: ["Generating on a clean key background", "Pulling a smooth alpha matte", "Exporting for every editor"],
    variations: [
      { title: "Sparkle burst", prompt: "Use the BuzzVideo transparent-video skill to make a transparent sparkle burst." },
      { title: "Floating product", prompt: "Use the BuzzVideo transparent-video skill to make my product spin on a transparent background." },
    ],
  },
  {
    slug: "product-promo-video",
    name: "Product Launch Video",
    category: "Video tools",
    line: "Launch a feature with real screen recordings, title cards and voiceover.",
    gets: ["An approved feature list and script", "Clean, zoomed UI shots", "Captions and a finished launch cut"],
    prompt: "Use the BuzzVideo product-promo-video skill. Make a 20-second launch video for my app's new feature. Ask me about the feature and for screen recordings first.",
    media: "video",
    ratio: "wide",
    minutes: 12,
    headline: "Launch it like it matters.",
    steps: ["Confirming the features worth showing", "Cutting clean, zoomed UI shots", "Adding title cards and voiceover"],
    variations: [
      { title: "Feature launch", prompt: "Use the BuzzVideo product-promo-video skill to make a launch video for my new feature." },
      { title: "App Store preview", prompt: "Use the BuzzVideo product-promo-video skill to make an App Store preview video." },
    ],
  },
  {
    slug: "short-drama",
    name: "Short Drama",
    category: "Stories",
    line: "Episodic micro-dramas with characters that look the same every time.",
    gets: ["A series outline and scripts", "A cast sheet and storyboards", "Edited episodes with cliffhangers"],
    prompt: "Use the BuzzVideo short-drama skill. Write a 2-episode fruit micro-drama and make a 20-second episode 1.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-08-04/342956159646359552.mp4",
    poster: "/prototypes/mcp-skill-showcase/short-drama-cover.jpg",
    ratio: "wide",
    featured: false,
    minutes: 15,
    headline: "A series your audience waits for.",
    steps: ["Writing the outline and episode scripts", "Locking every character with a cast sheet", "Shooting and cutting each episode"],
    variations: [
      { title: "Fruit drama", prompt: "Use the BuzzVideo short-drama skill to make a fruit micro-drama." },
      { title: "Branded series", prompt: "Use the BuzzVideo short-drama skill to write a 3-episode series around my product." },
    ],
  },
  {
    slug: "faceless-explainer",
    name: "Faceless Explainer",
    category: "Stories",
    line: "Narrated explainers in one illustrated style, with no one on camera.",
    gets: ["A researched script", "Scenes in stickman, pastel, hand-drawn and more", "Voiceover and captions"],
    prompt: "Use the BuzzVideo faceless-explainer skill. Make a 20-second faceless explainer on why people stay broke after a raise, hand-drawn stickman style.",
    media: "video",
    video: "/prototypes/mcp-skill-showcase/faceless-money.mp4",
    poster: "/prototypes/mcp-skill-showcase/faceless-money.jpg",
    ratio: "9:16",
    featured: true,
    minutes: 10,
    headline: "Explain anything. No one on camera.",
    steps: ["Researching and writing the script", "Illustrating every scene in one style", "Adding voiceover and captions"],
    variations: [
      { title: "Stickman", prompt: "Use the BuzzVideo faceless-explainer skill to make a stickman explainer about my topic." },
      { title: "Editorial mixed media", prompt: "Use the BuzzVideo faceless-explainer skill to make an editorial mixed-media explainer." },
    ],
  },
  {
    slug: "3d-product-video",
    name: "3D Product Video",
    category: "3D",
    line: "A 360° turntable and light-sweep hero shots of your product.",
    gets: ["A full turn that lands on the front", "Material and label checked at every angle", "A 10-20 second showcase cut"],
    prompt: "Use the BuzzVideo 3d-product-video skill. Make a 360° turntable showcase of my product. Ask me to upload product photos (front and back) first.",
    media: "video",
    video: "https://assets.presslogic.com/buzzvideo/public/2026-10-20/370857853772161024.mp4",
    ratio: "wide",
    minutes: 10,
    headline: "The Apple-style spin, for your product.",
    steps: ["Building a 3D scene of your product", "Rendering the turntable and light sweep", "Generating photoreal shots from the render"],
    variations: [
      { title: "360° turntable", prompt: "Use the BuzzVideo 3d-product-video skill to make a 360° turntable of my product." },
      { title: "Exploded view", prompt: "Use the BuzzVideo 3d-product-video skill to make an exploded view of my product." },
    ],
  },
  {
    slug: "3d-director",
    name: "3D Director",
    category: "3D",
    line: "Block the scene in 3D, set every camera move. Then render it photoreal.",
    gets: ["A grey-box previs per shot", "Photoreal shots that follow the framing", "An edited scene"],
    prompt: "Use the BuzzVideo 3d-director skill. Choreograph a 4-member K-pop girl group on a neon stage: block the dance in 3D first, then render the same moves photoreal.",
    media: "video",
    video: "/prototypes/mcp-skill-showcase/3d-studio-dance.mp4",
    poster: "/prototypes/mcp-skill-showcase/3d-studio-dance.jpg",
    ratio: "9:16",
    featured: true,
    minutes: 15,
    headline: "Direct every shot like you’re on set.",
    steps: ["Blocking the scene in 3D", "Setting camera height, lens and move per shot", "Rendering photoreal shots that follow the plan"],
    variations: [
      { title: "Dolly-in hero", prompt: "Use the BuzzVideo 3d-director skill to direct a slow dolly-in on my product." },
      { title: "Story scene", prompt: "Use the BuzzVideo 3d-director skill to direct a 3-shot story with my mascot." },
    ],
  },
  {
    slug: "photo-to-3d",
    name: "Photo to 3D Figure",
    category: "3D",
    line: "Turn a photo or mascot into a collectible figure, box included.",
    gets: ["Front, side and back views", "A collector box shot", "A turntable video"],
    prompt: "Use the BuzzVideo photo-to-3d skill. Turn my mascot into a collectible figurine with a box. Ask me to upload the image first.",
    media: "video",
    ratio: "9:16",
    minutes: 8,
    headline: "From a photo to a collectible.",
    steps: ["Turning your image into a stylised figure", "Making front, side and back views", "Rendering the box shot and turntable"],
    variations: [
      { title: "Mascot figurine", prompt: "Use the BuzzVideo photo-to-3d skill to turn my mascot into a figurine with a box." },
      { title: "Pet figure", prompt: "Use the BuzzVideo photo-to-3d skill to turn my pet photo into a toy figure." },
    ],
  },
  {
    slug: "competitor-ad-research",
    name: "Competitor Ad Research",
    category: "Research",
    line: "What are competitors running right now? A report with ads worth remaking.",
    gets: ["Live ads from the Meta and TikTok libraries", "Angles, hooks, offers and CTAs", "Gaps for your brand and a remake shortlist"],
    prompt: "Use the BuzzVideo competitor-ad-research skill. What ads are brands in my category running right now? Ask me about my category and market first.",
    media: "none",
    ratio: "wide",
    minutes: 10,
    headline: "See what competitors are running today.",
    steps: ["Searching the Meta and TikTok ad libraries", "Breaking down angles, hooks and offers", "Shortlisting ads worth remaking"],
    variations: [
      { title: "Category scan", prompt: "Use the BuzzVideo competitor-ad-research skill to show me what ads my category is running." },
      { title: "Named competitors", prompt: "Use the BuzzVideo competitor-ad-research skill to compare my three main competitors’ ads." },
    ],
  },
];

const CHATGPT_FOOTER = `\n\nIf the BuzzVideo plugin is not installed, ask me to [install the BuzzVideo plugin](${CHATGPT_PLUGIN_URL}) before continuing.`;
const CLAUDE_FOOTER = `\n\nIf BuzzVideo is not connected, ask me to [connect BuzzVideo](${CLAUDE_CONNECT_URL}) using ${MCP_URL} before continuing.`;

/** ChatGPT:chatgpt.com/?q= 会把内容填进输入框;开头 @BuzzVideo 指定插件 */
export const chatgptUrl = (s: Skill) => `https://chatgpt.com/?q=${encodeURIComponent(`@BuzzVideo\n\n${s.prompt}${CHATGPT_FOOTER}`)}`;
/** Claude:claude.ai/new?q= 会把内容填进输入框 */
export const claudeUrl = (s: Skill) => `https://claude.ai/new?q=${encodeURIComponent(`${s.prompt}${CLAUDE_FOOTER}`)}`;

/** 用任意一句提示词生成试用链接(详情页的变体玩法用) */
export const chatgptUrlFor = (prompt: string) => `https://chatgpt.com/?q=${encodeURIComponent(`@BuzzVideo\n\n${prompt}${CHATGPT_FOOTER}`)}`;
export const claudeUrlFor = (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(`${prompt}${CLAUDE_FOOTER}`)}`;

/** 产品 CDN 的图片走 Cloudflare 缩放，卡片用不到 4K 原图 */
const resized = (url: string, width: number) =>
  url.replace("https://assets.presslogic.com/", `https://assets.presslogic.com/cdn-cgi/image/width=${width},quality=80,format=auto/`);
export const mediaSrc = (s: Skill, kind: "mp4" | "jpg") =>
  kind === "mp4"
    ? (s.video ?? `/prototypes/mcp-skill-showcase/${s.slug}.mp4`)
    : s.poster
      ? resized(s.poster, 1280)
      : `/prototypes/mcp-skill-showcase/${s.slug}.jpg`;
