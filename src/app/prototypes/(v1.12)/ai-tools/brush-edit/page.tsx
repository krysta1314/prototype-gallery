import { DevToolPage } from "../app/DevToolPage";

/* Remove Object + Inpaint 画笔页(开发原型直达;?mode=replace = Inpaint 模式;评审页里从侧边栏进) */
export default async function BrushEditPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <DevToolPage view={mode === "replace" ? "inpaint" : "remove-object"} />;
}
