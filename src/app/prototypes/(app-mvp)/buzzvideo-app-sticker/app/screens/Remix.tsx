import { useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { GZButton, GZChip, GZIconButton, GZListRow, GZPhoto, GZSegmented, GZSticker, gz } from "../../kit/gz";
import { CHALLENGES, EFFECTS, GEN_COST, MISSIONS, creator, fmt, friendsOn, post, poster, resultOf, versionsOf, video } from "../data";
import { BonusSticker, Foot, Hairline, RowIcon, Scrim, Tag } from "../parts";
import { useCredits, useV2, type JobS } from "../store";
import { Avatar, CreditsChip, Face, Stack, Stage, useV1Routes } from "../ui";
import { BrandIcon, Icon, MediaVideo, USER, useInsets, useKeyboard, type IconName } from "../v1";

const c = gz.color;

/* ---------- 同款页:一个「梗」的原版 + 所有人的版本 ---------- */

const VERSION_TABS: { id: string; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "friends", label: "Friends" },
  { id: "new", label: "New" },
];

export function Template({ postId }: { postId: string }) {
  const { d } = useV2();
  const insets = useInsets();
  const p = post(postId);
  const friends = friendsOn(postId);
  const [tab, setTab] = useState(friends.length ? "friends" : "top");
  const [w, setW] = useState(0);
  const all = versionsOf(postId);
  const list = tab === "friends" ? all.filter((v) => v.friend) : tab === "new" ? [...all].reverse() : [...all].sort((a, b) => b.likes - a.likes);
  const cw = w ? (w - 32 - 6) / 3 : 0;
  const remix = () => d({ type: "push", route: { name: "remix", postId } });
  const tabs = VERSION_TABS.filter((x) => x.id !== "friends" || friends.length);
  return (
    <View style={{ flex: 1, backgroundColor: c.page }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* 原版做成一张白边照片贴纸，歪着贴;右边是这个梗的名字和数据 */}
        <View style={{ paddingTop: insets.top + 60, paddingHorizontal: 18, paddingBottom: 18, flexDirection: "row", gap: 18 }}>
          <Pressable onPress={() => d({ type: "push", route: { name: "post", postId } })} accessibilityLabel="Play the original" style={({ pressed }) => [pressed && { transform: [{ scale: 0.97 }] }]}>
            <GZPhoto uri={poster(postId)} w={112} h={150} rotate={-5} radius={14}>
              <View style={styles.tplPlay}>
                <Icon name="play" size={14} color={c.white} fill={c.white} strokeWidth={1} />
              </View>
            </GZPhoto>
          </Pressable>
          <View style={{ flex: 1, justifyContent: "flex-end", gap: 7 }}>
            <Text style={[gz.display.title, { color: c.white }]} numberOfLines={3}>
              {p.caption}
            </Text>
            <Pressable onPress={() => d({ type: "push", route: { name: "profile", userId: p.author } })} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Avatar id={p.author} size={20} />
              <Text style={[gz.body.caption, { color: c.text2 }]}>Original by {creator(p.author).name}</Text>
            </Pressable>
            <Text style={[gz.body.caption, { color: c.text3 }]}>
              {fmt(p.remixes)} remixes · {fmt(p.likes * 40)} views · <Text style={{ color: c.lime, fontWeight: "600" }}>+{fmt(Math.round(p.remixes / 11))} today</Text>
            </Text>
          </View>
        </View>

        {friends.length ? (
          <View style={styles.friendsRow}>
            <Stack uris={friends.map((f) => f.avatar)} size={28} ring={c.page} />
            <Text style={[gz.body.caption, { color: c.text2, flex: 1 }]}>
              <Text style={{ color: c.white, fontWeight: "600" }}>{friends.slice(0, 2).map((f) => f.name.toLowerCase()).join(", ")}</Text>
              {friends.length > 2 ? ` and ${friends.length - 2} more friend` : ""} made this
            </Text>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <GZSegmented options={tabs.map((x) => x.label)} value={tabs.find((x) => x.id === tab)?.label ?? "Top"} onChange={(label) => setTab(tabs.find((x) => x.label === label)!.id)} />
        </View>
        {cw ? (
          <View style={styles.grid}>
            {/* 第一格永远留给「你」 */}
            <Pressable onPress={remix} style={({ pressed }) => [styles.cell, { width: cw, height: cw * 1.4, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: c.surface }, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel="Make your version">
              <View>
                <Avatar id="me" size={54} />
                <View style={styles.youPlus}>
                  <Icon name="plus" size={14} color={c.white} strokeWidth={3.2} />
                </View>
              </View>
              <Text style={[gz.display.label, { color: c.white }]}>Your turn</Text>
            </Pressable>
            {list.map((v, i) => (
              <Pressable key={v.postId + i} onPress={() => d({ type: "push", route: { name: "post", postId: v.postId, list: list.map((x) => x.postId) } })} style={({ pressed }) => [styles.cell, { width: cw, height: cw * 1.4 }, pressed && { opacity: 0.85 }]} accessibilityLabel={`${v.by}'s version`}>
                <Image source={{ uri: poster(v.postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Scrim edge="bottom" height={56} strength={0.55} />
                {v.friend ? (
                  <View style={{ position: "absolute", left: 5, top: 6 }}>
                    <GZSticker label="Friend" color="lime" size="s" rotate={-4} />
                  </View>
                ) : null}
                <View style={styles.cellFoot}>
                  <Face uri={v.avatar} size={16} />
                  <Text style={[gz.body.micro, { color: c.white, flex: 1 }, gz.textShadow]} numberOfLines={1}>
                    {v.by.toLowerCase()}
                  </Text>
                  <Icon name="heart" size={11} color={c.white} fill={c.white} strokeWidth={1} />
                  <Text style={[gz.display.tiny, { color: c.white }, gz.textShadow]}>{fmt(v.likes)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.navFloat, { top: insets.top + 4 }]}>
        <GZIconButton icon="chevron-left" size={36} onPress={() => d({ type: "pop" })} label="Back" />
        <GZIconButton icon="share" size={36} onPress={() => d({ type: "sheet", sheet: { name: "share", postId } })} label="Share" />
      </View>
      <Foot bottom={insets.bottom + 12}>
        <GZButton label="Remix this" icon="wand-sparkles" onPress={remix} />
      </Foot>
    </View>
  );
}

/* ---------- 做同款:主角轮盘(像拍照选滤镜)，大圆就是快门 ---------- */

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
  const people: { id: string; label: string; uri?: string; icon?: IconName; badge?: number }[] = [
    { id: "orig", label: "Original", uri: poster(postId) },
    ...(p.cast ? [{ id: "me", label: "Me", uri: USER.avatar, badge: s.twin === "ready" ? undefined : 50 }, { id: "pet", label: "My pet", uri: poster("collie") }] : []),
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
  const starring = cast === "orig" ? "Keep the original star" : cast === "me" ? "Starring you" : cast === "pet" ? "Starring your pet" : "Starring your photo";
  return (
    <View style={{ flex: 1, backgroundColor: c.black }}>
      <View style={[styles.preview, { bottom: kb.open ? 120 : 236 + insets.bottom, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}>
        <Stage id={postId}>
          <MediaVideo uri={video(postId)} poster={poster(postId)} style={StyleSheet.absoluteFill} />
        </Stage>
        <Scrim edge="top" height={140} strength={0.4} />
        {/* 现在谁出演:一颗白色贴纸，换人时重新啪地贴上 */}
        <View style={{ position: "absolute", top: insets.top + 56, alignSelf: "center" }}>
          <GZSticker key={cast} label={starring} color="white" rotate={-3} slap />
        </View>
      </View>
      <View style={[styles.navFloat, { top: insets.top + 2 }]}>
        <GZIconButton icon="x" onVideo size={36} onPress={() => d({ type: "pop" })} label="Close" />
        {effect ? (
          <Text style={[gz.display.head, { color: c.white, flexShrink: 1, marginHorizontal: 8 }, gz.textShadow]} numberOfLines={1}>
            {effect}
          </Text>
        ) : null}
        <CreditsChip onVideo />
      </View>

      {/* 剧情一句话 + 风格:全程可以不打字 */}
      <View style={{ position: "absolute", left: 16, right: 16, bottom: kb.open ? 8 : 186 + insets.bottom, gap: 10 }}>
        <View style={styles.promptChip}>
          <Icon name="pencil" size={16} color={c.white} strokeWidth={2.4} />
          <TextInput value={story} onChangeText={setStory} placeholder="Change the story (optional)" placeholderTextColor={c.text3} style={styles.promptInput} accessibilityLabel="Change the story" />
          <Pressable onPress={() => setStory(STORIES[(STORIES.indexOf(story) + 1) % STORIES.length])} hitSlop={8} accessibilityRole="button">
            <Text style={[gz.display.label, { color: c.lime }]}>Shuffle</Text>
          </Pressable>
        </View>
        {!kb.open ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STYLES.map((x) => (
              <GZChip key={x} label={x} on={style === x} color="white" onPress={() => setStyle(x)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* 主角轮盘:选中的放大在中间(白圈 + 黑缝，静止不呼吸)，点它就生成 */}
      {!kb.open ? (
        <>
          <View style={[styles.carousel, { bottom: 48 + insets.bottom }]}>
            {people.map((x) => {
              const on = x.id === cast;
              return (
                <Pressable key={x.id} onPress={() => pick(x.id)} style={({ pressed }) => [{ alignItems: "center", gap: 6, width: on ? 92 : 60 }, pressed && { transform: [{ scale: 0.95 }] }]} accessibilityRole="button" accessibilityLabel={on ? `Generate, ${GEN_COST} credits` : `Cast ${x.label}`}>
                  {on ? (
                    <View style={styles.shutter}>
                      <View style={styles.shutterInner}>{x.uri ? <Image source={{ uri: x.uri }} style={{ width: 70, height: 70, borderRadius: 35 }} /> : null}</View>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.lens}>{x.uri ? <Image source={{ uri: x.uri }} style={{ width: 54, height: 54 }} /> : <Icon name={x.icon!} size={22} color={c.white} strokeWidth={2.6} />}</View>
                      {x.badge ? <BonusSticker n={x.badge} style={{ top: -6, right: -12 }} /> : null}
                    </View>
                  )}
                  <Text style={[gz.display.tiny, { color: on ? c.white : c.text3 }]}>{x.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[gz.body.caption, styles.shutterHint, { bottom: 20 + insets.bottom }]}>Tap the big circle to generate · {GEN_COST} credits · about 40s</Text>
        </>
      ) : (
        <View style={{ position: "absolute", right: 16, bottom: 60 }}>
          <GZButton label="Generate" size="m" onPress={generate} />
        </View>
      )}
    </View>
  );
}

/* ---------- Create(旧的创作页):热门效果货架 + 分身 / 挑战 + 自由输入 ---------- */

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
        <GZIconButton icon="x" size={36} onPress={() => d({ type: "pop" })} label="Close" />
        <Text style={[gz.display.head, { color: c.white }]}>Create</Text>
        <CreditsChip />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: kb.open ? 16 : insets.bottom + 24 }}>
        {/* 热门:像滤镜货架，最上面就是能直接玩的东西。每格最多一颗贴纸(朋友做过 > Hot / New) */}
        <View style={styles.sectionRow}>
          <Text style={[gz.display.title, { color: c.white }]}>Trending now</Text>
          <Text style={[gz.body.caption, { color: c.text3 }]}>Tap one to remix</Text>
        </View>
        {colW ? (
          <View style={styles.effects}>
            {EFFECTS.map((e) => {
              const fr = friendsOn(e.postId);
              const sticker = fr.length ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Stack uris={fr.slice(0, 2).map((f) => f.avatar)} size={18} />
                </View>
              ) : e.tag === "Hot" ? (
                <GZSticker label="Hot" color="orange" icon="flame" size="s" rotate={-4} />
              ) : e.tag === "New" ? (
                <GZSticker label="New" color="lime" size="s" rotate={-4} />
              ) : null;
              return (
                <Pressable key={e.id} onPress={() => d({ type: "push", route: { name: "remix", postId: e.postId, effect: e.name } })} accessibilityLabel={e.name} style={({ pressed }) => [{ width: colW }, pressed && { opacity: 0.8 }]}>
                  <View style={[styles.effectImg, { height: colW * 1.4 }]}>
                    <Image source={{ uri: poster(e.postId) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </View>
                  {sticker ? <View style={{ position: "absolute", left: 5, top: 6 }}>{sticker}</View> : null}
                  <Text style={[gz.display.label, { color: c.white, marginTop: 7 }]} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text style={[gz.body.micro, { fontWeight: "400", color: c.text3, marginTop: 1 }]}>{fr.length ? `${fr[0].name.toLowerCase()} + ${fmt(e.uses)} made` : `${fmt(e.uses)} made`}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* 分身 + 挑战:两行列表(不包灰卡片) */}
        <View style={{ marginTop: 18 }}>
          <GZListRow
            leading={<Avatar id="me" size={44} />}
            title={<Text style={{ fontWeight: "600" }}>{s.twin === "ready" ? "Your Twin is ready" : "Create your Twin"}</Text>}
            sub={s.twin === "ready" ? "Pick “Me” in any remix to star in it" : "Put yourself in any video · +50 credits"}
            right={<Icon name="chevron-right" size={18} color={c.text3} strokeWidth={2.4} />}
            onPress={() => d({ type: "push", route: { name: "twin" } })}
          />
          <Hairline inset={72} />
          <GZListRow
            leading={<Image source={{ uri: poster(live.cover) }} style={{ width: 44, height: 44, borderRadius: 10 }} />}
            title={<Text style={{ fontWeight: "600" }}>{live.title}</Text>}
            sub={`${fmt(live.entries)} entries · ${live.reward}`}
            right={<Tag label="Live" color="lime" />}
            onPress={() => d({ type: "push", route: { name: "challenge", id: live.id } })}
          />
        </View>

        {/* 自由输入:放在下面，给想从零开始的人 */}
        <Text style={[gz.display.label, { color: c.text3, marginHorizontal: 16, marginTop: 22, marginBottom: 8 }]}>Or start from scratch</Text>
        <View style={styles.free}>
          <TextInput value={text} onChangeText={setText} placeholder="Describe a video you'd love to see" placeholderTextColor={c.text3} multiline style={styles.input} accessibilityLabel="Describe your video" />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <GZIconButton icon="images" size={36} onPress={() => d({ type: "toast", text: "Photo picker opens here" })} label="Add a photo" />
            <GZIconButton icon="scan-face" size={36} onPress={() => (s.twin === "ready" ? d({ type: "toast", text: "Your Twin will star in this video" }) : d({ type: "push", route: { name: "twin" } }))} label="Star in it" />
            <View style={{ flex: 1 }} />
            <GZButton label={`Generate · ${GEN_COST}`} size="m" disabled={!text.trim()} onPress={go} />
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <GZListRow leading={<RowIcon icon="sliders-horizontal" />} title={<Text style={{ fontWeight: "600" }}>Pro mode</Text>} sub="Pick models and settings, make ads with the Agent" right={<Icon name="chevron-right" size={18} color={c.text3} strokeWidth={2.4} />} onPress={() => d({ type: "toast", text: "Pro mode opens the Marketing Agent" })} />
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
  // 剪辑器导出的是用户自己的片子：不预填「我的版本」那套做同款文案
  const edited = (job as JobS | undefined)?.fromEdit;
  const [caption, setCaption] = useState(() => (edited ? "" : `My version 👀${friends.length ? ` @${friends[0].name.toLowerCase()} your turn` : ""}`));
  // 同步到外部平台是可选的，默认不勾、没有奖励(激励只给在 BuzzVideo 公开发布)
  const [picked, setPicked] = useState<Target[]>([]);
  // 谁能看：公开(进 For You,有积分)/ 仅自己(只在「我的 › 作品」里，带锁)
  const [only, setOnly] = useState(false);
  if (!job) return <View style={{ flex: 1, backgroundColor: c.page }} />;
  const pct = Math.round(job.progress * 100);
  // 每项奖励每天一次:今天已经拿过的不再显示 +N
  // 激励只给「在 BuzzVideo 公开发布」(For You 里的视频都是用户真实发布的):每天第一条 +N;分享到外部平台没有奖励
  const earn = !s.claimed.includes("firstPost") ? MISSIONS.find((m) => m.id === "firstPost")!.reward : 0;
  const toggle = (k: Target) => setPicked((x) => (x.includes(k) ? x.filter((v) => v !== k) : [...x, k]));
  const targets: { id: Target; label: string; icon: ReactNode }[] = [
    { id: "tiktok", label: "TikTok", icon: <BrandIcon brand="tiktok" size={46} style={{ borderRadius: 23 }} /> },
    { id: "instagram", label: "Reels", icon: <BrandIcon brand="instagram" size={46} style={{ borderRadius: 23 }} /> },
    { id: "whatsapp", label: "WhatsApp", icon: <BrandIcon brand="whatsapp" size={46} style={{ borderRadius: 23 }} /> },
    {
      id: "save",
      label: "Save",
      icon: (
        <View style={styles.saveCircle}>
          <Icon name="download" size={20} color={c.white} strokeWidth={2.4} />
        </View>
      ),
    },
  ];

  // 生成失败：积分已退回，说清楚原因，一键重试(同样的主角和剧情)
  const failed = (job as JobS).failed;
  if (failed)
    return (
      <View style={{ flex: 1, backgroundColor: c.page }}>
        <View style={styles.genCenter}>
          <View style={{ marginBottom: 26 }}>
            <GZPhoto uri={poster(job.postId)} w={150} h={200} rotate={-4} radius={16} />
            <View style={{ position: "absolute", right: -18, top: -14 }}>
              <GZSticker label="Didn't work" color="red" rotate={8} />
            </View>
          </View>
          <Text style={[gz.display.title, { color: c.white, textAlign: "center" }]}>We couldn&apos;t make this one</Text>
          <Text style={[gz.body.body, { color: c.text2, textAlign: "center", marginTop: 6 }]}>{failed}</Text>
          <View style={{ marginTop: 14 }}>
            <GZSticker label={`${GEN_COST} credits back`} color="butter" size="s" rotate={-3} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 10 }}>
          <GZButton label="Try again" icon="rotate-ccw" onPress={() => d({ type: "generate", postId: job.postId, title: job.title, prompt: job.prompt, withTwin: job.withTwin })} />
          <GZButton label="Back to feed" variant="dark" onPress={() => d({ type: "popToRoot" })} />
        </View>
        <View style={[styles.navFloat, { top: insets.top + 2 }]}>
          <GZIconButton icon="chevron-left" size={36} onPress={() => d({ type: "popToRoot" })} label="Back" />
        </View>
      </View>
    );

  if (job.status === "running")
    return (
      <View style={{ flex: 1, backgroundColor: c.page }}>
        <View style={styles.genCenter}>
          {/* 原版照片贴纸 + (用分身时)自己的头像贴纸压在角上;不再用呼吸的光圈 */}
          <View style={{ marginBottom: 26 }}>
            <GZPhoto uri={poster(job.postId)} w={150} h={200} rotate={-4} radius={16} />
            {job.withTwin ? (
              <View style={{ position: "absolute", right: -26, bottom: -18 }}>
                <GZPhoto uri={USER.avatar} w={72} h={72} rotate={7} radius={36} />
              </View>
            ) : null}
          </View>
          <Text style={[gz.display.hero, { color: c.white, fontSize: 56, lineHeight: 56 }]}>{pct}%</Text>
          <Text style={[gz.display.title, { color: c.white, marginTop: 6 }]}>Making your version</Text>
          <Text style={[gz.body.body, { color: c.text2 }]}>{TIPS[Math.min(TIPS.length - 1, Math.floor(job.progress * TIPS.length))]}</Text>
          <View style={styles.genTrack}>
            <View style={[styles.genFill, { width: `${pct}%` }]} />
          </View>
          {friends.length ? (
            <View style={styles.genFriends}>
              <Face uri={friends[0].avatar} size={28} />
              <Text style={[gz.body.caption, { color: c.text2, flex: 1 }]}>
                <Text style={{ color: c.white, fontWeight: "600" }}>{friends[0].name}&apos;s version</Text> got 2.1K likes. Yours is next.
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 10 }}>
          <Text style={[gz.body.caption, { color: c.text3, textAlign: "center" }]}>Keep scrolling. We&apos;ll ping you when it&apos;s ready.</Text>
          <GZButton label="Keep scrolling" variant="dark" onPress={() => d({ type: "popToRoot" })} />
        </View>
        <View style={[styles.navFloat, { top: insets.top + 2 }]}>
          <GZIconButton icon="chevron-left" size={36} onPress={() => d({ type: "popToRoot" })} label="Back" />
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: c.black }}>
      <View style={[styles.preview, { bottom: kb.open ? 220 : (only ? 196 : 296) + insets.bottom, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}>
        <Stage id={resultOf(job)}>
          <MediaVideo uri={video(resultOf(job))} poster={poster(resultOf(job))} style={StyleSheet.absoluteFill} />
        </Stage>
        <Scrim edge="top" height={130} strength={0.35} />
        {/* 含 AI 镜头 / AI 转场的剪辑作品自动标「Contains AI」(审核 #7) */}
        {(job as JobS).hasAi ? (
          <View style={styles.aiLabel}>
            <GZSticker label="Contains AI" color="sky" size="s" rotate={-3} />
          </View>
        ) : null}
        {/* 水印:分享出去的视频都带，回流新用户 */}
        <View style={styles.watermark}>
          <Image source={{ uri: "/prototypes/buzzvideo-app/app-logo.svg" }} style={{ width: 14, height: 14 }} />
          <Text style={[gz.display.tiny, { color: c.white }]}>Made with BuzzVideo</Text>
        </View>
      </View>
      {/* 原版:一张白边照片贴纸，歪着贴在左上(「原版 vs 我的」);从 Create 做出来的没有原版，不显示 */}
      {job.fromCreate ? null : (
      <View style={{ position: "absolute", left: 18, top: insets.top + 56 }} pointerEvents="none">
        <GZPhoto uri={poster(src.id)} w={78} h={104} rotate={-7} radius={12}>
          <View style={{ position: "absolute", bottom: -12, left: 6 }}>
            <GZSticker label="Original" color="white" size="s" rotate={5} />
          </View>
        </GZPhoto>
      </View>
      )}
      <View style={[styles.navFloat, { top: insets.top + 2 }]}>
        <GZIconButton icon="x" onVideo size={36} onPress={() => d({ type: "popToRoot" })} label="Close, keep as draft" />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* 成品可以进剪辑器继续剪，再回来发布 */}
          {edited ? null : <GZIconButton icon="scissors" onVideo size={36} label="Edit in editor" onPress={() => d({ type: "push", route: { name: "editor", seed: "from-job", postId: resultOf(job) } })} />}
          {edited ? (
            <GZButton label="Back to edit" variant="white" size="s" icon="scissors" onPress={() => d({ type: "pop" })} />
          ) : (
            <GZButton label="Try another" variant="white" size="s" icon="rotate-ccw" onPress={() => (job.fromCreate ? d({ type: "pop" }) : d({ type: "push", route: { name: "remix", postId: job.postId } }))} />
          )}
        </View>
      </View>

      <View style={[styles.resultPanel, { paddingBottom: kb.open ? 8 : insets.bottom + 10 }]}>
        <View style={styles.captionBox}>
          <TextInput value={caption} onChangeText={setCaption} multiline placeholder="Say something about it" placeholderTextColor={c.text3} style={[gz.body.body, styles.captionInput]} accessibilityLabel="Caption" />
          <Pressable onPress={() => setCaption((x) => `${x} @max`)} style={styles.atBtn} accessibilityLabel="Mention a friend" hitSlop={6}>
            <Icon name="at-sign" size={18} color={c.sky} strokeWidth={2.6} />
          </Pressable>
        </View>
        {!kb.open ? (
          <>
            <View style={styles.whoRow}>
              <Text style={[gz.body.caption, { color: c.text3, flex: 1 }]}>Who can see this</Text>
              {[
                { v: false, label: "Everyone", icon: "globe" as const },
                { v: true, label: "Only me", icon: "lock" as const },
              ].map((x) => (
                <Pressable key={x.label} onPress={() => setOnly(x.v)} style={[styles.whoChip, only === x.v && { backgroundColor: c.white }]} accessibilityRole="radio" accessibilityState={{ checked: only === x.v }} accessibilityLabel={x.label}>
                  <Icon name={x.icon} size={13} color={only === x.v ? c.ink : c.text2} strokeWidth={2.6} />
                  <Text style={[gz.display.tiny, { color: only === x.v ? c.ink : c.text2 }]}>{x.label}</Text>
                </Pressable>
              ))}
            </View>
            {only ? null : (
            <>
            <Text style={[gz.body.caption, { color: c.text3, marginTop: 14 }]}>Also post to (optional)</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              {targets.map((x) => {
                const on = picked.includes(x.id);
                return (
                  <Pressable key={x.id} onPress={() => toggle(x.id)} style={{ alignItems: "center", gap: 6, width: 74 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={x.label}>
                    <View>
                      <View style={[styles.targetRing, on && { borderColor: c.white }]}>{x.icon}</View>
                    </View>
                    <Text style={[gz.display.tiny, { color: on ? c.white : c.text3 }]}>{x.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            </>
            )}
            <View style={{ marginTop: 16 }}>
              <GZButton
                label={only ? "Post privately" : earn ? `Post to BuzzVideo · +${earn} credits` : "Post to BuzzVideo"}
                onPress={() => {
                  if (only) {
                    d({ type: "publish", jobId, caption: caption.trim() || "My new video", to: [], private: true });
                    const editId = (job as JobS).editId;
                    if (editId) d({ type: "demo", patch: { edits: (s.edits ?? []).filter((x) => x.id !== editId) } });
                    return;
                  }
                  // 外部平台只是顺手同步，不计奖励(发布动作里不带平台，第二版的分享奖励不会触发)
                  d({ type: "publish", jobId, caption: caption.trim() || "My new video", to: [] });
                  // 剪辑作品发出去后，草稿里的剪辑工程就不用留了
                  const editId = (job as JobS).editId;
                  if (editId) d({ type: "demo", patch: { edits: (s.edits ?? []).filter((x) => x.id !== editId) } });
                  const out = targets.filter((x) => picked.includes(x.id)).map((x) => (x.id === "save" ? "Photos" : x.label));
                  if (out.length) d({ type: "toast", text: `Also sent to ${out.join(", ")}` });
                }}
              />
            </View>
            <Text style={[gz.body.caption, { color: c.text3, textAlign: "center", marginTop: 8 }]} numberOfLines={1}>
              {only ? "Only you can see it. Public posts earn credits." : friends.length && !edited ? `Goes to For You. ${friends.map((f) => f.name).join(", ")} will see it first.` : "Goes to For You. Anyone can remix it."}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, minHeight: 56 },
  whoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  whoChip: { flexDirection: "row", alignItems: "center", gap: 4, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: c.raised },
  aiLabel: { position: "absolute", left: 12, bottom: 14 },
  navFloat: { position: "absolute", left: 14, right: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 20 },
  tplPlay: { position: "absolute", left: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", paddingLeft: 2 },
  friendsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3, paddingHorizontal: 16, marginTop: 12 },
  cell: { overflow: "hidden", borderRadius: 8, backgroundColor: c.raised },
  cellFoot: { position: "absolute", left: 6, right: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  youPlus: { position: "absolute", right: -3, bottom: -3, width: 24, height: 24, borderRadius: 12, backgroundColor: c.orange, borderWidth: 2, borderColor: c.surface, alignItems: "center", justifyContent: "center" },
  preview: { position: "absolute", left: 0, right: 0, top: 0, overflow: "hidden", backgroundColor: "#111" },
  promptChip: { flexDirection: "row", alignItems: "center", gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.raised },
  promptInput: { flex: 1, ...gz.body.strong, color: c.white, outlineStyle: "none" } as object,
  carousel: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  lens: { width: 54, height: 54, borderRadius: 27, backgroundColor: c.raised, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  shutter: { width: 88, height: 88, borderRadius: 44, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 78, height: 78, borderRadius: 39, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" },
  shutterHint: { position: "absolute", left: 0, right: 0, textAlign: "center", color: c.text3 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginHorizontal: 16, marginTop: 8, marginBottom: 14 },
  effects: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, rowGap: 16 },
  effectImg: { borderRadius: 10, overflow: "hidden", backgroundColor: c.raised },
  free: { marginHorizontal: 16, padding: 12, borderRadius: 16, backgroundColor: c.raised },
  input: { ...gz.body.body, color: c.white, minHeight: 56, maxHeight: 96, outlineStyle: "none" } as object,
  genCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 24 },
  genTrack: { alignSelf: "stretch", height: 6, borderRadius: 3, backgroundColor: c.raised, overflow: "hidden", marginTop: 18, marginHorizontal: 24 },
  genFill: { height: 6, borderRadius: 3, backgroundColor: c.white },
  genFriends: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22, paddingTop: 16, alignSelf: "stretch", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  watermark: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 5, height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.35)" },
  resultPanel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14 },
  captionBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 14, paddingRight: 8, paddingVertical: 6, minHeight: 50, borderRadius: 14, backgroundColor: c.raised },
  captionInput: { flex: 1, color: c.white, minHeight: 38, maxHeight: 64, outlineStyle: "none" } as object,
  atBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  targetRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  saveCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" },
});
