import { notFound } from "next/navigation";
import { TEMPLATES } from "../data";
import { EmailView } from "../email-view";

/** 每封邮件一个独立路由,便于单独把链接发给开发 / 设计。 */
export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tpl = TEMPLATES.find((t) => t.id === id);
  if (!tpl) notFound();

  return <EmailView tpl={tpl} />;
}
