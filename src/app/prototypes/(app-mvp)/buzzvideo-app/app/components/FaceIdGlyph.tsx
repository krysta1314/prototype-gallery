import Icon from "./Icon";

/** 原生端兜底:真实 APP 的 Face ID 界面由系统绘制,这里只给 React Native 环境一个可编译的替身 */
export default function FaceIdGlyph({ size = 64, color = "#fff" }: { size?: number; color?: string }) {
  return <Icon name="user-round" size={size} color={color} />;
}
