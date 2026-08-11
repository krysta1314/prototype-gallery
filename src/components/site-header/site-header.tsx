"use client";

import type { ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loop } from "./media";
import {
  MODEL_GROUPS,
  TOOL_GROUPS,
  TOOLS_FEATURED_VIDEO,
  MODELS_FEATURED_VIDEO,
} from "./models-data";

const ASSET = "/prototypes/seedance-2-5";

/* Site header / nav, shared by the landing page and sub-pages.
   `solid` = white solid bar (over dark content / after scroll); transparent otherwise. */
export function SiteHeader({
  solid,
  notify,
  inline = false,
  hideBrand = false,
  compact = false,
  sticky = false,
  panelOverlay = false,
  rightContent,
}: {
  solid: boolean;
  notify: (msg: string) => void;
  inline?: boolean;
  hideBrand?: boolean;
  compact?: boolean;
  sticky?: boolean;
  panelOverlay?: boolean;
  rightContent?: ReactNode;
}) {
  const navLink = solid
    ? "transition hover:text-[#1a1a2e]"
    : "transition hover:text-white";

  return (
    <header
      className={`${panelOverlay ? "absolute inset-x-0 top-0 rounded-t-[16px]" : sticky ? "sticky top-0" : inline ? "relative" : "fixed inset-x-0 top-0"} z-50 transition-colors duration-300 ${
        solid ? "bg-white/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className={`mx-auto flex ${compact ? "h-14" : "h-16"} items-center justify-between gap-5 ${inline ? "max-w-none px-4 sm:px-6" : "max-w-[1200px] px-6"}`}>
        {!hideBrand && (
          <a href={ASSET} className="flex shrink-0 items-center gap-2.5">
            <img src={`${ASSET}/logo.svg`} alt="AI BuzzVideo" className="size-8" />
            <span
              className={`font-[family-name:var(--font-display)] text-[19px] font-extrabold tracking-tight transition-colors ${solid ? "text-[#1a1a2e]" : "text-white"}`}
            >
              AI BuzzVideo
            </span>
          </a>
        )}
        <nav
          className={`${hideBrand ? "flex-1" : ""} hidden items-center ${compact ? "gap-5 text-[13px]" : "gap-8 text-[15px]"} font-semibold transition-colors md:flex ${solid ? "text-[#6a6b7b]" : "text-white/85"}`}
        >
          <button onClick={() => notify("Marketing Studio 将跳转到首页")} className={navLink}>Marketing Studio</button>
          <div className="group/tools relative">
            <button className={`${navLink} inline-flex items-center gap-1`}>
              Tools <ChevronDown className="size-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-150 group-hover/tools:visible group-hover/tools:translate-y-0 group-hover/tools:opacity-100">
              <div className="flex w-[660px] gap-2 rounded-[20px] border border-[#ececf1] bg-white p-2 text-[#1a1a2e] shadow-[0_24px_60px_rgba(26,26,46,0.18)]">
                <div className="flex flex-1 gap-1">
                  {TOOL_GROUPS.map((g) => (
                    <div key={g.label} className="flex-1">
                      <div className="px-2.5 pb-1 pt-2 text-[12px] font-semibold text-[#9a9aa8]">
                        {g.label}
                      </div>
                      {g.items.map((it) => (
                        <button
                          key={it.label}
                          onClick={() =>
                            notify(
                              `跳转首页,输入框选中 ${g.label === "Images" ? "Image Gen" : "Video Gen"}`,
                            )
                          }
                          className="block w-full rounded-xl px-2.5 py-2 text-left text-[14px] font-medium text-[#1a1a2e] transition hover:text-[#ff5e1a]"
                        >
                          {it.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <a
                  href={ASSET}
                  className="group/f relative w-[220px] shrink-0 self-start aspect-[4/5] overflow-hidden rounded-[14px]"
                >
                  <Loop
                    src={TOOLS_FEATURED_VIDEO}
                    className="absolute inset-0 size-full object-cover transition duration-500 group-hover/f:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-4 text-left">
                    <div className="text-[15px] font-bold text-white">Product to UGC Ads</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] text-white/80">
                      Turn product shots into UGC ads
                      <ArrowRight className="size-3.5 transition group-hover/f:translate-x-0.5" />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="group/models relative">
            <button className={`${navLink} inline-flex items-center gap-1`}>
              Models <ChevronDown className="size-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-150 group-hover/models:visible group-hover/models:translate-y-0 group-hover/models:opacity-100">
              <div className="flex w-[740px] gap-3 rounded-[20px] border border-[#ececf1] bg-white p-3 text-[#1a1a2e] shadow-[0_24px_60px_rgba(26,26,46,0.18)]">
                <div className="flex flex-1 flex-col">
                  <div className="flex flex-1 gap-3">
                    {MODEL_GROUPS.map((g) => (
                      <div key={g.label} className="flex-1">
                        <div className="px-1 pb-1 text-[12px] font-semibold text-[#9a9aa8]">
                          {g.label}
                        </div>
                        <div>
                          {g.items.map((m) => (
                            <button
                              key={m.name}
                              onClick={() =>
                                notify(
                                  `跳转首页,输入框选中 ${g.type === "video" ? "Video Gen" : "Image Gen"} 和 ${m.name}`,
                                )
                              }
                              className="group/m block w-full rounded-xl px-2.5 py-2 text-left transition"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="text-[14px] font-medium text-[#1a1a2e] transition group-hover/m:text-[#ff5e1a]">
                                  {m.name}
                                </span>
                                {m.badge && (
                                  <span
                                    style={{
                                      clipPath:
                                        "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
                                    }}
                                    className={`shrink-0 px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.12em] text-white ${m.badge === "Hot" ? "bg-gradient-to-r from-[#ff6a00] to-[#ff1f6f]" : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb]"}`}
                                  >
                                    {m.badge}
                                  </span>
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href={`${ASSET}/models`}
                    className="group/sa mt-1 flex items-center gap-1 self-start rounded-xl px-2.5 py-2 text-[13px] font-semibold text-[#ff5e1a] transition"
                  >
                    See all models
                    <ArrowRight className="size-3.5 transition group-hover/sa:translate-x-0.5" />
                  </a>
                </div>
                <a
                  href={ASSET}
                  className="group/f relative w-[210px] shrink-0 self-start aspect-[9/16] overflow-hidden rounded-[14px]"
                >
                  <Loop
                    src={MODELS_FEATURED_VIDEO}
                    className="absolute inset-0 size-full object-cover transition duration-500 group-hover/f:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-4 text-left">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        30s native video
                      </span>
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        4K HD
                      </span>
                    </div>
                    <div className="text-[15px] font-bold text-white">Seedance 2.5</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] text-white/80">
                      Our newest video model
                      <ArrowRight className="size-3.5 transition group-hover/f:translate-x-0.5" />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="group/res relative">
            <button className={`${navLink} inline-flex items-center gap-1`}>
              Resources <ChevronDown className="size-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-150 group-hover/res:visible group-hover/res:translate-y-0 group-hover/res:opacity-100">
              <div className="flex h-[120px] w-[240px] items-center justify-center rounded-[20px] border border-[#ececf1] bg-white text-[13px] text-[#9a9aa8] shadow-[0_24px_60px_rgba(26,26,46,0.18)]">
                Coming soon
              </div>
            </div>
          </div>
          <a href="/prototypes/mcp" className={navLink}>MCP</a>
          <button onClick={() => notify("Pricing 将跳转到定价页")} className={navLink}>Pricing</button>
        </nav>
        {rightContent ?? (
          <Button
            className="h-9 rounded-[10px] bg-gradient-to-r from-[#FFA73C] to-[#FF5255] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(255,82,85,0.3)] transition hover:brightness-105"
            onClick={() => notify("Sign Up 将跳转到首页")}
          >
            Sign Up
          </Button>
        )}
      </div>
    </header>
  );
}
