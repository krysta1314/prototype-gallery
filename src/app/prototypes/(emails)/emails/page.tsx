import { redirect } from "next/navigation";
import { TEMPLATES } from "./data";

/**
 * 邮件模板没有独立的索引页 —— 单封页面左侧已经列全了所有邮件,
 * 再平铺一次只是重复。进 /emails 直接落到第一封。
 */
export default function EmailTemplatesPage() {
  redirect(`/prototypes/emails/${TEMPLATES[0].id}`);
}
