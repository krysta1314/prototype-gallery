import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { useNav, useStore } from "../provider";
import { colors, space, type } from "../theme";

/** APP 内删除账号:上架硬性要求,必须真删除 */
export default function ConfirmDeleteSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  return (
    <Sheet title="Delete account?" onClose={onClose} right={null}>
      <Text style={styles.text}>
        This permanently deletes your account, works and assets. Remaining credits can’t be restored. This can’t be undone.
      </Text>
      <Text style={[styles.text, styles.note]}>
        If you subscribed through the App Store or Google Play, cancel it there — deleting your account doesn’t stop billing.
      </Text>
      <View style={styles.buttons}>
        <PrimaryButton
          variant="danger"
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
  text: { ...type.subhead, color: colors.sub, textAlign: "center", paddingHorizontal: space.sm },
  note: { marginTop: space.md },
  buttons: { gap: space.md, marginTop: space.xl },
});
