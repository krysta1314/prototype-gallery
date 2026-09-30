import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import BrandIcon from "../components/BrandIcon";
import { BRANDS, type Brand } from "../components/brand-types";
import GroupedSection from "../components/GroupedSection";
import { pressScale } from "../components/motion";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { modeLabel } from "../data";
import { durationLabel } from "../generation";
import { useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

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
  const meta = [durationLabel(job.mode), modeLabel(job.mode)].filter(Boolean).join(" · ");
  return (
    <Sheet title="Share" onClose={onClose}>
      <View style={styles.preview}>
        <Image source={{ uri: job.cover }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.previewSub}>{meta}</Text>
        </View>
      </View>

      <View style={styles.targets}>
        {TARGETS.map((b) => (
          <Pressable
            key={b}
            onPress={() => done(`Opening ${BRANDS[b].name}…`)}
            accessibilityRole="button"
            accessibilityLabel={`Share to ${BRANDS[b].name}`}
            style={({ pressed }) => [styles.target, pressScale(pressed)]}
          >
            <BrandIcon brand={b} size={56} />
            <Text style={styles.targetName} numberOfLines={1}>
              {BRANDS[b].name}
            </Text>
          </Pressable>
        ))}
      </View>

      <GroupedSection variant="tinted">
        <Row icon="download" label="Save" onPress={() => done("Saved")} />
        <Row icon="copy" label="Copy link" onPress={() => done("Link copied")} />
        <Row icon="ellipsis" label="More options" onPress={() => done("Opens the system share sheet")} />
      </GroupedSection>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: "row", gap: space.md, alignItems: "center", marginTop: space.xs, marginBottom: space.xl },
  thumb: { width: 48, height: 85, borderRadius: radius.xs, backgroundColor: colors.grouped },
  previewBody: { flex: 1, gap: 2 },
  previewTitle: { ...type.headline, color: colors.ink },
  previewSub: { ...type.footnote, color: colors.sub },
  // 4 等分:每格 ≥ 80,放得下 13px 的 "Xiaohongshu"
  targets: { flexDirection: "row", marginHorizontal: -space.sm },
  target: { flex: 1, alignItems: "center", gap: space.sm, paddingVertical: space.xs },
  targetName: { ...type.footnote, fontWeight: "500", color: colors.ink, textAlign: "center" },
});
