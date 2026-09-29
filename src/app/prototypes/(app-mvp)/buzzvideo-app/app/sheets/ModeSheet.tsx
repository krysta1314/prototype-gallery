import { View } from "react-native";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { MODES, defaultModel } from "../data";
import { useStore } from "../provider";

export default function ModeSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  return (
    <Sheet title="Mode" onClose={onClose}>
      <View>
        {MODES.map((m) => (
          <Row
            key={m.id}
            icon={m.icon}
            label={m.label}
            detail={m.description}
            selected={state.composer.mode === m.id}
            onPress={() => {
              dispatch({ type: "setComposer", patch: { mode: m.id, model: defaultModel(m.id) } });
              onClose();
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}
