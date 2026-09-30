import { StyleSheet, Text } from "react-native";
import GroupedSection from "../components/GroupedSection";
import Row from "../components/Row";
import Sheet from "../components/Sheet";
import { useStore } from "../provider";
import { colors, space, type } from "../theme";

export default function AiDataSharingSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  return (
    <Sheet title="AI data sharing" onClose={onClose}>
      <Text style={styles.text}>
        To generate results, your prompts and uploads are processed by our third-party AI model providers. They don’t receive your account info or use your content for training.
      </Text>
      <GroupedSection variant="plain">
        <Row label="Privacy Policy" onPress={() => dispatch({ type: "showToast", text: "Opens Privacy Policy" })} chevron />
      </GroupedSection>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { ...type.subhead, color: colors.sub, paddingHorizontal: space.sm, marginBottom: space.lg },
});
