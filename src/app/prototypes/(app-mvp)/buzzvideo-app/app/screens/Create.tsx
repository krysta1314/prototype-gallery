import { useEffect, useRef } from "react";
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import AttachmentThumb from "../components/AttachmentThumb";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import InputBar from "../components/InputBar";
import JobCard from "../components/JobCard";
import NavBar from "../components/NavBar";
import { USE_CASES } from "../data";
import { nextId } from "../ids";
import { useNav, useStore } from "../provider";
import { composerFromUseCase, runningCount, type Message } from "../store";
import { colors, elevation, radius, type } from "../theme";

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

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, sid]);

  return (
    <View style={styles.root}>
      <NavBar
        title={session?.title ?? "New chat"}
        left={<IconButton icon="menu" accessibilityLabel="Chats" onPress={() => navigate({ type: "sheet", sheet: { name: "sessions" } })} />}
        right={
          <>
            <IconButton icon="list-checks" accessibilityLabel="Tasks" badge={runningCount(state)} onPress={() => navigate({ type: "tab", tab: "me" })} />
            <IconButton icon="square-pen" accessibilityLabel="New chat" onPress={() => dispatch({ type: "selectSession", id: null })} />
          </>
        }
      />
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.thread}>
          {messages.map((m) => (
            <MessageView key={m.id} m={m} />
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
  const ideas = USE_CASES.slice(0, 3);
  const TILT = ["-8deg", "0deg", "8deg"];
  return (
    <View style={styles.empty}>
      <View style={styles.fan}>
        {ideas.map((uc, i) => (
          <Pressable
            key={uc.id}
            onPress={() => dispatch({ type: "setComposer", patch: composerFromUseCase(uc, nextId) })}
            style={[styles.fanCard, { zIndex: i === 1 ? 2 : 1, transform: [{ rotate: TILT[i] }, { translateY: i === 1 ? -10 : 6 }] }]}
          >
            <Image source={{ uri: uc.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.fanLabel}>
              <Text style={styles.fanLabelText} numberOfLines={1}>
                {uc.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={styles.emptyTitle}>What should we make today?</Text>
      <Text style={styles.emptySub}>Pick an idea above, attach photos, or just describe it.</Text>
    </View>
  );
}

function MessageView({ m }: { m: Message }) {
  const { state, dispatch } = useStore();
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
    return (
      <View style={styles.agent}>
        <Text style={styles.agentText}>{m.text}</Text>
        <View style={styles.pills}>
          {m.pills.map((p) => (
            <Pressable
              key={p}
              onPress={() => dispatch({ type: "setComposer", patch: { text: state.composer.text ? `${state.composer.text} ${p}` : p } })}
              style={styles.planPill}
            >
              <Text style={styles.planPillText}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  if (m.kind === "job") {
    const job = state.jobs.find((j) => j.id === m.jobId);
    return job ? <JobCard job={job} /> : null;
  }
  return (
    <View style={styles.notice}>
      <Icon name="circle-alert" size={16} color={colors.sub} />
      <Text style={styles.noticeText}>{m.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  edge: { position: "absolute", left: 0, top: 60, bottom: 90, width: 24 },
  thread: { padding: 16, gap: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  fan: { flexDirection: "row", justifyContent: "center", marginBottom: 22 },
  fanCard: { width: 108, height: 170, marginHorizontal: -10, borderRadius: radius.lg, overflow: "hidden", borderWidth: 3, borderColor: colors.white, backgroundColor: colors.grouped, boxShadow: elevation.float },
  fanLabel: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 8, backgroundColor: "rgba(26,26,46,0.45)" },
  fanLabelText: { ...type.caption, color: colors.white },
  emptyTitle: { ...type.title2, color: colors.ink, textAlign: "center" },
  emptySub: { ...type.subhead, color: colors.sub, textAlign: "center" },
  userWrap: { alignItems: "flex-end", gap: 6 },
  userAttachments: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  userBubble: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, borderBottomRightRadius: radius.xs, backgroundColor: colors.userBubble },
  userText: { ...type.body, color: colors.ink },
  agent: { gap: 10 },
  agentText: { ...type.body, color: colors.ink },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.grouped },
  planPillText: { ...type.footnote, fontWeight: "500", color: colors.ink },
  notice: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  noticeText: { flex: 1, ...type.body, color: colors.ink },
});
