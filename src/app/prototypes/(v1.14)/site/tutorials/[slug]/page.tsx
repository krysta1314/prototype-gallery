/* 单篇教程(v1.14):/prototypes/site/tutorials/<slug> ↔ buzzvideo.ai/tutorials/<slug> */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TUTORIALS } from "../content";
import { tutorialMeta } from "../meta";
import { TutorialsShell } from "../Shell";

export function generateStaticParams() {
  return TUTORIALS.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return tutorialMeta((await params).slug);
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!TUTORIALS.some((t) => t.slug === slug)) notFound();
  return <TutorialsShell slug={slug} />;
}
