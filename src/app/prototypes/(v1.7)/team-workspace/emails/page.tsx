import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { CATEGORIES, SAMPLE, TEMPLATES, type Template } from "./data";

/** 邮件模板索引页。每封邮件有自己的路由,这里只做总览与入口。 */

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

const TONE_DOT: Record<Template["tone"], string> = {
  normal: "#9a94a0",
  warn: "#e8892b",
  alert: "#d92d20",
};
const TONE_LABEL: Record<Template["tone"], string> = {
  normal: "常规",
  warn: "提醒",
  alert: "告警",
};

/** 索引页的主题行直接填示例数据,读起来更像真实收件箱 */
const filled = (text: string) =>
  text.replace(/\{\{(\w+)\}\}/g, (raw, key: string) => SAMPLE[key] ?? raw);

export default function EmailTemplatesIndexPage() {
  return (
    <div
      className="min-h-screen bg-[#fcfbfd] text-[#24202a]"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* 演示控制条 —— 不属于真实产品 UI,故用中文 */}
      <div className="sticky top-0 z-30 flex h-[52px] items-center gap-4 border-b border-white/10 bg-[#141425] px-4 text-[12px] text-white">
        <span className="shrink-0 font-bold tracking-wide text-white/90">
          邮件模板管理
        </span>
        <Link
          href="/prototypes/team-workspace/home"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 font-semibold text-white/75 transition hover:bg-white/20 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          回团队原型
        </Link>
        <span className="ml-auto shrink-0 text-white/45">
          共 {TEMPLATES.length} 封 · 每封都有独立链接,可单独分享
        </span>
      </div>

      <div className="mx-auto max-w-[1120px] px-5 py-10">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#28222e]">
          邮件模板
        </h1>
        <p className="mt-2 max-w-[62ch] text-[14px] leading-[1.65] text-[#6a6470]">
          团队功能会触发的通知邮件与产品发布营销邮件。点任意一封进入独立页面，可复制文案、
          切换「示例数据 / 显示变量」两种模式，也可以把那一封的链接单独发给开发。
        </p>

        {CATEGORIES.map((category) => {
          const items = TEMPLATES.filter((t) => t.category === category);
          return (
            <section key={category} className="mt-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9a94a0]">
                {category}{" "}
                <span className="font-semibold text-[#c3bcc8]">
                  · {items.length}
                </span>
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href={`/prototypes/team-workspace/emails/${tpl.id}`}
                    className="group flex flex-col rounded-2xl border border-[#f0eef2] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#e6e2ea] hover:shadow-[0_8px_24px_rgba(26,26,46,0.07)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: TONE_DOT[tpl.tone] }}
                        />
                        <span className="text-[14px] font-bold text-[#28222e]">
                          {tpl.name}
                        </span>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-[#c3bcc8] transition group-hover:text-[#e8892b]" />
                    </div>

                    <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-[1.5] text-[#3b3442]">
                      <Mail className="mt-0.5 size-3.5 shrink-0 text-[#a9a3af]" />
                      <span className="line-clamp-2">{filled(tpl.subject)}</span>
                    </p>

                    <p className="mt-3 border-t border-[#f4f2f6] pt-3 text-[12px] leading-[1.5] text-[#8a8490]">
                      <span className="font-semibold text-[#6a6470]">触发</span>{" "}
                      {tpl.trigger}
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.5] text-[#8a8490]">
                      <span className="font-semibold text-[#6a6470]">收件人</span>{" "}
                      {tpl.to}
                    </p>

                    <span
                      className="mt-3 self-start rounded-md px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        background: `${TONE_DOT[tpl.tone]}1f`,
                        color: TONE_DOT[tpl.tone],
                      }}
                    >
                      {TONE_LABEL[tpl.tone]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
