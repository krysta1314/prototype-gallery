"use client";

/* 开发原型的工具页直达(/prototypes/ai-tools/<工具>):打开时就在那个工具页。
   2026-11-05 起用 video-gen-modes 的产品外壳(和评审原型同一个产品):点 Home / Marketing Agent 是带编辑模式的新首页。
   网址带 ?outcome=fail 时所有模型调用都失败(演示失败 + 退积分)。 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductApp } from "@/app/prototypes/(v1.12)/video-gen-modes/app/ProductApp";
import type { ProductView } from "./ProductApp";
import { createFixtureApi } from "./fixture";
import { createToolsFixture } from "./tools/api";

const failMode = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("outcome") === "fail";

export function DevToolPage({ view }: { view: ProductView }) {
  const router = useRouter();
  const [api] = useState(() => createFixtureApi(failMode() ? { outcome: "fail" } : {}));
  const [toolsApi] = useState(() => createToolsFixture(failMode() ? { outcome: "fail" } : {}));
  return (
    <div className="h-dvh">
      <ProductApp upscaleApi={api} toolsApi={toolsApi} initialView={view} persist onCanvas={() => router.push("/prototypes/ai-tools/canvas")} />
    </div>
  );
}
