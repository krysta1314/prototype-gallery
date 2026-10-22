import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import Coin from "../components/Coin";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import Toggle from "../components/Toggle";
import { pressScale } from "../components/motion";
import { A, MODELS, MODE_COST, type ModelInfo } from "../data";
import { useStore } from "../provider";
import { MEMBER_ONLY, isSubscribed, modelLocked, type Composer, type GenPrefs } from "../store";
import { colors, fill, radius, selectedBox, smoothCorners, space, type } from "../theme";

type Ratio = GenPrefs["video"]["ratio"];
type Duration = GenPrefs["video"]["duration"];
const RATIOS: Composer["ratio"][] = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"];
/** 视频模型支持 4–15 秒(和 buzzvideo.ai 网页版一致) */
const SECONDS: Duration[] = Array.from({ length: 12 }, (_, i) => `${i + 4}s` as Duration);
const BATCH = ["1", "2", "3", "4"] as const;

/**
 * 模型设置(2026-10-22 照 buzzvideo.ai 网页版的生成设置面板做):
 * 左上 Model Settings + ✓;Agent / Hybrid Reel 顶部 Video / Image 胶囊切换;
 * Model 是一个下拉(点开在下面展开模型列表),Agent 模式右边有 Auto 开关(开着时由 Agent 按任务挑模型);
 * 下面每项都是一整条分段选择:Aspect Ratio(带比例小图)/ Resolution / Duration(4–15s 可横滑)/ With Audio(No / Yes)。
 * 所有选中态都是品牌橙选中框(theme.selectedBox)。单独的 Image / Video / Audio 模式没有切换和 Auto,多一项 Outputs
 */
export default function ModelSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const c = state.composer;
  const p = state.prefs;
  const [tab, setTab] = useState<"video" | "image">(c.mode === "image" ? "image" : "video");
  const [open, setOpen] = useState(false);
  const member = isSubscribed(state);
  const setC = (patch: Partial<Composer>) => dispatch({ type: "setComposer", patch });
  const paywall = () => dispatch({ type: "openPaywall", trigger: "model_locked", tab: "pro" });
  // 清晰度(1080p、2K / 4K)是所有付费档都有：付费墙停在 Starter,顶部写清楚是清晰度要付费，不说「模型需要 Pro」
  const qualityPaywall = () => dispatch({ type: "openPaywall", trigger: "quality_locked", tab: "starter" });
  // Hybrid Reel 和 Agent 一样由它自己挑模型：显示 Image / Video 两套偏好
  const agent = c.mode === "agent" || c.mode === "hybrid";
  const kind: "image" | "video" | "audio" = c.mode === "agent" || c.mode === "hybrid" ? tab : c.mode;
  const autoOn = agent && p[tab].auto;
  const models = MODELS[kind];
  // 当前模型：存的偏好如果是这个账号用不了的会员模型(比如 Free 默认的 Seedance 2.5),就落到第一个能用的，不让锁着的模型显示成选中
  const chosen = models.find((m) => m.id === (agent ? p[tab].model : c.model));
  const current = chosen && !modelLocked(state, chosen.id) ? chosen : (models.find((m) => !modelLocked(state, m.id)) ?? models[0]);
  const pickModel = (m: ModelInfo) => {
    if (modelLocked(state, m.id)) return paywall();
    if (agent) dispatch({ type: "setPrefs", patch: { [tab]: { model: m.id } } });
    else setC({ model: m.id });
    setOpen(false);
  };
  const ratio: Ratio = agent ? p[tab].ratio : c.ratio;
  const setRatio = (r: Ratio) => (agent ? dispatch({ type: "setPrefs", patch: { [tab]: { ratio: r } } }) : setC({ ratio: r as Composer["ratio"] }));
  const duration: Duration = !agent && p.video.duration === "auto" ? "10s" : p.video.duration;

  return (
    <Sheet onClose={onClose}>
      {/* 面板高度固定：切 Video / Image、换模式都不跳动(按最高的 Agent · Video 那页定高，内容少时积分说明贴在底部) */}
      <View style={styles.body}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Model Settings
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Done" hitSlop={6} style={({ pressed }) => [styles.done, pressScale(pressed)]}>
          <Icon name="check" size={17} color={colors.onInverse} strokeWidth={2.8} />
        </Pressable>
      </View>

      {agent ? (
        <PillTabs
          value={tab}
          onChange={(t) => {
            setTab(t);
            setOpen(false);
          }}
        />
      ) : null}

      {/* Model:下拉 */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Model</Text>
        {agent ? (
          <View style={styles.auto}>
            <Text style={styles.autoText}>Auto</Text>
            <Toggle
              value={p[tab].auto}
              onValueChange={(auto) => {
                dispatch({ type: "setPrefs", patch: { [tab]: { auto } } });
                if (auto) setOpen(false);
              }}
              accessibilityLabel="Auto-pick model"
            />
          </View>
        ) : null}
      </View>
      <Pressable
        disabled={autoOn}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled: autoOn }}
        style={({ pressed }) => [styles.select, pressed && styles.pressed]}
      >
        {autoOn ? <ModelLogo provider="seed" /> : <ModelLogo provider={current.provider} />}
        <Text style={[styles.selectText, autoOn && styles.dim]} numberOfLines={1}>
          {autoOn ? "Auto · best model for each step" : current.label}
        </Text>
        {!autoOn && current.isNew ? <Text style={styles.newBadge}>New</Text> : null}
        <View style={styles.flex} />
        {autoOn ? null : (
          // 展开时箭头朝上(触发框本身不算选中，不加选中框)
          <View style={open ? styles.flip : undefined}>
            <Icon name="chevron-down" size={18} color={colors.sub} strokeWidth={2} />
          </View>
        )}
      </Pressable>
      {open && !autoOn ? (
        <View style={styles.menu}>
          {models.map((m) => {
            const on = m.id === current.id;
            return (
              <Pressable key={m.id} onPress={() => pickModel(m)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.option, on && selectedBox, pressed && styles.pressed]}>
                <ModelLogo provider={m.provider} size={32} />
                <View style={styles.flex}>
                <View style={styles.optionName}>
                  <Text style={styles.optionLabel}>{m.label}</Text>
                  {m.isNew ? <Text style={styles.newBadge}>New</Text> : null}
                  {modelLocked(state, m.id) ? <Gem /> : null}
                </View>
                <Text style={styles.optionDesc}>{m.desc}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {kind !== "audio" ? (
        <Field label="Aspect Ratio">
          <Seg
            value={ratio}
            options={[...(agent ? [{ id: "auto" as Ratio, label: "Auto" }] : []), ...RATIOS.map((r) => ({ id: r as Ratio, label: r }))]}
            onChange={setRatio}
            scroll
            icon={(r) => (r === "auto" ? <Icon name="wand-sparkles" size={14} color={colors.ink} strokeWidth={2} /> : <RatioMark ratio={r} />)}
          />
        </Field>
      ) : null}

      {kind === "video" ? (
        <>
          <Field label="Resolution">
            <Seg
              value={p.video.resolution}
              options={(["480p", "720p", "1080p"] as const).map((id) => ({ id, label: id, member: MEMBER_ONLY.has(id) }))}
              member={member}
              onLocked={qualityPaywall}
              onChange={(resolution) => dispatch({ type: "setPrefs", patch: { video: { resolution } } })}
            />
          </Field>
          <Field label="Duration">
            <Seg
              value={duration}
              options={[...(agent ? [{ id: "auto" as Duration, label: "Auto" }] : []), ...SECONDS.map((id) => ({ id, label: id }))]}
              onChange={(d) => dispatch({ type: "setPrefs", patch: { video: { duration: d } } })}
              scroll
            />
          </Field>
          {/* 和其他项一样：标题在上，下面一整排两个等宽选项 */}
          <Field label="With Audio">
            <Seg
              value={p.video.audio ? "yes" : "no"}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
              onChange={(v) => dispatch({ type: "setPrefs", patch: { video: { audio: v === "yes" } } })}
            />
          </Field>
        </>
      ) : null}

      {kind === "image" ? (
        <Field label="Resolution">
          <Seg
            value={p.image.quality}
            options={(["1K", "2K", "4K"] as const).map((id) => ({ id, label: id, member: MEMBER_ONLY.has(id) }))}
            member={member}
            onLocked={qualityPaywall}
            onChange={(quality) => dispatch({ type: "setPrefs", patch: { image: { quality } } })}
          />
        </Field>
      ) : null}

      {!agent ? (
        <Field label="Outputs">
          <Seg value={String(c.batch) as (typeof BATCH)[number]} options={BATCH.map((b) => ({ id: b, label: b }))} onChange={(b) => setC({ batch: Number(b) })} />
        </Field>
      ) : null}

      <View style={styles.costRow}>
        <Coin size={14} />
        <Text style={styles.cost}>{agent ? "Credits depend on what the agent makes" : `${MODE_COST[c.mode] * c.batch} credits per request`}</Text>
      </View>
      </View>
    </Sheet>
  );
}

/**
 * 顶部 Video / Image 切换(iOS 分段控件，深色版):灰色胶囊轨道里一颗亮胶囊，切换时滑过去;
 * 亮胶囊带一点阴影和顶部高光，浮在轨道上(和下面的品牌色选项块区分开，不用橙色)
 */
function PillTabs({ value, onChange }: { value: "video" | "image"; onChange: (v: "video" | "image") => void }) {
  const [w, setW] = useState(0);
  const anim = useRef(new Animated.Value(value === "video" ? 0 : 1)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value === "video" ? 0 : 1, stiffness: 260, damping: 28, mass: 1, useNativeDriver: false }).start();
  }, [value, anim]);
  const half = (w - 8) / 2;
  const x = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, half)] }), [anim, half]);
  return (
    <View style={styles.tabs} accessibilityRole="tablist" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w ? <Animated.View style={[styles.tabPill, { width: half, transform: [{ translateX: x }] }]} pointerEvents="none" /> : null}
      {(["video", "image"] as const).map((t) => (
        <Pressable key={t} onPress={() => onChange(t)} accessibilityRole="tab" accessibilityState={{ selected: value === t }} style={styles.tab}>
          <Text style={[styles.tabText, value === t && styles.tabTextOn]}>{t === "video" ? "Video" : "Image"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, styles.fieldLabel]}>{label}</Text>
      {children}
    </View>
  );
}

/** 模型名前面的官方图标(白色圆角小方块里放各家 logo,深色底上黑色的 OpenAI 也看得清) */
const LOGO: Record<ModelInfo["provider"], string> = {
  seed: `${A}/logos/bytedance.svg`,
  google: `${A}/logos/google.svg`,
  nanobanana: `${A}/logos/nanobanana.svg`,
  openai: `${A}/logos/openai.png`,
};
function ModelLogo({ provider, size = 28 }: { provider: ModelInfo["provider"]; size?: number }) {
  const inner = Math.round(size * 0.66);
  return (
    <View style={[styles.logo, { width: size, height: size }]}>
      <Image source={{ uri: LOGO[provider] }} style={{ width: inner, height: inner }} resizeMode="contain" />
    </View>
  );
}

function RatioMark({ ratio }: { ratio: string }) {
  const [w, h] = ratio.split(":").map(Number);
  const s = 18 / Math.max(w, h);
  return <View style={[styles.ratioMark, { width: Math.max(7, w * s), height: Math.max(7, h * s) }]} />;
}

function Gem() {
  return (
    <View style={styles.gem} accessibilityLabel="Members only">
      <Icon name="gem" size={10} color={colors.ctaA} strokeWidth={2.2} />
    </View>
  );
}

type Option<T> = { id: T; label: string; member?: boolean };
/**
 * 一排分开的选项块：没选中灰底，选中品牌色淡底 + 同色细边(selectedBox)。
 * icon = 文字上方的小图(比例);scroll = 选项多时横向滑动(时长);会员项给 Free 用户带钻石标，点了弹付费墙
 */
function Seg<T extends string>({
  value,
  options,
  onChange,
  icon,
  scroll,
  tall,
  member = true,
  onLocked,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  icon?: (id: T) => ReactNode;
  scroll?: boolean;
  tall?: boolean;
  member?: boolean;
  onLocked?: () => void;
}) {
  const items = options.map((o) => {
    const on = o.id === value;
    const locked = !!o.member && !member;
    return (
      <Pressable
        key={o.id}
        onPress={() => (locked ? onLocked?.() : onChange(o.id))}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        style={({ pressed }) => [styles.item, scroll ? styles.itemScroll : styles.itemFlex, icon ? styles.itemIcon : tall ? styles.itemTall : null, on && styles.itemOn, pressed && !on && styles.itemPressed]}
      >
        {icon ? icon(o.id) : null}
        <View style={styles.itemLabelRow}>
          <Text style={[styles.itemText, on && styles.itemTextOn, icon ? styles.itemTextSmall : null]}>{o.label}</Text>
          {locked ? <Gem /> : null}
        </View>
      </Pressable>
    );
  });
  const ref = useRef<ScrollViewInstance>(null);
  const index = options.findIndex((o) => o.id === value);
  useEffect(() => {
    // 打开面板时横滑条直接停在选中项附近，选中的不会藏在屏幕外
    if (!scroll || index < 2) return;
    const step = (icon ? 68 : 58) + space.sm;
    const t = setTimeout(() => ref.current?.scrollTo({ x: (index - 1) * step, animated: false }), 0);
    return () => clearTimeout(t);
    // 只在挂载时定位一次，之后用户自己滑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return scroll ? (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={styles.track} contentContainerStyle={styles.trackScroll}>
      {items}
    </ScrollView>
  ) : (
    <View style={[styles.track, styles.trackRow]}>{items}</View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2, marginBottom: space.md },
  title: { ...type.title3, fontWeight: "700", color: colors.ink },
  done: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.inverse, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
  dim: { color: colors.sub },

  label: { ...type.footnote, fontWeight: "600", color: colors.sub },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.lg, marginBottom: space.sm, minHeight: 32 },
  auto: { flexDirection: "row", alignItems: "center", gap: space.sm },
  autoText: { ...type.footnote, fontWeight: "600", color: colors.ink },
  field: { marginTop: space.lg },
  fieldLabel: { marginBottom: space.sm },

  // 下拉
  select: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: fill.base, borderWidth: 1.5, borderColor: "transparent", ...smoothCorners },
  flip: { transform: [{ rotate: "180deg" }] },
  selectText: { ...type.subhead, fontWeight: "600", color: colors.ink, flexShrink: 1 },
  logo: { borderRadius: 8, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  menu: { marginTop: space.sm, padding: 4, gap: 4, borderRadius: radius.md, backgroundColor: fill.base, ...smoothCorners },
  option: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: "transparent", ...smoothCorners },
  optionName: { flexDirection: "row", alignItems: "center", gap: 6 },
  optionLabel: { ...type.subhead, fontWeight: "600", color: colors.ink },
  optionDesc: { ...type.caption1, color: colors.sub, marginTop: 2 },
  newBadge: { ...type.caption, lineHeight: 16, fontWeight: "800", color: colors.onInverse, backgroundColor: colors.inverse, paddingHorizontal: 6, borderRadius: radius.full, overflow: "hidden" },
  gem: { width: 16, height: 16, borderRadius: radius.full, backgroundColor: "rgba(255,167,60,0.16)", alignItems: "center", justifyContent: "center" },

  tabs: { flexDirection: "row", padding: 4, borderRadius: radius.full, backgroundColor: "rgba(0,0,0,0.28)", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge },
  tabPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.full,
    backgroundColor: "#4a4a55",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.22)",
  },
  tab: { flex: 1, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  tabText: { ...type.subhead, fontWeight: "500", color: colors.sub },
  tabTextOn: { color: colors.white, fontWeight: "600" },

  // 分段
  // 选项是一颗颗分开的块(不放在轨道里):没选中灰底无边，选中品牌色淡底 + 同色细边
  track: {},
  trackRow: { flexDirection: "row", gap: space.sm },
  trackScroll: { gap: space.sm },
  item: { height: 48, borderRadius: radius.control, alignItems: "center", justifyContent: "center", backgroundColor: fill.base, borderWidth: 1, borderColor: "transparent", ...smoothCorners },
  itemFlex: { flex: 1, minWidth: 0 },
  itemScroll: { width: 58 },
  itemTall: { height: 48 },
  itemIcon: { width: 68, height: 68, gap: 6 },
  itemOn: selectedBox,
  itemPressed: { backgroundColor: fill.pressed },
  itemLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  itemText: { ...type.subhead, fontWeight: "500", color: "rgba(244,244,247,0.85)" },
  itemTextOn: { color: colors.ink, fontWeight: "600" },
  itemTextSmall: { ...type.caption1, fontWeight: "600" },
  ratioMark: { borderWidth: 1.5, borderColor: colors.ink, borderRadius: radius.xs },


  body: { minHeight: 640 },
  costRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "auto", paddingTop: space.xl, marginBottom: space.sm },
  cost: { ...type.footnote, color: colors.sub },
});
