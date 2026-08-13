import type { Metadata } from "next";

const TITLE = "Seedance 2.5 AI Video Generator | AI BuzzVideo";
const DESCRIPTION =
  "Turn text prompts, images, and references into cinematic AI videos with the Seedance 2.5 model on AI BuzzVideo. Built for social, product ads, and storytelling.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/prototypes/seedance-2-5" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "AI BuzzVideo",
    url: "/prototypes/seedance-2-5",
    images: [{ url: "/prototypes/seedance-2-5/images/hero-poster.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/prototypes/seedance-2-5/images/hero-poster.jpg"],
  },
};

export default function SeedanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
