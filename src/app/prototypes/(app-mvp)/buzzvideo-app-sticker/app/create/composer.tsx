/* 贴纸风输入区(第一版 InputBar 的逻辑 + 即梦式的「出镜一排 + 输入框下一排小按钮」):
 * 上面一排圆头像 = 让谁出镜(分身 Twin / 我的宠物 / 朋友),点了就作为参考图带上;
 * 输入框下一排：+ 附件 · 模式 · 画风 · @ 引用旧结果 ·(音频)音色 ·(Agent)Web Explore;右边积分 + 橙色 Generate(没内容时置灰) */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import { GZButton, GZIconButton, GZSticker, gz } from "../../kit/gz";
import { FRIENDS, poster } from "../data";
import { useV2 } from "../store";
import { Coin, Icon, USER, useNav, useStore } from "../v1";
import { MODES, MODE_COST, VOICES, isSubscribed, nextId, uploadProgress, type LocalSheet, type StyleName } from "./shared";

const c = gz.color;
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;
const HINTS = ["Describe your dream video…", "My dog as a movie star on the red carpet", "A 15s ad for my iced latte"];

/**
 * 打字时点这一片的按钮(出镜头像、Generate、Web Explore…)不让输入框失焦：
 * 否则键盘先收起、按钮跟着掉下去，点击落空(第一版 InputBar 用 onPressIn 解决同一个问题)。要弹面板的按钮自己 blur
 */
function useKeepFocus() {
  const ref = useRef<never>(null);
  useEffect(() => {
    const el = ref.current as unknown as HTMLElement | null;
    if (!el) return;
    const keep = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input")) return;
      // 只在正在打字(焦点在输入框)时拦
      const a = document.activeElement;
      if (!(a instanceof HTMLTextAreaElement || a instanceof HTMLInputElement)) return;
      e.preventDefault();
    };
    el.addEventListener("mousedown", keep);
    return () => el.removeEventListener("mousedown", keep);
  }, []);
  return ref;
}

/** 出镜的人 / 宠物;id 以 cast- 开头放进附件，发出去的消息里就能看出谁出镜 */
type Cast = { id: string; name: string; uri: string };
const CAST: Cast[] = [{ id: "pet", name: "My pet", uri: poster("collie") }, ...FRIENDS.map((f) => ({ id: f.id, name: f.name, uri: f.avatar }))];

export function CastRow() {
  const { state, dispatch } = useStore();
  const { s, d } = useV2();
  const att = state.composer.attachments;
  const has = (id: string) => att.some((a) => a.id === `cast-${id}`);
  const toggle = (x: Cast) =>
    has(x.id) ? dispatch({ type: "removeAttachment", id: `cast-${x.id}` }) : dispatch({ type: "addAttachments", items: [{ id: `cast-${x.id}`, uri: x.uri, kind: "photo", label: x.name, uploaded: true }] });
  const twinReady = s.twin === "ready";
  const keep = useKeepFocus();
  return (
    <View ref={keep}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.cast} keyboardShouldPersistTaps="always">
      {/* 第一个永远是分身：没做过 → 去做(做完 +50);做好了 → 和其他人一样点了出镜 */}
      <CastItem
        name={twinReady ? "Me" : "Twin"}
        uri={USER.avatar}
        on={has("me")}
        badge={twinReady ? undefined : <GZSticker label="+50" color="butter" size="s" rotate={6} />}
        onPress={() => (twinReady ? toggle({ id: "me", name: "Me", uri: USER.avatar }) : d({ type: "push", route: { name: "twin" } }))}
      />
      {CAST.map((x) => (
        <CastItem key={x.id} name={x.name} uri={x.uri} on={has(x.id)} onPress={() => toggle(x)} />
      ))}
    </ScrollView>
    </View>
  );
}

function CastItem({ name, uri, on, badge, onPress }: { name: string; uri: string; on: boolean; badge?: ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={on ? `${name}, in the video` : `Put ${name} in the video`} style={({ pressed }) => [styles.castItem, pressed && { transform: [{ scale: 0.94 }] }]}>
      <View style={[styles.castRing, on && { backgroundColor: c.lime }]}>
        <Image source={{ uri }} style={styles.castImg} />
      </View>
      {on ? (
        <View style={styles.castCheck}>
          <Icon name="check" size={11} color={c.ink} strokeWidth={3.6} />
        </View>
      ) : null}
      {badge ? <View style={styles.castBadge}>{badge}</View> : null}
      <Text style={[gz.body.micro, { color: on ? c.lime : c.text2 }]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

export function Composer({ focused, style, onOpen }: { focused: boolean; style: StyleName | null; onOpen: (s: LocalSheet) => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const comp = state.composer;
  const mode = MODES.find((m) => m.id === comp.mode)!;
  const canSend = comp.text.trim().length > 0 || comp.attachments.length > 0;
  const offline = state.faults.offline;
  const auto = comp.mode === "agent" || comp.mode === "hybrid";
  const cost = MODE_COST[comp.mode] * comp.batch;
  const free = state.workspace === "personal" && !isSubscribed(state);
  const videoMode = comp.mode === "video";
  const voiceId = state.prefs.audio.voice;
  const voiceName = VOICES.find((v) => v.id === voiceId)?.name ?? state.myVoices.find((v) => v.id === voiceId)?.name ?? "Voice";
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const inputRef = useRef<{ focus: () => void; blur: () => void } | null>(null);
  const open = (s: LocalSheet) => {
    inputRef.current?.blur();
    onOpen(s);
  };
  const send = () => {
    if (!canSend) return;
    // 选了画风：发送时接在提示词后面(和用户自己写一样进消息)
    if (style) {
      const t = comp.text.trim();
      dispatch({ type: "setComposer", patch: { text: `${t}${t ? ", " : ""}${style.toLowerCase()} style` } });
    }
    dispatch({ type: "submitPrompt", id: nextId("j"), now: Date.now() });
  };

  const attachments = comp.attachments.filter((a) => !a.id.startsWith("cast-"));
  const keep = useKeepFocus();
  return (
    <View ref={keep} style={styles.outer}>
      {/* Free:写东西时(Video 模式一直)挂一条升级提示，点了开付费墙(同第一版) */}
      {free && !offline && (focused || videoMode) ? (
        <Pressable onPress={() => dispatch({ type: "openPaywall", trigger: videoMode ? "video_locked" : "manual" })} accessibilityRole="button" style={({ pressed }) => [styles.band, pressed && { opacity: 0.8 }]}>
          <Icon name="gem" size={13} color={c.ink} strokeWidth={2.6} />
          <Text style={[gz.display.tiny, { color: c.ink, flex: 1 }]} numberOfLines={1}>
            {videoMode ? "Video comes with every paid plan" : "Unlock video and HD with a plan"}
          </Text>
          <Icon name="chevron-right" size={14} color={c.ink} strokeWidth={3} />
        </Pressable>
      ) : null}
      <View style={[styles.card, focused && { borderColor: c.white }]}>
        {attachments.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
            {attachments.map((a) => {
              const p = uploadProgress(state, a.id);
              return (
                <View key={a.id} style={styles.thumb}>
                  {a.kind === "pdf" ? (
                    <View style={[styles.thumbImg, { alignItems: "center", justifyContent: "center", backgroundColor: c.white }]}>
                      <Icon name="file-text" size={18} color={c.ink} />
                    </View>
                  ) : (
                    <Image source={{ uri: a.uri }} style={styles.thumbImg} resizeMode="cover" />
                  )}
                  {p < 1 ? (
                    <View style={[StyleSheet.absoluteFill, styles.thumbProg]}>
                      <Text style={[gz.display.tiny, { color: c.white }]}>{Math.round(p * 100)}%</Text>
                    </View>
                  ) : null}
                  <Pressable onPress={() => dispatch({ type: "removeAttachment", id: a.id })} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove attachment" style={styles.thumbX}>
                    <Icon name="x" size={10} color={c.ink} strokeWidth={3.4} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        ) : null}
        {offline ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityLiveRegion="polite">
            <Icon name="circle-alert" size={14} color={c.text2} />
            <Text style={[gz.body.caption, { color: c.text2 }]}>You’re offline. Your draft is saved.</Text>
          </View>
        ) : null}
        <TextInput
          ref={inputRef as never}
          value={comp.text}
          onChangeText={(text) => dispatch({ type: "setComposer", patch: { text } })}
          placeholder={HINTS[hint]}
          placeholderTextColor={c.text3}
          multiline
          style={[gz.body.body, styles.input, focused && { minHeight: 72 }, noOutline]}
        />
        <View style={styles.row}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="always">
            <GZIconButton icon="plus" size={34} label="Add photos or files" onPress={() => (inputRef.current?.blur(), navigate({ type: "sheet", sheet: { name: "attach" } }))} />
            <Pressable onPress={() => open("mode")} accessibilityRole="button" accessibilityLabel={`Mode: ${mode.label}. Change`} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
              <Icon name={mode.icon} size={14} color={c.white} strokeWidth={2.4} />
              <Text style={[gz.display.tiny, { color: c.white }]}>{mode.short}</Text>
              <Icon name="chevron-down" size={13} color={c.text2} strokeWidth={2.6} />
            </Pressable>
            {comp.mode === "audio" ? (
              <Pressable onPress={() => open("voice")} accessibilityRole="button" accessibilityLabel={`Voice: ${voiceName}`} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
                <Icon name="audio-lines" size={14} color={c.white} strokeWidth={2.4} />
                <Text style={[gz.display.tiny, { color: c.white }]} numberOfLines={1}>
                  {voiceName}
                </Text>
              </Pressable>
            ) : null}
            {style ? (
              <Pressable onPress={() => open("style")} accessibilityRole="button" accessibilityLabel={`Style: ${style}. Change`} style={({ pressed }) => [styles.chip, styles.chipOn, pressed && { opacity: 0.8 }]}>
                <Icon name="wand-sparkles" size={13} color={c.ink} strokeWidth={2.6} />
                <Text style={[gz.display.tiny, { color: c.ink }]}>{style}</Text>
              </Pressable>
            ) : (
              <GZIconButton icon="wand-sparkles" size={34} label="Style" onPress={() => open("style")} />
            )}
            <GZIconButton icon="at-sign" size={34} label="Use a past result" onPress={() => open("ref")} />
            {/* Agent:Web Explore 开关(先上网看同类在投的广告再出方案);开着是青柠胶囊 */}
            {comp.mode === "agent" ? (
              state.prefs.web ? (
                <Pressable onPress={() => dispatch({ type: "setPrefs", patch: { web: false } })} accessibilityRole="switch" accessibilityState={{ checked: true }} accessibilityLabel="Web Explore on. Tap to turn off" style={({ pressed }) => [styles.chip, styles.chipOn, pressed && { opacity: 0.8 }]}>
                  <Icon name="globe" size={13} color={c.ink} strokeWidth={2.6} />
                  <Text style={[gz.display.tiny, { color: c.ink }]}>Web</Text>
                  <Icon name="x" size={11} color={c.ink} strokeWidth={3} />
                </Pressable>
              ) : (
                <GZIconButton icon="globe" size={34} label="Web Explore" onPress={() => dispatch({ type: "setPrefs", patch: { web: true } })} />
              )
            ) : null}
          </ScrollView>
          {/* 单独生成扣多少是确定的，写在 Generate 左边;Agent / Hybrid 按实际做出来的扣，不写 */}
          {!auto && canSend ? (
            <View style={styles.cost} accessibilityLabel={`${cost} credits`}>
              <Coin size={13} />
              <Text style={[gz.display.tiny, { color: c.butter }]}>{cost}</Text>
            </View>
          ) : null}
          <GZButton label="Generate" size="m" block={false} disabled={!canSend || offline} onPress={send} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cast: { gap: 6, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8 },
  castItem: { alignItems: "center", gap: 4, width: 66 },
  castRing: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: c.raised },
  castImg: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: c.black, backgroundColor: c.raised },
  castCheck: { position: "absolute", top: 34, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: c.lime, borderWidth: 2, borderColor: c.black, alignItems: "center", justifyContent: "center" },
  castBadge: { position: "absolute", top: -6, right: -10 },
  outer: { marginHorizontal: 10, marginBottom: 8 },
  band: { flexDirection: "row", alignItems: "center", gap: 6, height: 30, paddingHorizontal: 12, marginHorizontal: 10, marginBottom: -2, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: c.butter },
  card: { borderRadius: 24, backgroundColor: c.surface, paddingTop: 10, paddingHorizontal: 10, paddingBottom: 10, gap: 6, borderWidth: 2, borderColor: c.line },
  input: { minHeight: 42, maxHeight: 120, color: c.white, paddingHorizontal: 6, paddingTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  chips: { gap: 6, alignItems: "center", paddingRight: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingHorizontal: 11, borderRadius: 999, backgroundColor: c.raised },
  chipOn: { backgroundColor: c.lime },
  cost: { flexDirection: "row", alignItems: "center", gap: 3 },
  thumb: { width: 56, height: 56 },
  thumbImg: { width: 56, height: 56, borderRadius: 12 },
  thumbProg: { borderRadius: 12, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  thumbX: { position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
});
