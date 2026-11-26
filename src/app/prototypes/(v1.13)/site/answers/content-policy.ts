// 问答页内容(2026-11-26)。格式同 learn/content.ts 的 Guide;GEO 写法见文件头注释。
// 政策页(2 页,group "Specs and reference",legal: true)。只写有依据的内容:
//   - 线上 https://buzzvideo.ai/terms-of-service(2026-11-26 WebFetch):第 1 节年龄、5.1 输出许可、5.2 限制、5.6 连接客户端、6.1–6.4 内容责任与处置、
//     6.3.1 / 6.3.2 禁止内容和行为、8.1–8.6 AI 输出与肖像功能、12.5 积分、13 终止、15.1 香港法律;
//   - 线上 https://buzzvideo.ai/privacy-policy:Stripe、不训练、不出售、模型供应商、30 天删除、加密与访问控制、年龄;
//   - free/company.ts + free/EnterprisePage.tsx:Enterprise 的 SOC 2 报告、定制 DPA、数据驻留(其余如 SSO / 审计日志在 company.ts 标为 Planned,不写)。
// 条款原文没有的规则(如选举 / 政治深伪、AI 标识水印、专门的举报邮箱或按钮、申诉流程)一律不写，列给 Monica 和法务定。

import type { Guide } from "../learn/content";

const TERMS = { label: "BuzzVideo Terms of Service", url: "https://buzzvideo.ai/terms-of-service" };
const PRIVACY = { label: "BuzzVideo Privacy Policy", url: "https://buzzvideo.ai/privacy-policy" };
const PRICING = { label: "BuzzVideo pricing", url: "https://buzzvideo.ai/pricing" };

export const POLICY: Guide[] = [
  /* ───────────── Trust & Safety ───────────── */
  {
    slug: "trust",
    group: "Specs and reference",
    legal: true,
    title: "Trust & Safety: Data, Payments and Likeness | BuzzVideo",
    description: "Is BuzzVideo safe? Trust & Safety facts: Stripe payments, no AI training on your content, 30-day deletion, likeness consent rules and SOC 2 for Enterprise.",
    h1: "Trust & Safety at BuzzVideo",
    answer: "BuzzVideo does not use your prompts, uploads or generated content to train AI models, and it does not sell your personal data. Payments are processed by Stripe, deleted items leave active systems within 30 days, and using a real person's face or voice requires their express written consent. Enterprise customers can get SOC 2 reports, a custom DPA and data residency options.",
    card: "How BuzzVideo protects your data, payments and the people in your videos.",
    sections: [
      {
        id: "data",
        h2: "How does BuzzVideo protect my account and data?",
        blocks: [
          {
            kind: "ul",
            items: [
              "No training: BuzzVideo does not use your prompts, uploads or generated content to train AI or machine learning models.",
              "No sale: BuzzVideo does not sell your personal data.",
              "Security: industry-standard measures such as encryption and access controls. Tokens for connected AI apps (MCP) are stored only as one-way hashes.",
              "Model providers: your inputs are sent to the AI provider that runs the generation, such as Google or ByteDance.",
              "Deletion: delete items in Assets and they are removed from active systems within 30 days; backups may persist for a limited period. You can also request deletion of your account and its data.",
              "Your rights: depending on where you live, you can access, correct, delete or export your data.",
            ],
          },
        ],
      },
      {
        id: "payments",
        h2: "How are payments handled?",
        blocks: [
          { kind: "p", text: "Card details are collected and processed directly by Stripe. BuzzVideo receives only limited billing data. Plans are billed in advance, monthly or yearly, and you can cancel anytime and keep access until the end of the billing period." },
          { kind: "p", text: "Refunds aren't routine. They may be considered where the law requires them or in special circumstances, and may be adjusted for credits already used. Credits for failed generations are returned automatically." },
        ],
      },
      {
        id: "moderation",
        h2: "How does BuzzVideo moderate content?",
        blocks: [
          { kind: "p", text: "Everyone who uses BuzzVideo agrees to the content rules in the Terms of Service, summarized in the [BuzzVideo Content Policy](/content-policy). Under the Terms, BuzzVideo may:" },
          {
            kind: "ul",
            items: [
              "Review content and output (it has the right, but no obligation, to do so).",
              "Remove or modify content or output that breaks the Terms.",
              "Suspend a connected AI app (MCP client) it reasonably believes is being misused.",
              "Suspend or terminate the account, and report to law enforcement where appropriate.",
            ],
          },
          { kind: "p", text: "Credits are forfeited if an account is terminated for breaking the Terms, and amounts already paid are not refunded, to the extent the law allows." },
        ],
      },
      {
        id: "likeness",
        h2: "What are the rules for faces, voices and AI avatars?",
        blocks: [
          { kind: "p", text: "BuzzVideo's likeness features include voice cloning, AI avatars or characters made from photos or video, and using a person's images, video or audio as references. For each person you use, you must confirm that it is you or that they gave express, written consent to create, store and use a synthetic version of their voice, face or likeness for your intended purposes, including commercial use." },
          {
            kind: "table",
            head: ["Allowed", "Not allowed"],
            rows: [
              ["Your own face and voice", "Impersonating anyone"],
              ["A person who gave written consent for this use", "Making it look like a person said or did something they did not"],
              ["AI-generated characters that are not real people", "Misleading people about who is speaking"],
              ["", "Fraud, harassment, sexual content or other unlawful use of a likeness"],
            ],
          },
          { kind: "p", text: "Voice and face data may count as biometric information. BuzzVideo uses it only to provide those features to you and not to train models, and you can delete your voices and avatars in the app." },
        ],
      },
      {
        id: "report",
        h2: "How do I report a problem or a misuse?",
        blocks: [
          { kind: "p", text: "Contact BuzzVideo through the customer service contact form on the [Help Center](/help). Include links to the content and a short description of the problem, such as your likeness being used without consent." },
        ],
      },
      {
        id: "enterprise",
        h2: "What does BuzzVideo offer for enterprise security reviews?",
        blocks: [
          {
            kind: "table",
            head: ["Item", "Availability"],
            rows: [
              ["SOC 2 reports", "Enterprise, on request"],
              ["Custom DPA", "Enterprise"],
              ["Data residency options", "Enterprise, set with your account manager"],
              ["SLA and account manager", "Enterprise"],
            ],
          },
          { kind: "p", text: "Enterprise customers have separate terms. See [Enterprise](/enterprise) or contact sales." },
        ],
      },
    ],
    buzz: {
      title: "Manage your data on BuzzVideo",
      steps: ["Open Assets to delete uploads and generated content.", "Manage voices, avatars and connected AI apps in your account.", "Contact support from the Help Center to request account deletion or report misuse."],
      cta: { label: "Go to the Help Center", href: "/help" },
      note: "This page summarizes BuzzVideo's Terms of Service and Privacy Policy. It is not legal advice; if anything differs, those documents apply.",
    },
    faq: [
      { q: "Is BuzzVideo safe to use?", a: "Yes, based on its published policies: card payments are processed by Stripe, your prompts, uploads and output are not used to train AI models, your personal data is not sold, and deleted items leave active systems within 30 days." },
      { q: "Does BuzzVideo train AI on my content?", a: "No. The Terms of Service and the Privacy Policy both say BuzzVideo does not use your prompts, uploads or generated content to train AI or machine learning models." },
      { q: "Does BuzzVideo sell my data?", a: "No. The Privacy Policy says BuzzVideo does not sell your personal data. Inputs are shared with the AI model provider that runs your generation." },
      { q: "Can I make an AI avatar of someone else?", a: "Only if they gave you express, written consent to create, store and use a synthetic version of their face or voice for your purpose, including any commercial use." },
      { q: "How long does BuzzVideo keep deleted files?", a: "Deleted items are removed from active systems within 30 days. Backup copies may persist for a limited period." },
      { q: "Is BuzzVideo SOC 2 compliant?", a: "BuzzVideo provides SOC 2 reports to Enterprise customers on request, along with a custom DPA and data residency options. Contact sales for details." },
      { q: "Which law governs BuzzVideo's terms?", a: "The laws of the Hong Kong Special Administrative Region, with disputes resolved by arbitration under HKIAC rules after an informal resolution period." },
    ],
    sources: [TERMS, PRIVACY, PRICING],
    related: ["/content-policy", "/is-buzzvideo-legit", "/buzzvideo-commercial-use", "/enterprise", "/help"],
  },

  /* ───────────── Content Policy ───────────── */
  {
    slug: "content-policy",
    group: "Specs and reference",
    legal: true,
    title: "BuzzVideo Content Policy: What You Can Create | BuzzVideo",
    description: "BuzzVideo Content Policy: what you can and can't generate, consent rules for real people's faces and voices, and what happens when content breaks the rules.",
    h1: "BuzzVideo Content Policy",
    answer: "You can use BuzzVideo for lawful creative and commercial work, but not for content that is unlawful, infringing, harassing, pornographic, hateful, misleading or harmful to minors. Using a real person's face or voice requires their express written consent, and impersonation is not allowed. BuzzVideo can remove content that breaks these rules and suspend or close the account.",
    card: "What you can and can't create, and the consent rules for real people.",
    sections: [
      {
        id: "allowed",
        h2: "What can I create on BuzzVideo?",
        blocks: [
          { kind: "p", text: "Lawful creative and commercial work, such as ads, social posts, product videos and images, and client work. Everything you generate can be used commercially, and the Terms give you a license to use and earn revenue from your output. See [Can I use BuzzVideo videos in commercial ads?](/buzzvideo-commercial-use)." },
          { kind: "p", text: "You are responsible for the content you upload and for the output made from it, so only upload material you have the rights to use." },
        ],
      },
      {
        id: "prohibited",
        h2: "What content is not allowed on BuzzVideo?",
        blocks: [
          { kind: "p", text: "Under section 6.3.1 and 8.5 of the Terms of Service, you can't upload, generate or share content that:" },
          {
            kind: "ul",
            items: [
              "Infringes someone's copyright, trademark, patent, trade secret, privacy, publicity or other rights.",
              "Is unlawful, harassing, abusive, threatening or otherwise harmful.",
              "Invades privacy or is defamatory, false or intentionally misleading.",
              "Is pornographic, obscene or patently offensive.",
              "Promotes racism, bigotry, hatred or physical harm against any group or person.",
              "Is harmful to minors in any way.",
              "Breaks any law, regulation or government restriction.",
            ],
          },
        ],
      },
      {
        id: "real-people",
        h2: "Can I use real people's faces and voices?",
        blocks: [
          { kind: "p", text: "Only with consent. When you use voice cloning, AI avatars or a person's photos, video or audio as references, you must confirm that each person is you or gave express, written consent to create, store and use a synthetic version of their voice, face or likeness for your intended purposes, including commercial use." },
          {
            kind: "ul",
            items: [
              "Don't impersonate anyone.",
              "Don't make content suggesting a person said or did something they did not.",
              "Don't mislead people about who is speaking.",
              "Don't use a likeness for fraud, harassment, sexual content or other unlawful purposes.",
            ],
          },
          { kind: "p", text: "BuzzVideo does not grant you any right to use someone's name, image, likeness or voice. If you make content with a real person's likeness, you are responsible for claims that arise from it." },
        ],
      },
      {
        id: "conduct",
        h2: "What uses of the service are not allowed?",
        blocks: [
          {
            kind: "ul",
            items: [
              "Uploading viruses or other harmful software.",
              "Spam, chain letters, pyramid schemes or unsolicited advertising sent through the service.",
              "Collecting other users' data, such as email addresses, without consent.",
              "Overloading the service or getting around usage limits, including through connected AI apps or automation.",
              "Reselling or sublicensing access, including MCP access, or sharing one account among unrelated users.",
              "Reverse engineering the service or using it to build a competing product.",
              "Using BuzzVideo output to train or improve AI or machine learning systems.",
            ],
          },
        ],
      },
      {
        id: "enforcement",
        h2: "What happens if content breaks the rules?",
        blocks: [
          {
            kind: "table",
            head: ["Action", "What the Terms say"],
            rows: [
              ["Review", "BuzzVideo may review content and output, but has no obligation to."],
              ["Removal", "Content or output that breaks the Terms may be removed or modified."],
              ["Connected apps", "An MCP connection believed to be misused may be suspended."],
              ["Account", "The account may be suspended or terminated."],
              ["Credits and payments", "Credits are forfeited on termination for a breach, and amounts already paid are not refunded where the law allows."],
              ["Law enforcement", "Violations may be reported to law enforcement."],
            ],
          },
          { kind: "p", text: "To report content or misuse, contact BuzzVideo through the support contact form on the [Help Center](/help)." },
        ],
      },
      {
        id: "age",
        h2: "Who can use BuzzVideo?",
        blocks: [
          { kind: "p", text: "You must be at least 13, or at least 16 in the EEA, the UK and Switzerland. If you are under 18, you can only use BuzzVideo with the permission and supervision of a parent or guardian, who agrees to the Terms for you." },
        ],
      },
    ],
    buzz: {
      title: "Create within the rules",
      steps: ["Use your own product photos, footage and brand assets.", "Get written consent before using a real person's face or voice.", "Follow each ad platform's AI-disclosure rules when you publish."],
      cta: { label: "Open the AI Ad Generator", href: "/ai-ad-generator" },
      note: "This page summarizes the Terms of Service. If anything differs, the Terms of Service apply. It is not legal advice.",
    },
    faq: [
      { q: "Can I make NSFW content on BuzzVideo?", a: "No. Pornographic and obscene content is prohibited, and likeness features can't be used for sexual content." },
      { q: "Can I make deepfakes of celebrities on BuzzVideo?", a: "No. You can't impersonate anyone or make content suggesting a real person said or did something they did not, and you need a person's express written consent to use their face or voice." },
      { q: "Can I use copyrighted characters or logos?", a: "Only if you have the rights. Content that infringes copyright, trademark or other rights is prohibited, and you are responsible for what you upload." },
      { q: "Will BuzzVideo delete my content?", a: "BuzzVideo may remove or modify content or output that breaks the Terms of Service, and may suspend or close the account." },
      { q: "Can I share my BuzzVideo account?", a: "Not among unrelated users. The Terms prohibit sharing one account among multiple unrelated users and reselling access, including MCP access. Teams use Enterprise." },
    ],
    sources: [TERMS, PRIVACY, PRICING],
    related: ["/trust", "/buzzvideo-commercial-use", "/is-buzzvideo-legit", "/ai-face-swap", "/help"],
  },
];
