import { useEffect, useRef } from "react";
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import AttachmentThumb from "../components/AttachmentThumb";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import InputBar from "../components/InputBar";
import JobCard from "../components/JobCard";
import CreditsPill from "../components/CreditsPill";
import PickCarousel from "../components/PickCarousel";
import ToolStrip from "../components/ToolStrip";
import NavBar from "../components/NavBar";
import ThinkingSteps from "../components/ThinkingSteps";
import { CREATE_PROMPTS, type Mode } from "../data";
import { THINKING, isPlanning, stepStatuses } from "../generation";
import { nextId } from "../ids";
import { useTabBarSpace } from "../components/TabBar";
import { useNav, useStore } from "../provider";
import { composerFromUseCase, isSubscribed, nextTier, type Job, type Message } from "../store";
import { colors, fill, radius, space, type } from "../theme";
import { pressScale } from "../components/motion";
import { dismissKeyboard, useKeyboard } from "../keyboard";

export default function Create() {
  const { state, dispatch } = useStore();
  const tabSpace = useTabBarSpace();
  const { navigate } = useNav();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sid = state.currentSessionId;
  const messages = sid ? (state.messages[sid] ?? []) : [];
  const session = state.sessions.find((s) => s.id === sid);

  const openRef = useRef(() => {});
  openRef.current = () => navigate({ type: "sheet", sheet: { name: "sessions" } });
  const edge = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx > 40 && Math.abs(g.dx) > Math.abs(g.dy)) openRef.current();
      },
    }),
  ).current;

  // 聊天式自动滚到底:用户停在底部附近时,新内容(思考步骤、分镜、结果卡)出现就跟着滚
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

  // 输入态(空会话里点了输入框、键盘弹起):收起灵感轮播和工具条，只留输入框;右上积分 + ✕ 退出输入态(参照即梦)
  const typing = useKeyboard().open && messages.length === 0;

  return (
    // 输入框放在悬浮 Tab 栏上方
    <View style={[styles.root, { paddingBottom: tabSpace }]}>
      {/* 空状态：左边会话列表，右边积分(没有标题、不需要新建);进了对话才显示标题和新建 */}
      <NavBar
        title={messages.length === 0 ? undefined : (session?.title ?? "New chat")}
        left={typing ? undefined : <IconButton icon="menu" accessibilityLabel="Chats" onPress={() => navigate({ type: "sheet", sheet: { name: "sessions" } })} />}
        right={
          messages.length === 0 ? (
            <View style={[styles.credits, styles.headRight]}>
              <CreditsPill tone="page" />
              {typing ? (
                <Pressable onPress={dismissKeyboard} accessibilityRole="button" accessibilityLabel="Close" hitSlop={6} style={({ pressed }) => [styles.closeBtn, pressScale(pressed)]}>
                  <Icon name="x" size={18} color={colors.ink} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <IconButton icon="square-pen" accessibilityLabel="New chat" onPress={() => dispatch({ type: "selectSession", id: null })} />
          )
        }
      />
      {typing ? (
        <View style={styles.flex} />
      ) : messages.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          onScroll={onScroll}
          scrollEventThrottle={64}
          onContentSizeChange={() => {
            if (atBottom.current) scrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((m, i) => (
            <MessageView key={m.id} m={m} prev={messages[i - 1]} next={messages[i + 1]} />
          ))}
        </ScrollView>
      )}
      <View style={styles.edge} {...edge.panHandlers} />
      {messages.length === 0 && !typing ? <ToolStrip /> : null}
      <VideoPlanHint />
      <InputBar focused={typing} />
    </View>
  );
}

/** Free 用户切到 Video 模式:输入框上方提前说明视频需要订阅,别等写完 prompt 才撞墙(spec §5.2) */
function VideoPlanHint() {
  const { state, dispatch } = useStore();
  if (isSubscribed(state) || state.workspace !== "personal" || state.composer.mode !== "video" && state.composer.mode !== "hybrid") return null;
  return (
    <View style={styles.planHint}>
      <Text style={styles.planHintText}>
        {state.composer.mode === "hybrid" ? "Hybrid Reel" : "Video"} is included with paid plans.
        <Text style={styles.noticeLink} accessibilityRole="link" onPress={() => dispatch({ type: "openPaywall", trigger: "video_locked" })}>
          {" See plans"}
        </Text>
      </Text>
    </View>
  );
}

/** 空状态(2026-10-21 定):一句引导 + 热门玩法高低错落轮播 + 两条一句话提示词;输入框上方是快捷工具条 */
function EmptyState() {
  const { dispatch } = useStore();
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.empty} showsVerticalScrollIndicator={false}>
      <Text style={styles.emptyTitle}>What are we making today?</Text>
      <PickCarousel onPick={(uc) => dispatch({ type: "setComposer", patch: composerFromUseCase(uc, nextId) })} />
      <View style={styles.prompts}>
        {CREATE_PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => dispatch({ type: "setComposer", patch: { mode: "agent", text: p } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.prompt, pressed && styles.promptOn]}
          >
            <Icon name="arrow-down-right" size={16} color={colors.sub} strokeWidth={2} />
            <Text style={styles.promptText} numberOfLines={1}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

type ViewProps = { m: Message; prev?: Message; next?: Message };

function MessageView({ m, prev, next }: ViewProps) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  if (m.role === "user") {
    return (
      <View style={styles.userWrap}>
        {m.attachments.length > 0 ? (
          <View style={styles.userAttachments}>
            {m.attachments.map((a) => (
              <AttachmentThumb key={a.id} a={a} progress={1} size={64} />
            ))}
          </View>
        ) : null}
        {m.text ? (
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{m.text}</Text>
          </View>
        ) : null}
      </View>
    );
  }
  if (m.kind === "plan") {
    // 规划消息后面紧跟它的任务卡:思考步骤按这个任务的 elapsedMs 推进
    const job = next?.role === "agent" && next.kind === "job" ? state.jobs.find((j) => j.id === next.jobId) : undefined;
    return <PlanView text={m.text} pills={m.pills} job={job} />;
  }
  if (m.kind === "job") {
    const job = state.jobs.find((j) => j.id === m.jobId);
    const planned = prev?.role === "agent" && prev.kind === "plan";
    return job ? <JobCard job={job} waitForPlan={planned} /> : null;
  }
  return (
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <Icon name="circle-alert" size={16} color={colors.sub} />
      </View>
      <Text style={styles.noticeText}>
        {m.text}
        {m.cta === "video" ? (
          <Text style={styles.noticeLink} accessibilityRole="link" onPress={() => dispatch({ type: "openPaywall", trigger: "video_locked" })}>
            {" See plans"}
          </Text>
        ) : m.cta === "model" ? (
          <Text style={styles.noticeLink} accessibilityRole="link" onPress={() => dispatch({ type: "openPaywall", trigger: "model_locked", tab: "pro" })}>
            {" See plans"}
          </Text>
        ) : m.cta === "plans" ? (
          <Text style={styles.noticeLink} accessibilityRole="link" onPress={() => dispatch({ type: "openPaywall", trigger: "low_credits" })}>
            {" See plans"}
          </Text>
        ) : m.cta === "upgrade" ? (
          <Text
            style={styles.noticeLink}
            accessibilityRole="link"
            onPress={() => dispatch({ type: "openPaywall", trigger: "parallel_limit", tab: nextTier(state.subscription.plan) })}
          >
            {" See plans"}
          </Text>
        ) : m.cta === "topUp" ? (
          <Text style={styles.noticeLink} accessibilityRole="link" onPress={() => navigate({ type: "sheet", sheet: { name: "topUp" } })}>
            {" Buy credits"}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

function PlanView({ text, pills, job }: { text: string; pills: string[]; job?: Job }) {
  const mode: Mode = job?.mode ?? "agent";
  const planning = job ? isPlanning(job) : false;
  // 任务被删了:思考过程视为已完成
  const statuses = job ? stepStatuses(job) : THINKING[mode].steps.map(() => "done" as const);

  return (
    <View style={styles.agent}>
      <ThinkingSteps mode={mode} statuses={statuses} />
      {planning ? null : (
        <>
          <Text style={styles.agentText}>{text}</Text>
          <Text style={styles.specLine}>{pills.join(" · ")}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  planHint: { paddingHorizontal: space.lg, paddingBottom: space.xs },
  planHintText: { ...type.footnote, color: colors.sub, textAlign: "center" },
  root: { flex: 1 },
  flex: { flex: 1 },
  edge: { position: "absolute", left: 0, top: 60, bottom: 90, width: 24 },
  thread: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.xl },
  empty: { paddingTop: space.sm, paddingBottom: space.lg },
  emptyTitle: { ...type.title2, color: colors.ink, paddingHorizontal: space.lg, marginBottom: space.lg },
  credits: { paddingRight: space.md },
  headRight: { flexDirection: "row", alignItems: "center", gap: space.sm },
  // 和积分胶囊同一套「放在页面上」的底：亮一档实底 + 细亮边
  closeBtn: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  prompts: { paddingHorizontal: space.lg, marginTop: space.md },
  prompt: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 40, borderRadius: radius.md },
  promptOn: { opacity: 0.6 },
  promptText: { flex: 1, ...type.subhead, color: colors.ink },
  userWrap: { alignItems: "flex-end", gap: space.sm },
  userAttachments: { flexDirection: "row", gap: space.sm, flexWrap: "wrap", justifyContent: "flex-end" },
  userBubble: { maxWidth: "82%", paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.lg, borderBottomRightRadius: radius.xs, backgroundColor: colors.userBubble },
  userText: { ...type.body, color: colors.ink },
  agent: { gap: space.md },
  agentText: { ...type.body, color: colors.ink },
  specLine: { ...type.footnote, color: colors.sub },
  notice: { flexDirection: "row", gap: space.sm, alignItems: "flex-start", maxWidth: "92%" },
  noticeIcon: { height: 22, justifyContent: "center" },
  noticeText: { flex: 1, ...type.body, color: colors.ink },
  noticeLink: { fontWeight: "600", textDecorationLine: "underline" },
});
