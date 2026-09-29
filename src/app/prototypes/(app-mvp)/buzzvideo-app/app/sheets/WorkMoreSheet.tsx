import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";

export default function WorkMoreSheet({ workId, onClose }: { workId: string; onClose: () => void }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  return (
    <Sheet onClose={onClose}>
      <GroupedSection variant="plain">
        <Row
          icon="rotate-ccw"
          label="Regenerate"
          detail="Make a new version with the same prompt"
          onPress={() => {
            // 成功 / 积分不足的提示都由 store 决定
            dispatch({ type: "regenerateJob", id: workId, newId: nextId("j") });
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
            // 先离开详情页再删,避免闪一下「This work was deleted.」
            navigate({ type: "pop" });
            dispatch({ type: "deleteJob", id: workId });
            dispatch({ type: "showToast", text: "Deleted" });
          }}
        />
      </GroupedSection>
    </Sheet>
  );
}
