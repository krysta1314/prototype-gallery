import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { WORKSPACES } from "../data";
import { useStore } from "../provider";

export default function WorkspaceSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  return (
    <Sheet title="Switch workspace" onClose={onClose}>
      <GroupedSection variant="plain">
        {WORKSPACES.map((w) => (
          <Row
            key={w.id}
            label={w.name}
            detail={`${w.id === "personal" ? "Just you" : w.detail} · ${state.credits[w.id].toLocaleString("en-US")} credits`}
            selected={state.workspace === w.id}
            onPress={() => {
              dispatch({ type: "setWorkspace", workspace: w.id });
              dispatch({ type: "showToast", text: `Switched to ${w.name}` });
              onClose();
            }}
          />
        ))}
      </GroupedSection>
    </Sheet>
  );
}
