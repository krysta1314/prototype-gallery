import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { MODES, defaultModel } from "../data";
import { useStore } from "../provider";
import { colors } from "../theme";

export default function ModeSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  return (
    <Sheet title="Mode" onClose={onClose}>
      <GroupedSection variant="plain">
        {MODES.map((m) => (
          <Row
            key={m.id}
            icon={m.icon}
            iconColor={colors.ink}
            label={m.label}
            detail={m.description}
            selected={state.composer.mode === m.id}
            onPress={() => {
              dispatch({ type: "setComposer", patch: { mode: m.id, model: defaultModel(m.id) } });
              onClose();
            }}
          />
        ))}
        <Row
          icon="clapperboard"
          iconColor={colors.ink}
          label="Hybrid Reel"
          detail="Coming soon"
          disabled
          onPress={() => dispatch({ type: "showToast", text: "Hybrid Reel is coming soon" })}
        />
      </GroupedSection>
    </Sheet>
  );
}
