import { View } from "react-native";

/* 原生端兜底:真实 APP 用 ASAuthorizationAppleIDButton 与 Google Sign-In SDK 自带的按钮,
 * 不自己画品牌标,这里只占位保持对齐 */
export default function AuthGlyph({ size = 20 }: { provider: "apple" | "google"; size?: number }) {
  return <View style={{ width: size, height: size }} />;
}
