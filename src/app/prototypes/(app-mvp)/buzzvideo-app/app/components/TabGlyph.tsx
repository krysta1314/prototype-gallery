import Icon from "./Icon";

/** 原生端兜底：真实 APP 用 SF Symbols(house.fill / house、sparkles),这里给 RN 环境一个可编译的替身 */
export default function TabGlyph({ name, size = 22, color, filled, outline }: { name: "home" | "create"; size?: number; color: string; filled: boolean; outline?: boolean }) {
  return <Icon name={name === "home" ? "house" : "sparkles"} size={size} color={color} fill={!outline && (filled || name === "create") ? color : undefined} />;
}
