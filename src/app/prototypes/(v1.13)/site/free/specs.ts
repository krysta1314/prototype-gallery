// 平台规格(2026-11-19 核实;2026-11-23 逐页复核 Meta 7 个页面，Reels 文件类型改为 MP4/MOV)。安全区和 Meta 广告尺寸只放官方页面上查得到的数;TikTok 官方只给可下载的模板文件、不写像素，
// 这里用第三方从官方模板实测的数，并在页面上写清楚是「测量值」。

export const SRC = {
  metaFbFeedImage: { label: "Meta Ads Guide: Facebook Feed image specs", url: "https://www.facebook.com/business/ads-guide/update/image/facebook-feed" },
  metaFbFeedVideo: { label: "Meta Ads Guide: Facebook Feed video specs", url: "https://www.facebook.com/business/ads-guide/update/video/facebook-feed" },
  metaIgFeedImage: { label: "Meta Ads Guide: Instagram Feed image specs", url: "https://www.facebook.com/business/ads-guide/update/image/instagram-feed" },
  metaIgFeedVideo: { label: "Meta Ads Guide: Instagram Feed video specs", url: "https://www.facebook.com/business/ads-guide/update/video/instagram-feed" },
  metaIgStoryImage: { label: "Meta Ads Guide: Instagram Stories image specs", url: "https://www.facebook.com/business/ads-guide/update/image/instagram-story" },
  metaFbStoryVideo: { label: "Meta Ads Guide: Facebook Stories video specs", url: "https://www.facebook.com/business/ads-guide/update/video/facebook-story" },
  metaIgReelsVideo: { label: "Meta Ads Guide: Instagram Reels video specs", url: "https://www.facebook.com/business/ads-guide/update/video/instagram-reels" },
  youtube: { label: "Google Ads Help: Use square and vertical video (vertical video ad safe zone diagram)", url: "https://support.google.com/google-ads/answer/9128498" },
  tiktokSpec: { label: "TikTok Ads Manager Help: In-Feed video ad specifications and safe zone files", url: "https://ads.tiktok.com/help/article/video-ads-specifications" },
  tiktokMeasured: { label: "ManyPixels: TikTok ad specs, safe zone measured from TikTok's In-Feed Standard LTR template", url: "https://www.manypixels.co/blog/social-media-design/tiktok-ad-specs" },
} as const;

/** 安全区：四边留白，单位 = 占画面宽 / 高的比例(基准 1080×1920);rightRail = 右侧按钮栏(TikTok) */
export type Zone = {
  key: "tiktok" | "reels" | "stories" | "shorts";
  label: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
  rail?: { width: number; height: number };
  /** 页面上的一句说明 */
  basis: string;
  measured?: boolean;
  sources: { label: string; url: string }[];
};

export const ZONES: Zone[] = [
  {
    key: "tiktok",
    label: "TikTok",
    top: 240 / 1920,
    bottom: 660 / 1920,
    left: 120 / 1080,
    right: 120 / 1080,
    rail: { width: 180 / 1080, height: 1080 / 1920 },
    basis: "In-Feed, standard template: 240 px top, 660 px bottom, 120 px each side, plus a 180 px button column on the right that runs 1,080 px up from the bottom (at 1080×1920). TikTok publishes these as downloadable template files, not as numbers; the values are a third-party measurement of TikTok's In-Feed Standard LTR template. Longer captions and anchors push the bottom edge higher.",
    measured: true,
    sources: [SRC.tiktokSpec, SRC.tiktokMeasured],
  },
  {
    key: "reels",
    label: "Instagram Reels",
    top: 0.14,
    bottom: 0.35,
    left: 0.06,
    right: 0.06,
    basis: "Meta recommends keeping about 14% at the top, 35% at the bottom and 6% on each side free of text, logos and other key elements, so the profile icon and call to action don't cover them.",
    sources: [SRC.metaIgReelsVideo],
  },
  {
    key: "stories",
    label: "Facebook & Instagram Stories",
    top: 0.14,
    bottom: 0.35,
    left: 0.06,
    right: 0.06,
    basis: "Meta gives Stories ads the same guidance as Reels: keep about 14% at the top, 35% at the bottom and 6% on each side clear of text and logos.",
    sources: [SRC.metaIgStoryImage, SRC.metaFbStoryVideo],
  },
  {
    key: "shorts",
    label: "YouTube Shorts",
    top: 288 / 1920,
    bottom: 672 / 1920,
    left: 48 / 1080,
    right: 192 / 1080,
    basis: "Google's safe zone for vertical video ads (which run in YouTube Shorts) at 1080×1920: 288 px top, 672 px bottom, 48 px left and 192 px right. Keep your logo, product and supers inside it.",
    sources: [SRC.youtube],
  },
];

/** Meta 广告规格表(只放官方页面上的值) */
export type SizeRow = { placement: string; format: "Image" | "Video"; ratio: string; size: string; files: string; maxSize: string; length?: string; minWidth: string; tolerance?: string; safe?: string; src: { label: string; url: string } };
export const META_SIZES: SizeRow[] = [
  { placement: "Facebook Feed", format: "Image", ratio: "4:5", size: "1440 × 1800", files: "JPG, PNG", maxSize: "30 MB", minWidth: "600 px (min height 750 px at 4:5)", tolerance: "3%", src: SRC.metaFbFeedImage },
  { placement: "Facebook Feed", format: "Video", ratio: "4:5", size: "1440 × 1800", files: "MP4, MOV, GIF", maxSize: "4 GB", length: "1 s to 241 min", minWidth: "120 px", src: SRC.metaFbFeedVideo },
  { placement: "Instagram Feed", format: "Image", ratio: "4:5 (supports 1.91:1 to 4:5)", size: "1440 × 1800", files: "JPG, PNG", maxSize: "30 MB", minWidth: "500 px", tolerance: "1%", src: SRC.metaIgFeedImage },
  { placement: "Instagram Feed", format: "Video", ratio: "9:16", size: "1080 × 1920", files: "MP4, MOV, GIF", maxSize: "4 GB", length: "1 s to 60 min", minWidth: "250 px", tolerance: "1%", src: SRC.metaIgFeedVideo },
  { placement: "Instagram Stories", format: "Image", ratio: "9:16", size: "1440 × 2560", files: "JPG, PNG", maxSize: "30 MB", minWidth: "500 px", tolerance: "1%", safe: "14% top, 35% bottom, 6% sides", src: SRC.metaIgStoryImage },
  { placement: "Facebook Stories", format: "Video", ratio: "9:16", size: "1440 × 2560", files: "MP4, MOV, GIF", maxSize: "4 GB", length: "1 s to 3 min", minWidth: "250 px", tolerance: "1%", safe: "14% top, 35% bottom, 6% sides", src: SRC.metaFbStoryVideo },
  { placement: "Instagram Reels", format: "Video", ratio: "9:16", size: "1440 × 2560", files: "MP4, MOV", maxSize: "4 GB", length: "0 s to 15 min", minWidth: "250 px under 30 s; 500 px from 30 s", safe: "14% top, 35% bottom, 6% sides", src: SRC.metaIgReelsVideo },
];

/** 图片尺寸工具的预设:4:5 和 9:16 是 Meta 推荐分辨率;1:1、1.91:1 是 Instagram Feed 支持范围内的比例(宽取 1440) */
export const IMAGE_PRESETS = [
  { key: "feed", label: "Feed 4:5", w: 1440, h: 1800, hint: "1440×1800 · Meta recommended" },
  { key: "story", label: "Stories & Reels 9:16", w: 1440, h: 2560, hint: "1440×2560 · Meta recommended" },
  { key: "square", label: "Square 1:1", w: 1440, h: 1440, hint: "1440×1440 · supported in Feed" },
  { key: "land", label: "Landscape 1.91:1", w: 1440, h: 754, hint: "1440×754 · widest Feed ratio" },
] as const;
