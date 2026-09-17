"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Search, Sparkles } from "lucide-react";

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/**
 * 这是给 Monica 选型用的工作页,不是产品界面 —— 所以页面文案用中文。
 * 数据 2026-09-17 从 OpenRouter /api/v1/models 拉取后人工筛选:
 * 只留各家当前世代、可商用的正式版文本模型,剔除 preview / free / batch /
 * 代码专用 / 安全审核 / 纯图像视频模型,以及已被新版本取代的上一代。
 */
type Model = {
  name: string;
  /** OpenRouter slug */
  id: string;
  /** 发布日 */
  date: string;
  /** 每百万 token:输入 / 输出 / 缓存读(null = 该模型不支持缓存计价) */
  input: number;
  output: number;
  cacheRead: number | null;
  /** 上下文窗口(token) */
  ctx: number;
  /** 输入模态 */
  modalities: string[];
  /** 一句话定位 */
  note: string;
  /** 我在前面几轮里建议接入的那批 */
  recommended?: boolean;
};

type VendorGroup = { vendor: string; models: Model[] };

const CATALOG: VendorGroup[] = [
  {
    vendor: "OpenAI",
    models: [
      { name: "GPT-6 Astra", id: "openai/gpt-6-astra", date: "2026-09-04", input: 10, output: 50, cacheRead: 1, ctx: 1_050_000, modalities: ["文本", "图像", "文件"], note: "当前旗舰,强在超长流程 agent 与电脑/浏览器操作", recommended: true },
      { name: "GPT-6 Astra Pro", id: "openai/gpt-6-astra-pro", date: "2026-09-04", input: 10, output: 50, cacheRead: 1, ctx: 1_050_000, modalities: ["文本", "图像", "文件"], note: "Astra 的更高算力档,同价但更慢" },
      { name: "GPT-5.6 Sol", id: "openai/gpt-5.6-sol", date: "2026-07-09", input: 2, output: 10, cacheRead: 0.2, ctx: 1_050_000, modalities: ["文本", "图像", "文件"], note: "推理档,质量与成本之间的平衡点" },
      { name: "GPT-5.6 Terra", id: "openai/gpt-5.6-terra", date: "2026-07-09", input: 2, output: 12, cacheRead: 0.2, ctx: 1_050_000, modalities: ["文本", "图像", "文件"], note: "与 Sol 同级,偏长文本任务" },
      { name: "GPT-5.6 Luna", id: "openai/gpt-5.6-luna", date: "2026-07-09", input: 0.2, output: 1.2, cacheRead: 0.02, ctx: 1_050_000, modalities: ["文本", "图像", "文件"], note: "全平台用量第一(17.3T/周),极致性价比的跑量款", recommended: true },
      { name: "GPT-5.6 Luna Pro", id: "openai/gpt-5.6-luna-pro", date: "2026-07-09", input: 0.2, output: 1.2, cacheRead: 0.02, ctx: 1_050_000, modalities: ["文本", "图像", "文件"], note: "Luna 的高算力档,同价" },
    ],
  },
  {
    vendor: "Anthropic",
    models: [
      { name: "Claude Fable 5.1", id: "anthropic/claude-fable-5.1", date: "2026-09-01", input: 10, output: 50, cacheRead: 0.25, ctx: 1_000_000, modalities: ["文本", "图像", "文件"], note: "智能榜并列第一,长文案与品牌语气最强", recommended: true },
      { name: "Claude Opus 5", id: "anthropic/claude-opus-5", date: "2026-07-24", input: 5, output: 25, cacheRead: 0.5, ctx: 1_000_000, modalities: ["文本", "图像", "文件"], note: "深度推理,适合复杂策略与长 brief", recommended: true },
      { name: "Claude Sonnet 5", id: "anthropic/claude-sonnet-5", date: "2026-06-30", input: 2, output: 10, cacheRead: 0.2, ctx: 1_000_000, modalities: ["文本", "图像", "文件"], note: "Anthropic 中间档,质量接近 Opus 但便宜一半以上" },
    ],
  },
  {
    vendor: "Google",
    models: [
      { name: "Gemini 3.8 Flash", id: "google/gemini-3.8-flash", date: "2026-09-02", input: 0.75, output: 3.75, cacheRead: 0.075, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "最新 Flash,长流程 agent 定位,模态最全", recommended: true },
      { name: "Gemini 3.7 Flash", id: "google/gemini-3.7-flash", date: "2026-08-13", input: 0.75, output: 3.75, cacheRead: 0.075, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "上一代 Flash,与 3.8 同价" },
      { name: "Gemini 3.5 Flash", id: "google/gemini-3.5-flash", date: "2026-05-19", input: 1.5, output: 9, cacheRead: 0.15, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "更老的一代,反而比 3.8 贵一倍,不建议" },
      { name: "Gemini 3.5 Flash-Lite", id: "google/gemini-3.5-flash-lite", date: "2026-07-21", input: 0.3, output: 2.5, cacheRead: 0.03, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "最新 Lite 档,最快最省", recommended: true },
      { name: "Gemini 3.1 Flash-Lite", id: "google/gemini-3.1-flash-lite", date: "2026-05-07", input: 0.25, output: 1.5, cacheRead: 0.025, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "上一代 Lite,输出比 3.5 Lite 还便宜" },
    ],
  },
  {
    vendor: "xAI",
    models: [
      { name: "Grok 4.6", id: "x-ai/grok-4.6", date: "2026-08-12", input: 2, output: 6, cacheRead: 0.5, ctx: 500_000, modalities: ["文本", "图像", "文件"], note: "唯一有实时社媒语料,追热点蹭趋势别家替代不了", recommended: true },
      { name: "Grok 4.5", id: "x-ai/grok-4.5", date: "2026-07-08", input: 2, output: 6, cacheRead: 0.3, ctx: 500_000, modalities: ["文本", "图像", "文件"], note: "上一代,同价但缓存读更便宜" },
      { name: "Grok 4.3", id: "x-ai/grok-4.3", date: "2026-04-30", input: 1.25, output: 2.5, cacheRead: 0.2, ctx: 1_000_000, modalities: ["文本", "图像", "文件"], note: "更老但上下文 1M、输出价只要一半" },
    ],
  },
  {
    vendor: "Qwen 阿里",
    models: [
      { name: "Qwen3.8 Max", id: "qwen/qwen3.8-max-0902", date: "2026-09-03", input: 2, output: 6, cacheRead: 0.25, ctx: 1_000_000, modalities: ["文本", "图像", "视频"], note: "智能分 53.4 与 Fable 5.1 并列第一,价格只要 GPT-6 Astra 的五分之一", recommended: true },
      { name: "Qwen3.8 Flash", id: "qwen/qwen3.8-flash", date: "2026-08-26", input: 0.15, output: 0.47, cacheRead: 0.016, ctx: 1_000_000, modalities: ["文本", "图像", "视频"], note: "极致便宜,还能读视频" },
    ],
  },
  {
    vendor: "DeepSeek",
    models: [
      { name: "DeepSeek V4.1 Flash", id: "deepseek/deepseek-v4.1-flash", date: "2026-09-10", input: 0.15, output: 0.6, cacheRead: 0.003, ctx: 1_048_576, modalities: ["文本", "图像"], note: "用量榜第五,缓存读 $0.003 是全场最低" },
      { name: "DeepSeek V4 Pro", id: "deepseek/deepseek-v4-pro-0813", date: "2026-08-12", input: 0.66, output: 1.98, cacheRead: 0.022, ctx: 1_048_576, modalities: ["文本"], note: "推理档,但只吃纯文本,读不了产品图" },
    ],
  },
  {
    vendor: "Z.ai 智谱",
    models: [
      { name: "GLM 5.3", id: "z-ai/glm-5.3", date: "2026-08-18", input: 1.4, output: 4.4, cacheRead: 0.26, ctx: 1_310_720, modalities: ["文本"], note: "上下文 1.3M 是全场最长,但纯文本" },
      { name: "GLM 5.3 Flash", id: "z-ai/glm-5.3-flash", date: "2026-08-26", input: 0.09, output: 0.3, cacheRead: 0.018, ctx: 1_310_720, modalities: ["文本", "图像", "视频"], note: "用量榜第三,输入 $0.09 极便宜且支持视频" },
    ],
  },
  {
    vendor: "Moonshot 月之暗面",
    models: [
      { name: "Kimi K3", id: "moonshotai/kimi-k3", date: "2026-07-16", input: 3, output: 15, cacheRead: 0.3, ctx: 1_048_576, modalities: ["文本", "图像", "视频"], note: "智能榜第十,长文本强项" },
    ],
  },
  {
    vendor: "Meta",
    models: [
      { name: "Muse Spark 1.3", id: "meta/muse-spark-1.3", date: "2026-09-02", input: 1.25, output: 4.25, cacheRead: 0.15, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "模态最全的一档,价格介于 Flash 与旗舰之间" },
      { name: "Muse Spark 1.3 Contributor", id: "meta/muse-spark-1.3-contributor", date: "2026-09-02", input: 0.1, output: 0.2, cacheRead: 0.002, ctx: 1_048_576, modalities: ["文本", "图像", "视频", "音频", "文件"], note: "同款超低价版本,代价是数据会被用于训练 —— 商用要谨慎" },
    ],
  },
  {
    vendor: "MiniMax",
    models: [
      { name: "MiniMax M3", id: "minimax/minimax-m3", date: "2026-05-31", input: 0.3, output: 1.2, cacheRead: 0.06, ctx: 1_048_576, modalities: ["文本", "图像", "视频"], note: "便宜且能读视频,适合批量看素材" },
    ],
  },
  {
    vendor: "Mistral",
    models: [
      { name: "Mistral Medium 3.5", id: "mistralai/mistral-medium-3-5", date: "2026-04-30", input: 1.5, output: 7.5, cacheRead: null, ctx: 262_144, modalities: ["文本", "图像", "文件"], note: "欧洲厂商,数据合规是卖点;不支持缓存计价" },
    ],
  },
  {
    vendor: "Sakana 日本",
    models: [
      { name: "Fugu Ultra v2", id: "sakana/fugu-ultra-v2", date: "2026-09-11", input: 5, output: 30, cacheRead: 0.5, ctx: 1_000_000, modalities: ["文本", "图像", "文件"], note: "日语内容是强项,做日本市场可考虑" },
      { name: "Fugu Max", id: "sakana/fugu-max", date: "2026-09-11", input: 2, output: 6, cacheRead: 0.25, ctx: 1_000_000, modalities: ["文本", "图像", "文件"], note: "同门中档,价格对标 Qwen3.8 Max" },
    ],
  },
  {
    vendor: "NVIDIA",
    models: [
      { name: "Nemotron 3 Ultra", id: "nvidia/nemotron-3-ultra-550b-a55b", date: "2026-06-04", input: 0.625, output: 3.125, cacheRead: 0.1875, ctx: 262_144, modalities: ["文本"], note: "开源权重,可自托管;用量榜第九靠的是免费版" },
    ],
  },
  {
    vendor: "Inception",
    models: [
      { name: "Mercury 2.5", id: "inception/mercury-2.5", date: "2026-09-08", input: 0.04, output: 0.15, cacheRead: 0.004, ctx: 260_000, modalities: ["文本"], note: "扩散式 LLM,出字速度远超同价位;纯文本" },
    ],
  },
];

const ALL_MODELS = CATALOG.flatMap(({ models }) => models);
const RECOMMENDED_IDS = ALL_MODELS.filter(({ recommended }) => recommended).map(({ id }) => id);
const STORAGE_KEY = "llm-catalog-selection";

function fmtPrice(value: number) {
  if (value >= 1) return `$${value}`;
  return `$${value.toFixed(value < 0.01 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function fmtCtx(ctx: number) {
  return ctx >= 1_000_000 ? `${(ctx / 1_000_000).toFixed(ctx % 1_000_000 === 0 ? 0 : 1)}M` : `${Math.round(ctx / 1000)}K`;
}

export default function LlmCatalogPage() {
  const [selected, setSelected] = useState<string[]>(RECOMMENDED_IDS);
  const [query, setQuery] = useState("");
  const [multimodalOnly, setMultimodalOnly] = useState(false);
  const [cheapOnly, setCheapOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  // 勾选结果存本地,刷新不丢
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelected(JSON.parse(saved));
    } catch {
      /* 隐私模式下读不到就用默认值 */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      /* 存不进去不影响使用 */
    }
  }, [selected]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.map(({ vendor, models }) => ({
      vendor,
      models: models.filter((m) => {
        if (q && !`${m.name} ${m.id} ${m.note} ${vendor}`.toLowerCase().includes(q)) return false;
        if (multimodalOnly && !m.modalities.includes("图像")) return false;
        if (cheapOnly && m.input > 1) return false;
        return true;
      }),
    })).filter(({ models }) => models.length > 0);
  }, [query, multimodalOnly, cheapOnly]);

  const visibleCount = groups.reduce((sum, g) => sum + g.models.length, 0);

  const copySelection = async () => {
    const lines = CATALOG.flatMap(({ vendor, models }) => {
      const picked = models.filter((m) => selected.includes(m.id));
      if (picked.length === 0) return [];
      return [`## ${vendor}`, ...picked.map((m) => `- ${m.name} (${m.id}) — ${m.note}`), ""];
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 剪贴板不可用时静默失败 */
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f6] pb-32" style={{ fontFamily: APPLE_FONT }}>
      <div className="mx-auto max-w-[1080px] px-6">
        <header className="pt-14">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#ff5e1a]">模型选型清单</p>
          <h1 className="mt-2 text-[34px] font-extrabold leading-[1.15] tracking-tight text-[#1a1a2e]">
            市面上在跑的商用 LLM
          </h1>
          <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-[#6a6b7b]">
            按厂商分组,勾选你想接进 Marketing Agent 的模型。数据 2026-09-17 从 OpenRouter 的模型接口拉取后人工筛选 ——
            只保留各家当前世代、可商用的正式版文本模型,已剔除预览版、免费版、代码专用、安全审核和纯图像/视频模型。
            价格单位是每百万 token。默认勾的是我前面建议的那 8 个,你可以随意改;勾选会存在本地,刷新不丢。
          </p>
        </header>

        {/* 工具条 */}
        <div className="sticky top-0 z-20 -mx-6 mt-8 bg-[#faf8f6]/90 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#b6b7be]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜模型名、厂商或定位"
                className="w-full rounded-xl border border-[#ececf1] bg-white py-2.5 pl-9 pr-3 text-[14px] text-[#1a1a2e] outline-none transition placeholder:text-[#b6b7be] focus:border-[#ff5e1a]"
              />
            </div>
            <button
              type="button"
              onClick={() => setMultimodalOnly((v) => !v)}
              className={`rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition ${
                multimodalOnly ? "border-[#ff5e1a] bg-[#fff3ec] text-[#ff5e1a]" : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"
              }`}
            >
              只看能读图的
            </button>
            <button
              type="button"
              onClick={() => setCheapOnly((v) => !v)}
              className={`rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition ${
                cheapOnly ? "border-[#ff5e1a] bg-[#fff3ec] text-[#ff5e1a]" : "border-[#ececf1] bg-white text-[#6a6b7b] hover:border-[#d4d3df]"
              }`}
            >
              输入 ≤ $1
            </button>
            <button
              type="button"
              onClick={() => setSelected(RECOMMENDED_IDS)}
              className="rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#6a6b7b] transition hover:border-[#d4d3df]"
            >
              恢复建议清单
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-xl border border-[#ececf1] bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#6a6b7b] transition hover:border-[#d4d3df]"
            >
              全部取消
            </button>
          </div>
          <p className="mt-2.5 text-[12px] text-[#a0a1aa]">
            共 {ALL_MODELS.length} 个模型 · 当前显示 {visibleCount} 个 · 已勾选 <b className="text-[#ff5e1a]">{selected.length}</b> 个
          </p>
        </div>

        {/* 分组列表 */}
        <div className="mt-2 space-y-5">
          {groups.map(({ vendor, models }) => {
            const ids = models.map((m) => m.id);
            const allPicked = ids.every((id) => selected.includes(id));
            return (
              <section key={vendor} className="overflow-hidden rounded-[18px] border border-[#ececf1] bg-white">
                <div className="flex items-center justify-between border-b border-[#f4f4f7] px-5 py-3.5">
                  <h2 className="text-[15px] font-bold text-[#1a1a2e]">
                    {vendor}
                    <span className="ml-2 text-[12px] font-normal text-[#a0a1aa]">{models.length} 个</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected((prev) => (allPicked ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]))
                    }
                    className="text-[12px] font-medium text-[#8d8e9d] transition hover:text-[#ff5e1a]"
                  >
                    {allPicked ? "取消本组" : "本组全选"}
                  </button>
                </div>
                <ul>
                  {models.map((m) => {
                    const isPicked = selected.includes(m.id);
                    return (
                      <li key={m.id} className="border-b border-[#f4f4f7] last:border-b-0">
                        <label className={`flex cursor-pointer items-start gap-3 px-5 py-3.5 transition ${isPicked ? "bg-[#fffaf7]" : "hover:bg-[#fafafd]"}`}>
                          <span
                            className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition ${
                              isPicked ? "border-[#ff5e1a] bg-[#ff5e1a]" : "border-[#d4d3df] bg-white"
                            }`}
                          >
                            {isPicked && <Check className="size-3 text-white" strokeWidth={3} />}
                          </span>
                          <input type="checkbox" checked={isPicked} onChange={() => toggle(m.id)} className="sr-only" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[14px] font-semibold text-[#1a1a2e]">{m.name}</span>
                              {m.recommended && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ec] px-2 py-px text-[10px] font-semibold text-[#ff5e1a]">
                                  <Sparkles className="size-2.5" />
                                  建议
                                </span>
                              )}
                              <code className="text-[11px] text-[#b6b7be]">{m.id}</code>
                            </span>
                            <span className="mt-1 block text-[12.5px] leading-[18px] text-[#6a6b7b]">{m.note}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#a0a1aa]">
                              <span>{m.date}</span>
                              <span className="text-[#e4e4ea]">|</span>
                              <span>
                                入 <b className="font-semibold text-[#6a6b7b]">{fmtPrice(m.input)}</b> · 出{" "}
                                <b className="font-semibold text-[#6a6b7b]">{fmtPrice(m.output)}</b>
                                {m.cacheRead !== null && (
                                  <> · 缓存读 <b className="font-semibold text-[#6a6b7b]">{fmtPrice(m.cacheRead)}</b></>
                                )}
                                {m.cacheRead === null && <> · 无缓存价</>}
                              </span>
                              <span className="text-[#e4e4ea]">|</span>
                              <span>{fmtCtx(m.ctx)} 上下文</span>
                              <span className="text-[#e4e4ea]">|</span>
                              <span>{m.modalities.join(" / ")}</span>
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {/* 底部结果条 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#ececf1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-3.5">
          <p className="min-w-0 flex-1 truncate text-[13px] text-[#6a6b7b]">
            {selected.length === 0 ? (
              "还没勾选任何模型"
            ) : (
              <>
                已选 <b className="text-[#1a1a2e]">{selected.length}</b> 个:{" "}
                <span className="text-[#8d8e9d]">
                  {ALL_MODELS.filter((m) => selected.includes(m.id)).map((m) => m.name).join("、")}
                </span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={copySelection}
            disabled={selected.length === 0}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#ff5255] to-[#ffa73c] px-5 text-[14px] font-bold text-white shadow-[0_3px_0_#b65a42] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-40"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "已复制" : "复制清单"}
          </button>
        </div>
      </div>
    </main>
  );
}
