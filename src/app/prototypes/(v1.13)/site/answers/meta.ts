// 新增规划批页面的 <title> / description(服务端用，不引 React)。
import { NEW_GUIDES } from "./content";

export const META: Record<string, { title: string; description: string }> = {
  answers: {
    title: "AI Video & Ad Questions, Answered | BuzzVideo",
    description: "Straight answers about AI video, AI ads, UGC, MCP and BuzzVideo itself: what it costs, what you can use commercially and which tools fit which job.",
  },
  ...Object.fromEntries(NEW_GUIDES.map((g) => [g.slug, { title: g.title, description: g.description }])),
};
