/* 贴纸风 Create 空状态(第一版 EmptyState 的内容):一句引导 + 热门玩法轮播 + 两条一句话提示词 + 工具条。
 * 轮播卡做成白边照片贴纸，一左一右歪着;角上一颗情境贴纸(Trending / New / Top) */

import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GZButton, GZIconButton, GZSticker, gz, type GZColor } from "../../kit/gz";
import { useV2 } from "../store";
import { Icon, MediaVideo, useStore, type IconName } from "../v1";
import { CREATE_PICKS, CREATE_PROMPTS, TOOLS, USE_CASES, ToolIcon, composerFromUseCase, nextId, useStartToolS, type LocalSheet } from "./shared";

const c = gz.color;
const PICKS = CREATE_PICKS.map((p) => ({ ...p, uc: USE_CASES.find((u) => u.id === p.id)! })).filter((p) => p.uc);
const TAG: Record<string, { color: GZColor; icon: IconName }> = { Trending: { color: "orange", icon: "flame" }, New: { color: "lime", icon: "sparkles" }, Top: { color: "butter", icon: "trophy" } };
const CARD_W = 168;
const CARD_H = 224;

/** 「历史在左上菜单」提示条：关掉后本次打开 APP 内不再出现 */
let tipClosed = false;

export function EmptyState({ onOpen }: { onOpen: (s: LocalSheet) => void }) {
  const { dispatch } = useStore();
  const { d } = useV2();
  const startTool = useStartToolS();
  const [active, setActive] = useState(0);
  const [tip, setTip] = useState(!tipClosed);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {tip ? (
        <View style={styles.tip}>
          <Icon name="info" size={16} color={c.ink} strokeWidth={2.6} />
          <Text style={[gz.body.caption, { color: c.ink, flex: 1, fontWeight: "600" }]}>Your past chats live in the menu, top left.</Text>
          <Pressable
            onPress={() => {
              tipClosed = true;
              setTip(false);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tip"
          >
            <Icon name="x" size={16} color={c.ink} strokeWidth={2.8} />
          </Pressable>
        </View>
      ) : null}
      <Text style={[gz.display.hero, styles.title]}>What are we making today?</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 14}
        decelerationRate="fast"
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.carousel}
        scrollEventThrottle={64}
        onScroll={(e) => setActive(Math.max(0, Math.min(PICKS.length - 1, Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 14)))))}
      >
        {PICKS.map((p, i) => {
          const tag = TAG[p.tag];
          return (
            <Pressable
              key={p.id}
              onPress={() => dispatch({ type: "setComposer", patch: composerFromUseCase(p.uc, nextId) })}
              accessibilityRole="button"
              accessibilityLabel={`Try ${p.uc.title}`}
              style={({ pressed }) => [{ width: CARD_W, gap: 10 }, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <View style={[styles.photo, { transform: [{ rotate: `${i % 2 ? 2 : -2}deg` }] }]}>
                <View style={styles.photoInner}>
                  {i === active && p.uc.video ? <MediaVideo uri={p.uc.video} poster={p.uc.cover} muted loop autoPlay style={StyleSheet.absoluteFill} /> : <Image source={{ uri: p.uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                </View>
                <View style={styles.tag}>
                  <GZSticker label={p.tag} color={tag.color} icon={tag.icon} size="s" rotate={i % 2 ? 5 : -5} />
                </View>
              </View>
              <View style={{ paddingHorizontal: 4, gap: 2 }}>
                <Text style={[gz.display.label, { color: c.white }]} numberOfLines={2}>
                  {p.uc.title}
                </Text>
                <Text style={[gz.display.tiny, { color: c.orange }]}>Try it →</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.prompts}>
        {CREATE_PROMPTS.map((p) => (
          <Pressable key={p} onPress={() => dispatch({ type: "setComposer", patch: { mode: "agent", text: p } })} accessibilityRole="button" style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.6 }]}>
            <Icon name="arrow-down-right" size={16} color={c.lime} strokeWidth={2.6} />
            <Text style={[gz.body.body, { color: c.text, flex: 1 }]} numberOfLines={1}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 工具条：左右滑的工具胶囊，右边「全部工具」 */}
      <View style={styles.toolsHead}>
        <Text style={[gz.display.head, { color: c.white, flex: 1 }]}>Quick tools</Text>
        <GZIconButton icon="layout-grid" size={34} label="All tools" onPress={() => onOpen("tools")} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.tools}>
        {TOOLS.map((t) => (
          <Pressable key={t.id} onPress={() => startTool(t)} accessibilityRole="button" style={({ pressed }) => [styles.toolChip, pressed && { opacity: 0.7 }]}>
            <ToolIcon t={t} size={14} color={c.white} />
            <Text style={[gz.display.tiny, { color: c.white }]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 即梦「复刻」:不想写提示词，就去首页挑一条做同款 */}
      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <GZButton label="Or remix a video from Home" icon="sparkles" variant="outline" size="m" onPress={() => d({ type: "tab", tab: "home" })} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tip: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 4, marginBottom: 14, paddingHorizontal: 12, height: 40, borderRadius: 12, backgroundColor: c.sky, borderWidth: gz.cut, borderColor: c.white, transform: [{ rotate: "-1deg" }] },
  title: { color: c.white, paddingHorizontal: 16, marginTop: 4, marginBottom: 18 },
  carousel: { gap: 14, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 },
  photo: { width: CARD_W, height: CARD_H, padding: 3, borderRadius: 18, backgroundColor: c.white, boxShadow: "0 8px 18px rgba(0,0,0,0.4)" } as object,
  photoInner: { flex: 1, borderRadius: 15, overflow: "hidden", backgroundColor: c.raised },
  tag: { position: "absolute", top: -8, left: -6 },
  prompts: { paddingHorizontal: 16, marginTop: 14 },
  prompt: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 42 },
  toolsHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  tools: { gap: 8, paddingHorizontal: 16 },
  toolChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" },
});
