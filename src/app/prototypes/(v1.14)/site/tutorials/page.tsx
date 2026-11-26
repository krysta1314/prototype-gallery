/* 教程中心首页(v1.14,2026-11-26):/prototypes/site/tutorials ↔ buzzvideo.ai/tutorials */
import { tutorialMeta } from "./meta";
import { TutorialsShell } from "./Shell";

export const metadata = tutorialMeta();
export default function Page() {
  return <TutorialsShell />;
}
