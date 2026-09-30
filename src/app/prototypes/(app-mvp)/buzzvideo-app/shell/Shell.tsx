"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import App from "../app/App";
import { readyTitle } from "../app/data";
import { topRoute } from "../app/nav";
import { AppProvider, InsetsProvider, useNav, useStore } from "../app/provider";
import Splash from "../app/screens/Splash";
import { jobProgress } from "../app/store";
import { AppIconTile } from "./AppIcon";
import DynamicIsland from "./DynamicIsland";
import { frostedGlass, ICON_RADIUS } from "./glass";
import HomeScreen, { type Rect } from "./HomeScreen";
import StatusBar from "./StatusBar";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** iPhone 17 Pro 逻辑尺寸 */
const SCREEN_W = 402;
const SCREEN_H = 874;
const SCREEN_R = 62;
const BEZEL = 11;
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;
/** 手机下方演示说明占的高度 */
const CAPTION_H = 64;

const OPEN_MS = 480;
const CLOSE_MS = 380;
const SPLASH_MS = 1500;
const EASE = "cubic-bezier(0.2, 0.9, 0.25, 1)";

/**
 * home:桌面 · opening:图标放大中 · splash:启动页 · app:APP 前台 · closing:缩回图标
 * 冷启动走 opening → splash → app;APP 在后台时再点图标(热启动)跳过启动页
 */
type Phase = "home" | "opening" | "splash" | "app" | "closing";

export default function Shell() {
  // key 变化 = 杀掉 APP 进程,回到全新安装状态
  const [run, setRun] = useState(0);
  return (
    <AppProvider key={run}>
      <Stage onReset={() => setRun((r) => r + 1)} />
    </AppProvider>
  );
}

function useFitScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () =>
      setScale(
        Math.min(
          1,
          (window.innerHeight - CAPTION_H - 24) / PHONE_H,
          (window.innerWidth - 24) / PHONE_W,
        ),
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}

function Stage({ onReset }: { onReset: () => void }) {
  const { state, dispatch } = useStore();
  const { nav, navigate } = useNav();
  const scale = useFitScale();

  const [phase, setPhase] = useState<Phase>("home");
  /** APP 进程是否已启动(已启动 = 在后台,再打开是热启动) */
  const [running, setRunning] = useState(false);
  const [splashOn, setSplashOn] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const originRef = useRef<Rect | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) =>
    timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** 图标 ↔ 全屏 的变换关键帧(在 APP 图层坐标系里) */
  const frames = (from: Rect) => {
    const s = from.w / SCREEN_W;
    const tx = from.x + from.w / 2 - SCREEN_W / 2;
    const ty = from.y + from.h / 2 - SCREEN_H / 2;
    const vInset = (SCREEN_H - SCREEN_W) / 2;
    return {
      icon: {
        transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        clipPath: `inset(${vInset}px 0px round ${ICON_RADIUS / s}px)`,
      },
      full: {
        transform: "translate(0px, 0px) scale(1)",
        clipPath: `inset(0px 0px round ${SCREEN_R}px)`,
      },
    };
  };

  const launch = useCallback(
    (from: Rect, then?: () => void) => {
      if (phase !== "home") return;
      originRef.current = from;
      const cold = !running;
      setSplashOn(cold);
      setPhase("opening");
      requestAnimationFrame(() => {
        const el = layerRef.current;
        if (!el) return;
        animRef.current?.cancel();
        const f = frames(from);
        animRef.current = el.animate(
          [
            { ...f.icon, opacity: 0 },
            { opacity: 1, offset: 0.3 },
            { ...f.full, opacity: 1 },
          ],
          { duration: OPEN_MS, easing: EASE },
        );
      });
      if (cold) {
        later(() => setPhase("splash"), OPEN_MS);
        later(() => {
          setRunning(true);
          setPhase("app");
          later(() => setSplashOn(false), 320);
        }, OPEN_MS + SPLASH_MS);
      } else {
        later(() => setPhase("app"), OPEN_MS);
      }
      then?.();
    },
    [phase, running],
  );

  const goHome = useCallback(() => {
    if (phase !== "app" && phase !== "splash") return;
    const el = layerRef.current;
    const from = originRef.current;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (phase === "splash") setRunning(true);
    setPhase("closing");
    if (el && from) {
      animRef.current?.cancel();
      const f = frames(from);
      animRef.current = el.animate(
        [
          { ...f.full, opacity: 1 },
          { opacity: 1, offset: 0.7 },
          { ...f.icon, opacity: 0 },
        ],
        { duration: CLOSE_MS, easing: EASE, fill: "forwards" },
      );
    }
    later(() => {
      setSplashOn(false);
      setPhase("home");
    }, CLOSE_MS);
  }, [phase]);

  // 桌面上的 Live Activity 与通知
  const job = state.jobs.find((j) => j.status === "running");
  const onHome = phase === "home";
  const activity =
    onHome && state.signedIn && job ? { progress: jobProgress(job) } : null;
  const doneJob =
    onHome && state.pushBanner
      ? state.jobs.find((j) => j.id === state.pushBanner!.jobId)
      : undefined;

  const openFromNotification = (rect: Rect) => {
    if (!doneJob) return;
    const id = doneJob.id;
    dispatch({ type: "dismissPush" });
    launch(rect, () => navigate({ type: "push", route: { name: "work", id } }));
  };
  const openFromIsland = () =>
    launch({ x: (SCREEN_W - 180) / 2, y: 11, w: 180, h: 37 }, () =>
      navigate({ type: "tab", tab: "create" }),
    );

  // 状态栏:深色画面(桌面、登录、满版图、相机、成片)用白字
  const route = topRoute(nav);
  const darkScreen =
    !state.signedIn ||
    !!(route && (route.name === "camera" || route.name === "work"));
  const lightContent =
    phase !== "app"
      ? phase !== "splash" && !(phase === "opening" && splashOn)
      : darkScreen || (!route && nav.tab === "inspire");
  // Home 条看底部内容:灵感页顶部是满版图,底部是白色 Tab 栏
  const lightIndicator = phase === "app" && darkScreen;
  const appVisible = phase !== "home";

  return (
    <div
      className="flex h-dvh items-center justify-center overflow-hidden bg-[#ece8e4]"
      style={{ fontFamily: APPLE_FONT }}
    >
      <div className="flex flex-col items-center">
        <div style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
          <div
            className="relative origin-top-left"
            style={{
              width: PHONE_W,
              height: PHONE_H,
              transform: `scale(${scale})`,
            }}
          >
            <PhoneBody />
            <div
              ref={screenRef}
              className="absolute overflow-hidden bg-black"
              style={{
                left: BEZEL,
                top: BEZEL,
                width: SCREEN_W,
                height: SCREEN_H,
                borderRadius: SCREEN_R,
                isolation: "isolate",
              }}
            >
              {/* 桌面:APP 打开时轻微放大变暗,像 iOS 那样退到后面 */}
              <div
                className="absolute inset-0 transition-[transform,filter] ease-out"
                style={{
                  transitionDuration: `${phase === "opening" ? OPEN_MS : CLOSE_MS}ms`,
                  transform:
                    appVisible && phase !== "closing"
                      ? "scale(1.12)"
                      : "scale(1)",
                  filter:
                    appVisible && phase !== "closing"
                      ? "brightness(0.7)"
                      : "none",
                }}
                inert={appVisible}
              >
                <HomeScreen
                  onLaunch={(r) => launch(r)}
                  scale={scale}
                  screenRef={screenRef}
                />
              </div>

              {/* APP 图层 */}
              <div
                ref={layerRef}
                className="absolute inset-0 flex flex-col bg-[#faf8f6]"
                style={{
                  visibility: appVisible ? "visible" : "hidden",
                  pointerEvents: phase === "app" ? "auto" : "none",
                  willChange: "transform",
                }}
                inert={!appVisible}
              >
                <InsetsProvider value={{ top: 62, bottom: 34 }}>
                  {running && <App />}
                  {splashOn && (
                    <div
                      className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${phase === "app" ? "opacity-0" : "opacity-100"}`}
                    >
                      <Splash />
                    </div>
                  )}
                </InsetsProvider>
              </div>

              {onHome && doneJob && (
                <HomeNotification
                  title={readyTitle(doneJob.mode)}
                  text={`“${doneJob.title}” is ready to review.`}
                  onOpen={openFromNotification}
                />
              )}

              <StatusBar tint={lightContent ? "light" : "dark"} />
              <DynamicIsland activity={activity} onPress={openFromIsland} />
              {(phase === "app" || phase === "splash") && (
                <HomeIndicator light={lightIndicator} onHome={goHome} />
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 text-[13px] text-[#6b6660]"
          style={{ height: CAPTION_H - 16, marginTop: 16 }}
        >
          <span>
            {phase === "home"
              ? running
                ? "APP 在后台 · 再点图标直接回到上次的页面"
                : "点击 BuzzVideo AI 图标启动"
              : "点底部横条或向上滑动回到桌面"}
          </span>
          <button
            type="button"
            onClick={() => {
              timers.current.forEach(clearTimeout);
              onReset();
            }}
            className="flex items-center gap-1 rounded-full border border-[#d9d3cc] bg-white/70 px-3 py-1 text-[12px] font-medium text-[#3d3a36] transition-colors hover:bg-white"
          >
            <RotateCcw size={12} />
            重新演示
          </button>
        </div>
      </div>
    </div>
  );
}

/** iPhone 17 Pro 机身(黑色),左侧 Action 键 + 音量键,右侧电源键 + 相机控制键 */
function PhoneBody() {
  const btn =
    "absolute rounded-[2px] bg-gradient-to-r from-[#1c1c1e] to-[#3a3a3c]";
  return (
    <>
      <span
        className={btn}
        style={{ left: -3, top: 150, width: 4, height: 32 }}
      />
      <span
        className={btn}
        style={{ left: -3, top: 215, width: 4, height: 62 }}
      />
      <span
        className={btn}
        style={{ left: -3, top: 290, width: 4, height: 62 }}
      />
      <span
        className={btn}
        style={{ right: -3, top: 240, width: 4, height: 96 }}
      />
      <span
        className={btn}
        style={{ right: -2, top: 560, width: 3, height: 60, opacity: 0.85 }}
      />
      <div
        className="absolute inset-0"
        style={{
          borderRadius: SCREEN_R + BEZEL,
          background:
            "linear-gradient(145deg, #2a2a2c 0%, #4a4a4d 18%, #1a1a1c 50%, #3c3c3f 82%, #222224 100%)",
          boxShadow:
            "0 40px 80px -20px rgba(20,20,20,0.35), 0 12px 24px -8px rgba(40,20,10,0.25)",
        }}
      />
      <div
        className="absolute bg-[#050505]"
        style={{ inset: 2.5, borderRadius: SCREEN_R + BEZEL - 2.5 }}
      />
    </>
  );
}

/** Home 条:点一下或向上拖,回到桌面 */
function HomeIndicator({
  light,
  onHome,
}: {
  light: boolean;
  onHome: () => void;
}) {
  const start = useRef<number | null>(null);
  return (
    <button
      type="button"
      aria-label="Go to Home Screen"
      onClick={onHome}
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerMove={(e) => {
        if (start.current !== null && start.current - e.clientY > 24) {
          start.current = null;
          onHome();
        }
      }}
      onPointerUp={() => (start.current = null)}
      className="absolute bottom-0 left-1/2 z-50 flex h-[34px] w-[180px] -translate-x-1/2 cursor-pointer touch-none items-end justify-center pb-[8px]"
    >
      <span
        className={`h-[5px] w-[134px] rounded-full transition-colors duration-300 ${light ? "bg-white" : "bg-black"}`}
      />
    </button>
  );
}

/** 桌面上的系统通知横幅(APP 在后台时生成完成) */
function HomeNotification({
  title,
  text,
  onOpen,
}: {
  title: string;
  text: string;
  onOpen: (r: Rect) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <style>{`@keyframes notif-in { from { transform: translateY(-120%); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
      <button
        ref={ref}
        type="button"
        onClick={() => {
          const el = ref.current;
          onOpen(
            el
              ? {
                  x: el.offsetLeft,
                  y: el.offsetTop,
                  w: el.offsetWidth,
                  h: el.offsetHeight,
                }
              : { x: 10, y: 60, w: SCREEN_W - 20, h: 76 },
          );
        }}
        className="absolute left-[10px] right-[10px] top-[60px] z-30 flex animate-[notif-in_420ms_cubic-bezier(0.16,1,0.3,1)] gap-[10px] rounded-[26px] p-[13px] text-left text-[#111]"
        style={
          { ...frostedGlass, cornerShape: "squircle" } as React.CSSProperties
        }
      >
        <AppIconTile size={38} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between">
            <span className="text-[15px] font-semibold">{title}</span>
            <span className="text-[13px] text-[#6d6d72]">now</span>
          </span>
          <span className="line-clamp-2 text-[15px] leading-[20px]">
            {text}
          </span>
        </span>
      </button>
    </>
  );
}
