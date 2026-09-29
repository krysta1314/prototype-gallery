import { useState } from "react";
import { StyleSheet, TextInput, View, type TextStyle } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

export default function SessionActionsSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const session = state.sessions.find((s) => s.id === id);
  const [title, setTitle] = useState(session?.title ?? "");
  if (!session) return null;
  return (
    <Sheet title="Rename chat" onClose={onClose}>
      <View style={styles.body}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[styles.input, noOutline]}
          placeholder="Chat name"
          placeholderTextColor={colors.faint}
          accessibilityLabel="Chat name"
          selectTextOnFocus
        />
        <PrimaryButton
          label="Save name"
          onPress={() => {
            dispatch({ type: "renameSession", id, title });
            onClose();
          }}
        />
        <PrimaryButton
          variant="danger"
          label="Delete chat"
          onPress={() => {
            dispatch({ type: "deleteSession", id });
            dispatch({ type: "showToast", text: "Chat deleted" });
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.xs },
  input: { ...type.body, height: 48, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.grouped, color: colors.ink },
});
