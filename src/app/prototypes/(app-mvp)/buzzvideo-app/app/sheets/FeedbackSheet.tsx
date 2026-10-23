import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import AttachmentThumb from "../components/AttachmentThumb";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { RECENT_PHOTOS, type RecentPhoto } from "../data";
import { useStore } from "../provider";
import { colors, fill, radius, selectedBox, smoothCorners, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;
const TYPES = ["Bug", "Feature Request", "Other"] as const;
const MAX_IMAGES = 20;
const MAX_VIDEOS = 5;

/**
 * 反馈(2026-10-23,和网页版 Give Feedback 弹窗一致):设置 › Help Center 打开。
 * Feedback type(Bug / Feature Request / Other,默认 Bug)→ Description(必填)→ Attachments(图片 ≤ 20、视频 ≤ 5,每个 ≤ 50MB)→ Cancel / Submit Feedback。
 * 真实 APP:附件走 iOS 系统照片选择器(PHPicker,不需要相册权限),提交到和网页同一个反馈接口，自动带上设备型号、系统版本、APP 版本
 */
export default function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [kind, setKind] = useState<(typeof TYPES)[number]>("Bug");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<RecentPhoto[]>([]);
  const images = files.filter((f) => f.kind === "photo").length;
  const videos = files.length - images;
  // 原型：点一次从最近照片里按顺序加一个，模拟在系统照片选择器里选好
  const next = RECENT_PHOTOS.find((p) => !files.some((f) => f.id === p.id));
  const add = () => {
    if (next) setFiles((f) => [...f, next]);
  };
  const submit = () => {
    if (!desc.trim()) return;
    dispatch({ type: "showToast", text: "Thanks for your feedback!" });
    onClose();
  };

  return (
    <Sheet title="Give Feedback" onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.label}>Feedback type</Text>
          <View style={styles.types} accessibilityRole="radiogroup">
            {TYPES.map((t) => {
              const on = t === kind;
              return (
                <Pressable key={t} onPress={() => setKind(t)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.type, on && selectedBox, pressed && !on && styles.typePressed]}>
                  <Text style={[styles.typeText, on && styles.typeTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholder="Describe your issue or suggestion in detail..."
            placeholderTextColor={colors.faint}
            accessibilityLabel="Description"
            style={[styles.input, noOutline]}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Attachments</Text>
            <Text style={styles.limit}>{`Images ${images}/${MAX_IMAGES} · Videos ${videos}/${MAX_VIDEOS}`}</Text>
          </View>
          {files.length === 0 ? (
            <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Add photos or videos" style={({ pressed }) => [styles.drop, pressed && styles.typePressed]}>
              <View style={styles.dropIcon}>
                <Icon name="upload" size={18} color={colors.ink} />
              </View>
              <Text style={styles.dropText}>Add photos or videos</Text>
              <Text style={styles.dropHint}>Up to 50MB each</Text>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {files.map((f) => (
                <AttachmentThumb key={f.id} a={{ id: f.id, uri: f.uri, kind: f.kind, duration: f.duration }} progress={1} size={64} onRemove={() => setFiles((all) => all.filter((x) => x.id !== f.id))} />
              ))}
              {next ? (
                <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Add more" style={({ pressed }) => [styles.addMore, pressed && styles.typePressed]}>
                  <Icon name="plus" size={20} color={colors.ink} />
                </Pressable>
              ) : null}
            </ScrollView>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.cancel, pressed && styles.faded]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <PrimaryButton label="Submit Feedback" onPress={submit} disabled={!desc.trim()} style={styles.send} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg, paddingBottom: space.sm },
  field: { gap: space.sm },
  labelRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  label: { ...type.subhead, fontWeight: "600", color: colors.ink },
  limit: { ...type.caption1, color: colors.faint, fontVariant: ["tabular-nums"] },
  types: { flexDirection: "row", gap: space.sm },
  // 按文字宽度排(等分会把 Feature Request 挤成两行)
  type: { height: 36, borderRadius: radius.full, backgroundColor: colors.grouped, borderWidth: 1, borderColor: colors.edge, alignItems: "center", justifyContent: "center", paddingHorizontal: space.lg },
  typePressed: { backgroundColor: fill.pressed },
  typeText: { ...type.footnote, fontWeight: "600", color: colors.sub },
  typeTextOn: { color: colors.ink },
  input: { ...type.body, height: 120, paddingHorizontal: space.lg, paddingTop: space.md, borderRadius: radius.md, backgroundColor: colors.grouped, color: colors.ink, textAlignVertical: "top" },
  drop: { height: 112, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.edge, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center", gap: 4, ...smoothCorners },
  dropIcon: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: fill.strong, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  dropText: { ...type.subhead, fontWeight: "600", color: colors.ink },
  dropHint: { ...type.caption1, color: colors.faint },
  thumbs: { gap: space.sm, paddingTop: 6, paddingRight: 6 },
  addMore: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.edge, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.xs },
  cancel: { flex: 1, height: 50, borderRadius: radius.full, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center" },
  cancelText: { ...type.headline, color: colors.ink },
  send: { flex: 1 },
  faded: { opacity: 0.5 },
});
