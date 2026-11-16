import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import AttachmentThumb from "../../../buzzvideo-app/app/components/AttachmentThumb";
import { RECENT_PHOTOS, type RecentPhoto } from "../../../buzzvideo-app/app/data";
import { GZButton, gz } from "../../kit/gz";
import { Icon, useStore } from "../v1";
import { StickerSheet } from "./parts-auth";

const c = gz.color;
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;
const TYPES = ["Bug", "Feature Request", "Other"] as const;
const MAX_IMAGES = 20;
const MAX_VIDEOS = 5;

/**
 * 贴纸风反馈面板(逻辑同第一版 sheets/FeedbackSheet,和网页 Give Feedback 一致):设置 › Help Center 打开。
 * 类型 = 描边胶囊，选中变白色;描述深灰输入框，聚焦白边;附件区实线深灰(不用虚线);Cancel 深灰 + Submit Feedback 橙色
 */
export default function FeedbackSheetS({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [kind, setKind] = useState<(typeof TYPES)[number]>("Bug");
  const [desc, setDesc] = useState("");
  const [focus, setFocus] = useState(false);
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
    <StickerSheet title="Give Feedback" onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={[gz.display.label, styles.label]}>Feedback type</Text>
          <View style={styles.types} accessibilityRole="radiogroup">
            {TYPES.map((t) => {
              const on = t === kind;
              return (
                <Pressable key={t} onPress={() => setKind(t)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.type, on && styles.typeOn, pressed && !on && { opacity: 0.7 }]}>
                  <Text style={[gz.display.label, { color: on ? c.ink : c.text }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[gz.display.label, styles.label]}>Description</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            multiline
            placeholder="Describe your issue or suggestion in detail..."
            placeholderTextColor={c.text3}
            accessibilityLabel="Description"
            style={[gz.body.body, styles.input, focus && { borderColor: c.white }, noOutline]}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[gz.display.label, styles.label]}>Attachments</Text>
            <Text style={[gz.body.micro, { color: c.text3, fontVariant: ["tabular-nums"] }]}>{`Images ${images}/${MAX_IMAGES} · Videos ${videos}/${MAX_VIDEOS}`}</Text>
          </View>
          {files.length === 0 ? (
            <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Add photos or videos" style={({ pressed }) => [styles.drop, pressed && { opacity: 0.7 }]}>
              <View style={styles.dropIcon}>
                <Icon name="upload" size={18} color={c.ink} strokeWidth={2.6} />
              </View>
              <Text style={[gz.display.label, { color: c.white }]}>Add photos or videos</Text>
              <Text style={[gz.body.micro, { color: c.text3, fontWeight: "400" }]}>Up to 50MB each</Text>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {files.map((f) => (
                <AttachmentThumb key={f.id} a={{ id: f.id, uri: f.uri, kind: f.kind, duration: f.duration }} progress={1} size={64} onRemove={() => setFiles((all) => all.filter((x) => x.id !== f.id))} />
              ))}
              {next ? (
                <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Add more" style={({ pressed }) => [styles.addMore, pressed && { opacity: 0.7 }]}>
                  <Icon name="plus" size={20} color={c.white} strokeWidth={2.6} />
                </Pressable>
              ) : null}
            </ScrollView>
          )}
        </View>

        <View style={styles.actions}>
          <View style={{ width: 112 }}>
            <GZButton label="Cancel" variant="dark" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <GZButton label="Submit Feedback" onPress={submit} disabled={!desc.trim()} />
          </View>
        </View>
      </View>
    </StickerSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 18, paddingBottom: 8, paddingTop: 4 },
  field: { gap: 8 },
  label: { color: c.white },
  labelRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  types: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  // 按文字宽度排(等分会把 Feature Request 挤成两行)
  type: { height: 36, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center" },
  typeOn: { backgroundColor: c.white, borderColor: c.white },
  input: { height: 120, paddingHorizontal: 16, paddingTop: 12, borderRadius: 16, backgroundColor: c.raised, borderWidth: 2, borderColor: "transparent", color: c.white, textAlignVertical: "top" },
  drop: { height: 112, borderRadius: 16, backgroundColor: c.raised, alignItems: "center", justifyContent: "center", gap: 4 },
  dropIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.white, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  thumbs: { gap: 8, paddingTop: 6, paddingRight: 6 },
  addMore: { width: 64, height: 64, borderRadius: 14, backgroundColor: c.raised, alignItems: "center", justifyContent: "center", marginTop: 0 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
});
