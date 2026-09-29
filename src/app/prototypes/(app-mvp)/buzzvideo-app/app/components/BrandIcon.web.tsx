import { View } from "react-native";
import { siInstagram, siTiktok, siWhatsapp, siXiaohongshu } from "simple-icons";
import { radius } from "../theme";
import { BRANDS, type Brand, type BrandIconProps } from "./brand-types";

/* 网页端:simple-icons(CC0)的官方单色 glyph,白色,放在品牌色圆角方块上 */
const PATHS: Record<Brand, string> = {
  instagram: siInstagram.path,
  tiktok: siTiktok.path,
  xiaohongshu: siXiaohongshu.path,
  whatsapp: siWhatsapp.path,
};

export default function BrandIcon({ brand, size = 56, style }: BrandIconProps) {
  const glyph = Math.round(size * 0.5);
  return (
    <View
      accessibilityLabel={BRANDS[brand].name}
      style={[
        { width: size, height: size, borderRadius: radius.md, backgroundColor: BRANDS[brand].color, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
        <path d={PATHS[brand]} fill="#ffffff" />
      </svg>
    </View>
  );
}
