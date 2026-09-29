import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Attachment } from "../store";
import { colors } from "../theme";
import Icon from "./Icon";

type Props = { a: Attachment; progress: number; onRemove?: () => void; size?: number };

export default function AttachmentThumb({ a, progress, onRemove, size = 58 }: Props) {
  const uploading = progress < 1;
  return (
    <View style={{ width: a.kind === "pdf" ? 150 : size, height: size }}>
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
        <Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
          <Icon name="x" size={11} color={colors.white} strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { borderRadius: 14, backgroundColor: colors.grouped },
  pdf: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.grouped },
  pdfLabel: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.ink },
  videoBadge: { position: "absolute", left: 5, bottom: 5, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  videoBadgeWide: { flexDirection: "row", gap: 3, paddingHorizontal: 5 },
  duration: { color: colors.white, fontSize: 10, fontWeight: "700" },
  progress: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14, backgroundColor: "rgba(26,26,46,0.45)", alignItems: "center", justifyContent: "center" },
  progressText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  remove: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
});
