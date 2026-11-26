// 问答页内容(2026-11-26)。格式同 learn/content.ts 的 Guide;GEO 写法见文件头注释。
// 本文件 11 页(搜索词见 docs/research/keywords/2026-11-25-geo-briefs.json)。
// 事实来源(2026-11-26 用 WebFetch 逐页打开核对):
//   - FTC:Disclosures 101 for Social Media Influencers、2023-06 更新 Endorsement Guides 新闻稿(定义改动明确含 virtual influencers)、
//     16 CFR 255.2(演员冒充消费者需披露)、16 CFR 465.2(禁止虚构评价人 / 证言)。
//   - Amazon:sell.amazon.com/blog/amazon-product-video(Seller Central 两条上传路径、资格、每 ASIN 最多 4 条、规格)。
//   - TikTok:Ads 帮助中心 creative best practices(9:16、≥720P、前 3 / 6 秒);社区准则 integrity-authenticity(写实 AI 内容须标注);
//     TikTok Shop Seller University:AI-Generated Content Restrictions and Requirements(允许 / 禁止、披露方式)、
//     Requirements for High-Quality Videos and LIVEs(真实场景、露脸、实物)、Policy Pulse 2026-09(美妆个护 / 健康 2026-10-19 起限制 AIGC)。
//     TikTok Shop 官方没有查到时长 / 分辨率规格，正文不写数字。
//   - 产品能力:tools/content/*.ts 与 tool-content.ts(Motion Control、SeedVR 放大、Face Swap、Lip Sync、Voice Over、Script to Video 等)。
//     AI Dubbing / AI Video Translator 产品未上线，如实写「两步做法」。

import type { Guide } from "../learn/content";
import { SIGNUP_CREDITS } from "../tools/credits";

const NO_FREE_VIDEO = `Video models on BuzzVideo need a Starter, Pro or Ultra plan. The ${SIGNUP_CREDITS} free credits new accounts get work on Seedream 4.5, Seedream 5.0 lite (images) and Seed Audio 1.0 (voice and music).`;

export const SUGGEST_B: Guide[] = [
  /* ───────────── What is an AI influencer? ───────────── */
  {
    slug: "what-is-an-ai-influencer",
    group: "Questions",
    title: "What Is an AI Influencer? Meaning and FTC Rules | BuzzVideo",
    description: "What is an AI influencer? A virtual creator with a consistent face and voice. How brands use them, what the FTC requires you to disclose and how to make one.",
    h1: "What is an AI influencer?",
    answer:
      "An AI influencer is a virtual creator: a computer-generated person or character with a consistent face, voice and personality that posts and promotes products like a human influencer. The FTC's 2023 update to its Endorsement Guides changed the definition of endorsements to cover virtual influencers, so brand deals still have to be disclosed. On BuzzVideo you can design one, keep the same face across images and videos, and have them talk to camera.",
    card: "A virtual creator, held to the same disclosure rules as a human one.",
    media: { from: "video", match: "creator-style product review", caption: "An AI creator reviewing a product in a UGC-style ad made on BuzzVideo." },
    sections: [
      {
        id: "definition",
        h2: "How is an AI influencer different from a real influencer?",
        blocks: [
          { kind: "p", text: "A real influencer is a person filming their own life. An AI influencer is designed: the brand or creator decides the look, the voice and what the character talks about, then generates every photo and video. Nobody is on camera." },
          { kind: "table", head: ["", "Human influencer", "AI influencer"], rows: [
            ["Who appears", "A real person", "A generated person or character"],
            ["Content", "Filmed or photographed", "Generated from prompts and reference images"],
            ["Real product experience", "Possible", "None. The character has never used the product"],
            ["Disclosure of brand deals", "Required by the FTC", "Required by the FTC"],
          ] },
          { kind: "p", text: "An AI influencer is also different from a one-off [AI avatar video](/make-ai-avatar-video). An avatar is a single talking video. An influencer is a character you keep using, with the same face across many posts." },
        ],
      },
      {
        id: "uses",
        h2: "How do brands use AI influencers?",
        blocks: [
          { kind: "ul", items: [
            "A recurring brand host who presents tips, launches and how-tos in the same voice every time.",
            "Creator-style product videos for TikTok, Reels and Shorts, without booking a creator for each post.",
            "Testing different personas for the same product before paying for a human creator campaign.",
            "Channels that post on a fixed schedule, since the character never needs a day off.",
          ] },
          { kind: "p", text: "What an AI influencer cannot do is give a real review. It has never used your product, so scripts should describe the product, not claim personal results." },
        ],
      },
      {
        id: "ftc",
        h2: "Do AI influencers have to disclose sponsorships?",
        blocks: [
          { kind: "p", text: "Yes. When the FTC updated its Endorsement Guides in 2023, one of the listed changes was to the definition of endorsements, to clarify how far it reaches, including fake reviews and virtual influencers. The FTC's plain-language guide for influencers sets out how to disclose:" },
          { kind: "ul", items: [
            "Disclose any financial, employment, personal or family relationship with the brand. Free or discounted products count.",
            "Put the disclosure with the endorsement, where it is hard to miss. Not only on the profile page, at the end of a post or behind a \"more\" link.",
            "Use clear words such as \"advertisement\", \"ad\" or \"sponsored\". Avoid vague tags such as \"sp\", \"spon\" or \"collab\".",
            "In a video, put the disclosure in the video itself, not only in the description. Saying it and showing it on screen is more likely to be noticed.",
          ] },
          { kind: "p", text: "There is a second rule for AI characters: don't present them as real customers. The FTC's Endorsement Guides say that when an ad uses people who appear to be actual consumers but are not, that should be clearly disclosed, and its rule on fake reviews and testimonials prohibits misrepresenting that a reviewer or testimonialist exists." },
          { kind: "note", text: "Platforms add their own labels. TikTok's Community Guidelines require creators to label AI-generated or significantly edited content that shows realistic-looking scenes or people. This is a summary, not legal advice." },
        ],
      },
      {
        id: "make",
        h2: "How do you make an AI influencer?",
        blocks: [
          { kind: "ol", items: [
            "Design the character: age range, style, setting and personality. Start from an original description, not a real person's photo.",
            "Generate several angles and save them as reference images.",
            "Reuse the same references in every new image and video so the face stays the same.",
            "Pick a voice and keep it: a preset voice, or a cloned voice you have permission to use.",
            "Write scripts that describe the product and disclose the brand relationship in the video.",
          ] },
          { kind: "p", text: "See [How to make UGC ads with AI](/make-ugc-ads-with-ai) for writing the script and testing variations." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Design the character in Image with Nano Banana 2.1 and save several angles as references. It takes up to 14 reference images.",
        "Make videos with the same references: MiniMax H3 takes up to 9 for video, and Kling 4.0 does up to 30 seconds in one take.",
        "Give them a voice with Seed Audio 1.0, then turn one photo and the voice track into a talking video with the AI Avatar Video Generator.",
      ],
      cta: { label: "Create an AI influencer", href: "/ai-influencer-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "What is a virtual influencer?", a: "Another name for an AI influencer: a generated person or character with a consistent look and voice who posts and promotes products like a human influencer. Brands design the character and generate every photo and video." },
      { q: "Do AI influencers have to follow FTC rules?", a: "Yes. The FTC's 2023 update to its Endorsement Guides changed the definition of endorsements to clarify that it includes virtual influencers, so brand relationships must be clearly disclosed. This is a summary, not legal advice." },
      { q: "How should an AI influencer disclose a sponsored post?", a: "With clear words such as \"ad\" or \"sponsored\" placed with the endorsement, where it is hard to miss. In videos, the FTC advises putting the disclosure in the video itself, ideally both said and shown." },
      { q: "Can an AI influencer review my product?", a: "It can describe and show the product, but it cannot give a genuine review, because it has never used it. The FTC says people who appear to be real customers but are not should be disclosed." },
      { q: "Can I base an AI influencer on a real person?", a: "Only with that person's permission. Otherwise create an original character, so you are not using someone's likeness without consent." },
      { q: "Is there a free AI influencer generator?", a: `For images, yes. Seedream 4.5 and Seedream 5.0 lite take reference images and work with the ${SIGNUP_CREDITS} free credits new BuzzVideo accounts get, and so does Seed Audio 1.0 for the voice. Videos need a Starter, Pro or Ultra plan.` },
    ],
    sources: [
      { label: "FTC: Disclosures 101 for Social Media Influencers", url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" },
      { label: "FTC press release: updated Endorsement Guides (June 2023)", url: "https://www.ftc.gov/news-events/news/press-releases/2023/06/federal-trade-commission-announces-updated-advertising-guides-combat-deceptive-reviews-endorsements" },
      { label: "16 CFR 255.2, Consumer endorsements (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/255.2" },
      { label: "16 CFR 465.2, Fake or false consumer reviews and testimonials (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/465.2" },
      { label: "TikTok Community Guidelines: Integrity and authenticity", url: "https://www.tiktok.com/community-guidelines/en/integrity-authenticity" },
    ],
    related: ["/ai-influencer-generator", "/consistent-character", "/talking-avatar", "/make-ai-avatar-video", "/ai-ugc-ads"],
    legal: true,
    terms: [
      { term: "Virtual influencer", def: "Another name for an AI influencer: a computer-generated character that posts like a creator." },
      { term: "Material connection", def: "The FTC's term for a relationship with a brand that viewers might not expect, such as payment, free products or employment." },
    ],
  },

  /* ───────────── How to make an AI dance video ───────────── */
  {
    slug: "how-to-make-an-ai-dance-video",
    group: "How-to guides",
    title: "How to Make an AI Dance Video from a Photo | BuzzVideo",
    description: "How to make an AI dance video: pair one full-body photo with a dance clip and let motion control copy the moves. What works best, length limits and costs.",
    h1: "How do I make an AI dance video?",
    answer:
      "Upload one clear, full-body photo of the person or character, add a reference dance video, and let a motion control model copy the moves onto the photo. On BuzzVideo, Motion Control on Kling 3.0 follows dance clips from 2 to 30 seconds and can keep the original music. The video step needs a paid plan.",
    card: "One full-body photo plus one dance clip.",
    sections: [
      {
        id: "how-it-works",
        h2: "How does an AI dance video work?",
        blocks: [
          { kind: "p", text: "Most AI dance videos use motion control, also called motion transfer. The model reads the body movement in a reference video and applies it to the person or character in your photo. The face, outfit and look come from the photo. The choreography comes from the video." },
          { kind: "p", text: "That is why the results look more like real dancing than a text prompt alone. A prompt such as \"she dances\" leaves the moves to the model; a reference clip gives it the exact steps." },
        ],
      },
      {
        id: "steps",
        h2: "What are the steps to create an AI dance video?",
        blocks: [
          { kind: "ol", items: [
            "Pick the dancer: one clear, full-body photo with arms and legs visible. On BuzzVideo it can be a JPG, PNG or WEBP up to 20 MB.",
            "Pick the moves: a dance video of up to 30 seconds, filmed so the whole body stays in frame.",
            "Choose the orientation: the character can face the way it does in the video (2 to 30 seconds) or the way it does in the photo (up to 10 seconds).",
            "Keep or drop the original sound, then generate.",
            "Watch the result for hands, feet and clothing, and regenerate if a move breaks.",
          ] },
        ],
      },
      {
        id: "inputs",
        h2: "What photo and dance clip work best?",
        blocks: [
          { kind: "table", head: ["Input", "Works well", "Causes problems"], rows: [
            ["Photo", "Full body, plain pose, good light", "Cropped legs, hands hidden, heavy blur"],
            ["Dance clip", "One dancer, whole body in frame, steady camera", "Several dancers, fast cuts, the dancer leaving the frame"],
            ["Outfit", "Clothes that show the body shape", "Very long or loose garments that hide the legs"],
          ] },
          { kind: "p", text: "Cartoon and 3D characters work too, not only real people. The model applies the human movement from your clip to the character in the photo." },
        ],
      },
      {
        id: "rules",
        h2: "Can I make a dance video of someone else?",
        blocks: [
          { kind: "p", text: "Only with their permission, or with a character you created. Use dance clips you have the rights to, such as your own recording or a licensed clip. TikTok's Community Guidelines require creators to label AI-generated content that shows realistic-looking people, so label the post when you share it." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Open Motion Control and upload one full-body photo of the person, mascot or character.",
        "Upload the dance video, up to 30 seconds, and choose whether to keep its sound.",
        "Generate with Kling 3.0, then download the MP4. For group routines, the 3D Director skill blocks the choreography in 3D first through BuzzVideo MCP.",
      ],
      cta: { label: "Make an AI dance video", href: "/ai-dance-video" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "How do I make an AI dance video for free?", a: `On BuzzVideo the dance video itself is not free: Motion Control runs on Kling 3.0, which needs a Starter, Pro or Ultra plan. You can make the character image for free with Seedream 4.5 or Seedream 5.0 lite on the ${SIGNUP_CREDITS} credits new accounts get.` },
      { q: "How long can an AI dance video be?", a: "On BuzzVideo, 2 to 30 seconds when the character faces the way the dancer does in the video, and up to 10 seconds when it faces the way it does in the photo." },
      { q: "Can I keep the music from the dance video?", a: "Yes. Motion Control can keep the original sound of your dance video, or drop it so you can add your own track. Use music you have the rights to." },
      { q: "Can a mascot or cartoon character dance?", a: "Yes. Motion Control applies human movement from a video to illustrations and 3D characters as well as people." },
      { q: "Can several people dance together?", a: "Motion Control animates one character from one photo. For group routines, BuzzVideo's 3D Director skill blocks the choreography in 3D, then renders the same moves photoreal." },
      { q: "Do I need to label an AI dance video?", a: "On TikTok, yes, if it shows realistic-looking people: TikTok's Community Guidelines require creators to label AI-generated or significantly edited content of that kind." },
    ],
    sources: [
      { label: "TikTok Community Guidelines: Integrity and authenticity", url: "https://www.tiktok.com/community-guidelines/en/integrity-authenticity" },
    ],
    related: ["/ai-dance-video", "/motion-control", "/image-to-video", "/tiktok-ai-video-generator"],
    howto: {
      name: "How to make an AI dance video",
      steps: [
        "Upload one clear, full-body photo of the dancer.",
        "Upload a reference dance video of up to 30 seconds.",
        "Choose whether the character faces like the video or like the photo.",
        "Keep or drop the original sound and generate.",
        "Check hands, feet and clothing, and regenerate if needed.",
      ],
    },
  },

  /* ───────────── What is UGC advertising? ───────────── */
  {
    slug: "what-is-ugc-advertising",
    group: "Questions",
    title: "What Is UGC Marketing? UGC Ads and AI UGC | BuzzVideo",
    description: "What is UGC marketing? Using customer-style content in your ads and channels. What UGC ads and AI UGC are, the formats that work and the FTC rules to follow.",
    h1: "What is UGC marketing?",
    answer:
      "UGC marketing is using user-generated content, videos, photos and reviews made by customers or creators, in a brand's own channels and ads. UGC ads are paid ads in that phone-filmed, person-to-camera style, and AI UGC is the same format with the person generated by AI. Real customers can give real reviews; AI or hired people cannot, so they should not be presented as customers.",
    card: "Customer-style content, used on purpose.",
    media: { from: "video", match: "UGC selfie video of a woman reviewing", caption: "A UGC-style selfie review made on BuzzVideo with Seedance 2.5." },
    sections: [
      {
        id: "types",
        h2: "What is the difference between UGC, UGC ads and AI UGC?",
        blocks: [
          { kind: "table", head: ["Term", "What it means", "Who appears"], rows: [
            ["UGC", "Content customers post on their own: reviews, unboxings, photos", "Real customers"],
            ["UGC marketing", "A brand reposting or featuring that content in its channels, with permission", "Real customers"],
            ["UGC ads", "Paid ads filmed in the UGC style, often by hired creators", "Customers or paid creators"],
            ["AI UGC", "UGC-style videos where the person on camera is generated", "An AI-generated person"],
          ] },
          { kind: "p", text: "The words overlap in practice. When marketers say \"UGC ads\" they usually mean the style, a person talking to a phone camera about a product, not who made it." },
        ],
      },
      {
        id: "formats",
        h2: "What are the most common UGC ad formats?",
        blocks: [
          { kind: "ul", items: [
            "A to-camera review: one person, one product, one reason to buy.",
            "An unboxing at home, which shows the packaging and size.",
            "A routine or \"get ready with me\" with the product in use.",
            "A problem and fix demo, shown in one shot.",
            "A reaction or \"I didn't think this would work\" opener.",
          ] },
          { kind: "p", text: "TikTok's creative best practices recommend vertical 9:16, introducing the proposition in the first 3 seconds and prioritizing the hook in the first 6. See [How to write a good hook](/write-a-good-hook)." },
        ],
      },
      {
        id: "ai-ugc",
        h2: "What is AI UGC and when does it make sense?",
        blocks: [
          { kind: "p", text: "AI UGC generates the creator from a product photo and a script, so there is no creator to find and no product to ship. It suits hook testing, new markets and products that are not in stock yet. Human UGC carries something AI can't: a real person's real experience with the product." },
          { kind: "p", text: "Many teams use both: real customers and creators for genuine reviews, and AI for volume and variations. See [Do UGC ads work?](/do-ugc-ads-work) and [How to make UGC ads with AI](/make-ugc-ads-with-ai)." },
        ],
      },
      {
        id: "rules",
        h2: "What rules apply to UGC ads?",
        blocks: [
          { kind: "ul", items: [
            "Get permission before you use a customer's post in your marketing.",
            "Paid or gifted creators must disclose the relationship. The FTC asks for clear words such as \"ad\" or \"sponsored\", placed where they are hard to miss.",
            "If people in an ad appear to be real customers but are not, such as actors, the FTC's Endorsement Guides say this should be clearly disclosed.",
            "The FTC's rule on fake reviews and testimonials prohibits misrepresenting that a reviewer or testimonialist exists, so an AI person should not give a testimonial as if real.",
            "Label AI-generated realistic people on TikTok, as its Community Guidelines require.",
          ] },
          { kind: "note", text: "This is a summary, not legal advice." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Upload one product photo to the AI UGC Video Generator.",
        "Describe the person and setting, and paste the script or ask for three hooks.",
        "Generate in 9:16 with Kling 4.0, which does up to 30 seconds in one take, then make variations of the winner.",
      ],
      cta: { label: "Make an AI UGC ad", href: "/ai-ugc-video-generator" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "What is UGC content?", a: "UGC content is anything customers or creators make about a product, such as reviews, unboxings and photos. Brands use it in their own channels and ads. It works because it looks like a person sharing a product, not a studio ad." },
      { q: "What are UGC ads?", a: "Paid ads made in the user-generated style: a person talking to a phone camera about a product, usually in 9:16 for TikTok, Reels and Shorts. The person can be a customer, a paid creator or an AI-generated character." },
      { q: "What is AI UGC?", a: "UGC-style video where the person on camera is generated by AI from a product photo and a script. It keeps the format of UGC without hiring or shipping product to a creator." },
      { q: "What does UGC stand for?", a: "User-generated content: anything customers or users create about a product, rather than the brand." },
      { q: "Do I need to disclose UGC ads?", a: "If creators are paid or gifted the product, yes: the FTC requires the relationship to be disclosed clearly. If the people are actors or AI and look like real customers, the FTC's Endorsement Guides say that should be disclosed too." },
      { q: "Can I make AI UGC ads for free?", a: `Not the video. UGC clips on BuzzVideo use Kling 4.0, Seedance 2.5 and MiniMax H3, which need a Starter, Pro or Ultra plan. You can voice a script with Seed Audio 1.0 on the ${SIGNUP_CREDITS} free credits new accounts get.` },
    ],
    sources: [
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "FTC: Disclosures 101 for Social Media Influencers", url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers" },
      { label: "16 CFR 255.2, Consumer endorsements (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/255.2" },
      { label: "16 CFR 465.2, Fake or false consumer reviews and testimonials (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/465.2" },
      { label: "TikTok Community Guidelines: Integrity and authenticity", url: "https://www.tiktok.com/community-guidelines/en/integrity-authenticity" },
    ],
    related: ["/ai-ugc-ads", "/ai-ugc-video-generator", "/do-ugc-ads-work", "/make-ugc-ads-with-ai", "/write-a-good-hook"],
    terms: [
      { term: "UGC", def: "User-generated content: posts, videos and reviews made by customers or users rather than the brand." },
      { term: "AI UGC", def: "UGC-style video in which the person on camera is generated by AI." },
    ],
  },

  /* ───────────── How to write a video ad script ───────────── */
  {
    slug: "how-to-write-a-video-ad-script",
    group: "How-to guides",
    title: "How to Script a Video Ad: Format and Example | BuzzVideo",
    description: "How to script a video: hook first, one line per scene, a clear call to action. A simple ad script format, a 15-second example and how to turn it into a video.",
    h1: "How do I write a video ad script?",
    answer:
      "Write one idea per line in four parts: a hook in the first 3 seconds, the problem, the product as the answer, and a call to action. Put what the viewer sees next to what they hear, so every line becomes a scene. Keep a 15-second ad to about four or five short lines and read it aloud with a timer.",
    card: "Hook, problem, product, call to action. One line per scene.",
    media: { from: "video", match: "LUMEA serum ad cut to a reference voiceover", caption: "A 15-second serum ad cut to a voiceover script, made on BuzzVideo." },
    sections: [
      {
        id: "structure",
        h2: "What is the structure of a video ad script?",
        blocks: [
          { kind: "ol", items: [
            "Hook: the first line, on screen and in the voiceover, that stops the scroll.",
            "Problem: one situation the viewer recognizes.",
            "Product: how it solves that problem, shown, not only said.",
            "Proof: a detail that makes it believable, such as a close-up or a demonstration.",
            "Call to action: what to do next, such as \"Shop now\" or \"Link below\".",
          ] },
          { kind: "p", text: "TikTok's creative best practices advise introducing your proposition in the first 3 seconds and prioritizing the hook in the first 6. That is why the hook and the product both belong near the top." },
        ],
      },
      {
        id: "format",
        h2: "What format should a video script use?",
        blocks: [
          { kind: "p", text: "Use two columns: what the viewer sees and what they hear. It keeps the visuals from drifting away from the words, and each row turns into one shot." },
          { kind: "table", head: ["Time", "Visual", "Audio and on-screen text"], rows: [
            ["0 to 3 s", "Close-up of a coffee stain on a white shirt", "\"Coffee on a white shirt, two minutes before a meeting.\""],
            ["3 to 7 s", "A hand presses the stain pen on the spot", "\"One swipe of this.\""],
            ["7 to 11 s", "The stain fades, shirt looks clean", "\"Gone. No water, no sink.\""],
            ["11 to 15 s", "Pen slides into a jacket pocket, end frame with the product", "\"Keep one in your bag. Link below.\""],
          ] },
          { kind: "note", text: "The product in this example is fictional. Only script effects your product really has, and show results as they really look." },
        ],
      },
      {
        id: "length",
        h2: "How long should a video ad script be?",
        blocks: [
          { kind: "p", text: "Write to the length of the placement, then read it aloud with a timer. Spoken words take longer than they look on the page, and a voiceover needs room to breathe between scenes. If it runs long, cut whole lines rather than speeding up the read." },
          { kind: "ul", items: [
            "Keep each line to one idea, so it fits one shot.",
            "Write the exact words a person says in quotes, so a video model doesn't improvise claims.",
            "Add short on-screen text for the hook, so it still reads with the sound off.",
          ] },
        ],
      },
      {
        id: "mistakes",
        h2: "What are common video script mistakes?",
        blocks: [
          { kind: "ul", items: [
            "Opening with the logo or a slow intro instead of the hook.",
            "Lines that describe feelings the camera can't show.",
            "Several messages in one ad, so none of them land.",
            "Claims you can't back up, such as results the product doesn't deliver.",
            "No call to action, or one that appears after most people have scrolled away.",
          ] },
          { kind: "p", text: "For more on openings, see [How to write a good hook](/write-a-good-hook). For a UGC-style script, see [How to make UGC ads with AI](/make-ugc-ads-with-ai)." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Paste the script into the Marketing Agent and say the length and aspect ratio, such as 30 seconds in 9:16.",
        "Check the plan: the agent splits the script into scenes, names the models and waits for you to confirm before it spends credits.",
        "Get one edit with visuals, a Seed Audio 1.0 voiceover and captions, then ask for changes in the same chat.",
      ],
      cta: { label: "Turn a script into a video", href: "/ai-script-to-video" },
      note: `Each generated shot runs up to 30 seconds on Seedance 2.5 and Kling 4.0, and longer scripts become several shots. ${NO_FREE_VIDEO}`,
    },
    faq: [
      { q: "How do you script a video?", a: "Write one idea per line, starting with a hook and ending with a call to action, and put what the viewer sees next to what they hear. Each line becomes one scene." },
      { q: "What is the best format for a video ad script?", a: "A two-column format: visuals on one side, voiceover and on-screen text on the other, with a rough time for each row." },
      { q: "How many words should a 15-second ad script have?", a: "Few enough to read aloud comfortably in 15 seconds with pauses. Time yourself reading it, and cut whole lines if it runs long." },
      { q: "Where should the hook go in a video script?", a: "In the first line. TikTok advises introducing your proposition in the first 3 seconds and prioritizing the hook in the first 6." },
      { q: "Can AI write a video ad script?", a: "Yes. BuzzVideo's Marketing Agent can write the script and hooks from a product or topic, show you the plan and then make the video after you confirm." },
      { q: "How do I script a video for an AI video generator?", a: "Open with a hook, write one short line per scene and put spoken lines in quotes. Each line becomes a scene, so keep one idea per line." },
    ],
    sources: [{ label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" }],
    related: ["/ai-script-to-video", "/write-a-good-hook", "/make-ugc-ads-with-ai", "/marketing-agent", "/ai-voice-over"],
    howto: {
      name: "How to write a video ad script",
      steps: [
        "Write a hook for the first 3 seconds.",
        "Add one problem the viewer recognizes.",
        "Show the product solving it.",
        "Add one proof point, such as a close-up or demonstration.",
        "End with a clear call to action.",
        "Read it aloud with a timer and cut lines that run long.",
      ],
    },
  },

  /* ───────────── How to upscale a video with AI ───────────── */
  {
    slug: "how-to-upscale-a-video-with-ai",
    group: "How-to guides",
    title: "How to Upscale a Video with AI (to 4K) | BuzzVideo",
    description: "How to AI upscale a video: upload the clip, pick a scale or a 4K target, compare and export. What AI upscaling fixes, what it can't and which settings to use.",
    h1: "How do I upscale a video with AI?",
    answer:
      "Upload the clip to an AI video upscaler, choose a scale factor or a target resolution such as 4K, generate, then compare before and after and export. The AI rebuilds detail in every frame instead of just stretching pixels. It works best on footage that is soft because it is low-resolution, not on shaky or heavily motion-blurred video.",
    card: "Pick a scale or 4K target, compare, export.",
    sections: [
      {
        id: "what",
        h2: "What does AI video upscaling do?",
        blocks: [
          { kind: "p", text: "Regular resizing stretches each frame, so edges get soft and blocky. An AI upscaler predicts the detail that would be there at a higher resolution and redraws each frame with it, keeping motion consistent from frame to frame." },
          { kind: "table", head: ["Footage", "What to expect"], rows: [
            ["480p or 720p AI-generated clips", "Good results. A common step before editing for larger screens"],
            ["Phone or UGC footage that is soft from low resolution", "Sharper and closer to the rest of the edit"],
            ["Shaky footage", "Not stabilized. Stabilize first in an editor"],
            ["Heavy motion blur", "Improves less, because the detail was never captured"],
          ] },
        ],
      },
      {
        id: "steps",
        h2: "What are the steps to AI upscale a video?",
        blocks: [
          { kind: "ol", items: [
            "Trim the clip to the part you need. Shorter clips cost less and finish faster.",
            "Upload it to the upscaler.",
            "Pick a scale factor, or a target resolution such as 1080p or 2160p (4K).",
            "Generate and compare before and after at full size.",
            "Export in the format your next step needs.",
          ] },
        ],
      },
      {
        id: "scale",
        h2: "Which scale factor gets my video to 4K?",
        blocks: [
          { kind: "table", head: ["Source", "Scale to reach 4K"], rows: [
            ["1080p", "2x"],
            ["720p", "3x"],
          ] },
          { kind: "p", text: "Going further than the screen you'll show it on adds file size without visible gain. For phone feeds, 1080p is usually enough; save 4K for big displays, events and editing headroom." },
        ],
      },
      {
        id: "export",
        h2: "Which format should I export an upscaled video in?",
        blocks: [
          { kind: "ul", items: [
            "MP4 to post or share, since it plays almost everywhere.",
            "WEBM for smaller files on a website.",
            "MOV (ProRes) if the clip goes back into an editing app.",
            "GIF only for short, silent loops.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Upload an MP4, MOV, WEBM or M4V up to 60 seconds and 200 MB.",
        "Set a scale factor up to 10x, or pick 720p, 1080p, 1440p or 2160p (4K), measured on the short side.",
        "SeedVR rebuilds the detail. Compare before and after, then export MP4, WEBM, MOV (ProRes) or GIF.",
      ],
      cta: { label: "Upscale a video", href: "/upscale-video" },
      note: "Video upscaling is priced by output size, 0.1 credits per megapixel across all frames, and needs a Starter, Pro or Ultra plan. The price shows before you generate, and failed runs are refunded.",
    },
    faq: [
      { q: "How do I AI upscale a video?", a: "Upload the clip, choose a scale factor or a target such as 2160p (4K), generate, then compare before and after and export. On BuzzVideo, SeedVR rebuilds detail in every frame." },
      { q: "Can AI upscale a video to 4K?", a: "Yes. Pick 2160p as the target, or scale 1080p footage 2x and 720p footage 3x." },
      { q: "Can AI fix a blurry video?", a: "Partly. It sharpens footage that is soft because of low resolution. It doesn't stabilize shaky video, and motion blur improves less because the detail was never recorded." },
      { q: "How long a video can I upscale on BuzzVideo?", a: "Up to 60 seconds and 200 MB per upload. Split longer footage into parts and upscale each one." },
      { q: "Is AI video upscaling free?", a: "Not on BuzzVideo: video tools need a Starter, Pro or Ultra plan. Image upscaling works with the free credits new accounts get." },
      { q: "What is a video upscaler?", a: "A tool that raises a video's resolution. AI upscalers also rebuild the fine detail, so the result looks sharp instead of stretched." },
    ],
    sources: [],
    related: ["/upscale-video", "/upscale-image", "/ai-video-generator", "/image-to-video"],
    howto: {
      name: "How to upscale a video with AI",
      steps: [
        "Trim the clip to the part you need.",
        "Upload it to the AI video upscaler.",
        "Pick a scale factor or a target such as 2160p (4K).",
        "Generate and compare before and after.",
        "Export as MP4, WEBM, MOV or GIF.",
      ],
    },
  },

  /* ───────────── What is AI dubbing? ─────────────
     AI Dubbing 一键功能未上线(tools/content/video.ts「Soon」),正文只写现有的两步做法:配音 + 对口型。 */
  {
    slug: "what-is-ai-dubbing",
    group: "Questions",
    title: "What Is AI Dubbing? How AI Video Dubbing Works | BuzzVideo",
    description: "What is AI dubbing? Replacing the speech in a video with an AI voice in another language, often with lip sync. How it works, what to check and how to do it now.",
    h1: "What is AI dubbing?",
    answer:
      "AI dubbing replaces the speech in a video with an AI-generated voice in another language, so the same video works in a new market. Most tools do it in three steps: translate the script, generate the new voiceover and, optionally, lip sync the speaker's mouth to it. BuzzVideo's one-step AI Dubbing tool is coming soon; today you can do it in two steps with AI Voice Over and AI Lip Sync.",
    card: "Translate, re-voice, lip sync.",
    media: { from: "extra", match: "ad-localizer", caption: "A frame from an ad localized for a new market with a BuzzVideo MCP Skill." },
    sections: [
      {
        id: "how",
        h2: "How does AI dubbing work?",
        blocks: [
          { kind: "ol", items: [
            "Transcribe: get the original script, with timing.",
            "Translate: write the script in the new language, close to the original length.",
            "Voice: generate the new-language voiceover, in a preset voice or a cloned voice you have permission to use.",
            "Lip sync (optional): change the speaker's mouth movement to match the new audio.",
            "Mix: put the new voice back over the music and sound effects.",
          ] },
          { kind: "p", text: "Without step 4 you get a voice-over dub, which suits narration and faceless videos. With it, the person on screen looks like they are speaking the new language." },
        ],
      },
      {
        id: "vs",
        h2: "Is AI dubbing the same as lip sync, voice over or translation?",
        blocks: [
          { kind: "table", head: ["Term", "What it does"], rows: [
            ["AI voice over", "Generates narration from a script"],
            ["AI lip sync", "Matches a speaker's mouth to audio that already exists"],
            ["AI dubbing", "Replaces the speech with a new-language voice, often with lip sync"],
            ["AI video translation", "Dubbing plus translated captions and on-screen text"],
          ] },
        ],
      },
      {
        id: "check",
        h2: "What should I check in an AI-dubbed video?",
        blocks: [
          { kind: "ul", items: [
            "A native speaker reads the translation before you voice it, especially prices, claims and product names.",
            "The new voiceover is close to the original length, so it fits the cuts.",
            "On-screen text and captions are translated too, or removed.",
            "Mouth movement looks natural on close-ups.",
            "You have permission for any voice you clone.",
          ] },
          { kind: "p", text: "Dubbing is an accepted use of AI on TikTok Shop, whose seller guidance lists translation, dubbing and subtitles among allowed uses, provided product information stays accurate." },
        ],
      },
      {
        id: "now",
        h2: "How can I dub a video on BuzzVideo today?",
        blocks: [
          { kind: "p", text: "The one-step AI Dubbing tool is not available yet. The two-step version works now:" },
          { kind: "ol", items: [
            "Make the new-language voiceover from your translated script with [AI Voice Over](/ai-voice-over). Seed Audio 1.0 speaks 21 languages; MiniMax Speech 2.8 HD covers 40+ with 17 preset voices.",
            "Open [AI Lip Sync](/ai-lip-sync), upload the original video and the new audio, and generate. MiniMax H3 Max handles videos from 5 seconds to 15 minutes; Kling LipSync handles clips of 2 to 10 seconds.",
          ] },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Translate the script yourself, or ask the Marketing Agent to translate it.",
        "Voice it in AI Voice Over with Seed Audio 1.0 or MiniMax Speech 2.8 HD, or in your own cloned voice.",
        "Upload the original video and the new audio to AI Lip Sync and generate the dubbed version.",
      ],
      cta: { label: "Make the voiceover", href: "/ai-voice-over" },
      note: `The one-step AI Dubbing tool is coming soon. The voiceover on Seed Audio 1.0 works with the ${SIGNUP_CREDITS} free credits new accounts get; the lip sync step is a video generation and needs a Starter, Pro or Ultra plan.`,
    },
    faq: [
      { q: "What does AI dubbed mean?", a: "It means the speech was replaced: AI dubbing swaps the speech in a video with an AI-generated voice in another language, often with the speaker's lips matched to the new audio." },
      { q: "What is AI video dubbing used for?", a: "Running the same ad, explainer or creator video in new markets without reshooting or booking voice actors for each language." },
      { q: "Does BuzzVideo have an AI dubbing tool?", a: "Not as a one-step tool yet; AI Dubbing is coming soon. Today you can dub in two steps: make the new-language voiceover with AI Voice Over, then match the mouth with AI Lip Sync." },
      { q: "Can I keep my own voice in another language?", a: "Yes. Clone your voice from a short, clean sample with Seed Audio 1.0 and have it read the translated script. Only clone voices you own or have permission to use." },
      { q: "Is AI dubbing the same as lip sync?", a: "No. Lip sync matches a mouth to audio that already exists. Dubbing first creates the new-language voice, then often uses lip sync so the speaker appears to say it." },
      { q: "How long a video can I dub on BuzzVideo?", a: "Up to 15 minutes with your own audio on MiniMax H3 Max in AI Lip Sync, or 2 to 10 second clips with Kling LipSync." },
    ],
    sources: [
      { label: "TikTok Shop Academy: AI-Generated Content Restrictions and Requirements", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=491489038501663&lang=en" },
    ],
    related: ["/ai-dubbing", "/ai-voice-over", "/ai-lip-sync", "/how-to-do-ai-lip-sync", "/clone-your-voice-with-ai"],
    terms: [
      { term: "Voice-over dub", def: "A dub that replaces the voice without changing the speaker's mouth movement." },
      { term: "Lip-sync dub", def: "A dub where the speaker's mouth is regenerated to match the new-language audio." },
    ],
  },

  /* ───────────── How to add video to an Amazon listing ───────────── */
  {
    slug: "how-to-add-video-to-amazon-listing",
    group: "How-to guides",
    title: "How to Add Video to an Amazon Listing | BuzzVideo",
    description: "How to add a video to an Amazon listing in Seller Central: the two upload paths, who is eligible, file specs and how to make the video from your product photos.",
    h1: "How do I add a video to an Amazon listing?",
    answer:
      "In Seller Central, go to Catalog, then Upload and Manage Videos, select Upload video, fill in the title, ASINs and other fields, and submit. You need a Professional selling account, live listings and at least three months of selling history; Brand Registry is not required. Amazon reviews each video before it goes live.",
    card: "Catalog, then Upload and Manage Videos.",
    media: { from: "video", match: "3D product turnaround", caption: "A 3D product turnaround video made on BuzzVideo." },
    sections: [
      {
        id: "steps",
        h2: "How do I upload a product video in Seller Central?",
        blocks: [
          { kind: "ol", items: [
            "In Seller Central's main menu, select Catalog, then Upload and Manage Videos.",
            "Select Upload video and choose your file.",
            "Complete the required fields: title, ASIN or ASINs, video type, brand association, language and thumbnail.",
            "Select Submit. Amazon reviews the video against its guidelines before it appears.",
          ] },
          { kind: "p", text: "You can also add a video from Image Manager: select Catalog, then Upload images, pick the product in the left pane, open the Videos tab in the right pane, complete the same fields and submit." },
        ],
      },
      {
        id: "eligible",
        h2: "Who can add videos to an Amazon listing?",
        blocks: [
          { kind: "ul", items: [
            "Sellers with a Professional selling account.",
            "Live product listings.",
            "At least three months of selling history.",
            "Brand Registry is not required, according to Amazon.",
          ] },
          { kind: "p", text: "Amazon's seller guidance says you can add up to 4 shoppable videos per ASIN." },
        ],
      },
      {
        id: "specs",
        h2: "What are the video requirements for an Amazon listing?",
        blocks: [
          { kind: "table", head: ["Spec", "Amazon guidance"], rows: [
            ["Format", ".mov or .mp4"],
            ["Resolution", "Up to 1080p"],
            ["File size", "Maximum 5 GB"],
            ["Length in the spec list", "Between 1 and 12 minutes"],
          ] },
          { kind: "note", text: "The same Amazon article recommends 30 to 90 seconds for most product videos while listing 1 to 12 minutes in its spec list. Check the upload screen for your marketplace before you export. See [How long should an Amazon product video be?](/amazon-product-video-length)" },
        ],
      },
      {
        id: "rejected",
        h2: "Why might Amazon reject a product video?",
        blocks: [
          { kind: "ul", items: [
            "The file is not .mp4 or .mov, or it is over 5 GB.",
            "The video doesn't match the product on the listing, for example a different color or variant.",
            "It shows claims or results the product can't back up.",
            "It doesn't follow Amazon's content guidelines for your category.",
          ] },
          { kind: "p", text: "If you make the video with AI, start from your real listing photos and check every frame, so the label, color and size match what buyers receive." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Upload your listing photos to the AI Product Video Generator.",
        "Ask for 16:9 clips: a 360 view, a feature close-up and the product in use. Seedance 2.5 takes up to 30 reference images.",
        "Join the clips to 30 to 90 seconds in Canvas, export MP4 at 1080p and upload it in Seller Central.",
      ],
      cta: { label: "Make an Amazon product video", href: "/amazon-product-videos" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "Where do I upload videos in Amazon Seller Central?", a: "Under Catalog, then Upload and Manage Videos. Choose Upload video, fill in the title, ASINs, video type, brand, language and thumbnail, and submit." },
      { q: "Do I need Brand Registry to add a video on Amazon?", a: "No. Amazon says sellers with a Professional account, live listings and at least three months of selling history can add videos, whether or not the brand is registered." },
      { q: "How many videos can an Amazon listing have?", a: "Amazon's seller guidance says up to 4 shoppable videos per ASIN." },
      { q: "What video format does Amazon accept?", a: ".mp4 or .mov, up to 1080p and a maximum of 5 GB." },
      { q: "How long does Amazon take to approve a video?", a: "Amazon reviews each video against its guidelines before it goes live, but the article we checked doesn't give a review time. Watch the status in Upload and Manage Videos." },
      { q: "Can I use an AI-generated video on Amazon?", a: "Amazon reviews every uploaded video against its guidelines, and the video has to show the product accurately. Make it from your real listing photos and check the label, color and size before you upload." },
    ],
    sources: [{ label: "Amazon Sell blog: Amazon product videos (requirements and best practices)", url: "https://sell.amazon.com/blog/amazon-product-video" }],
    related: ["/amazon-product-videos", "/amazon-product-video-length", "/ai-product-video-generator", "/add-video-to-shopify-product-page"],
    howto: {
      name: "How to add a video to an Amazon listing",
      steps: [
        "In Seller Central, select Catalog, then Upload and Manage Videos.",
        "Select Upload video and choose your file.",
        "Fill in the title, ASINs, video type, brand, language and thumbnail.",
        "Select Submit and wait for Amazon's review.",
      ],
    },
  },

  /* ───────────── How to use AI in ecommerce ───────────── */
  {
    slug: "how-to-use-ai-in-ecommerce",
    group: "How-to guides",
    title: "How to Use AI in Ecommerce: Practical Uses | BuzzVideo",
    description: "How to use AI in ecommerce: product photos, listing videos, UGC-style ads, copy and translation. Where AI saves the most time and what to check first.",
    h1: "How do I use AI in ecommerce?",
    answer:
      "Start where content is the bottleneck: product photos, listing videos and ad creative. AI turns one product photo into packshots, lifestyle images, 360 spins and UGC-style ads, and drafts copy and translations. Keep a person checking every output against the real product, because platforms and the FTC hold you to what the product actually does.",
    card: "Photos, videos, ads and copy from one product photo.",
    media: { from: "video", match: "product commercial made from photos", caption: "A product commercial made from product photos on BuzzVideo." },
    sections: [
      {
        id: "uses",
        h2: "Where does AI help most in an online store?",
        blocks: [
          { kind: "table", head: ["Job", "What AI does", "Where it goes"], rows: [
            ["Product photos", "Packshots, lifestyle scenes and infographics from one photo", "Listings, collection pages, email"],
            ["Product videos", "360 spins, feature close-ups, in-use demos", "Product pages, Amazon, Shopify"],
            ["Ad creative", "UGC-style videos, hook variations, statics in every size", "TikTok, Reels, Meta, YouTube"],
            ["Copy", "Titles, descriptions, ad scripts", "Listings and ads"],
            ["Localization", "Translated scripts and voiceovers", "New markets"],
          ] },
          { kind: "p", text: "Other uses, such as customer support chat, search and demand forecasting, sit inside store platforms and are outside what BuzzVideo does." },
        ],
      },
      {
        id: "start",
        h2: "How should a small store start with AI?",
        blocks: [
          { kind: "ol", items: [
            "Pick one best-selling product and one clean product photo with a readable label.",
            "Make the missing listing content first: two or three lifestyle images and one short product video.",
            "Make three to five ad variations that change one thing each, such as the hook or the person.",
            "Run them against your current ad and keep what works.",
            "Turn the winning prompts into a template and reuse them for every SKU, changing only the photo and name.",
          ] },
        ],
      },
      {
        id: "check",
        h2: "What should I check before publishing AI content?",
        blocks: [
          { kind: "ul", items: [
            "The product looks exactly like what ships: label, color, size and what's in the box.",
            "Results shown are results the product really delivers.",
            "AI people are not presented as real customers. The FTC's Endorsement Guides say people who appear to be customers but aren't should be disclosed.",
            "Platform AI rules: TikTok requires labels on realistic AI content, and TikTok Shop restricts AI in some categories.",
            "Each platform's file specs, such as Amazon's .mp4 or .mov up to 1080p and 5 GB.",
          ] },
        ],
      },
      {
        id: "channels",
        h2: "What sizes do ecommerce videos need?",
        blocks: [
          { kind: "p", text: "Make 16:9 or 1:1 for product pages and marketplaces, and 9:16 for TikTok, Reels and Shorts. TikTok's creative best practices recommend 9:16 vertical at least 720p. Generating each size from the same photo keeps the catalog consistent." },
          { kind: "p", text: "Guides for specific channels: [Add video to a Shopify product page](/add-video-to-shopify-product-page), [Add video to an Amazon listing](/how-to-add-video-to-amazon-listing) and [TikTok Shop videos](/how-to-make-tiktok-shop-videos)." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Upload one product photo and make listing images in Image, or videos in the AI Product Video Generator.",
        "Generate 16:9 for listings and 9:16 for ads from the same photo. Seedance 2.5 takes up to 30 reference images to keep packaging consistent.",
        "Reuse the same prompts for each SKU, or ask the Marketing Agent for a full set of photos, videos and ads.",
      ],
      cta: { label: "Make ecommerce videos", href: "/ai-video-for-ecommerce" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "What is AI used for in ecommerce?", a: "Mostly content: product photos, listing videos and ad creative made from one product photo, plus drafts of copy and translations. A person checks every output against the real product before it goes live." },
      { q: "What is the easiest way to start using AI for an online store?", a: "Take one best-selling product and make the content its listing is missing, such as lifestyle images and one short video, then a few ad variations to test." },
      { q: "Can AI make product photos for ecommerce?", a: `Yes. Image models turn one product photo into packshots, lifestyle scenes and infographics. On BuzzVideo, Seedream 4.5 and Seedream 5.0 lite work with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "Can AI make product videos from photos?", a: "Yes. Video models animate your product photos into 360 spins, close-ups, demos and UGC-style ads. Check the label and shape in every frame." },
      { q: "Is AI content allowed on Amazon and TikTok Shop?", a: "Both review content for accuracy. TikTok Shop allows AI content that is truthful and not misleading, requires disclosure of fully or significantly AI-generated content, and restricts AI in Beauty, Personal Care and Health videos. Amazon reviews each uploaded video against its guidelines." },
    ],
    sources: [
      { label: "Amazon Sell blog: Amazon product videos", url: "https://sell.amazon.com/blog/amazon-product-video" },
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "TikTok Shop Academy: AI-Generated Content Restrictions and Requirements", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=491489038501663&lang=en" },
      { label: "16 CFR 255.2, Consumer endorsements (Cornell LII)", url: "https://www.law.cornell.edu/cfr/text/16/255.2" },
    ],
    related: ["/ai-video-for-ecommerce", "/ai-product-photography", "/ai-product-video-generator", "/shopify-product-videos", "/can-ai-do-product-photography"],
    howto: {
      name: "How to start using AI in ecommerce",
      steps: [
        "Pick one best-selling product and one clean photo.",
        "Make the missing listing images and one short video.",
        "Make three to five ad variations that change one thing each.",
        "Test them against your current ad.",
        "Reuse the winning prompts for every SKU.",
      ],
    },
  },

  /* ───────────── How to face swap a video ───────────── */
  {
    slug: "how-to-face-swap-a-video",
    group: "How-to guides",
    title: "How to AI Face Swap a Video or Photo | BuzzVideo",
    description: "How to AI face swap: what face swap is, the steps for video and photos, what footage works best and the consent rules to follow before you post it or run an ad.",
    h1: "How do I face swap a video with AI?",
    answer:
      "Upload the video, add a photo of the new person or character, and let an AI model replace the person while keeping the original movement, camera and scene. Use only people who have agreed to it, or characters you created. On BuzzVideo, MiniMax H3 Max swaps up to four people in a 5 to 30 second clip at up to 1080p.",
    card: "One clip, one photo, and consent.",
    sections: [
      {
        id: "what",
        h2: "What is face swap?",
        blocks: [
          { kind: "p", text: "Face swap puts one person's face, or whole appearance, onto someone else in a photo or video. AI face swap uses a reference image of the new person and redraws them into the original shot, matching the lighting, angle and movement." },
          { kind: "table", head: ["", "Photo face swap", "Video face swap"], rows: [
            ["Input", "A photo and a second picture with the face", "A video clip and one photo per new person"],
            ["What changes", "The face", "On BuzzVideo, the whole character, not only the face"],
            ["What stays", "Everything else in the photo", "Movement, camera work and scene"],
          ] },
        ],
      },
      {
        id: "video-steps",
        h2: "How do I face swap a video?",
        blocks: [
          { kind: "ol", items: [
            "Pick a clip where each person is clearly visible, without long stretches where the face is hidden.",
            "Add a clear, front-facing photo of each new person or character.",
            "If there are several people, say who replaces whom.",
            "Generate and watch the result at full size for skin, hair edges and hands.",
            "Label the video as AI-generated where the platform requires it.",
          ] },
        ],
      },
      {
        id: "photo-steps",
        h2: "How do I face swap a photo?",
        blocks: [
          { kind: "ol", items: [
            "Open an image model and upload the photo you want to change.",
            "Upload a second picture with the face to use.",
            "Ask it to swap the face in the first image with the face in the second and keep everything else the same.",
            "Compare with the original and regenerate if the skin tone or lighting doesn't match.",
          ] },
        ],
      },
      {
        id: "consent",
        h2: "Is it legal to face swap someone?",
        blocks: [
          { kind: "p", text: "It depends on whose face it is and how you use it. Swapping in yourself, talent who signed a release, or an AI character you made is the safe route. Putting a real person into a video without their consent, or passing a swapped video off as real, can break platform rules and, in many places, the law." },
          { kind: "ul", items: [
            "Get written permission from anyone whose face you use, especially for ads.",
            "Don't use a public figure to imply they endorse your product.",
            "TikTok's Community Guidelines require creators to label AI-generated or significantly edited content that shows realistic-looking people.",
            "TikTok Shop prohibits using someone's likeness, voice or name without authorization.",
          ] },
          { kind: "note", text: "This is a summary, not legal advice. Rules on likeness and synthetic media differ by country and state." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Upload a clip of 5 to 30 seconds, with no single shot longer than 15 seconds.",
        "Add one photo per new character, up to four. They replace the people from left to right, or say who replaces whom in a prompt.",
        "Pick 768p or 1080p, turn on Enhance Realism for more natural skin and blending, and generate with MiniMax H3 Max.",
      ],
      cta: { label: "Face swap a video", href: "/video-face-swap" },
      note: `Video face swap needs a Starter, Pro or Ultra plan. Photo face swap works with any image model, including Seedream 4.5 on the ${SIGNUP_CREDITS} free credits new accounts get; see AI Face Swap.`,
    },
    faq: [
      { q: "Can AI swap a face in a video, not just a photo?", a: "Yes. A video model replaces the person in every frame from one reference photo and keeps the original movement, camera and scene. On BuzzVideo, MiniMax H3 Max does it for clips of 5 to 30 seconds." },
      { q: "How do I AI face swap a video?", a: "Upload the video and a photo of the new person, then generate. On BuzzVideo, MiniMax H3 Max replaces the person and keeps the movement, camera and background." },
      { q: "Can I face swap a video for free?", a: `Not on BuzzVideo: video face swap needs a Starter, Pro or Ultra plan. Photo face swap works on Seedream 4.5 with the ${SIGNUP_CREDITS} free credits new accounts get.` },
      { q: "How many faces can I swap in one video?", a: "Up to four on BuzzVideo. Add one photo per character; they replace the people from left to right, or say who replaces whom in the prompt." },
      { q: "Is face swap the same as a deepfake?", a: "It uses the same idea. The difference is consent and honesty: swap in people who agreed to it or characters you made, and label the result as AI-generated." },
      { q: "Can I use a face-swapped video in an ad?", a: "Only with written consent from everyone shown, and with the AI labels each platform requires. Don't use it to imply a real person endorses your product." },
    ],
    sources: [
      { label: "TikTok Community Guidelines: Integrity and authenticity", url: "https://www.tiktok.com/community-guidelines/en/integrity-authenticity" },
      { label: "TikTok Shop Academy: AI-Generated Content Restrictions and Requirements", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=491489038501663&lang=en" },
    ],
    related: ["/video-face-swap", "/ai-face-swap", "/motion-control", "/consistent-character"],
    legal: true,
    howto: {
      name: "How to face swap a video with AI",
      steps: [
        "Pick a clip where each person is clearly visible.",
        "Add a clear photo of each new person or character.",
        "Say who replaces whom if there are several people.",
        "Generate and check skin, hair edges and hands.",
        "Label the video as AI-generated where required.",
      ],
    },
  },

  /* ───────────── How to make TikTok Shop videos ─────────────
     TikTok Shop 官方没查到时长 / 分辨率规格，不写数字;只用 TikTok Ads creative best practices 的 9:16 / ≥720P / 前 3 和 6 秒。 */
  {
    slug: "how-to-make-tiktok-shop-videos",
    group: "How-to guides",
    title: "How to Make TikTok Shop Videos (and AI Rules) | BuzzVideo",
    description: "How to make TikTok Shop videos that follow the rules: what TikTok Shop wants to see, its AI content rules and category limits, and where AI video fits in.",
    h1: "How do I make TikTok Shop videos?",
    answer:
      "Film or generate a vertical 9:16 video that shows the real product clearly from the first seconds, explain its features and benefits, and link the product when you post. TikTok Shop's seller guidance favors real-world footage with a person and the physical product, allows AI content only when it is truthful, and requires fully or significantly AI-generated content to be disclosed.",
    card: "Real product, clear hook, honest AI use.",
    media: { from: "video", match: "15-second unboxing video", caption: "A 15-second unboxing video made from one product photo on BuzzVideo." },
    sections: [
      {
        id: "what-works",
        h2: "What does TikTok Shop want a shoppable video to show?",
        blocks: [
          { kind: "ul", items: [
            "The physical product, from more than one angle, with close-ups of the details.",
            "A person, with their face visible, in a real-world setting.",
            "Visuals that match what is said. If you mention several colors, show each one.",
            "How the product works, with before and after where it fits.",
            "No text or stickers covering the product.",
          ] },
          { kind: "p", text: "TikTok Shop's quality guidance also says content that relies mainly on still images, slideshows or screen recordings is not permitted. For the format, TikTok's ad best practices recommend vertical 9:16, at least 720p, the proposition in the first 3 seconds and the hook in the first 6." },
        ],
      },
      {
        id: "steps",
        h2: "What are the steps to make a TikTok Shop video?",
        blocks: [
          { kind: "ol", items: [
            "Pick one selling angle: an unboxing, a swatch or variant tour, a quick demo or a reason it's in your cart.",
            "Write a short script with the hook first. See [How to write a video ad script](/how-to-write-a-video-ad-script).",
            "Film the product, or generate the parts AI is allowed to make, starting from your listing photo.",
            "Check every claim and every frame against the real product.",
            "Post, link the product and turn on the AI-generated label if the video is fully or significantly AI-made.",
          ] },
        ],
      },
      {
        id: "ai-rules",
        h2: "Can I use AI-generated videos on TikTok Shop?",
        blocks: [
          { kind: "p", text: "Yes, with limits. TikTok Shop says content is not restricted just for using AI, as long as it is truthful, accurate and not misleading." },
          { kind: "table", head: ["Allowed with AI", "Not allowed with AI"], rows: [
            ["Visual styles and effects that keep product information accurate", "Showing a core product effect the real product doesn't have"],
            ["Lighting, color and background edits that don't alter the product", "Changing the product's size, color, quantity, features or compatibility"],
            ["Translation, dubbing and subtitles", "Using someone's likeness, voice or name without permission"],
            ["Scripts, titles and descriptions", "AI doctors, professors or other fake experts endorsing products"],
            ["Demonstrations that reflect the product's real size, function and results", "Exaggerated results, such as instant cleaning or instant hair growth"],
          ] },
          { kind: "note", text: "From October 19, 2026, TikTok Shop says Beauty, Personal Care and Health short videos may not use AI-generated content to demonstrate core product effects or product-use imagery, including AI humans or AI hands showing efficacy. Film those parts with the real product." },
        ],
      },
      {
        id: "disclose",
        h2: "How do I label AI content on TikTok Shop?",
        blocks: [
          { kind: "p", text: "TikTok Shop asks creators to disclose content that is fully generated by AI, or significantly edited in a way that changes its meaning. Either add a clear note in the video or description, such as on-screen text or a sticker, or turn on the AI-generated content setting when you post. Light edits such as color grading or noise reduction don't need a label." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Start from your TikTok Shop listing photo so the product matches the listing.",
        "Use AI for the parts TikTok Shop allows: scripts, b-roll that shows the product's real size and function, captions, translated voiceovers and hook variations.",
        "Generate 9:16, check every frame against the real product and turn on the AI-generated label when you post.",
      ],
      cta: { label: "Make TikTok Shop videos", href: "/tiktok-shop-videos" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "What makes a good TikTok Shop video?", a: "One that shows the real product clearly in the first seconds, with a person in a real setting, visuals that match what is said and the product linked. Check every claim against the real product." },
      { q: "Can I use AI videos on TikTok Shop?", a: "Yes, if they are truthful and accurate. TikTok Shop prohibits AI that misrepresents the product, fakes experts or uses someone's likeness without permission, and asks you to disclose fully or significantly AI-generated content." },
      { q: "Can I use AI for beauty or health products on TikTok Shop?", a: "With tighter limits. From October 19, 2026, Beauty, Personal Care and Health short videos may not use AI to demonstrate core product effects or product-use imagery, such as AI hands applying skincare." },
      { q: "Do TikTok Shop videos have to be a certain length?", a: "We couldn't find an official length requirement on TikTok Shop's seller pages. TikTok's ad guidance says to introduce your proposition in the first 3 seconds and prioritize the hook in the first 6." },
      { q: "What aspect ratio should a TikTok Shop video be?", a: "Vertical 9:16. TikTok's creative best practices recommend 9:16 at least 720p." },
      { q: "What is TikTok Shop?", a: "The shopping feature inside TikTok, where sellers list products and link them in videos and LIVEs, so viewers can buy without leaving the app." },
    ],
    sources: [
      { label: "TikTok Shop Academy: AI-Generated Content Restrictions and Requirements", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=491489038501663&lang=en" },
      { label: "TikTok Shop Academy: Requirements for High-Quality Videos and LIVEs", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=4581457528243969&lang=en" },
      { label: "TikTok Shop Academy: Suggestions for Creating High-Quality Shoppable Videos", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=2816204956665642&lang=en" },
      { label: "TikTok Shop Academy: Policy Pulse (September 2026)", url: "https://seller-us.tiktok.com/university/essay?knowledge_id=6747273381791534&lang=en" },
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
    ],
    related: ["/tiktok-shop-videos", "/tiktok-ad-specs", "/tiktok-ai-video-generator", "/ai-ugc-video-generator", "/write-a-good-hook"],
    howto: {
      name: "How to make a TikTok Shop video",
      steps: [
        "Pick one selling angle, such as an unboxing or a quick demo.",
        "Write a short script with the hook first.",
        "Film or generate the video in 9:16 from your listing photo.",
        "Check every claim and frame against the real product.",
        "Post, link the product and label AI-generated content.",
      ],
    },
  },

  /* ───────────── How to make a product demo video ───────────── */
  {
    slug: "how-to-make-a-product-demo-video",
    group: "How-to guides",
    title: "How to Make a Product Demo Video (Step by Step) | BuzzVideo",
    description: "How to make a product demo video: plan the steps, show one job from start to result and check every detail. Plus how to make a demo with AI from one photo.",
    h1: "How do I make a product demo video?",
    answer:
      "Pick the one job the product does, list the steps a buyer would follow, and show them in order from first touch to result, ideally in one continuous shot. Keep the product and the result clearly visible, add short captions or a voiceover for each step, and cut anything that isn't the demo. For physical products, AI can generate the demo from a photo and a step-by-step prompt.",
    card: "One job, shown from start to result.",
    media: { from: "video", match: "wiping a coffee spill", caption: "A one-take product demo generated on BuzzVideo." },
    sections: [
      {
        id: "plan",
        h2: "How do I plan a product demo video?",
        blocks: [
          { kind: "ol", items: [
            "Name the one question the demo answers, such as \"How does it clean?\" or \"How hard is setup?\"",
            "Write the steps a buyer follows, in order, in one line each.",
            "Decide the shot: hands only, a person in a room, or a close-up of the mechanism.",
            "Plan the ending on the result, not the logo.",
          ] },
        ],
      },
      {
        id: "types",
        h2: "What kinds of product demo videos work best?",
        blocks: [
          { kind: "table", head: ["Type", "Best for", "What to show"], rows: [
            ["Problem to result", "Cleaning, repair and beauty tools", "The problem, the product in use, the clear result"],
            ["Out of the box", "Electronics and appliances", "Unbox, connect, switch on"],
            ["Three-step how-to", "Products with a short routine", "Step 1, step 2, result"],
            ["Feature close-up", "Mechanisms, textures, pours", "One feature in slow motion"],
          ] },
          { kind: "p", text: "One unbroken shot builds more trust than quick cuts, because viewers see the whole process happen." },
        ],
      },
      {
        id: "length",
        h2: "How long should a product demo video be?",
        blocks: [
          { kind: "p", text: "As long as the job takes to show, and no longer. For social ads, put the product and the point in the first seconds: TikTok advises introducing your proposition in the first 3 seconds. For Amazon listings, Amazon says most successful product videos run 30 to 90 seconds and show the key feature in the first 5 to 10." },
        ],
      },
      {
        id: "software",
        h2: "How do I make a demo video for software or an app?",
        blocks: [
          { kind: "p", text: "Use a real screen recording of the product. AI video models are best at physical products and should not invent an interface. You can generate the surrounding shots, such as a person reacting to their phone, and add a voiceover, but the screens should be real." },
        ],
      },
    ],
    buzz: {
      title: "How to do it on BuzzVideo",
      steps: [
        "Upload a product photo and write the steps in order in the prompt.",
        "Pick a long-take model: Wan 3.0 runs 2 to 30 seconds in one take and takes up to 10 reference images; Kling 4.0 also reaches 30 seconds with sound.",
        "Check buttons, labels and hand positions, regenerate any step that looks wrong, and add a voiceover with Seed Audio 1.0 if you need one.",
      ],
      cta: { label: "Make a product demo video", href: "/product-demo-videos" },
      note: NO_FREE_VIDEO,
    },
    faq: [
      { q: "What is a product demo video?", a: "A short video that shows a product doing its job from start to result, so a buyer can see how it works before buying. The best ones show one job, step by step, in one continuous shot." },
      { q: "What should a product demo video include?", a: "The problem or starting point, the product in use step by step, and the result. Keep the product visible and end on the result." },
      { q: "Can AI make a product demo video?", a: "For physical products, yes. A video model generates the demo from a product photo and a step-by-step prompt. Only show what the product really does, and check every frame." },
      { q: "How do I make a demo video of my app?", a: "Record the real screens. AI video models are best at physical products, so use them for surrounding shots and add a voiceover, but keep the interface real." },
      { q: "What size should a product demo video be?", a: "9:16 for TikTok, Reels and Shorts, and 16:9 or 1:1 for product pages and listings. Wan 3.0 on BuzzVideo generates 9:16, 16:9, 1:1, 3:4 and 4:3." },
    ],
    sources: [
      { label: "TikTok Ads Manager: Creative best practices", url: "https://ads.tiktok.com/help/article/creative-best-practices" },
      { label: "Amazon Sell blog: Amazon product videos", url: "https://sell.amazon.com/blog/amazon-product-video" },
    ],
    related: ["/product-demo-videos", "/ai-product-video-generator", "/wan-3-0", "/amazon-product-video-length", "/ai-voice-over"],
    howto: {
      name: "How to make a product demo video",
      steps: [
        "Name the one question the demo answers.",
        "Write the buyer's steps in order.",
        "Choose the shot and plan to end on the result.",
        "Film or generate the demo in one continuous take.",
        "Add captions or a voiceover and check every detail.",
      ],
    },
  },
];
