import { Image, StyleSheet, View } from "react-native";
import type { MediaVideoProps } from "./media-types";

/* 原生端:真实 APP 用 expo-video 替换,这里先显示封面 */
export default function MediaVideo({ poster, style }: MediaVideoProps) {
  return (
    <View style={[styles.box, style]}>
      <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({ box: { overflow: "hidden", backgroundColor: "#000" } });
