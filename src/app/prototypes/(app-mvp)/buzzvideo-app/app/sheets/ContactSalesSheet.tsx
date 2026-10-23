import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Sheet from "../components/Sheet";
import { USER } from "../data";
import { useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

const noOutline = { outlineStyle: "none" } as unknown as TextStyle;
const MAX = 2000;

/**
 * 联系销售(2026-10-23,和网页版 Contact Sales 弹窗一致):Enterprise 专享功能(Hybrid Reel)被非 Enterprise 用户点到时打开。
 * Name / Email(预填登录邮箱)/ Description(0 / 2000),三项都必填;Cancel / Send。
 * 真实 APP:提交到和网页同一个销售线索接口，1 个工作日内回复
 */
export default function ContactSalesSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(USER.email);
  const [desc, setDesc] = useState("");
  const ready = name.trim() && /\S+@\S+\.\S+/.test(email) && desc.trim();
  const send = () => {
    if (!ready) return;
    dispatch({ type: "showToast", text: "Thanks! We'll get back to you within 1 business day." });
    onClose();
  };
  return (
    <Sheet title="Contact Sales" onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.lead}>Hybrid Reel is part of Enterprise. Tell us about your team size, use case, and any specific needs. We'll get back to you within 1 business day.</Text>
        <Field label="Name">
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.faint} accessibilityLabel="Name" style={[styles.input, noOutline]} />
        </Field>
        <Field label="Email">
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email" style={[styles.input, noOutline]} />
        </Field>
        <Field label="Description">
          <TextInput
            value={desc}
            onChangeText={(t) => setDesc(t.slice(0, MAX))}
            multiline
            placeholder="Tell us about your team size, use case, and any specific needs..."
            placeholderTextColor={colors.faint}
            accessibilityLabel="Description"
            style={[styles.input, styles.area, noOutline]}
          />
          <Text style={styles.count}>{`${desc.length} / ${MAX}`}</Text>
        </Field>
        <View style={styles.actions}>
          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.cancel, pressed && styles.faded]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <PrimaryButton label="Send" onPress={send} disabled={!ready} style={styles.send} />
        </View>
      </View>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        <Text style={styles.star}> *</Text>
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingBottom: space.sm },
  lead: { ...type.subhead, color: colors.sub },
  field: { gap: 6 },
  label: { ...type.subhead, fontWeight: "600", color: colors.ink },
  star: { color: colors.danger },
  input: { ...type.body, height: 48, paddingHorizontal: space.lg, borderRadius: radius.md, backgroundColor: colors.grouped, color: colors.ink },
  area: { height: 112, paddingTop: space.md, textAlignVertical: "top" },
  count: { ...type.caption1, color: colors.faint, alignSelf: "flex-end" },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.xs },
  cancel: { flex: 1, height: 50, borderRadius: radius.full, backgroundColor: colors.grouped, alignItems: "center", justifyContent: "center" },
  cancelText: { ...type.headline, color: colors.ink },
  send: { flex: 1 },
  faded: { opacity: 0.5 },
});
