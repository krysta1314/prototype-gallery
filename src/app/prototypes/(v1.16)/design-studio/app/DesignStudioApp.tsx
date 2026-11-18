"use client";

/* Design Studio 外壳(v1.16):直接用 ai-tools 的产品外壳(侧边栏、工具页、toast、工作区),首页用 video-gen-modes 的首页。
   - 侧边栏 3D Studio 下面多一个「Design Studio」(extraNav),点了 Design Studio 盖在首页这一层(renderHome + homeActive);点 Home / 别的项就收起。
   - 首页输入框上方多一个 Brand 选择器;Image Gen 点 Create 出结果卡，卡上「Edit in Studio」把图带进编辑器。
   - 套餐 / 角色 / 审批 / 余额由外层(评审原型的演示条)传进来，切换后所有拦截立刻按新值生效。 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, PenTool, Sparkles } from "lucide-react";
import { menuAction } from "@/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";
import { ProductApp as ToolsShell } from "@/app/prototypes/(v1.12)/ai-tools/app/ProductApp";
import { createFixtureApi } from "@/app/prototypes/(v1.12)/ai-tools/app/fixture";
import { HomeView } from "@/app/prototypes/(v1.12)/video-gen-modes/app/HomeView";
import { ENTRY_OF } from "@/app/prototypes/(v1.12)/video-gen-modes/app/entries";
import type { ModeKey, ModelKey } from "@/app/prototypes/(v1.12)/video-gen-modes/app/capabilities";
import type { CreationType } from "@/app/prototypes/(v1.12)/video-gen-modes/app/components/CreationTypeMenu";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { can, type Feature, type Plan } from "./entitlements";
import { BRAND_KITS, FOLDERS, IMG, INITIAL_SITES, initialDesigns, uid, color, type Design, type Site } from "./data";
import { applyPlanToKits } from "./store";
import { StudioCtx, CreditConfirm, NotEnough, UpgradeDialog, ghostBtn, type Role, type StudioApi, type UpgradeReq } from "./studio/ui";
import { StudioRoot, type Route } from "./studio/StudioRoot";

export type DemoState = { plan: Plan; role: Role; approvalsOn: boolean; balance: number; capLeft: number | null };
export const DEFAULT_DEMO: DemoState = { plan: "pro", role: "admin", approvalsOn: false, balance: 1240, capLeft: null };

type ImageJob = { id: string; prompt: string; src: string; done: boolean };
const SAMPLE = [IMG.serum, IMG.model, IMG.juice, IMG.speaker];

export function DesignStudioApp({
  demo = DEFAULT_DEMO,
  initialRoute,
  fill = false,
  onRoute,
}: {
  demo?: DemoState;
  /** null = 停在 BuzzVideo 首页 */
  initialRoute?: Route | null;
  fill?: boolean;
  /** 评审原型跟踪当前在哪一屏(切说明) */
  onRoute?: (r: Route | null) => void;
}) {
  const [api] = useState(() => createFixtureApi({ delayMs: 4000 }));
  const [route, setRouteState] = useState<Route | null>(initialRoute ?? null);
  const setRoute = useCallback(
    (r: Route | null) => {
      setRouteState(r);
      onRoute?.(r);
    },
    [onRoute],
  );

  /* ---------- 首页(video-gen-modes)需要的东西 ---------- */
  /* 本原型首页默认停在 Image Gen(演示 Edit in Studio) */
  const [start, setStart] = useState<{ id: string; type: CreationType; model?: ModelKey; mode?: ModeKey; prompt?: string } | null>({ id: "init", type: "image", prompt: "Autumn lipstick flat lay on warm beige, editorial light" });
  const [navReq, setNavReq] = useState<{ id: string; type: CreationType } | null>(null);
  const [jobs, setJobs] = useState<ImageJob[]>([]);

  /* ---------- Studio 状态 ---------- */
  const [kits, setKitsState] = useState(() => applyPlanToKits(BRAND_KITS, demo.plan));
  const [kitId, setKitId] = useState<string | null>(BRAND_KITS[0].id);
  const [designs, setDesigns] = useState<Design[]>(initialDesigns);
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES);
  const [balance, setBalance] = useState(demo.balance);
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  const [capLeft, setCapLeft] = useState(demo.capLeft);
  const [upgradeReq, setUpgradeReq] = useState<UpgradeReq | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; credits: number; detail?: string; onConfirm: () => void } | null>(null);
  const [short, setShort] = useState<number | null>(null);
  const toastRef = useRef<(t: string) => void>(() => {});

  /* 演示条换了套餐 / 余额 → 立刻生效(超额品牌套件变只读) */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKitsState((k) => applyPlanToKits(k, demo.plan));
  }, [demo.plan]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBalance(demo.balance);
    setCapLeft(demo.capLeft);
  }, [demo.balance, demo.capLeft]);

  const charge = useCallback(
    (n: number) => {
      if (n <= 0) return true;
      if (balanceRef.current < n || (capLeft !== null && capLeft < n)) {
        setShort(n);
        return false;
      }
      setBalance((b) => b - n);
      if (capLeft !== null) setCapLeft((c) => (c === null ? c : c - n));
      return true;
    },
    [capLeft],
  );

  const studio: StudioApi = useMemo(
    () => ({
      plan: demo.plan,
      role: demo.role,
      approvalsOn: demo.approvalsOn && can(demo.plan, "approvals"),
      balance,
      charge,
      confirmCredits: (o) => setConfirm(o),
      notify: (t) => toastRef.current(t),
      upgrade: setUpgradeReq,
      gate: (f: Feature) => {
        if (can(demo.plan, f)) return true;
        setUpgradeReq({ feature: f });
        return false;
      },
      kits,
      setKits: (fn) => setKitsState(fn),
      kitId,
      setKitId,
      designs,
      folders: FOLDERS,
      save: (d) => setDesigns((all) => all.map((x) => (x.id === d.id ? d : x))),
      add: (ds, open) => {
        setDesigns((all) => [...ds, ...all]);
        if (open && ds[0]) setRoute({ tab: ds[0].type === "deck" ? "decks" : "image", designId: ds[0].id });
      },
      open: (id) => setRoute({ tab: designs.find((d) => d.id === id)?.type === "deck" ? "decks" : "image", designId: id }),
      capLeft,
      sites,
      saveSite: (st) => setSites((all) => (all.some((x) => x.id === st.id) ? all.map((x) => (x.id === st.id ? st : x)) : [st, ...all])),
    }),
    [demo.plan, demo.role, demo.approvalsOn, balance, charge, kits, kitId, designs, capLeft, setRoute, sites],
  );

  /* Image Gen 结果卡 → Edit in Studio:图片当第一个图层，套当前品牌 */
  const editInStudio = (src: string, prompt: string) => {
    const k = kits.find((x) => x.id === kitId);
    const d: Design = {
      id: uid("ds"),
      name: prompt.slice(0, 32) || "Untitled design",
      type: "post",
      brandId: k?.id ?? null,
      folderId: null,
      ratio: 4 / 5,
      format: "portrait",
      version: 1,
      approval: { status: "draft" },
      edited: "Just now",
      pages: [{ id: uid("p"), bg: color(k, "background", "#ffffff"), layers: [{ id: uid("l"), kind: "image", name: "AI image", x: 0, y: 0, w: 100, h: 100, src, ai: true }] }],
    };
    studio.add([d], true);
  };

  const createImages = (prompt: string, count: number) => {
    const n = Math.max(1, Math.min(4, count));
    const fresh = Array.from({ length: n }, (_, i) => ({ id: uid("j"), prompt, src: SAMPLE[(jobs.length + i) % SAMPLE.length], done: false }));
    setJobs((j) => [...fresh, ...j]);
    toastRef.current(n > 1 ? `${n} images are generating` : "Your image is generating");
    window.setTimeout(() => setJobs((j) => j.map((x) => (fresh.some((f) => f.id === x.id) ? { ...x, done: true } : x))), 2200);
  };

  const kitOptions = [{ value: "none", label: "No brand" }, ...kits.map((k) => ({ value: k.id, label: k.name }))];

  return (
    <StudioCtx.Provider value={studio}>
      <div className={`relative ${fill ? "h-full" : "h-dvh"}`}>
        <ToolsShell
          api={api}
          fill
          persist={false}
          extraNav={["design"]}
          balance={balance}
          homeActive={route ? { nav: "design" } : undefined}
          onCanvas={() => toastRef.current("Canvas isn't part of this prototype")}
          onNavigate={(t) => {
            if (t === "design") setRoute(route ?? { tab: "image" });
            else setRoute(null);
            if (t === "home" || t === "agent") setNavReq({ id: uid("n"), type: t === "agent" ? "marketing" : "video" });
          }}
          onItem={(item, { goHome, notify }) => {
            const e = ENTRY_OF[item.label];
            if (!e) {
              if (menuAction(item).kind === "agent") setStart(null);
              return false;
            }
            setStart({ id: uid("s"), type: "video", model: e.model, mode: e.mode, prompt: e.prompt });
            goHome("home");
            notify(`${item.label} opened`);
            return true;
          }}
          renderHome={({ jump, credits, notify, onMenu, onInvite }) => {
            toastRef.current = (t) => notify(t);
            if (route) return <StudioRoot route={route} setRoute={setRoute} onMenu={onMenu} />;
            const fromJump = jump ? { id: jump.id, type: jump.mode as CreationType, prompt: jump.prompt, model: jump.videoModel as ModelKey | undefined, mode: jump.videoMode as ModeKey | undefined } : null;
            const s = start ?? fromJump;
            return (
              <div className="relative flex h-full min-w-0 flex-1">
                <HomeView
                  start={s ?? undefined}
                  navReq={navReq ?? undefined}
                  credits={credits}
                  notify={(t) => notify(t)}
                  inUK={false}
                  onMenu={onMenu}
                  onInvite={onInvite}
                  onImageCreate={createImages}
                  aboveComposer={
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-[#6a6b7b]">Brand</span>
                      <div className="w-[200px] shrink-0"><DropdownSelect label="Brand" size="sm" value={kitId ?? "none"} onChange={(v) => setKitId(v === "none" ? null : v)} options={kitOptions} /></div>
                      <span className="hidden text-[12px] text-[#9a9bb0] sm:inline">Colours, fonts, logo and voice go into every generation</span>
                    </div>
                  }
                  imageResults={
                    jobs.length > 0 && (
                      <section aria-label="Image results" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {jobs.map((j) => (
                          <article key={j.id} className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white shadow-[0_2px_10px_rgba(26,26,46,0.04)]">
                            <div className="relative aspect-square bg-[#f4f3f6]">
                              {j.done ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={j.src} alt="" className="size-full object-cover" />
                              ) : (
                                <div className="grid size-full place-items-center text-[12px] font-medium text-[#9a9bb0]">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 animate-pulse text-[#ff9a3d]" /> Generating
                                  </span>
                                </div>
                              )}
                            </div>
                            {j.done && (
                              <div className="flex items-center gap-1.5 p-2">
                                <button type="button" onClick={() => editInStudio(j.src, j.prompt)} className={`${ghostBtn} h-8 flex-1 px-2 text-[12.5px]`}>
                                  <PenTool className="size-3.5 text-[#ff5e1a]" /> Edit in Studio
                                </button>
                                <button type="button" aria-label="Download image" onClick={() => notify("Downloaded")} className="grid size-8 place-items-center rounded-lg text-[#9a9bb0] transition hover:bg-[#f4f3f6] hover:text-[#1a1a2e]">
                                  <Download className="size-4" />
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </section>
                    )
                  }
                />
              </div>
            );
          }}
        />
        {upgradeReq && <UpgradeDialog req={upgradeReq} onClose={() => setUpgradeReq(null)} />}
        {confirm && (
          <CreditConfirm
            {...confirm}
            balance={balance}
            onClose={() => setConfirm(null)}
            onConfirm={() => {
              const c = confirm;
              setConfirm(null);
              if (c.credits > balance) return void setShort(c.credits);
              if (charge(c.credits)) c.onConfirm();
            }}
          />
        )}
        {short !== null && (
          <NotEnough
            needed={short}
            balance={balance}
            capLeft={capLeft}
            onClose={() => setShort(null)}
            onTopUp={() => {
              setShort(null);
              toastRef.current("Opening top-up");
            }}
            onRequest={() => {
              setShort(null);
              toastRef.current("Request sent to your admin");
            }}
          />
        )}
      </div>
    </StudioCtx.Provider>
  );
}

