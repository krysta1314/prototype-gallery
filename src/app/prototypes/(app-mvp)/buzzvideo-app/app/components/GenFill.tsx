import { StyleSheet } from "react-native";
import Gradient from "./Gradient";

/** 原生端：同一套杏色 → 粉色斜向渐变(静态;真实 APP 用 Reanimated 做流动) */
export default function GenFill() {
  return <Gradient colors={["rgba(255,219,179,0.95)", "rgba(255,179,180,0.9)", "rgba(255,219,179,0.95)"]} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />;
}
