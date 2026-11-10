"use client";

/* 产品外壳:新侧边栏(ProductSidebar)+ 当前页面 + 顶部 toast + 钱包(积分余额)。
   页面在这里用 state 切换,不跳路由:评审原型里点侧边栏要留在评审页。
   - Home / Marketing Agent → 首页(HomeView);
   - 有页面的工具(sidebarMenus 的 TOOLS:Upscale Image /
     Remove Object / Inpaint / Virtual Try-On / Model Swap / Photo Angle Editor)→ 对应工具页,view 名 = 工具 key;
     Remove Object 和 Inpaint 是同一个画笔页的两种模式、Virtual Try-On 和 Model Swap 是同一个试穿页的两种模式(PAGE_OF):
     页面只挂一份,view 决定模式;页面里切模式 = 切 view,侧边栏选中项跟着变;
   - 通用模型的菜单项(sidebarMenus 的 AGENT_JUMPS:Relight、Image to Video、Background Music…)→ 首页 = Marketing Agent,
     侧边栏高亮 Marketing Agent;HomeView 用新 key 重新挂载,切到对应创作模式、预填提示词、选中第一个占位、显示「From: <工具>」;
   - Canvas → onCanvas(开发原型跳画布页,评审原型切到「画布」);3D Studio / Assets / 其余菜单项 → 「Coming soon」toast。
   外壳照真实产品:浅灰底 + 侧边栏,页面放在白色圆角面板(<main>)里,顶栏叠在面板顶部。
   md 以下侧边栏隐藏,顶栏菜单按钮打开 MobileNavDrawer(同一套导航,模块是手风琴)。
   页面第一次打开后就一直挂着(不用的藏起来),来回切换不丢工具页里的任务和参数(生成中离开,任务照跑)。
   钱包:所有工具页同一个余额。新工具页通过 wallet.charge / refund 扣退;Upscale Image 自己的 store 也记余额,
   用 balance / onBalance 双向同步。余额不够时外壳弹「Not enough credits」。 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { APPLE_FONT } from "@/app/prototypes/(v1.12)/hybrid-reel/agent/chat/shell";
import type { UpscaleApi } from "./api";
import { HomeView } from "./HomeView";
import { UpscaleTool, newId } from "./UpscaleTool";
import { initialState } from "./store";
import { currentWorkspaceId, onWorkspaceChange, PERSONAL_ID, useWorkspace, workspaceOf, WORKSPACE_CREDITS } from "./components/workspace";
import { DEFAULT_CREDITS } from "@/app/prototypes/(v1.12)/hybrid-reel/canvas/credits";
import { COMING_SOON, PAGE_OF, TOOLS, type AgentJump, type MenuItem, type ToolKey } from "./sidebarMenus";
import { createToolsFixture, type ToolsApi } from "./tools/api";
import type { Wallet } from "./tools/jobs";
import { VideoUpscaleTool } from "./video-upscale/VideoUpscaleTool";
import { ModelTool } from "./model-tools/ModelTool";
import type { MyVoice } from "./model-tools/logic";
import { BrushEditTool } from "./brush/BrushEditTool";
import { TryOnTool } from "./tryon/TryOnTool";
import { PhotoAngleTool } from "./angle/PhotoAngleTool";
import { NotEnoughCreditsDialog } from "./components/ToolKit";
import { ProductSidebar, type NavKey, type NavTarget, type SidebarActive } from "./components/ProductSidebar";
import { MobileNavDrawer } from "./components/MobileNavDrawer";
import { TopToast, type Notify, type TopToastData } from "./components/TopToast";

/** 当前页面:首页,或一个工具页(TOOLS 的 key) */
export type ProductView = "home" | ToolKey;

const isTool = (t: string): t is ToolKey => t in TOOLS;
/** view → 页面 key:同页不同模式的(Remove Object / Inpaint、Virtual Try-On / Model Swap)共用一个页面实例 */
const pageOf = (v: ProductView): string => (v === "home" ? "home" : (PAGE_OF[v] ?? v));

/** 外壳交给首页的东西(video-gen-modes 用自己的首页时拿这些) */
export type HomeContext = {
  jump: (AgentJump & { id: string }) | null;
  homeNav: NavKey;
  credits: number;
  notify: Notify;
  onMenu: () => void;
  onInvite: () => void;
};

export function ProductApp({
  api,
  toolsApi,
  initialView = "home",
  persist = true,
  onCanvas,
  renderHome,
  onItem,
  onNavigate,
  homeActive,
  fill = false,
}: {
  api: UpscaleApi;
  /** 新工具页的模型调用;不传 = 默认 fixture */
  toolsApi?: ToolsApi;
  initialView?: ProductView;
  /** false = 工具页不读写 sessionStorage(评审原型) */
  persist?: boolean;
  /** 侧边栏 Canvas、结果卡 Open in canvas(结果图已写进 CANVAS_KEY) */
  onCanvas: () => void;
  /** 换掉首页(video-gen-modes 把 Video Gen / Marketing Agent 首页放进这个外壳);不传 = ai-tools 自己的首页 */
  renderHome?: (ctx: HomeContext) => ReactNode;
  /** 侧边栏菜单项先给外壳处理(返回 true = 已处理),比如切到某个模型的某个模式;goHome 回首页 */
  onItem?: (item: MenuItem, ctx: { goHome: (nav?: NavKey) => void; notify: Notify }) => boolean;
  /** 侧边栏任何导航(Home / Agent / 工具页 / 菜单项)发生时通知外层，比如关掉盖在首页上的页面 */
  onNavigate?: (target: NavTarget) => void;
  /** 首页上盖着别的页面时(目前没有在用),侧边栏高亮这一项而不是 Home */
  homeActive?: SidebarActive;
  /** true = 撑满父容器(评审页里有演示条);false = 整屏 h-dvh */
  fill?: boolean;
}) {
  const [view, setViewState] = useState<ProductView>(initialView);
  /** 打开过的页面(之后一直挂着)。Upscale Image 一开始就挂着:它从 sessionStorage 续跑任务、同步余额 */
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set<string>([pageOf(initialView), "upscale"]));
  const setView = useCallback((v: ProductView) => {
    setViewState(v);
    const k = pageOf(v);
    setOpened((o) => (o.has(k) ? o : new Set(o).add(k)));
  }, []);
  const [fallbackApi] = useState(() => createToolsFixture());
  const tasks = toolsApi ?? fallbackApi;
  /** 首页时高亮哪个导航项(Home / Marketing Agent 都是这一页) */
  const [homeNav, setHomeNav] = useState<NavKey>("home");
  /** 最近一次从菜单跳 Agent 带过来的东西;id 当 HomeView 的 key,每次跳都重新挂载(连点同一项也重新预填) */
  const [jump, setJump] = useState<(AgentJump & { id: string }) | null>(null);
  const [toast, setToast] = useState<TopToastData | null>(null);
  /* 钱包:所有页面同一个余额。ref 是同步的最新值,charge 要当场判断够不够 */
  const [balance, setBalanceState] = useState(() => initialState().balance);
  const balanceRef = useRef(balance);
  const setBalance = useCallback((n: number) => {
    balanceRef.current = n;
    setBalanceState(n);
  }, []);
  const [shortfall, setShortfall] = useState<{ needed: number; balance: number } | null>(null);
  const wallet: Wallet = useMemo(
    () => ({
      balance,
      charge: (cost) => {
        if (cost <= 0) return true;
        if (balanceRef.current < cost) {
          setShortfall({ needed: cost, balance: balanceRef.current });
          return false;
        }
        setBalance(balanceRef.current - cost);
        return true;
      },
      refund: (cost) => {
        if (cost > 0) setBalance(balanceRef.current + cost);
      },
    }),
    [balance, setBalance],
  );
  /* 手机宽度的侧边栏抽屉(顶栏菜单按钮打开) */
  const [drawer, setDrawer] = useState(false);
  const openDrawer = useCallback(() => setDrawer(true), []);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  const notify: Notify = useCallback((text, kind = "info", retry) => setToast({ id: newId(), text, kind, retry }), []);
  /* 右上角切工作区(2026-11-06):每个工作区一份积分余额，切走时记下当前的，切过去换成那边的 */
  const balancesRef = useRef<Record<string, number>>({});
  const ws = useWorkspace();
  const [seenWs, setSeenWs] = useState<string[]>([]);
  /* 刷新后停在团队工作区：开场把余额换成那个工作区的 */
  useEffect(() => {
    const id = currentWorkspaceId();
    if (id === PERSONAL_ID) return;
    let live = true;
    void Promise.resolve().then(() => live && setBalance(WORKSPACE_CREDITS[id] ?? DEFAULT_CREDITS));
    return () => {
      live = false;
    };
  }, [setBalance]);
  useEffect(
    () =>
      onWorkspaceChange((next, prev) => {
        setSeenWs((s) => [...new Set([...s, prev, next])]);
        balancesRef.current[prev] = balanceRef.current;
        setBalance(balancesRef.current[next] ?? WORKSPACE_CREDITS[next] ?? DEFAULT_CREDITS);
        const ws = workspaceOf(next);
        notify(ws.personal ? "Switched to your personal account" : `Switched to ${ws.name}`, "success");
      }),
    [notify, setBalance],
  );
  /* Voice Clone 做出来的音色：Lip Sync 的音色下拉里能选(「Use in Lip Sync」带过去并预选) */
  const [myVoices, setMyVoices] = useState<MyVoice[]>([]);
  /* Voice Clone 独立页 2026-11-06 删除(进 Audio Gen);Lip Sync 的「My voices」列表照旧 */
  const [voicePick] = useState<{ id: string; n: number }>();
  const voiceProps = {
    myVoices,
    onVoiceSaved: (v: MyVoice) => setMyVoices((xs) => [v, ...xs.filter((x) => x.id !== v.id)]),
    onRenameVoice: (id: string, name: string) => setMyVoices((xs) => xs.map((x) => (x.id === id ? { ...x, name } : x))),
  };
  const invite = useCallback(() => notify(COMING_SOON), [notify]);
  const dismiss = useCallback((id: string) => setToast((t) => (t?.id === id ? null : t)), []);

  /* 通用模型菜单项：图片 / 视频类进首页对应的 Image Gen / Video Gen(侧边栏亮 Home),音频类进 Marketing Agent */
  const toAgent = (j: AgentJump) => {
    const nav = j.mode === "marketing" ? "agent" : "home";
    onNavigate?.(nav);
    setJump({ ...j, id: newId() });
    setHomeNav(nav);
    setView("home");
  };

  const nav = (t: NavTarget) => {
    onNavigate?.(t);
    if (isTool(t)) return setView(t);
    if (t === "home" || t === "agent") {
      setHomeNav(t);
      return setView("home");
    }
    if (t === "canvas") return onCanvas();
    notify(COMING_SOON);
  };

  const active: SidebarActive = view === "home" ? (homeActive ?? { nav: homeNav }) : { module: TOOLS[view].module, item: TOOLS[view].label };
  const goHome = (n: NavKey = "home") => {
    setHomeNav(n);
    setView("home");
  };
  const itemHandler = onItem ? (item: MenuItem) => onItem(item, { goHome, notify }) : undefined;

  const common = { notify, onMenu: openDrawer, onInvite: invite, onOpenTool: nav };
  /* 工具页按工作区各挂一份(2026-11-06):My Results 只是当前工作区里自己的结果，切回来还在;切到没去过的工作区是空的 */
  const wsIds = seenWs.includes(ws.id) ? seenWs : [...seenWs, ws.id];
  const page = (k: string, node: ReactNode | ((wsId: string) => ReactNode)) =>
    opened.has(k)
      ? wsIds.map((id) => (
          <div key={`${k}@${id}`} className={pageOf(view) === k && id === ws.id ? "flex h-full min-w-0" : "hidden"}>
            {typeof node === "function" ? node(id) : node}
          </div>
        ))
      : null;

  return (
    /* 版式照真实产品(buzzvideo.ai 1760 宽实测):浅灰底 + 左侧边栏,页面内容放在内缩 8px 的白色圆角面板里 */
    <div className={`relative flex ${fill ? "h-full" : "h-dvh"} overflow-hidden bg-[#FAFBFC]`} style={{ fontFamily: APPLE_FONT }}>
      <ProductSidebar active={active} onNav={nav} onAgent={toAgent} onNotice={notify} onItem={itemHandler} />
      <main className="relative min-w-0 flex-1 overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] md:m-2 md:rounded-2xl">
        <div className={view === "home" ? "flex h-full min-w-0" : "hidden"}>
          {renderHome ? (
            renderHome({ jump, homeNav, credits: balance, notify, onMenu: openDrawer, onInvite: invite })
          ) : (
            <HomeView key={jump?.id ?? "home"} jump={jump} credits={balance} notify={notify} onMenu={openDrawer} onInvite={invite} />
          )}
        </div>
        {page(
          "upscale",
          /* 只有当前工作区那份和钱包双向同步，藏起来的不同步(免得把团队余额存进个人账号) */
          (id) => <UpscaleTool api={api} showGuide={view === "upscale"} persist={persist && id === PERSONAL_ID} onOpenCanvas={onCanvas} balance={id === ws.id ? balance : undefined} onBalance={id === ws.id ? setBalance : undefined} {...common} />,
        )}
        {page("video-upscale", <VideoUpscaleTool api={tasks} wallet={wallet} {...common} />)}
        {page(
          "brush-edit",
          <BrushEditTool
            api={tasks}
            wallet={wallet}
            mode={view === "inpaint" ? "replace" : "remove"}
            onMode={(m) => setView(m === "replace" ? "inpaint" : "remove-object")}
            {...common}
          />,
        )}
        {page(
          "try-on",
          <TryOnTool
            api={tasks}
            wallet={wallet}
            mode={view === "model-swap" ? "model-swap" : "try-on"}
            onMode={(m) => setView(m === "model-swap" ? "model-swap" : "virtual-try-on")}
            {...common}
          />,
        )}
        {page("photo-angle", <PhotoAngleTool api={tasks} wallet={wallet} {...common} />)}
        {page("motion-control", <ModelTool tool="motion-control" api={tasks} wallet={wallet} {...common} />)}
        {page("character-swap", <ModelTool tool="character-swap" api={tasks} wallet={wallet} {...common} />)}
        {page("render-3d", <ModelTool tool="render-3d" api={tasks} wallet={wallet} {...common} />)}
        {page("lip-sync", <ModelTool tool="lip-sync" api={tasks} wallet={wallet} {...voiceProps} voicePick={voicePick} {...common} />)}
        {page("talking-avatar", <ModelTool tool="talking-avatar" api={tasks} wallet={wallet} {...common} />)}
      </main>
      <MobileNavDrawer open={drawer} active={active} onClose={closeDrawer} onNav={nav} onAgent={toAgent} onNotice={notify} onItem={itemHandler} />
      <TopToast toast={toast} onDismiss={dismiss} />
      {shortfall && <NotEnoughCreditsDialog needed={shortfall.needed} balance={shortfall.balance} onClose={() => setShortfall(null)} />}
    </div>
  );
}
