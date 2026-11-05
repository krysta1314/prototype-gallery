// 输入框里的一个素材。source 区分用户上传的和本产品生成的(Omni Flash 在英国只限制上传的视频)。

export type AssetKind = "image" | "video" | "audio";

export type Asset = {
  id: string;
  kind: AssetKind;
  url: string;
  name: string;
  /** 视频 / 音频时长(秒) */
  secs?: number;
  /** 视频封面 */
  poster?: string;
  source: "upload" | "generated";
};

let seq = 0;
export const newId = (prefix = "x") => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

export const kindOf = (mime: string): AssetKind | null =>
  mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : null;
