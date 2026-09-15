/* Blog 原型的内容模型 + 种子数据。
   正文是 block 数组 -- 前台一个 renderBlock 分发渲染,后台一个编辑器逐块编辑,
   所以上新一篇 blog 只是配置,不需要为它写页面。 */

export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "quote"
  | "list"
  | "code"
  | "callout"
  | "cta"
  | "video"
  | "table"
  | "references"
  | "divider";

export type Block =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "image"; caption: string; src?: string }
  | { id: string; type: "quote"; text: string; cite: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "code"; language: string; code: string }
  | { id: string; type: "callout"; tone: "info" | "tip" | "warn"; title: string; text: string }
  | { id: string; type: "cta"; title: string; text: string; label: string; href: string }
  | { id: string; type: "video"; src: string; caption: string }
  | { id: string; type: "table"; head: string[]; rows: string[][] }
  | { id: string; type: "references"; items: { label: string; href: string }[] }
  | { id: string; type: "divider" };

/* 定时发布(scheduled)本期不上线,状态只有三档 */
export type PostStatus = "draft" | "published" | "archived";

export type Author = { name: string; role: string; initials: string };

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: Author;
  status: PostStatus;
  publishedAt: string;
  /** 封面图。列表卡片、文章头图、社交分享卡共用这一张(16:9,1600x900)。 */
  cover?: string;
  updatedAt: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonical: string;
  };
  blocks: Block[];
};

/* 分类是后台可管的数据,不是写死的常量:可增删、可改名、可排序。
   没有 slug —— 分类不构成独立 URL,前台只拿它做筛选,给个 slug 只会变成没人维护的死字段。
   文章上存的是分类名而不是 id —— 改名时 store 会把引用一起改掉。 */
export type Category = { id: string; name: string };

export const SEED_CATEGORIES: Category[] = [
  { id: "c1", name: "Product" },
  { id: "c2", name: "Tutorials" },
  { id: "c3", name: "Case Studies" },
  { id: "c4", name: "Company" },
  { id: "c5", name: "Changelog" },
];

export function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const AUTHORS: Author[] = [
  { name: "Monica Zhou", role: "Product Manager", initials: "MZ" },
  { name: "Ethan Lau", role: "Head of Growth", initials: "EL" },
  { name: "Priya Nair", role: "Creative Lead", initials: "PN" },
  { name: "Daniel Reyes", role: "Solutions Engineer", initials: "DR" },
];

/** 分发式 Omit -- 直接 Omit<Block,"id"> 会把联合塌成交集,属性全丢 */
type BlockDraft = Block extends infer T ? (T extends Block ? Omit<T, "id"> : never) : never;

let seq = 0;
const b = (block: BlockDraft): Block => ({ ...block, id: `b${++seq}` }) as Block;

export const SEED_POSTS: Post[] = [
  {
    id: "p1",
    slug: "seedance-2-5-launch",
    title: "Seedance 2.5 is here: 30-second native video at 4K",
    excerpt:
      "Our newest video model holds a single character, product and camera language across a full 30 seconds, with no stitching and no drift.",
    category: "Product",
    tags: ["Seedance", "Video", "Launch"],
    author: AUTHORS[0],
    status: "published",
    publishedAt: "2026-09-10",
    updatedAt: "2026-09-11",
    seo: {
      metaTitle: "Seedance 2.5. 30-second native 4K video generation",
      metaDescription:
        "Seedance 2.5 generates 30 seconds of native 4K video with consistent characters, products and camera motion.",
      canonical: "https://buzzvideo.ai/blog/seedance-2-5-launch",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "Until now, a 30-second ad meant generating six clips and praying they matched. **Seedance 2.5 generates the whole thing in one pass**: one character, one product, one camera language, start to finish.",
      }),
      b({ type: "heading", level: 2, text: "What changed" }),
      b({
        type: "paragraph",
        text: "The model now carries an explicit reference track through the entire generation instead of re-deriving identity every few seconds. That single change is what removes the drift you used to see around the 8-second mark.",
      }),
      b({
        type: "list",
        ordered: false,
        items: [
          "30 seconds of native output, no clip stitching",
          "4K on the Pro tier, 1080p everywhere else",
          "Reference locking for faces, products and brand colour",
          "Camera moves described in plain language",
        ],
      }),
      b({
        type: "callout",
        tone: "tip",
        title: "Pin your reference first",
        text: "Upload the product shot before writing the prompt. The model weights a locked reference far more heavily than an adjective.",
      }),
      b({ type: "heading", level: 2, text: "How teams are using it" }),
      b({
        type: "quote",
        text: "We cut a 30-second spot in an afternoon that used to take us two weeks and a shoot day.",
        cite: "Creative director, DTC skincare brand",
      }),
      b({
        type: "paragraph",
        text: "The pattern we keep seeing: one reference image, three prompt variants, pick the best take. Because the full 30 seconds renders at once, comparing takes is finally an honest comparison.",
      }),
      b({
        type: "cta",
        title: "Try Seedance 2.5",
        text: "Every plan includes trial credits. Bring a product shot and a one-line brief.",
        label: "Start generating",
        href: "/prototypes/homepage",
      }),
    ],
  },
  {
    id: "p2",
    slug: "product-shot-to-ugc-ad",
    title: "From a single product shot to a UGC ad in 9 minutes",
    excerpt:
      "A step-by-step walkthrough: reference locking, beat planning, and the three prompt tweaks that do most of the work.",
    category: "Tutorials",
    tags: ["UGC", "Workflow", "Tutorial"],
    author: AUTHORS[2],
    status: "published",
    publishedAt: "2026-09-04",
    updatedAt: "2026-09-05",
    seo: {
      metaTitle: "Turn a product photo into a UGC ad, step by step",
      metaDescription:
        "A nine-minute workflow for turning one product photo into a finished UGC-style video ad.",
      canonical: "https://buzzvideo.ai/blog/product-shot-to-ugc-ad",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "You need one thing to start: a clean product photo on a plain background. Everything below takes about nine minutes.",
      }),
      b({ type: "heading", level: 2, text: "1. Lock the reference" }),
      b({
        type: "paragraph",
        text: "Drop the photo into the composer and turn on reference locking. This is the step people skip, and it is the step that decides whether your bottle stays the same bottle in shot four.",
      }),
      b({ type: "heading", level: 2, text: "2. Write beats, not a screenplay" }),
      b({
        type: "list",
        ordered: true,
        items: [
          "Hook: hand picks up the product, close",
          "Problem: quick cut to the messy alternative",
          "Payoff: product in use, natural light",
          "Close: logo and one line of copy",
        ],
      }),
      b({
        type: "callout",
        tone: "info",
        title: "Four beats is the sweet spot",
        text: "Fewer reads as an empty loop; more and each beat gets too short to register.",
      }),
      b({ type: "heading", level: 2, text: "3. The three tweaks" }),
      b({
        type: "paragraph",
        text: "Almost every improvement comes from one of these: naming the lens, naming the light, and naming what the hands do. Adjectives about mood do very little by comparison.",
      }),
      b({
        type: "code",
        language: "text",
        code: "35mm handheld, soft window light from camera left,\nhands open the jar and scoop, no cuts, 5s",
      }),
      b({
        type: "paragraph",
        text: "Render, pick your take, export. If the first four takes are all wrong in the same way, the problem is the reference, not the prompt.",
      }),
    ],
  },
  {
    id: "p3",
    slug: "kaiyan-beauty-case-study",
    title: "How a 12-person beauty brand shipped 240 ads in one quarter",
    excerpt:
      "Their old ceiling was eight ads a month. We looked at what actually changed, and it was not the model.",
    category: "Case Studies",
    tags: ["Case study", "Performance", "Beauty"],
    author: AUTHORS[1],
    status: "published",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-28",
    seo: {
      metaTitle: "Case study: 240 ads in a quarter with a 12-person team",
      metaDescription:
        "How a small beauty brand went from eight ads a month to 240 in a quarter.",
      canonical: "https://buzzvideo.ai/blog/kaiyan-beauty-case-study",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "Eight ads a month was not a creative limit. It was a scheduling limit: every ad needed a shoot day, and shoot days needed a studio, a model and four calendars to agree.",
      }),
      b({ type: "heading", level: 2, text: "The bottleneck was calendars" }),
      b({
        type: "paragraph",
        text: "Once the team could generate from existing product photography, the constraint moved to review. That is a much cheaper constraint to fix.",
      }),
      b({
        type: "quote",
        text: "We stopped asking whether an idea was worth a shoot day. That question was killing most of our ideas before anyone saw them.",
        cite: "Head of brand",
      }),
      b({ type: "heading", level: 2, text: "What the numbers looked like" }),
      b({
        type: "list",
        ordered: false,
        items: [
          "240 finished ads in Q3, up from 24 in Q2",
          "Cost per finished ad down 71%",
          "Median time from brief to first cut: 40 minutes",
          "Hit rate on paid tests roughly unchanged, volume did the work",
        ],
      }),
      b({
        type: "callout",
        tone: "warn",
        title: "Volume without review is noise",
        text: "The team added a weekly 30-minute cull. Without it, the ad account filled with variants nobody had actually chosen.",
      }),
    ],
  },
  {
    id: "p4",
    slug: "credits-explained",
    title: "Credits, explained: what you are actually paying for",
    excerpt:
      "A plain-language breakdown of how credits are priced, why video costs more than image, and how to read your usage page.",
    category: "Product",
    tags: ["Billing", "Credits"],
    author: AUTHORS[3],
    status: "published",
    publishedAt: "2026-08-19",
    updatedAt: "2026-08-20",
    seo: {
      metaTitle: "How BuzzVideo credits work",
      metaDescription:
        "What a credit buys, why video costs more than image, and how to read your usage page.",
      canonical: "https://buzzvideo.ai/blog/credits-explained",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "A credit is a unit of compute, not a unit of output. That single sentence explains most of the questions we get.",
      }),
      b({ type: "heading", level: 2, text: "Why video costs more" }),
      b({
        type: "paragraph",
        text: "A 5-second clip is not one image. It is a sequence the model has to keep coherent. Longer duration, higher resolution and reference locking all add compute, and all three show up in the price.",
      }),
      b({
        type: "list",
        ordered: false,
        items: [
          "Image generation, lowest cost per run",
          "Video at 5s and 1080p, mid",
          "Video at 30s and 4K with references, highest",
          "Failed runs still consume credits when compute was spent",
        ],
      }),
      b({
        type: "callout",
        tone: "info",
        title: "Failed runs are billed",
        text: "If the model ran and produced nothing usable, the compute still happened. They show amber in your usage chart so they are easy to spot.",
      }),
      b({
        type: "cta",
        title: "See your usage",
        text: "Every run, its cost and its output are itemised on the usage page.",
        label: "Open usage",
        href: "/prototypes/org-members",
      }),
    ],
  },
  {
    id: "p5",
    slug: "team-workspaces",
    title: "Team workspaces: shared credits, real roles",
    excerpt:
      "Credits now live in a team pool instead of individual wallets, with roles that decide who can spend and who can only watch.",
    category: "Changelog",
    tags: ["Teams", "Permissions"],
    author: AUTHORS[0],
    status: "draft",
    publishedAt: "",
    updatedAt: "2026-09-12",
    seo: {
      metaTitle: "Team workspaces with shared credits and roles",
      metaDescription:
        "Shared credit pools, seat management and a three-tier role model for teams.",
      canonical: "https://buzzvideo.ai/blog/team-workspaces",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "Individual wallets meant one person ran out mid-campaign while another sat on an untouched balance. Team workspaces replace that with a **shared pool**.",
      }),
      b({ type: "heading", level: 2, text: "Three roles" }),
      b({
        type: "list",
        ordered: false,
        items: [
          "Owner: billing, seats and every setting",
          "Admin: invites, budgets and generation",
          "Member: generation within an allocated budget",
        ],
      }),
      b({
        type: "paragraph",
        text: "Budgets are set per member and can be raised at any time. When someone hits their cap, they can request more without leaving the editor.",
      }),
    ],
  },
  {
    id: "p6",
    slug: "prompt-library-draft",
    title: "The prompt patterns that survived a thousand renders",
    excerpt:
      "Draft: a working library of prompt structures our team keeps coming back to, grouped by what they are for.",
    category: "Tutorials",
    tags: ["Prompting", "Draft"],
    author: AUTHORS[2],
    status: "draft",
    publishedAt: "",
    updatedAt: "2026-09-13",
    seo: {
      metaTitle: "",
      metaDescription: "",
      canonical: "",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "Still drafting. The spine is: camera, light, action, duration, in that order, every time.",
      }),
      b({ type: "heading", level: 2, text: "Camera first" }),
      b({
        type: "paragraph",
        text: "Naming a focal length does more than any mood adjective. Write 35mm handheld before you write cinematic.",
      }),
    ],
  },
  {
    id: "p7",
    slug: "why-we-rebuilt-the-canvas",
    title: "Why we rebuilt the canvas around nodes",
    excerpt:
      "The old timeline assumed you knew the shape of the edit before you started. Almost nobody does.",
    category: "Company",
    tags: ["Design", "Canvas"],
    author: AUTHORS[0],
    status: "archived",
    publishedAt: "2026-06-02",
    updatedAt: "2026-07-15",
    seo: {
      metaTitle: "Why we rebuilt the canvas around nodes",
      metaDescription: "The design reasoning behind moving from a timeline to a node canvas.",
      canonical: "https://buzzvideo.ai/blog/why-we-rebuilt-the-canvas",
    },
    blocks: [
      b({
        type: "paragraph",
        text: "Superseded by the current canvas documentation. Kept for reference.",
      }),
    ],
  },
];


/* 额外的种子文章。列表页是无限滚动,只有几篇的话滚不动、演示不出来。
   正文都只给两三个 block —— 列表页用不到正文,详情页有内容可看即可。 */
const MORE: Array<[string, string, string, string, number, string]> = [
  ["hook-first-three-seconds", "The first three seconds are a separate project", "Tutorials", "EL", 12, "Most viewers decide before your logo appears. Treat the opening as its own brief."],
  ["aspect-ratio-guide", "Which aspect ratio for which placement", "Tutorials", "PN", 11, "9:16 for Reels and TikTok, 1:1 for feed, 16:9 for YouTube. What changes beyond the crop."],
  ["seedance-2-0-mini", "Seedance 2.0 Mini: cheaper takes for volume testing", "Changelog", "MZ", 10, "A smaller model for the part of the workflow where you throw away most of what you make."],
  ["brand-consistency", "Keeping a brand consistent across 200 generated ads", "Case Studies", "EL", 9, "Reference locking, a colour contract, and a weekly cull. The unglamorous parts."],
  ["prompt-length", "Longer prompts are not better prompts", "Tutorials", "PN", 8, "Past about forty words, extra adjectives start competing with each other."],
  ["failed-runs", "Why failed runs still cost credits", "Product", "DR", 7, "The compute happened. Here is how to spot the failures worth retrying."],
  ["agency-vs-inhouse", "When an agency is still the right call", "Company", "MZ", 6, "Generation changes the cost of trying things. It does not replace a creative director."],
  ["storyboard-mode", "Storyboard mode versus consecutive mode", "Product", "DR", 5, "One plans the whole film up front. The other grows it a beat at a time."],
  ["ugc-casting", "Casting a generated presenter that does not look generated", "Tutorials", "PN", 4, "Specific age, specific room, specific lens. Vagueness is what reads as synthetic."],
  ["credits-forecast", "Forecasting a quarter of credits before you commit", "Product", "DR", 3, "Work backwards from finished ads, not from prompts."],
  ["team-review-loop", "The thirty-minute weekly cull", "Case Studies", "EL", 2, "Volume without review is noise. One meeting is enough to fix that."],
  ["sound-design", "Sound is half the hook", "Tutorials", "PN", 1, "Most teams generate video and bolt audio on. The teams that win do the opposite."],
  ["model-picking", "How to pick a model without reading the benchmarks", "Product", "MZ", 20, "Duration first, then consistency, then price. The rest is noise for most briefs."],
  ["localisation", "Shipping one ad into six markets", "Case Studies", "EL", 19, "What actually needs to change per market, and what only feels like it does."],
  ["canvas-nodes", "Why the canvas is a graph, not a timeline", "Company", "MZ", 18, "You rarely know the shape of the edit before you start."],
  ["asset-library", "Getting your product shots ready for generation", "Tutorials", "PN", 17, "Clean background, even light, one hero angle. Twenty minutes of prep saves an afternoon."],
  ["pricing-change", "Credit pricing, updated", "Changelog", "DR", 16, "What moved, what did not, and why video is still priced by compute."],
  ["hiring-creative", "What we look for in a creative hire now", "Company", "MZ", 15, "Taste and judgment got more valuable, not less."],
];

const AUTHOR_BY = { MZ: AUTHORS[0], EL: AUTHORS[1], PN: AUTHORS[2], DR: AUTHORS[3] } as const;

for (const [slug, title, category, who, daysAgo, excerpt] of MORE) {
  const d = new Date(Date.UTC(2026, 8, 14) - daysAgo * 86400000).toISOString().slice(0, 10);
  SEED_POSTS.push({
    id: `m-${slug}`,
    slug,
    title,
    excerpt,
    category,
    tags: [category],
    author: AUTHOR_BY[who as keyof typeof AUTHOR_BY],
    status: "published",
    publishedAt: d,
    updatedAt: d,
    seo: { metaTitle: title, metaDescription: excerpt, canonical: `https://buzzvideo.ai/blog/${slug}` },
    blocks: [
      b({ type: "paragraph", text: excerpt }),
      b({ type: "heading", level: 2, text: "The short version" }),
      b({ type: "paragraph", text: "This article is seeded content for the prototype. The point of the list page is the loading behaviour and the card layout, not this copy." }),
    ],
  });
}

/* 顺序 = 编辑实际用到的频率,从高到低。
   左侧工具条、Add block 菜单、块间插入菜单都按这个顺序渲染,改这里三处一起变。
   正文几乎全是段落和小标题,配图次之;代码块和参考链接在营销类文章里极少出现,排最后。 */
export const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  list: "List",
  quote: "Quote",
  callout: "Callout",
  video: "Video embed",
  cta: "CTA card",
  divider: "Divider",
  table: "Table",
  references: "References",
  code: "Code",
};

export function newBlock(type: BlockType): Block {
  const id = `b${Date.now()}${Math.floor(Math.random() * 1000)}`;
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "Section heading" };
    case "image":
      return { id, type, caption: "Image caption" };
    case "quote":
      return { id, type, text: "A quote worth pulling out.", cite: "Source" };
    case "list":
      return { id, type, ordered: false, items: ["First item", "Second item"] };
    case "code":
      return { id, type, language: "text", code: "your prompt here" };
    case "callout":
      return { id, type, tone: "info", title: "Good to know", text: "Something worth flagging." };
    case "cta":
      return {
        id,
        type,
        title: "Try it yourself",
        text: "One line on why the reader should click.",
        label: "Get started",
        href: "/prototypes/homepage",
      };
    case "video":
      return { id, type, src: "", caption: "" };
    case "table":
      return {
        id,
        type,
        head: ["Column", "Column"],
        rows: [
          ["Value", "Value"],
          ["Value", "Value"],
        ],
      };
    case "references":
      return {
        id,
        type,
        items: [{ label: "Source title", href: "https://example.com" }],
      };
    case "divider":
      return { id, type };
    default:
      return { id, type: "paragraph", text: "Write your paragraph here." };
  }
}

/** 正文字数 → 阅读时长(200 wpm) */
export function readingMinutes(blocks: Block[]): number {
  const words = blocks.reduce((n, blk) => {
    if (blk.type === "paragraph" || blk.type === "heading" || blk.type === "quote")
      return n + blk.text.split(/\s+/).length;
    if (blk.type === "list") return n + blk.items.join(" ").split(/\s+/).length;
    if (blk.type === "callout") return n + blk.text.split(/\s+/).length;
    if (blk.type === "table")
      return n + [...blk.head, ...blk.rows.flat()].join(" ").split(/\s+/).length;
    return n;
  }, 0);
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** 前台可见:只有已发布的 */
export function isLive(post: Post): boolean {
  return post.status === "published";
}
