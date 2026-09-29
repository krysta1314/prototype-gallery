import { Image, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import IconButton from "../components/IconButton";
import MediaVideo from "../components/MediaVideo";
import PrimaryButton from "../components/PrimaryButton";
import { MODES, USE_CASES, modelLabel } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import { composerFromUseCase } from "../store";
import { colors, space, type } from "../theme";

/** 灵感详情:沉浸式全屏,底部压图文字;"Make one like this" 是这屏唯一的渐变 */
export default function UseCaseDetail({ id }: { id: string }) {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const uc = USE_CASES.find((u) => u.id === id);
  if (!uc) return null;
  const mode = MODES.find((m) => m.id === uc.mode)!;
  const refs = uc.attachments.length;
  const meta = [
    mode.label,
    uc.model ? modelLabel(uc.model) : null,
    refs > 0 ? `${refs} reference photo${refs > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

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
      <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { height: insets.top + 72 }]} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <IconButton tone="onImage" icon="chevron-left" accessibilityLabel="Back" onPress={() => navigate({ type: "pop" })} />
        <IconButton tone="onImage" icon="ellipsis" accessibilityLabel="More" onPress={() => navigate({ type: "sheet", sheet: { name: "report", target: uc.id } })} />
      </View>
      <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.85)"]} style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        <Text style={styles.title} numberOfLines={2}>
          {uc.title}
        </Text>
        <Text style={styles.meta}>{meta.join(" · ")}</Text>
        <Text style={styles.prompt} numberOfLines={4}>
          {uc.prompt}
        </Text>
        <PrimaryButton label="Make one like this" onPress={tryIt} style={styles.cta} />
      </Gradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0 },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: space.xs },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 140, paddingHorizontal: space.lg },
  title: { ...type.title1, color: colors.white },
  meta: { ...type.footnote, fontWeight: "500", color: "rgba(255,255,255,0.8)", marginTop: space.xs },
  prompt: { ...type.subhead, color: "rgba(255,255,255,0.9)", marginTop: space.md },
  cta: { marginTop: space.xl },
});
