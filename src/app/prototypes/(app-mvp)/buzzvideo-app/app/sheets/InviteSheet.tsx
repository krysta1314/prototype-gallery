import { useState } from "react";
import { StyleSheet, TextInput, View, type TextStyle } from "react-native";
import GroupedSection from "../components/GroupedSection";
import PrimaryButton from "../components/PrimaryButton";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/** 邀请成员:邮箱 + Send invite,或复制邀请链接 */
export default function InviteSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [email, setEmail] = useState("");
  const toast = (text: string) => dispatch({ type: "showToast", text });

  return (
    <Sheet title="Invite members" onClose={onClose}>
      <View style={styles.body}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={[styles.input, noOutline]}
          placeholder="name@company.com"
          placeholderTextColor={colors.faint}
          accessibilityLabel="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton
          label="Send invite"
          disabled={email.trim() === ""}
          onPress={() => {
            toast("Invite sent");
            onClose();
          }}
        />
        <GroupedSection variant="plain">
          <Row
            icon="copy"
            iconColor={colors.ink}
            label="Copy invite link"
            onPress={() => {
              toast("Invite link copied");
              onClose();
            }}
          />
        </GroupedSection>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.xs },
  input: { ...type.body, height: 48, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.grouped, color: colors.ink },
});
