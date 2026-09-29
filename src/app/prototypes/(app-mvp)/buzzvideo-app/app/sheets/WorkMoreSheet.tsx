import { View } from "react-native";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";

export default function WorkMoreSheet({ workId, onClose }: { workId: string; onClose: () => void }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  return (
    <Sheet onClose={onClose}>
      <View>
        <Row
          icon="rotate-ccw"
          label="Regenerate"
          detail="Make a new version with the same prompt"
          onPress={() => {
            dispatch({ type: "regenerateJob", id: workId, newId: nextId("j") });
            dispatch({ type: "showToast", text: "Regenerating — we’ll notify you" });
            onClose();
          }}
        />
        <Row
          icon="copy"
          label="Copy prompt"
          onPress={() => {
            dispatch({ type: "showToast", text: "Prompt copied" });
            onClose();
          }}
        />
        <Row icon="flag" label="Report" onPress={() => navigate({ type: "sheet", sheet: { name: "report", target: workId } })} />
        <Row
          icon="trash"
          label="Delete"
          danger
          onPress={() => {
            dispatch({ type: "deleteJob", id: workId });
            dispatch({ type: "showToast", text: "Deleted" });
            navigate({ type: "pop" });
          }}
        />
      </View>
    </Sheet>
  );
}
