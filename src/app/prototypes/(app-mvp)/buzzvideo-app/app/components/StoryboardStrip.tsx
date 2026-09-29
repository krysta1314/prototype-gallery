import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, type, smoothCorners } from "../theme";
import { pressScale } from "./motion";

type Beat = { label: string; text: string };
type Props = { frames: string[]; beats: Beat[]; onPress?: (beat: Beat) => void };

const W = 88;
const H = Math.round((W * 16) / 9);

/** 分镜条:三张 9:16 小缩略图,下面是 Hook / Scene / CTA 与一句说明 */
export default function StoryboardStrip({ frames, beats, onPress }: Props) {
  return (
    <View style={styles.row}>
      {beats.map((b, i) => (
        <Pressable
          key={`${b.label}-${i}`}
          onPress={onPress ? () => onPress(b) : undefined}
          accessibilityRole={onPress ? "button" : undefined}
          accessibilityLabel={`${b.label} ${b.text}`}
          style={({ pressed }) => [styles.beat, pressScale(pressed && !!onPress)]}
        >
          <Image source={{ uri: frames[i % frames.length] }} style={styles.frame} resizeMode="cover" />
          <View style={styles.caption}>
            {b.label ? <Text style={styles.label}>{b.label}</Text> : null}
            <Text style={styles.text} numberOfLines={3}>
              {b.text}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  beat: { width: W, gap: 8 },
  frame: { width: W, height: H, borderRadius: radius.md, backgroundColor: colors.grouped, ...smoothCorners },
  caption: { gap: 0 },
  label: { ...type.footnote, fontWeight: "600", color: colors.ink },
  text: { ...type.footnote, color: colors.sub },
});
