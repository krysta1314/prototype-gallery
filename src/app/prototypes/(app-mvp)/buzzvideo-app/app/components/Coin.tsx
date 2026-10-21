import { Image } from "react-native";
import { A } from "../data";

/** 积分图标：和网页版同一个 credits.svg(2026-10-21 换成产品正式图标：品牌渐变圆角方块 + 白色四角星) */
export default function Coin({ size = 14 }: { size?: number }) {
  return (
    <Image
      source={{ uri: `${A}/credits.svg` }}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
