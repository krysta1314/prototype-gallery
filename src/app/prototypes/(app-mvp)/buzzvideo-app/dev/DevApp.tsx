"use client";

import { useEffect, useState } from "react";
import App from "../app/App";
import { DEMO_ACCOUNTS, type DemoAccountId } from "../app/accounts";
import { signedInAs } from "../app/demo";
import { AppProvider, InsetsProvider, useStore } from "../app/provider";

/** 本机日期作为 day(不是 UTC):本机零点到零点算一天 */
const localDay = () => {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
};

/**
 * 启动:以本机日期作为 day 走冷启动逻辑(每天最多一次付费墙等)。
 * GET /api/promo/active 在开发原型里视为「当前没有活动」;活动态在评审原型里切换
 */
function Boot() {
  const { dispatch } = useStore();
  useEffect(() => {
    dispatch({ type: "appLaunched", day: localDay() });
  }, [dispatch]);
  return null;
}

type Choice = "new" | DemoAccountId;
const CHOICES: { id: Choice; label: string }[] = [{ id: "new", label: "新用户" }, ...DEMO_ACCOUNTS.map((a) => ({ id: a.id, label: a.label }))];

/**
 * 开发原型(spec §10.1):没有真机外壳,只有 APP 本身,供研发复刻。用浏览器手机模式预览。
 * 顶部一条演示账号切换(演示控件,不属于产品):新用户从引导页开始;其余直接以该账号登录落在首页。
 * 切换 = 用该账号的状态重新挂载 APP;手机屏幕内的代码和评审原型是同一份(../app)
 */
export default function DevApp() {
  const [account, setAccount] = useState<Choice>("new");
  const [run, setRun] = useState(0);
  const pick = (id: Choice) => {
    setAccount(id);
    setRun((r) => r + 1);
  };

  return (
    <div style={{ height: "100dvh", width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="flex shrink-0 items-center gap-1.5 border-b border-black/[0.06] bg-[#f4f4f6] px-2 py-1.5">
        <span className="shrink-0 text-[11px] font-medium text-[#5f6070]">账号</span>
        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto" role="radiogroup" aria-label="演示账号">
          {CHOICES.map((c) => {
            const on = c.id === account;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(c.id)}
                className={`h-6 shrink-0 rounded-full px-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-[#ff5e1a] ${
                  on ? "bg-[#1a1a2e] font-medium text-white" : "bg-black/[0.05] text-[#3a3b45] hover:bg-black/[0.08]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <AppProvider key={run} initialState={account === "new" ? undefined : signedInAs(account, localDay())}>
        <Boot />
        <InsetsProvider value={{ top: 20, bottom: 16 }}>
          {/* 和真机一样不显示滚动条,滑动照常 */}
          <div className="hide-scrollbars" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <App />
          </div>
        </InsetsProvider>
      </AppProvider>
    </div>
  );
}
