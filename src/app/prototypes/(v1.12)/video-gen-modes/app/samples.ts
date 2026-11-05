// 「+」→ Sample Files 里的示例素材:评审时不用找文件，也能稳定演示超数量 / 超时长等异常。
// 时长是用 ffprobe 量过的真实值(取整到 0.1s)。全部是 public 下已有的文件。

import type { Asset } from "./assets";

const img = (id: string, url: string, name: string): Asset => ({ id, kind: "image", url, name, source: "upload" });
const vid = (id: string, url: string, name: string, secs: number, poster?: string): Asset => ({ id, kind: "video", url, name, secs, poster, source: "upload" });
const aud = (id: string, url: string, name: string, secs: number): Asset => ({ id, kind: "audio", url, name, secs, source: "upload" });

const APP = "/prototypes/buzzvideo-app";
const MCP = "/prototypes/mcp-skill-showcase";

export const SAMPLE_FILES: Asset[] = [
  img("s-img-1", `${APP}/usecase-skincare.jpg`, "skincare.jpg"),
  img("s-img-2", `${APP}/usecase-sneaker.jpg`, "sneaker.jpg"),
  img("s-img-3", `${APP}/usecase-latte.jpg`, "latte.jpg"),
  img("s-img-4", `${APP}/usecase-florist.jpg`, "florist.jpg"),
  img("s-img-5", `${APP}/usecase-bakery.jpg`, "bakery.jpg"),
  img("s-img-6", `${APP}/usecase-ramen.jpg`, "ramen.jpg"),
  img("s-img-7", `${APP}/photo-2.jpg`, "model-1.jpg"),
  img("s-img-8", `${APP}/photo-3.jpg`, "model-2.jpg"),
  img("s-img-9", `${APP}/photo-8.jpg`, "model-3.jpg"),
  img("s-img-10", `${MCP}/aurelia-ecom.jpg`, "perfume.jpg"),
  img("s-img-11", `${MCP}/3d-product-video.jpg`, "product-3d.jpg"),
  img("s-img-12", `${MCP}/festival-campaign.jpg`, "festival.jpg"),
  vid("s-vid-1", "/prototypes/hybrid-reel-agent/fixture/saveclip.mp4", "clip-3s.mp4", 3),
  vid("s-vid-2", `${APP}/banner-seedance25.mp4`, "product-5s.mp4", 5, `${APP}/result-video.jpg`),
  vid("s-vid-3", `${APP}/onboarding-ad.mp4`, "ad-6s.mp4", 6, `${APP}/onboarding-ad.jpg`),
  vid("s-vid-4", "/prototypes/homepage/seedance-2.0.mp4", "scene-15s.mp4", 15.1),
  vid("s-vid-5", "/prototypes/homepage/product-unboxing/unboxing.mp4", "unboxing-24s.mp4", 23.9),
  aud("s-aud-1", "/prototypes/hybrid-reel-agent/fixture/voice/en-2.mp3", "voiceover-5s.mp3", 4.8),
  aud("s-aud-2", "/prototypes/hybrid-reel-agent/fixture/voice/en-1.mp3", "voiceover-6s.mp3", 6.1),
  aud("s-aud-3", "/prototypes/hybrid-reel-agent/fixture/voice/en-4.mp3", "voiceover-5s-b.mp3", 5.3),
];

/** 「+」→ Avatar Library 里的数字人(原型里用几张人像图代替) */
export const AVATARS: Asset[] = SAMPLE_FILES.filter((a) => ["s-img-7", "s-img-8", "s-img-9"].includes(a.id)).map((a, i) => ({ ...a, id: `s-avatar-${i + 1}`, name: `avatar-${i + 1}.jpg` }));


/** 生成结果用的样片 */
export const RESULT_VIDEO = { url: `${APP}/banner-seedance25.mp4`, poster: `${APP}/result-video.jpg`, lastFrame: `${APP}/result-video.jpg` };
