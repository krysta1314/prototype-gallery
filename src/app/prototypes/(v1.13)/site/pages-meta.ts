// 各批落地页的标题 / 描述汇总(服务端 generateMetadata 和导航 BUILT 共用;只引纯数据 meta.ts,不引 React 组件)。
// 新一批做完：在这里加一行 import + 展开。
import { META as GUIDES } from "./guides/meta";
import { META as LEARN } from "./learn/meta";
import { META as FREE } from "./free/meta";
import { META as COMPARE } from "./compare/meta";
import { META as USECASES } from "./usecases/meta";

export const PAGE_META: Record<string, { title: string; description: string }> = { ...GUIDES, ...LEARN, ...FREE, ...COMPARE, ...USECASES };
