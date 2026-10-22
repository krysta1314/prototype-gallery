import { useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from "react-native";
import { CREATE_PICKS, USE_CASES, type CreatePick, type IconName, type UseCase } from "../data";
import { colors, radius, smoothCorners, space, type } from "../theme";
import Gradient from "./Gradient";
import Icon from "./Icon";
import MediaVideo from "./MediaVideo";
import { prefersReducedMotion } from "./motion";

const TAG_ICON: Record<CreatePick["tag"], IconName> = { Trending: "flame", New: "sparkles", Top: "trophy" };
/** 两边的卡缩到 0.82,和中间那张形成高低错落 */
const SIDE_SCALE = 0.82;
const GAP = 10;

const PICKS = CREATE_PICKS.map((p) => ({ ...p, uc: USE_CASES.find((u) => u.id === p.id)! })).filter((p) => p.uc);

/**
 * 创作页空状态的热门玩法轮播(2026-10-21 定，参照即梦创作页):
 * 中间一张放大、视频在播;两边小一号、压暗、各露半张。滑动时边缩放边归位，停下吸附到最近一张。
 * 点中间那张 → onPick(把提示词、模式、参考图填进输入框);点两边的 → 滑到那一张
 */
export default function PickCarousel({ onPick }: { onPick: (uc: UseCase) => void }) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const ref = useRef<ScrollViewInstance>(null);
  const reduce = prefersReducedMotion();

  const cardW = Math.round(width * 0.56);
  const cardH = Math.round(cardW * 1.3);
  // 每张卡占的「槽」:两边缩小后，卡与卡之间刚好留 GAP 的缝
  const slot = Math.round(cardW * ((1 + SIDE_SCALE) / 2) + GAP);
  // 默认第一张贴左边(和标题对齐),右边露出下一张;往后滑的每一张都停在正中间，两边各露半张(2026-10-22)
  const padL = space.lg - (slot - cardW) / 2;
  const padR = (width - slot) / 2;
  const offsets = useMemo(
    () => PICKS.map((_, i) => (i === 0 ? 0 : Math.max(0, padL + i * slot + slot / 2 - width / 2))),
    [padL, slot, width],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x } } }], {
        useNativeDriver: false,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (!slot) return;
          const ox = e.nativeEvent.contentOffset.x;
          let i = 0;
          offsets.forEach((o, k) => {
            if (Math.abs(o - ox) < Math.abs(offsets[i] - ox)) i = k;
          });
          setActive((cur) => (cur === i ? cur : i));
        },
      }),
    [x, slot, offsets],
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: cardH ? cardH + space.sm : 300 }}>
      {width ? (
        <Animated.ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToOffsets={offsets}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingLeft: padL, paddingRight: padR, alignItems: "center" }}
        >
          {PICKS.map((p, i) => (
            <Card
              key={p.id}
              pick={p}
              uc={p.uc}
              i={i}
              x={x}
              slot={slot}
              offsets={offsets}
              w={cardW}
              h={cardH}
              active={i === active}
              reduce={reduce}
              onPress={() => (i === active ? onPick(p.uc) : ref.current?.scrollTo({ x: offsets[i], animated: true }))}
            />
          ))}
        </Animated.ScrollView>
      ) : null}
    </View>
  );
}

type CardProps = {
  pick: CreatePick;
  uc: UseCase;
  i: number;
  x: Animated.Value;
  slot: number;
  offsets: number[];
  w: number;
  h: number;
  active: boolean;
  reduce: boolean;
  onPress: () => void;
};

function Card({ pick, uc, i, x, slot, offsets, w, h, active, reduce, onPress }: CardProps) {
  // 插值节点保持稳定(见 Sheet.tsx 的说明)
  const { scale, dim } = useMemo(() => {
    const at = offsets[i];
    const inputRange = [i > 0 ? offsets[i - 1] : at - slot, at, i < offsets.length - 1 ? offsets[i + 1] : at + slot];
    return {
      scale: x.interpolate({ inputRange, outputRange: [SIDE_SCALE, 1, SIDE_SCALE], extrapolate: "clamp" }),
      dim: x.interpolate({ inputRange, outputRange: [0.45, 0, 0.45], extrapolate: "clamp" }),
    };
  }, [x, i, slot, offsets]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? `Use ${uc.title}` : uc.title}
      style={{ width: slot, alignItems: "center" }}
    >
      <Animated.View style={[styles.card, { width: w, height: h, transform: reduce ? [] : [{ scale }] }]}>
        {active && uc.video ? (
          <MediaVideo uri={uc.video} poster={uc.cover} muted loop autoPlay style={StyleSheet.absoluteFill} />
        ) : (
          <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]} style={styles.scrim} pointerEvents="none" />
        <View style={styles.tag}>
          <Icon name={TAG_ICON[pick.tag]} size={12} color={colors.white} strokeWidth={2} />
          <Text style={styles.tagText}>{pick.tag}</Text>
        </View>
        <View style={styles.foot}>
          <Text style={styles.title} numberOfLines={2}>
            {uc.title}
          </Text>
          {active ? (
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Try it</Text>
              <Icon name="arrow-up-right" size={14} color={colors.onInverse} strokeWidth={2.2} />
            </View>
          ) : null}
        </View>
        {/* 两边的卡压暗，视线落在中间 */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: reduce ? (active ? 0 : 0.45) : dim }]} pointerEvents="none" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge, ...smoothCorners },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "50%" },
  dim: { backgroundColor: colors.bg },
  tag: {
    position: "absolute",
    top: space.sm,
    left: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.onImage,
  },
  tagText: { fontSize: 11, lineHeight: 14, fontWeight: "600", color: colors.white },
  foot: { position: "absolute", left: space.md, right: space.md, bottom: space.md, alignItems: "center", gap: space.sm },
  title: { ...type.subhead, fontWeight: "600", color: colors.white, textAlign: "center" },
  cta: { flexDirection: "row", alignItems: "center", gap: 4, height: 30, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.inverse },
  ctaText: { ...type.footnote, fontWeight: "600", color: colors.onInverse },
});
