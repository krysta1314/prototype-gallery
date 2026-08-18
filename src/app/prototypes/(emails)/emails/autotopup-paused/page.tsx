import { EmailView } from "../email-view";
import { TEMPLATE } from "./content";

/** autotopup-paused —— 单封邮件的独立页面。文案改这个目录下的 content.ts。 */
export default function Page() {
  return <EmailView tpl={TEMPLATE} />;
}
