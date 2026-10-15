"use client";

/* 开头提问卡,照 Claude 的提问做:一次一题,选项是「圆点 / 方框 + 名字 + 一行灰字说明」,推荐项排第一并标 (Recommended),
   最后一行 Other 可自己写;底部 Skip(这题按推荐 / 交给 AI)和 Submit(⌘↵)。
   多题时右上角「1 of 3」,提交一题进下一题;最后一题提交后整张卡交给对话页,换成一张「题目 / 答案」小卡。
   单选题必须有答案(选项或 Other)Submit 才可点;补拍题可全不选。 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { canSubmit, type Answers, type Question } from "../logic/questions";

/** 选项前的标记:单选圆点、多选方框 */
function Mark({ multi, on }: { multi: boolean; on: boolean }) {
  return multi ? (
    <span className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${on ? "border-[#ff5e1a] bg-[#ff5e1a] text-white" : "border-[#c9cad6] bg-white"}`}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  ) : (
    <span className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border ${on ? "border-[#ff5e1a]" : "border-[#c9cad6]"}`}>
      {on && <span className="size-2.5 rounded-full bg-[#ff5e1a]" />}
    </span>
  );
}

export function QuestionCard({ questions, onSubmit }: { questions: Question[]; onSubmit: (a: Answers) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => Object.fromEntries(questions.map((q) => [q.id, { picked: q.defaults, other: "" }])));
  /* 每题是否选了 Other(单选题里 Other 和选项互斥) */
  const [otherOn, setOtherOn] = useState<Record<string, boolean>>({});
  const otherRef = useRef<HTMLInputElement>(null);
  const q = questions[step];
  const a = answers[q.id] ?? { picked: [], other: "" };
  const last = step === questions.length - 1;
  const ready = canSubmit([q], answers) && !(otherOn[q.id] && !q.multi && !a.other?.trim());

  const pick = (value: string) => {
    setAnswers((prev) => {
      const cur = prev[q.id]?.picked ?? [];
      if (!q.multi) return { ...prev, [q.id]: { picked: [value], other: "" } };
      return { ...prev, [q.id]: { ...prev[q.id], picked: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } };
    });
    if (!q.multi) setOtherOn((o) => ({ ...o, [q.id]: false }));
  };
  const chooseOther = () => {
    setOtherOn((o) => ({ ...o, [q.id]: q.multi ? !o[q.id] : true }));
    if (!q.multi) setAnswers((prev) => ({ ...prev, [q.id]: { picked: [], other: prev[q.id]?.other ?? "" } }));
    setTimeout(() => otherRef.current?.focus(), 0);
  };
  const setOther = (other: string) => setAnswers((prev) => ({ ...prev, [q.id]: { picked: prev[q.id]?.picked ?? [], other } }));

  /* 最后一题提交时整卡交出;之前有单选题没答(用箭头跳过去的)就先跳回那一题 */
  const advance = (next: Answers) => {
    if (!last) return setStep((s) => s + 1);
    const missing = questions.findIndex((x) => !canSubmit([x], next) || (otherOn[x.id] && !x.multi && !next[x.id]?.other?.trim()));
    if (missing >= 0 && missing !== step) setStep(missing);
    else onSubmit(next);
  };
  const submit = () => ready && advance(answers);
  /* Skip:单选题回到推荐项(没有推荐就留空,交给 AI 定);多选题保持推荐勾选 */
  const skip = () => {
    const next = { ...answers, [q.id]: { picked: q.defaults, other: "" } };
    setAnswers(next);
    setOtherOn((o) => ({ ...o, [q.id]: false }));
    advance(next);
  };

  /* ⌘↵ / Ctrl+↵ 提交当前这一题 */
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ececf1] bg-white">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
        <p className="text-[14.5px] font-semibold text-[#1a1a2e]">
          {q.title}
          {q.multi && <span className="ml-2 text-[12px] font-normal text-[#9a9bb0]">Pick any</span>}
        </p>
        {/* 多题时左右箭头切题,已选的答案保留 */}
        {questions.length > 1 && (
          <span className="flex shrink-0 items-center gap-0.5 text-[12px] tabular-nums text-[#9a9bb0]">
            <button
              type="button"
              aria-label="Previous question"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="grid size-6 place-items-center rounded-md text-[#6a6b7b] transition hover:bg-[#f1f1f4] disabled:cursor-default disabled:text-[#d4d4dd] disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="tabular-nums">
              {step + 1} of {questions.length}
            </span>
            <button
              type="button"
              aria-label="Next question"
              disabled={last}
              onClick={() => setStep((s) => s + 1)}
              className="grid size-6 place-items-center rounded-md text-[#6a6b7b] transition hover:bg-[#f1f1f4] disabled:cursor-default disabled:text-[#d4d4dd] disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-4" />
            </button>
          </span>
        )}
      </div>
      <div role={q.multi ? "group" : "radiogroup"} aria-label={q.title}>
        {q.options.map((o) => {
          const on = a.picked.includes(o.value) && !(otherOn[q.id] && !q.multi);
          const recommended = !q.multi && q.defaults.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role={q.multi ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => pick(o.value)}
              className="flex w-full items-start gap-3 border-t border-[#f1f1f4] px-4 py-2.5 text-left transition hover:bg-[#fafafb]"
            >
              <Mark multi={q.multi} on={on} />
              <span className="min-w-0">
                <span className="block text-[14px] text-[#1a1a2e]">
                  {o.label}
                  {recommended && <span className="text-[#6a6b7b]"> (Recommended)</span>}
                </span>
                {o.description && <span className="mt-0.5 block text-[13px] leading-snug text-[#6a6b7b]">{o.description}</span>}
              </span>
            </button>
          );
        })}
        <div className="flex w-full items-start gap-3 border-t border-[#f1f1f4] px-4 py-2.5">
          <button type="button" role={q.multi ? "checkbox" : "radio"} aria-checked={!!otherOn[q.id]} onClick={chooseOther} className="flex items-start gap-3 text-left">
            <Mark multi={q.multi} on={!!otherOn[q.id]} />
            <span className="text-[14px] text-[#1a1a2e]">Other</span>
          </button>
          {otherOn[q.id] && (
            <input
              ref={otherRef}
              value={a.other ?? ""}
              onChange={(e) => setOther(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Type your answer"
              aria-label={`${q.title} other`}
              className="min-w-0 flex-1 border-b border-[#ececf1] bg-transparent pb-0.5 text-[14px] text-[#1a1a2e] outline-none placeholder:text-[#9a9bb0] focus:border-[#ff5e1a]"
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-[#f1f1f4] px-4 py-2.5">
        <button
          type="button"
          onClick={skip}
          className="rounded-lg bg-[#f1f1f4] px-3 py-1.5 text-[13px] font-semibold text-[#4a4b5c] transition hover:bg-[#e8e8ee]"
        >
          Skip
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a2e] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#c9cad6]"
        >
          Submit
          <kbd className="rounded bg-white/15 px-1 font-sans text-[11px] font-medium">⌘↵</kbd>
        </button>
      </div>
    </div>
  );
}
