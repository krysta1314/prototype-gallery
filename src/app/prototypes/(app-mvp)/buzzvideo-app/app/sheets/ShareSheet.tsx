import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import BrandIcon from "../components/BrandIcon";
import { BRANDS, type Brand } from "../components/brand-types";
import GroupedSection from "../components/GroupedSection";
import Icon from "../components/Icon";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, radius, type } from "../theme";

/* 真实 APP:调用系统分享面板(Share API)或平台分享 SDK,跳到对方 APP 后由用户发布 */
const TARGETS: Brand[] = ["instagram", "tiktok", "xiaohongshu", "whatsapp"];

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
          <Text style={styles.previewTitle} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.previewSub}>Shared videos include an AI-generated label.</Text>
        </View>
      </View>
      <View style={styles.targets}>
        {TARGETS.map((b) => (
          <Pressable key={b} onPress={() => done(`Opening ${BRANDS[b].name}…`)} style={styles.target} accessibilityRole="button">
            <BrandIcon brand={b} size={56} />
            <Text style={styles.targetName}>{BRANDS[b].name}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => done("Opens the system share sheet")} style={styles.target} accessibilityRole="button">
          <View style={[styles.more]}>
            <Icon name="ellipsis" size={22} color={colors.ink} />
          </View>
          <Text style={styles.targetName}>More</Text>
        </Pressable>
      </View>
      <GroupedSection variant="plain">
        <Row icon="download" label="Save to Photos" onPress={() => done("Saved to Photos")} />
        <Row icon="copy" label="Copy link" onPress={() => done("Link copied")} />
      </GroupedSection>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 16 },
  thumb: { width: 48, height: 85, borderRadius: radius.xs, backgroundColor: colors.grouped },
  previewBody: { flex: 1, gap: 4 },
  previewTitle: { ...type.headline, color: colors.ink },
  previewSub: { ...type.footnote, color: colors.sub },
  targets: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  target: { alignItems: "center", gap: 6, width: 64 },
  more: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center" },
  targetName: { ...type.caption, fontWeight: "500", color: colors.ink, textAlign: "center", width: 76 },
});
