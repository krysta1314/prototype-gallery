import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import type { IconName } from "../data";
import { nextId } from "../ids";
import { useStore } from "../provider";
import type { PlanItem } from "../store";
import { colors, ctaGradient, fill, radius, smoothCorners, space, type } from "../theme";
import Coin from "./Coin";
import Gradient from "./Gradient";
import Icon from "./Icon";
import TabGlyph from "./TabGlyph";
import { pressScale, prefersReducedMotion } from "./motion";

/** 思考多久(原型里固定 2.4 秒;真实 APP 是 Agent 实际想了多久) */
const THINK_MS = 2400;
const KIND_ICON: Record<PlanItem["kind"], IconName> = { image: "image", video: "clapperboard", audio: "audio-lines" };

type Props = {
  messageId: string;
  text: string;
  items: PlanItem[];
  status: "awaiting" | "confirmed" | "cancelled";
  createdAt?: number;
};

/**
 * Agent 回复(2026-10-23,照网页版 Agent 对话):
 * 刚发出时先是「✦ Thinking…」(星星转 + 文字扫光),想完变成可展开的「✦ Thought for 2s ›」;
 * 下面一段 Agent 的话 + Generation plan 卡：每项一个图标、标题、积分、View prompt(点开看提示词)、参数小标签;
 * 等确认时右上角黄色「Awaiting confirmation」,底部 Cancel / Confirm · N credits;确认后变绿色「Confirmed」+ Generation started
 */
export default function GenerationPlan({ messageId, text, items, status, createdAt }: Props) {
  // 只有刚发出的这一条(2.4 秒内)播 Thinking;打开旧会话、旅程图截图直接是想完的样子
  const fresh = !!createdAt && Date.now() - createdAt < THINK_MS;
  const [thinking, setThinking] = useState(fresh);
  useEffect(() => {
    if (!thinking || !createdAt) return;
    const t = setTimeout(() => setThinking(false), Math.max(0, THINK_MS - (Date.now() - createdAt)));
    return () => clearTimeout(t);
  }, [thinking, createdAt]);

  if (thinking) return <Thinking />;
  return (
    <View style={styles.wrap}>
      <Thought seconds={Math.round(THINK_MS / 1000)} />
      <Text style={[styles.text, status === "cancelled" && styles.dimmed]}>{text}</Text>
      <PlanCard messageId={messageId} items={items} status={status} />
    </View>
  );
}

/** ✦ 星星：思考中边转边缩放 */
function Star({ spinning }: { spinning: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!spinning || prefersReducedMotion()) return;
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1800, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [spinning, a]);
  const { rotate, scale } = useMemo(
    () => ({
      rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
      scale: a.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.62, 1, 0.62, 1] }),
    }),
    [a],
  );
  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
      <TabGlyph name="create" size={14} color={colors.accent} filled />
    </Animated.View>
  );
}

function Thinking() {
  return (
    <View style={styles.thinkRow} accessibilityLiveRegion="polite">
      <Star spinning />
      <Text style={styles.thinkText}>Thinking…</Text>
    </View>
  );
}

/** 想完：一行「Thought for Ns ›」,点开看这次想了哪几步 */
function Thought({ seconds }: { seconds: number }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }} hitSlop={6} style={({ pressed }) => [styles.thinkRow, pressed && styles.dimmed]}>
        <Star spinning={false} />
        <Text style={styles.thinkText}>{`Thought for ${seconds}s`}</Text>
        <View style={open ? styles.rotDown : undefined}>
          <Icon name="chevron-right" size={14} color={colors.sub} strokeWidth={2.2} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.steps}>
          {["Read your brief and product", "Checked what’s working for similar shops", "Split the ad into three shots"].map((t) => (
            <View key={t} style={styles.step}>
              <Icon name="check" size={13} color={colors.sub} strokeWidth={2.4} />
              <Text style={styles.stepText}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PlanCard({ messageId, items, status }: { messageId: string; items: PlanItem[]; status: Props["status"] }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(true);
  const total = items.reduce((n, i) => n + i.cost, 0);
  const badge = status === "awaiting" ? { text: "Awaiting confirmation", bg: "rgba(255,196,0,0.16)", fg: "#ffd66b" } : status === "confirmed" ? { text: "Confirmed", bg: "rgba(60,207,142,0.16)", fg: colors.success } : { text: "Cancelled", bg: fill.base, fg: colors.sub };
  return (
    <View style={[styles.card, status === "cancelled" && styles.dimmed]}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.cardHead}>
        <View style={open ? undefined : styles.rotUp}>
          <Icon name="chevron-down" size={16} color={colors.sub} strokeWidth={2.2} />
        </View>
        <Text style={styles.cardTitle}>Generation plan</Text>
        <View style={styles.flex} />
        <Text style={[styles.badge, { backgroundColor: badge.bg, color: badge.fg }]}>{badge.text}</Text>
        <Text style={styles.count}>{`${items.length} items`}</Text>
      </Pressable>
      {open ? (
        <View style={styles.items}>
          {items.map((it) => (
            <Item key={it.id} it={it} />
          ))}
        </View>
      ) : null}
      {status === "awaiting" ? (
        <View style={styles.foot}>
          <Text style={styles.footText}>
            Run this plan? It uses about <Text style={styles.bold}>{total}</Text> credits.
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={() => dispatch({ type: "cancelPlan", messageId })} accessibilityRole="button" style={({ pressed }) => [styles.cancel, pressScale(pressed)]}>
              <Icon name="x" size={14} color={colors.ink} strokeWidth={2.4} />
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => dispatch({ type: "confirmPlan", messageId, id: nextId("j") })} accessibilityRole="button" style={({ pressed }) => [styles.confirm, pressScale(pressed)]}>
              <Gradient colors={ctaGradient} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />
              <Icon name="play" size={13} color={colors.white} strokeWidth={2.4} />
              <Text style={styles.confirmText}>{`Confirm · ${total} credits`}</Text>
            </Pressable>
          </View>
        </View>
      ) : status === "confirmed" ? (
        <View style={styles.footDone}>
          <Icon name="circle-check" size={14} color={colors.success} strokeWidth={2.2} />
          <Text style={styles.doneText}>Generation started</Text>
        </View>
      ) : null}
    </View>
  );
}

function Item({ it }: { it: PlanItem }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.item}>
      <View style={styles.itemHead}>
        <Icon name={KIND_ICON[it.kind]} size={15} color={colors.sub} strokeWidth={1.9} />
        <Text style={styles.itemTitle} numberOfLines={2}>
          {it.title}
        </Text>
        <View style={styles.cost}>
          <Coin size={12} />
          <Text style={styles.costText}>{it.cost}</Text>
        </View>
      </View>
      <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: show }} hitSlop={6} style={styles.viewPrompt}>
        <View style={show ? styles.rotDown : undefined}>
          <Icon name="chevron-right" size={12} color={colors.sub} strokeWidth={2.4} />
        </View>
        <Text style={styles.viewPromptText}>View prompt</Text>
      </Pressable>
      {show ? <Text style={styles.prompt}>{it.prompt}</Text> : null}
      <View style={styles.params}>
        <Text style={styles.paramText}>{it.params.join("  |  ")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: space.md },
  dimmed: { opacity: 0.5 },
  thinkRow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  thinkText: { ...type.footnote, color: colors.sub },
  rotDown: { transform: [{ rotate: "90deg" }] },
  rotUp: { transform: [{ rotate: "-90deg" }] },
  steps: { marginTop: space.sm, marginLeft: 20, gap: 6 },
  step: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepText: { ...type.footnote, color: colors.sub },
  text: { ...type.body, color: colors.ink },

  card: { borderRadius: radius.lg, backgroundColor: colors.grouped, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge, overflow: "hidden", ...smoothCorners },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: space.md, paddingVertical: space.md },
  cardTitle: { ...type.subhead, fontWeight: "600", color: colors.ink },
  badge: { ...type.caption, lineHeight: 18, paddingHorizontal: 8, borderRadius: radius.full, overflow: "hidden" },
  count: { ...type.caption1, color: colors.sub, marginLeft: 4 },
  items: { gap: space.sm, paddingHorizontal: space.sm, paddingBottom: space.sm },
  item: { padding: space.md, gap: 6, borderRadius: radius.md, backgroundColor: colors.surface, ...smoothCorners },
  itemHead: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  itemTitle: { flex: 1, ...type.footnote, fontWeight: "600", color: colors.ink },
  cost: { flexDirection: "row", alignItems: "center", gap: 3 },
  costText: { ...type.caption1, fontWeight: "600", color: colors.sub, fontVariant: ["tabular-nums"] },
  viewPrompt: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start" },
  viewPromptText: { ...type.caption1, color: colors.sub },
  prompt: { ...type.caption1, color: colors.sub, padding: space.sm, borderRadius: radius.md, backgroundColor: fill.base },
  params: { alignSelf: "flex-start", paddingHorizontal: 8, height: 22, justifyContent: "center", borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  paramText: { ...type.caption, fontWeight: "500", color: colors.sub },
  foot: { gap: space.sm, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  footText: { ...type.footnote, color: colors.sub },
  bold: { fontWeight: "700", color: colors.ink },
  actions: { flexDirection: "row", gap: space.sm },
  cancel: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, height: 40, paddingHorizontal: space.lg, borderRadius: radius.full, backgroundColor: fill.strong },
  cancelText: { ...type.footnote, fontWeight: "600", color: colors.ink },
  confirm: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: radius.full, overflow: "hidden" },
  confirmText: { ...type.footnote, fontWeight: "700", color: colors.white },
  footDone: { flexDirection: "row", alignItems: "center", gap: 6, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  doneText: { ...type.footnote, fontWeight: "600", color: colors.success },
});
