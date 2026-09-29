import { View } from "react-native";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { WORKSPACES } from "../data";
import { useStore } from "../provider";

export default function WorkspaceSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  return (
    <Sheet title="Switch workspace" onClose={onClose}>
      <View>
        {WORKSPACES.map((w) => (
          <Row
            key={w.id}
            icon={w.id === "personal" ? "user-round" : "folder-open"}
            label={w.name}
            detail={`${w.detail} · ✦ ${state.credits[w.id].toLocaleString("en-US")}`}
            selected={state.workspace === w.id}
            onPress={() => {
              dispatch({ type: "setWorkspace", workspace: w.id });
              dispatch({ type: "showToast", text: `Switched to ${w.name}` });
              onClose();
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}
