import { useState } from "react";
import { StyleSheet, TextInput, View, type TextStyle } from "react-native";
import GroupedSection from "../components/GroupedSection";
import PrimaryButton from "../components/PrimaryButton";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/** 长按会话:Pin / Unpin、Rename、Delete;Rename 在同一张 sheet 里切到输入框 */
export default function SessionActionsSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const session = state.sessions.find((s) => s.id === id);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(session?.title ?? "");
  if (!session) return null;

  if (renaming) {
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
            autoFocus
          />
          <PrimaryButton
            label="Save name"
            onPress={() => {
              dispatch({ type: "renameSession", id, title });
              onClose();
            }}
          />
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet title={session.title} onClose={onClose}>
      <GroupedSection variant="plain">
        <Row
          icon={session.pinned ? "pin-off" : "pin"}
          iconColor={colors.ink}
          label={session.pinned ? "Unpin" : "Pin"}
          onPress={() => {
            dispatch({ type: "togglePinSession", id });
            onClose();
          }}
        />
        <Row icon="square-pen" iconColor={colors.ink} label="Rename" onPress={() => setRenaming(true)} />
        <Row
          icon="trash"
          danger
          label="Delete"
          onPress={() => {
            dispatch({ type: "deleteSession", id });
            dispatch({ type: "showToast", text: "Chat deleted" });
            onClose();
          }}
        />
      </GroupedSection>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.xs },
  input: { ...type.body, height: 48, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.grouped, color: colors.ink },
});
