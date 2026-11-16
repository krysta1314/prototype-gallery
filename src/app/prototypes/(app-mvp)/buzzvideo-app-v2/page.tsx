"use client";

import dynamic from "next/dynamic";

// 第二版(娱乐化方向)开发原型:全屏 APP,无外壳。评审原型在 ./review
const DevApp2 = dynamic(() => import("./dev/DevApp2"), { ssr: false });

export default function BuzzVideoAppV2Prototype() {
  return <DevApp2 />;
}
