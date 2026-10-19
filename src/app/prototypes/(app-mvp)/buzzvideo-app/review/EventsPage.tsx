"use client";

import { EVENTS, type TrackedEvent } from "./events";
import { NAV_TREE } from "./navTree";

const SOURCE_STYLE: Record<TrackedEvent["source"], string> = {
  客户端: "bg-[#eef2ff] text-[#3b4bc8]",
  服务端: "bg-[#ecfdf3] text-[#15803d]",
  Adjust: "bg-[#fdf2f8] text-[#be185d]",
};

/** 埋点汇总:所有埋点一张表,按左栏一级模块分组(同一套模块色),给数据同学直接对照 */
export default function EventsPage() {
  const modules = NAV_TREE.filter((m) => EVENTS.some((e) => e.module === m.label));
  return (
    <div className="min-h-0 overflow-y-auto bg-[#f7f7f8] px-10 py-8">
      <header className="mx-auto max-w-[1080px]">
        <p className="text-[12px] font-medium text-[#374151]">埋点 › 埋点汇总</p>
        <h2 className="mt-1 text-[22px] font-semibold text-[#1a1a2e]">埋点汇总</h2>
        <p className="mt-1.5 text-[13px] leading-[20px] text-[#5f6070]">
          全部 {EVENTS.length} 个埋点,按模块分组。「服务端」以服务端或 App Store 回执为准,客户端不重复打;「Adjust」由 SDK 采集并用于投放归因。
        </p>
      </header>
      <div className="mx-auto mt-6 max-w-[1080px] space-y-6">
        {modules.map((m) => {
          const rows = EVENTS.filter((e) => e.module === m.label);
          return (
            <section key={m.label} className="overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06]">
              <h3 className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-3 text-[13px] font-semibold" style={{ color: m.color }}>
                <span className="size-2 rounded-[3px]" style={{ backgroundColor: m.color }} />
                {m.label}
                <span className="font-normal text-[#8a8b98]">{rows.length}</span>
              </h3>
              <table className="w-full table-fixed text-left text-[12.5px]">
                <colgroup>
                  <col className="w-[17%]" />
                  <col className="w-[22%]" />
                  <col className="w-[20%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
                  <col />
                </colgroup>
                <thead className="bg-[#fafafb] text-[11.5px] text-[#8a8b98]">
                  <tr>
                    <th className="px-4 py-2 font-medium">事件</th>
                    <th className="px-3 py-2 font-medium">参数</th>
                    <th className="px-3 py-2 font-medium">触发时机</th>
                    <th className="px-3 py-2 font-medium">页面</th>
                    <th className="px-3 py-2 font-medium">上报</th>
                    <th className="px-3 py-2 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={`${e.screen}-${e.name}`} className="border-t border-black/[0.05] align-top">
                      <td className="px-4 py-2.5 font-mono text-[12px] font-medium text-[#1a1a2e]">{e.name}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-[#3a3b45]">{e.params ?? "—"}</td>
                      <td className="px-3 py-2.5 text-[#3a3b45]">{e.when}</td>
                      <td className="px-3 py-2.5 text-[#3a3b45]">{e.screen}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${SOURCE_STYLE[e.source]}`}>{e.source}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[#5f6070]">{e.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </div>
  );
}
