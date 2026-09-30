import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Attachment } from "../store";
import { colors, radius, type, smoothCorners } from "../theme";
import Icon from "./Icon";

type Props = { a: Attachment; progress: number; onRemove?: () => void; size?: number };

/** 输入框 / 用户消息里的附件缩略图:上传中显示百分比,视频带时长角标 */
export default function AttachmentThumb({ a, progress, onRemove, size = 58 }: Props) {
  const uploading = progress < 1;
  return (
    <View style={{ width: a.kind === "pdf" ? 160 : size, height: size }}>
      {a.kind === "pdf" ? (
        <View style={[styles.pdf, { height: size }]}>
          <Icon name="file-text" size={20} color={colors.ink} />
          <Text style={styles.pdfLabel} numberOfLines={2}>
            {a.label}
          </Text>
        </View>
      ) : (
        <Image source={{ uri: a.uri }} style={[styles.img, { width: size, height: size }]} resizeMode="cover" />
      )}
      {a.kind === "video" && !uploading ? (
        <View style={[styles.videoBadge, a.duration ? styles.videoBadgeWide : null]}>
          <Icon name="play" size={9} color={colors.white} />
          {a.duration ? <Text style={styles.duration}>{a.duration}</Text> : null}
        </View>
      ) : null}
      {uploading ? (
        <View style={styles.progress}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      ) : null}
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={12} accessibilityRole="button" accessibilityLabel="Remove attachment" style={styles.remove}>
          <Icon name="x" size={11} color={colors.onInk} strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { borderRadius: radius.md, backgroundColor: colors.grouped, ...smoothCorners },
  pdf: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.grouped, ...smoothCorners },
  pdfLabel: { flex: 1, ...type.footnote, fontWeight: "500", color: colors.ink },
  // 角标:caption 11 是规范允许的例外
  videoBadge: { position: "absolute", left: 4, bottom: 4, minWidth: 18, height: 18, borderRadius: radius.full, backgroundColor: colors.onImage, alignItems: "center", justifyContent: "center" },
  videoBadgeWide: { flexDirection: "row", gap: 4, paddingHorizontal: 6 },
  duration: { ...type.caption, color: colors.white, fontVariant: ["tabular-nums"] },
  progress: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.md, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", ...smoothCorners },
  progressText: { ...type.footnote, fontWeight: "600", color: colors.white, fontVariant: ["tabular-nums"] },
  remove: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.surface },
});
