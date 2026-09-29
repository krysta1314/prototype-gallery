import { Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from "react-native";
import { MODES, modelLabel } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { uploadProgress } from "../store";
import { colors, ctaGradient, shadow } from "../theme";
import AttachmentThumb from "./AttachmentThumb";
import Gradient from "./Gradient";
import Icon from "./Icon";
import Pill from "./Pill";

// 网页端去掉 textarea 的 focus 外框;原生端没有这个属性,忽略即可
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

export default function InputBar() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const c = state.composer;
  const mode = MODES.find((m) => m.id === c.mode)!;
  const canSend = c.text.trim().length > 0 || c.attachments.length > 0;

  return (
    <View style={styles.wrap}>
      {c.attachments.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachments}>
          {c.attachments.map((a) => (
            <AttachmentThumb key={a.id} a={a} progress={uploadProgress(state, a.id)} onRemove={() => dispatch({ type: "removeAttachment", id: a.id })} />
          ))}
        </ScrollView>
      ) : null}
      <TextInput
        value={c.text}
        onChangeText={(text) => dispatch({ type: "setComposer", patch: { text } })}
        placeholder="Describe your idea — images & video"
        placeholderTextColor={colors.faint}
        multiline
        style={[styles.input, noOutline]}
      />
      <View style={styles.row}>
        <Pressable onPress={() => navigate({ type: "sheet", sheet: { name: "attach" } })} style={styles.round}>
          <Icon name="plus" size={20} color={colors.ink} />
        </Pressable>
        <Pill small icon={mode.icon} label={mode.short} trailing="chevron-down" onPress={() => navigate({ type: "sheet", sheet: { name: "mode" } })} />
        {c.mode !== "agent" && c.model ? (
          <View style={styles.shrink}>
            <Pill small label={modelLabel(c.model)} trailing="chevron-down" onPress={() => navigate({ type: "sheet", sheet: { name: "model" } })} />
          </View>
        ) : null}
        <View style={styles.spacer} />
        <Pressable
          onPress={() => dispatch({ type: "setComposer", patch: { text: c.text || "Make a 15s vertical ad for our new iced latte" } })}
          style={styles.round}
        >
          <Icon name="mic" size={19} color={colors.ink} />
        </Pressable>
        <Pressable
          disabled={!canSend}
          onPress={() => dispatch({ type: "submitPrompt", id: nextId("j") })}
          style={[styles.send, !canSend && styles.sendOff]}
        >
          {canSend ? <Gradient colors={ctaGradient} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
          <Icon name="arrow-up" size={20} color={canSend ? colors.white : colors.faint} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 12,
    gap: 8,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    boxShadow: shadow.float,
  },
  attachments: { gap: 10, paddingTop: 6, paddingRight: 6 },
  input: { minHeight: 44, maxHeight: 120, fontSize: 16, lineHeight: 22, color: colors.ink, paddingHorizontal: 4, paddingTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  round: { flexShrink: 0, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted },
  spacer: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0 },
  send: { flexShrink: 0, width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  sendOff: { backgroundColor: colors.surfaceMuted },
});
