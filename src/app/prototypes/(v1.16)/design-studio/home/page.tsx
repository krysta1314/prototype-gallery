"use client";

/* 开发原型：整屏产品，没有演示控件。?plan=free|starter|pro|ultra|e1|e2|e3、?role=member、?approvals=1 直接定状态;?studio=1 打开就在 Design Studio。 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DesignStudioApp, DEFAULT_DEMO } from "../app/DesignStudioApp";
import { PLANS, type Plan } from "../app/entitlements";

function Home() {
  const q = useSearchParams();
  const p = q.get("plan") as Plan | null;
  const plan = p && PLANS.includes(p) ? p : DEFAULT_DEMO.plan;
  return (
    <DesignStudioApp
      demo={{ ...DEFAULT_DEMO, plan, role: q.get("role") === "member" ? "member" : "admin", approvalsOn: q.get("approvals") === "1" }}
      initialRoute={q.get("studio") === "1" ? { tab: "image" } : null}
    />
  );
}

export default function DesignStudioHome() {
  return (
    <Suspense fallback={<div className="h-dvh bg-[#FAFBFC]" />}>
      <Home />
    </Suspense>
  );
}
