// 侧边栏菜单项 → 首页 Video Gen 的模型 + 模式(纯数据，ProductApp 和测试共用)

import type { ModeKey, ModelKey } from "./capabilities";

/** 侧边栏菜单项 → 首页 Video Gen 的模型 + 模式。
    只剩生成类专项能力;加工类(Lip Sync、Talking Avatar、Video Relight、3D to Video、Motion Control、Video Character Swap)
    2026-11-05 起是独立工具页(ai-tools 外壳直接打开),Video Reframe 并进 Video Resize。 */
/* 2026-11-05:进来时预填一句短提示词(和其他菜单项一样;[方括号] 是示例值，用户直接改) */
export const ENTRY_OF: Record<string, { model: ModelKey; mode: ModeKey; prompt: string }> = {
  "Camera Control": { model: "h3-max", mode: "camera", prompt: "[A perfume bottle on a marble counter], soft morning light. The product stays still while the camera moves." },
  "Video Styles": { model: "h3-max", mode: "style", prompt: "[A woman holding my product on a city street at sunset], told in the chosen style." },
};
