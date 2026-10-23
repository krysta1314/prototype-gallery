import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import { pressScale } from "../components/motion";
import { VOICES, VOICE_BARS, type Voice } from "../data";
import { useStore } from "../provider";
import { colors, ctaGradient, fill, radius, selectedBox, smoothCorners, space, type } from "../theme";

type Filter = "gender" | "language" | "style";
const FILTER_OPTIONS: Record<Filter, string[]> = {
  gender: ["Female", "Male"],
  language: ["English", "Spanish", "Chinese"],
  style: ["Social Media", "Professional", "Narrative", "ASMR", "Upbeat"],
};
const FILTER_LABEL: Record<Filter, string> = { gender: "Gender", language: "Language", style: "Style" };

/**
 * 选音色(2026-10-23,照网页版 Select or add a voice):Audio 模式输入框里点 Voice 打开。
 * 顶部标题 + 一句说明 + Clone voice;Preset voice / My voice 两个 tab;Preset 下面 Gender / Language / Style 筛选，
 * 两列音色卡(头像、性别 · 风格、名字、试听键 + 波形),点卡片选中(品牌色选中框)并关面板。
 * My voice:虚线「Clone voice」格 + 克隆的音色(和预设一样有试听键 + 波形);Clone voice 打开 iOS「文件」选 MP3,克隆中显示 Cloning…
 */
export default function VoiceSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<"preset" | "mine">("preset");
  const [filters, setFilters] = useState<Partial<Record<Filter, string>>>({});
  const [openFilter, setOpenFilter] = useState<Filter | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const selected = state.prefs.audio.voice;
  const list = VOICES.filter((v) => (!filters.gender || v.gender === filters.gender) && (!filters.language || v.language === filters.language) && (!filters.style || v.style === filters.style));
  const pick = (id: string) => {
    dispatch({ type: "setPrefs", patch: { audio: { voice: id } } });
    onClose();
  };

  // 试听 3 秒后自动停
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(null), 3000);
    return () => clearTimeout(t);
  }, [playing]);

  // 克隆音色：打开 iOS「文件」选一段录音(MP3 / M4A / WAV),选好后在 My voice 里显示 Cloning…(2026-10-23,上传文件不需要麦克风权限)
  const clone = () => {
    setTab("mine");
    dispatch({ type: "openFilesPicker", purpose: "voice" });
  };

  return (
    <Sheet onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          Select or add a voice
        </Text>
        <Text style={styles.sub}>Pick a preset or clone your own voice.</Text>
        <Pressable onPress={clone} accessibilityRole="button" style={({ pressed }) => [styles.cloneBtn, pressScale(pressed)]}>
          <Gradient colors={ctaGradient} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Text style={styles.cloneText}>Clone voice</Text>
          <Icon name="wand-sparkles" size={14} color={colors.white} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.tabs} accessibilityRole="tablist">
          {(
            [
              ["preset", "Preset voice"],
              ["mine", "My voice"],
            ] as const
          ).map(([id, label]) => {
            const on = tab === id;
            return (
              <Pressable key={id} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
                {on ? <View style={styles.tabBar} /> : null}
              </Pressable>
            );
          })}
        </View>

        {tab === "preset" ? (
          <>
            {/* 筛选：三个胶囊，点开在下面展开选项;再点一次已选项 = 取消 */}
            <View style={styles.filters}>
              {(Object.keys(FILTER_OPTIONS) as Filter[]).map((f) => {
                const on = !!filters[f] || openFilter === f;
                return (
                  <Pressable key={f} onPress={() => setOpenFilter((o) => (o === f ? null : f))} accessibilityRole="button" accessibilityState={{ expanded: openFilter === f }} style={[styles.filter, on && selectedBox]}>
                    <Text style={styles.filterText} numberOfLines={1}>
                      {filters[f] ?? FILTER_LABEL[f]}
                    </Text>
                    <Icon name="chevron-down" size={13} color={colors.sub} strokeWidth={2.2} />
                  </Pressable>
                );
              })}
            </View>
            {openFilter ? (
              <View style={styles.options}>
                {FILTER_OPTIONS[openFilter].map((o) => {
                  const on = filters[openFilter] === o;
                  return (
                    <Pressable
                      key={o}
                      onPress={() => {
                        setFilters((x) => ({ ...x, [openFilter]: on ? undefined : o }));
                        setOpenFilter(null);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={[styles.option, on && selectedBox]}
                    >
                      <Text style={styles.optionText}>{o}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            {list.length === 0 ? (
              <Text style={styles.empty}>No voices match these filters.</Text>
            ) : (
              <View style={styles.grid}>
                {list.map((v) => (
                  <VoiceCard key={v.id} v={v} on={selected === v.id} playing={playing === v.id} onPlay={() => setPlaying((p) => (p === v.id ? null : v.id))} onPick={() => pick(v.id)} />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.grid}>
            <Pressable onPress={clone} accessibilityRole="button" style={({ pressed }) => [styles.card, styles.addCard, pressScale(pressed)]}>
              <View style={styles.addIcon}>
                <Icon name="plus" size={18} color={colors.ink} />
              </View>
              <Text style={styles.addText}>Clone voice</Text>
            </Pressable>
            {state.myVoices.map((v) => (
              <Pressable
                key={v.id}
                disabled={v.status === "cloning"}
                onPress={() => pick(v.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected === v.id, disabled: v.status === "cloning" }}
                style={({ pressed }) => [styles.card, selected === v.id && selectedBox, pressScale(pressed)]}
              >
                <Text style={styles.name} numberOfLines={1}>
                  {v.name}
                </Text>
                {v.status === "cloning" ? (
                  <View style={styles.cloning}>
                    <Icon name="loader" size={14} color={colors.accent} strokeWidth={2.4} />
                    <Text style={styles.meta}>Cloning…</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.meta}>Your voice</Text>
                    <Preview playing={playing === v.id} onPlay={() => setPlaying((p) => (p === v.id ? null : v.id))} />
                  </>
                )}
              </Pressable>
            ))}
            {state.myVoices.length === 0 ? <Text style={styles.emptyMine}>No cloned voices yet.</Text> : null}
          </View>
        )}
      </View>
    </Sheet>
  );
}

function VoiceCard({ v, on, playing, onPlay, onPick }: { v: Voice; on: boolean; playing: boolean; onPlay: () => void; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${v.name}, ${v.gender}, ${v.style}`} style={({ pressed }) => [styles.card, on && selectedBox, pressScale(pressed)]}>
      <View style={[styles.avatar, { backgroundColor: v.tint }]}>
        <Text style={styles.avatarText}>{v.name[0]}</Text>
      </View>
      <Text style={styles.meta}>{`${v.gender} · ${v.style}`}</Text>
      <Text style={styles.name}>{v.name}</Text>
      <Preview playing={playing} onPlay={onPlay} />
    </Pressable>
  );
}

/** 试听键 + 波形(预设音色和自己克隆的音色共用) */
function Preview({ playing, onPlay }: { playing: boolean; onPlay: () => void }) {
  return (
    <View style={styles.preview}>
      <Pressable onPress={onPlay} hitSlop={8} accessibilityRole="button" accessibilityLabel={playing ? "Stop preview" : "Play preview"} style={[styles.play, playing && styles.playOn]}>
        <Icon name={playing ? "square" : "play"} size={11} color={playing ? colors.white : colors.ink} fill={playing ? colors.white : colors.ink} strokeWidth={2} />
      </Pressable>
      <View style={styles.wave}>
        {VOICE_BARS.map((h, i) => (
          <View key={i} style={[styles.bar, { height: `${h * 100}%` }, playing && styles.barOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { minHeight: 600, paddingBottom: space.md },
  title: { ...type.title3, fontWeight: "700", color: colors.ink, marginTop: space.xs },
  sub: { ...type.footnote, color: colors.sub, marginTop: 4 },
  cloneBtn: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: space.lg, marginTop: space.md, borderRadius: radius.full, overflow: "hidden" },
  cloneText: { ...type.footnote, fontWeight: "700", color: colors.white },
  tabs: { flexDirection: "row", gap: space.xl, marginTop: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  tab: { paddingVertical: 10 },
  tabText: { ...type.subhead, fontWeight: "500", color: colors.sub },
  tabTextOn: { color: colors.ink, fontWeight: "700" },
  tabBar: { position: "absolute", left: 0, right: 0, bottom: -1, height: 2, borderRadius: radius.xs, backgroundColor: colors.accent },
  filters: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  filter: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, height: 34, paddingHorizontal: space.md, borderRadius: radius.full, backgroundColor: fill.base, borderWidth: 1, borderColor: "transparent" },
  filterText: { ...type.caption1, fontWeight: "600", color: colors.ink, flexShrink: 1 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: space.sm },
  option: { height: 30, paddingHorizontal: space.md, borderRadius: radius.full, backgroundColor: fill.base, borderWidth: 1, borderColor: "transparent", justifyContent: "center" },
  optionText: { ...type.caption1, fontWeight: "600", color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  card: { width: "48.6%", padding: space.md, gap: 4, borderRadius: radius.lg, backgroundColor: colors.grouped, borderWidth: 1, borderColor: "transparent", ...smoothCorners } as object,
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4, ...smoothCorners },
  avatarText: { ...type.subhead, fontWeight: "800", color: colors.white },
  meta: { ...type.caption1, color: colors.sub },
  name: { ...type.subhead, fontWeight: "700", color: colors.ink },
  preview: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: 6 },
  play: { width: 26, height: 26, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: fill.strong, paddingLeft: 1 },
  playOn: { backgroundColor: colors.accent, paddingLeft: 0 },
  wave: { flex: 1, height: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bar: { width: 2, borderRadius: 1, backgroundColor: colors.faint },
  barOn: { backgroundColor: colors.accent },
  addCard: { alignItems: "center", justifyContent: "center", minHeight: 96, borderStyle: "dashed", borderColor: colors.faint, backgroundColor: "transparent" },
  addIcon: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,94,26,0.16)" },
  addText: { ...type.footnote, fontWeight: "600", color: colors.ink, marginTop: 4 },
  cloning: { flexDirection: "row", alignItems: "center", gap: 6 },
  empty: { ...type.footnote, color: colors.sub, textAlign: "center", marginTop: space.xl },
  emptyMine: { width: "100%", ...type.footnote, color: colors.sub, textAlign: "center", marginTop: space.xl },
});
