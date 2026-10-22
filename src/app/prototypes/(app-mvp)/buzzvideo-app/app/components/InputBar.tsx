import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import { MODES, MODE_COST, modelLabel } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { isSubscribed, uploadProgress } from "../store";
import { colors, ctaGradient, elevation, fill, radius, selectedBox, space, type, smoothCorners } from "../theme";
import AttachmentThumb from "./AttachmentThumb";
import Coin from "./Coin";
import Gradient from "./Gradient";
import Icon from "./Icon";
import { pressScale } from "./motion";

// 网页端去掉 textarea 的 focus 外框;原生端没有这个属性,忽略即可
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/** 占位符轮播：每 4 秒换一个例子，告诉用户「可以这样写」,比一句泛泛的 Describe your idea 更具体 */
const HINTS = ["A 15s ad for my iced latte", "Product shots of my candle on marble", "A voiceover for my bakery's weekend sale"];

/**
 * 输入框(2026-10-22 三版对比后定 A,原来的胶囊按钮太像通用 AI 聊天框):
 * 大圆角卡片;模式 / 模型与设置是两个不带底色的文字按钮，中间细线隔开;
 * + 是灰底实心圆;发送键没内容时是灰的，有内容才亮成品牌渐变;占位符每 4 秒换一个具体例子
 */
export default function InputBar({ focused = false }: { focused?: boolean }) {
  // Web Explore 第一次打开时提示一次它是干什么的(真实 APP 存本机)
  const webTold = useRef(false);
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const c = state.composer;
  const mode = MODES.find((m) => m.id === c.mode)!;
  const showModel = c.mode !== "agent" && !!c.model;
  const canSend = c.text.trim().length > 0 || c.attachments.length > 0;
  // 断网：发送键置灰，输入框上方一句提示;草稿照常保留(点发送仍会提示，不会丢)
  const offline = state.faults.offline;
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const send = () => dispatch({ type: "submitPrompt", id: nextId("j") });
  const openAttach = () => navigate({ type: "sheet", sheet: { name: "attach" } });
  const openMode = () => navigate({ type: "sheet", sheet: { name: "mode" } });
  const openModel = () => navigate({ type: "sheet", sheet: { name: "model" } });
  // 模型与设置：单独模式显示模型名;Agent 模式两套偏好都是智能匹配时写 Auto
  // Agent / Hybrid Reel 自己挑模型，积分按实际做出来的东西算
  const auto = c.mode === "agent" || c.mode === "hybrid";
  const settingsLabel = showModel ? modelLabel(c.model!) : state.prefs.video.auto && state.prefs.image.auto ? "Auto" : "Custom";

  const attachments =
    c.attachments.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachments}>
        {c.attachments.map((a) => (
          <AttachmentThumb key={a.id} a={a} progress={uploadProgress(state, a.id)} onRemove={() => dispatch({ type: "removeAttachment", id: a.id })} />
        ))}
      </ScrollView>
    ) : null;
  const offlineRow = offline ? (
    <View style={styles.offline} accessibilityLiveRegion="polite">
      <Icon name="circle-alert" size={14} color={colors.sub} />
      <Text style={styles.offlineText}>You're offline. Your draft is saved.</Text>
    </View>
  ) : null;
  const input = (style: TextStyle | TextStyle[]) => (
    <TextInput
      value={c.text}
      onChangeText={(text) => dispatch({ type: "setComposer", patch: { text } })}
      placeholder={HINTS[hint]}
      placeholderTextColor={colors.faint}
      multiline
      style={[style, noOutline]}
    />
  );

  const sendBtn = (size: number) => (
    <Pressable
      disabled={!canSend}
      onPress={send}
      hitSlop={4}
      accessibilityLabel="Send"
      accessibilityState={{ disabled: !canSend || offline }}
      accessibilityHint={canSend ? `${auto ? "About " : ""}${cost} credits` : undefined}
      style={({ pressed }) => [styles.send, { minWidth: size, height: size }, canSend && !offline && styles.sendWide, (!canSend || offline) && styles.sendOff, pressScale(pressed)]}
    >
      {canSend && !offline ? <Gradient colors={ctaGradient} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
      {/* 写了内容：发送键变宽，里面是预估积分 + 箭头(Agent 按实际做出来的算，前面加 ~) */}
      {canSend && !offline ? (
        <View style={styles.sendCost}>
          <Coin size={13} />
          <Text style={styles.sendCostText}>{`${auto ? "~" : ""}${cost}`}</Text>
        </View>
      ) : null}
      <Icon name="arrow-up" size={18} color={canSend && !offline ? colors.white : colors.faint} strokeWidth={2.4} />
    </Pressable>
  );
  const textBtn = (label: string, onPress: () => void, a11y: string) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} style={({ pressed }) => [styles.textBtn, pressed && styles.dim]}>
      <Text style={styles.textBtnLabel} numberOfLines={1}>
        {label}
      </Text>
      <Icon name="chevron-down" size={13} color={colors.sub} strokeWidth={2.2} />
    </Pressable>
  );

  // 输入框上面那条品牌色提示带(2026-10-22 改):留给 Free 用户的升级引导，点了开付费墙;会员不显示。积分挪到发送键上
  const free = state.workspace === "personal" && !isSubscribed(state);
  const showCost = (focused || canSend) && !offline && free;
  const cost = MODE_COST[c.mode] * (auto ? 1 : c.batch);
  return (
    <View style={[styles.outer, focused && styles.outerFocused]}>
      {showCost ? (
        <Pressable
          onPress={() => dispatch({ type: "openPaywall", trigger: "manual" })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.band, focused && styles.bandFocused, pressed && styles.dim]}
        >
          <Icon name="sparkles" size={12} color={colors.ink} />
          <Text style={styles.bandText} numberOfLines={1}>
            Make video ads and HD with a plan
          </Text>
          <Icon name="chevron-right" size={12} color={colors.ink} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    <View style={[styles.card, focused && styles.cardFocused, showCost && styles.cardWithBand]}>
      {attachments}
      {offlineRow}
      {input(focused ? [styles.input, styles.inputFocused] : styles.input)}
      <View style={styles.row}>
        <Pressable onPress={openAttach} hitSlop={4} accessibilityLabel="Attach" style={({ pressed }) => [styles.plus, pressed && styles.dim]}>
          <Icon name="plus" size={18} color={colors.ink} />
        </Pressable>
        {textBtn(mode.short, openMode, `Mode: ${mode.label}`)}
        <View style={styles.divider} />
        {textBtn(settingsLabel, openModel, `Model and settings: ${settingsLabel}`)}
        {/* Agent / Hybrid Reel:Web Explore(先上网查同类在投广告、热门玩法再出方案)。
            关着只是一个小地球圆按钮;点开展开成品牌色胶囊「地球 Web Explore ×」,点 × 关掉;第一次打开顶部 toast 说明 */}
        {auto ? (
          state.prefs.web ? (
            <Pressable
              onPress={() => dispatch({ type: "setPrefs", patch: { web: false } })}
              accessibilityRole="switch"
              accessibilityState={{ checked: true }}
              accessibilityLabel="Web Explore on. Tap to turn off"
              hitSlop={{ top: 6, bottom: 6 }}
              style={({ pressed }) => [styles.webOn, selectedBox, pressScale(pressed)]}
            >
              <Icon name="globe" size={14} color={colors.ink} strokeWidth={2} />
              <Text style={styles.webText}>Web Explore</Text>
              <Icon name="x" size={12} color={colors.sub} strokeWidth={2.4} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                dispatch({ type: "setPrefs", patch: { web: true } });
                if (!webTold.current) dispatch({ type: "showToast", text: "The agent will look up trending ads before planning" });
                webTold.current = true;
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: false }}
              accessibilityLabel="Web Explore"
              hitSlop={6}
              style={({ pressed }) => [styles.webIcon, pressed && styles.dim]}
            >
              <Icon name="globe" size={17} color={colors.ink} strokeWidth={1.8} />
            </Pressable>
          )
        ) : null}
        <View style={styles.spacer} />
        {sendBtn(34)}
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.55 },
  card: {
    backgroundColor: colors.surface,
    boxShadow: elevation.float,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
    borderRadius: radius.full,
    paddingTop: space.md,
    paddingHorizontal: space.md,
    paddingBottom: 10,
    gap: space.xs,
    ...smoothCorners,
  },
  attachments: { gap: space.sm, paddingHorizontal: space.xs },
  offline: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: space.xs },
  offlineText: { ...type.footnote, color: colors.sub },
  send: { flexShrink: 0, borderRadius: radius.full, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  sendWide: { flexDirection: "row", gap: 6, paddingLeft: 10, paddingRight: 8 },
  sendCost: { flexDirection: "row", alignItems: "center", gap: 3 },
  sendCostText: { ...type.footnote, fontWeight: "700", color: colors.white, fontVariant: ["tabular-nums"] },
  sendOff: { backgroundColor: colors.grouped },
  textBtn: { flexDirection: "row", alignItems: "center", gap: 3, height: 32, paddingHorizontal: 6, flexShrink: 1 },
  textBtnLabel: { ...type.footnote, fontWeight: "600", color: colors.ink, flexShrink: 1 },
  input: { ...type.body, minHeight: 44, maxHeight: 120, color: colors.ink, paddingHorizontal: space.xs },
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  plus: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.raised, marginRight: 4 },
  webIcon: { width: 32, height: 32, marginLeft: 2, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  webOn: { flexDirection: "row", alignItems: "center", gap: 4, height: 30, paddingLeft: 10, paddingRight: 8, marginLeft: 4, borderRadius: radius.full },
  webText: { ...type.caption1, fontWeight: "600", color: colors.ink },
  outer: { marginHorizontal: space.md, marginBottom: space.sm },
  // 积分提示带：在输入框后面露出上半截，输入框压在它下半截上
  band: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 8, paddingBottom: 26, paddingHorizontal: space.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: "rgba(255,94,26,0.16)", marginHorizontal: 6 },
  bandText: { ...type.caption1, color: colors.ink, flexShrink: 1 },
  cardWithBand: { marginTop: -18 },
  // 输入态(参照即梦):输入框和积分带都左右贴边，上面两个大圆角，下面直接接键盘(不留边、不悬浮)
  outerFocused: { marginHorizontal: 0, marginBottom: 0 },
  bandFocused: { marginHorizontal: 0, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingTop: 10, paddingBottom: 34 },
  cardFocused: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0, boxShadow: "none", paddingHorizontal: space.lg, paddingTop: space.lg },
  inputFocused: { minHeight: 110 },
  divider: { width: StyleSheet.hairlineWidth, height: 14, backgroundColor: colors.separator, marginHorizontal: 2 },
});
