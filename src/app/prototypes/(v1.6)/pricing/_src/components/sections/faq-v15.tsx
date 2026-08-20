import { InlineCta, type Category, type FaqItem } from './Faq';

/**
 * v1.5 专属 FAQ。相对 v1.2 – v1.4 的改动：
 *  - credits 改成「年付也按月发放、按月清零」口径
 *  - 删掉已下架的 Long Video Generation / Character Customization / auto-upgrade
 *  - 补上 Web Explore、Parallel Generations、Processing Speed
 *  - 新增 Teams & Business 分组（Team / Scale 已上线）
 *  - #enterprise 死链改成 #plans
 */

export const FAQ_V15_ORDER: Category[] = ['top', 'billing', 'models', 'business', 'rights'];

export const FAQ_V15_LABELS: Record<Category, string> = {
  top: 'Most Asked',
  billing: 'Billing & Credits',
  models: 'AI Models & Features',
  business: 'Teams & Business',
  rights: 'Rights & Privacy',
};

export const FAQ_V15: FaqItem[] = [
  // ────────── MOST ASKED ──────────
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
        <p>Every time you generate something — an image, a video, or a marketing-agent task — you spend credits. Different models cost different amounts, and the cost also depends on your output settings (resolution, duration). The Compare Features table shows the exact cost per model.</p>
        <p className="mt-2">How your credits arrive:</p>
        <ul className="mt-1 pl-5 list-disc space-y-1">
          <li><b>Free</b>: 500 credits once. They don&rsquo;t refill — when they&rsquo;re gone, you&rsquo;ll need to subscribe to keep going.</li>
          <li><b>Every paid plan</b>: a fresh allowance lands on the same date each month, whether you pay monthly or annually. Annual billing changes <i>how you pay</i>, not how credits arrive.</li>
        </ul>
        <p className="mt-2"><b>Credits reset at the start of each monthly cycle and don&rsquo;t roll over</b>, so there&rsquo;s no benefit to hoarding them.</p>
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
        <p>If you generate regularly, yes. Annual billing cuts <b>30%</b> off the monthly price — the equivalent of <b>~4 months free</b> — and locks that rate in for the year.</p>
        <p className="mt-2">Your credits work exactly the same either way: the same monthly allowance arrives on the same date each month. You&rsquo;re choosing a payment schedule and a discount, not a different credit model.</p>
        <p className="mt-2">Not sure yet? Start on monthly — you can switch to annual anytime to lock in the savings.</p>
        <InlineCta href="#plans">Switch to Annual &amp; Save 30%</InlineCta>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'What happens if I run out of credits?',
    a: (
      <>
        <p>Generations pause until your next monthly reset, or until you add more credits. What to do on each plan:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>Free</b>: subscribe to a paid plan to unlock a recurring allowance and premium models.</li>
          <li><b>Starter / Pro</b>: upgrade at any time. Your remaining credits are preserved and added on top of the new plan&rsquo;s allowance (see the upgrade FAQ).</li>
          <li><b>Ultra</b>: double your monthly credits with the slider on the Ultra card.</li>
          <li><b>Team / Scale</b>: buy a <b>top-up</b> for the seat that ran out — from $500 for 50,000 credits, valid 12 months. Only add seats when you are actually adding people.</li>
          <li><b>Enterprise</b>: top up the shared pool, or turn on auto top-up so it refills before anyone is blocked.</li>
        </ul>
        <InlineCta href="#plans">Compare plans</InlineCta>
      </>
    ),
  },
  {
    category: 'billing',
    q: 'Can I get more credits on Ultra?',
    a: (
      <>
        <p>Yes — drag the slider on the Ultra plan card to double your monthly credits. It is a straight 2× of both the credits and the price, so the cost per credit stays the same.</p>
        <p className="mt-2">Starter and Pro don&rsquo;t have a slider (fixed price). If Pro&rsquo;s credits aren&rsquo;t enough, moving to Ultra usually costs less than running dry mid-month.</p>
        <p className="mt-2">Working with other people? <b>Business plans</b> also sell one-off top-up packs, so you can add credits without adding seats.</p>
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
          <li>A <b>new billing cycle starts today</b> — your next renewal will be 30 days (monthly) or one year (annual) from now, not your old renewal date.</li>
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
        <p className="mt-2">In cases required by law or in special circumstances reviewed and approved by our platform, refunds may be considered. To request a review, contact our support team at <a href="mailto:info@buzzvideo.ai" className="underline">info@buzzvideo.ai</a>.</p>
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
          <li><b>Starter</b>: every image model, including Seedream 5.0 Pro. All video models <i>except</i> Seedance 2.0 and Seedance 2.5.</li>
          <li><b>Pro</b>: every image and video model, including Seedance 2.0 and Seedance 2.5.</li>
          <li><b>Ultra</b>: everything Pro has, plus the highest credit allowance and priority processing.</li>
        </ul>
        <p className="mt-2">If you need Seedance 2.0 or 2.5 for the highest-fidelity video output, upgrade to Pro or Ultra.</p>
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
        <p className="mt-2">Most marketers mix both: Standard for volume, Premium Cinematic for the one or two shots that matter most. Both are available on any paid plan — except Seedance 2.0 and Seedance 2.5, which need Pro or Ultra.</p>
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
      </>
    ),
  },
  {
    category: 'models',
    q: 'What is Web Explore?',
    a: (
      <>
        <p>Web Explore lets the Marketing Agent <b>pull in live references from the web</b> while it works — your own product page, competitor ads currently running, and what&rsquo;s trending in your category — so briefs, angles, and copy are grounded in what&rsquo;s actually out there instead of generic templates.</p>
        <p className="mt-2">Available on <b>Starter, Pro and Ultra</b>. Free plans don&rsquo;t include it.</p>
      </>
    ),
  },
  {
    category: 'models',
    q: 'What are Parallel Generations and Processing Speed?',
    a: (
      <>
        <p>They control how much you can run at once and how fast it comes back.</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>Parallel Generations</b> — how many tasks can render at the same time. Free runs 1 at a time; Starter up to 4, Pro up to 8, Ultra up to 12. This is what lets you fire off a whole batch of ad variants and walk away.</li>
          <li><b>Processing Speed</b> — which queue your tasks join. Free uses the <b>Standard</b> queue; every paid plan uses the <b>Fast</b> queue, which is prioritised at busy times.</li>
        </ul>
        <p className="mt-2 text-neutral-500">Neither setting changes what a generation costs — only throughput and wait time.</p>
      </>
    ),
  },

  // ────────── TEAMS & BUSINESS ──────────
  {
    category: 'business',
    q: 'What’s the difference between Individual and Business plans?',
    a: (
      <>
        <p><b>Individual plans</b> (Free, Starter, Pro, Ultra) are built for one person — one login, one credit allowance.</p>
        <p className="mt-2"><b>Business plans</b> (Team, Scale, Enterprise) are built for more than one person working on the same brands:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li>Credits sit in <b>one shared pool</b>, so a heavy week for one person doesn&rsquo;t block anyone else.</li>
          <li>Brand kits, assets and templates are shared across the workspace.</li>
          <li>One invoice for the whole team instead of one per person.</li>
          <li>Member roles, and on Scale, per-member usage analytics.</li>
        </ul>
        <InlineCta href="#plans">See Business plans</InlineCta>
      </>
    ),
  },
  {
    category: 'business',
    q: 'How does per-seat pricing work on Team and Scale?',
    a: (
      <>
        <p>You pick the number of seats and pay per seat, per month. Each seat also adds its credits to the shared pool.</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>Team</b> — 2 to 9 seats, <b>8,900 credits</b> per seat each month.</li>
          <li><b>Scale</b> — 5 to 30 seats, <b>16,900 credits</b> per seat each month.</li>
          <li><b>Enterprise</b> — unlimited seats and a custom credit allocation.</li>
        </ul>
        <p className="mt-2">Both plans are discounted off the list price, and annual billing saves more per seat. You can <b>add or remove seats at any time</b> — new seats are billed pro rata for the rest of the cycle, and their credits land in the pool right away.</p>
      </>
    ),
  },
  {
    category: 'business',
    q: 'Can I share my plan with my team?',
    a: (
      <>
        <p>Not on the Individual plans — Starter, Pro and Ultra are each built for one person.</p>
        <p className="mt-2">For more than one person, switch to <b>Business plans</b>: <b>Team</b> (2–9 seats) and <b>Scale</b> (5–30 seats) give you multiple seats, each with its own fixed monthly credits, plus shared brand assets and one invoice. Credits are not pooled — they stay with the seat. Larger organisations that need unlimited seats, a shared credit pool allocated per member, SSO, an SLA or API access should talk to us about <b>Enterprise</b>.</p>
        <InlineCta href="#plans">See Business plans</InlineCta>
      </>
    ),
  },
  {
    category: 'business',
    q: 'How do credits work when the whole team shares one pool?',
    a: (
      <>
        <p>Every seat contributes its monthly credits to <b>one shared pool</b>, and anyone in the workspace can draw from it — so a heavy week for one person doesn&rsquo;t leave anyone else blocked.</p>
        <p className="mt-2">Owners and admins can allocate credits per member, with three modes:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>No limit</b> — the member generates freely until the team pool runs out.</li>
          <li><b>Soft cap</b> — the member gets a warning once they pass their allocation, but can keep working while the pool lasts.</li>
          <li><b>Hard cap</b> — the member can&rsquo;t submit new tasks past their allocation, even if the pool still has balance.</li>
        </ul>
        <p className="mt-2">Credits are issued monthly on every Business plan — whether you pay monthly or annually — and <b>reset at the start of each monthly cycle</b>, so they don&rsquo;t roll over.</p>
      </>
    ),
  },
  {
    category: 'business',
    q: 'What happens when I add or remove a seat mid-cycle?',
    a: (
      <>
        <p><b>Adding a seat</b> is billed pro rata for the rest of the current cycle, and that seat&rsquo;s credits land in the shared pool right away — no waiting for the next billing date.</p>
        <p className="mt-2"><b>Removing a seat</b> takes effect at the end of the cycle. The member keeps access until then, and their work — assets, brand kits, generation history — stays in the workspace after they leave.</p>
        <p className="mt-2">Team runs 2–9 seats and Scale runs 5–30. If you outgrow Scale, Enterprise has unlimited seats.</p>
      </>
    ),
  },
  {
    category: 'business',
    q: 'What does Scale add over Team?',
    a: (
      <>
        <p>Same shared workspace, more throughput and more control:</p>
        <ul className="mt-2 pl-5 list-disc space-y-1">
          <li><b>More credits per seat</b> — 16,900 vs 8,900 each month.</li>
          <li><b>More seats</b> — up to 30, and up to 20 parallel generations vs 14.</li>
          <li><b>Priority processing</b> — your tasks jump the queue instead of running at standard speed.</li>
          <li><b>Detailed analytics</b> and <b>priority technical support</b>.</li>
        </ul>
        <p className="mt-2">Both plans include fixed credits per seat, shared assets, role and permission management, and one invoice. Neither pools credits — allocating credits across people is an Enterprise capability.</p>
      </>
    ),
  },
  {
    category: 'business',
    q: 'Who can manage members, roles and spending?',
    a: (
      <>
        <p>Every Business plan includes <b>role and permission management</b>, <b>team seat management</b> and <b>credit usage controls</b>. Owners and admins can invite or remove members, set each member&rsquo;s role, and cap how much of the shared pool each person can spend.</p>
        <p className="mt-2">Usage is visible in the analytics dashboard — basic on Team, detailed per-member breakdowns on Scale, and custom reporting on Enterprise.</p>
      </>
    ),
  },
  {
    category: 'business',
    q: 'Do Business plans include API access?',
    a: (
      <>
        <p><b>API access is Enterprise-only.</b> Team and Scale cover the in-product workflow — shared credits, shared assets, roles and analytics — but don&rsquo;t expose the API.</p>
        <p className="mt-2">Enterprise adds API access and team training, dedicated model capacity, SSO with a security review, an SLA, and a dedicated account manager.</p>
      </>
    ),
  },
  {
    category: 'business',
    q: 'How does Enterprise pricing work?',
    a: (
      <>
        <p>Enterprise is quoted, not listed. Seats are unlimited and the credit allocation is <b>sized to your annual production volume</b> rather than fixed per seat, so pricing depends on how much you actually produce.</p>
        <p className="mt-2">Tell us your team size, use case and any security or compliance requirements, and our sales team replies within one business day.</p>
        <InlineCta href="#plans">Contact Sales</InlineCta>
      </>
    ),
  },
  {
    category: 'business',
    q: 'I’m on Ultra — what happens if I move to a Business plan?',
    a: (
      <>
        <p>Business plans start from <b>everything in Ultra</b> — the same full model access, unlimited AI avatars, Web Explore and watermark-free output — then add the team layer on top: a seat for each person with its own fixed credits, shared brand assets, roles, analytics and one invoice.</p>
        <p className="mt-2">When you switch, your assets and history move with you into the workspace. Your Individual subscription stops renewing, and the remaining credits in your personal allowance stay usable until the end of the cycle you already paid for.</p>
      </>
    ),
  },

  // ────────── RIGHTS & PRIVACY ──────────
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
        <p className="mt-2">On <b>Business plans</b>, workspace content is visible to the members you invite. For Enterprise customers we offer additional protections including <b>data residency</b>, <b>SOC 2 reports</b>, and a custom DPA.</p>
        <InlineCta href="#plans">Contact Sales for Enterprise</InlineCta>
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
        <InlineCta href="#plans">Contact Sales for API Access</InlineCta>
      </>
    ),
  },
];
