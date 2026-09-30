import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import ProgressBar from "../components/ProgressBar";
import { useNav, useStore } from "../provider";
import { ROLE_LABEL, membersFor } from "../store";
import { colors, radius, space, type } from "../theme";
import type { Member } from "../data";

const fmt = (n: number) => n.toLocaleString("en-US");

/** 组织管理员的成员页:看每人本月用量、改每月积分上限、邀请新成员 */
export default function Members() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const members = membersFor(state);

  return (
    <View style={styles.page}>
      <NavBar
        title="Members"
        left={<IconButton icon="chevron-left" onPress={() => navigate({ type: "pop" })} accessibilityLabel="Back" />}
        right={
          <Pressable
            onPress={() => navigate({ type: "sheet", sheet: { name: "invite" } })}
            accessibilityRole="button"
            accessibilityLabel="Invite"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.invite, pressed && styles.faded]}
          >
            <Text style={styles.inviteText}>Invite</Text>
          </Pressable>
        }
      />
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {members.map((m, i) => (
            <MemberRow key={m.id} member={m} separator={i > 0} onPress={() => navigate({ type: "sheet", sheet: { name: "memberCap", id: m.id } })} />
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.note}>Manage roles, removals and billing on the web.</Text>
          <Pressable
            onPress={() => dispatch({ type: "showToast", text: "Opening buzzvideo.ai…" })}
            accessibilityRole="link"
            style={({ pressed }) => [pressed && styles.faded]}
          >
            <Text style={styles.link}>Manage more on the web ↗</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function MemberRow({ member: m, separator, onPress }: { member: Member; separator: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${m.name}, ${ROLE_LABEL[m.role]}, ${fmt(m.used)} of ${fmt(m.cap)} credits this month. Edit cap`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {separator ? <View style={styles.sep} /> : null}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{m.name[0]}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {m.name}
          </Text>
          <Text style={styles.role}>{ROLE_LABEL[m.role]}</Text>
        </View>
        <Text style={styles.usage}>{`${fmt(m.used)} / ${fmt(m.cap)} credits this month`}</Text>
        <ProgressBar value={m.cap > 0 ? m.used / m.cap : 0} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxl, gap: space.xl },
  faded: { opacity: 0.5 },
  invite: { paddingHorizontal: space.md, height: 44, justifyContent: "center" },
  inviteText: { ...type.body, fontWeight: "600", color: colors.accent },
  list: { borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  pressed: { backgroundColor: colors.pressed },
  sep: { position: "absolute", top: 0, right: 0, left: 16 + 40 + 12, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  avatar: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.raised, alignItems: "center", justifyContent: "center" },
  avatarText: { ...type.headline, color: colors.ink },
  body: { flex: 1, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
  name: { ...type.headline, color: colors.ink, flexShrink: 1 },
  role: { ...type.footnote, color: colors.sub },
  usage: { ...type.subhead, color: colors.sub, fontVariant: ["tabular-nums"] },
  footer: { alignItems: "center", gap: space.xs },
  note: { ...type.footnote, color: colors.sub, textAlign: "center" },
  link: { ...type.subhead, fontWeight: "600", color: colors.accent },
});
