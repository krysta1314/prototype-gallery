// Video Resize 的样片和主体轨迹(fixture,手标的,不是模型识别结果)。
// 样片:/prototypes/homepage/hero-3.mp4(1280×720,15.2s,Seedance 2.5 宣传片,画面上有 SEEDANCE 2.5 字标——是我们自己卖的模型,不是客户品牌)。
// 轨迹按 1fps 抽帧目测:0–2.9s 飞行员的脸(比 9:16 取景框宽 → 9:16 出框);3s 远处小人;4–6.4s 地面空镜(没有主体);
// 6.6–7.9s 双手拉伞绳(几乎满宽 → 所有竖版比例都出框);8s 起降落伞;11s 起长颈鹿 + 跳伞者。
import type { TrackKey } from "./logic";

export const SAMPLE_VIDEO = {
  url: "/prototypes/homepage/hero-3.mp4",
  name: "seedance-launch.mp4",
  width: 1280,
  height: 720,
  duration: 15.25,
};

export const SAMPLE_TRACK: TrackKey[] = [
  { t: 0, box: { cx: 0.5, cy: 0.4, w: 0.36, h: 0.75 } },
  { t: 2.9, box: { cx: 0.52, cy: 0.42, w: 0.36, h: 0.75 } },
  { t: 3.1, box: { cx: 0.52, cy: 0.7, w: 0.06, h: 0.18 } },
  { t: 3.9, box: { cx: 0.52, cy: 0.7, w: 0.06, h: 0.18 } },
  { t: 4, box: null },
  { t: 6.5, box: { cx: 0.5, cy: 0.45, w: 0.8, h: 0.9 } },
  { t: 7.9, box: { cx: 0.5, cy: 0.45, w: 0.8, h: 0.9 } },
  { t: 8.1, box: { cx: 0.45, cy: 0.35, w: 0.25, h: 0.6 } },
  { t: 10.8, box: { cx: 0.47, cy: 0.32, w: 0.28, h: 0.58 } },
  { t: 11, box: { cx: 0.5, cy: 0.62, w: 0.2, h: 0.75 } },
  { t: 15.25, box: { cx: 0.5, cy: 0.6, w: 0.28, h: 0.8 } },
];

/** 用户上传的视频:原型里没有真识别,主体当作画面中间一块固定区域(没有出框) */
export const CENTER_TRACK: TrackKey[] = [{ t: 0, box: { cx: 0.5, cy: 0.5, w: 0.25, h: 0.5 } }];
