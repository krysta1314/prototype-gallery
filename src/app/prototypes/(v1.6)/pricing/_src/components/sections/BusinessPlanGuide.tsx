'use client';

import { useState } from 'react';
import { BUSINESS_GUIDE, type BusinessPlanId } from '../../lib/pricing/business';
import { GuideList } from './PlanGuide';
import { ContactSalesModal } from './ContactSalesModal';

type Seats = 'small' | 'mid' | 'large';
type Volume = 'low' | 'mid' | 'high';
type Need = 'shared' | 'control' | 'compliance';

interface Answers {
  seats: Seats;
  volume: Volume;
  need: Need;
}

interface StateIntro { step: 'intro' }
interface StateQ { step: 'q1' | 'q2' | 'q3'; answers: Partial<Answers> }
interface StateResult { step: 'result'; answers: Answers; recommendation: BusinessPlanId }
type QuizState = StateIntro | StateQ | StateResult;

const QUESTIONS: Record<
  'q1' | 'q2' | 'q3',
  { title: string; key: keyof Answers; options: { value: string; label: string; sub?: string }[] }
> = {
  q1: {
    title: 'How many people need a seat?',
    key: 'seats',
    options: [
      { value: 'small', label: '2–9 people',        sub: 'One in-house team or a small agency' },
      { value: 'mid',   label: '10–30 people',      sub: 'Multiple pods or brands in parallel' },
      { value: 'large', label: 'More than 30',      sub: 'Org-wide rollout, unlimited seats' },
    ],
  },
  q2: {
    title: 'How many ad variations does the team ship per month?',
    key: 'volume',
    options: [
      { value: 'low',  label: 'Under 50',   sub: 'A few campaigns a month' },
      { value: 'mid',  label: '50–200',     sub: 'Weekly production across brands' },
      { value: 'high', label: '200+',       sub: 'Always-on, high-volume output' },
    ],
  },
  q3: {
    title: 'What matters most for rolling this out?',
    key: 'need',
    options: [
      { value: 'shared',     label: 'Shared credits and shared brand assets', sub: 'Stop buying one subscription per person' },
      { value: 'control',    label: 'Roles, per-member analytics and priority processing', sub: 'Visibility and control over how credits are spent' },
      { value: 'compliance', label: 'SSO, SLA, API access and a security review', sub: 'Procurement, IT and compliance requirements' },
    ],
  },
};

function computeRecommendation(a: Answers): BusinessPlanId {
  const score: Record<BusinessPlanId, number> = { team: 0, scale: 0, enterprise: 0 };

  // Q1 — 席位数是主轴
  if (a.seats === 'small') score.team += 4;
  if (a.seats === 'mid')   { score.scale += 4; score.team -= 2; }
  if (a.seats === 'large') { score.enterprise += 5; score.scale += 1; }

  // Q2 — 产量决定额度档
  if (a.volume === 'low')  score.team += 2;
  if (a.volume === 'mid')  { score.scale += 3; score.team -= 1; }
  if (a.volume === 'high') { score.scale += 2; score.enterprise += 2; }

  // Q3 — 落地诉求
  if (a.need === 'shared')     score.team += 2;
  if (a.need === 'control')    score.scale += 3;
  if (a.need === 'compliance') score.enterprise += 6;

  const entries = Object.entries(score) as [BusinessPlanId, number][];
  entries.sort((x, y) => y[1] - x[1]);
  return entries[0][0];
}

const REASON: Record<BusinessPlanId, string> = {
  team: 'The cheapest way to put a small team on one shared credit pool, with shared brand assets and a single invoice.',
  scale: 'Built for teams producing every week — more credits per seat, priority processing, and per-member analytics to see where credits go.',
  enterprise: 'For org-wide rollouts that need unlimited seats, a credit allocation sized to your volume, SSO / SLA, and API access.',
};

const HUE: Record<BusinessPlanId, string> = {
  team: 'border-[#0a0a0a] bg-white',
  scale: 'border-[#f97316] bg-orange-50',
  enterprise: 'border-emerald-500 bg-emerald-50',
};

const SEATS_PHRASES: Record<Seats, string> = {
  small: 'need 2–9 seats',
  mid: 'need 10–30 seats',
  large: 'need more than 30 seats',
};
const VOLUME_PHRASES: Record<Volume, string> = {
  low: 'ship under 50 ad variations a month',
  mid: 'ship 50–200 ad variations a month',
  high: 'ship 200+ ad variations a month',
};
const NEED_PHRASES: Record<Need, string> = {
  shared: 'mainly want shared credits and shared brand assets',
  control: 'want roles, per-member analytics and priority processing',
  compliance: 'need SSO, an SLA, API access and a security review',
};

/**
 * Business 版的选型引导：3 题 quiz + Team / Scale / Enterprise 三张 persona 卡。
 * 结构和 Individual 的 PlanGuide 一致，题目与打分换成团队口径。
 */
export function BusinessPlanGuide() {
  const [state, setState] = useState<QuizState>({ step: 'intro' });
  const [contactOpen, setContactOpen] = useState(false);

  const startQuiz = () => setState({ step: 'q1', answers: {} });
  const resetQuiz = () => setState({ step: 'intro' });

  const answerQuestion = (key: keyof Answers, value: string) => {
    if (state.step !== 'q1' && state.step !== 'q2' && state.step !== 'q3') return;
    const next = { ...state.answers, [key]: value } as Partial<Answers>;
    if (state.step === 'q1') setState({ step: 'q2', answers: next });
    else if (state.step === 'q2') setState({ step: 'q3', answers: next });
    else {
      const full = next as Answers;
      setState({ step: 'result', answers: full, recommendation: computeRecommendation(full) });
    }
  };

  return (
    <section className="mt-20 bg-neutral-50 rounded-2xl p-8 sm:p-12">
      <header className="text-center mb-8">
        <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">
          Not sure which business plan is right for your team?
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

      {(state.step === 'q1' || state.step === 'q2' || state.step === 'q3') && (
        <QuestionStep stepKey={state.step} onAnswer={answerQuestion} onCancel={resetQuiz} />
      )}

      {state.step === 'result' && (
        <ResultCard
          recommendation={state.recommendation}
          answers={state.answers}
          onRetake={startQuiz}
          onContactSales={() => setContactOpen(true)}
        />
      )}

      <div className="mt-10 pt-10 border-t border-neutral-200">
        <h3 className="text-center text-[13px] font-semibold uppercase tracking-wider text-neutral-500 mb-6">
          Or browse the business plans by team profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {BUSINESS_GUIDE.map(g => (
            <article key={g.id} className="flex flex-col">
              <header className="pb-4 border-b border-neutral-200">
                <h4 className="text-2xl font-bold tracking-tight">{g.name}</h4>
                <p className="mt-1 text-[13px] text-neutral-500 leading-snug">{g.tagline}</p>
              </header>

              <GuideList label="Suitable for" items={g.suitableFor} />
              <GuideList label="Core features" items={g.coreFeatures} />

              {g.id === 'enterprise' ? (
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="mt-auto pt-5 text-[13px] font-semibold text-[#0a0a0a] hover:text-neutral-700 inline-flex items-center gap-1 self-start"
                >
                  Contact Sales →
                </button>
              ) : (
                <a
                  href="#plans"
                  className="mt-auto pt-5 text-[13px] font-semibold text-[#0a0a0a] hover:text-neutral-700 inline-flex items-center gap-1 self-start"
                >
                  Choose {g.name} →
                </a>
              )}
            </article>
          ))}
        </div>
      </div>

      {contactOpen && <ContactSalesModal onClose={() => setContactOpen(false)} />}
    </section>
  );
}

function QuestionStep({
  stepKey,
  onAnswer,
  onCancel,
}: {
  stepKey: 'q1' | 'q2' | 'q3';
  onAnswer: (key: keyof Answers, value: string) => void;
  onCancel: () => void;
}) {
  const q = QUESTIONS[stepKey];
  const stepNum = stepKey === 'q1' ? 1 : stepKey === 'q2' ? 2 : 3;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 justify-center mb-6">
        {[1, 2, 3].map(n => (
          <span
            key={n}
            className={`h-1.5 w-8 rounded-full ${n <= stepNum ? 'bg-[#0a0a0a]' : 'bg-neutral-300'}`}
          />
        ))}
        <span className="ml-2 text-xs text-neutral-500">Step {stepNum} of 3</span>
      </div>

      <h3 className="text-center text-lg sm:text-xl font-bold tracking-tight mb-5">{q.title}</h3>

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

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-neutral-500 hover:text-neutral-800 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ResultCard({
  recommendation,
  answers,
  onRetake,
  onContactSales,
}: {
  recommendation: BusinessPlanId;
  answers: Answers;
  onRetake: () => void;
  onContactSales: () => void;
}) {
  const guide = BUSINESS_GUIDE.find(g => g.id === recommendation)!;
  return (
    <div className={`max-w-xl mx-auto rounded-2xl border-2 p-6 ${HUE[recommendation]}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
        Recommended for your team
      </div>
      <h3 className="mt-1 text-2xl font-bold tracking-tight">{guide.name}</h3>
      <p className="mt-2 text-[13px] leading-[1.55] text-neutral-700">{REASON[recommendation]}</p>

      {/* 把答案 mirror 回来，降低「销售推荐」质感 */}
      <p className="mt-3 text-[12px] leading-[1.55] text-neutral-500">
        You {SEATS_PHRASES[answers.seats]}, {VOLUME_PHRASES[answers.volume]}, and{' '}
        {NEED_PHRASES[answers.need]}.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {recommendation === 'enterprise' ? (
          <button
            type="button"
            onClick={onContactSales}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#0a0a0a] text-white text-sm font-semibold hover:opacity-90"
          >
            Contact Sales →
          </button>
        ) : (
          <a
            href="#plans"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#0a0a0a] text-white text-sm font-semibold hover:opacity-90"
          >
            Get {guide.name} →
          </a>
        )}
        <button
          type="button"
          onClick={onRetake}
          className="text-xs text-neutral-500 hover:text-neutral-800 underline"
        >
          Retake the quiz
        </button>
      </div>
    </div>
  );
}
