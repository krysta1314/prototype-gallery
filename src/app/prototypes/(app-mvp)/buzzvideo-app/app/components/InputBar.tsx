import { Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle } from "react-native";
import { MODES, modelLabel } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { uploadProgress } from "../store";
import { colors, elevation, radius } from "../theme";
import AttachmentThumb from "./AttachmentThumb";
import Icon from "./Icon";
import Pill from "./Pill";

// 网页端去掉 textarea 的 focus 外框;原生端没有这个属性,忽略即可
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

export default function InputBar() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const c = state.composer;
  const mode = MODES.find((m) => m.id === c.mode)!;
  const showModel = c.mode !== "agent" && !!c.model;
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
        <Pressable onPress={() => navigate({ type: "sheet", sheet: { name: "attach" } })} hitSlop={2} accessibilityLabel="Attach" style={styles.round}>
          <Icon name="plus" size={22} color={colors.ink} />
        </Pressable>
        <Pill iconOnly={showModel} icon={mode.icon} label={mode.short} trailing="chevron-down" onPress={() => navigate({ type: "sheet", sheet: { name: "mode" } })} />
        {showModel ? (
          <Pill label={modelLabel(c.model!)} trailing="chevron-down" onPress={() => navigate({ type: "sheet", sheet: { name: "model" } })} />
        ) : null}
        <View style={styles.spacer} />
        <Pressable
          onPress={() => dispatch({ type: "setComposer", patch: { text: c.text || "Make a 15s vertical ad for our new iced latte" } })}
          hitSlop={2}
          accessibilityLabel="Dictate"
          style={styles.round}
        >
          <Icon name="mic" size={22} color={colors.ink} />
        </Pressable>
        <Pressable
          disabled={!canSend}
          onPress={() => dispatch({ type: "submitPrompt", id: nextId("j") })}
          hitSlop={4}
          accessibilityLabel="Send"
          style={[styles.send, !canSend && styles.sendOff]}
        >
          <Icon name="arrow-up" size={20} color={colors.white} strokeWidth={2.25} />
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
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    boxShadow: elevation.float,
  },
  attachments: { gap: 10, paddingTop: 6, paddingRight: 6 },
  input: { minHeight: 44, maxHeight: 120, fontSize: 16, lineHeight: 22, color: colors.ink, paddingHorizontal: 4, paddingTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  round: { flexShrink: 0, width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  spacer: { flex: 1, minWidth: 0 },
  send: { flexShrink: 0, width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  sendOff: { backgroundColor: colors.separator },
});
