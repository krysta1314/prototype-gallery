import type { StyleProp, ViewStyle } from "react-native";

export type Brand = "instagram" | "tiktok" | "xiaohongshu" | "whatsapp";

/** 平台正式名称 + 品牌色(与 simple-icons 的官方 hex 一致) */
export const BRANDS: Record<Brand, { name: string; color: string }> = {
  instagram: { name: "Instagram", color: "#FF0069" },
  tiktok: { name: "TikTok", color: "#000000" },
  xiaohongshu: { name: "Xiaohongshu", color: "#FF2442" },
  whatsapp: { name: "WhatsApp", color: "#25D366" },
};

export type BrandIconProps = {
  brand: Brand;
  /** 圆角方块边长,默认 56 */
  size?: number;
  style?: StyleProp<ViewStyle>;
};
