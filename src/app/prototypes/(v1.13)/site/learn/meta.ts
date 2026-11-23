// /learn(BuzzVideo Academy)和各解答页的 <title> / description。非 client 文件，给服务端 generateMetadata 用，不引 React 组件。
import { GUIDES, LEARN } from "./content";

export const META: Record<string, { title: string; description: string }> = {
  [LEARN.slug]: { title: LEARN.title, description: LEARN.description },
  ...Object.fromEntries(GUIDES.map((g) => [g.slug, { title: g.title, description: g.description }])),
};
