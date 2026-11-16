import { useEffect, useMemo, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FRIENDS, MISSIONS, STREAK, friendsOn, levelOf, poster, video, type Mission } from "../data";
import { KButton, KLevel, KMissionRow, KStreak } from "../kit/components";
import { tk } from "../kit/tokens";
import { missionReady, useV2 } from "../store";
import { Avatar, Flame, Header, Stack, useV1Routes } from "../ui";
import { Icon, MediaVideo, useInsets } from "../v1";

const c = tk.color;
const t = tk.type;

/* ---------- 发完:第一批反应(实时数字 · 火苗 · 朋友被通知) ---------- */

export function Celebrate() {
  const { s, d } = useV2();
  const insets = useInsets();
  const cel = s.celebrate;
  const [views, setViews] = useState(12);
  const [likes, setLikes] = useState(3);
  useEffect(() => {
    const id = setInterval(() => {
      setViews((v) => v + Math.ceil(Math.random() * 9));
      setLikes((l) => l + (Math.random() > 0.55 ? 1 : 0));
    }, 600);
    return () => clearInterval(id);
  }, []);
  const [pop] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: false, bounciness: 14 }).start();
  }, [pop]);
  const cardStyle = useMemo(() => ({ transform: [{ scale: pop }, { rotate: "-3deg" }] }), [pop]);
  if (!cel) return null;
  const lv = levelOf(s.xp);
  const friends = friendsOn(cel.srcId ?? cel.postId);
  const rivals = FRIENDS.filter((f) => f.streak > 0).sort((a, b) => b.streak - a.streak);
  const beat = rivals.filter((f) => f.streak < s.postStreak);
  const ahead = rivals.find((f) => f.streak >= s.postStreak);
  const more = (["shareInstagram", "shareTikTok"] as const).find((k) => !s.claimed.includes(k));
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page, zIndex: 40 }]}>
      <View style={styles.glow} pointerEvents="none" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: 170 + insets.bottom, alignItems: "center" }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.liveCard, cardStyle]}>
          <MediaVideo uri={video(cel.postId)} poster={poster(cel.postId)} style={StyleSheet.absoluteFill} />
          <View style={styles.liveTag}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.white }} />
            <Text style={[t.tab, { color: c.white, fontWeight: "800" }]}>LIVE ON BUZZVIDEO</Text>
          </View>
        </Animated.View>
        <Text style={[t.display, { color: c.white, marginTop: 22 }]}>{cel.levelUp ? `Level up! ${lv.title}` : "You're posted!"}</Text>
        <View style={{ flexDirection: "row", gap: 24, marginTop: 14 }}>
          {[
            [String(views), "views", c.white],
            [String(likes), "likes", c.like],
            [cel.bonus ? `+${cel.bonus}` : `+${cel.xp}`, cel.bonus ? "credits" : "XP", c.primary],
          ].map(([n, l, col]) => (
            <View key={l} style={{ alignItems: "center" }}>
              <Text style={[t.title, { color: col }]}>{n}</Text>
              <Text style={[t.caption, { color: c.text3 }]}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignSelf: "stretch", paddingHorizontal: 16, marginTop: 22, gap: 8 }}>
          {/* 火苗:和朋友比 */}
          <View style={styles.card}>
            <Flame n={s.postStreak} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={[t.bodyStrong, { color: c.white }]}>{s.postStreak}-day streak!</Text>
              <Text style={[t.caption, { color: c.text2 }]}>
                {beat.length ? `You beat ${beat[0].name} (${beat[0].streak}). ` : ""}
                {ahead ? `${ahead.name} is on ${ahead.streak}.` : "You're ahead of all your friends."}
              </Text>
            </View>
            <Stack uris={rivals.slice(0, 2).map((f) => f.avatar)} size={26} ring={c.surface} />
          </View>
          <View style={styles.card}>
            <Icon name="bell" size={20} color={c.white} strokeWidth={2} />
            <Text style={[t.caption, { color: c.text2, flex: 1 }]}>
              {friends.length ? (
                <>
                  We told <Text style={{ color: c.white, fontWeight: "600" }}>{friends.map((f) => f.name).join(", ")}</Text>. They made this too.
                </>
              ) : (
                "Your followers will see it first in Following."
              )}
            </Text>
          </View>
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <KLevel lv={lv.lv} title={lv.title} pct={lv.pct} xp={lv.max ? "Max" : `${lv.into}/${lv.span}`} />
            </View>
            <Text style={[t.captionStrong, { color: c.primary }]}>+{cel.xp} XP</Text>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.foot, { paddingBottom: insets.bottom + 12 }]}>
        {more ? (
          <KButton
            label={`Also share to ${more === "shareInstagram" ? "Instagram" : "TikTok"} · +30`}
            variant="cta"
            onPress={() => {
              d({ type: "shareOut", to: more === "shareInstagram" ? "instagram" : "tiktok", mine: cel.myId });
              d({ type: "closeCelebrate" });
            }}
          />
        ) : null}
        <KButton
          label="Back to feed"
          variant={more ? "secondary" : "cta"}
          onPress={() => {
            d({ type: "closeCelebrate" });
            d({ type: "tab", tab: "home" });
          }}
        />
        <KButton label="See my profile" variant="text" onPress={() => d({ type: "closeCelebrate" })} style={{ alignSelf: "center" }} />
      </View>
    </View>
  );
}

/* ---------- 任务中心 ---------- */

function Mission({ m }: { m: Mission }) {
  const { s, d } = useV2();
  const v1 = useV1Routes();
  const claimed = s.claimed.includes(m.id);
  const ready = missionReady(s, m.id);
  const go = () => {
    if (m.id === "twin") d({ type: "push", route: { name: "twin" } });
    else if (m.id === "invite") v1.invite();
    else if (m.id === "like5") d({ type: "popToRoot" });
    else d({ type: "push", route: { name: "play" } });
  };
  return <KMissionRow title={m.title} reward={m.reward} progress={m.goal > 1 ? `${s.progress[m.id]}/${m.goal}` : m.desc} state={claimed ? "done" : ready ? "claim" : "go"} onPress={ready ? () => d({ type: "claimMission", id: m.id }) : go} />;
}

export function Rewards() {
  const { s, d } = useV2();
  const done = s.claimedToday && s.streak % STREAK.length === 0 ? STREAK.length : s.streak % STREAK.length;
  const rivals = FRIENDS.filter((f) => f.streak > 0).sort((a, b) => b.streak - a.streak);
  const board = [...rivals.map((f) => ({ name: f.name, avatar: f.avatar, n: f.streak, me: false })), { name: "You", avatar: "", n: s.postStreak, me: true }].sort((a, b) => b.n - a.n);
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Header title="Rewards" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* 签到:打开 APP 自动到账，这里看进度;今天没领(比如刚断网)时可以补领 */}
        <View style={styles.box}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={[t.headline, { color: c.text }]}>Daily credits</Text>
            <Text style={[t.caption, { color: c.text3 }]}>Day {Math.max(1, done)} of 7</Text>
          </View>
          <KStreak rewards={STREAK} done={done} today={s.claimedToday ? -1 : done} />
          {s.claimedToday ? (
            <Text style={[t.caption, { color: c.text3, textAlign: "center", marginTop: 12 }]}>Added automatically when you opened the app. Back tomorrow for {STREAK[s.streak % STREAK.length]}.</Text>
          ) : (
            <View style={{ marginTop: 12 }}>
              <KButton label={`Claim ${STREAK[s.streak % STREAK.length]} credits`} variant="cta" onPress={() => d({ type: "claimDaily" })} />
            </View>
          )}
        </View>

        {/* 火苗排行:和朋友比连续发作品天数 */}
        <Text style={styles.group}>Posting streak with friends</Text>
        <View style={styles.box}>
          {board.map((r, i) => (
            <View key={r.name} style={[styles.boardRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}>
              <Text style={[t.captionStrong, { color: c.text3, width: 18 }]}>{i + 1}</Text>
              {r.me ? <Avatar id="me" size={32} /> : <Image source={{ uri: r.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />}
              <Text style={[t.bodyStrong, { color: r.me ? c.primary : c.text, flex: 1 }]}>{r.name}</Text>
              <Flame n={r.n} size={14} />
            </View>
          ))}
          <Text style={[t.caption, { color: c.text3, marginTop: 10 }]}>{s.postedToday ? "You posted today. Keep it going tomorrow." : "Post anything today to keep your streak."}</Text>
        </View>

        {(["Starter", "Daily"] as const).map((g) => (
          <View key={g}>
            <Text style={styles.group}>{g === "Starter" ? "Starter missions" : "Daily missions"}</Text>
            <View style={[styles.box, { paddingVertical: 4 }]}>
              {MISSIONS.filter((m) => m.group === g).map((m, i) => (
                <View key={m.id} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line } : undefined}>
                  <Mission m={m} />
                </View>
              ))}
            </View>
          </View>
        ))}
        <Text style={[t.caption, { color: c.text4, textAlign: "center", marginTop: 20 }]}>Daily missions reset at midnight. Credits from rewards never expire.</Text>
      </ScrollView>
    </View>
  );
}

/* ---------- My Twin:同意 → 录一段自拍 → 生成 ---------- */

export function Twin() {
  const { s, d } = useV2();
  const insets = useInsets();
  const [step, setStep] = useState<"intro" | "record" | "making">("intro");
  const [rec, setRec] = useState(0);
  const [making, setMaking] = useState(0);
  useEffect(() => {
    if (step !== "record" || rec === 0) return;
    if (rec >= 4) {
      setStep("making");
      return;
    }
    const tm = setTimeout(() => setRec((n) => n + 1), 900);
    return () => clearTimeout(tm);
  }, [step, rec]);
  useEffect(() => {
    if (step !== "making") return;
    if (making >= 1) {
      d({ type: "twinReady" });
      d({ type: "pop" });
      return;
    }
    const tm = setTimeout(() => setMaking((v) => Math.min(1, v + 0.08)), 180);
    return () => clearTimeout(tm);
  }, [step, making, d]);

  if (s.twin === "ready" && step === "intro")
    return (
      <View style={{ flex: 1, backgroundColor: c.page }}>
        <Header title="My Twin" />
        <View style={styles.twinBody}>
          <Avatar id="me" size={140} />
          <Text style={[t.title, { color: c.text, textAlign: "center" }]}>Your Twin is ready</Text>
          <Text style={[t.body, { color: c.text2, textAlign: "center" }]}>Pick “Me” in any remix and you&apos;re in the video. Only you can use your Twin.</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 8 }}>
          <KButton label="Find a video to star in" onPress={() => d({ type: "popToRoot" })} />
          <KButton
            label="Record again"
            variant="secondary"
            onPress={() => {
              setRec(0);
              setMaking(0);
              setStep("record");
            }}
          />
        </View>
      </View>
    );

  if (step === "intro")
    return (
      <View style={{ flex: 1, backgroundColor: c.page }}>
        <Header title="Create your Twin" />
        <View style={styles.twinBody}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <Avatar id="me" size={96} />
            <Icon name="chevron-right" size={22} color={c.text3} />
            <Image source={{ uri: poster("scooter") }} style={{ width: 96, height: 150, borderRadius: tk.radius.md }} />
          </View>
          <Text style={[t.title, { color: c.text, textAlign: "center" }]}>Put yourself in any video</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Stack uris={FRIENDS.slice(0, 3).map((f) => f.avatar)} size={20} ring={c.page} />
            <Text style={[t.caption, { color: c.text2 }]}>Lily, Max and Zoe already have one</Text>
          </View>
          <View style={{ gap: 12, alignSelf: "stretch", marginTop: 8 }}>
            {(
              [
                ["camera", "Record a 3-second selfie reading three numbers"],
                ["lock", "Only you can use your Twin. Delete it any time in Settings."],
                ["gift", "Get 50 credits when it's ready"],
              ] as const
            ).map(([icon, text]) => (
              <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icon name={icon} size={20} color={c.text} />
                <Text style={[t.body, { color: c.text, flex: 1 }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
          <Text style={[t.caption, { color: c.text3, textAlign: "center", marginBottom: 12 }]}>By continuing you confirm this is your own face and agree to the Twin terms.</Text>
          <KButton label="Agree and continue" onPress={() => setStep("record")} />
        </View>
      </View>
    );

  if (step === "record")
    return (
      <View style={{ flex: 1, backgroundColor: c.black }}>
        <Image source={{ uri: "/prototypes/buzzvideo-app/camera-view.jpg" }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.oval} pointerEvents="none" />
        <Header tone="onImage" onBack={() => setStep("intro")} />
        <View style={[styles.recFoot, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={[t.body, { color: c.text2, textAlign: "center", paddingHorizontal: 32 }]}>{rec === 0 ? "Fit your face in the frame, then read the numbers out loud" : "Read out loud"}</Text>
          <Text style={{ fontSize: 34, lineHeight: 41, fontWeight: "700", color: c.white }}>{rec === 0 ? "4  ·  7  ·  2" : ["4", "7", "2", "✓"][rec - 1]}</Text>
          <Pressable onPress={() => rec === 0 && setRec(1)} accessibilityRole="button" accessibilityLabel="Record" style={styles.shutter}>
            <View style={[styles.shutterDot, rec > 0 && { borderRadius: 8, width: 30, height: 30 }]} />
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: c.page, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40 }}>
      <Avatar id="me" size={140} />
      <Text style={[t.title, { color: c.text }]}>Creating your Twin… {Math.round(making * 100)}%</Text>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${making * 100}%` }]} />
      </View>
      <Text style={[t.body, { color: c.text2 }]}>This takes a few seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: "absolute", top: 40, left: -40, right: -40, height: 420, borderRadius: 300, backgroundColor: "rgba(255,94,26,0.16)", filter: "blur(60px)" } as object,
  liveCard: { width: 180, height: 290, borderRadius: tk.radius.lg, overflow: "hidden", borderWidth: 3, borderColor: c.white, backgroundColor: "#111" },
  liveTag: { position: "absolute", left: 8, top: 8, flexDirection: "row", alignItems: "center", gap: 5, height: 20, paddingHorizontal: 7, borderRadius: 4, backgroundColor: c.like },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: tk.radius.lg, backgroundColor: c.surface },
  foot: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, gap: 8, backgroundColor: "rgba(18,18,18,0.96)" },
  box: { backgroundColor: c.surface, borderRadius: tk.radius.lg, padding: 14 },
  group: { ...t.captionStrong, color: c.text3, marginTop: 22, marginBottom: 8, marginLeft: 4 },
  boardRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  twinBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  oval: { position: "absolute", alignSelf: "center", top: "16%", width: 240, height: 320, borderRadius: 160, borderWidth: 3, borderColor: "rgba(255,255,255,0.9)" },
  recFoot: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 10, paddingTop: 20, backgroundColor: "rgba(0,0,0,0.45)" },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: c.white, alignItems: "center", justifyContent: "center", marginTop: 6 },
  shutterDot: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#ff3b30" },
  track: { alignSelf: "stretch", height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: c.primary },
});
