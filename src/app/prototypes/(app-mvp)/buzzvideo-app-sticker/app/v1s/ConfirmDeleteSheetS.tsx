import { StyleSheet, Text, View } from "react-native";
import { GZButton, gz } from "../../kit/gz";
import { useNav, useStore } from "../v1";
import { DANGER, StickerSheet } from "./parts-auth";

const c = gz.color;

/** 贴纸风删除账号确认(逻辑同第一版 sheets/ConfirmDeleteSheet;APP 内删除账号是上架硬性要求，必须真删除)。
 *  危险操作用红色胶囊(黑字，同贴纸规则),取消是深灰胶囊;不放橙色 */
export default function ConfirmDeleteSheetS({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  return (
    <StickerSheet title="Delete account?" onClose={onClose} right={null}>
      <Text style={[gz.body.body, styles.text]}>This permanently deletes your account, works and assets. Remaining credits can’t be restored. This can’t be undone.</Text>
      <Text style={[gz.body.caption, styles.text, styles.note]}>If you subscribed through the App Store or Google Play, cancel it there — deleting your account doesn’t stop billing.</Text>
      <View style={styles.buttons}>
        <GZButton
          label="Delete account"
          style={{ backgroundColor: DANGER }}
          onPress={() => {
            dispatch({ type: "deleteAccount" });
            navigate({ type: "reset" });
          }}
        />
        <GZButton label="Cancel" variant="dark" onPress={onClose} />
      </View>
    </StickerSheet>
  );
}

const styles = StyleSheet.create({
  text: { color: c.text2, textAlign: "center", paddingHorizontal: 8 },
  note: { marginTop: 12, color: c.text3 },
  buttons: { gap: 10, marginTop: 24 },
});
