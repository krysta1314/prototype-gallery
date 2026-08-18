import type { Template } from "../types";

export const TEMPLATE: Template = {
  id: "generation-blocked-apology",
  name: "生成失败道歉 + 补偿",
  category: "客服与支持",
  tone: "warn",
  trigger: "用户就「video generation failed / all video saying sensitive」提交反馈后,由 PM 人工回信(非系统自动发送)",
  to: "提交反馈的付费用户本人",
  subject: "BuzzVideo Feedback Response",
  blocks: [
    { t: "p", text: "Hi {{user_name}}," },
    { t: "p", text: "This is Monica, Product Manager at BuzzVideo." },
    { t: "p", text: "I received your feedback today regarding the issue where video generation failed with the error message \"all video saying sensitive.\" I am sincerely sorry for the frustrating experience this caused you." },
    { t: "p", text: "To help look into this, we checked the system logs with our downstream API provider. Their automated moderation flagged that the **4th reference image** submitted triggered a safety filter error (\"reference image contains sensitive information\"), which unfortunately halted the video generation process." },
    { t: "p", text: "Please also rest assured that whenever a generation fails, the credits for it are returned to your account immediately and automatically — you are never charged for a video/image you didn't get." },
    { t: "p", text: "If you would still like to generate this video, we recommend a couple of quick workarounds:" },
    { t: "p", text: "1. Swap the 4th reference image: try replacing it with a different photo that avoids elements that might inadvertently trigger strict content filters." },
    { t: "p", text: "2. Adjust or crop the image: making minor adjustments or cropping parts of the image can sometimes pass the automated check smoothly." },
    { t: "p", text: "We understand that automated AI moderation can sometimes be overly sensitive, and we deeply regret the inconvenience this caused. While we do not have a refund policy in place, we truly value you as part of our community." },
    { t: "p", text: "As a gesture of our appreciation and to help make things right, we have added **2,000 extra credits** directly to your account. You can start using them right away to try out new ideas and creations." },
    { t: "p", text: "Our team is constantly releasing updates, upgrading our AI models. We hope these bonus credits allow you to explore our latest features, and we are committed to providing you with a much smoother experience moving forward." },
    { t: "p", text: "If you have any further questions, concerns, or feedback, please feel free to reply directly to this email — I'll be glad to help personally." },
    { t: "signoff", line: "Best regards,", team: "Monica", title: "Product Manager@BuzzVideo" },
    { t: "footer", text: "You're receiving this because you have a BuzzVideo account.", links: ["Unsubscribe"], hidden: true },
  ],
};
