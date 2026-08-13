'use client';

import { useState, type ReactNode } from 'react';

export type Category = string;

export interface FaqItem {
  q: string;
  a: ReactNode;
  category: Category;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  top:     'Most Asked',
  billing: 'Billing & Credits',
  models:  'AI Models & Features',
  rights:  'Rights, Privacy & Teams',
};

/** Inline CTA link — emerald accent,用在 FAQ 答案内引导用户行动 */
export function InlineCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors"
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}

const FAQ: FaqItem[] = [
  // ────────── BIG 3 (Most Asked,排顶建立信任 + 风险逆转) ──────────
  {
    category: 'top',
    q: 'Can I use BuzzVideo-generated content commercially?',
    a: (
      <p>
        <b>Yes — you own 100% of the commercial rights</b>, on every plan including Free.
        Use the output for ads, social posts, product images, video content, paid client
        deliverables, and any other business use case. No royalties, no per-use fees, no
        extra licensing.
      </p>
    ),
  },
  {
    category: 'top',
    q: 'What are credits and how do they work?',
    a: (
      <>
        <p>Every time you generate something — an image, a video, or a marketing-agent task — you spend credits. Different models cost different amounts (see the Compare Features table for exact costs).</p>
        <p className="mt-2">How your credits refill depends on your plan:</p>
        <ul className="mt-1 pl-5 list-disc space-y-1">
          <li><b>Free</b>: 500 credits once. They don&rsquo;t refill — when they&rsquo;re gone, you&rsquo;ll need to subscribe to keep going.</li>
          <li><b>Monthly</b>: a fresh allowance lands on your billing date every month. Anything left over from the previous month is gone — credits don&rsquo;t roll over.</li>
          <li><b>Yearly</b>: your full year of credits arrives the day you subscribe. Use them at your own pace, anytime within the year.</li>
        </ul>
      </>
    ),
  },
  {
    category: 'top',
    q: 'Can I cancel anytime? Am I locked in?',
    a: (
      <>
        <p><b>No long-term commitment.</b> You can cancel anytime from your account settings, with no cancellation fee and no questions asked.</p>
        <p className="mt-2">After you cancel, you&rsquo;ll keep full access to your plan&rsquo;s benefits and remaining credits until the end of your current billing period, then automatically move to the Free plan — no service interruption.</p>
      </>
    ),
  },

  // ────────── BILLING & CREDITS ──────────
  {
    category: 'billing',
    q: 'Is yearly billing worth it?',
    a: (
      <>
        <p>Absolutely. Choosing yearly slashes your costs by <b>30%</b> — the equivalent of getting <b>~3.6 months entirely free</b>. Plus, yearly plans unlock your <b>full credit pool upfront on day one</b>, so you can scale up during heavy campaign seasons without hitting monthly walls.</p>
        <p className="mt-2">Not sure yet? Start on monthly — you can switch to yearly anytime to lock in the savings.</p>
        <InlineCta href="#plans">Switch to Yearly &amp; Save 30%</InlineCta>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'What happens if I run out of credits?',
    a: (
      <>
        <p>With <b>auto-upgrade on</b> (the default), you usually won&rsquo;t hit a wall: your plan moves up to the next tier automatically before your credits run dry, so your generations never pause. See the auto-upgrade FAQ for exactly when it triggers.</p>
        <p className="mt-2">If you&rsquo;ve turned auto-upgrade off, here&rsquo;s what to do on each plan:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>Free users</b>: subscribe to a paid plan (Starter / Pro / Ultra) to unlock more credits and premium models.</li>
          <li><b>Starter / Pro</b>: upgrade to a higher plan at any time to add more credits immediately (remaining credits from your current plan are preserved, see the upgrade FAQ).</li>
          <li><b>Ultra</b>: scale up your Ultra credit tier using the slider on the Ultra plan card, 2× (<b>33% off</b> per credit) or 4× (<b>40% off</b>) the base credits, or wait until your next renewal.</li>
        </ul>
        <InlineCta href="#plans">Compare plans</InlineCta>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'What is auto-upgrade and how does it work?',
    a: (
      <>
        <p><b>Auto-upgrade keeps your generations from pausing.</b> When it&rsquo;s on, your plan automatically moves up to the next tier (Starter → Pro → Ultra) so you never get blocked mid-task. It&rsquo;s <b>on by default</b>, and you can turn it off anytime.</p>
        <p className="mt-2">It kicks in when either of these happens:</p>
        <ul className="mt-1 pl-5 list-disc space-y-1">
          <li>Your remaining credits fall <b>below 300</b>.</li>
          <li>A new image or video task needs <b>more credits than you have left</b>, so the task can still run.</li>
        </ul>
        <p className="mt-2">When it triggers, you&rsquo;re charged the <b>full new plan price immediately</b> and the upgrade takes effect right away. It follows the same rules as a manual upgrade: your remaining credits are preserved and a new billing cycle starts that day (see &ldquo;Can I upgrade or downgrade my plan?&rdquo; below).</p>
        <p className="mt-2 text-neutral-500">Turn auto-upgrade off anytime under Dashboard › Account Settings › Billing &amp; Subscription.</p>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'Can I get more credits on Ultra?',
    a: (
      <>
        <p>Yes — drag the slider on the Ultra plan card to bump your credits up. The more you buy, the cheaper each credit gets:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>1×</b> — base credits, regular price.</li>
          <li><b>2×</b> — double the credits, <b>33% off</b> per credit.</li>
          <li><b>4×</b> — quadruple the credits, <b>40% off</b> per credit.</li>
        </ul>
        <p className="mt-2">Starter and Pro don&rsquo;t have a slider (fixed price). If Pro&rsquo;s credits aren&rsquo;t enough, jumping to Ultra and sliding up will usually cost less than running out of credits mid-month.</p>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'Can I upgrade or downgrade my plan?',
    a: (
      <>
        <p>Yes — both are supported.</p>
        <p className="mt-3"><b>Upgrade</b> takes effect immediately:</p>
        <ul className="mt-1 pl-5 list-disc space-y-1">
          <li>The new plan activates the moment you upgrade.</li>
          <li>You&rsquo;re charged the <b>full new plan price immediately</b>. Unused days on your previous plan are <b>not refunded</b>.</li>
          <li>A <b>new billing cycle starts today</b> — your next renewal will be 30 days (monthly) or one year (yearly) from now, not your old renewal date.</li>
          <li>Any <b>remaining credits</b> from your previous plan are <b>preserved</b> and added on top of your new plan&rsquo;s allowance — nothing is wasted.</li>
        </ul>
        <p className="mt-3"><b>Downgrade</b> takes effect at the end of your current billing period:</p>
        <ul className="mt-1 pl-5 list-disc space-y-1">
          <li>Nothing changes right away — you keep your current plan&rsquo;s full benefits and credits until the cycle ends.</li>
          <li>On your renewal date, the new (lower) plan&rsquo;s price is charged and its credits are issued.</li>
          <li>Any unused credits from the previous cycle are forfeited at renewal (credits don&rsquo;t roll over).</li>
        </ul>
        <p className="mt-3 text-neutral-500">When you upgrade, you&rsquo;ll see a preview showing the exact charge, new credit balance, and new renewal date before you confirm.</p>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'Do you offer refunds?',
    a: (
      <>
        <p>We don&rsquo;t offer routine refunds — but you&rsquo;re never locked in. You can <b>cancel anytime</b> and you&rsquo;ll keep your remaining credits and full plan access through the end of your current billing period.</p>
        <p className="mt-2">In cases required by law or in special circumstances reviewed and approved by our platform, refunds may be considered. To request a review, contact our support team at <a href="mailto:info@presslogic.com" className="underline">info@presslogic.com</a>.</p>
        <p className="mt-2 text-neutral-500">If a refund is approved for an order that includes already-used benefits or credits, the final refund amount may be adjusted based on actual usage, subject to our review.</p>
      </>
    ),
  },

  // ────────── AI MODELS & FEATURES ──────────
  {
    category: 'models',
    q: 'Which AI models are included with my plan?',
    a: (
      <>
        <p>All paid plans include access to premium models. Each generation simply consumes credits from your plan&rsquo;s allowance.</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>Free</b>: Seedream 4.5 and Seedream 5.0 Lite only (images), 500 one-time credits.</li>
          <li><b>Starter</b>: All image models + all video models <i>except</i> Seedance 2.0.</li>
          <li><b>Pro</b>: All image and video models, including Seedance 2.0.</li>
          <li><b>Ultra</b>: All models + Long Video Generation (Early Access) + priority processing.</li>
        </ul>
        <p className="mt-2">If you need Seedance 2.0 for the highest-fidelity video output, upgrade to Pro or Ultra.</p>
      </>
    ),
  },
  {
    category: 'models',
    q: 'Which models should I use — Standard or Premium Cinematic?',
    a: (
      <>
        <p>It depends on what you&rsquo;re making:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li>Use <b>Standard Assets</b> for the bread-and-butter work — routine product shots, social posts, A/B test variants, quick iterations. Cheaper per generation, totally fine quality for most ads.</li>
          <li>Use <b>Premium Cinematic Assets</b> when you&rsquo;re shooting a hero — flagship ad, brand campaign key visual, anything that needs to look like real cinematography. Costs more credits per generation, but the quality jump is huge.</li>
        </ul>
        <p className="mt-2">Most marketers mix both: Standard for volume, Premium Cinematic for the one or two shots that matter most. Both are available on any paid plan — except Seedance 2.0, which needs Pro or Ultra.</p>
      </>
    ),
  },
  {
    category: 'models',
    q: 'What are AI Avatars?',
    a: (
      <>
        <p>AI Avatars are <b>reusable generated characters</b> you can drop into image or video ads — useful for maintaining a consistent brand spokesperson, talent, or product model across campaigns without paying for repeat shoots.</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>Free</b>: up to 10 avatars.</li>
          <li><b>Starter / Pro / Ultra</b>: unlimited avatars.</li>
        </ul>
        <p className="mt-2">Avatars work with Character Customization (Seedance 2.0 on Pro and Ultra) for dynamic motion and expressions.</p>
      </>
    ),
  },
  {
    category: 'models',
    q: 'What is Long Video Generation (Early Access)?',
    a: (
      <p>An <b>Ultra-exclusive feature</b> that lets you generate longer-form videos beyond the standard 5–10s clip length. Useful for product explainer videos, longer storytelling ads, and content for platforms like YouTube. As an Early Access feature, capabilities and limits will evolve — your feedback shapes the release.</p>
    ),
  },

  // ────────── RIGHTS, PRIVACY & TEAMS ──────────
  {
    category: 'rights',
    q: 'Who owns the content I generate? Can I use it for client work?',
    a: (
      <>
        <p>You own <b>100% of the content</b> you generate in BuzzVideo — every image, video, and avatar. There are no royalties, no per-use fees, and no extra licensing.</p>
        <p className="mt-2">You can use generated assets for:</p>
        <ul className="mt-1 pl-5 list-disc space-y-1">
          <li>Your own brand&rsquo;s ads, social, web, and print</li>
          <li><b>Paid client work and agency deliverables</b> — including white-labeled handoffs to your clients</li>
          <li>Resale as stock or templates (as long as the prompts you used don&rsquo;t violate our content policy)</li>
        </ul>
        <p className="mt-2 text-neutral-500">Note: you&rsquo;re responsible for ensuring your prompts don&rsquo;t infringe third-party trademarks or include real people&rsquo;s likeness without their consent.</p>
      </>
    ),
  },
  {
    category: 'rights',
    q: 'Is my data and prompts private? Will they be used to train AI?',
    a: (
      <>
        <p>Yes — your prompts, uploads, and generated outputs are <b>private to your account</b>. Specifically:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li>We do <b>not</b> use your content or prompts to train our AI models.</li>
          <li>We do <b>not</b> share your data with third parties for marketing or analytics.</li>
          <li>Generated outputs are stored only in your account workspace, accessible only to you.</li>
        </ul>
        <p className="mt-2">For Enterprise customers, we offer additional protections including <b>data residency</b>, <b>SOC 2 reports</b>, and a custom DPA.</p>
        <InlineCta href="#enterprise">Contact Sales for Enterprise</InlineCta>
      </>
    ),
  },
  {
    category: 'rights',
    q: 'Do you have an API?',
    a: (
      <>
        <p>Yes — dedicated API access is available on <b>Enterprise plans</b> for large brands, engineering teams, and platforms integrating BuzzVideo into internal tools. Typical integrations:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li>Shopify product pages and ecommerce CMS</li>
          <li>Internal content / creative pipelines</li>
          <li>Agency client portals (white-label generation)</li>
          <li>Marketing automation tools (e.g., HubSpot, Braze)</li>
        </ul>
        <p className="mt-2">API access, custom credit allocations, and dedicated model capacity all come with Enterprise.</p>
        <InlineCta href="#enterprise">Contact Sales for API Access</InlineCta>
      </>
    ),
  },
  {
    category: 'rights',
    q: 'Can I share my plan with my team?',
    a: (
      <>
        <p>Not on Starter, Pro, or Ultra — each is built for one person. If you&rsquo;re an agency or in-house marketing team and need multiple seats, <b>Enterprise</b> includes multi-user access, seat management, shared workspaces, and team workflows so your designers and copywriters can collaborate seamlessly.</p>
        <p className="mt-2 text-neutral-500">Native team features on the standard paid plans are on our roadmap — let us know if that&rsquo;s a dealbreaker for you and we&rsquo;ll factor it into priority.</p>
        <InlineCta href="#enterprise">Talk to Sales about Teams</InlineCta>
      </>
    ),
  },
];

export const CATEGORY_ORDER: Category[] = ['top', 'billing', 'models', 'rights'];

function groupByCategory(items: FaqItem[], order: Category[]) {
  return order
    .map(c => ({ category: c, items: items.filter(it => it.category === c) }))
    .filter(g => g.items.length > 0);
}

interface FaqProps {
  /** 自定义问答内容。不传则用 v1.2 – v1.4 的原内容 */
  items?: FaqItem[];
  /** 分组顺序 */
  order?: Category[];
  /** 分组标题 */
  labels?: Record<Category, string>;
}

export function Faq({ items = FAQ, order = CATEGORY_ORDER, labels = CATEGORY_LABEL }: FaqProps = {}) {
  const groups = groupByCategory(items, order);
  return (
    <section className="mt-20 max-w-3xl mx-auto">
      <h2 className="text-center text-2xl sm:text-[28px] font-bold tracking-tight mb-8">Frequently Asked Questions</h2>
      <div className="space-y-8">
        {groups.map(({ category, items }) => (
          <div key={category}>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-500 mb-2">
              {labels[category]}
            </h3>
            <div>
              {items.map((item, i) => <FaqItemRow key={`${category}-${i}`} {...item} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqItemRow({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center gap-4 py-[18px] text-left text-base font-medium"
      >
        <span>{q}</span>
        <span aria-hidden className="text-[22px] text-neutral-500 font-light leading-none flex-shrink-0">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="text-sm leading-[1.65] text-neutral-700 pb-[18px] -mt-1">
          {a}
        </div>
      )}
    </div>
  );
}
