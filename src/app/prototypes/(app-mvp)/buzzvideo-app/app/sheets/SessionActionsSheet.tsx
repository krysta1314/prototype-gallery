import { useState } from "react";
import { StyleSheet, TextInput, View, type TextStyle } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

export default function SessionActionsSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const session = state.sessions.find((s) => s.id === id);
  const [title, setTitle] = useState(session?.title ?? "");
  if (!session) return null;
  return (
    <Sheet title="Chat" onClose={onClose}>
      <View style={styles.body}>
        <TextInput value={title} onChangeText={setTitle} style={[styles.input, noOutline]} placeholder="Chat name" placeholderTextColor={colors.faint} />
        <PrimaryButton
          label="Rename"
          onPress={() => {
            dispatch({ type: "renameSession", id, title });
            onClose();
          }}
        />
        <PrimaryButton
          variant="danger"
          icon="trash"
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
  body: { gap: 12 },
  input: { height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.separator, fontSize: 16, color: colors.ink },
});
