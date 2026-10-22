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
import MediaVideo from "../components/MediaVideo";
import CategoryTabs from "../components/CategoryTabs";
import ToolEntries, { useStartTool } from "../components/ToolEntries";
import { tabBarSpace } from "../components/TabBar";
import { pressScale } from "../components/motion";
import { BANNERS, CATEGORIES, USE_CASES, defaultModel, type Banner, type Mode, type UseCase } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, radius, smoothCorners, space, type } from "../theme";

const BANNER_H = 280;
const AUTO_ADVANCE_MS = 6000;
/** 程序触发的翻页动画时长,期间的滚动回调不算「手动滑动」 */
const SCROLL_ANIMATION_MS = 900;
/** 瀑布流保留真实高度差:三档 */
const HEIGHTS = [250, 190, 310] as const;

export default function Inspire() {
  const { dispatch } = useStore();
  const insets = useInsets();
  const { navigate } = useNav();
  const [catId, setCatId] = useState(CATEGORIES[0].id);
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  // 标签：运营位按运营标签筛，玩法按 format 筛。热门按做同款次数从高到低
  const list = USE_CASES.filter((u) => (cat.tag ? u.tags?.includes(cat.tag) : u.format === cat.format))
    .sort((a, b) => (cat.id === "trending" ? b.made - a.made : 0));
  const cols: { uc: UseCase; h: number }[][] = [[], []];
  list.forEach((u, i) => cols[i % 2].push({ uc: u, h: u.tall ? HEIGHTS[i % 3 === 1 ? 2 : 0] : HEIGHTS[1] }));

  const startMode = (mode: Mode) => {
    dispatch({ type: "selectSession", id: null });
    dispatch({ type: "setComposer", patch: { mode, model: defaultModel(mode) } });
    navigate({ type: "tab", tab: "create" });
  };
  const startTool = useStartTool();
  const openBanner = (b: Banner) =>
    b.action.type === "useCase"
      ? navigate({ type: "push", route: { name: "useCase", id: b.action.id } })
      : startMode(b.action.mode);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace(insets.bottom) + space.md }]} showsVerticalScrollIndicator={false}>
      <BannerCarousel onOpen={openBanner} />

      {/* 工具入口：剪映式圆形图标宫格，每页 2×4 可翻页(见 ToolEntries) */}
      <ToolEntries onStart={startTool} />

      <CategoryTabs items={CATEGORIES} active={catId} onPick={setCatId} />
      {list.length === 0 ? (
        <View style={styles.emptyFeed}>
          <Text style={styles.emptyText}>No ideas here yet.</Text>
        </View>
      ) : null}

      <View style={styles.masonry}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map(({ uc, h }) => (
              <UseCaseCard key={uc.id} uc={uc} height={h} onPress={() => navigate({ type: "push", route: { name: "useCase", id: uc.id, list: list.map((u) => u.id) } })} />
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
            {b.video ? (
              <MediaVideo uri={b.video} poster={b.image} muted loop autoPlay style={StyleSheet.absoluteFill} />
            ) : (
              <Image source={{ uri: b.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
            <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={[styles.topScrim, { height: insets.top + 64 }]} pointerEvents="none" />
            <Gradient colors={["rgba(15,15,19,0)", "rgba(15,15,19,0.8)"]} style={styles.bannerScrim} pointerEvents="none" />
            <View style={styles.bannerText}>
              <Text style={styles.bannerLabel}>{b.kicker}</Text>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerSub}>{b.subtitle}</Text>
            </View>
            {/* 右下角 CTA(2026-10-21,参照海螺):白色胶囊，点了和点整张 Banner 一样 */}
            <View style={styles.bannerCta} pointerEvents="none">
              <Text style={styles.bannerCtaText}>Try it now</Text>
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

/**
 * 灵感卡(2026-10-21 定):整张是成片，名字压在底部居中;不放模型角标、做同款次数和会员小锁。点卡片 → 详情 → Make one like this(做同款)
 */
function UseCaseCard({ uc, height, onPress }: { uc: UseCase; height: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={uc.title} style={({ pressed }) => [styles.card, pressScale(pressed)]}>
      <View style={[styles.cardImg, { height }]}>
        {uc.video ? (
          <MediaVideo uri={uc.video} poster={uc.cover} muted loop autoPlay style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        {/* 名字压在图底部居中(2026-10-21,参照剪映模板卡):底部一层暗渐变 + 白色粗体标题;不放角标和做同款次数 */}
        <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]} style={styles.cardScrim} pointerEvents="none" />
        <View style={styles.cardMeta}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {uc.title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 满版出血,底部两角做大圆角,和下面的内容区分开
  banner: { height: BANNER_H, overflow: "hidden", borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero, ...smoothCorners },
  root: { flex: 1 },
  content: { paddingBottom: space.xl },
  pressedFade: { opacity: 0.5 },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0 },
  bannerScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  bannerText: { position: "absolute", left: space.lg, right: 108, bottom: space.xl, gap: 2 },
  // 小号胶囊(2026-10-21 34 → 28 → 24 高):和副标题底边对齐，不抢标题
  bannerCta: { position: "absolute", right: space.lg, bottom: space.xl, height: 24, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.white, justifyContent: "center" },
  bannerCtaText: { ...type.caption1, fontWeight: "600", color: "#16161d" },
  bannerLabel: { ...type.footnote, fontWeight: "500", color: "rgba(255,255,255,0.85)", marginBottom: 2 },
  bannerTitle: { ...type.title2, color: colors.white },
  bannerSub: { ...type.subhead, color: "rgba(255,255,255,0.85)" },
  // 翻页条挪到 CTA 下方
  pager: { position: "absolute", right: space.lg, bottom: space.sm + 2, flexDirection: "row", gap: space.xs },
  pagerLine: { width: 16, height: 2, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.4)" },
  pagerLineOn: { backgroundColor: colors.white },
  credits: { position: "absolute", right: space.lg },
  emptyFeed: { paddingVertical: space.xxl, alignItems: "center" },
  emptyText: { ...type.subhead, color: colors.sub },
  masonry: { flexDirection: "row", gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.lg },
  // 名字压在图里后卡片之间不用再留文字的空，收紧到 8
  col: { flex: 1, gap: space.sm },
  card: { gap: space.sm },
  cardImg: { width: "100%", borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped, ...smoothCorners },
  cardScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "40%" },
  cardMeta: { position: "absolute", left: 10, right: 10, bottom: 12 },
  cardTitle: { ...type.caption1, fontWeight: "600", color: colors.white, textAlign: "center", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 4 },
});
