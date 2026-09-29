import { Text, View } from "react-native";
import { colors, radius, smoothCorners } from "../theme";
import { BRANDS, type BrandIconProps } from "./brand-types";

/* 原生端兜底:品牌色方块 + 首字母。真实 APP 用系统 Share Sheet(不自己画平台 logo) */
export default function BrandIcon({ brand, size = 56, style }: BrandIconProps) {
  const b = BRANDS[brand];
  return (
    <View
      accessibilityLabel={b.name}
      style={[{ width: size, height: size, borderRadius: radius.md, ...smoothCorners, backgroundColor: b.color, alignItems: "center", justifyContent: "center" }, style]}
    >
      <Text style={{ color: colors.white, fontSize: Math.round(size * 0.4), fontWeight: "700" }}>{b.name[0]}</Text>
    </View>
  );
}
