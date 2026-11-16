/* 贴纸风 Create 的面板：模式 / 模型与设置 / 音色 / 画风 / 引用旧结果 / 全部工具 / 会话抽屉。
 * 逻辑照搬第一版(sheets/ModeSheet、ModelSheet、VoiceSheet、ToolsSheet、SessionDrawer),只换样式:
 * 选中 = 青柠，会员 / 身份 = 丁香贴纸，积分 = 黄油，主操作只有橙色 */

import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import { GZButton, GZChip, GZIconButton, GZInput, GZSegmented, GZSticker, gz } from "../../kit/gz";
import { Coin, Icon, useNav, useStore, type IconName } from "../v1";
import { BottomSheet, Drawer } from "./overlay";
import {
  MEMBER_ONLY,
  MODELS,
  MODES,
  MODE_COST,
  STYLES,
  TOOLS,
  VOICES,
  VOICE_BARS,
  isEnterprise,
  isSubscribed,
  modelLocked,
  nextId,
  sessionsFor,
  ToolIcon,
  useStartTool,
  clipFor,
  type Composer,
  type GenPrefs,
  type Mode,
  type ModelInfo,
  type StyleName,
} from "./shared";
import { poster } from "../data";

const c = gz.color;
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

function Label({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.labelRow}>
      <Text style={[gz.display.label, { color: c.text2 }]}>{children}</Text>
      {right}
    </View>
  );
}

/** 一排可换行的选项胶囊(选中青柠);member 项给 Free 用户带锁，点了走付费墙 */
function Options<T extends string>({ value, options, onChange, scroll, locked, onLocked }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; scroll?: boolean; locked?: (id: T) => boolean; onLocked?: () => void }) {
  const items = options.map((o) => {
    const lock = locked?.(o.id);
    return (
      <View key={o.id}>
        <GZChip label={o.label} on={value === o.id} color="lime" onPress={() => (lock ? onLocked?.() : onChange(o.id))} />
        {lock ? (
          <View style={styles.lock} pointerEvents="none">
            <Icon name="lock" size={10} color={c.ink} strokeWidth={3} />
          </View>
        ) : null}
      </View>
    );
  });
  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.optRow}>
      {items}
    </ScrollView>
  ) : (
    <View style={[styles.optRow, { flexWrap: "wrap" }]}>{items}</View>
  );
}

/* ============ 模式 ============ */

const BADGE: Partial<Record<Mode, "HOT" | "NEW">> = { agent: "HOT", hybrid: "NEW" };

/** 两列模式卡;选中整张变青柠贴纸(白模切边、歪一点)。Free 点 Video → 付费墙;Hybrid Reel 只给 Enterprise,其他人点了联系销售 */
export function ModeSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const current = state.composer.mode;
  const free = state.workspace === "personal" && !isSubscribed(state) && !isEnterprise(state);
  const entOnly = (m: Mode) => m === "hybrid" && !isEnterprise(state);
  const pick = (m: Mode) => {
    if (free && m === "video") {
      onClose();
      dispatch({ type: "openPaywall", trigger: "video_locked" });
      return;
    }
    if (entOnly(m)) {
      onClose();
      navigate({ type: "sheet", sheet: { name: "contactSales" } });
      return;
    }
    dispatch({ type: "setComposer", patch: { mode: m } });
    onClose();
  };
  return (
    <BottomSheet title="What are we making?" onClose={onClose}>
      <View style={styles.grid}>
        {MODES.map((m) => {
          const on = current === m.id;
          const tag = entOnly(m.id) ? { label: "TEAMS", color: "lilac" as const } : free && m.id === "video" ? { label: "PAID", color: "lilac" as const } : BADGE[m.id] ? { label: BADGE[m.id]!, color: BADGE[m.id] === "HOT" ? ("orange" as const) : ("lime" as const) } : null;
          return (
            <Pressable
              key={m.id}
              onPress={() => pick(m.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.modeCard, on && styles.modeOn, pressed && { transform: [{ scale: 0.97 }, ...(on ? [{ rotate: "-1.5deg" }] : [])] }]}
            >
              <View style={[styles.modeIcon, on && { backgroundColor: c.ink }]}>
                <Icon name={m.icon} size={18} color={on ? c.lime : c.white} strokeWidth={2.2} />
              </View>
              <Text style={[gz.display.head, { color: on ? c.ink : c.white }]} numberOfLines={1}>
                {m.label}
              </Text>
              <Text style={[gz.body.caption, { color: on ? c.ink : c.text3 }]} numberOfLines={2}>
                {m.outcome}
              </Text>
              {tag ? (
                <View style={styles.modeTag}>
                  <GZSticker label={tag.label} color={tag.color} size="s" rotate={4} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/* ============ 模型与设置 ============ */

type Ratio = GenPrefs["video"]["ratio"];
type Duration = GenPrefs["video"]["duration"];
const RATIOS: Composer["ratio"][] = ["1:1", "3:4", "4:3", "9:16", "16:9", "21:9"];
const SECONDS = Array.from({ length: 27 }, (_, i) => `${i + 4}s` as Duration);

/** 和第一版 ModelSheet 一样的字段和规则:Agent / Hybrid 有 Video / Image 切换和 Auto;单独模式多一项 Outputs */
export function ModelSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const comp = state.composer;
  const p = state.prefs;
  const agent = comp.mode === "agent" || comp.mode === "hybrid";
  const [tab, setTab] = useState<"video" | "image">(comp.mode === "image" ? "image" : "video");
  const member = isSubscribed(state);
  const setC = (patch: Partial<Composer>) => dispatch({ type: "setComposer", patch });
  const paywall = () => {
    onClose();
    dispatch({ type: "openPaywall", trigger: "model_locked", tab: "pro" });
  };
  const qualityPaywall = () => {
    onClose();
    dispatch({ type: "openPaywall", trigger: "quality_locked", tab: "starter" });
  };
  const kind: "image" | "video" | "audio" = agent ? tab : (comp.mode as "image" | "video" | "audio");
  const autoOn = agent && p[tab].auto;
  const models = MODELS[kind];
  const chosen = models.find((m) => m.id === (agent ? p[tab].model : comp.model));
  const current = chosen && !modelLocked(state, chosen.id) ? chosen : (models.find((m) => !modelLocked(state, m.id)) ?? models[0]);
  const pickModel = (m: ModelInfo) => {
    if (modelLocked(state, m.id)) return paywall();
    if (agent) dispatch({ type: "setPrefs", patch: { [tab]: { model: m.id } } });
    else setC({ model: m.id });
  };
  const ratio: Ratio = agent ? p[tab].ratio : comp.ratio;
  const setRatio = (r: Ratio) => (agent ? dispatch({ type: "setPrefs", patch: { [tab]: { ratio: r } } }) : setC({ ratio: r as Composer["ratio"] }));
  const duration: Duration = !agent && p.video.duration === "auto" ? "10s" : p.video.duration;
  const lockedQ = (id: string) => !member && MEMBER_ONLY.has(id);
  const setAudio = (patch: Partial<GenPrefs["audio"]>) => dispatch({ type: "setPrefs", patch: { audio: patch } });

  return (
    <BottomSheet title="Model & settings" onClose={onClose}>
      {agent ? <GZSegmented options={["Video", "Image"]} value={tab === "video" ? "Video" : "Image"} onChange={(v) => setTab(v === "Video" ? "video" : "image")} /> : null}

      <View style={styles.field}>
        <Label right={agent ? <GZChip label={autoOn ? "Auto · on" : "Auto · off"} on={autoOn} color="lime" onPress={() => dispatch({ type: "setPrefs", patch: { [tab]: { auto: !p[tab].auto } } })} /> : undefined}>Model</Label>
        {autoOn ? (
          <Text style={[gz.body.caption, { color: c.text3 }]}>The agent picks the best model for each step.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {models.map((m) => {
              const on = m.id === current.id;
              const lock = modelLocked(state, m.id);
              return (
                <Pressable key={m.id} onPress={() => pickModel(m)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.modelRow, on && styles.modelOn, pressed && { opacity: 0.8 }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[gz.display.label, { color: on ? c.ink : c.white }]}>{m.label}</Text>
                      {m.isNew ? <GZSticker label="NEW" color={on ? "white" : "lime"} size="s" rotate={-3} /> : null}
                      {lock ? <GZSticker label="PRO" color="lilac" size="s" rotate={3} /> : null}
                    </View>
                    <Text style={[gz.body.caption, { color: on ? c.ink : c.text3 }]}>{m.desc}</Text>
                  </View>
                  {on ? <Icon name="check" size={18} color={c.ink} strokeWidth={3} /> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {kind !== "audio" ? (
        <View style={styles.field}>
          <Label>Aspect ratio</Label>
          <Options value={ratio} options={[...(agent ? [{ id: "auto" as Ratio, label: "Auto" }] : []), ...RATIOS.map((r) => ({ id: r as Ratio, label: r }))]} onChange={setRatio} scroll />
        </View>
      ) : null}

      {kind === "video" ? (
        <>
          <View style={styles.field}>
            <Label>Resolution</Label>
            <Options value={p.video.resolution} options={(["480p", "720p", "1080p"] as const).map((id) => ({ id, label: id }))} locked={lockedQ} onLocked={qualityPaywall} onChange={(resolution) => dispatch({ type: "setPrefs", patch: { video: { resolution } } })} />
          </View>
          <View style={styles.field}>
            <Label>Duration</Label>
            <Options value={duration} options={[...(agent ? [{ id: "auto" as Duration, label: "Auto" }] : []), ...SECONDS.map((id) => ({ id, label: id }))]} onChange={(d) => dispatch({ type: "setPrefs", patch: { video: { duration: d } } })} scroll />
          </View>
          <View style={styles.field}>
            <Label>Sound</Label>
            <GZSegmented options={["No sound", "With sound"]} value={p.video.audio ? "With sound" : "No sound"} onChange={(v) => dispatch({ type: "setPrefs", patch: { video: { audio: v === "With sound" } } })} />
          </View>
        </>
      ) : null}

      {kind === "image" ? (
        <View style={styles.field}>
          <Label>Resolution</Label>
          <Options value={p.image.quality} options={(["1K", "2K", "4K"] as const).map((id) => ({ id, label: id }))} locked={lockedQ} onLocked={qualityPaywall} onChange={(quality) => dispatch({ type: "setPrefs", patch: { image: { quality } } })} />
        </View>
      ) : null}

      {kind === "audio" ? (
        <>
          <View style={styles.field}>
            <Label>Format</Label>
            <Options value={p.audio.format} options={(["MP3", "WAV"] as const).map((id) => ({ id, label: id }))} onChange={(format) => setAudio({ format })} />
          </View>
          <View style={styles.field}>
            <Label>Sample rate</Label>
            <Options value={p.audio.sampleRate} options={(["16 kHz", "24 kHz", "32 kHz", "44.1 kHz"] as const).map((id) => ({ id, label: id }))} onChange={(sampleRate) => setAudio({ sampleRate })} scroll />
          </View>
          <View style={styles.field}>
            <Label>Speed</Label>
            <Options value={p.audio.speed.toFixed(1)} options={["0.5", "0.8", "1.0", "1.2", "1.5", "2.0"].map((id) => ({ id, label: `${id}x` }))} onChange={(v) => setAudio({ speed: Number(v) })} scroll />
          </View>
          <View style={styles.field}>
            <Label>Volume</Label>
            <Options value={p.audio.volume.toFixed(1)} options={["0.5", "1.0", "1.5", "2.0"].map((id) => ({ id, label: id }))} onChange={(v) => setAudio({ volume: Number(v) })} />
          </View>
          <View style={styles.field}>
            <Label>Pitch</Label>
            <Options value={String(p.audio.pitch)} options={["-6", "-3", "0", "3", "6"].map((id) => ({ id, label: Number(id) > 0 ? `+${id}` : id }))} onChange={(v) => setAudio({ pitch: Number(v) })} />
          </View>
          <View style={styles.field}>
            <Label>Subtitles</Label>
            <GZSegmented options={["Off", "On"]} value={p.audio.subtitle ? "On" : "Off"} onChange={(v) => setAudio({ subtitle: v === "On" })} />
          </View>
        </>
      ) : null}

      {!agent ? (
        <View style={styles.field}>
          <Label>Outputs</Label>
          <GZSegmented options={["1", "2", "3", "4"]} value={String(comp.batch)} onChange={(b) => setC({ batch: Number(b) })} />
        </View>
      ) : null}

      <View style={styles.costRow}>
        <Coin size={15} />
        <Text style={[gz.body.caption, { color: c.text2, flex: 1 }]}>{agent ? "Credits depend on what the agent makes" : `${MODE_COST[comp.mode] * comp.batch} credits per request`}</Text>
      </View>
      <GZButton label="Done" variant="white" onPress={onClose} />
    </BottomSheet>
  );
}

/* ============ 音色 ============ */

const GENDERS = ["All", "Female", "Male"] as const;
const VOICE_STYLES = ["All", "Social Media", "Professional", "Narrative", "ASMR", "Upbeat"] as const;

/** 预设 / 我的音色;筛选是两排胶囊;克隆走第一版的 iOS「文件」选择器 */
export function VoiceSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<"Preset" | "My voices">("Preset");
  const [gender, setGender] = useState<(typeof GENDERS)[number]>("All");
  const [style, setStyle] = useState<(typeof VOICE_STYLES)[number]>("All");
  const [playing, setPlaying] = useState<string | null>(null);
  const selected = state.prefs.audio.voice;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(null), 3000);
    return () => clearTimeout(t);
  }, [playing]);
  const pick = (id: string) => {
    dispatch({ type: "setPrefs", patch: { audio: { voice: id } } });
    onClose();
  };
  const clone = () => {
    onClose();
    dispatch({ type: "openFilesPicker", purpose: "voice" });
  };
  const list = VOICES.filter((v) => (gender === "All" || v.gender === gender) && (style === "All" || v.style === style));
  return (
    <BottomSheet title="Pick a voice" onClose={onClose}>
      <GZSegmented options={["Preset", "My voices"]} value={tab} onChange={(v) => setTab(v as typeof tab)} />
      {tab === "Preset" ? (
        <>
          <View style={{ gap: 8 }}>
            <Options value={gender} options={GENDERS.map((id) => ({ id, label: id }))} onChange={setGender} />
            <Options value={style} options={VOICE_STYLES.map((id) => ({ id, label: id }))} onChange={setStyle} scroll />
          </View>
          {list.length === 0 ? (
            <Text style={[gz.body.caption, { color: c.text3, textAlign: "center" }]}>No voices match. Try another filter.</Text>
          ) : (
            <View style={styles.grid}>
              {list.map((v) => (
                <VoiceCard key={v.id} name={v.name} meta={`${v.gender} · ${v.style}`} tint={v.tint} on={selected === v.id} playing={playing === v.id} onPlay={() => setPlaying((x) => (x === v.id ? null : v.id))} onPick={() => pick(v.id)} />
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          <GZButton label="Clone my voice" icon="mic" variant="dark" size="m" onPress={clone} />
          {state.myVoices.length === 0 ? (
            <Text style={[gz.body.caption, { color: c.text3 }]}>Upload a 10-second clip and your voice shows up here.</Text>
          ) : (
            <View style={styles.grid}>
              {state.myVoices.map((v) =>
                v.status === "cloning" ? (
                  <View key={v.id} style={styles.voiceCard}>
                    <Text style={[gz.display.label, { color: c.white }]}>{v.name}</Text>
                    <GZSticker label="CLONING…" color="sky" size="s" />
                  </View>
                ) : (
                  <VoiceCard key={v.id} name={v.name} meta="Your voice" tint={c.lilac} on={selected === v.id} playing={playing === v.id} onPlay={() => setPlaying((x) => (x === v.id ? null : v.id))} onPick={() => pick(v.id)} />
                ),
              )}
            </View>
          )}
        </>
      )}
    </BottomSheet>
  );
}

function VoiceCard({ name, meta, tint, on, playing, onPlay, onPick }: { name: string; meta: string; tint: string; on: boolean; playing: boolean; onPlay: () => void; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${name}, ${meta}`} style={({ pressed }) => [styles.voiceCard, on && styles.modeOn, pressed && { opacity: 0.85 }]}>
      <View style={[styles.voiceAvatar, { backgroundColor: tint }]}>
        <Text style={[gz.display.head, { color: c.ink }]}>{name[0]}</Text>
      </View>
      <Text style={[gz.display.label, { color: on ? c.ink : c.white }]}>{name}</Text>
      <Text style={[gz.body.micro, { color: on ? c.ink : c.text3, fontWeight: "400" }]}>{meta}</Text>
      <View style={styles.preview}>
        <Pressable onPress={onPlay} hitSlop={8} accessibilityRole="button" accessibilityLabel={playing ? "Stop preview" : "Play preview"} style={[styles.play, { backgroundColor: on ? c.ink : c.white }]}>
          <Icon name={playing ? "pause" : "play"} size={12} color={on ? c.white : c.ink} fill={on ? c.white : c.ink} strokeWidth={2} />
        </Pressable>
        <View style={styles.wave}>
          {VOICE_BARS.map((h, i) => (
            <View key={i} style={[styles.bar, { height: `${h * 100}%`, backgroundColor: playing ? (on ? c.ink : c.lime) : on ? "rgba(0,0,0,0.35)" : c.text3 }]} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/* ============ 画风 ============ */

export function StylePicker({ value, onChange, onClose }: { value: StyleName | null; onChange: (s: StyleName | null) => void; onClose: () => void }) {
  return (
    <BottomSheet title="Pick a style" onClose={onClose}>
      <Text style={[gz.body.caption, { color: c.text3 }]}>We add it to every prompt you send until you switch it off.</Text>
      <View style={[styles.optRow, { flexWrap: "wrap" }]}>
        <GZChip
          label="No style"
          on={!value}
          color="lime"
          onPress={() => {
            onChange(null);
            onClose();
          }}
        />
        {STYLES.map((s) => (
          <GZChip
            key={s}
            label={s}
            on={value === s}
            color="lime"
            onPress={() => {
              onChange(s);
              onClose();
            }}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

/* ============ @ 引用旧结果 ============ */

/** 和第一版结果卡上的「@ Use as reference」一样：把做过的成片当参考素材放进输入框 */
export function RefSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const done = state.jobs.filter((j) => j.workspace === state.workspace && j.status === "done").slice(0, 12);
  return (
    <BottomSheet title="Use a past result" onClose={onClose}>
      {done.length === 0 ? (
        <Text style={[gz.body.caption, { color: c.text3 }]}>Nothing yet. Things you make show up here so you can build on them.</Text>
      ) : (
        <View style={styles.refGrid}>
          {done.map((j) => {
            const uri = poster(clipFor(j));
            return (
              <Pressable
                key={j.id}
                onPress={() => {
                  dispatch({ type: "addAttachments", items: [{ id: nextId("a"), uri, kind: j.video || j.mode !== "image" ? "video" : "photo", label: j.title, uploaded: true }] });
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Use ${j.title}`}
                style={({ pressed }) => [styles.refCell, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={styles.refLabel}>
                  <Text style={[gz.body.micro, { color: c.white }]} numberOfLines={1}>
                    {j.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

/* ============ 全部工具 ============ */

export function ToolsSheet({ onClose }: { onClose: () => void }) {
  const startTool = useStartTool();
  return (
    <BottomSheet title="All tools" onClose={onClose}>
      <View style={styles.grid}>
        {TOOLS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              onClose();
              startTool(t);
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.toolCard, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <View style={styles.modeIcon}>
              <ToolIcon t={t} size={17} color={c.white} />
            </View>
            <Text style={[gz.display.label, { color: c.white }]} numberOfLines={1}>
              {t.label}
            </Text>
            <Text style={[gz.body.caption, { color: c.text3 }]} numberOfLines={2}>
              {t.desc}
            </Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

/* ============ 会话抽屉 ============ */

/** 左边滑出：搜索 + 新对话;一条列表(置顶在前);长按一条出 Rename / Pin / Delete,改名就地改 */
export function SessionsDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const all = sessionsFor(state);
  const list = all.filter((s) => !q.trim() || s.title.toLowerCase().includes(q.trim().toLowerCase()));
  const select = (id: string | null) => {
    dispatch({ type: "selectSession", id });
    onClose();
  };
  const saveRename = () => {
    if (renaming?.title.trim()) dispatch({ type: "renameSession", id: renaming.id, title: renaming.title.trim() });
    setRenaming(null);
  };
  const actions = (id: string, pinned: boolean): { icon: IconName; label: string; danger?: boolean; onPress: () => void }[] => [
    { icon: "pencil", label: "Rename", onPress: () => (setMenuFor(null), setRenaming({ id, title: all.find((x) => x.id === id)?.title ?? "" })) },
    { icon: pinned ? "pin-off" : "pin", label: pinned ? "Unpin" : "Pin", onPress: () => (dispatch({ type: "togglePinSession", id }), setMenuFor(null)) },
    { icon: "trash", label: "Delete", danger: true, onPress: () => (dispatch({ type: "deleteSession", id }), dispatch({ type: "showToast", text: "Chat deleted" }), setMenuFor(null)) },
  ];
  return (
    <Drawer onClose={onClose}>
      <View style={styles.drawerHead}>
        <Text style={[gz.display.title, { color: c.white, flex: 1 }]}>Chats</Text>
        <GZIconButton icon="square-pen" label="New chat" onPress={() => select(null)} />
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <GZInput icon="search" placeholder="Search chats" value={q} onChangeText={setQ} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {list.length === 0 ? <Text style={[gz.body.caption, { color: c.text3, padding: 16 }]}>{q ? "No chats match." : "No chats yet. Make something and it lands here."}</Text> : null}
        {list.map((s) => {
          const on = s.id === state.currentSessionId;
          return (
            <View key={s.id}>
              {renaming?.id === s.id ? (
                <View style={[styles.sessRow, { backgroundColor: c.raised }]}>
                  <TextInput value={renaming.title} onChangeText={(title) => setRenaming({ id: s.id, title })} onSubmitEditing={saveRename} onBlur={saveRename} autoFocus style={[gz.body.body, { flex: 1, color: c.white }, noOutline]} />
                  <GZButton label="Save" variant="white" size="s" onPress={saveRename} />
                </View>
              ) : (
                <Pressable onPress={() => select(s.id)} onLongPress={() => setMenuFor((m) => (m === s.id ? null : s.id))} delayLongPress={350} accessibilityRole="button" accessibilityHint="Long press for more" style={({ pressed }) => [styles.sessRow, on && { backgroundColor: c.surface }, pressed && { opacity: 0.7 }]}>
                  {s.pinned ? <Icon name="pin" size={14} color={c.butter} strokeWidth={2.4} /> : null}
                  <Text style={[on ? gz.body.strong : gz.body.body, { color: c.white, flex: 1 }]} numberOfLines={1}>
                    {s.title}
                  </Text>
                  {on ? <View style={styles.dot} /> : null}
                </Pressable>
              )}
              {menuFor === s.id ? (
                <View style={styles.sessMenu}>
                  {actions(s.id, s.pinned).map((a) => (
                    <Pressable key={a.label} onPress={a.onPress} accessibilityRole="button" style={({ pressed }) => [styles.sessAction, pressed && { opacity: 0.7 }]}>
                      <Icon name={a.icon} size={16} color={a.danger ? c.like : c.white} strokeWidth={2.2} />
                      <Text style={[gz.display.tiny, { color: a.danger ? c.like : c.white }]}>{a.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 22 },
  field: { gap: 10 },
  optRow: { flexDirection: "row", gap: 8 },
  lock: { position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: c.lilac, borderWidth: 2, borderColor: c.surface, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modeCard: { width: "48%", padding: 14, gap: 6, borderRadius: 18, backgroundColor: c.raised, borderWidth: gz.cut, borderColor: "transparent", minHeight: 124 } as object,
  modeOn: { backgroundColor: c.lime, borderColor: c.white, transform: [{ rotate: "-1.5deg" }] },
  modeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 4 },
  modeTag: { position: "absolute", top: 10, right: 10 },
  modelRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, backgroundColor: c.raised, borderWidth: gz.cut, borderColor: "transparent" },
  modelOn: { backgroundColor: c.lime, borderColor: c.white },
  costRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  voiceCard: { width: "48%", padding: 12, gap: 4, borderRadius: 18, backgroundColor: c.raised, borderWidth: gz.cut, borderColor: "transparent" } as object,
  voiceAvatar: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4, borderWidth: 2, borderColor: c.white, transform: [{ rotate: "-4deg" }] },
  preview: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  play: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingLeft: 1 },
  wave: { flex: 1, height: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bar: { width: 2.5, borderRadius: 2 },
  refGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  refCell: { width: "31.5%", aspectRatio: 0.75, borderRadius: 12, overflow: "hidden", backgroundColor: c.raised } as object,
  refLabel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: "rgba(0,0,0,0.6)" },
  toolCard: { width: "48%", padding: 14, gap: 4, borderRadius: 18, backgroundColor: c.raised } as object,
  drawerHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 58, paddingBottom: 14 },
  sessRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingHorizontal: 16, marginHorizontal: 8, borderRadius: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.lime },
  sessMenu: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  sessAction: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.raised },
});
