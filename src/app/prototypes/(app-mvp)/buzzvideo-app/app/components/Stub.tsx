import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

/** 骨架阶段的占位页,后续任务整文件替换 */
export default function Stub({ name }: { name: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 15, color: colors.sub },
});
