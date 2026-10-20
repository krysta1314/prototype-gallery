"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { demoReducer } from "../app/demo";
import { AppProvider } from "../app/provider";
import { Phone, type PhoneHandle } from "../shell/Shell";
import Inspector from "./Inspector";
import JourneyNav from "./JourneyNav";
import EventsPage from "./EventsPage";
import FlowPage from "./FlowPage";
import { FLOW_PAGE_PREFIX } from "./flows";
import { JOURNEYS, buildPreset, type Journey } from "./journeys";
import { isPage } from "./navTree";

const NAV_W = 320;
/** 菜单收起后只留一条窄栏 */
const NAV_RAIL_W = 48;
/** 说明收成左下角图标后，手机下方只留一点余量 */
const PEEK_H = 8;
/** 手机右侧演示状态栏宽度 */
const STATES_W = 400;

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
  // 菜单可收起(2026-10-20):讲旅程图 / 看真机时腾出地方;记在本浏览器里
  const [navCollapsed, setNavCollapsed] = useState(false);
  useEffect(() => {
    try {
      setNavCollapsed(localStorage.getItem("bv-review-nav") === "collapsed");
    } catch {}
  }, []);
  const toggleNav = (v: boolean) => {
    setNavCollapsed(v);
    try {
      localStorage.setItem("bv-review-nav", v ? "collapsed" : "open");
    } catch {}
  };
  const navW = navCollapsed ? NAV_RAIL_W : NAV_W;
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
      style={{ gridTemplateColumns: `${navW}px 1fr` }}
    >
      {/* 旅程栏在 provider 外:切换旅程时不重挂,滚动位置保留 */}
      {navCollapsed ? (
        <div className="flex flex-col items-center border-r border-black/[0.06] bg-[#f4f4f6] pt-4">
          <button type="button" onClick={() => toggleNav(false)} aria-label="展开菜单" title="展开菜单" className="rounded-md p-1.5 text-[#5f6070] hover:bg-white hover:text-[#1a1a2e]">
            <PanelLeftOpen size={18} />
          </button>
        </div>
      ) : (
        <JourneyNav current={page ?? journey.id} onSelect={go} onPage={openPage} onCollapse={() => toggleNav(true)} />
      )}
      {page ? (
        page.startsWith(FLOW_PAGE_PREFIX) ? <FlowPage id={page} onSelect={go} /> : <EventsPage />
      ) : (
        <AppProvider key={run} reducer={demoReducer} initialState={preset.state} initialNav={preset.nav}>
          {/* APP 评审布局(2026-10-20 定):上面左手机、右演示状态;下面白底区是路径 + 说明，整列一起滚动 */}
          <main className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
            {/* 笔记本：手机按高度缩放、贴顶;大屏：手机原尺寸，和演示状态一起垂直居中 */}
            <div className="grid min-h-full content-center gap-8 pr-8" style={{ gridTemplateColumns: `minmax(0, 1fr) ${STATES_W}px` }}>
              <Phone ref={phone} initialPhase={journey.phase} reserveW={navW + STATES_W + 32} reserveH={PEEK_H} />
              {/* 状态栏不撑高这一行：高度跟手机一致，内容多了自己滚 */}
              <div className="relative">
                <div className="hide-scrollbars absolute inset-0 overflow-y-auto pb-4">
                  <Inspector part="states" phone={phone} journey={journey} onReplay={() => go(journey)} />
                </div>
              </div>
            </div>
            <Inspector part="notes" left={navW} phone={phone} journey={journey} onReplay={() => go(journey)} />
          </main>
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
