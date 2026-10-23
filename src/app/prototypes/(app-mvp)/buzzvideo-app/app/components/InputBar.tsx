import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import { MODES, MODE_COST, VOICES, modelLabel } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { isSubscribed, uploadProgress } from "../store";
import { colors, elevation, fill, radius, selectedBox, space, type, smoothCorners } from "../theme";
import AttachmentThumb from "./AttachmentThumb";
import Coin from "./Coin";
import Icon from "./Icon";
import { pressScale } from "./motion";

// 网页端去掉 textarea 的 focus 外框;原生端没有这个属性,忽略即可
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/** 占位符轮播：每 4 秒换一个例子，告诉用户「可以这样写」,比一句泛泛的 Describe your idea 更具体 */
const HINTS = ["A 15s ad for my iced latte", "Product shots of my candle on marble", "A voiceover for my bakery's weekend sale"];

/**
 * 输入框(2026-10-22 三版对比后定 A,原来的胶囊按钮太像通用 AI 聊天框):
 * 大圆角卡片;模式 / 模型与设置是两个不带底色的文字按钮，并排;
 * + 是灰底实心圆;发送键没内容时是灰的，有内容才亮成品牌渐变;占位符每 4 秒换一个具体例子
 */
export default function InputBar({ focused = false }: { focused?: boolean }) {
  const { state, dispatch } = useStore();
  const { nav, navigate } = useNav();
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

  const send = () => dispatch({ type: "submitPrompt", id: nextId("j"), now: Date.now() });
  /*
   * 键盘与面板(2026-10-23):打字时点 + / Agent / Auto → 先收起键盘再弹面板;面板关掉后自动把键盘弹回来(回到用户原来的输入状态)。
   * 点按钮那一下输入框已经失焦，所以看「刚刚是不是在打字」(失焦 400ms 内)
   */
  const inputRef = useRef<{ focus: () => void; blur: () => void } | null>(null);
  const typingRef = useRef(false);
  const blurAt = useRef(0);
  const wasTyping = () => typingRef.current || Date.now() - blurAt.current < 400;
  const refocusAfterSheet = useRef(false);
  const openSheet = (name: "attach" | "mode" | "model" | "voice") => {
    refocusAfterSheet.current = wasTyping();
    inputRef.current?.blur();
    navigate({ type: "sheet", sheet: { name } });
  };
  useEffect(() => {
    if (nav.sheet || !refocusAfterSheet.current) return;
    refocusAfterSheet.current = false;
    // 面板退场动画播完再弹键盘;如果面板里跳去了别的页面(相机、付费墙)就不弹
    const t = setTimeout(() => {
      if (nav.stack.length === 0 && !state.paywallRequest) inputRef.current?.focus();
    }, 260);
    return () => clearTimeout(t);
  }, [nav.sheet, nav.stack.length, state.paywallRequest]);
  // 不弹面板的按钮(Web Explore):点完键盘保持弹起
  const keepKeyboard = () => {
    if (wasTyping()) setTimeout(() => inputRef.current?.focus(), 0);
  };
  const pressSent = useRef(false);
  const sendFromPress = () => {
    const typing = wasTyping();
    pressSent.current = true;
    setTimeout(() => (pressSent.current = false), 600);
    send();
    if (typing) setTimeout(() => inputRef.current?.focus(), 0);
  };
  const openAttach = () => openSheet("attach");
  const openMode = () => openSheet("mode");
  const openModel = () => openSheet("model");
  // 模型与设置：单独模式显示模型名;Agent 模式两套偏好都是智能匹配时写 Auto
  // Agent / Hybrid Reel 自己挑模型，积分按实际做出来的东西算
  const auto = c.mode === "agent" || c.mode === "hybrid";
  const voiceId = state.prefs.audio.voice;
  const voiceName = VOICES.find((v) => v.id === voiceId)?.name ?? state.myVoices.find((v) => v.id === voiceId)?.name ?? "Voice";
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
      ref={inputRef as never}
      onFocus={() => (typingRef.current = true)}
      onBlur={() => {
        typingRef.current = false;
        blurAt.current = Date.now();
      }}
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
      // 按下那一刻就发(2026-10-23):等到松手时输入框已失焦、键盘收起、按钮跟着掉下去，点击会落空;发完把焦点还给输入框，键盘保持弹起
      onPressIn={sendFromPress}
      onPress={() => {
        if (!pressSent.current) sendFromPress();
        pressSent.current = false;
      }}
      hitSlop={4}
      accessibilityLabel="Send"
      accessibilityState={{ disabled: !canSend || offline }}
      accessibilityHint={showSendCost ? `${cost} credits` : undefined}
      style={({ pressed }) => [styles.send, { minWidth: size, height: size }, canSend && !offline && styles.sendOn, showSendCost && styles.sendWide, (!canSend || offline) && styles.sendOff, pressScale(pressed)]}
    >
      {/* 写了内容：发送键变宽，里面是预估积分 + 箭头(Agent 按实际做出来的算，前面加 ~) */}
      {showSendCost ? (
        <View style={styles.sendCost}>
          <Coin size={13} />
          <Text style={styles.sendCostText}>{cost}</Text>
        </View>
      ) : null}
      <Icon name="arrow-up" size={18} color={canSend && !offline ? colors.onInverse : colors.faint} strokeWidth={2.4} />
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
  // 一般只在输入态出现(收起键盘后不留，否则会压住工具条);Video / Hybrid Reel 模式例外，见下
  // Video 模式下引导带直接说清「视频要订阅」,键盘收起时也挂在输入框上(2026-10-23,取代原来输入框上方那行灰字)
  const videoMode = c.mode === "video";
  const showCost = (focused || videoMode) && !offline && free;
  const cost = MODE_COST[c.mode] * c.batch;
  // 发送键上的积分:Image / Video / Audio 生成一次扣多少是确定的，写在键上;Agent / Hybrid Reel 按实际做出来的扣，不显示(2026-10-23)
  const showSendCost = canSend && !offline && !auto;
  return (
    <View style={[styles.outer, focused && styles.outerFocused]}>
      {showCost ? (
        <Pressable
          onPress={() => dispatch({ type: "openPaywall", trigger: videoMode ? "video_locked" : "manual" })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.band, focused && styles.bandFocused, pressed && styles.dim]}
        >
          <Icon name="sparkles" size={12} color={colors.ink} />
          <Text style={styles.bandText} numberOfLines={1}>
            {videoMode ? "Video is included with paid plans" : "Make video ads and HD with a plan"}
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
        {textBtn(settingsLabel, openModel, `Model and settings: ${settingsLabel}`)}
        {/* Audio:选音色(预设 / 自己克隆的),按钮上显示当前音色名 */}
        {c.mode === "audio" ? (
          <Pressable onPress={() => openSheet("voice")} accessibilityRole="button" accessibilityLabel={`Voice: ${voiceName}`} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} style={({ pressed }) => [styles.textBtn, pressed && styles.dim]}>
            <Icon name="audio-lines" size={14} color={colors.ink} strokeWidth={2} />
            <Text style={styles.textBtnLabel} numberOfLines={1}>
              {voiceName}
            </Text>
            <Icon name="chevron-down" size={13} color={colors.sub} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        {/* Agent / Hybrid Reel:Web Explore(先上网查同类在投广告、热门玩法再出方案)。
            关着只是一个小地球圆按钮;点开展开成品牌色胶囊「地球 Web Explore ×」,点 × 关掉(不弹 toast,展开的胶囊本身就是反馈) */}
        {c.mode === "agent" ? (
          state.prefs.web ? (
            <Pressable
              onPress={() => {
                dispatch({ type: "setPrefs", patch: { web: false } });
                keepKeyboard();
              }}
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
                keepKeyboard();
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
  // 能发送时是白底深字(2026-10-23,原来橙色渐变上的橙色积分图标看不见);带积分时变宽
  sendOn: { backgroundColor: colors.inverse },
  sendWide: { flexDirection: "row", gap: 6, paddingLeft: 10, paddingRight: 8 },
  sendCost: { flexDirection: "row", alignItems: "center", gap: 3 },
  sendCostText: { ...type.footnote, fontWeight: "700", color: colors.onInverse, fontVariant: ["tabular-nums"] },
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
});
