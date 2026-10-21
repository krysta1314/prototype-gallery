import Icon from "./Icon";

/** 原生端兜底：真实 APP 换成设计稿切图;这里给 RN 环境一个可编译的替身 */
export default function ToolGlyph({ name, size = 22, color }: { name: "cutout" | "hd"; size?: number; color: string }) {
  return <Icon name={name === "cutout" ? "scan-face" : "zoom-in"} size={size} color={color} />;
}
