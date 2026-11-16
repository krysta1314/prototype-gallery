import { useEffect, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GZButton, GZPhoto, GZSticker, GZStreak, gz, useSlap } from "../../kit/gz";
import { FRIENDS, MISSIONS, STREAK, friendsOn, levelOf, poster, video, type Mission } from "../data";
import { Foot, Hairline, LevelBar, MissionRow, RowIcon, SectionLabel } from "../parts";
import { missionReady, useV2 } from "../store";
import { Avatar, Flame, Header, Stack, useV1Routes } from "../ui";
import { Icon, MediaVideo, USER, useInsets, useStore } from "../v1";

const c = gz.color;

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
  // 作品卡啪地贴上(不回弹)
  const slap = useSlap();
  if (!cel) return null;
  const lv = levelOf(s.xp);
  const friends = friendsOn(cel.srcId ?? cel.postId);
  const rivals = FRIENDS.filter((f) => f.streak > 0).sort((a, b) => b.streak - a.streak);
  const beat = rivals.filter((f) => f.streak < s.postStreak);
  const ahead = rivals.find((f) => f.streak >= s.postStreak);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page, zIndex: 40 }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: 150 + insets.bottom, alignItems: "center" }} showsVerticalScrollIndicator={false}>
        <Animated.View style={slap}>
          <View style={styles.liveCard}>
            <View style={styles.liveInner}>
              <MediaVideo uri={video(cel.postId)} poster={poster(cel.postId)} style={StyleSheet.absoluteFill} />
            </View>
            <View style={{ position: "absolute", left: -10, top: 14 }}>
              <GZSticker label="Live on BuzzVideo" color="lime" size="s" rotate={-6} />
            </View>
          </View>
        </Animated.View>
        <Text style={[gz.display.hero, { color: c.white, marginTop: 26, textAlign: "center", paddingHorizontal: 24 }]}>{cel.levelUp ? `Level up! ${lv.title}` : "You're posted!"}</Text>
        <View style={{ flexDirection: "row", gap: 30, marginTop: 16 }}>
          {[
            [String(views), "views", c.white],
            [String(likes), "likes", c.pink],
            [cel.bonus ? `+${cel.bonus}` : `+${cel.xp}`, cel.bonus ? "credits" : "XP", cel.bonus ? c.butter : c.lilac],
          ].map(([n, l, col]) => (
            <View key={l} style={{ alignItems: "center" }}>
              <Text style={[gz.display.title, { color: col, fontSize: 30, lineHeight: 32 }]}>{n}</Text>
              <Text style={[gz.body.caption, { color: c.text3, marginTop: 2 }]}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignSelf: "stretch", marginTop: 24 }}>
          {/* 火苗:和朋友比 */}
          <View style={styles.row}>
            <Flame n={s.postStreak} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={[gz.display.label, { color: c.white }]}>{s.postStreak}-day streak!</Text>
              <Text style={[gz.body.caption, { color: c.text2, marginTop: 2 }]}>
                {beat.length ? `You beat ${beat[0].name} (${beat[0].streak}). ` : ""}
                {ahead ? `${ahead.name} is on ${ahead.streak}.` : "You're ahead of all your friends."}
              </Text>
            </View>
            <Stack uris={rivals.slice(0, 2).map((f) => f.avatar)} size={26} ring={c.page} />
          </View>
          <Hairline />
          <View style={styles.row}>
            <RowIcon icon="bell" color="sky" />
            <Text style={[gz.body.caption, { color: c.text2, flex: 1 }]}>
              {friends.length ? (
                <>
                  We told <Text style={{ color: c.white, fontWeight: "600" }}>{friends.map((f) => f.name).join(", ")}</Text>. They made this too.
                </>
              ) : (
                "Your followers will see it first in Following."
              )}
            </Text>
          </View>
          <Hairline />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <LevelBar lv={lv.lv} title={lv.title} pct={lv.pct} xp={lv.max ? "Max" : `${lv.into}/${lv.span}`} />
            </View>
            <Text style={[gz.display.label, { color: c.lilac }]}>+{cel.xp} XP</Text>
          </View>
        </View>
      </ScrollView>
      <Foot bottom={insets.bottom + 8}>
        <GZButton
          label="Back to feed"
          variant="primary"
          onPress={() => {
            d({ type: "closeCelebrate" });
            d({ type: "tab", tab: "home" });
          }}
        />
        <Pressable onPress={() => d({ type: "closeCelebrate" })} accessibilityRole="button" hitSlop={6} style={{ alignSelf: "center", paddingVertical: 8 }}>
          <Text style={[gz.display.label, { color: c.text2 }]}>See my profile</Text>
        </Pressable>
      </Foot>
    </View>
  );
}

/* ---------- 任务中心 ---------- */

function MissionItem({ m }: { m: Mission }) {
  const { s, d } = useV2();
  const v1 = useV1Routes();
  const claimed = s.claimed.includes(m.id);
  const ready = missionReady(s, m.id);
  const go = () => {
    if (m.id === "twin") d({ type: "push", route: { name: "twin" } });
    else if (m.id === "invite") v1.invite();
    else if (m.id === "like5") d({ type: "popToRoot" });
    // 发作品 / 分享 / 做同款类任务：回底部 Create(创作入口只有这一个)
    else d({ type: "tab", tab: "create" });
  };
  return <MissionRow title={m.title} reward={m.reward} progress={m.goal > 1 ? `${s.progress[m.id]}/${m.goal}` : m.desc} state={claimed ? "done" : ready ? "claim" : "go"} onPress={ready ? () => d({ type: "claimMission", id: m.id }) : go} />;
}

export function Rewards() {
  const { s, d } = useV2();
  const done = s.claimedToday && s.streak % STREAK.length === 0 ? STREAK.length : s.streak % STREAK.length;
  const rivals = FRIENDS.filter((f) => f.streak > 0).sort((a, b) => b.streak - a.streak);
  const board = [...rivals.map((f) => ({ name: f.name, avatar: f.avatar, n: f.streak, me: false })), { name: "You", avatar: "", n: s.postStreak, me: true }].sort((a, b) => b.n - a.n);
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Header title="Rewards" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}>
        {/* 签到:打开 APP 自动到账，这里看进度;今天没领(比如刚断网)时可以补领 */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={[gz.display.title, { color: c.white }]}>Daily credits</Text>
            <Text style={[gz.display.label, { color: c.butter }]}>Day {Math.max(1, done)} of 7</Text>
          </View>
          <GZStreak rewards={STREAK} done={done} today={s.claimedToday ? -1 : done} />
          {s.claimedToday ? (
            <Text style={[gz.body.caption, { color: c.text3, textAlign: "center", marginTop: 16 }]}>Added automatically when you opened the app. Back tomorrow for {STREAK[s.streak % STREAK.length]}.</Text>
          ) : (
            <View style={{ marginTop: 16 }}>
              <GZButton label={`Claim ${STREAK[s.streak % STREAK.length]} credits`} onPress={() => d({ type: "claimDaily" })} />
            </View>
          )}
        </View>

        {/* 火苗排行:和朋友比连续发作品天数 */}
        <SectionLabel style={{ marginTop: 30 }}>Posting streak with friends</SectionLabel>
        {board.map((r, i) => (
          <View key={r.name}>
            {i ? <Hairline inset={58} /> : null}
            <View style={styles.boardRow}>
              <Text style={[gz.display.label, { color: i === 0 ? c.white : c.text3, width: 18 }]}>{i + 1}</Text>
              {r.me ? <Avatar id="me" size={34} /> : <Image source={{ uri: r.avatar }} style={{ width: 34, height: 34, borderRadius: 17 }} />}
              <Text style={[gz.display.label, { color: r.me ? c.lilac : c.white, flex: 1 }]}>{r.me ? "You" : r.name.toLowerCase()}</Text>
              <Flame n={r.n} size={15} />
            </View>
          </View>
        ))}
        <Text style={[gz.body.caption, { color: c.text3, marginTop: 8, marginHorizontal: 16 }]}>{s.postedToday ? "You posted today. Keep it going tomorrow." : "Post anything today to keep your streak."}</Text>

        {(["Starter", "Daily"] as const).map((g) => (
          <View key={g}>
            <SectionLabel style={{ marginTop: 30 }}>{g === "Starter" ? "Starter missions" : "Daily missions"}</SectionLabel>
            {MISSIONS.filter((m) => m.group === g && !SHARE_MISSIONS.includes(m.id)).map((m, i) => (
              <View key={m.id}>
                {i ? <Hairline /> : null}
                <MissionItem m={m} />
              </View>
            ))}
          </View>
        ))}
        <Text style={[gz.body.caption, { color: c.text3, textAlign: "center", marginTop: 24, paddingHorizontal: 24 }]}>Daily missions reset at midnight. Credits from rewards never expire.</Text>
      </ScrollView>
    </View>
  );
}

/* ---------- My Twin:同意 → 录一段自拍 → 生成 ---------- */

/** 新版设计不奖励分享到外部平台(Monica:激励的是在 BuzzVideo 公开发布)，任务中心不显示这两条 */
const SHARE_MISSIONS: string[] = ["shareTikTok", "shareInstagram"];

export function Twin() {
  const { s, d } = useV2();
  const insets = useInsets();
  const [step, setStep] = useState<"intro" | "record" | "making">("intro");
  const [rec, setRec] = useState(0);
  // 录分身要相机和麦克风：第一次弹系统权限框(沿用第一版);允许后直接开录，拒绝过就弹「去设置里打开」
  const v1 = useStore();
  const cam = v1.state.permissions.camera;
  const [askedCam, setAskedCam] = useState(false);
  useEffect(() => {
    if (askedCam && cam === "granted") setStep("record");
    if (askedCam && cam === "denied") v1.dispatch({ type: "showSettingsAlert", kind: "camera" });
  }, [askedCam, cam, v1]);
  const agree = () => {
    if (cam === "granted") return setStep("record");
    if (cam === "denied") return v1.dispatch({ type: "showSettingsAlert", kind: "camera" });
    setAskedCam(true);
    v1.dispatch({ type: "requestPermission", kind: "camera" });
  };
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
          <View style={{ marginBottom: 10 }}>
            <GZPhoto uri={USER.avatar} w={140} h={140} rotate={-4} radius={70} />
            <View style={{ position: "absolute", right: -12, bottom: 4 }}>
              <GZSticker label="Ready" color="lilac" rotate={6} slap />
            </View>
          </View>
          <Text style={[gz.display.title, { color: c.white, textAlign: "center" }]}>Your Twin is ready</Text>
          <Text style={[gz.body.body, { color: c.text2, textAlign: "center" }]}>Pick “Me” in any remix and you&apos;re in the video. Only you can use your Twin.</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 10 }}>
          <GZButton label="Find a video to star in" onPress={() => d({ type: "popToRoot" })} />
          <GZButton
            label="Record again"
            variant="dark"
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
          {/* 自己的照片贴纸 → 出演的视频贴纸 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <GZPhoto uri={USER.avatar} w={96} h={96} rotate={-6} radius={48} />
            <Icon name="chevron-right" size={26} color={c.text3} strokeWidth={2.6} />
            <GZPhoto uri={poster("scooter")} w={96} h={150} rotate={5} radius={14} />
          </View>
          <Text style={[gz.display.title, { color: c.white, textAlign: "center" }]}>Put yourself in any video</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Stack uris={FRIENDS.slice(0, 3).map((f) => f.avatar)} size={22} ring={c.page} />
            <Text style={[gz.body.caption, { color: c.text2 }]}>Lily, Max and Zoe already have one</Text>
          </View>
          <View style={{ gap: 14, alignSelf: "stretch", marginTop: 14 }}>
            {(
              [
                ["camera", "Record a 3-second selfie reading three numbers", undefined],
                ["lock", "Only you can use your Twin. Delete it any time in Settings.", undefined],
                ["gift", "Get 50 credits when it's ready", "butter"],
              ] as const
            ).map(([icon, text, color]) => (
              <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <RowIcon icon={icon} color={color} />
                <Text style={[gz.body.body, { color: c.text, flex: 1 }]}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}>
          <Text style={[gz.body.caption, { color: c.text3, textAlign: "center", marginBottom: 12 }]}>By continuing you confirm this is your own face and agree to the Twin terms.</Text>
          <GZButton label="Agree and continue" onPress={agree} />
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
          <Text style={[gz.body.body, { color: c.text2, textAlign: "center", paddingHorizontal: 32 }]}>{rec === 0 ? "Fit your face in the frame, then read the numbers out loud" : "Read out loud"}</Text>
          <Text style={[gz.display.hero, { color: c.white, fontSize: 40, lineHeight: 44 }]}>{rec === 0 ? "4  ·  7  ·  2" : ["4", "7", "2", "✓"][rec - 1]}</Text>
          <Pressable onPress={() => rec === 0 && setRec(1)} accessibilityRole="button" accessibilityLabel="Record" style={styles.shutter}>
            <View style={[styles.shutterDot, rec > 0 && { borderRadius: 8, width: 30, height: 30 }]} />
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: c.page, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40 }}>
      <GZPhoto uri={USER.avatar} w={140} h={140} rotate={-4} radius={70} />
      <Text style={[gz.display.hero, { color: c.white, fontSize: 48, lineHeight: 50, marginTop: 10 }]}>{Math.round(making * 100)}%</Text>
      <Text style={[gz.display.head, { color: c.white }]}>Creating your Twin…</Text>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${making * 100}%` }]} />
      </View>
      <Text style={[gz.body.body, { color: c.text2 }]}>This takes a few seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  liveCard: { width: 186, height: 296, padding: 4, borderRadius: 22, backgroundColor: c.white, transform: [{ rotate: "-3deg" }], boxShadow: "0 10px 24px rgba(0,0,0,0.45)" } as object,
  liveInner: { flex: 1, borderRadius: 18, overflow: "hidden", backgroundColor: "#111" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  boardRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  twinBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  oval: { position: "absolute", alignSelf: "center", top: "16%", width: 240, height: 320, borderRadius: 160, borderWidth: 3, borderColor: "rgba(255,255,255,0.9)" },
  recFoot: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 10, paddingTop: 20, backgroundColor: "rgba(0,0,0,0.45)" },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: c.white, alignItems: "center", justifyContent: "center", marginTop: 6 },
  shutterDot: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#ff3b30" },
  track: { alignSelf: "stretch", height: 6, borderRadius: 3, backgroundColor: c.raised, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: c.lilac },
});
