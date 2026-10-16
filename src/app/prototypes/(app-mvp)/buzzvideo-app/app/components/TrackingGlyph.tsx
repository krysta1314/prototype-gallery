import { View } from "react-native";

/** 原生端兜底:真实 APP 的 ATT 框由系统绘制,这里只给 React Native 环境一个可编译的替身(橙色底) */
export default function TrackingGlyph({ size = 64 }: { size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size * 0.234, backgroundColor: "#F29A45" }} />;
}
