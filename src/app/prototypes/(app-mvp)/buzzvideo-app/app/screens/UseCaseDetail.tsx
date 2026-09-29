import { Image, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import MediaVideo from "../components/MediaVideo";
import PrimaryButton from "../components/PrimaryButton";
import { MODES, USE_CASES, modelLabel } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import { composerFromUseCase } from "../store";
import { colors } from "../theme";

export default function UseCaseDetail({ id }: { id: string }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const uc = USE_CASES.find((u) => u.id === id);
  if (!uc) return null;
  const mode = MODES.find((m) => m.id === uc.mode)!;

  const tryIt = () => {
    dispatch({ type: "selectSession", id: null });
    dispatch({ type: "setComposer", patch: composerFromUseCase(uc, nextId) });
    navigate({ type: "tab", tab: "create" });
  };

  return (
    <View style={styles.root}>
      {uc.video ? (
        <MediaVideo uri={uc.video} poster={uc.cover} style={StyleSheet.absoluteFill} />
      ) : (
        <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <IconButton tone="dark" icon="chevron-left" onPress={() => navigate({ type: "pop" })} />
        <IconButton tone="dark" icon="ellipsis" onPress={() => navigate({ type: "sheet", sheet: { name: "report", target: uc.id } })} />
      </View>
      <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.82)"]} style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>{uc.title}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Icon name={mode.icon} size={13} color={colors.white} />
            <Text style={styles.chipText}>{mode.label}</Text>
          </View>
          {uc.model ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{modelLabel(uc.model)}</Text>
            </View>
          ) : null}
          {uc.attachments.length > 0 ? (
            <View style={styles.chip}>
              <Icon name="images" size={13} color={colors.white} />
              <Text style={styles.chipText}>
                {uc.attachments.length} reference photo{uc.attachments.length > 1 ? "s" : ""}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.prompt} numberOfLines={4}>
          {uc.prompt}
        </Text>
        <PrimaryButton label="Try it now" icon="sparkles" onPress={tryIt} />
      </Gradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 120, paddingHorizontal: 20, gap: 12 },
  title: { color: colors.white, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)" },
  chipText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  prompt: { color: "rgba(255,255,255,0.88)", fontSize: 15, lineHeight: 21 },
});
