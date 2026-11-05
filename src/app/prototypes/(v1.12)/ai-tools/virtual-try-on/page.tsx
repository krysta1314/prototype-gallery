import { DevToolPage } from "../app/DevToolPage";

/* Virtual Try-On 工具页(开发原型直达;?mode=model-swap = Model Swap 模式;评审页里从侧边栏进) */
export default async function VirtualTryOnPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <DevToolPage view={mode === "model-swap" ? "model-swap" : "virtual-try-on"} />;
}
