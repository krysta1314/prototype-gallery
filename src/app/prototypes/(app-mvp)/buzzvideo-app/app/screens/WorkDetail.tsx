import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Gradient from "../components/Gradient";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import MediaVideo from "../components/MediaVideo";
import { pressScale } from "../components/motion";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import { type IconName, workspaceName } from "../data";
import { nextId } from "../ids";
import { useInsets, useNav, useStore } from "../provider";
import Watermark from "../components/Watermark";
import { hasWatermark, jobOutputs, jobProgress } from "../store";
import { colors, fill, radius, space, type } from "../theme";

/** 次级圆形图标按钮:压在深色图上,文字说明只放在 accessibilityLabel 里 */
function RoundAction({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.round, disabled && styles.disabled, pressScale(pressed && !disabled)]}
    >
      <Icon name={icon} size={22} color={colors.white} />
    </Pressable>
  );
}

export default function WorkDetail({ id, askWatermark: askOnOpen = false, askTeam: askTeamOnOpen = false }: { id: string; askWatermark?: boolean; askTeam?: boolean }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seek, setSeek] = useState<{ fraction: number; n: number } | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [askWatermark, setAskWatermark] = useState(askOnOpen);
  const [askTeam, setAskTeam] = useState(askTeamOnOpen);
  // 多图 / 多视频：预览区左右滑翻页(2026-10-23)
  const [page, setPage] = useState(0);
  const [pageW, setPageW] = useState(0);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const job = state.jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.gone}>This work was deleted.</Text>
        <PrimaryButton variant="white" size="md" label="Back" onPress={() => navigate({ type: "pop" })} style={styles.backBtn} />
      </View>
    );
  }

  const done = job.status === "done";
  const outputs = done ? jobOutputs(job) : [{ cover: job.cover, video: job.video }];
  const current = outputs[Math.min(page, outputs.length - 1)];
  const playing = done && !!current.video;
  const goTo = (i: number) => {
    pager.current?.scrollTo({ x: i * pageW, animated: true });
    setPage(i);
    setPlayed(0);
    setPaused(false);
  };
  // 下载：有多份就默认全部下载;Free(带水印)先问要不要去水印
  const watermarked = done && hasWatermark(state, job);
  const save = () => dispatch({ type: "workSaved", id: job.id, count: outputs.length });
  const download = () => (watermarked ? setAskWatermark(true) : save());
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = pageW ? Math.round(e.nativeEvent.contentOffset.x / pageW) : 0;
    if (i !== page) {
      setPage(i);
      setPlayed(0);
      setPaused(false);
    }
  };
  const pct = Math.round(jobProgress(job) * 100);

  return (
    <View style={styles.root}>
      {/* 预览区(2026-10-23 改):画面只占上面，和下面的操作区分开，不再被标题、按钮压住 */}
      <View style={styles.preview}>
      {/* 每一份一页，左右滑;只有当前页的视频在播 */}
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        scrollEnabled={done && outputs.length > 1}
        showsHorizontalScrollIndicator={false}
        onLayout={(e: LayoutChangeEvent) => setPageW(e.nativeEvent.layout.width)}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        onScroll={onScrollEnd}
        scrollEventThrottle={64}
        style={StyleSheet.absoluteFill}
      >
        {outputs.map((o, i) => (
          <View key={`${o.cover}-${i}`} style={{ width: pageW || "100%", height: "100%" }}>
            {done && o.video ? (
              // 点画面暂停 / 继续(2026-10-23);暂停时中间显示播放键
              <Pressable onPress={() => setPaused((p) => !p)} accessibilityRole="button" accessibilityLabel={paused ? "Play" : "Pause"} style={StyleSheet.absoluteFill}>
                <MediaVideo
                  uri={o.video}
                  poster={o.cover}
                  muted={muted}
                  paused={i !== page || paused}
                  onProgress={i === page ? setPlayed : undefined}
                  seek={i === page ? seek : undefined}
                  style={StyleSheet.absoluteFill}
                />
                {paused && i === page ? (
                  <View style={styles.pausedWrap} pointerEvents="none">
                    <View style={styles.pausedBtn}>
                      <Icon name="play" size={28} color={colors.white} fill={colors.white} />
                    </View>
                  </View>
                ) : null}
              </Pressable>
            ) : (
              <Image source={{ uri: o.cover }} blurRadius={done ? 0 : 24} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
          </View>
        ))}
      </ScrollView>

      {/* 预览区右下角，让到进度条上面 */}
      {done && job.mode !== "audio" && hasWatermark(state, job) ? <Watermark bottom={playing ? 36 : 16} /> : null}

      {done && job.mode === "audio" ? (
        <View style={styles.audio}>
          <Icon name="audio-lines" size={20} color={colors.white} />
          <Text style={styles.audioText}>0:30 · Voiceover + music</Text>
        </View>
      ) : null}

      {!done ? (
        <View style={[StyleSheet.absoluteFill, job.status === "failed" ? styles.dimFailed : styles.dim, styles.center]}>
          <View style={styles.stateBox}>
            {job.status === "running" ? (
              <>
                <Text style={styles.stateTitle}>Rendering · {pct}%</Text>
                <ProgressBar value={pct / 100} height={2} tone="onImage" />
                <Text style={styles.stateSub}>You can leave. We’ll notify you when it’s ready.</Text>
              </>
            ) : (
              <>
                <Icon name="circle-alert" size={24} color={colors.white} />
                <Text style={styles.stateTitle}>Couldn’t render this one</Text>
                <Text style={styles.stateSub}>No credits charged.</Text>
                <PrimaryButton variant="white" size="md" label="Retry" onPress={() => dispatch({ type: "retryJob", id: job.id })} style={styles.retry} />
              </>
            )}
          </View>
        </View>
      ) : null}

      {/* 顶部压图:状态栏遮罩 + 返回 / 静音 / 更多 */}
      <Gradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]} style={styles.topScrim} pointerEvents="none" />
      <View style={[styles.top, { paddingTop: insets.top }]}>
        <IconButton tone="onImage" icon="chevron-left" accessibilityLabel="Back" onPress={() => navigate({ type: "pop" })} />
        <View style={styles.topRight}>
          {playing ? (
            <IconButton
              tone="onImage"
              icon={muted ? "volume-x" : "volume-2"}
              accessibilityLabel={muted ? "Turn sound on" : "Mute"}
              onPress={() => setMuted((m) => !m)}
            />
          ) : null}
          <IconButton tone="onImage" icon="ellipsis" accessibilityLabel="More" onPress={() => setMenuOpen((o) => !o)} />
        </View>
      </View>

      {/* 多份时：顶部中间「1 / 3」,底部一排小圆点(点圆点也能翻页) */}
      {done && outputs.length > 1 ? (
        <>
          <View style={[styles.counter, { top: insets.top + 10 }]} pointerEvents="none">
            <Text style={styles.counterText}>{`${page + 1} / ${outputs.length}`}</Text>
          </View>
          <View style={[styles.dots, { bottom: playing ? 40 : 16 }]}>
            {outputs.map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Show ${i + 1} of ${outputs.length}`} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
        </>
      ) : null}

      {/* 进度条贴在预览区底边 */}
      {playing ? (
        <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.45)"]} style={styles.scrubWrap}>
          <Scrubber value={played} onSeek={(fraction) => { setPlayed(fraction); setSeek((p) => ({ fraction, n: (p?.n ?? 0) + 1 })); }} />
        </Gradient>
      ) : null}
      </View>

      {/* 操作区：标题 + 分享 / 回到对话两个圆键 + 主按钮 Download */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + space.sm }]}>
        <Text style={styles.title} numberOfLines={2}>
          {job.title}
        </Text>
        <View style={styles.actions}>
          <RoundAction
            icon="share"
            label="Share"
            disabled={!done}
            // 只打开分享面板;选了渠道、分享完成后才算分享成功(评分弹窗在那之后,spec §6.1)
            onPress={() => navigate({ type: "sheet", sheet: { name: "share", workId: job.id } })}
          />
          <RoundAction
            icon="message-square"
            label="Edit in chat"
            onPress={() => {
              dispatch({ type: "selectSession", id: job.sessionId });
              navigate({ type: "tab", tab: "create" });
            }}
          />
          <PrimaryButton
            label={outputs.length > 1 ? `Download all (${outputs.length})` : "Download"}
            icon="download"
            // 没完成时不给渐变:这屏的主动作是 Retry / 等待,别让一个灰掉的橙色块抢眼
            variant={done ? "cta" : "onImage"}
            disabled={!done}
            // 保存到相册(多份就全部存);第一次先弹系统照片授权;Free 先问去不去水印
            onPress={download}
            style={styles.share}
          />
        </View>
      </View>

      {askWatermark ? (
        <WatermarkAsk
          count={outputs.length}
          cover={current.cover}
          onUpgrade={() => {
            setAskWatermark(false);
            dispatch({ type: "openPaywall", trigger: "watermark", tab: "starter" });
          }}
          onKeep={() => {
            setAskWatermark(false);
            save();
          }}
          onClose={() => setAskWatermark(false)}
        />
      ) : null}

      {menuOpen ? <MoreMenu workId={job.id} top={insets.top + 48} onClose={() => setMenuOpen(false)} onShareTeam={() => setAskTeam(true)} /> : null}

      {askTeam ? (
        <TeamPublishAsk
          org={workspaceName(state.workspace)}
          onPublish={() => {
            setAskTeam(false);
            dispatch({ type: "shareToTeam", id: job.id });
          }}
          onClose={() => setAskTeam(false)}
        />
      ) : null}
    </View>
  );
}

/**
 * 进度条(2026-10-23):细轨道 + 白色拖柄，点任意位置跳过去，按住拖动;拖的时候轨道和拖柄变粗一点。
 * 拖动中先只动条，松手再跳视频(真实 APP 用 AVPlayer seek)
 */
function Scrubber({ value, onSeek }: { value: number; onSeek: (fraction: number) => void }) {
  const [w, setW] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const left = useRef(0);
  const ref = useRef<ComponentRef<typeof View>>(null);
  const at = (pageX: number) => (w ? Math.min(1, Math.max(0, (pageX - left.current) / w)) : 0);
  const shown = drag ?? value;
  return (
    <View
      ref={ref}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e: GestureResponderEvent) => {
        const x = e.nativeEvent.pageX;
        ref.current?.measure((_x, _y, _w, _h, px) => {
          left.current = px;
          setDrag(at(x));
        });
      }}
      onResponderMove={(e) => setDrag(at(e.nativeEvent.pageX))}
      onResponderRelease={() => {
        if (drag !== null) onSeek(drag);
        setDrag(null);
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Playback position"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      style={styles.scrub}
    >
      <View style={[styles.track, drag !== null && styles.trackActive]}>
        <View style={[styles.trackFill, { width: `${shown * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.knob, drag !== null && styles.knobActive, { left: shown * w - (drag !== null ? 8 : 6) }]} />
    </View>
  );
}

/**
 * Free 用户点 Download:先问要不要去水印(2026-10-23)。
 * Remove watermark → 付费墙(trigger = watermark,Starter tab);Download with watermark → 照常存(带水印);点外面 = 取消，不下载
 */
function WatermarkAsk({ count, cover, onUpgrade, onKeep, onClose }: { count: number; cover: string; onUpgrade: () => void; onKeep: () => void; onClose: () => void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.askScrim]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cancel" />
      <View style={styles.askCard} accessibilityRole="alert">
        {/* 前后对比：左边带水印(现在),右边干净(订阅后);用这条成片自己的画面 */}
        <View style={styles.compare} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.compareCol}>
            <View style={styles.askThumb}>
              <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <Watermark size="sm" bottom={6} />
            </View>
            <Text style={styles.compareLabel}>Free</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.faint} strokeWidth={2.4} />
          <View style={styles.compareCol}>
            <View style={[styles.askThumb, styles.askThumbClean]}>
              <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </View>
            <Text style={[styles.compareLabel, styles.compareLabelOn]}>No watermark</Text>
          </View>
        </View>
        <Text style={styles.askTitle}>Remove the watermark?</Text>
        <Text style={styles.askText}>Free downloads include the BuzzVideo watermark. Get a plan to save clean, ready-to-post versions.</Text>
        <PrimaryButton label="Remove watermark" onPress={onUpgrade} style={styles.askBtn} />
        <Pressable onPress={onKeep} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.askKeep, pressed && styles.disabled]}>
          <Text style={styles.askKeepText}>{count > 1 ? `Download ${count} with watermark` : "Download with watermark"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * 发布到团队前确认(2026-10-23,和网页版一致):图标 + 标题 + 一段说明 + Cancel / Publish to team。
 * 发布后组织里所有人能看、能下载;作品仍在 My Assets,只有自己能停止共享
 */
function TeamPublishAsk({ org, onPublish, onClose }: { org: string; onPublish: () => void; onClose: () => void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.askScrim]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cancel" />
      <View style={styles.askCard} accessibilityRole="alert">
        <View style={styles.teamHead}>
          <Icon name="users" size={18} color={colors.accent} strokeWidth={2.2} />
          <Text style={styles.teamTitle}>Publish this asset to the team?</Text>
        </View>
        <Text style={styles.askText}>{`Everyone in ${org} will be able to view and download it. It stays in My Assets, and only you can stop sharing.`}</Text>
        <View style={styles.teamBtns}>
          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.teamCancel, pressed && styles.disabled]}>
            <Text style={styles.askKeepText}>Cancel</Text>
          </Pressable>
          <PrimaryButton label="Publish to team" size="md" onPress={onPublish} style={styles.flex1} />
        </View>
      </View>
    </View>
  );
}

/** 「…」悬浮小菜单：从右上角按钮下面弹出(从右上角轻微放大),点外面收起 */
function MoreMenu({ workId, top, onClose, onShareTeam }: { workId: string; top: number; onClose: () => void; onShareTeam: () => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [anim]);
  const scale = useMemo(() => anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }), [anim]);
  const fav = state.favorites.includes(workId);
  const job = state.jobs.find((j) => j.id === workId);
  const orgWork = state.workspace !== "personal" && job?.status === "done";
  const shared = state.sharedToTeam.includes(workId);
  const items: { icon: IconName; label: string; danger?: boolean; onPress: () => void }[] = [
    { icon: "rotate-ccw", label: "Regenerate", onPress: () => dispatch({ type: "regenerateJob", id: workId, newId: nextId("j") }) },
    { icon: "heart", label: fav ? "Remove from favorites" : "Add to favorites", onPress: () => dispatch({ type: "toggleFavorite", id: workId }) },
    { icon: "file-text", label: "View prompt", onPress: () => navigate({ type: "sheet", sheet: { name: "prompt", workId } }) },
  ];
  // 组织空间的成片：发布到团队(先确认)/ 已发布的可以停止共享
  if (orgWork) {
    items.push(
      shared
        ? { icon: "users", label: "Stop sharing", onPress: () => dispatch({ type: "stopSharing", id: workId }) }
        : { icon: "users", label: "Share to team", onPress: onShareTeam },
    );
  }
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      <Animated.View style={[styles.menu, { top, transform: [{ scale }] }]} accessibilityRole="menu">
        {items.map((m, i) => (
          <Pressable
            key={m.label}
            onPress={() => {
              onClose();
              m.onPress();
            }}
            accessibilityRole="menuitem"
            style={({ pressed }) => [styles.menuItem, i === items.length - 1 && styles.menuItemLast, pressed && styles.menuPressed]}
          >
            <Text style={[styles.menuText, m.danger && styles.menuDanger]}>{m.label}</Text>
            <Icon name={m.icon} size={18} color={m.danger ? colors.danger : colors.ink} />
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}

const ROUND = 52;

const styles = StyleSheet.create({
  pausedWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  pausedBtn: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", paddingLeft: 4 },
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  gone: { ...type.body, color: colors.white, marginBottom: space.lg },
  backBtn: { width: 160 },
  dim: { backgroundColor: "rgba(0,0,0,0.45)" },
  dimFailed: { backgroundColor: "rgba(15,15,19,0.72)" },
  stateBox: { width: "78%", gap: space.md, alignItems: "center" },
  stateTitle: { ...type.headline, color: colors.white, textAlign: "center", fontVariant: ["tabular-nums"] },
  stateSub: { ...type.footnote, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  retry: { marginTop: space.xs, minWidth: 120 },
  audio: {
    position: "absolute",
    alignSelf: "center",
    top: "46%",
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.md,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.onImage,
  },
  audioText: { ...type.footnote, fontWeight: "600", color: colors.white },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0, height: 120 },
  top: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: space.xs },
  topRight: { flexDirection: "row" },
  teamHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  teamTitle: { ...type.headline, color: colors.ink, flexShrink: 1 },
  teamBtns: { flexDirection: "row", gap: space.sm, alignSelf: "stretch", marginTop: space.md },
  teamCancel: { flex: 1, height: 44, borderRadius: radius.full, backgroundColor: fill.base, alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1 },
  askScrim: { backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", paddingHorizontal: space.xl },
  askCard: { width: "100%", maxWidth: 320, alignItems: "center", gap: space.sm, paddingTop: space.xl, paddingBottom: space.md, paddingHorizontal: space.lg, borderRadius: radius.hero, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.edge },
  compare: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm },
  compareCol: { alignItems: "center", gap: 6 },
  askThumb: { width: 92, height: 122, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.grouped },
  // 订阅后那张：品牌色细框，表示「这是你会拿到的」
  askThumbClean: { borderWidth: 1.5, borderColor: "rgba(255,138,85,0.9)" },
  compareLabel: { ...type.caption1, fontWeight: "600", color: colors.sub },
  compareLabelOn: { color: colors.ink },
  askTitle: { ...type.title3, fontWeight: "700", color: colors.ink, textAlign: "center" },
  askText: { ...type.subhead, color: colors.sub, textAlign: "center" },
  askBtn: { alignSelf: "stretch", marginTop: space.md },
  askKeep: { minHeight: 44, justifyContent: "center" },
  askKeepText: { ...type.subhead, fontWeight: "600", color: colors.ink },
  counter: { position: "absolute", alignSelf: "center", height: 26, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.onImage, justifyContent: "center" },
  counterText: { ...type.caption1, fontWeight: "600", color: colors.white, fontVariant: ["tabular-nums"] },
  dots: { position: "absolute", alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.45)" },
  dotOn: { width: 18, backgroundColor: colors.white },
  preview: { flex: 1, overflow: "hidden", borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, backgroundColor: colors.black },
  scrubWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 24, paddingHorizontal: space.lg },
  panel: { paddingTop: space.lg, paddingHorizontal: space.lg, backgroundColor: colors.bg, gap: space.xs },
  // 进度条：热区 28 高，轨道 3(拖动时 5),拖柄 12(拖动时 16)
  scrub: { height: 28, justifyContent: "center" },
  track: { height: 3, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" },
  trackActive: { height: 5 },
  trackFill: { height: "100%", backgroundColor: colors.white },
  knob: { position: "absolute", top: 8, width: 12, height: 12, borderRadius: radius.full, backgroundColor: colors.white, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" },
  knobActive: { top: 6, width: 16, height: 16 },
  // 悬浮菜单：右上角，iOS 菜单样式(文字左、图标右)
  menu: {
    position: "absolute",
    right: space.md,
    width: 236,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: "rgba(36,36,44,0.96)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.edge,
    boxShadow: "0px 12px 32px rgba(0,0,0,0.5)",
    transformOrigin: "top right",
  } as object,
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, paddingHorizontal: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  menuItemLast: { borderBottomWidth: 0 },
  menuPressed: { backgroundColor: colors.pressedOverlay },
  menuText: { ...type.body, color: colors.ink },
  menuDanger: { color: colors.danger },
  title: { ...type.title2, color: colors.white },
  actions: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.md },
  round: { width: ROUND, height: ROUND, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  share: { flex: 1 },
});
