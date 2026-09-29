import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { useNav, useStore } from "../provider";
import { colors } from "../theme";

/** APP 内删除账号:上架硬性要求,必须真删除 */
export default function ConfirmDeleteSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  return (
    <Sheet title="Delete account?" onClose={onClose}>
      <Text style={styles.text}>
        This permanently deletes your account, works and assets. Remaining credits can’t be restored. This can’t be undone.
      </Text>
      <View style={styles.buttons}>
        <PrimaryButton
          variant="danger"
          icon="trash"
          label="Delete account"
          onPress={() => {
            dispatch({ type: "deleteAccount" });
            navigate({ type: "reset" });
          }}
        />
        <PrimaryButton variant="light" label="Cancel" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15, lineHeight: 22, color: colors.sub },
  buttons: { gap: 10, marginTop: 18 },
});
