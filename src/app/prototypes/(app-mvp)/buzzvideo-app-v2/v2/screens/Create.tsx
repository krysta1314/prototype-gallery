import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CHALLENGES, EFFECTS, GEN_COST, MISSIONS, creator, fmt, friendsOn, post, poster, resultOf, versionsOf, video } from "../data";
import { KButton, KCircleButton, KIconTabs, KListRow, KRowIcon, KTag } from "../kit/components";
import { tk } from "../kit/tokens";
import { useCredits, useV2 } from "../store";
import { Avatar, BRAND, CreditsChip, Face, Stack, Stage, useV1Routes } from "../ui";
import { BrandIcon, Gradient, Icon, MediaVideo, USER, useInsets, useKeyboard, type IconName } from "../v1";

const c = tk.color;
const t = tk.type;

/* ---------- 同款页:一个「梗」的原版 + 所有人的版本 ---------- */

export function Template({ postId }: { postId: string }) {
  const { d } = useV2();
  const insets = useInsets();
  const p = post(postId);
  const friends = friendsOn(postId);
  const [tab, setTab] = useState(friends.length ? "friends" : "top");
  const [w, setW] = useState(0);
  const all = versionsOf(postId);
  const list = tab === "friends" ? all.filter((v) => v.friend) : tab === "new" ? [...all].reverse() : [...all].sort((a, b) => b.likes - a.likes);
  const cw = w ? (w - 4) / 3 : 0;
  const remix = () => d({ type: "push", route: { name: "remix", postId } });
  return (
    <View style={{ flex: 1, backgroundColor: c.page }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 48, paddingHorizontal: 16, paddingBottom: 18 }}>
          <Image source={{ uri: poster(postId) }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} blurRadius={30} resizeMode="cover" />
          <Gradient colors={["rgba(18,18,18,0)", c.page]} style={[StyleSheet.absoluteFill, { top: "40%" }]} pointerEvents="none" />
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Pressable onPress={() => d({ type: "push", route: { name: "post", postId } })} style={styles.tplCover} accessibilityLabel="Play the original">
              <Image source={{ uri: poster(postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.tplPlay}>
                <Icon name="play" size={14} color={c.white} fill={c.white} strokeWidth={1} />
              </View>
            </Pressable>
            <View style={{ flex: 1, justifyContent: "flex-end", gap: 6 }}>
              <Text style={[t.title, { color: c.white }]} numberOfLines={2}>
                {p.caption}
              </Text>
              <Pressable onPress={() => d({ type: "push", route: { name: "profile", userId: p.author } })} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Avatar id={p.author} size={18} />
                <Text style={[t.caption, { color: c.text2 }]}>Original by {creator(p.author).name}</Text>
              </Pressable>
              <Text style={[t.caption, { color: c.text3 }]}>
                {fmt(p.remixes)} remixes · {fmt(p.likes * 40)} views
              </Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
                <View style={[styles.pill, { backgroundColor: c.primarySoft }]}>
                  <Text style={[styles.pillText, { color: c.primary }]}>+{fmt(Math.round(p.remixes / 11))} today</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: c.fill2 }]}>
                  <Text style={styles.pillText}>{p.cat}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {friends.length ? (
          <View style={styles.friendsRow}>
            <Stack uris={friends.map((f) => f.avatar)} size={28} ring={c.surface} />
            <Text style={[t.caption, { color: c.text2, flex: 1 }]}>
              <Text style={{ color: c.white, fontWeight: "600" }}>{friends.slice(0, 2).map((f) => f.name).join(", ")}</Text>
              {friends.length > 2 ? ` and ${friends.length - 2} more friend` : ""} made this
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 6 }}>
          <KIconTabs
            tabs={[
              { id: "top", icon: "flame", label: "Top" },
              ...(friends.length ? [{ id: "friends", icon: "users" as IconName, label: "Friends" }] : []),
              { id: "new", icon: "sparkles", label: "New" },
            ]}
            current={tab}
            onChange={setTab}
          />
        </View>
        {cw ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
            {/* 第一格永远留给「你」 */}
            <Pressable onPress={remix} style={[styles.cell, { width: cw, height: cw * 1.4, alignItems: "center", justifyContent: "center", gap: 8 }]} accessibilityRole="button" accessibilityLabel="Make your version">
              <View>
                <Avatar id="me" size={52} />
                <View style={styles.youPlus}>
                  <Icon name="plus" size={14} color={c.white} strokeWidth={3} />
                </View>
              </View>
              <Text style={[t.captionStrong, { color: c.white }]}>Your turn</Text>
            </Pressable>
            {list.map((v, i) => (
              <Pressable key={v.postId + i} onPress={() => d({ type: "push", route: { name: "post", postId: v.postId, list: list.map((x) => x.postId) } })} style={[styles.cell, { width: cw, height: cw * 1.4 }]} accessibilityLabel={`${v.by}'s version`}>
                <Image source={{ uri: poster(v.postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60 }} pointerEvents="none" />
                {v.friend ? (
                  <View style={styles.friendTag}>
                    <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>Friend</Text>
                  </View>
                ) : null}
                <View style={styles.cellFoot}>
                  <Face uri={v.avatar} size={16} />
                  <Text style={[t.micro, { color: c.white, flex: 1 }]} numberOfLines={1}>
                    {v.by}
                  </Text>
                  <Icon name="heart" size={11} color={c.white} fill={c.white} strokeWidth={1} />
                  <Text style={[t.micro, { color: c.white }]}>{fmt(v.likes)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.navFloat, { top: insets.top }]}>
        <KCircleButton icon="chevron-left" tone="video" size={36} onPress={() => d({ type: "pop" })} label="Back" />
        <KCircleButton icon="share" tone="video" size={36} onPress={() => d({ type: "sheet", sheet: { name: "share", postId } })} label="Share" />
      </View>
      <View style={[styles.stickyFoot, { paddingBottom: insets.bottom + 12 }]}>
        <KButton label="Remix this" variant="cta" icon="wand-sparkles" onPress={remix} />
      </View>
    </View>
  );
}

/* ---------- 做同款:主角轮盘(像拍照选滤镜) ---------- */

const STORIES = ["Make it a 1920s party", "Put it on the moon", "Turn it into a K-drama", "Make it rain glitter", "Same scene, but at a wedding"];
const STYLES = ["Original", "Anime", "Claymation", "Cinematic", "Y2K"];

export function Remix({ postId, effect }: { postId: string; effect?: string }) {
  const { s, d } = useV2();
  const insets = useInsets();
  const kb = useKeyboard();
  const credits = useCredits();
  const v1 = useV1Routes();
  const p = post(postId);
  const [cast, setCast] = useState<string>(s.twin === "ready" && p.cast ? "me" : "orig");
  const [uploaded, setUploaded] = useState(false);
  const [story, setStory] = useState("");
  const [style, setStyle] = useState("Original");
  // 从分身页建好回来:自动换成自己
  useEffect(() => {
    if (s.twin === "ready" && p.cast) setCast("me");
  }, [s.twin, p.cast]);
  const pulse = useState(() => new Animated.Value(0))[0];
  const scale = useMemo(() => pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }), [pulse]);
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }), Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false })]));
    a.start();
    return () => a.stop();
  }, [pulse]);
  const people: { id: string; label: string; uri?: string; icon?: IconName; badge?: string }[] = [
    { id: "orig", label: "Original", uri: poster(postId) },
    ...(p.cast ? [{ id: "me", label: "Me", uri: USER.avatar, badge: s.twin === "ready" ? undefined : "+50" }, { id: "pet", label: "My pet", uri: poster("collie") }] : []),
    uploaded ? { id: "photo", label: "My photo", uri: "/prototypes/buzzvideo-app/photo-1.jpg" } : { id: "upload", label: "Upload", icon: "plus" as IconName },
  ];
  const pick = (id: string) => {
    if (id === "upload") {
      setUploaded(true);
      setCast("photo");
      d({ type: "toast", text: "Photo added" });
      return;
    }
    if (id === cast) return generate();
    if (id === "me" && s.twin !== "ready") {
      d({ type: "push", route: { name: "twin" } });
      return;
    }
    setCast(id);
  };
  const generate = () => {
    if (credits < GEN_COST) {
      d({ type: "toast", text: "Not enough credits" });
      v1.paywall();
      return;
    }
    const twist = [story.trim(), style !== "Original" ? `${style} style` : ""].filter(Boolean).join(", ");
    d({ type: "generate", postId, title: effect ?? p.caption, prompt: twist ? `${p.prompt}. ${twist}` : p.prompt, withTwin: cast === "me" });
  };
  const current = people.find((x) => x.id === cast) ?? people[0];
  const starring = cast === "orig" ? "Keep the original star" : cast === "me" ? "Starring you" : cast === "pet" ? "Starring your pet" : "Starring your photo";
  return (
    <View style={{ flex: 1, backgroundColor: c.black }}>
      <View style={[styles.preview, { bottom: kb.open ? 120 : 216 + insets.bottom }]}>
        <Stage id={postId}>
          <MediaVideo uri={video(postId)} poster={poster(postId)} style={StyleSheet.absoluteFill} />
        </Stage>
        <Gradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} pointerEvents="none" />
        <View style={[styles.swapBadge, { top: insets.top + 52 }]}>
          {current.uri ? <Image source={{ uri: current.uri }} style={{ width: 26, height: 26, borderRadius: 13 }} /> : null}
          <Text style={[t.captionStrong, { color: c.white }]}>{starring}</Text>
        </View>
      </View>
      <View style={[styles.navFloat, { top: insets.top }]}>
        <KCircleButton icon="x" tone="video" size={36} onPress={() => d({ type: "pop" })} label="Close" />
        <Text style={[t.headline, { color: c.white }, tk.textShadow]} numberOfLines={1}>
          {effect ?? "Remix"}
        </Text>
        <CreditsChip onVideo />
      </View>

      {/* 剧情一句话 + 风格:全程可以不打字 */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: kb.open ? 8 : 206 + insets.bottom }}>
        <View style={styles.promptChip}>
          <Icon name="pencil" size={14} color={c.white} strokeWidth={2.2} />
          <TextInput value={story} onChangeText={setStory} placeholder="Change the story (optional)" placeholderTextColor={c.text3} style={styles.promptInput} accessibilityLabel="Change the story" />
          <Pressable onPress={() => setStory(STORIES[(STORIES.indexOf(story) + 1) % STORIES.length])} hitSlop={8} accessibilityRole="button">
            <Text style={[t.captionStrong, { color: c.primary }]}>Shuffle</Text>
          </Pressable>
        </View>
        {!kb.open ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginTop: 10 }}>
            {STYLES.map((x) => (
              <Pressable key={x} onPress={() => setStyle(x)} accessibilityRole="button" accessibilityState={{ selected: style === x }} style={[styles.styleChip, style === x && { backgroundColor: c.white }]}>
                <Text style={[t.captionStrong, { color: style === x ? "#000" : c.white }]}>{x}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* 主角轮盘:选中的放大在中间，外圈品牌渐变，点它就生成 */}
      {!kb.open ? (
        <>
          <View style={[styles.carousel, { bottom: 52 + insets.bottom }]}>
            {people.map((x) => {
              const on = x.id === cast;
              return (
                <Pressable key={x.id} onPress={() => pick(x.id)} style={{ alignItems: "center", gap: 6, width: on ? 92 : 58 }} accessibilityRole="button" accessibilityLabel={on ? `Generate, ${GEN_COST} credits` : `Cast ${x.label}`}>
                  {on ? (
                    <Animated.View style={{ transform: [{ scale }] }}>
                      <View style={styles.shutter}>
                        <Gradient colors={BRAND} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />
                        <View style={styles.shutterInner}>{x.uri ? <Image source={{ uri: x.uri }} style={{ width: 66, height: 66, borderRadius: 33 }} /> : null}</View>
                      </View>
                    </Animated.View>
                  ) : (
                    <View>
                      <View style={styles.lens}>{x.uri ? <Image source={{ uri: x.uri }} style={{ width: 48, height: 48, borderRadius: 24 }} /> : <Icon name={x.icon!} size={22} color={c.white} strokeWidth={2.2} />}</View>
                      {x.badge ? (
                        <View style={styles.lensBadge}>
                          <Text style={styles.lensBadgeText}>{x.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                  <Text style={[t.micro, { color: on ? c.white : c.text2 }]}>{x.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.shutterHint, { bottom: 22 + insets.bottom }]}>Tap the big circle to generate · {GEN_COST} credits · about 40s</Text>
        </>
      ) : (
        <View style={{ position: "absolute", right: 16, bottom: 60 }}>
          <KButton label="Generate" variant="cta" size="m" onPress={generate} />
        </View>
      )}
    </View>
  );
}

/* ---------- Create(底部栏「Create」) ---------- */

export function Play() {
  const { s, d } = useV2();
  const insets = useInsets();
  const kb = useKeyboard();
  const credits = useCredits();
  const v1 = useV1Routes();
  const [text, setText] = useState("");
  const [w, setW] = useState(0);
  const colW = w ? (w - 16 * 2 - 8 * 2) / 3 : 0;
  const live = CHALLENGES.find((x) => x.live)!;
  const go = () => {
    if (!text.trim()) return;
    if (credits < GEN_COST) {
      v1.paywall();
      return;
    }
    d({ type: "generate", postId: "dreamcore", title: text.trim(), prompt: text.trim(), withTwin: false });
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.page }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={[styles.bar, { paddingTop: insets.top }]}>
        <KCircleButton icon="x" size={36} onPress={() => d({ type: "pop" })} label="Close" />
        <Text style={[t.headline, { color: c.text }]}>Create</Text>
        <CreditsChip />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: kb.open ? 16 : insets.bottom + 24 }}>
        {/* 热门:像滤镜货架，最上面就是能直接玩的东西 */}
        <View style={styles.sectionRow}>
          <Text style={[t.title, { color: c.text }]}>Trending now</Text>
          <Text style={[t.caption, { color: c.text3 }]}>Tap one to remix</Text>
        </View>
        {colW ? (
          <View style={styles.effects}>
            {EFFECTS.map((e) => {
              const fr = friendsOn(e.postId);
              return (
                <Pressable key={e.id} onPress={() => d({ type: "push", route: { name: "remix", postId: e.postId, effect: e.name } })} accessibilityLabel={e.name} style={({ pressed }) => [{ width: colW }, pressed && { opacity: 0.8 }]}>
                  <View style={[styles.effectImg, { height: colW * 1.4 }]}>
                    <Image source={{ uri: poster(e.postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    {e.tag ? (
                      <View style={{ position: "absolute", left: 4, top: 4 }}>
                        <KTag label={e.tag} tone={e.tag === "New" ? "success" : "primary"} />
                      </View>
                    ) : null}
                    {fr.length ? (
                      <View style={{ position: "absolute", right: 4, bottom: 4 }}>
                        <Stack uris={fr.slice(0, 2).map((f) => f.avatar)} size={18} ring="rgba(0,0,0,0.6)" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[t.captionStrong, { color: c.text, marginTop: 6 }]} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text style={[t.micro, { fontWeight: "400", color: c.text3 }]}>{fmt(e.uses)} made</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* 分身 + 挑战:两张横卡 */}
        <View style={{ marginTop: 20, marginHorizontal: 16, gap: 8 }}>
          <Pressable onPress={() => d({ type: "push", route: { name: "twin" } })} style={styles.card} accessibilityRole="button">
            <Avatar id="me" size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[t.bodyStrong, { color: c.text }]}>{s.twin === "ready" ? "Your Twin is ready" : "Create your Twin"}</Text>
              <Text style={[t.caption, { color: c.text3, marginTop: 2 }]}>{s.twin === "ready" ? "Pick “Me” in any remix to star in it" : "Put yourself in any video · +50 credits"}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={c.text4} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={() => d({ type: "push", route: { name: "challenge", id: live.id } })} style={styles.card} accessibilityRole="button">
            <Image source={{ uri: poster(live.cover) }} style={{ width: 44, height: 44, borderRadius: tk.radius.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={[t.bodyStrong, { color: c.text }]}>{live.title}</Text>
              <Text style={[t.caption, { color: c.text3, marginTop: 2 }]} numberOfLines={1}>
                {fmt(live.entries)} entries · {live.reward}
              </Text>
            </View>
            <KTag label="Live" tone="success" />
          </Pressable>
        </View>

        {/* 自由输入:放在下面，给想从零开始的人 */}
        <Text style={[t.captionStrong, { color: c.text3, marginHorizontal: 16, marginTop: 24, marginBottom: 8 }]}>Or start from scratch</Text>
        <View style={styles.free}>
          <TextInput value={text} onChangeText={setText} placeholder="Describe a video you'd love to see" placeholderTextColor={c.text3} multiline style={styles.input} accessibilityLabel="Describe your video" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <KCircleButton icon="images" size={36} onPress={() => d({ type: "toast", text: "Photo picker opens here" })} label="Add a photo" />
            <KCircleButton icon="scan-face" size={36} onPress={() => (s.twin === "ready" ? d({ type: "toast", text: "Your Twin will star in this video" }) : d({ type: "push", route: { name: "twin" } }))} label="Star in it" />
            <View style={{ flex: 1 }} />
            <KButton label={`Generate · ${GEN_COST}`} variant="cta" size="m" disabled={!text.trim()} onPress={go} />
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <KListRow leading={<KRowIcon icon="sliders-horizontal" color={c.raised} />} title="Pro mode" sub="Pick models and settings, make ads with the Agent" chevron onPress={() => d({ type: "toast", text: "Pro mode opens the Marketing Agent" })} />
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- 生成中 → 成品(在这里直接发布) ---------- */

const TIPS = ["Setting up the scene", "Teaching everyone their moves", "Rolling camera", "Adding the finishing touches"];

type Target = "tiktok" | "instagram" | "whatsapp" | "save";

export function Result({ jobId }: { jobId: string }) {
  const { s, d } = useV2();
  const insets = useInsets();
  const kb = useKeyboard();
  const job = s.jobs.find((j) => j.id === jobId);
  const src = job ? post(job.postId) : post("poodle");
  const friends = friendsOn(src.id);
  const [caption, setCaption] = useState(() => `My version 👀${friends.length ? ` @${friends[0].name.toLowerCase()} your turn` : ""}`);
  const [picked, setPicked] = useState<Target[]>(["tiktok"]);
  const pulse = useState(() => new Animated.Value(0))[0];
  const orbScale = useMemo(() => pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }), [pulse]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }), Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false })]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  if (!job) return <View style={{ flex: 1, backgroundColor: c.page }} />;
  const pct = Math.round(job.progress * 100);
  // 每项奖励每天一次:今天已经拿过的不再显示 +N
  const due = (k: "firstPost" | "shareTikTok" | "shareInstagram") => !s.claimed.includes(k);
  const reward = (k: Target) => (k === "tiktok" && due("shareTikTok") ? 30 : k === "instagram" && due("shareInstagram") ? 30 : 0);
  const earn = (due("firstPost") ? MISSIONS.find((m) => m.id === "firstPost")!.reward : 0) + picked.reduce((n, k) => n + reward(k), 0);
  const toggle = (k: Target) => setPicked((x) => (x.includes(k) ? x.filter((v) => v !== k) : [...x, k]));
  const targets: { id: Target; label: string; icon: ReactNode }[] = [
    { id: "tiktok", label: "TikTok", icon: <BrandIcon brand="tiktok" size={44} style={{ borderRadius: 22 }} /> },
    { id: "instagram", label: "Reels", icon: <BrandIcon brand="instagram" size={44} style={{ borderRadius: 22 }} /> },
    { id: "whatsapp", label: "WhatsApp", icon: <BrandIcon brand="whatsapp" size={44} style={{ borderRadius: 22 }} /> },
    { id: "save", label: "Save", icon: <View style={styles.saveCircle}><Icon name="download" size={20} color={c.white} strokeWidth={2.2} /></View> },
  ];

  if (job.status === "running")
    return (
      <View style={{ flex: 1, backgroundColor: c.black }}>
        <Image source={{ uri: poster(job.postId) }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} blurRadius={24} resizeMode="cover" />
        <View style={styles.genCenter}>
          <Animated.View style={[styles.genOrb, { transform: [{ scale: orbScale }] }]}>
            <Gradient colors={BRAND} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={styles.genOrbInner}>{job.withTwin ? <Avatar id="me" size={96} /> : <Image source={{ uri: poster(job.postId) }} style={{ width: 96, height: 96, borderRadius: 48 }} />}</View>
          </Animated.View>
          <Text style={styles.genPct}>{pct}%</Text>
          <Text style={[t.title, { color: c.white }]}>Making your version</Text>
          <Text style={[t.body, { color: c.text2 }]}>{TIPS[Math.min(TIPS.length - 1, Math.floor(job.progress * TIPS.length))]}</Text>
          {friends.length ? (
            <View style={styles.genFriends}>
              <Face uri={friends[0].avatar} size={24} />
              <Text style={[t.caption, { color: c.text2, flex: 1 }]}>
                <Text style={{ color: c.white, fontWeight: "600" }}>{friends[0].name}&apos;s version</Text> got 2.1K likes. Yours is next.
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 8 }}>
          <Text style={[t.caption, { color: c.text3, textAlign: "center" }]}>Keep scrolling. We&apos;ll ping you when it&apos;s ready.</Text>
          <KButton label="Keep scrolling" variant="secondary" onPress={() => d({ type: "popToRoot" })} />
        </View>
        <View style={[styles.navFloat, { top: insets.top }]}>
          <KCircleButton icon="chevron-left" tone="video" size={36} onPress={() => d({ type: "popToRoot" })} label="Back" />
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: c.black }}>
      <View style={[styles.preview, { bottom: kb.open ? 220 : 292 + insets.bottom }]}>
        <Stage id={resultOf(job)}>
          <MediaVideo uri={video(resultOf(job))} poster={poster(resultOf(job))} style={StyleSheet.absoluteFill} />
        </Stage>
        {/* 原版小窗:固定在左上，「原版 vs 我的」 */}
        <View style={[styles.pip, { top: insets.top + 52 }]}>
          <Image source={{ uri: poster(src.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={styles.pipLabel}>
            <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>Original</Text>
          </View>
        </View>
        {/* 水印:分享出去的视频都带，回流新用户 */}
        <View style={styles.watermark}>
          <Image source={{ uri: "/prototypes/buzzvideo-app/app-logo.svg" }} style={{ width: 14, height: 14 }} />
          <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>Made with BuzzVideo</Text>
        </View>
      </View>
      <View style={[styles.navFloat, { top: insets.top }]}>
        <KCircleButton icon="x" tone="video" size={36} onPress={() => d({ type: "popToRoot" })} label="Close, keep as draft" />
        <Pressable onPress={() => d({ type: "push", route: { name: "remix", postId: job.postId } })} style={[styles.pill, { height: 32, backgroundColor: c.onVideo }]} accessibilityRole="button">
          <Icon name="rotate-ccw" size={14} color={c.white} strokeWidth={2.2} />
          <Text style={styles.pillText}>Try another</Text>
        </Pressable>
      </View>

      <View style={[styles.resultPanel, { paddingBottom: kb.open ? 8 : insets.bottom + 8 }]}>
        <View style={styles.captionBox}>
          <TextInput value={caption} onChangeText={setCaption} multiline style={[t.body, styles.captionInput]} accessibilityLabel="Caption" />
          <Pressable onPress={() => setCaption((x) => `${x} @max`)} style={styles.atBtn} accessibilityLabel="Mention a friend">
            <Icon name="at-sign" size={16} color={c.white} strokeWidth={2.2} />
          </Pressable>
        </View>
        {!kb.open ? (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
              {targets.map((x) => {
                const on = picked.includes(x.id);
                const r = reward(x.id);
                return (
                  <Pressable key={x.id} onPress={() => toggle(x.id)} style={{ alignItems: "center", gap: 6, width: 72 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={x.label}>
                    <View style={[styles.targetRing, on && { borderColor: c.primary }]}>{x.icon}</View>
                    {r ? (
                      <View style={styles.bonus}>
                        <Text style={styles.bonusText}>+{r}</Text>
                      </View>
                    ) : null}
                    <Text style={[t.micro, { color: on ? c.white : c.text3 }]}>{x.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: 14 }}>
              <KButton
                label={earn ? `Post & earn ${earn} credits` : "Post"}
                variant="cta"
                onPress={() => {
                  if (picked.includes("save")) d({ type: "toast", text: "Saved to Photos" });
                  d({ type: "publish", jobId, caption: caption.trim() || "My new video", to: picked.filter((x): x is "tiktok" | "instagram" => x === "tiktok" || x === "instagram") });
                }}
              />
            </View>
            <Text style={[t.caption, { color: c.text3, textAlign: "center", marginTop: 8 }]} numberOfLines={1}>
              {friends.length ? `${friends.map((f) => f.name).join(", ")} will see it first. They made this too.` : "Your followers see it first."}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, minHeight: 52 },
  navFloat: { position: "absolute", left: 12, right: 12, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 20 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 10, borderRadius: 999 },
  pillText: { color: c.white, fontSize: 12, fontWeight: "700" },
  tplCover: { width: 112, height: 150, borderRadius: tk.radius.md, overflow: "hidden", backgroundColor: c.surface },
  tplPlay: { position: "absolute", left: 6, bottom: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: c.onVideo, alignItems: "center", justifyContent: "center" },
  friendsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, padding: 12, borderRadius: tk.radius.md, backgroundColor: c.surface },
  cell: { overflow: "hidden", backgroundColor: c.surface },
  cellFoot: { position: "absolute", left: 6, right: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  friendTag: { position: "absolute", left: 6, top: 6, height: 18, paddingHorizontal: 6, borderRadius: 4, backgroundColor: "rgba(255,94,26,0.92)", justifyContent: "center" },
  youPlus: { position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, borderWidth: 2, borderColor: c.surface, alignItems: "center", justifyContent: "center" },
  stickyFoot: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: "rgba(18,18,18,0.96)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  preview: { position: "absolute", left: 0, right: 0, top: 0, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden", backgroundColor: "#111" },
  swapBadge: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, height: 36, paddingLeft: 5, paddingRight: 14, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)" },
  promptChip: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, height: 44, paddingHorizontal: 14, borderRadius: tk.radius.md, backgroundColor: "rgba(0,0,0,0.6)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.25)" },
  promptInput: { flex: 1, ...t.bodyStrong, color: c.white, outlineStyle: "none" } as object,
  styleChip: { height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center" },
  carousel: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  lens: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },
  lensBadge: { position: "absolute", right: -6, top: -4, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: c.primary, justifyContent: "center", borderWidth: 2, borderColor: c.black },
  lensBadgeText: { color: c.white, fontSize: 10, fontWeight: "800" },
  shutter: { width: 86, height: 86, borderRadius: 43, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  shutterHint: { position: "absolute", left: 0, right: 0, textAlign: "center", color: c.text3, fontSize: 12, fontWeight: "500" },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  effects: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, rowGap: 14 },
  effectImg: { borderRadius: tk.radius.sm, overflow: "hidden", backgroundColor: c.surface },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: tk.radius.md, backgroundColor: c.surface },
  free: { marginHorizontal: 16, padding: 12, borderRadius: tk.radius.md, backgroundColor: c.surface },
  input: { ...t.body, color: c.text, minHeight: 56, maxHeight: 96, outlineStyle: "none" } as object,
  genCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 24 },
  genOrb: { width: 120, height: 120, borderRadius: 60, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  genOrbInner: { width: 108, height: 108, borderRadius: 54, backgroundColor: "#000", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  genPct: { fontSize: 40, lineHeight: 46, fontWeight: "800", color: c.white },
  genFriends: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, padding: 12, borderRadius: tk.radius.md, backgroundColor: "rgba(30,30,30,0.9)", alignSelf: "stretch" },
  pip: { position: "absolute", left: 12, width: 76, height: 104, borderRadius: tk.radius.md, overflow: "hidden", borderWidth: 2, borderColor: c.white },
  pipLabel: { position: "absolute", left: 0, right: 0, bottom: 0, height: 18, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  watermark: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.35)" },
  resultPanel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14 },
  captionBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: tk.radius.md, backgroundColor: c.surface },
  captionInput: { flex: 1, color: c.white, minHeight: 40, maxHeight: 64, outlineStyle: "none" } as object,
  atBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center" },
  targetRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  saveCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center" },
  bonus: { position: "absolute", top: -4, right: 2, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: c.primary, justifyContent: "center", borderWidth: 2, borderColor: c.black },
  bonusText: { color: c.white, fontSize: 10, fontWeight: "800" },
});
