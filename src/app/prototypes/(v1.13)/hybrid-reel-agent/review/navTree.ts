import type { StepId } from "./journeys";

/**
 * 评审左栏的多级导航(和 BuzzVideo APP 评审原型同一套结构):一级 = 产品模块(Agent / 画布剪辑器),
 * 二级 = 环节,三级 = 子流程,叶子 = 步骤 id。异常不单独成组,放进它发生的那个环节里,用警示样式标出
 * (旅程数据里 group 含「异常」的就是异常)。新增步骤时记得挂到这里;tests 会检查每一步都恰好出现一次
 */
export type NavNode = { label: string; children: (NavNode | StepId)[]; /** 只有二级环节有:环节色,左栏用它把各环节分开 */ color?: string };

export const NAV_TREE: NavNode[] = [
  {
    label: "Agent",
    children: [
      { label: "开始", color: "#2f6fed", children: ["creationType", "picked", "uploadLimit", "uploadInterrupted", "empty"] },
      { label: "分析", color: "#8b5cf6", children: ["analyzing", "questions", "partial", "failAnalyze", "unusable", "answerFirst"] },
      { label: "方案", color: "#16a34a", children: ["plan", "revised", "addFootage", "sendFailed"] },
      {
        label: "生成",
        color: "#db2777",
        children: ["generating", "stopped", "noCredits", { label: "生成失败", children: ["genFailed", "genModeration", "genRewrite", "genVoiceFailed"] }],
      },
      { label: "交付", color: "#0891b2", children: ["reel", "editFailed", "failVideo"] },
    ],
  },
  {
    label: "画布剪辑器",
    children: [
      { label: "画布", color: "#2f6fed", children: ["canvas", "editorGuide", "shotsGenerating", "shotsReady", "nodeSettings", "multiEditor", "shotFailed"] },
      { label: "剪辑", color: "#8b5cf6", children: ["timeline", "undoRedo", "split", "deleteClip", "speed", "cards", "subtitles", "media", "fullScreen"] },
      { label: "声音", color: "#16a34a", children: ["voice", "music", "sfx", "voiceFailed", "noSpeech"] },
      { label: "封面与导出", color: "#db2777", children: ["cover", "exportGate", "exporting", "coverNoFootage"] },
    ],
  },
];

/** 叶子(步骤 id)按导航顺序展开 */
export function navLeaves(nodes: (NavNode | StepId)[] = NAV_TREE): StepId[] {
  return nodes.flatMap((n) => (typeof n === "string" ? [n] : navLeaves(n.children)));
}

/** 某一步所在的各级分组标签 */
export function navPathOf(id: StepId, nodes: (NavNode | StepId)[] = NAV_TREE, trail: string[] = []): string[] | null {
  for (const n of nodes) {
    if (typeof n === "string") {
      if (n === id) return trail;
      continue;
    }
    const hit = navPathOf(id, n.children, [...trail, n.label]);
    if (hit) return hit;
  }
  return null;
}

/** 所有分组的 key(默认全部展开用) */
export const keyOf = (trail: string[]) => trail.join(" › ");
export const ALL_GROUP_KEYS: string[] = (() => {
  const out: string[] = [];
  const walk = (nodes: (NavNode | StepId)[], trail: string[]) => {
    for (const n of nodes) {
      if (typeof n === "string") continue;
      const t = [...trail, n.label];
      if (t.length > 1) out.push(keyOf(t));
      walk(n.children, t);
    }
  };
  walk(NAV_TREE, []);
  return out;
})();
