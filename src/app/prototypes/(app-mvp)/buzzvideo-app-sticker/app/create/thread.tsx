/* 贴纸风 Create 的对话流：用户气泡 → 思考步骤 / 生成计划 → 任务卡(生成中 → 结果)→ 提示。
 * 流程和第一版 screens/Create.tsx 的 MessageView 一模一样(同一个 store、同样的 action),只换样式 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GZButton, GZSticker, gz } from "../../kit/gz";
import { poster, video } from "../data";
import { useV2 } from "../store";
import { Coin, Icon, MediaVideo, useNav, useStore, type IconName } from "../v1";
import { THINKING, MODE_COST, castOf, isPlanning, resultClip, jobProgress, nextId, nextTier, stepStatuses, type Job, type Message, type Mode, type PlanItem } from "./shared";

const c = gz.color;

/** 思考的「呼吸」:只动透明度，不弹 */
function usePulse(on = true) {
  const [a] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!on) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.35, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(a, { toValue: 1, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a, on]);
  return a;
}

export function MessageView({ m, prev, next, all, onOpen, onPost }: { m: Message; prev?: Message; next?: Message; all: Message[]; onOpen: (job: Job) => void; onPost: (job: Job) => void }) {
  const { state, dispatch } = useStore();
  const { navigate } = useNav();
  if (m.role === "user") {
    return (
      <View style={styles.userWrap}>
        {m.attachments.length > 0 ? (
          <View style={styles.userAtt}>
            {m.attachments.map((a, i) => (
              <View key={a.id} style={[styles.userThumb, { transform: [{ rotate: `${i % 2 ? 3 : -3}deg` }] }]}>
                {a.kind === "pdf" ? (
                  <View style={styles.pdf}>
                    <Icon name="file-text" size={18} color={c.ink} />
                  </View>
                ) : (
                  <Image source={{ uri: a.uri }} style={{ width: "100%", height: "100%", borderRadius: 8 }} resizeMode="cover" />
                )}
              </View>
            ))}
          </View>
        ) : null}
        {m.text ? (
          <View style={styles.userBubble}>
            <Text style={[gz.body.body, { color: c.ink }]}>{m.text}</Text>
          </View>
        ) : null}
      </View>
    );
  }
  if (m.kind === "plan") {
    const job = next?.role === "agent" && next.kind === "job" ? state.jobs.find((j) => j.id === next.jobId) : undefined;
    return <PlanView text={m.text} pills={m.pills} job={job} />;
  }
  if (m.kind === "gplan") return <GenPlan messageId={m.id} text={m.text} items={m.items} status={m.status} createdAt={m.createdAt} />;
  if (m.kind === "job") {
    const job = state.jobs.find((j) => j.id === m.jobId);
    const planned = prev?.role === "agent" && prev.kind === "plan";
    return job ? <JobCard job={job} waitForPlan={planned} onOpen={() => onOpen(job)} onPost={() => onPost(job)} cast={castOf(all, job.id)} /> : null;
  }
  // 提示(积分不够、锁定模型、视频要订阅、并发上限):一句话 + 一颗按钮，去处和第一版一样
  const cta =
    m.cta === "video"
      ? { label: "See plans", go: () => dispatch({ type: "openPaywall", trigger: "video_locked" }) }
      : m.cta === "model"
        ? { label: "See plans", go: () => dispatch({ type: "openPaywall", trigger: "model_locked", tab: "pro" }) }
        : m.cta === "plans"
          ? { label: "See plans", go: () => dispatch({ type: "openPaywall", trigger: "low_credits" }) }
          : m.cta === "upgrade"
            ? { label: "See plans", go: () => dispatch({ type: "openPaywall", trigger: "parallel_limit", tab: nextTier(state.subscription.plan) }) }
            : m.cta === "topUp"
              ? { label: "Buy credits", go: () => navigate({ type: "sheet", sheet: { name: "topUp" } }) }
              : null;
  return (
    <View style={styles.notice}>
      <View style={styles.noticeRow}>
        <Icon name="info" size={16} color={c.sky} strokeWidth={2.4} />
        <Text style={[gz.body.body, { color: c.text, flex: 1 }]}>{m.text}</Text>
      </View>
      {cta ? <GZButton label={cta.label} variant="white" size="s" onPress={cta.go} style={{ marginLeft: 24 }} /> : null}
    </View>
  );
}

/* ============ 思考步骤(单独生成 / 旧会话的 plan 消息) ============ */

function PlanView({ text, pills, job }: { text: string; pills: string[]; job?: Job }) {
  const mode: Mode = job?.mode ?? "agent";
  const planning = job ? isPlanning(job) : false;
  const statuses = job ? stepStatuses(job) : THINKING[mode].steps.map(() => "done" as const);
  return (
    <View style={{ gap: 10 }}>
      <Steps mode={mode} statuses={statuses} />
      {planning ? null : (
        <>
          <Text style={[gz.body.body, { color: c.text }]}>{text}</Text>
          <View style={styles.pills}>
            {pills.map((p) => (
              <View key={p} style={styles.pill}>
                <Text style={[gz.body.micro, { color: c.text2 }]}>{p}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

/** 标题一行(可展开看每一步的说明)+ 收起时一排步骤小胶囊：做完 = 青柠勾，正在做 = 橙点呼吸，没开始 = 空心 */
function Steps({ mode, statuses }: { mode: Mode; statuses: ("done" | "active" | "pending" | "failed")[] }) {
  const [open, setOpen] = useState(false);
  const t = THINKING[mode];
  const finished = statuses.every((s) => s === "done");
  const failed = statuses.includes("failed");
  const heading = finished || failed ? t.doneTitle : t.title;
  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }} hitSlop={6} style={styles.stepsHead}>
        <Text style={[gz.display.label, { color: c.text2 }]}>{`${heading} · ${t.steps.length} steps`}</Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <Icon name="chevron-down" size={16} color={c.text2} strokeWidth={2.4} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: 10 }}>
          {t.steps.map((s, i) => (
            <View key={s.label} style={{ flexDirection: "row", gap: 10 }}>
              <Mark status={statuses[i]} />
              <View style={{ flex: 1 }}>
                <Text style={[gz.body.strong, { color: c.white, fontSize: 13, lineHeight: 17 }]}>{s.label}</Text>
                <Text style={[gz.body.caption, { color: c.text3 }]}>{statuses[i] === "failed" ? "Stopped here. Try again below." : s.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : finished || failed ? null : (
        <View style={styles.stepRow}>
          {t.steps.map((s, i) => (
            <View key={s.label} style={[styles.stepChip, statuses[i] === "active" && { borderColor: c.white }]}>
              <Mark status={statuses[i]} />
              <Text style={[gz.display.tiny, { color: statuses[i] === "pending" ? c.text3 : c.white }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Mark({ status }: { status: "done" | "active" | "pending" | "failed" }) {
  const a = usePulse(status === "active");
  if (status === "done")
    return (
      <View style={[styles.mark, { backgroundColor: c.lime }]}>
        <Icon name="check" size={10} color={c.ink} strokeWidth={3.6} />
      </View>
    );
  if (status === "failed") return <Icon name="circle-alert" size={16} color={c.like} strokeWidth={2.4} />;
  if (status === "active") return <Animated.View style={[styles.mark, { backgroundColor: c.orange, opacity: a }]} />;
  return <View style={[styles.mark, { borderWidth: 1.5, borderColor: c.text3 }]} />;
}

/* ============ Agent 生成计划 ============ */

const THINK_MS = 2400;
const KIND_ICON: Record<PlanItem["kind"], IconName> = { image: "image", video: "clapperboard", audio: "audio-lines" };

/** 先「Thinking…」2.4 秒，再出一段话 + 计划卡;等确认时 Cancel / Confirm · N(确认才扣积分) */
function GenPlan({ messageId, text, items, status, createdAt }: { messageId: string; text: string; items: PlanItem[]; status: "awaiting" | "confirmed" | "cancelled"; createdAt?: number }) {
  const fresh = !!createdAt && Date.now() - createdAt < THINK_MS;
  const [thinking, setThinking] = useState(fresh);
  const [thoughtOpen, setThoughtOpen] = useState(false);
  const pulse = usePulse(thinking);
  useEffect(() => {
    if (!thinking || !createdAt) return;
    const t = setTimeout(() => setThinking(false), Math.max(0, THINK_MS - (Date.now() - createdAt)));
    return () => clearTimeout(t);
  }, [thinking, createdAt]);
  if (thinking)
    return (
      <Animated.View style={[styles.thinkRow, { opacity: pulse }]} accessibilityLiveRegion="polite">
        <Icon name="sparkles" size={16} color={c.orange} strokeWidth={2.4} />
        <Text style={[gz.display.label, { color: c.white }]}>Thinking…</Text>
      </Animated.View>
    );
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Pressable onPress={() => setThoughtOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: thoughtOpen }} hitSlop={6} style={styles.thinkRow}>
          <Icon name="sparkles" size={16} color={c.text2} strokeWidth={2.2} />
          <Text style={[gz.display.label, { color: c.text2 }]}>{`Thought for ${Math.round(THINK_MS / 1000)}s`}</Text>
          <View style={{ transform: [{ rotate: thoughtOpen ? "90deg" : "0deg" }] }}>
            <Icon name="chevron-right" size={14} color={c.text2} strokeWidth={2.4} />
          </View>
        </Pressable>
        {thoughtOpen ? (
          <View style={{ gap: 6, marginTop: 8, marginLeft: 22 }}>
            {["Read your brief and product", "Checked what’s working for similar shops", "Split the ad into three shots"].map((t) => (
              <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Mark status="done" />
                <Text style={[gz.body.caption, { color: c.text2 }]}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <Text style={[gz.body.body, { color: c.text }, status === "cancelled" && { opacity: 0.5 }]}>{text}</Text>
      <PlanCard messageId={messageId} items={items} status={status} />
    </View>
  );
}

function PlanCard({ messageId, items, status }: { messageId: string; items: PlanItem[]; status: "awaiting" | "confirmed" | "cancelled" }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(true);
  const total = items.reduce((n, i) => n + i.cost, 0);
  const badge = status === "awaiting" ? <GZSticker label="NEEDS YOUR OK" color="sky" size="s" rotate={3} /> : status === "confirmed" ? <GZSticker label="CONFIRMED" color="lime" size="s" rotate={-3} /> : <GZSticker label="CANCELLED" color="ink" size="s" rotate={0} />;
  return (
    <View style={[styles.planCard, status === "cancelled" && { opacity: 0.55 }]}>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.planHead}>
        <Text style={[gz.display.head, { color: c.white, flex: 1 }]}>{`The plan · ${items.length}`}</Text>
        {badge}
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <Icon name="chevron-down" size={18} color={c.text2} strokeWidth={2.4} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: 8, paddingHorizontal: 10, paddingBottom: 10 }}>
          {items.map((it, i) => (
            <PlanRow key={it.id} it={it} n={i + 1} />
          ))}
        </View>
      ) : null}
      {status === "awaiting" ? (
        <View style={styles.planFoot}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Coin size={15} />
            <Text style={[gz.body.caption, { color: c.text2 }]}>
              Uses about <Text style={[gz.display.label, { color: c.butter }]}>{total}</Text> credits. Nothing’s charged until you confirm.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <GZButton label="Cancel" variant="dark" size="m" onPress={() => dispatch({ type: "cancelPlan", messageId })} />
            <GZButton label={`Confirm · ${total}`} icon="play" size="m" block style={{ flex: 1 }} onPress={() => dispatch({ type: "confirmPlan", messageId, id: nextId("j") })} />
          </View>
        </View>
      ) : status === "confirmed" ? (
        <View style={[styles.planFoot, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
          <Icon name="circle-check" size={16} color={c.lime} strokeWidth={2.4} />
          <Text style={[gz.display.label, { color: c.lime }]}>Making it now</Text>
        </View>
      ) : null}
    </View>
  );
}

function PlanRow({ it, n }: { it: PlanItem; n: number }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.planItem}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={styles.planNum}>
          <Text style={[gz.display.tiny, { color: c.ink }]}>{n}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name={KIND_ICON[it.kind]} size={14} color={c.text2} strokeWidth={2.2} />
            <Text style={[gz.body.strong, { color: c.white, flex: 1, fontSize: 14, lineHeight: 18 }]} numberOfLines={2}>
              {it.title}
            </Text>
            <Coin size={13} />
            <Text style={[gz.display.tiny, { color: c.butter }]}>{it.cost}</Text>
          </View>
          <Text style={[gz.body.micro, { color: c.text3, fontWeight: "400" }]}>{it.params.join(" · ")}</Text>
          <Pressable onPress={() => setShow((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: show }} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start" }}>
            <Text style={[gz.display.tiny, { color: c.sky }]}>{show ? "Hide prompt" : "View prompt"}</Text>
          </Pressable>
          {show ? <Text style={[gz.body.caption, { color: c.text2 }]}>{it.prompt}</Text> : null}
        </View>
      </View>
    </View>
  );
}

/* ============ 任务卡 ============ */

export const CARD_W = 224;
const AUDIO_W = 296;
function cardSize(job: Job) {
  if (job.mode === "audio") return { width: AUDIO_W, height: 92 };
  const r = job.params?.[1];
  if (!r || !/^\d+:\d+$/.test(r)) return { width: CARD_W, height: Math.round((CARD_W * 16) / 9) };
  const [w, h] = r.split(":").map(Number);
  return { width: CARD_W, height: Math.round((CARD_W * h) / w) };
}

/** 一张卡从生成中(大百分比 + 生成中贴纸)变成结果(在播的视频 / 图 / 音频条);下面一排操作:Post · 收藏 · 下载 · 再来一次 · 改提示词 · @ 引用 */
function JobCard({ job, waitForPlan, onOpen, onPost, cast }: { job: Job; waitForPlan?: boolean; onOpen: () => void; onPost: () => void; cast: string | null }) {
  const { state, dispatch } = useStore();
  const { s, d } = useV2();
  const reveal = useRef(new Animated.Value(1)).current;
  const wasDone = useRef(job.status === "done");
  useEffect(() => {
    if (job.status !== "done") {
      wasDone.current = false;
      return;
    }
    if (wasDone.current) return;
    wasDone.current = true;
    reveal.setValue(0);
    Animated.timing(reveal, { toValue: 1, duration: 260, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false }).start();
  }, [job.status, reveal]);
  const scale = useMemo(() => reveal.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }), [reveal]);
  if (waitForPlan && isPlanning(job)) return null;

  const clip = resultClip(job, cast, s.twin === "ready");
  const size = cardSize(job);
  const cost = MODE_COST[job.mode] * (job.batch ?? 1);
  const single = !!job.params;
  const liked = state.favorites.includes(job.id);
  const pushOn = state.permissions.push === "granted";
  const editPrompt = () => dispatch({ type: "setComposer", patch: { text: job.prompt, mode: job.mode, model: job.model } });

  let body;
  if (job.status === "running") {
    const pct = Math.round(jobProgress(job) * 100);
    body = (
      <>
        <Pressable onPress={onOpen} accessibilityLabel={`${job.title}, making it, ${pct}%`} style={[styles.card, size]}>
          {job.mode !== "audio" ? <Image source={{ uri: poster(clip) }} style={[StyleSheet.absoluteFill, { opacity: 0.22 }]} blurRadius={18} resizeMode="cover" /> : null}
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Text style={[job.mode === "audio" ? gz.display.title : gz.display.hero, { color: c.white }]}>{pct}%</Text>
          </View>
          <View style={{ position: "absolute", top: 10, left: 10 }}>
            <GZSticker label="MAKING IT" color="sky" size="s" rotate={-4} />
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
        </Pressable>
        {!pushOn ? (
          <Pressable onPress={() => dispatch(state.permissions.push === "undetermined" ? { type: "requestPermission", kind: "push" } : { type: "openIosSettings" })} accessibilityRole="button" style={({ pressed }) => [styles.hint, pressed && { opacity: 0.6 }]}>
            <Icon name="bell" size={15} color={c.text2} strokeWidth={2.2} />
            <Text style={[gz.body.caption, { color: c.text2, flexShrink: 1 }]}>
              Get a ping when it’s ready. <Text style={[gz.display.tiny, { color: c.white }]}>Turn on</Text>
            </Text>
          </Pressable>
        ) : null}
      </>
    );
  } else if (job.status === "failed") {
    body = (
      <View style={[styles.card, size, styles.center, { padding: 16, gap: 6 }]}>
        <Icon name="circle-alert" size={24} color={c.text2} strokeWidth={2.2} />
        <Text style={[gz.display.head, { color: c.white, textAlign: "center" }]}>Couldn’t make this one</Text>
        <Text style={[gz.body.caption, { color: c.text3 }]}>No credits charged</Text>
        <GZButton label="Try again" icon="rotate-ccw" variant="white" size="s" onPress={() => dispatch({ type: "retryJob", id: job.id })} style={{ marginTop: 8, alignSelf: "center" }} />
      </View>
    );
  } else {
    body = (
      <>
        {job.mode === "audio" ? (
          <View style={[styles.card, size, { padding: 12, justifyContent: "center" }]}>
            <AudioPlayer />
          </View>
        ) : (
          <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${job.title}, ready. Open`} style={({ pressed }) => [styles.photo, { width: size.width + 6, height: size.height + 6 }, pressed && { transform: [{ scale: 0.98 }, { rotate: "-1deg" }] }]}>
            <View style={{ flex: 1, borderRadius: 14, overflow: "hidden", backgroundColor: c.raised }}>
              {job.mode === "image" ? <Image source={{ uri: poster(clip) }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <MediaVideo uri={video(clip)} poster={poster(clip)} muted loop autoPlay style={StyleSheet.absoluteFill} />}
            </View>
            <View style={{ position: "absolute", top: -8, left: -8 }}>
              <GZSticker label="READY" color="lime" size="s" rotate={-6} />
            </View>
            <View style={styles.expand}>
              <Icon name="maximize" size={14} color={c.white} strokeWidth={2.4} />
            </View>
          </Pressable>
        )}
        <View style={styles.actions}>
          {job.mode !== "audio" ? <GZButton label="Post" icon="upload" variant="white" size="s" onPress={onPost} /> : null}
          {/* 视频结果可以进剪辑器继续剪(加 B-roll、字幕、音乐) */}
          {job.mode !== "audio" && job.mode !== "image" ? <Tool icon="scissors" label="Edit in editor" onPress={() => d({ type: "push", route: { name: "editor", seed: "from-job", postId: clip } })} /> : null}
          <Tool icon="heart" label={liked ? "Remove from favorites" : "Favorite"} on={liked} onPress={() => dispatch({ type: "toggleFavorite", id: job.id })} />
          <Tool icon="download" label="Save to Photos" onPress={() => dispatch({ type: "workSaved", id: job.id })} />
          <Tool icon="rotate-ccw" label="Make another" onPress={() => dispatch({ type: "regenerateJob", id: job.id, newId: nextId("j") })} />
          <Tool icon="pencil" label="Edit prompt" onPress={editPrompt} />
          <Tool icon="at-sign" label="Use as reference" onPress={() => dispatch({ type: "addAttachments", items: [{ id: nextId("a"), uri: poster(clip), kind: job.mode === "image" ? "photo" : "video", label: job.title, uploaded: true }] })} />
        </View>
      </>
    );
  }

  return (
    <Animated.View style={{ alignSelf: "flex-start", gap: 10, opacity: reveal, transform: [{ scale }] }}>
      {single ? (
        <Text style={{ maxWidth: 320 }} numberOfLines={2}>
          <Text style={[gz.body.strong, { color: c.white, fontSize: 14 }]}>{job.prompt}</Text>
          <Text style={[gz.body.caption, { color: c.text3 }]}>{`  ${job.params!.join(" · ")}`}</Text>
        </Text>
      ) : null}
      {body}
      {single && job.status === "running" ? (
        <View style={styles.actions}>
          <GZButton label="Edit" icon="pencil" variant="dark" size="s" onPress={editPrompt} />
          <GZButton label={`Retry · ${cost}`} icon="rotate-ccw" variant="dark" size="s" disabled />
        </View>
      ) : null}
    </Animated.View>
  );
}

function Tool({ icon, label, on, onPress }: { icon: IconName; label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={({ pressed }) => [styles.tool, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={15} color={on ? c.pink : c.white} fill={on ? c.pink : undefined} strokeWidth={2.4} />
    </Pressable>
  );
}

/** 音频结果：白色圆形播放键 + 波形(播放时从左往右变青柠)+ 时间 */
const AUDIO_BARS = Array.from({ length: 30 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.65 + (i % 5 === 0 ? 0.1 : 0));
const AUDIO_LEN = 4;
function AudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => (x + 0.25 >= AUDIO_LEN ? (setPlaying(false), 0) : x + 0.25)), 250);
    return () => clearInterval(id);
  }, [playing]);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Pressable onPress={() => setPlaying((p) => !p)} accessibilityRole="button" accessibilityLabel={playing ? "Pause" : "Play"} style={styles.audioPlay}>
        <Icon name={playing ? "pause" : "play"} size={16} color={c.ink} fill={c.ink} strokeWidth={2} />
      </Pressable>
      <View style={{ flex: 1, height: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {AUDIO_BARS.map((h, i) => (
          <View key={i} style={{ width: 3, borderRadius: 2, height: `${Math.min(1, h) * 100}%`, backgroundColor: i / AUDIO_BARS.length < t / AUDIO_LEN ? c.lime : "rgba(255,255,255,0.3)" }} />
        ))}
      </View>
      <Text style={[gz.display.tiny, { color: c.text2 }]}>{`${fmt(t)} / ${fmt(AUDIO_LEN)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  userWrap: { alignItems: "flex-end", gap: 8 },
  userAtt: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" },
  userThumb: { width: 60, height: 60, padding: 2.5, borderRadius: 10, backgroundColor: c.white },
  pdf: { flex: 1, alignItems: "center", justifyContent: "center" },
  userBubble: { maxWidth: "82%", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, borderBottomRightRadius: 6, backgroundColor: c.white },
  notice: { gap: 10, maxWidth: "92%" },
  noticeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { height: 24, paddingHorizontal: 9, borderRadius: 999, backgroundColor: c.raised, justifyContent: "center" },
  stepsHead: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", minHeight: 28 },
  stepRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  stepChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 28, paddingLeft: 7, paddingRight: 10, borderRadius: 999, borderWidth: 1.5, borderColor: c.line },
  mark: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", marginTop: 1 },
  thinkRow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 24 },
  planCard: { borderRadius: 20, backgroundColor: c.surface, overflow: "hidden" },
  planHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 14 },
  planItem: { padding: 12, borderRadius: 14, backgroundColor: c.raised },
  planNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.white, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  planFoot: { gap: 12, padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  card: { borderRadius: 18, overflow: "hidden", backgroundColor: c.surface },
  center: { alignItems: "center", justifyContent: "center" },
  bar: { position: "absolute", left: 12, right: 12, bottom: 12, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" },
  barFill: { height: 4, borderRadius: 2, backgroundColor: c.white },
  hint: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 36, maxWidth: 300 },
  photo: { padding: 3, borderRadius: 17, backgroundColor: c.white, transform: [{ rotate: "-1.5deg" }], boxShadow: "0 8px 18px rgba(0,0,0,0.4)" } as object,
  expand: { position: "absolute", right: 12, bottom: 12, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  tool: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: c.raised },
  audioPlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.white, alignItems: "center", justifyContent: "center", paddingLeft: 2 },
});
