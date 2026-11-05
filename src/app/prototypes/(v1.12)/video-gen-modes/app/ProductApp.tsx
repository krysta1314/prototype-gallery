"use client";

/* 产品外壳(2026-11-04 起 ai-tools 并入本原型):直接用 ai-tools 的外壳(侧边栏 Image / Video / Audio / Avatar、工具页、钱包、手机抽屉、顶部 toast),
   首页换成本原型的首页(Marketing Agent / Video Gen 各种模式)。
   - 侧边栏里生成类专项能力(Camera Control、Video Styles)→ 回首页,Video Gen 切到 MiniMax H3 Max 的对应模式(ENTRY_OF);
     加工类(Lip Sync、Talking Avatar、Video Relight、Character Swap、3D to Video、Motion Control、Voice Clone)→ 外壳直接打开工具页;
   - Live Director 2026-11-05 删除(先不上)。
   - 其余工具项照 ai-tools:有页面的打开工具页，通用模型的项跳首页并预填提示词，没做的 Coming soon。 */

import { useCallback, useState } from "react";
import { menuAction } from "@/app/prototypes/(v1.12)/ai-tools/app/sidebarMenus";
import { ProductApp as ToolsShell, type ProductView } from "@/app/prototypes/(v1.12)/ai-tools/app/ProductApp";
import type { ToolsApi } from "@/app/prototypes/(v1.12)/ai-tools/app/tools/api";
import { createFixtureApi } from "@/app/prototypes/(v1.12)/ai-tools/app/fixture";
import type { UpscaleApi } from "@/app/prototypes/(v1.12)/ai-tools/app/api";
import type { TopToastData } from "@/app/prototypes/(v1.12)/ai-tools/app/components/TopToast";
import { newId } from "./assets";
import type { ModeKey, ModelKey } from "./capabilities";
import { MODE_LABEL, modelCaps } from "./capabilities";
import { HomeView } from "./HomeView";
import type { CreationType } from "./components/CreationTypeMenu";
import { ENTRY_OF } from "./entries";

export function useToast() {
  const [toast, setToast] = useState<TopToastData | null>(null);
  const notify = useCallback((text: string) => setToast({ id: newId("t"), text, kind: "info" }), []);
  const dismiss = useCallback((id: string) => setToast((t) => (t?.id === id ? null : t)), []);
  return { toast, notify, dismiss };
}


type Start = { id: string; type: CreationType; model?: ModelKey; mode?: ModeKey; prompt?: string };
type NavReq = { id: string; type: CreationType };

export function ProductApp({
  onCanvas,
  inUK = false,
  failNext = () => false,
  generateMs = 8000,
  fill = true,
  initialStart,
  initialView,
  toolsApi,
  persist = false,
  upscaleApi,
}: {
  onCanvas: () => void;
  /** 打开时直接切到某个模型 + 模式(开发原型的 ?model=&mode=,思维导图「看 UI」用) */
  initialStart?: { model?: ModelKey; mode?: ModeKey };
  inUK?: boolean;
  failNext?: () => boolean;
  generateMs?: number;
  fill?: boolean;
  /** 打开时就在某个工具页(ai-tools 的工具页直达地址用) */
  initialView?: ProductView;
  toolsApi?: ToolsApi;
  /** 工具页读写 sessionStorage(开发原型直达地址用;评审里不存) */
  persist?: boolean;
  /** Upscale Image 的接口(不传 = 4s 出结果的 fixture) */
  upscaleApi?: UpscaleApi;
}) {
  const [api] = useState(() => upscaleApi ?? createFixtureApi({ delayMs: 4000 }));
  const [start, setStart] = useState<Start | null>(() =>
    initialStart?.model || initialStart?.mode ? { id: newId("s"), type: "video", model: initialStart.model, mode: initialStart.mode } : null,
  );
  /** 侧边栏点 Home / Marketing Agent:每次点都带新 id,首页据此切 Creation type(连点同一项也生效) */
  const [navReq, setNavReq] = useState<NavReq | null>(null);

  return (
    <div className="relative h-full">
      <ToolsShell
        api={api}
        toolsApi={toolsApi}
        initialView={initialView}
        persist={persist}
        fill={fill}
        onCanvas={onCanvas}
        onNavigate={(t) => {
          if (t === "home" || t === "agent") setNavReq({ id: newId("n"), type: t === "agent" ? "marketing" : "video" });
        }}
        onItem={(item, { goHome, notify }) => {
          const e = ENTRY_OF[item.label];
          if (!e) {
            /* 点了通用模型的预填项：以外壳带来的预填为准，清掉之前的模型模式入口 */
            if (menuAction(item).kind === "agent") setStart(null);
            return false;
          }
          setStart({ id: newId("s"), type: "video", model: e.model, mode: e.mode, prompt: e.prompt });
          goHome("home");
          notify(`${MODE_LABEL[e.mode]} on ${modelCaps(e.model).label}`);
          return true;
        }}
        renderHome={({ jump, credits, notify, onMenu, onInvite }) => {
          /* 通用模型菜单项带来的预填：视频类进 Video Gen,图片类进 Image Gen(2026-11-05),其余(音频)进 Marketing Agent */
          const fromJump: Start | null = jump ? { id: jump.id, type: jump.mode === "video" ? "video" : jump.mode === "image" ? "image" : "marketing", prompt: jump.prompt, model: jump.videoModel as ModelKey | undefined, mode: jump.videoMode as ModeKey | undefined } : null;
          const s = start ?? fromJump;
          return (
            <div className="relative flex h-full min-w-0 flex-1">
              {/* 不用 key 重新挂载：从侧边栏进来只切模型 / 模式 / 预填，已生成的结果和对话都保留 */}
              <HomeView
                start={s ?? undefined}
                navReq={navReq ?? undefined}
                credits={credits}
                notify={(t) => notify(t)}
                inUK={inUK}
                failNext={failNext}
                generateMs={generateMs}
                onMenu={onMenu}
                onInvite={onInvite}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
