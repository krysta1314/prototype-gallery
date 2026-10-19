"use client";

import { useEffect, useRef, useState } from "react";
import { demoReducer } from "../app/demo";
import { AppProvider } from "../app/provider";
import { Phone, type PhoneHandle } from "../shell/Shell";
import Inspector from "./Inspector";
import JourneyNav from "./JourneyNav";
import EventsPage from "./EventsPage";
import { JOURNEYS, buildPreset, type Journey } from "./journeys";
import { isPage } from "./navTree";

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
    setPage(null);
    setJourney(j);
    setRun((r) => r + 1);
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
          <main className="min-w-0">
            <Phone ref={phone} initialPhase={journey.phase} reserveW={NAV_W + INSPECTOR_W} />
          </main>
          <Inspector phone={phone} journey={journey} onReplay={() => go(journey)} />
        </AppProvider>
      )}
    </div>
  );
}

/** 把当前旅程写进网址(不刷新页面) */
function setLink(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("j", id);
  window.history.replaceState(null, "", url);
}
