import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import Coin from "../components/Coin";
import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Segmented from "../components/Segmented";
import Sheet from "../components/Sheet";
import { MODELS, MODE_COST } from "../data";
import { useNav, useStore } from "../provider";
import { modelLocked, type Composer } from "../store";
import { colors, HIT, space, type } from "../theme";

const BATCH = ["1", "2", "3", "4"] as const;
const RATIOS: Composer["ratio"][] = ["9:16", "1:1", "16:9"];

export default function ModelSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const c = state.composer;
  if (c.mode === "agent") return null;
  const set = (patch: Partial<Composer>) => dispatch({ type: "setComposer", patch });

  return (
    <Sheet
      title="Model settings"
      onClose={onClose}
      right={
        <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      }
    >
      <GroupedSection variant="plain">
        {MODELS[c.mode].map((m) => (
          <Row
            key={m.id}
            label={m.label}
            selected={c.model === m.id}
            right={
              modelLocked(state, m.id) ? (
                <View style={styles.lock}>
                  <Icon name="lock" size={14} color={colors.sub} />
                  <Text style={styles.lockText}>Pro</Text>
                </View>
              ) : undefined
            }
            onPress={() => (modelLocked(state, m.id) ? navigate({ type: "push", route: { name: "plans" } }) : set({ model: m.id }))}
          />
        ))}
      </GroupedSection>
      <Text style={styles.label}>Outputs</Text>
      <Segmented value={String(c.batch) as (typeof BATCH)[number]} options={BATCH.map((b) => ({ id: b, label: b }))} onChange={(b) => set({ batch: Number(b) })} />
      {c.mode !== "audio" ? (
        <>
          <Text style={styles.label}>Aspect ratio</Text>
          <Segmented value={c.ratio} options={RATIOS.map((r) => ({ id: r, label: r }))} onChange={(ratio) => set({ ratio })} />
        </>
      ) : null}
      <View style={styles.costRow}>
        <Coin size={14} />
        <Text style={styles.cost}>{MODE_COST[c.mode] * c.batch} credits per request</Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: { ...type.footnote, color: colors.sub, marginTop: space.lg, marginBottom: space.sm },
  costRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: space.xl, marginBottom: space.sm },
  cost: { ...type.footnote, color: colors.sub },
  doneBtn: { height: HIT, minWidth: HIT, paddingHorizontal: space.md, alignItems: "center", justifyContent: "center" },
  lock: { flexDirection: "row", alignItems: "center", gap: 4 },
  lockText: { ...type.footnote, color: colors.sub },
  pressed: { opacity: 0.5 },
  doneText: { ...type.headline, color: colors.ink },
});
