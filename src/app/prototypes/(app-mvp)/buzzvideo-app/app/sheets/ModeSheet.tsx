import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { MODES } from "../data";
import { useStore } from "../provider";
import { isSubscribed } from "../store";
import { colors } from "../theme";

export default function ModeSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  // Free 用户在个人空间:视频需要订阅,提前在模式上标出来(spec §5.2)
  const freePersonal = !isSubscribed(state) && state.workspace === "personal";
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
            value={freePersonal && m.id === "video" ? "Starter+" : undefined}
            onPress={() => {
              // 只改模式:默认模型由 store 按套餐选(没锁的第一个)
              dispatch({ type: "setComposer", patch: { mode: m.id } });
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
