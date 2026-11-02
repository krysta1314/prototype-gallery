/* 评审用的四个素材预览(public/prototypes/hybrid-reel-agent/fixture/,由录制脚本压好)。
   name 用原始文件名,和 rellet.json 里 profiles 的 label 一致。 */

import type { HomeItem } from "../api";

const BASE = "/prototypes/hybrid-reel-agent/fixture";

export const FIXTURE_ITEMS: HomeItem[] = [
  { name: "SaveClip.App_AQNyGQz9V87Xw60AYhoKt4cagmdMfm2bqlUX4daFM7P7d8BXUt.mp4", url: `${BASE}/saveclip.mp4`, kind: "video" },
  { name: "images.jpeg", url: `${BASE}/images.jpeg`, kind: "image" },
  { name: "images.png", url: `${BASE}/images.png`, kind: "image" },
  { name: "IMG_3716.MOV", url: `${BASE}/IMG_3716.mp4`, kind: "video" },
];
