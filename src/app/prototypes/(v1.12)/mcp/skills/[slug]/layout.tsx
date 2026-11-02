import type { Metadata } from "next";
import { SKILLS } from "../data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SKILLS.find((x) => x.slug === slug);
  return { title: s ? `${s.name} skill` : "Skill not found" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
