import { StyleSheet, Text, View } from "react-native";
import Icon from "./components/Icon";

export default function App() {
  return (
    <View style={styles.root}>
      <Icon name="sparkles" size={32} color="#ff5e1a" />
      <Text style={styles.text}>React Native Web is running</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#fffaf6" },
  text: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
});
