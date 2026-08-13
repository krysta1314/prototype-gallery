'use client';

import { useState } from 'react';
import { GUIDE, type PlanId } from '../../lib/pricing/pricing';

type Volume = 'explore' | 'low' | 'mid' | 'high';
type Format = 'image' | 'video' | 'mix';
type Creator = 'solo' | 'team' | 'agency' | 'enterprise';

type Recommendation = PlanId | 'enterprise';

interface Answers {
  volume: Volume;
  format: Format;
  creator: Creator;
}

interface QuizStateIntro { step: 'intro' }
interface QuizStateQ { step: 'q1' | 'q2' | 'q3'; answers: Partial<Answers> }
interface QuizStateResult { step: 'result'; answers: Answers; recommendation: Recommendation }
type QuizState = QuizStateIntro | QuizStateQ | QuizStateResult;

const QUESTION_TEXT: Record<'q1' | 'q2' | 'q3', { title: string; key: keyof Answers; options: { value: string; label: string; sub?: string }[] }> = {
  q1: {
    title: 'How many ad variations do you test per month?',
    key: 'volume',
    options: [
      { value: 'explore', label: 'Just exploring',           sub: 'Haven’t started production yet' },
      { value: 'low',     label: '1–10 per month',      sub: 'Occasional campaigns' },
      { value: 'mid',     label: '11–30 per month',     sub: 'Weekly testing & iteration' },
      { value: 'high',    label: '30+ per month',            sub: 'High-volume / agency workflow' },
    ],
  },
  q2: {
    title: 'What is your primary ad format?',
    key: 'format',
    options: [
      { value: 'image', label: 'Static image ads',                 sub: 'Product shots, social posts' },
      { value: 'video', label: 'Video ads (TikTok / Reels / Shorts)', sub: 'Needs cinematic-quality engines' },
      { value: 'mix',   label: 'Mix of images and videos',         sub: 'Full creative pipeline' },
    ],
  },
  q3: {
    title: 'Who is creating the ads?',
    key: 'creator',
    options: [
      { value: 'solo',       label: 'Just me',                          sub: 'Solo creator / founder' },
      { value: 'team',       label: 'Small marketing team (2–5)',  sub: 'In-house DTC / brand team' },
      { value: 'agency',     label: 'Agency producing for clients',     sub: 'Multi-brand workflow' },
      { value: 'enterprise', label: 'Larger team / organization (10+)', sub: 'Needs seats, SLA, compliance' },
    ],
  },
};

/**
 * Scoring — 按同事 "Rig the Quiz Logic for Performance Outcomes" 建议:
 * Volume / Creator / Format 都结构性偏向 Pro / Ultra / Enterprise(高 margin tier)。
 * 极少数组合(Just exploring + image + solo)才会推回 Free / Starter。
 */
function computeRecommendation(a: Answers): Recommendation {
  const score: Record<Recommendation, number> = {
    free: 0, starter: 0, pro: 0, ultra: 0, enterprise: 0,
  };

  // Q1 — Volume(主轴):11-30/月直接 bypass Starter,30+/月锚到 Ultra
  if (a.volume === 'explore') score.free += 5;
  if (a.volume === 'low')     score.starter += 3;
  if (a.volume === 'mid')     { score.pro += 4; score.starter -= 3; }     // bypass Starter
  if (a.volume === 'high')    { score.ultra += 4; score.pro += 1; }

  // Q2 — Format:Video → Pro+(Seedance 2.0);Image-only 保持灵活
  if (a.format === 'image') score.starter += 1;
  if (a.format === 'video') { score.pro += 3; score.ultra += 1; score.starter -= 2; }
  if (a.format === 'mix')   { score.pro += 2; score.ultra += 1; }

  // Q3 — Creator:Agency 锚到 Ultra,Enterprise team 锚到 Enterprise
  if (a.creator === 'solo')       { score.starter += 1; score.pro += 1; }
  if (a.creator === 'team')       { score.pro += 2; score.ultra += 1; }
  if (a.creator === 'agency')     { score.ultra += 4; score.enterprise += 1; }
  if (a.creator === 'enterprise') { score.enterprise += 6; score.ultra += 1; }

  // 选最高分
  const entries = Object.entries(score) as [Recommendation, number][];
  entries.sort((x, y) => y[1] - x[1]);
  return entries[0][0];
}

const RECOMMENDATION_REASON: Record<Recommendation, string> = {
  free:       'Start free, no credit card needed — get a feel for the product before committing.',
  starter:    'For occasional ad campaigns at the lowest entry point — all image models + most video models.',
  pro:        'The sweet spot for weekly ad production — full model access including Seedance 2.0, and technical support.',
  ultra:      'Built for high-volume workflows — highest credit allowance, Long Video Early Access, and priority processing.',
  enterprise: 'For larger teams that need multi-user seats, dedicated capacity, API access, and a custom SLA.',
};

const RECOMMENDATION_HUE: Record<Recommendation, string> = {
  free:       'border-neutral-300 bg-white',
  starter:    'border-[#0a0a0a] bg-neutral-50',
  pro:        'border-[#f97316] bg-orange-50',
  ultra:      'border-[#7c3aed] bg-violet-50',
  enterprise: 'border-emerald-500 bg-emerald-50',
};

const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  free: 'Free', starter: 'Starter', pro: 'Pro', ultra: 'Ultra', enterprise: 'Enterprise',
};

// Input-echoing phrases — 把用户的 quiz 答案 mirror 回 ResultCard,降低"销售推荐"质感
const VOLUME_PHRASES: Record<Volume, string> = {
  explore: 'are just exploring AI ads',
  low:     'test 1–10 ad variations per month',
  mid:     'test 11–30 ad variations every month',
  high:    'ship 30+ ad variations at high volume',
};
const FORMAT_PHRASES: Record<Format, string> = {
  image: 'focus on static image ads',
  video: 'create video ads (TikTok / Reels / Shorts)',
  mix:   'work across both images and videos',
};
const CREATOR_PHRASES: Record<Creator, string> = {
  solo:       'work solo',
  team:       'lead a small marketing team',
  agency:     'run an agency producing for multiple clients',
  enterprise: 'work in a larger organization (10+ team)',
};

function buildEcho(a: Answers): string {
  return `Because you ${VOLUME_PHRASES[a.volume]}, ${FORMAT_PHRASES[a.format]}, and ${CREATOR_PHRASES[a.creator]}`;
}

export function PlanGuide() {
  const [state, setState] = useState<QuizState>({ step: 'intro' });

  const startQuiz = () => setState({ step: 'q1', answers: {} });
  const resetQuiz = () => setState({ step: 'intro' });

  const answerQuestion = (key: keyof Answers, value: string) => {
    if (state.step !== 'q1' && state.step !== 'q2' && state.step !== 'q3') return;
    const next = { ...state.answers, [key]: value } as Partial<Answers>;
    if (state.step === 'q1') setState({ step: 'q2', answers: next });
    else if (state.step === 'q2') setState({ step: 'q3', answers: next });
    else {
      // q3 finished
      const full = next as Answers;
      setState({ step: 'result', answers: full, recommendation: computeRecommendation(full) });
    }
  };

  return (
    <section className="mt-20 bg-neutral-50 rounded-2xl p-8 sm:p-12">
      <header className="text-center mb-8">
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">
          Not sure which plan is right for you?
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Answer 3 quick questions and we&rsquo;ll point you to the best fit.
        </p>

        {state.step === 'intro' && (
          <button
            type="button"
            onClick={startQuiz}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#0a0a0a] text-white text-sm font-semibold hover:opacity-90"
          >
            Take the 30-second quiz →
          </button>
        )}
      </header>

      {/* Quiz UI */}
      {(state.step === 'q1' || state.step === 'q2' || state.step === 'q3') && (
        <QuestionStep
          stepKey={state.step}
          onAnswer={answerQuestion}
          onCancel={resetQuiz}
        />
      )}

      {state.step === 'result' && (
        <ResultCard
          recommendation={state.recommendation}
          answers={state.answers}
          onRetake={startQuiz}
        />
      )}

      {/* 4 persona cards — 始终可见作为 reference */}
      <div className="mt-10 pt-10 border-t border-neutral-200">
        <h3 className="text-center text-[13px] font-semibold uppercase tracking-wider text-neutral-500 mb-6">
          Or browse the plans by persona
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {GUIDE.map(g => {
            // Persona 卡底部 CTA — 让"看完描述觉得对号入座"的用户能立刻行动,不必滚回顶部
            const ctaLabel = g.id === 'enterprise' ? 'Contact Sales →' : `Choose ${g.name} →`;
            const ctaHref = g.id === 'enterprise' ? '#enterprise' : '#plans';
            return (
              <article key={g.id} className="flex flex-col">
                <header className="pb-4 border-b border-neutral-200">
                  <h4 className="text-2xl font-bold tracking-tight">{g.name}</h4>
                  <p className="mt-1 text-[13px] text-neutral-500 leading-snug">{g.tagline}</p>
                </header>

                <GuideList label="Suitable for" items={g.suitableFor} />
                <GuideList label="Core features" items={g.coreFeatures} />

                <a
                  href={ctaHref}
                  className="mt-auto pt-5 text-[13px] font-semibold text-[#0a0a0a] hover:text-neutral-700 inline-flex items-center gap-1 self-start"
                >
                  {ctaLabel}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface QuestionStepProps {
  stepKey: 'q1' | 'q2' | 'q3';
  onAnswer: (key: keyof Answers, value: string) => void;
  onCancel: () => void;
}

function QuestionStep({ stepKey, onAnswer, onCancel }: QuestionStepProps) {
  const q = QUESTION_TEXT[stepKey];
  const stepNum = stepKey === 'q1' ? 1 : stepKey === 'q2' ? 2 : 3;

  return (
    <div className="max-w-xl mx-auto">
      {/* 进度 */}
      <div className="flex items-center gap-2 justify-center mb-6">
        {[1, 2, 3].map(n => (
          <span
            key={n}
            className={`h-1.5 w-8 rounded-full ${n <= stepNum ? 'bg-[#0a0a0a]' : 'bg-neutral-300'}`}
          />
        ))}
        <span className="ml-2 text-xs text-neutral-500">Step {stepNum} of 3</span>
      </div>

      <h3 className="text-center text-lg sm:text-xl font-bold tracking-tight mb-5">
        {q.title}
      </h3>

      <div className="space-y-2">
        {q.options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAnswer(q.key, opt.value)}
            className="w-full text-left px-4 py-3 rounded-xl border border-neutral-300 bg-white hover:border-[#0a0a0a] hover:bg-neutral-50 transition-colors"
          >
            <div className="text-sm font-semibold text-[#0a0a0a]">{opt.label}</div>
            {opt.sub && <div className="text-xs text-neutral-500 mt-0.5">{opt.sub}</div>}
          </button>
        ))}
      </div>

      <div className="text-center mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-neutral-500 hover:text-neutral-700 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface ResultCardProps {
  recommendation: Recommendation;
  answers: Answers;
  onRetake: () => void;
}

function ResultCard({ recommendation, answers, onRetake }: ResultCardProps) {
  const label = RECOMMENDATION_LABEL[recommendation];
  const reason = RECOMMENDATION_REASON[recommendation];
  const hue = RECOMMENDATION_HUE[recommendation];
  // 跳转 anchor:plan 跳 #plans;enterprise 跳 #enterprise(暂时无 anchor)
  const anchor = recommendation === 'enterprise' ? '#enterprise' : '#plans';
  // 高 intent CTA 文案 — 不再"see plan"被动,改成"get started / contact sales"主动
  const ctaLabel =
    recommendation === 'enterprise' ? 'Contact Sales →' :
    recommendation === 'free' ? 'Start for Free →' :
    `Get Started with ${label} →`;

  return (
    <div className={`max-w-xl mx-auto rounded-2xl border-2 p-6 sm:p-8 ${hue}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
        We recommend
      </div>
      {/* Input-echoing — 把用户答案 mirror 回来,让推荐显得是基于他们的输入,不是销售推 */}
      <p className="text-[13px] text-neutral-700 leading-relaxed mb-2">
        🎯 <b>{buildEcho(answers)}</b>, we highly recommend:
      </p>
      <h3 className="text-3xl font-bold tracking-tight mb-2">{label}</h3>
      <p className="text-sm text-neutral-700 leading-relaxed mb-5">{reason}</p>

      <div className="flex flex-wrap gap-3">
        <a
          href={anchor}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[10px] bg-[#0a0a0a] text-white text-sm font-semibold hover:opacity-90"
        >
          {ctaLabel}
        </a>
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center px-5 py-2.5 rounded-[10px] border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-white"
        >
          Retake quiz
        </button>
      </div>
    </div>
  );
}

function GuideList({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="mt-5">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
        {label}
      </h4>
      <ul className="mt-2.5 space-y-1.5">
        {items.map(i => (
          <li
            key={i}
            className="relative pl-3.5 text-[13px] leading-[1.55] text-neutral-700"
          >
            <span aria-hidden className="absolute left-0 top-[9px] w-1 h-1 rounded-full bg-neutral-300" />
            {i}
          </li>
        ))}
      </ul>
    </section>
  );
}
