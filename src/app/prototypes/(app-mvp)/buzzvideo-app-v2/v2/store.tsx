import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { GEN_COST, MISSIONS, POST_STREAK_START, STREAK, XP, levelOf, resultOf, type MissionId } from "./data";
import { useStore } from "./v1";
import { useStill } from "../../buzzvideo-app/app/still";

/* 第二版自己的状态:社交(点赞 / 关注)、签到、任务、分身、我的作品、导航。
 * 登录、订阅、付费墙、设置仍由第一版的 store 管(见 v1.ts) */

export type HomeTab = "following" | "inspiration" | "foryou";
/** create 只在贴纸风新原型里用(Create 是一个 Tab,走第一版的创作流程);第二版的 Create 是二级页 */
export type Tab2 = "home" | "create" | "me";

export type Route2 =
  /** from = 从哪条视频做同款;没有 = 玩法页里自由输入 */
  | { name: "remix"; postId: string; effect?: string }
  /** 同款页:一个「梗」的原版 + 所有人做的版本 */
  | { name: "template"; postId: string }
  | { name: "play" }
  /** 生成中 → 结果 → 发布 */
  | { name: "result"; jobId: string }
  | { name: "profile"; userId: string }
  /** 单条视频(从瀑布流、主页网格点进来);list = 上下滑的顺序;mine = 我的作品 */
  | { name: "post"; postId: string; list?: string[]; mine?: string }
  | { name: "inbox" }
  | { name: "challenges" }
  | { name: "challenge"; id: string }
  | { name: "rewards" }
  | { name: "twin" }
  /** 新版设计的剪辑器(第二版没有，只在新版设计里渲染);seed = 进来时的预置状态(旅程图 / 评审用) */
  | { name: "editor"; seed?: string; postId?: string };

export type Sheet2 =
  | { name: "comments"; postId: string }
  | { name: "share"; postId: string; mine?: string };

export type Job = { id: string; postId: string; title: string; prompt: string; withTwin: boolean; progress: number; status: "running" | "done"; /** 从 Create(第一版的创作流程)做出来的，没有原版可对比 */ fromCreate?: boolean };
export type MyPost = { id: string; postId: string; caption: string; likes: number; remixes: number; shared: ("tiktok" | "instagram")[]; private?: boolean };

export type State2 = {
  tab: Tab2;
  homeTab: HomeTab;
  stack: Route2[];
  sheet: Sheet2 | null;
  likes: string[];
  /** 收藏 */
  saves: string[];
  follows: string[];
  /** 创作者经验值(决定等级) */
  xp: number;
  /** 刚发布成功:全屏庆祝页要显示的内容 */
  celebrate: { myId: string; postId: string; /** 做的是哪条视频的同款(用来找做过的朋友) */ srcId?: string; bonus: number; xp: number; levelUp: boolean } | null;
  /** 第二版里赚到 / 花掉的积分，叠加在第一版的个人积分上 */
  earned: number;
  spent: number;
  /** 连续签到天数(已领的天数);claimedToday = 今天领过了。签到不弹窗：打开 APP 自动到账，顶部横幅告知 */
  streak: number;
  claimedToday: boolean;
  /** 签到到账横幅(几秒后自己收起) */
  banner: { day: number; amount: number } | null;
  /** 发作品的连续天数(火苗);postedToday = 今天发过了 */
  postStreak: number;
  postedToday: boolean;
  /** 任务进度与已领取 */
  progress: Record<MissionId, number>;
  claimed: MissionId[];
  twin: "none" | "ready";
  jobs: Job[];
  /** 生成完还没发布的草稿 = jobs 里 status done 且不在 posts 里的 */
  posts: MyPost[];
  /** 新版设计剪辑器的草稿工程(第二版不用);project 是剪辑器自己的工程数据 */
  edits?: { id: string; postId: string; dur: number; updated: number; project: unknown }[];
  toast: string | null;
  /** 首页第一次的新手提示(点 Remix 做同款) */
  coach: boolean;
  /** 挑战活动:已报名 */
  joined: string[];
  unread: number;
  seq: number;
};

export const INITIAL2: State2 = {
  tab: "home",
  homeTab: "foryou",
  stack: [],
  sheet: null,
  likes: [],
  saves: [],
  follows: [],
  xp: 30,
  celebrate: null,
  earned: 0,
  spent: 0,
  streak: 2,
  claimedToday: false,
  banner: null,
  postStreak: POST_STREAK_START,
  postedToday: false,
  progress: { firstPost: 0, shareTikTok: 0, shareInstagram: 0, twin: 0, remix3: 0, like5: 0, invite: 0 },
  claimed: [],
  twin: "none",
  jobs: [],
  posts: [],
  toast: null,
  coach: true,
  joined: [],
  unread: 1,
  seq: 1,
};

export type Action2 =
  | { type: "tab"; tab: Tab2 }
  | { type: "homeTab"; tab: HomeTab }
  | { type: "push"; route: Route2 }
  | { type: "pop" }
  | { type: "popToRoot" }
  | { type: "sheet"; sheet: Sheet2 }
  | { type: "closeSheet" }
  | { type: "like"; id: string; on?: boolean }
  | { type: "save"; id: string }
  | { type: "closeCelebrate" }
  | { type: "follow"; id: string }
  | { type: "claimDaily" }
  | { type: "hideBanner" }
  | { type: "claimMission"; id: MissionId }
  | { type: "twinReady" }
  | { type: "generate"; postId: string; title: string; prompt: string; withTwin: boolean }
  /** 贴纸风新原型:Create Tab(第一版创作流程)里做好的成片 → 建一条已完成的作品，直接进结果 / 发布页 */
  | { type: "importJob"; postId: string; title: string; prompt: string; withTwin?: boolean }
  | { type: "tick" }
  | { type: "publish"; jobId: string; caption: string; to: ("tiktok" | "instagram")[]; private?: boolean }
  | { type: "shareOut"; to: "tiktok" | "instagram"; mine?: string }
  | { type: "join"; id: string }
  | { type: "readInbox" }
  | { type: "dismissCoach" }
  /** 评审原型:直接改状态 */
  | { type: "demo"; patch: Partial<State2> }
  | { type: "toast"; text: string }
  | { type: "hideToast" };

const bump = (s: State2, id: MissionId, by = 1): State2["progress"] => {
  const goal = MISSIONS.find((m) => m.id === id)!.goal;
  return { ...s.progress, [id]: Math.min(goal, s.progress[id] + by) };
};

export function reducer2(s: State2, a: Action2): State2 {
  switch (a.type) {
    case "tab":
      return { ...s, tab: a.tab, stack: [], sheet: null };
    case "homeTab":
      return { ...s, homeTab: a.tab };
    case "push": {
      const top = s.stack[s.stack.length - 1];
      if (top && JSON.stringify(top) === JSON.stringify(a.route)) return { ...s, sheet: null };
      return { ...s, stack: [...s.stack, a.route], sheet: null, coach: false };
    }
    case "pop":
      return { ...s, stack: s.stack.slice(0, -1), sheet: null };
    case "popToRoot":
      return { ...s, stack: [], sheet: null };
    case "sheet":
      return { ...s, sheet: a.sheet };
    case "closeSheet":
      return { ...s, sheet: null };
    case "like": {
      const has = s.likes.includes(a.id);
      const on = a.on ?? !has;
      if (on === has) return s;
      return { ...s, likes: on ? [...s.likes, a.id] : s.likes.filter((x) => x !== a.id), progress: on ? bump(s, "like5") : s.progress };
    }
    case "save": {
      const has = s.saves.includes(a.id);
      return { ...s, saves: has ? s.saves.filter((x) => x !== a.id) : [a.id, ...s.saves], toast: has ? "Removed from Saved" : "Saved · find it in Me" };
    }
    case "closeCelebrate":
      return { ...s, celebrate: null };
    case "follow": {
      const has = s.follows.includes(a.id);
      return { ...s, follows: has ? s.follows.filter((x) => x !== a.id) : [...s.follows, a.id], toast: has ? null : "Following" };
    }
    case "claimDaily": {
      if (s.claimedToday) return s;
      const day = s.streak % STREAK.length;
      return { ...s, xp: s.xp + XP.daily, claimedToday: true, streak: s.streak + 1, earned: s.earned + STREAK[day], banner: { day: day + 1, amount: STREAK[day] } };
    }
    case "hideBanner":
      return { ...s, banner: null };
    case "claimMission": {
      const m = MISSIONS.find((x) => x.id === a.id)!;
      if (s.claimed.includes(a.id) || s.progress[a.id] < m.goal) return s;
      return { ...s, claimed: [...s.claimed, a.id], earned: s.earned + m.reward, toast: `+${m.reward} credits` };
    }
    case "twinReady":
      return { ...s, twin: "ready", progress: bump(s, "twin"), toast: "Your Twin is ready" };
    case "generate": {
      const id = `job-${s.seq}`;
      return {
        ...s,
        seq: s.seq + 1,
        xp: s.xp + XP.remix,
        spent: s.spent + GEN_COST,
        jobs: [{ id, postId: a.postId, title: a.title, prompt: a.prompt, withTwin: a.withTwin, progress: 0, status: "running" }, ...s.jobs],
        progress: bump(s, "remix3"),
        stack: [...s.stack.filter((r) => r.name !== "remix" && r.name !== "play"), { name: "result", jobId: id }],
        sheet: null,
      };
    }
    case "importJob": {
      const id = `job-${s.seq}`;
      return {
        ...s,
        seq: s.seq + 1,
        jobs: [{ id, postId: a.postId, title: a.title, prompt: a.prompt, withTwin: !!a.withTwin, progress: 1, status: "done", fromCreate: true }, ...s.jobs],
        stack: [...s.stack, { name: "result", jobId: id }],
        sheet: null,
      };
    }
    case "tick": {
      if (!s.jobs.some((j) => j.status === "running")) return s;
      return { ...s, jobs: s.jobs.map((j) => (j.status !== "running" ? j : j.progress >= 1 ? { ...j, status: "done" } : { ...j, progress: Math.min(1, j.progress + 0.045) })) };
    }
    case "publish": {
      const job = s.jobs.find((j) => j.id === a.jobId);
      if (!job) return s;
      // 新版设计：仅自己可见的作品(不进 For You,没有积分 / 火苗 / 经验)。第二版不传 private,逻辑不变
      if (a.private)
        return { ...s, posts: [{ id: `my-${job.id}`, postId: resultOf(job), caption: a.caption, likes: 0, remixes: 0, shared: [], private: true }, ...s.posts], jobs: s.jobs.filter((j) => j.id !== a.jobId), sheet: null, stack: [], tab: "me", toast: "Posted privately. Only you can see it." };
      // 发布奖励 = 对应的每日任务当场完成并自动领取(每天各一次)，任务中心里直接显示 Done，不会重复领
      const ids: MissionId[] = ["firstPost", ...(a.to.includes("tiktok") ? (["shareTikTok"] as const) : []), ...(a.to.includes("instagram") ? (["shareInstagram"] as const) : [])];
      const fresh = ids.filter((id) => !s.claimed.includes(id));
      const bonus = fresh.reduce((n, id) => n + MISSIONS.find((m) => m.id === id)!.reward, 0);
      const progress = { ...s.progress };
      for (const id of ids) progress[id] = 1;
      return {
        ...s,
        progress,
        claimed: [...s.claimed, ...fresh],
        earned: s.earned + bonus,
        posts: [{ id: `my-${job.id}`, postId: resultOf(job), caption: a.caption, likes: 0, remixes: 0, shared: a.to }, ...s.posts],
        jobs: s.jobs.filter((j) => j.id !== a.jobId),
        sheet: null,
        stack: [],
        tab: "me",
        postStreak: s.postedToday ? s.postStreak : s.postStreak + 1,
        postedToday: true,
        xp: s.xp + XP.post,
        celebrate: { myId: `my-${job.id}`, postId: resultOf(job), srcId: job.postId, bonus, xp: XP.post, levelUp: levelOf(s.xp + XP.post).lv > levelOf(s.xp).lv },
      };
    }
    case "shareOut": {
      const key = a.to === "tiktok" ? "shareTikTok" : "shareInstagram";
      const first = !!a.mine && !s.claimed.includes(key);
      const name = a.to === "tiktok" ? "TikTok" : "Instagram";
      return {
        ...s,
        sheet: null,
        progress: a.mine ? { ...s.progress, [key]: 1 } : s.progress,
        claimed: first ? [...s.claimed, key] : s.claimed,
        earned: first ? s.earned + 30 : s.earned,
        posts: a.mine ? s.posts.map((x) => (x.id === a.mine && !x.shared.includes(a.to) ? { ...x, shared: [...x.shared, a.to] } : x)) : s.posts,
        toast: first ? `Shared to ${name} · +30 credits` : `Shared to ${name}`,
      };
    }
    case "join":
      return s.joined.includes(a.id) ? s : { ...s, joined: [...s.joined, a.id], toast: "You're in. Post before the deadline." };
    case "readInbox":
      return { ...s, unread: 0 };
    case "dismissCoach":
      return { ...s, coach: false };
    case "demo":
      return { ...s, ...a.patch };
    case "toast":
      return { ...s, toast: a.text };
    case "hideToast":
      return { ...s, toast: null };
  }
}

const Ctx = createContext<{ s: State2; d: Dispatch<Action2> } | null>(null);

export function Provider2({ children, initial = INITIAL2 }: { children: ReactNode; initial?: State2 }) {
  const [s, d] = useReducer(reducer2, initial);
  // 模拟服务端:生成进度(旅程图的静帧截图里不走，停在预置的进度)
  const still = useStill();
  const running = !still && s.jobs.some((j) => j.status === "running");
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => d({ type: "tick" }), 300);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    // 静帧(旅程图截图)里提示停住不收，不然截图里看不到
    if (!s.toast || still) return;
    const t = setTimeout(() => d({ type: "hideToast" }), 2200);
    return () => clearTimeout(t);
  }, [s.toast, still]);
  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>;
}

export function useV2() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useV2 must be used inside Provider2");
  return v;
}

export const topRoute2 = (s: State2): Route2 | null => s.stack[s.stack.length - 1] ?? null;

/** 当前可用积分 = 第一版个人积分 + 第二版里赚的 − 花的 */
export function useCredits() {
  const { state } = useStore();
  const { s } = useV2();
  return Math.max(0, state.credits.personal + s.earned - s.spent);
}

export const missionReady = (s: State2, id: MissionId) => !s.claimed.includes(id) && s.progress[id] >= MISSIONS.find((m) => m.id === id)!.goal;
export const readyCount = (s: State2) => MISSIONS.filter((m) => missionReady(s, m.id)).length + (s.claimedToday ? 0 : 1);
