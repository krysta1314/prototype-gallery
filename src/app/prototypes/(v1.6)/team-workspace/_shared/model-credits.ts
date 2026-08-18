/**
 * 每次生成的估算消耗 —— 评审第三节最后一条:
 * 「模型卡片上标注单次消耗,让用户在撞墙前能自己控制节奏。」
 *
 * 数字是前端占位,真实定价由后端配置;这里只保证同一个模型在
 * 模型卡片和 composer 估价里读到的是同一份数据。
 */

/** 单次输出(1 张图 / 1 条视频)的消耗 */
export const MODEL_UNIT_CREDITS: Record<string, number> = {
  // Image
  "Seedream 5.0 Pro": 60,
  "Seedream 5.0 lite": 14,
  "Seedream 4.5": 24,
  "GPT-image-2": 30,
  "Nano Banana 2 Lite": 8,
  "Nano Banana 2": 20,
  "Nano Banana Pro": 45,
  "Nano Banana": 12,
  // Video
  "Gemini Omni Flash": 90,
  "Seedance 2.5": 320,
  "Seedance 2.0": 240,
  "Seedance 2.0 Fast": 140,
  "Seedance 2.0 Mini": 80,
  "Seedance 1.5 Pro": 180,
  "Kling 3.0": 200,
  "Veo 3.1": 280,
  "Veo3.1 Fast": 150,
};

/** 没在表里的模型给一个保守默认值,不要让卡片出现空白 */
export const DEFAULT_UNIT_CREDITS = 30;

/** 一次生成默认出几张 / 几条 */
export const OUTPUTS_PER_RUN = 4;

export function unitCreditsOf(model: string) {
  return MODEL_UNIT_CREDITS[model] ?? DEFAULT_UNIT_CREDITS;
}

/** composer 里的估价 = 单价 × 张数 */
export function runCostOf(model: string) {
  return unitCreditsOf(model) * OUTPUTS_PER_RUN;
}
