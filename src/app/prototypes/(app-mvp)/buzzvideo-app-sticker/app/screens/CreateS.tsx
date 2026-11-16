/* 贴纸风 Create Tab:保留第一版的创作流程(同一个第一版 store:输入框 composer、submitPrompt、会话、任务、生成计划),
 * UI 换成贴纸风，并揉进即梦创作页的「出镜一排 + 输入框下一排小按钮」。
 * 流程：空状态(引导 + 热门玩法 + 一句话提示 + 工具)→ 输入(出镜 / 附件 / 模式 / 画风 / @ / 模型设置 / 音色 / Web Explore)
 *  → 发送 → 对话(用户气泡 → 思考 / 计划 → 任务卡 生成中 → 结果)→ 点结果全屏看 → Post 进第二版发布页。
 * 模式 / 模型 / 音色 / 画风 / 引用 / 工具 / 会话面板都是本页本地状态(贴纸风);附件「+」仍用第一版的 iOS 相册面板 */

import { useEffect, useRef, useState } from "react";
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from "react-native";
import { GZButton, GZCredits, GZIconButton, gz } from "../../kit/gz";
import { CastRow, Composer } from "../create/composer";
import { EmptyState } from "../create/empty";
import { OverlayHostProvider, useOverlayHost } from "../create/overlay";
import { MessageView } from "../create/thread";
import { ModeSheet, ModelSheet, RefSheet, SessionsDrawer, StylePicker, ToolsSheet, VoiceSheet } from "../create/sheets";
import { Viewer } from "../create/viewer";
import { MODELS, castOf, dismissKeyboard, isSubscribed, modelLabel, resultClip, type Job, type LocalSheet, type StyleName } from "../create/shared";
import { useCredits, useV2 } from "../store";
import { useInsets, useKeyboard, useNav, useStore } from "../v1";

const c = gz.color;

export default function CreateS() {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  const { s, d } = useV2();
  const insets = useInsets();
  const credits = useCredits();
  const { ref: hostRef, host } = useOverlayHost();
  const [sheet, setSheet] = useState<LocalSheet | null>(null);
  const [style, setStyle] = useState<StyleName | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const sid = state.currentSessionId;
  const messages = sid ? (state.messages[sid] ?? []) : [];
  const session = state.sessions.find((x) => x.id === sid);
  const kbOpen = useKeyboard().open;
  const typing = kbOpen && messages.length === 0;
  const close = () => setSheet(null);

  // 左边缘右滑：打开会话抽屉(同第一版)
  const openRef = useRef(() => {});
  openRef.current = () => setSheet("sessions");
  const edge = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 40 && Math.abs(g.dx) > Math.abs(g.dy)) openRef.current();
      },
    }),
  ).current;

  // 聊天式自动滚到底(用户停在底部附近时)
  const atBottom = useRef(true);
  useEffect(() => {
    atBottom.current = true;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, sid]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    atBottom.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
  };

  // 顶部「模型与设置」胶囊：Auto / 模型名 · 清晰度(参照即梦「标清 · 标准 ▾」)
  const comp = state.composer;
  const p = state.prefs;
  const agent = comp.mode === "agent" || comp.mode === "hybrid";
  const modelName = agent ? (p.video.auto && p.image.auto ? "Auto" : "Custom") : comp.model && MODELS[comp.mode as "image" | "video" | "audio"].some((m) => m.id === comp.model) ? modelLabel(comp.model) : "Model";
  const quality = comp.mode === "image" ? p.image.quality : comp.mode === "audio" ? p.audio.format : p.video.resolution;

  // 积分：Free 点了看套餐，会员点了买积分包(同第一版的积分胶囊)
  const onCredits = () => (isSubscribed(state) ? navigate({ type: "sheet", sheet: { name: "topUp" } }) : dispatch({ type: "openPaywall", trigger: "manual" }));

  // Post:把这条成片交给第二版，建一条已完成的作品，进结果 / 发布页
  const post = (job: Job) => {
    setViewing(null);
    const cast = castOf(messages, job.id);
    const twin = cast === "me" && s.twin === "ready";
    // 分身出镜时第二版按 withTwin 换成分身样片;其余直接用对话里那条片子
    d({ type: "importJob", postId: resultClip(job, twin ? null : cast, false), title: job.title, prompt: job.prompt, withTwin: twin });
  };
  const viewJob = viewing ? state.jobs.find((j) => j.id === viewing) : undefined;

  return (
    <OverlayHostProvider value={host}>
      <View ref={hostRef} style={styles.root}>
        <View style={[styles.top, { paddingTop: insets.top }]}>
          {typing ? (
            <GZIconButton icon="x" label="Close keyboard" onPress={dismissKeyboard} />
          ) : (
            <GZIconButton icon="menu" label="Chats" onPress={() => setSheet("sessions")} />
          )}
          {messages.length > 0 && !typing ? (
            <Text style={[gz.display.label, { color: c.white, flex: 1, marginHorizontal: 8 }]} numberOfLines={1}>
              {session?.title ?? "New chat"}
            </Text>
          ) : (
            <View style={{ flex: 1, flexDirection: "row", paddingHorizontal: 8 }}>
              <GZButton label={`${modelName} · ${quality}`} icon="sliders-horizontal" variant="dark" size="s" onPress={() => setSheet("model")} />
            </View>
          )}
          {messages.length > 0 && !typing ? (
            <>
              <GZIconButton icon="sliders-horizontal" label={`Model and settings: ${modelName} · ${quality}`} onPress={() => setSheet("model")} />
              <GZIconButton icon="square-pen" label="New chat" onPress={() => dispatch({ type: "selectSession", id: null })} />
            </>
          ) : null}
          <Pressable onPress={onCredits} accessibilityRole="button" accessibilityLabel={`${credits} credits. Get more`} hitSlop={4} style={{ marginLeft: 6 }}>
            <GZCredits n={credits} />
          </Pressable>
        </View>

        {typing ? (
          <View style={{ flex: 1 }} />
        ) : messages.length === 0 ? (
          <EmptyState onOpen={setSheet} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.thread}
            onScroll={onScroll}
            scrollEventThrottle={64}
            onContentSizeChange={() => {
              if (atBottom.current) scrollRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {messages.map((m, i) => (
              <MessageView key={m.id} m={m} prev={messages[i - 1]} next={messages[i + 1]} all={messages} onOpen={(j) => setViewing(j.id)} onPost={post} />
            ))}
          </ScrollView>
        )}
        <View style={styles.edge} {...edge.panHandlers} />

        {messages.length === 0 ? <CastRow /> : null}
        <Composer focused={kbOpen} style={style} onOpen={setSheet} />

        {sheet === "mode" ? <ModeSheet onClose={close} /> : null}
        {sheet === "model" ? <ModelSheet onClose={close} /> : null}
        {sheet === "voice" ? <VoiceSheet onClose={close} /> : null}
        {sheet === "style" ? <StylePicker value={style} onChange={setStyle} onClose={close} /> : null}
        {sheet === "ref" ? <RefSheet onClose={close} /> : null}
        {sheet === "tools" ? <ToolsSheet onClose={close} /> : null}
        {sheet === "sessions" ? <SessionsDrawer onClose={close} /> : null}
        {viewJob ? <Viewer job={viewJob} clip={resultClip(viewJob, castOf(messages, viewJob.id), s.twin === "ready")} onClose={() => setViewing(null)} onPost={() => post(viewJob)} /> : null}
      </View>
    </OverlayHostProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.black },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, minHeight: 52, gap: 6 },
  thread: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 22 },
  edge: { position: "absolute", left: 0, top: 100, bottom: 200, width: 20 },
});
