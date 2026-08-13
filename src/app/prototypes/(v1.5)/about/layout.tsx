import type { Metadata } from "next";

/* page.tsx 是 client component,不能 export metadata;
   套一层 server layout 专门承载 SEO 与分享卡片信息。 */
export const metadata: Metadata = {
  title: "About BuzzVideo — The all-in-one AI studio for marketing",
  description:
    "BuzzVideo brings cinematic intelligence and a unified creative workflow together, so marketing teams, creators, and ecommerce sellers can produce ad video and visuals at any scale.",
  openGraph: {
    title: "About BuzzVideo — The all-in-one AI studio for marketing",
    description:
      "Produce campaign-ready ad video and visuals at any scale — without the timeline, the crew, or the production budget.",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
