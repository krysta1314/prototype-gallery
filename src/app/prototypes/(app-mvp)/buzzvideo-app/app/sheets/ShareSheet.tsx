import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors } from "../theme";

/* 真实 APP:调用系统分享面板(Share API)或平台分享 SDK,跳到对方 APP 后由用户发布 */
const TARGETS = [
  { id: "ig", name: "Instagram", glyph: "IG", bg: "#E1306C" },
  { id: "tt", name: "TikTok", glyph: "TT", bg: "#111111" },
  { id: "red", name: "RED", glyph: "RED", bg: "#FF2442" },
  { id: "wa", name: "WhatsApp", glyph: "WA", bg: "#25D366" },
];

export default function ShareSheet({ workId, onClose }: { workId: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const job = state.jobs.find((j) => j.id === workId);
  if (!job) return null;
  const done = (text: string) => {
    dispatch({ type: "showToast", text });
    onClose();
  };
  return (
    <Sheet title="Share" onClose={onClose}>
      <View style={styles.preview}>
        <Image source={{ uri: job.cover }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.previewSub}>An “AI-generated” label is added when you share.</Text>
        </View>
      </View>
      <View style={styles.targets}>
        {TARGETS.map((t) => (
          <Pressable key={t.id} onPress={() => done(`Opening ${t.name}…`)} style={styles.target}>
            <View style={[styles.targetIcon, { backgroundColor: t.bg }]}>
              <Text style={styles.targetGlyph}>{t.glyph}</Text>
            </View>
            <Text style={styles.targetName}>{t.name}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => done("Opens the system share sheet")} style={styles.target}>
          <View style={[styles.targetIcon, styles.more]}>
            <Icon name="ellipsis" size={22} color={colors.ink} />
          </View>
          <Text style={styles.targetName}>More</Text>
        </Pressable>
      </View>
      <View>
        <Row icon="download" label="Save to Photos" onPress={() => done("Saved to Photos")} />
        <Row icon="copy" label="Copy link" onPress={() => done("Link copied")} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 16 },
  thumb: { width: 48, height: 72, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  previewBody: { flex: 1, gap: 4 },
  previewTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  previewSub: { fontSize: 12, color: colors.sub },
  targets: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  target: { alignItems: "center", gap: 6, width: 62 },
  targetIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  more: { backgroundColor: colors.surfaceMuted },
  targetGlyph: { color: colors.white, fontSize: 14, fontWeight: "900" },
  targetName: { fontSize: 11, color: colors.ink },
});
