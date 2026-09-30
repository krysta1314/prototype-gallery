import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, space, type } from "../theme";

/** 组织拥有者删号前必须先在网页端转让或删除工作区 */
export default function TransferWorkspaceSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  return (
    <Sheet title="Transfer your workspace first" onClose={onClose} right={null}>
      <Text style={styles.text}>You own a workspace. Transfer or delete it on the web before deleting your account.</Text>
      <View style={styles.buttons}>
        <PrimaryButton
          label="Open on the web ↗"
          onPress={() => {
            dispatch({ type: "showToast", text: "Opening buzzvideo.ai…" });
            onClose();
          }}
        />
        <PrimaryButton variant="light" label="Cancel" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { ...type.subhead, color: colors.sub, textAlign: "center", paddingHorizontal: space.sm },
  buttons: { gap: space.md, marginTop: space.xl },
});
