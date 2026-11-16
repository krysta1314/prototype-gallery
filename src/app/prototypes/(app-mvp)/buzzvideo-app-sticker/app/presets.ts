import { demoReducer, type AnyAction } from "../../buzzvideo-app/app/demo";
import { INITIAL_NAV, navReducer } from "../../buzzvideo-app/app/nav";
import type { StoreState } from "../../buzzvideo-app/app/store";
import type { buildPreset } from "../../buzzvideo-app/review/journeys";

type V1Journey = Parameters<typeof buildPreset>[0];

/** 示例账号的邮箱：第一版预设里写死了真实邮箱，新版设计的截图 / 演示一律换成虚构的 */
const DEMO_EMAIL = "alex.chen@gmail.com";

/**
 * 第一版创作流程里的示例全是商家广告(冰拿铁、精华、开业…)。新版设计定位是「人人可玩」,
 * 借第一版状态时把提示词换成好玩的(动作里换，生成逻辑跟着走),已经写进状态的标题 / 会话名 / 计划文案再按表换一遍
 */
const PROMPTS: Record<string, string> = {
  "Make a 15s ad for our iced latte": "Turn my dog into a 1920s movie star",
  "Iced latte poster": "My cat as a Renaissance painting",
  "Iced latte poster on a sunny cafe table": "My cat as a Renaissance painting, gold frame",
  "Iced latte on a sunny cafe table": "My cat as a Renaissance painting, gold frame",
  "A 30s upbeat voiceover for our cafe's summer menu": "A movie-trailer voice for my dog's birthday",
  "A 10s slow pour of iced latte, warm morning light": "A tiny dragon flying over my city at sunset",
  "Cut my store clips into a 20s opening ad": "Cut my trip clips into a 20s travel reel",
  "A 10s sneaker ad": "A 10s skateboard trick in slow motion",
  "Latte ad": "Dog movie star",
};
const STATE_TEXT: [string, string][] = [
  ["Summer latte promo", "Mochi's movie debut"],
  ["Glow serum launch", "Dragon over the city"],
  ["Make a 15s vertical ad for our new iced latte using these photos", "Turn my dog into a 1920s movie star using these photos"],
  ["A glass serum bottle on wet stone, slow orbit, soft peach light", "A tiny dragon flying over my city at sunset"],
  ["Iced Latte Summer Pour", "Mochi's Movie Debut"],
  ["Lip Tint Swatch Set", "My Travel Reel"],
  ["Three beats, 15 seconds, cut vertical for Reels and TikTok.", "Three beats, 15 seconds, cut vertical for TikTok and Reels."],
  ["Hook: product close-up", "Hook: the big reveal"],
  ["Scene: your shop in use", "Scene: your star in action"],
  ["CTA: your offer", "Ending: a moment worth sharing"],
  ["A clean product shot, ready for your feed.", "A picture worth posting, ready for your feed."],
  ["Product hero", "Your star, front and center"],
  ["Made to sound like your shop, not a stock ad.", "Made to sound like a movie, not a stock clip."],
  ["Friendly voiceover", "Dramatic voiceover"],
  ["Your real clips up front, AI shots to fill the gaps, cut to the beat.", "Your real clips up front, AI shots to fill the gaps, cut to the beat."],
  ["AI shots: product close-ups", "AI shots: fill the gaps"],
  ["Make a video ad for my product: ", "Make a 15s video of "],
];

const funText = (t: unknown) => (typeof t === "string" && PROMPTS[t] ? PROMPTS[t] : t);

/** 动作里的提示词换成好玩的 */
export function funAction(a: AnyAction): AnyAction {
  const x = a as AnyAction & { text?: unknown; prompt?: unknown; patch?: { text?: unknown } };
  if (x.patch && typeof x.patch.text === "string" && PROMPTS[x.patch.text]) return { ...x, patch: { ...x.patch, text: funText(x.patch.text) } } as unknown as AnyAction;
  if (typeof x.text === "string" && PROMPTS[x.text]) return { ...x, text: funText(x.text) } as unknown as AnyAction;
  if (typeof x.prompt === "string" && PROMPTS[x.prompt]) return { ...x, prompt: funText(x.prompt) } as unknown as AnyAction;
  return a;
}

/** 状态里还残留的商家示例文案换掉;没有命中就原样返回(不打断 React 的引用比较) */
export function funState(s: StoreState): StoreState {
  let json = JSON.stringify(s);
  let hit = false;
  for (const [from, to] of STATE_TEXT) {
    if (from !== to && json.includes(JSON.stringify(from).slice(1, -1))) {
      json = json.split(JSON.stringify(from).slice(1, -1)).join(JSON.stringify(to).slice(1, -1));
      hit = true;
    }
  }
  return hit ? (JSON.parse(json) as StoreState) : s;
}

/** 新版设计挂第一版状态时用的 reducer:先换提示词再跑第一版逻辑，最后把残留文案换掉 */
export const funReducer = (s: StoreState, a: AnyAction) => funState(demoReducer(s, funAction(a)));

/** 借第一版旅程的预置状态，再把示例数据换成新版设计用的 */
/** extra = 在第一版这一步之后再多做几步(如重发验证码、返回改邮箱) */
export function stickerPreset(j: V1Journey, extra?: V1Journey["actions"]) {
  const actions = [...j.actions, ...(extra ?? [])];
  let state = funState(actions.reduce(funReducer, INITIAL_STATE_FUN()));
  const e = state.emailAuth;
  if (e && "email" in e && e.email) state = { ...state, emailAuth: { ...e, email: DEMO_EMAIL } };
  return { state, nav: (j.nav ?? []).reduce(navReducer, INITIAL_NAV) };
}

import { INITIAL_STATE } from "../../buzzvideo-app/app/store";
/** 第一版初始状态里自带的会话 / 作品也是商家示例，开 APP 时就换掉 */
export const INITIAL_STATE_FUN = () => funState(INITIAL_STATE);
