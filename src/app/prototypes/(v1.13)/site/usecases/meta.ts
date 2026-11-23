// 用例 / 广告模板页的 <title> 和 meta description。服务端 generateMetadata 读这里，不引 React。
// 标题 ≤60 字符、关键词在前、以 " | BuzzVideo" 结尾;描述 120–160 字符。
import { USE_CASES } from "./usecase-content";

export const META: Record<string, { title: string; description: string }> = Object.fromEntries(
  USE_CASES.map((u) => [u.slug, { title: u.metaTitle, description: u.metaDescription }]),
);
