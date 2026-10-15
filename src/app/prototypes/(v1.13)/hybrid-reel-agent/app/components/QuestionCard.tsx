"use client";

/* 开头提问卡(像 Claude 的选择弹卡):单选题点一下即选中,多选题可多勾;每题都能填 Other。
   提交后由对话页换成一条「Q / A」用户气泡,卡片本身消失。 */

import { useState } from "react";
import { Check } from "lucide-react";
import type { Answers, Question } from "../logic/questions";

export function QuestionCard({ questions, onSubmit }: { questions: Question[]; onSubmit: (a: Answers) => void }) {
  const [answers, setAnswers] = useState<Answers>(() =>
    Object.fromEntries(questions.map((q) => [q.id, { picked: q.defaults, other: "" }])),
  );
  const toggle = (q: Question, value: string) =>
    setAnswers((prev) => {
      const cur = prev[q.id]?.picked ?? [];
      const picked = q.multi ? (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]) : [value];
      return { ...prev, [q.id]: { ...prev[q.id], picked } };
    });
  const setOther = (q: Question, other: string) =>
    setAnswers((prev) => ({
      ...prev,
      /* 单选题填了 Other 就取消预选项,两者只能有一个 */
      [q.id]: { picked: q.multi || !other ? prev[q.id]?.picked ?? [] : [], other },
    }));

  return (
    <div className="rounded-2xl border border-[#ececf1] bg-white p-4">
      <div className="space-y-5">
        {questions.map((q) => (
          <fieldset key={q.id}>
            <legend className="mb-2 text-[14px] font-semibold text-[#1a1a2e]">
              {q.title}
              {q.multi && <span className="ml-2 text-[12px] font-normal text-[#9a9bb0]">Pick any</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const on = answers[q.id]?.picked.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    role={q.multi ? "checkbox" : "radio"}
                    aria-checked={on}
                    onClick={() => toggle(q, o.value)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition ${
                      on ? "border-[#ff5e1a] bg-[#fff3ec] text-[#d24f14]" : "border-[#ececf1] bg-white text-[#4a4b5c] hover:bg-[#f6f7f9]"
                    }`}
                  >
                    {on && <Check className="size-3.5" />}
                    {o.label}
                  </button>
                );
              })}
              <input
                value={answers[q.id]?.other ?? ""}
                onChange={(e) => setOther(q, e.target.value)}
                placeholder="Other…"
                aria-label={`${q.title} other`}
                className="min-w-[140px] flex-1 rounded-full border border-[#ececf1] px-3 py-1.5 text-[13px] text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0] focus:border-[#ff5e1a]"
              />
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onSubmit(answers)}
          className="rounded-full bg-[#1a1a2e] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-black"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
