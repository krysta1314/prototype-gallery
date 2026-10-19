"use client";

import { useEffect, useRef, useState } from "react";
import { demoReducer } from "../app/demo";
import { AppProvider, useNav, useStore } from "../app/provider";
import { Phone, type PhoneHandle } from "../shell/Shell";
import Inspector from "./Inspector";
import JourneyNav from "./JourneyNav";
import EventsPage from "./EventsPage";
import { JOURNEYS, buildPreset, type Journey } from "./journeys";
import { isPage, navPathOf } from "./navTree";
import { surfaceOf } from "./surface";

const NAV_W = 320;
const INSPECTOR_W = 360;

/**
 * 评审原型(spec §10.1):左栏用户旅程 · 中间真机 · 右栏当前场景、本屏需求与状态。
 * 点一步旅程 = 用该步的预置状态重新挂载 APP(key 变化);真机也可以随时自由点。
 * provider 挂 demoReducer,右栏的演示开关才能生效;开发原型挂的是 storeReducer
 */
export default function ReviewApp() {
  const [journey, setJourney] = useState<Journey>(JOURNEYS[0]);
  /** 整页内容(如埋点汇总);有值时中间和右栏换成这一页 */
  const [page, setPage] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const phone = useRef<PhoneHandle>(null);
  const preset = buildPreset(journey);
  const go = (j: Journey) => {
    touched.current = false;
    setPage(null);
    setJourney(j);
    setRun((r) => r + 1);
    setLink(j.id);
  };
  // 真机里自己点进别的屏后，左栏 / 右栏顶部 / 网址跟着定位到对应旅程(真机不重载)。
  // 只在手动点过真机之后才跟随：刚选旅程时真机自动弹的系统框不会把选中项拉走
  const touched = useRef(false);
  const follow = (surface: string) => {
    if (!touched.current || surface === surfaceOfJourney(journey)) return;
    const j = matchJourney(surface, journey);
    if (!j || j.id === journey.id) return;
    setJourney(j);
    setLink(j.id);
  };
  const openPage = (id: string) => {
    setPage(id);
    setLink(id);
  };

  // 每条旅程一个链接(?j=旅程 id):打开链接直接停在那一屏,方便发给别人
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("j");
    if (!id) return;
    if (isPage(id)) setPage(id);
    else {
      const j = JOURNEYS.find((x) => x.id === id);
      if (j) {
        setJourney(j);
        setRun((r) => r + 1);
      }
    }
  }, []);

  return (
    <div
      className="grid h-dvh overflow-hidden bg-[#e9e9ec] text-[#1a1a2e]"
      style={{ gridTemplateColumns: page ? `${NAV_W}px 1fr` : `${NAV_W}px 1fr ${INSPECTOR_W}px` }}
    >
      {/* 旅程栏在 provider 外:切换旅程时不重挂,滚动位置保留 */}
      <JourneyNav current={page ?? journey.id} onSelect={go} onPage={openPage} />
      {page ? (
        <EventsPage />
      ) : (
        <AppProvider key={run} reducer={demoReducer} initialState={preset.state} initialNav={preset.nav}>
          <SurfaceWatcher onChange={follow} />
          <main className="min-w-0" onPointerDown={() => (touched.current = true)}>
            <Phone ref={phone} initialPhase={journey.phase} reserveW={NAV_W + INSPECTOR_W} />
          </main>
          <Inspector phone={phone} journey={journey} onReplay={() => go(journey)} />
        </AppProvider>
      )}
    </div>
  );
}

/** 真机当前是哪一屏(和右栏需求说明用同一个 key);变了就通知外层 */
function SurfaceWatcher({ onChange }: { onChange: (surface: string) => void }) {
  const { state } = useStore();
  const { nav } = useNav();
  const surface = surfaceOf(state, nav);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => cb.current(surface), [surface]);
  return null;
}

/** 每条旅程预置状态对应的屏(只算一次) */
const SURFACES = new Map<string, string>();
function surfaceOfJourney(j: Journey) {
  if (!SURFACES.has(j.id)) {
    const p = buildPreset(j);
    SURFACES.set(j.id, surfaceOf(p.state, p.nav));
  }
  return SURFACES.get(j.id)!;
}

/** 真机进到某一屏时，左栏定位到哪条旅程：同一阶段优先，正常流程优先于异常 */
function matchJourney(surface: string, from: Journey): Journey | undefined {
  const hits = JOURNEYS.filter((j) => surfaceOfJourney(j) === surface);
  if (!hits.length) return undefined;
  const stage = navPathOf(from.id)?.[0];
  const score = (j: Journey) => (navPathOf(j.id)?.[0] === stage ? 2 : 0) + (j.group === "异常与边界" ? 0 : 1);
  return [...hits].sort((a, b) => score(b) - score(a))[0];
}

/** 把当前旅程写进网址(不刷新页面) */
function setLink(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("j", id);
  window.history.replaceState(null, "", url);
}
