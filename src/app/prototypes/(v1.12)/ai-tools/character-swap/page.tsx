import { DevToolPage } from "../app/DevToolPage";

/* Video Character Swap 工具页(开发原型直达;评审页里从侧边栏进)。2026-11-05 从 Video Gen 的模式拆出来，配置见 app/model-tools/specs.ts */
export default function CharacterSwapPage() {
  return <DevToolPage view="character-swap" />;
}
