import { useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from "react-native";
import Gradient from "../components/Gradient";
import MediaVideo from "../components/MediaVideo";
import PrimaryButton from "../components/PrimaryButton";
import { A } from "../data";
import { useInsets, useStore } from "../provider";
import { colors, space, type } from "../theme";

type Page = { title: string; body: string; video?: string; poster: string };

/** 首屏三页:前两页各用一条真实成片,第三页用已有的横幅图(素材里只有两条视频) */
const PAGES: Page[] = [
  { title: "Make marketing videos in one line", body: "Tell Marketing Agent what you need — it writes, storyboards and renders for you.", video: `${A}/result-agent.mp4`, poster: `${A}/result-agent.jpg` },
  { title: "Images, videos and audio", body: "Generate any format with top AI models.", video: `${A}/result-video.mp4`, poster: `${A}/result-video.jpg` },
  { title: "Your web workspace, in your pocket", body: "Same account, credits and assets as the web. Do even more on buzzvideo.ai.", poster: `${A}/banner-seedance.jpg` },
];

/** 首次打开:3 页横向翻页,全屏成片背景 + 底部标题与说明。Skip / Get started 都进入隐私弹窗 */
export default function Onboarding() {
  const { dispatch } = useStore();
  const insets = useInsets();
  const [width, setWidth] = useState(390);
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollViewInstance>(null);
  const last = index === PAGES.length - 1;

  const finish = () => dispatch({ type: "completeOnboarding" });
  const next = () => {
    if (last) return finish();
    scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.max(0, Math.min(PAGES.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))));
  };

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} scrollEventThrottle={16}>
        {PAGES.map((p) => (
          <View key={p.title} style={{ width }}>
            {p.video ? (
              <MediaVideo uri={p.video} poster={p.poster} muted loop autoPlay style={StyleSheet.absoluteFill} />
            ) : (
              <Image source={{ uri: p.poster }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
            <Gradient colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { pointerEvents: "none" }]} />
            <Gradient colors={["rgba(26,26,46,0)", "rgba(26,26,46,0.6)", "rgba(26,26,46,0.85)", "rgba(26,26,46,0.94)"]} style={[styles.bottomScrim, { pointerEvents: "none" }]} />
            <View style={[styles.copy, { bottom: insets.bottom + space.lg + 52 + space.xl + 8 + space.lg, pointerEvents: "none" }]}>
              <Text style={styles.title} accessibilityRole="header">
                {p.title}
              </Text>
              <Text style={styles.body}>{p.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip" hitSlop={8} style={[styles.skip, { top: insets.top + space.sm }]}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg, pointerEvents: "box-none" }]}>
        <View style={styles.dots} accessibilityLabel={`Page ${index + 1} of ${PAGES.length}`}>
          {PAGES.map((p, i) => (
            <View key={p.title} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
        <PrimaryButton variant="white" label={last ? "Get started" : "Next"} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0, height: 160 },
  bottomScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "62%" },
  copy: { position: "absolute", left: space.xl, right: space.xl, gap: space.sm },
  title: { ...type.largeTitle, color: colors.white },
  body: { ...type.subhead, color: "rgba(255,255,255,0.8)" },
  skip: { position: "absolute", right: space.xl, minHeight: 44, justifyContent: "center" },
  skipText: { ...type.headline, color: colors.white },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, gap: space.lg },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotOn: { width: 18, backgroundColor: colors.white },
});
