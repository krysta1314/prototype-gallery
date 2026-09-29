import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import CreditsPill from "../components/CreditsPill";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import MediaVideo from "../components/MediaVideo";
import { pressScale } from "../components/motion";
import { BANNERS, CATEGORIES, MODES, USE_CASES, defaultModel, type Banner, type Mode, type UseCase } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, HIT, radius, space, type } from "../theme";

const BANNER_H = 360;
const AUTO_ADVANCE_MS = 6000;
/** 程序触发的翻页动画时长,期间的滚动回调不算「手动滑动」 */
const SCROLL_ANIMATION_MS = 900;
/** 瀑布流保留真实高度差:三档 */
const HEIGHTS = [250, 190, 310] as const;

export default function Inspire() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const [cat, setCat] = useState(CATEGORIES[0]);
  const list = cat === "All" ? USE_CASES : USE_CASES.filter((u) => u.category === cat);
  const cols: { uc: UseCase; h: number }[][] = [[], []];
  list.forEach((u, i) => cols[i % 2].push({ uc: u, h: u.tall ? HEIGHTS[i % 3 === 1 ? 2 : 0] : HEIGHTS[1] }));

  const startMode = (mode: Mode) => {
    dispatch({ type: "selectSession", id: null });
    dispatch({ type: "setComposer", patch: { mode, model: defaultModel(mode) } });
    navigate({ type: "tab", tab: "create" });
  };
  const openBanner = (b: Banner) =>
    b.action.type === "useCase"
      ? navigate({ type: "push", route: { name: "useCase", id: b.action.id } })
      : startMode(b.action.mode);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <BannerCarousel onOpen={openBanner} />

      <View style={styles.quick}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => startMode(m.id)}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            style={({ pressed }) => [styles.quickItem, pressed && styles.pressedFade]}
          >
            <Icon name={m.icon} size={24} color={colors.ink} />
            <Text style={styles.quickLabel} numberOfLines={1}>
              {m.short}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats} style={styles.catsBar}>
        {CATEGORIES.map((c) => {
          const on = c === cat;
          return (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={styles.catTab}
            >
              <Text style={[styles.catText, on && styles.catTextOn]}>{c}</Text>
              <View style={[styles.catLine, on && styles.catLineOn]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.masonry}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map(({ uc, h }) => (
              <UseCaseCard key={uc.id} uc={uc} height={h} onPress={() => navigate({ type: "push", route: { name: "useCase", id: uc.id } })} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function BannerCarousel({ onOpen }: { onOpen: (b: Banner) => void }) {
  const insets = useInsets();
  const ref = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  /** 用户手动滑过之后就不再自动翻页 */
  const [manual, setManual] = useState(false);
  const programmaticAt = useRef(0);
  /** 最近一次自动翻页要去的页 */
  const target = useRef(0);

  useEffect(() => {
    if (!width || manual) return;
    const t = setTimeout(() => {
      const next = (index + 1) % BANNERS.length;
      programmaticAt.current = Date.now();
      target.current = next;
      ref.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [width, index, manual]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    // 自动翻页的动画过程,以及它停在目标页时的回调,都不算手动
    const settledOnTarget = i === target.current && Math.abs(x - i * width) < 2;
    if (settledOnTarget || Date.now() - programmaticAt.current < SCROLL_ANIMATION_MS) return;
    setManual(true);
    if (i !== index && i >= 0 && i < BANNERS.length) setIndex(i);
  };

  return (
    <View style={styles.banner} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onScrollBeginDrag={() => setManual(true)}
        onTouchStart={() => setManual(true)}
        scrollEventThrottle={64}
      >
        {BANNERS.map((b) => (
          <Pressable key={b.id} onPress={() => onOpen(b)} accessibilityRole="button" accessibilityLabel={b.title} style={{ width: width || 390, height: BANNER_H }}>
            <Image source={{ uri: b.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { height: insets.top + 64 }]} pointerEvents="none" />
            <Gradient colors={["rgba(26,26,46,0)", "rgba(26,26,46,0.7)"]} style={styles.bannerScrim} pointerEvents="none" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerLabel}>{b.kicker}</Text>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerSub}>{b.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.pager} accessibilityLabel={`Banner ${index + 1} of ${BANNERS.length}`}>
        {BANNERS.map((b, i) => (
          <View key={b.id} style={[styles.pagerLine, i === index && styles.pagerLineOn]} />
        ))}
      </View>
      <View style={[styles.credits, { top: insets.top + space.sm }]}>
        <CreditsPill />
      </View>
    </View>
  );
}

function UseCaseCard({ uc, height, onPress }: { uc: UseCase; height: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressScale(pressed)]}>
      <View style={[styles.cardImg, { height }]}>
        {uc.video ? (
          <MediaVideo uri={uc.video} poster={uc.cover} muted loop autoPlay style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {uc.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 满版出血,底部两角做大圆角,和下面的内容区分开
  banner: { height: BANNER_H, overflow: "hidden", borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero },
  root: { flex: 1 },
  content: { paddingBottom: space.xl },
  pressedFade: { opacity: 0.5 },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0 },
  bannerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  bannerText: { position: "absolute", left: space.lg, right: 72, bottom: space.xl, gap: 2 },
  bannerLabel: { ...type.footnote, fontWeight: "500", color: "rgba(255,255,255,0.85)", marginBottom: 2 },
  bannerTitle: { ...type.title2, color: colors.white },
  bannerSub: { ...type.subhead, color: "rgba(255,255,255,0.85)" },
  pager: { position: "absolute", right: space.lg, bottom: space.xl + 6, flexDirection: "row", gap: space.xs },
  pagerLine: { width: 16, height: 2, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.4)" },
  pagerLineOn: { backgroundColor: colors.white },
  credits: { position: "absolute", right: space.lg },
  quick: { flexDirection: "row", paddingHorizontal: space.sm, paddingTop: space.lg },
  quickItem: { flex: 1, alignItems: "center", gap: space.sm, paddingVertical: space.sm, minHeight: HIT },
  quickLabel: { ...type.footnote, fontWeight: "500", color: colors.ink, textAlign: "center" },
  catsBar: { marginTop: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  cats: { gap: space.xl, paddingHorizontal: space.lg },
  catTab: { height: HIT, justifyContent: "flex-end" },
  catText: { ...type.footnote, fontWeight: "500", color: colors.sub, paddingBottom: 10 },
  catTextOn: { color: colors.ink, fontWeight: "600" },
  catLine: { height: 2, borderRadius: radius.full, backgroundColor: "transparent" },
  catLineOn: { backgroundColor: colors.accent },
  masonry: { flexDirection: "row", gap: space.md, paddingHorizontal: space.lg, paddingTop: space.lg },
  col: { flex: 1, gap: space.lg },
  card: { gap: space.sm },
  cardImg: { width: "100%", borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped },
  cardTitle: { ...type.subhead, fontWeight: "600", color: colors.ink, paddingHorizontal: 2 },
});
