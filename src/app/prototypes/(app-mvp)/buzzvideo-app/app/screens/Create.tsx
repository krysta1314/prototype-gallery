import { useEffect, useRef } from "react";
import {
  Image,
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
import MediaVideo from "../components/MediaVideo";
import NavBar from "../components/NavBar";
import ThinkingSteps from "../components/ThinkingSteps";
import { pressScale } from "../components/motion";
import { USE_CASES, type Mode } from "../data";
import { THINKING, isPlanning, stepStatuses } from "../generation";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { composerFromUseCase, type Job, type Message } from "../store";
import { colors, radius, space, type, smoothCorners } from "../theme";

/** 空状态的两张「从一个点子开始」大卡 */
const IDEAS = ["uc-latte", "uc-bakery"].map((id) => USE_CASES.find((u) => u.id === id)!);

export default function Create() {
  const { state, dispatch } = useStore();
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

  return (
    <View style={styles.root}>
      <NavBar
        title={session?.title ?? "New chat"}
        left={<IconButton icon="menu" accessibilityLabel="Chats" onPress={() => navigate({ type: "sheet", sheet: { name: "sessions" } })} />}
        right={<IconButton icon="square-pen" accessibilityLabel="New chat" onPress={() => dispatch({ type: "selectSession", id: null })} />}
      />
      {messages.length === 0 ? (
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
      <InputBar />
    </View>
  );
}

function EmptyState() {
  const { dispatch } = useStore();
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.empty} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyHead}>
        <Text style={styles.emptyTitle}>Tell us what you’re selling.</Text>
        <Text style={styles.emptySub}>We’ll plan, shoot and cut the ad.</Text>
      </View>
      <Text style={styles.ideasLabel}>Start from an idea</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideas} decelerationRate="fast" snapToInterval={IDEA_W + space.md}>
        {IDEAS.map((uc) => (
          <Pressable
            key={uc.id}
            onPress={() => dispatch({ type: "setComposer", patch: composerFromUseCase(uc, nextId) })}
            accessibilityRole="button"
            accessibilityLabel={`Start from ${uc.title}`}
            style={({ pressed }) => [styles.idea, pressScale(pressed)]}
          >
            <View style={styles.ideaMedia}>
              {uc.video ? (
                <MediaVideo uri={uc.video} poster={uc.cover} muted loop autoPlay style={StyleSheet.absoluteFill} />
              ) : (
                <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
            </View>
            <Text style={styles.ideaTitle}>{uc.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

type ViewProps = { m: Message; prev?: Message; next?: Message };

function MessageView({ m, prev, next }: ViewProps) {
  const { state } = useStore();
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
      <Text style={styles.noticeText}>{m.text}</Text>
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

const IDEA_W = 240;
const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  edge: { position: "absolute", left: 0, top: 60, bottom: 90, width: 24 },
  thread: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.xl },
  empty: { paddingTop: space.xl, paddingBottom: space.lg },
  emptyHead: { paddingHorizontal: space.lg, gap: space.xs },
  emptyTitle: { ...type.title2, color: colors.ink },
  emptySub: { ...type.subhead, color: colors.sub },
  ideasLabel: { ...type.footnote, fontWeight: "600", color: colors.sub, paddingHorizontal: space.lg, marginTop: space.xl, marginBottom: space.sm },
  ideas: { gap: space.md, paddingHorizontal: space.lg },
  idea: { width: IDEA_W, gap: space.xs },
  ideaMedia: { width: IDEA_W, height: 320, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.grouped, marginBottom: space.xs, ...smoothCorners },
  ideaTitle: { ...type.headline, color: colors.ink },
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
});
