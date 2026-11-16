/* 第二版的示例内容。视频来自 @buzzvideo.global 的 Reels、产品里生成过的素材和历次宣传片素材 */
export const F = "/prototypes/buzzvideo-app-v2/feed";

export type Category = "Trending" | "Pets" | "Dance" | "Cinematic" | "Funny" | "Effects";
export const CATEGORIES: Category[] = ["Trending", "Pets", "Dance", "Cinematic", "Funny", "Effects"];

export type Creator = { id: string; name: string; handle: string; followers: number; following: number; likes: number; bio: string; tint: readonly [string, string] };
export const CREATORS: Creator[] = [
  { id: "mochi", name: "Mochi & Friends", handle: "mochi.pets", followers: 48200, following: 112, likes: 912000, bio: "Dogs in sunglasses. That's the whole account.", tint: ["#FFB36B", "#FF5E7E"] },
  { id: "neon", name: "NEON Crew", handle: "neoncrew", followers: 126000, following: 87, likes: 2400000, bio: "Dance covers, but everyone is AI.", tint: ["#7C6BFF", "#35C8FF"] },
  { id: "reel", name: "Reel Dreamer", handle: "reeldreamer", followers: 31800, following: 204, likes: 540000, bio: "Tiny films made on my lunch break.", tint: ["#34D399", "#3B82F6"] },
  { id: "oddhistory", name: "Odd History", handle: "oddhistory", followers: 77400, following: 61, likes: 1300000, bio: "What if history had Wi-Fi?", tint: ["#F59E0B", "#B45309"] },
  { id: "fruitdrama", name: "Fruit Drama", handle: "fruit.drama", followers: 203000, following: 15, likes: 5100000, bio: "The strawberry did nothing wrong.", tint: ["#FB7185", "#F97316"] },
  { id: "kai", name: "Kai Rivers", handle: "kairivers", followers: 9560, following: 430, likes: 88000, bio: "Skate, ride, repeat.", tint: ["#94A3B8", "#475569"] },
  { id: "luna", name: "Luna Park", handle: "lunapark", followers: 5501, following: 298, likes: 41000, bio: "Dreamcore and soft colours.", tint: ["#F0ABFC", "#A78BFA"] },
  { id: "buzz", name: "BuzzVideo", handle: "buzzvideo", followers: 890000, following: 12, likes: 9800000, bio: "Official. New effects every week.", tint: ["#FFA73C", "#FF5255"] },
];
export const creator = (id: string) => CREATORS.find((c) => c.id === id) ?? CREATORS[0];

export type Post = {
  id: string;
  author: string;
  caption: string;
  tags: string[];
  cat: Exclude<Category, "Trending">;
  likes: number;
  comments: number;
  remixes: number;
  /** 做同款时带过去的提示词 */
  prompt: string;
  /** 做同款时可替换的东西:角色名 + 参考图张数 */
  cast?: string;
  refs: number;
  /** 瀑布流里卡片的高宽比 */
  ratio: number;
  hot?: boolean;
};
const p = (id: string, author: string, cat: Post["cat"], caption: string, tags: string[], likes: number, comments: number, remixes: number, prompt: string, cast: string | undefined, refs: number, ratio = 16 / 9, hot = false): Post => ({ id, author, cat, caption, tags, likes, comments, remixes, prompt, cast, refs, ratio, hot });

export const POSTS: Post[] = [
  p("kings", "oddhistory", "Funny", "The royal court, but it's that diner dance scene", ["remake", "dance", "history"], 30710, 1264, 9028, "Two kings in full royal robes do a twist dance-off in a palace ballroom, crowd watching", "The King", 1, 1.6, true),
  p("poodle", "mochi", "Pets", "She said she's not doing interviews today", ["pets", "fashion"], 18400, 532, 4310, "A poodle in white sunglasses and a red polka-dot headscarf poses like a movie star, studio blue backdrop", "Your pet", 1, 1.45, true),
  p("fruit", "fruitdrama", "Funny", "Ep. 12: the picnic betrayal", ["fruitdrama", "series"], 51200, 3980, 15300, "A strawberry and a lemon with tiny arms and legs argue at a picnic, soap-opera style", "Strawberry", 2, 1.7, true),
  p("kpop", "neon", "Dance", "Comeback stage, zero rehearsals", ["kpop", "stage"], 26900, 1105, 7745, "Four-member girl group performs on a huge concert stage with blue lasers, low-angle camera", "Lead dancer", 1, 1.5, true),
  p("dreamcore", "luna", "Effects", "Tell me this isn't the most comforting thing on your feed", ["dreamcore", "retro"], 13430, 760, 1373, "Retro dreamcore suburb: a house floats like a balloon, clouds come out of the toaster", "The girl", 3, 1.75),
  p("cows", "buzz", "Dance", "The whole crew learned NEON in one prompt", ["dance", "mascot"], 9820, 412, 2222, "Three cartoon mascots do a synchronized dance on a clean white stage", "Mascot", 3, 1.4),
  p("safari", "reel", "Cinematic", "POV: you asked for a closer look", ["thriller", "wildlife"], 22100, 986, 3120, "A ranger sprints across the savanna at golden hour with a lion chasing close behind, handheld camera", "The ranger", 1, 1.65, true),
  p("museum", "oddhistory", "Effects", "The museum walls couldn't hold them anymore", ["art", "comesalive"], 31100, 1420, 6110, "Famous portraits step out of their frames and walk down a rainy Paris street", "The portrait", 2, 1.6),
  p("dogcam", "mochi", "Pets", "Someone left the gummies unattended. The security cam saw everything.", ["pets", "caughtoncam"], 27300, 2040, 2730, "Fisheye security-camera footage: a golden retriever sneaks up to a bowl of gummies on a table", "Your pet", 1, 1.55),
  p("mecha", "reel", "Cinematic", "Day 1 of building my own blockbuster", ["scifi", "mecha"], 15800, 644, 1980, "A white mecha with orange lights stands on a rooftop above a grey city, slow push-in", undefined, 1, 1.7),
  p("napoleon", "oddhistory", "Funny", "He conquered Europe. He could not resist the chips.", ["history", "snacks"], 44100, 2876, 8140, "An oil-painting general stares wide-eyed at a bag of chips in front of him", "The general", 2, 1.5),
  p("alice", "luna", "Cinematic", "What if you fell down the rabbit hole at work?", ["fantasy", "story"], 14800, 590, 1480, "An office worker falls through a stack of paperwork into a wonderland court", "Alice", 2, 1.75),
  p("orbs", "neon", "Dance", "Top-down choreo check", ["dance", "topdown"], 8700, 233, 1190, "Overhead shot of dancers moving between glowing teal circles", "Dancer", 1, 1.4),
  p("skate", "kai", "Cinematic", "Landed it on the first prompt", ["skate", "goldenhour"], 6200, 184, 742, "Skater kickflips down a stair set at golden hour, low angle, slow motion", "The skater", 1, 1.6),
  p("collie", "mochi", "Pets", "Hello from inside the flower", ["pets", "cute"], 19900, 811, 3560, "A border collie pokes its nose through giant pink petals toward the camera", "Your pet", 1, 1.5),
  p("gummy", "buzz", "Effects", "Hyper motion, but make it candy", ["hypermotion", "food"], 11200, 365, 2550, "The camera rushes through a world made of gummy bears and fruit", undefined, 1, 1.65),
  p("gatsby", "reel", "Cinematic", "The party ended. The feeling stayed.", ["1920s", "romance"], 9400, 301, 934, "A roaring-twenties ballroom, a woman in a beaded dress turns toward the camera", "The guest", 2, 1.7),
  p("hotel", "luna", "Funny", "Symmetry makes everything funnier", ["pastel", "hotel"], 12600, 478, 1620, "Pastel grand hotel lobby, perfectly centred, the staff react in sync", "The concierge", 2, 1.45),
  p("terracotta", "oddhistory", "Funny", "What if the Qin Dynasty had modern tech?", ["history", "whatif"], 19800, 1322, 1980, "A terracotta warrior drives a forklift through the excavation pit", "The warrior", 1, 1.55),
  p("catfan", "mochi", "Pets", "Monday energy", ["pets", "mood"], 23400, 1198, 2010, "An orange-and-white cat lies in front of a fan, fur blowing gently", "Your pet", 1, 1.4),
  p("racer", "kai", "Cinematic", "Sunday ride, no destination", ["ride", "coast"], 5400, 122, 460, "A rider on a cafe racer leans through a coastal bend at golden hour", "The rider", 1, 1.6),
  p("cityjump", "reel", "Cinematic", "He does his own stunts (he doesn't exist)", ["action", "rooftop"], 17300, 702, 2890, "A figure in a black coat leaps between rooftops above a rainy city", "The runner", 1, 1.7),
  p("qipao", "luna", "Cinematic", "A whole film in eight seconds", ["moody", "film"], 8100, 264, 1420, "Moody 1960s hallway, a woman in a floral dress pauses under warm light", "Her", 2, 1.6),
  p("scooter", "kai", "Funny", "Took my twin on a road trip", ["twin", "selfie"], 7300, 219, 3340, "Selfie video on a tree-lined road next to a scooter, helmet on the handlebar", "You", 1, 1.5),
  // 2026-11-11 补齐 @buzzvideo.global 的 Reels(Monica:For You 要有 IG 账号里发的全部视频)
  p("snowball", "mochi", "Pets", "White Chicks, but make it pets", ["pets", "parody"], 38200, 1610, 6240, "Two cartoon pets in a convertible sing along at full volume", "Your pet", 2, 1.5, true),
  p("camera", "reel", "Cinematic", "Looks like a $10K camera commercial. No crew.", ["commercial", "goldenhour"], 12700, 402, 1880, "A runner lifts a mirrorless camera at sunset on a coastal cliff, slow motion, lens flare", "The runner", 1, 1.5),
  p("perry", "fruitdrama", "Funny", "Perry the Platypus just went live action", ["cartoon", "liveaction"], 46800, 3120, 7930, "A teal platypus secret agent in a fedora runs through an evil scientist's lab", "The agent", 1, 1.7, true),
  p("gangnam", "neon", "Dance", "Stranger Things, but make it Gangnam Style", ["dance", "80s"], 52300, 4210, 9840, "Friends in an 80s neon mall do the horse-riding dance, handheld camera", "Dancer", 2, 1.5, true),
  p("chair", "kai", "Funny", "Hype it, sit, lean back", ["ugc", "desksetup"], 8900, 311, 1240, "A creator raves about his ergonomic chair to camera, then sinks into it", "You", 1, 1.6),
  p("darla", "luna", "Funny", "We made Darla from Finding Nemo sing", ["cartoon", "singing"], 41500, 2890, 5310, "A girl with braces and pigtails sings into the camera in a sunny field", "The singer", 1, 1.7, true),
  p("rockstars", "neon", "Dance", "Elon on vocals. Jensen on drums.", ["rock", "band"], 61200, 5480, 11200, "Two men in leather jackets play vocals and drums on a pink stage", "The band", 2, 1.5, true),
  p("fridge", "buzz", "Effects", "The most satisfying fridge restock you'll see today", ["asmr", "restock"], 19400, 690, 3010, "Hands restock a fridge with candy pouches row by row", "Your product", 1, 1.75),
  p("dancefloor", "kai", "Dance", "He came for one drink. Then he saw the dance floor.", ["dance", "party"], 33800, 2140, 6620, "A man at a bar spots the dance floor and breaks into moves", "The dancer", 1, 1.7, true),
  p("outfit", "luna", "Effects", "She never tried this outfit on. AI did.", ["fashion", "tryon"], 27600, 1330, 8450, "A model holds up a lilac bow top, then she is wearing it", "Your model", 2, 1.7, true),
  p("pillow", "kai", "Funny", "Unbox, clip, nap", ["ugc", "travel"], 10200, 388, 1570, "A creator on a plane shows a travel pillow, clips it on and falls asleep", "You", 1, 1.6),
  p("phonecall", "reel", "Cinematic", "Do not call before noon", ["cinematic", "morning"], 15800, 540, 2210, "A woman in a sleep mask answers a rotary phone in bed, morning light", "Her", 1, 1.7),
  p("shades", "luna", "Effects", "Real-looking UGC, zero creators booked", ["ugc", "sunglasses"], 9800, 402, 2950, "A woman tries on pink sunglasses in a bright room, UGC style", "Your model", 1, 1.7),
  p("tvc", "buzz", "Effects", "A soda ad from one prompt", ["tvc", "product"], 14300, 610, 3380, "A soda can splashes into ice water, slow-motion product shot", "Your product", 1, 1.75),
];

/**
 * 来自 Instagram @buzzvideo.global 的视频:原型 id → Reel 短码，顺序 = 账号里从新到旧。
 * For You 先放这些(全部)，再放其他素材。「Stranger Things, but make it 90s cel animation」(Dfi_TFAvVl8)
 * 未登录取不到视频文件，暂缺
 */
export const IG: [string, string][] = [
  ["snowball", "DflifDzPQtT"],
  ["kings", "DfgSvP5hL5b"],
  ["camera", "DfYjkRwPmUs"],
  ["dreamcore", "DfWa7n_SnrG"],
  ["perry", "DfUFoIrRdqJ"],
  ["gangnam", "DfRz_pCtv4H"],
  ["chair", "DfOnxO3MTAC"],
  ["darla", "DfGyiLYhx0m"],
  ["rockstars", "DfD7ZS5hxYQ"],
  ["fridge", "De_1EdOOibK"],
  ["gatsby", "De8r9HihT6L"],
  ["dancefloor", "Deyc06shyIg"],
  ["terracotta", "DeviLHgMeA9"],
  ["cows", "Des6H1lvx7A"],
  ["outfit", "DejDWIqBaGV"],
  ["pillow", "De1a25ZMzvV"],
  ["gummy", "Ded5rDeupsd"],
  ["dogcam", "DecCfZ5yV3T"],
  ["museum", "DeQvRxoh6hk"],
  ["qipao", "DeOX7dVhVtK"],
  ["alice", "DeJeYowPQdN"],
  ["phonecall", "DeHKfh0PPhp"],
  ["hotel", "Dd_VIZ6huaE"],
  ["tvc", "Dd5eNyKJTis"],
  ["shades", "Dd21uVoTSn-"],
];
export const igCode = (id: string) => IG.find(([x]) => x === id)?.[1];
/** 其他素材的来源(非 IG) */
export const OTHER_SOURCE: Record<string, string> = {
  poodle: "往期项目素材", collie: "往期项目素材", catfan: "往期项目素材", kpop: "往期项目素材", orbs: "往期项目素材", mecha: "往期项目素材",
  cityjump: "往期项目素材", skate: "往期项目素材", napoleon: "往期项目素材", fruit: "往期项目素材", scooter: "往期项目素材",
  safari: "产品里生成的视频", racer: "产品里生成的视频",
};
/**
 * For You 的视频和顺序(2026-11-11 Monica 在清单页上标的):前 5 条按她给的顺序，打勾的保留跟在后面;
 * 没打勾的(带货 / UGC / 广告感素材等)移出 For You,但仍在数据里(做同款、主页等还会用到)
 */
export const FOR_YOU = [
  "dreamcore", "gangnam", "perry", "snowball", "kings",
  "darla", "rockstars", "gatsby", "dancefloor", "terracotta", "cows", "museum", "qipao", "alice", "phonecall", "hotel",
  "poodle", "fruit", "safari", "mecha", "skate", "racer", "cityjump",
];
/** 移出 For You 的视频(清单页里单独列出) */
export const OUT_OF_FOR_YOU = POSTS.map((x) => x.id).filter((id) => !FOR_YOU.includes(id));
/** 非竖版视频的宽高比(宽 / 高)。没列出的都是 9:16 竖版。全屏播放时竖版铺满，其他比例居中、上下留黑(2026-11-10 Monica 定) */
const AR: Record<string, number> = { snowball: 16 / 9, camera: 16 / 9, gangnam: 16 / 9, rockstars: 16 / 9, kings: 16 / 9, kpop: 16 / 9, orbs: 16 / 9, mecha: 16 / 9, cityjump: 16 / 9, skate: 16 / 9, napoleon: 16 / 9, cows: 16 / 9, safari: 16 / 9, racer: 16 / 9, terracotta: 4 / 3, hotel: 4 / 3, catfan: 1 };
export const aspect = (id: string) => AR[id] ?? 9 / 16;
export const isVertical = (id: string) => !AR[id];
/** 瀑布流卡片的高宽比:按视频真实比例，横版最矮到 3:4 */
export const cardRatio = (p: Post) => (AR[p.id] ? Math.max(0.75, 1 / AR[p.id]) : p.ratio);
export const post = (id: string) => POSTS.find((x) => x.id === id) ?? POSTS[0];
export const video = (id: string) => `${F}/${id}.mp4`;
export const poster = (id: string) => `${F}/${id}.jpg`;

export type Comment = { id: string; who: string; text: string; ago: string; likes: number; author?: boolean; reply?: Comment };
export const COMMENTS: Comment[] = [
  { id: "c1", who: "luna", text: "I have watched this eleven times and I'm not done", ago: "2h", likes: 214, reply: { id: "c1r", who: "", text: "eleven is a good start 🫶", ago: "1h", likes: 32, author: true } },
  { id: "c2", who: "kai", text: "ok how is the lighting this good", ago: "5h", likes: 96 },
  { id: "c3", who: "mochi", text: "Remixed it with my dog. No regrets.", ago: "1d", likes: 480, reply: { id: "c3r", who: "", text: "saw it!! he's a star", ago: "22h", likes: 51, author: true } },
  { id: "c4", who: "neon", text: "the timing on the beat 👏", ago: "1d", likes: 73 },
  { id: "c5", who: "reel", text: "Saving this for the weekend", ago: "2d", likes: 18 },
  { id: "c6", who: "fruitdrama", text: "we need part two", ago: "3d", likes: 140 },
];

export type Challenge = { id: string; title: string; reward: string; desc: string; dates: string; live: boolean; entries: number; cover: string; examples: string[]; rules: string[] };
export const CHALLENGES: Challenge[] = [
  { id: "pets", title: "Pet Star Week", reward: "Top 10 share 50,000 credits", desc: "Turn your pet into the main character. Any effect, any story.", dates: "Nov 3 – Nov 17", live: true, entries: 18859, cover: "poodle", examples: ["poodle", "collie", "dogcam", "catfan"], rules: ["Post a video starring a pet with #PetStarWeek", "One entry per day counts toward the ranking", "Ranking is by likes + remixes when the challenge ends"] },
  { id: "history", title: "History Remix", reward: "Winner gets 20,000 credits", desc: "Put a famous face from the past somewhere they don't belong.", dates: "Nov 8 – Nov 22", live: true, entries: 9412, cover: "kings", examples: ["kings", "napoleon", "terracotta", "museum"], rules: ["Remix any History Remix example or start from scratch", "No real living people", "Ranking is by remixes"] },
  { id: "dance", title: "NEON Dance-off", reward: "Up to 2,000 credits each", desc: "Everyone learns the NEON choreo. Your character, your stage.", dates: "Oct 20 – Nov 2", live: false, entries: 32921, cover: "cows", examples: ["cows", "kpop", "orbs"], rules: ["Use the NEON dance effect", "Post to the community before the deadline"] },
  { id: "spooky", title: "Spooky Shorts", reward: "Winner gets 10,000 credits", desc: "Eight seconds to give us chills.", dates: "Oct 18 – Oct 31", live: false, entries: 26087, cover: "cityjump", examples: ["cityjump", "qipao", "alice"], rules: ["Keep it under 10 seconds", "Post with #SpookyShorts"] },
];
export const challenge = (id: string) => CHALLENGES.find((c) => c.id === id) ?? CHALLENGES[0];

/** 玩法页的热门特效:点了带着这条示例进做同款 */
export type Effect = { id: string; name: string; uses: number; postId: string; tag?: "Hot" | "New" };
export const EFFECTS: Effect[] = [
  { id: "petstar", name: "Pet Movie Star", uses: 43100, postId: "poodle", tag: "Hot" },
  { id: "royal", name: "Royal Dance-off", uses: 90280, postId: "kings", tag: "Hot" },
  { id: "fruit", name: "Fruit Drama", uses: 153000, postId: "fruit", tag: "Hot" },
  { id: "stage", name: "Idol Stage", uses: 77450, postId: "kpop" },
  { id: "alive", name: "Painting Comes Alive", uses: 61100, postId: "museum", tag: "New" },
  { id: "dreamcore", name: "Dreamcore House", uses: 13730, postId: "dreamcore", tag: "New" },
  { id: "chase", name: "Wild Chase", uses: 31200, postId: "safari" },
  { id: "hyper", name: "Hyper Motion", uses: 25500, postId: "gummy" },
  { id: "neon", name: "NEON Dance", uses: 22220, postId: "cows" },
];

/** 每日签到 7 天的奖励 */
export const STREAK = [10, 10, 15, 15, 20, 20, 50];

export type MissionId = "firstPost" | "shareTikTok" | "shareInstagram" | "twin" | "remix3" | "like5" | "invite";
export type Mission = { id: MissionId; title: string; desc: string; reward: number; group: "Starter" | "Daily"; goal: number };
export const MISSIONS: Mission[] = [
  { id: "twin", title: "Create your Twin", desc: "Put yourself in any video", reward: 50, group: "Starter", goal: 1 },
  { id: "invite", title: "Invite a friend", desc: "You both get credits when they join", reward: 100, group: "Starter", goal: 1 },
  { id: "firstPost", title: "Post a video", desc: "Make anything and post it to the community", reward: 20, group: "Daily", goal: 1 },
  { id: "shareTikTok", title: "Share to TikTok", desc: "Post one of your videos to TikTok", reward: 30, group: "Daily", goal: 1 },
  { id: "shareInstagram", title: "Share to Instagram", desc: "Post one of your videos to Instagram", reward: 30, group: "Daily", goal: 1 },
  { id: "like5", title: "Like 5 videos", desc: "Show some love on your feed", reward: 5, group: "Daily", goal: 5 },
  { id: "remix3", title: "Remix 3 videos", desc: "Find something fun and make it yours", reward: 15, group: "Daily", goal: 3 },
];

export type Notice = { id: string; kind: "official" | "like" | "remix" | "follow"; who?: string; text: string; ago: string; postId?: string; unread?: boolean };
export const NOTICES: Notice[] = [
  { id: "n1", kind: "official", text: "History Remix is live. Winner takes 20,000 credits — tap to join.", ago: "16h", unread: true },
  { id: "n2", kind: "official", text: "New effect: Painting Comes Alive. Try it with any portrait.", ago: "2d" },
  { id: "n3", kind: "official", text: "Your daily credits are waiting. Open the app each day to keep your streak.", ago: "4d" },
];

/** 创作者等级:经验值门槛和称号(数值为占位) */
export const LEVELS = [
  { at: 0, title: "Newcomer" },
  { at: 50, title: "Rising Creator" },
  { at: 150, title: "Trendsetter" },
  { at: 350, title: "Star" },
  { at: 700, title: "Legend" },
];
export const XP = { post: 50, remix: 10, daily: 5 };
export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].at) i++;
  const next = LEVELS[i + 1]?.at ?? LEVELS[i].at;
  const span = Math.max(1, next - LEVELS[i].at);
  return { lv: i + 1, title: LEVELS[i].title, into: xp - LEVELS[i].at, span, pct: i + 1 === LEVELS.length ? 1 : (xp - LEVELS[i].at) / span, max: i + 1 === LEVELS.length };
}
/** 收藏数(示例):按点赞数估 */
export const savesOf = (p: Post) => Math.round(p.likes * 0.18);

/** 每次生成扣的积分(演示值) */
export const GEN_COST = 20;
export const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n >= 10_000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toLocaleString("en-US"));

/* ---------- 社交(2026-11-11 社交 APP 设计视角) ---------- */

/** 用户的朋友(通讯录 / 互关)。头像取自一条视频封面，和示例账号一致 */
export type Friend = { id: string; name: string; avatar: string; streak: number };
export const FRIENDS: Friend[] = [
  { id: "lily", name: "Lily", avatar: poster("museum"), streak: 9 },
  { id: "max", name: "Max", avatar: poster("skate"), streak: 5 },
  { id: "zoe", name: "Zoe", avatar: poster("alice"), streak: 3 },
  { id: "ben", name: "Ben", avatar: poster("cityjump"), streak: 0 },
];
export const friend = (id: string) => FRIENDS.find((f) => f.id === id) ?? FRIENDS[0];
/** 哪些朋友做过这条视频的同款(示例) */
const FRIEND_REMIXES: Record<string, string[]> = { snowball: ["lily", "max", "zoe"], outfit: ["zoe", "lily"], dancefloor: ["max"], poodle: ["lily", "max", "zoe"], kings: ["max", "ben"], fruit: ["zoe"], kpop: ["lily", "zoe", "ben"], dogcam: ["lily"], napoleon: ["ben"], collie: ["max"], catfan: ["lily", "ben"], museum: ["zoe"], gummy: ["max"] };
export const friendsOn = (postId: string) => (FRIEND_REMIXES[postId] ?? []).map(friend);

/** 同类里的热度排名:hot 的视频才显示「#N Trending in 分类」 */
export function trendRank(p: Post) {
  if (!p.hot) return 0;
  return POSTS.filter((x) => x.cat === p.cat && x.hot).sort((a, b) => b.remixes - a.remixes).findIndex((x) => x.id === p.id) + 1;
}

/** 同款页里「别人做的版本」(示例):朋友的排前面，再是同分类的热门 */
export type Version = { postId: string; by: string; avatar: string; likes: number; friend?: boolean };
export function versionsOf(postId: string): Version[] {
  const src = post(postId);
  const pool = POSTS.filter((x) => x.id !== postId && x.cat === src.cat).concat(POSTS.filter((x) => x.id !== postId && x.cat !== src.cat));
  const fr = friendsOn(postId).map((f, i) => ({ postId: pool[i % pool.length].id, by: f.name, avatar: f.avatar, likes: [2140, 864, 312][i] ?? 120, friend: true }));
  const rest = pool.slice(fr.length, fr.length + 8).map((x) => ({ postId: x.id, by: creator(x.author).name, avatar: poster(x.id), likes: x.likes }));
  return [...fr, ...rest];
}

/** 发作品的连续天数(火苗):每天发至少一条才 +1,断一天归零。和签到天数分开算 */
export const POST_STREAK_START = 6;

/** 演示用的成品画面:换成自己(分身)出镜的，用那条自拍视频代表「我的版本」;其他照原视频(不真调模型) */
export const resultOf = (job: { postId: string; withTwin: boolean }) => (job.withTwin ? "scooter" : job.postId);
