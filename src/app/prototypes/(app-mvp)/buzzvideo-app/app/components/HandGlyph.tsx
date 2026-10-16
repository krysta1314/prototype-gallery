import Icon from "./Icon";

/** 原生端兜底:真实 APP 的 ATT 框由系统绘制,这里只给 React Native 环境一个可编译的替身 */
export default function HandGlyph({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return <Icon name="hand" size={size} color={color} fill={color} strokeWidth={1.5} />;
}
