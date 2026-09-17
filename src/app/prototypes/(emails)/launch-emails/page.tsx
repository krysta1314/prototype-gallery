import { redirect } from "next/navigation";
import { LAUNCH_TEMPLATES } from "../emails/data";

/**
 * 和团队通知那边一样,不做单独的索引页 —— 单封页面左侧已经列全,
 * 进 /launch-emails 直接落到第一封。
 */
export default function LaunchEmailsPage() {
  redirect(`/prototypes/launch-emails/${LAUNCH_TEMPLATES[0].id}`);
}
