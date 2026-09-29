import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type ScrollViewInstance,
  type NativeSyntheticEvent,
} from "react-native";
import CreditsPill from "../components/CreditsPill";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import MediaVideo from "../components/MediaVideo";
import Pill from "../components/Pill";
import { BANNERS, CATEGORIES, MODES, USE_CASES, defaultModel, type Banner, type Mode, type UseCase } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, radius, type } from "../theme";

const BANNER_H = 300;
const AUTO_ADVANCE_MS = 4000;
/** 程序触发的翻页动画时长,期间忽略滚动回调 */
const SCROLL_ANIMATION_MS = 900;

export default function Inspire() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const [cat, setCat] = useState(CATEGORIES[0]);
  const list = cat === "All" ? USE_CASES : USE_CASES.filter((u) => u.category === cat);
  const cols: UseCase[][] = [[], []];
  list.forEach((u, i) => cols[i % 2].push(u));

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
          <Pressable key={m.id} onPress={() => startMode(m.id)} style={({ pressed }) => [styles.quickItem, pressed && styles.pressed]}>
            <View style={styles.quickIcon}>
              <Icon name={m.icon} size={24} color={colors.ink} />
            </View>
            <Text style={styles.quickLabel} numberOfLines={2}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {CATEGORIES.map((c) => (
          <Pill key={c} label={c} active={c === cat} onPress={() => setCat(c)} />
        ))}
      </ScrollView>

      <View style={styles.masonry}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((u) => (
              <UseCaseCard key={u.id} uc={u} onPress={() => navigate({ type: "push", route: { name: "useCase", id: u.id } })} />
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
  const programmaticAt = useRef(0);

  // 每次翻页(自动或手动)后重新计时,手动滑过之后不会马上又被自动翻走
  useEffect(() => {
    if (!width) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % BANNERS.length), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [width, index]);

  useEffect(() => {
    if (!width) return;
    programmaticAt.current = Date.now();
    ref.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 程序触发的翻页动画期间忽略回调,避免把 index 拉回旧值
    if (!width || Date.now() - programmaticAt.current < SCROLL_ANIMATION_MS) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={{ height: BANNER_H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} onScrollEndDrag={onScroll}>
        {BANNERS.map((b) => (
          <Pressable key={b.id} onPress={() => onOpen(b)} style={{ width: width || 390, height: BANNER_H }}>
            <Image source={{ uri: b.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Gradient colors={["rgba(26,26,46,0)", "rgba(26,26,46,0.7)"]} style={styles.bannerScrim} pointerEvents="none" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerKicker}>{b.kicker}</Text>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerSub}>{b.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {BANNERS.map((b, i) => (
          <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={[styles.credits, { top: insets.top + 6 }]}>
        <CreditsPill />
      </View>
    </View>
  );
}

function UseCaseCard({ uc, onPress }: { uc: UseCase; onPress: () => void }) {
  const mode = MODES.find((m) => m.id === uc.mode)!;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View>
        {uc.video ? (
          <View style={[styles.cardImg, { height: uc.tall ? 250 : 190, overflow: "hidden" }]}>
            <MediaVideo uri={uc.video} poster={uc.cover} muted loop autoPlay style={{ width: "100%", height: "100%" }} />
          </View>
        ) : (
          <Image source={{ uri: uc.cover }} style={[styles.cardImg, { height: uc.tall ? 250 : 190 }]} resizeMode="cover" />
        )}
        <View style={styles.cardTag}>
          <Icon name={mode.icon} size={12} color={colors.white} />
          <Text style={styles.cardTagText}>{mode.short}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {uc.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 24 },
  pressed: { opacity: 0.8 },
  bannerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 180 },
  bannerText: { position: "absolute", left: 20, right: 20, bottom: 58, gap: 4 },
  bannerKicker: { ...type.footnote, fontWeight: "500", color: "rgba(255,255,255,0.85)" },
  bannerTitle: { ...type.title2, color: colors.white },
  bannerSub: { ...type.subhead, color: "rgba(255,255,255,0.9)" },
  dots: { position: "absolute", bottom: 36, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 18, backgroundColor: colors.white },
  credits: { position: "absolute", right: 16 },
  quick: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  quickItem: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  quickIcon: { width: 44, height: 32, alignItems: "center", justifyContent: "center" },
  quickLabel: { ...type.footnote, fontWeight: "500", color: colors.ink, textAlign: "center" },
  cats: { gap: 8, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 14 },
  masonry: { flexDirection: "row", gap: 10, paddingHorizontal: 16 },
  col: { flex: 1, gap: 14 },
  card: { gap: 8 },
  cardImg: { width: "100%", borderRadius: radius.lg, backgroundColor: colors.grouped },
  cardTag: { position: "absolute", left: 8, top: 8, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: "rgba(26,26,46,0.55)" },
  cardTagText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  cardPlay: { position: "absolute", right: 8, top: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(26,26,46,0.55)", alignItems: "center", justifyContent: "center" },
  cardTitle: { ...type.subhead, fontWeight: "600", color: colors.ink, paddingHorizontal: 2 },
});
