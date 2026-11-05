// Resize & Expand 的样图和主体框(fixture)。样图 = Upscale Image 的放大后演示图(1376×768,人像)。
// 主体框是手标的(头部 + 下巴,原图比例);用户上传的图原型里不做识别,主体当作画面中间一块。
import type { Rect } from "./logic";

export const SAMPLE_IMAGE = { url: "/prototypes/ai-tools/demo-after.png", name: "portrait.png", width: 1376, height: 768 };
export const SAMPLE_SUBJECT: Rect = { x: 0.355, y: 0.0, w: 0.285, h: 0.74 };
export const CENTER_SUBJECT: Rect = { x: 0.3, y: 0.2, w: 0.4, h: 0.6 };
