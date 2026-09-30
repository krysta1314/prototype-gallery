import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { CAP_STEP } from "../data";
import { useStore } from "../provider";
import { isValidCap, membersFor } from "../store";
import { colors, radius, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/** 编辑某位成员的每月积分上限:步长 100,不能低于本月已用 */
export default function MemberCapSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const member = membersFor(state).find((m) => m.id === id);
  const [text, setText] = useState(String(member?.cap ?? ""));
  if (!member) return null;

  const cap = text.trim() === "" ? NaN : Number(text);
  const tooLow = Number.isFinite(cap) && cap < member.used;
  const valid = isValidCap(member, cap);
  const step = (delta: number) => setText(String(Math.max(0, (Number.isFinite(cap) ? cap : member.cap) + delta)));

  return (
    <Sheet title={member.name} onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.label}>Monthly credit cap</Text>
        <View style={styles.stepper}>
          <StepButton label="−" accessibilityLabel="Decrease cap" onPress={() => step(-CAP_STEP)} />
          <TextInput
            value={text}
            onChangeText={(t) => setText(t.replace(/[^0-9]/g, ""))}
            style={[styles.input, noOutline]}
            keyboardType="number-pad"
            accessibilityLabel="Monthly credit cap"
            selectTextOnFocus
          />
          <StepButton label="+" accessibilityLabel="Increase cap" onPress={() => step(CAP_STEP)} />
        </View>
        <Text style={[styles.hint, tooLow && styles.error]}>
          {tooLow ? "Cap can’t be lower than credits already used" : `${member.used.toLocaleString("en-US")} credits used this month`}
        </Text>
        <PrimaryButton
          label="Save"
          disabled={!valid}
          onPress={() => {
            dispatch({ type: "setMemberCap", workspace: state.workspace, id, cap });
            dispatch({ type: "showToast", text: "Credit cap updated" });
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}

function StepButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.stepBtn, pressed && styles.faded]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.xs },
  label: { ...type.subhead, color: colors.sub },
  stepper: { flexDirection: "row", alignItems: "center", gap: space.md },
  stepBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center" },
  stepText: { ...type.title2, color: colors.ink },
  faded: { opacity: 0.5 },
  input: { ...type.title2, flex: 1, height: 48, textAlign: "center", borderRadius: radius.md, backgroundColor: colors.grouped, color: colors.ink, fontVariant: ["tabular-nums"] },
  hint: { ...type.footnote, color: colors.sub },
  error: { color: colors.danger },
});
