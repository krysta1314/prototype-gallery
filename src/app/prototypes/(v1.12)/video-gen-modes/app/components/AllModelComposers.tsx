"use client";

/* 演示用(真实产品没有):首页 Video Gen 输入框下面，按公司分组把每个视频模型的输入框都摆出来，
   不用一个个切模型就能对照各模型的模式标签、素材位和底栏。每个输入框有自己的状态，点 Create 只弹提示。
   宽屏时每个输入框右边常显这个模型的 Model Settings(跟着当前模式变：比例 / 时长 / 分辨率 / 额外参数),和输入框共用状态。 */

import { useState } from "react";
import { MODEL_GROUPS } from "../capabilities";
import { initialComposer, type ComposerState } from "../state";
import { Composer } from "./Composer";
import { ModelIcon, ModelSettingsMenu } from "./BarMenus";
import { CreationTypeMenu, type CreationType } from "./CreationTypeMenu";

export function AllModelComposers({
  credits,
  inUK,
  notify,
  onPickType,
}: {
  credits: number;
  inUK: boolean;
  notify: (t: string) => void;
  /** 底栏最左的 Creation type(和主输入框同一个，切了整页一起切) */
  onPickType: (t: CreationType) => void;
}) {
  const [states, setStates] = useState<Record<string, ComposerState>>(() =>
    Object.fromEntries(
      MODEL_GROUPS.flatMap((g) => g.models).map((m) => [
        m.key,
        initialComposer(m.key),
      ]),
    ),
  );
  return (
    <section
      aria-label="全部模型输入框(演示)"
      className="mt-14 space-y-10 xl:-mx-[200px]"
    >
      <div className="flex items-center gap-4 text-[17px] font-bold text-[#1a1a2e]">
        <span className="h-px flex-1 bg-[#e6e5ec]" />
        全部模型的输入框 · 演示用，真实产品没有这一块
        <span className="h-px flex-1 bg-[#e6e5ec]" />
      </div>
      {MODEL_GROUPS.map((g) => (
        <div
          key={g.company}
          className="rounded-[26px] border border-[#e3e2ea] bg-[#f4f3f7]/70 p-4 pt-3"
        >
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-[#2b2b36] px-2.5 py-1 text-[13px] font-semibold text-white">
            {g.company}
            <span className="tabular-nums text-white/55">
              {g.models.length}
            </span>
          </p>
          <div className="space-y-4">
            {g.models.map((m) => (
              /* 模型名放在白卡外面(灰底分组里),白卡只放输入框本身 */
              <div key={m.key} className="relative focus-within:z-20">
                <p className="mb-1.5 ml-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4a4b5c]">
                  <ModelIcon model={m.key} className="size-3.5" /> {m.label}
                </p>
                <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="rounded-[22px] border border-[#ececf1] bg-white p-3.5 shadow-[0_4px_16px_rgba(26,26,46,0.05)] focus-within:border-[#ff5e1a] focus-within:ring-2 focus-within:ring-[#ff5e1a]/20">
                    <Composer
                      state={states[m.key]}
                      balance={credits}
                      onChange={(c) => setStates((x) => ({ ...x, [m.key]: c }))}
                      onCreate={() => notify("Your video is generating")}
                      notify={notify}
                      inUK={inUK}
                      variant="home"
                      leading={
                        <CreationTypeMenu value="video" onChange={onPickType} />
                      }
                    />
                  </div>
                  {/* 这个模型、这个模式下的 Model Settings,常显 */}
                  <div className="hidden rounded-[22px] border border-[#ececf1] bg-white p-4 shadow-[0_4px_16px_rgba(26,26,46,0.05)] xl:block">
                    <ModelSettingsMenu
                      inline
                      state={states[m.key]}
                      onModel={() => {}}
                      onChange={(p) =>
                        setStates((x) => ({
                          ...x,
                          [m.key]: { ...x[m.key], ...p },
                        }))
                      }
                      placement="down"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
