"use client";

import { useRef, useState } from "react";
import { demoReducer } from "../app/demo";
import { AppProvider } from "../app/provider";
import { Phone, type PhoneHandle } from "../shell/Shell";
import Inspector from "./Inspector";
import JourneyNav from "./JourneyNav";
import { JOURNEYS, buildPreset, type Journey } from "./journeys";

const NAV_W = 272;
const INSPECTOR_W = 360;

/**
 * 评审原型(spec §10.1):左栏用户旅程 · 中间真机 · 右栏当前场景、本屏需求与状态。
 * 点一步旅程 = 用该步的预置状态重新挂载 APP(key 变化);真机也可以随时自由点。
 * provider 挂 demoReducer,右栏的演示开关才能生效;开发原型挂的是 storeReducer
 */
export default function ReviewApp() {
  const [journey, setJourney] = useState<Journey>(JOURNEYS[0]);
  const [run, setRun] = useState(0);
  const phone = useRef<PhoneHandle>(null);
  const preset = buildPreset(journey);
  const go = (j: Journey) => {
    setJourney(j);
    setRun((r) => r + 1);
  };

  return (
    <div
      className="grid h-dvh overflow-hidden bg-[#e9e9ec] text-[#1a1a2e]"
      style={{ gridTemplateColumns: `${NAV_W}px 1fr ${INSPECTOR_W}px` }}
    >
      {/* 旅程栏在 provider 外:切换旅程时不重挂,滚动位置保留 */}
      <JourneyNav current={journey.id} onSelect={go} />
      <AppProvider key={run} reducer={demoReducer} initialState={preset.state} initialNav={preset.nav}>
        <main className="min-w-0">
          <Phone ref={phone} initialPhase={journey.phase} reserveW={NAV_W + INSPECTOR_W} />
        </main>
        <Inspector phone={phone} journey={journey} onReplay={() => go(journey)} />
      </AppProvider>
    </div>
  );
}
