import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import Row from "../components/Row";
import Segmented from "../components/Segmented";
import Sheet from "../components/Sheet";
import { MODELS, MODE_COST } from "../data";
import { useStore } from "../provider";
import type { Composer } from "../store";
import { colors } from "../theme";

const BATCH = ["1", "2", "3", "4"] as const;
const RATIOS: Composer["ratio"][] = ["9:16", "1:1", "16:9"];

export default function ModelSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const c = state.composer;
  if (c.mode === "agent") return null;
  const set = (patch: Partial<Composer>) => dispatch({ type: "setComposer", patch });

  return (
    <Sheet title="Model settings" onClose={onClose}>
      <View>
        {MODELS[c.mode].map((m) => (
          <Row key={m.id} label={m.label} selected={c.model === m.id} onPress={() => set({ model: m.id })} />
        ))}
      </View>
      <Text style={styles.label}>Outputs</Text>
      <Segmented value={String(c.batch) as (typeof BATCH)[number]} options={BATCH.map((b) => ({ id: b, label: b }))} onChange={(b) => set({ batch: Number(b) })} />
      {c.mode !== "audio" ? (
        <>
          <Text style={styles.label}>Aspect ratio</Text>
          <Segmented value={c.ratio} options={RATIOS.map((r) => ({ id: r, label: r }))} onChange={(ratio) => set({ ratio })} />
        </>
      ) : null}
      <Text style={styles.cost}>✦ {MODE_COST[c.mode] * c.batch} credits per request</Text>
      <PrimaryButton label="Done" onPress={onClose} style={styles.done} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "700", color: colors.sub, marginTop: 14, marginBottom: 8 },
  cost: { fontSize: 13, color: colors.sub, marginTop: 14, textAlign: "center" },
  done: { marginTop: 12 },
});
