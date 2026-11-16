"use client";

/**
 * 第二版 · 社交 APP 资深设计师视角(探索稿)。
 * 底子沿用组件库(TikTok 风格 token 和 K* 组件)，加的是社交产品的「增长回路」:
 * 看到 → 发现朋友也在做 → 一秒进同款 → 像加滤镜一样换主角 → 成品拿出去炫(带水印回流) → 有人做了你的同款 → 回来。
 * 手机屏内用 React Native(和其他 APP 原型一致)，外面的说明用 Tailwind。
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { poster, video } from "../v2/data";
import { KAvatar, KButton, KCredits, KFeedHeader, KIconTabs, KProgress, KRailAction, KRailAvatar, KRemixDisc, KStreak, KTabBar, TAB_BAR_H } from "../v2/kit/components";
import { tk } from "../v2/kit/tokens";
import { BrandIcon, Gradient, Icon, MediaVideo, type IconName } from "../v2/v1";

const W = 390;
const H = 844;
const BAR = TAB_BAR_H + 34;
const ME = "/prototypes/buzzvideo-app/avatar.jpg";
const c = tk.color;
const t = tk.type;
const BRAND = ["#FFA73C", "#FF5255"];
/** 朋友头像(用作品封面当头像，和原型其他地方一致) */
const FRIENDS = { lily: poster("museum"), max: poster("skate"), kai: poster("scooter"), zoe: poster("alice"), ben: poster("cityjump") };

/* ───────────────────────── 小积木 ───────────────────────── */

/** 叠在一起的头像:社交证明的最小单位 */
function Stack({ uris, size = 22, ring = "#000" }: { uris: string[]; size?: number; ring?: string }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {uris.map((u, i) => (
        <Image key={i} source={{ uri: u }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: ring, marginLeft: i ? -size * 0.35 : 0 }} />
      ))}
    </View>
  );
}

/** 品牌渐变描边的头像(朋友有新作品，像故事圈) */
function RingAvatar({ uri, size = 60, seen }: { uri: string; size?: number; seen?: boolean }) {
  return (
    <View style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {seen ? <View style={[StyleSheet.absoluteFill, { backgroundColor: c.line }]} /> : <Gradient colors={BRAND} angle={135} style={StyleSheet.absoluteFill} />}
      <View style={{ width: size + 2, height: size + 2, borderRadius: (size + 2) / 2, backgroundColor: c.page, alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri }} style={{ width: size - 2, height: size - 2, borderRadius: size / 2 }} />
      </View>
    </View>
  );
}

/** 火苗连续天数(Snapchat 式):名字旁、通知里、发布后都出现，是「回来」的理由 */
function Flame({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Icon name="flame" size={size + 3} color="#FF7A1A" fill="#FFB01A" strokeWidth={1.5} />
      <Text style={{ color: c.white, fontSize: size, fontWeight: "800" }}>{n}</Text>
    </View>
  );
}

/** 压在视频上的小胶囊 */
const Pill = ({ children, bg = c.onVideo }: { children: ReactNode; bg?: string }) => <View style={[s.pill, { backgroundColor: bg }]}>{children}</View>;

const StatusBar = () => (
  <View style={s.status} pointerEvents="none">
    <Text style={s.time}>9:41</Text>
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 1.5 }}>
      {[4, 6, 8, 10].map((h) => (
        <View key={h} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: c.white }} />
      ))}
      <View style={s.battery}>
        <View style={{ flex: 1, borderRadius: 1.5, backgroundColor: c.white }} />
      </View>
    </View>
  </View>
);

/* ───────────────────────── 屏 1 视频流 ───────────────────────── */

function FeedScreen() {
  const [tab, setTab] = useState("For You");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  return (
    <>
      <View style={s.feedVideo}>
        <MediaVideo uri={video("poodle")} poster={poster("poodle")} style={StyleSheet.absoluteFill} />
        <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 150 }} pointerEvents="none" />
        <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 340 }} pointerEvents="none" />
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 0 }}>
          <KProgress value={0.42} />
        </View>
      </View>
      <StatusBar />
      <View style={{ position: "absolute", left: 0, right: 0, top: 50 }}>
        <KFeedHeader tabs={["Following", "Inspiration", "For You"]} current={tab} onChange={setTab} unread={7} />
      </View>

      {/* 右侧操作列:沿用组件库 */}
      <View style={{ position: "absolute", right: 8, bottom: BAR + 14, alignItems: "center" }}>
        <KRailAvatar uri={poster("poodle")} following={following} onFollow={() => setFollowing(true)} />
        <KRailAction icon="heart" count={liked ? "18.4K" : "18.4K"} active={liked} onPress={() => setLiked((v) => !v)} label="Like" />
        <KRailAction icon="message-circle-more" count="532" label="Comments" />
        <KRailAction icon="bookmark" count="3,312" active={saved} tint={c.save} onPress={() => setSaved((v) => !v)} label="Save" />
        <KRailAction icon="share" count="Share" label="Share" />
        <KRemixDisc uri={poster("poodle")} />
      </View>

      {/* 左下:趋势标签 → 作者 → 文案 → 「朋友也做了」 */}
      <View style={{ position: "absolute", left: 12, right: 80, bottom: BAR + 16, gap: 7 }}>
        <View style={{ flexDirection: "row" }}>
          <Pill bg="rgba(255,94,26,0.9)">
            <Icon name="flame" size={12} color={c.white} fill={c.white} strokeWidth={1.5} />
            <Text style={s.pillText}>#2 Trending in Pets</Text>
          </Pill>
        </View>
        <Text style={[t.headline, { color: c.white }, tk.textShadow]}>Mochi & Friends</Text>
        <Text style={[t.body, { color: c.white }, tk.textShadow]} numberOfLines={2}>
          She said she&apos;s not doing interviews today <Text style={{ fontWeight: "600" }}>#pets #fashion</Text>
        </Text>
        <Pressable style={s.proof} accessibilityRole="button" accessibilityLabel="See who remixed this">
          <Stack uris={[FRIENDS.lily, FRIENDS.max, FRIENDS.kai]} size={20} ring="rgba(0,0,0,0.5)" />
          <Text style={[t.captionStrong, { color: c.white }]} numberOfLines={1}>
            Lily + 2 friends made this
          </Text>
          <Icon name="chevron-right" size={14} color={c.white} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <KTabBar current="home" dot="me" insetBottom={34} />
      </View>
    </>
  );
}

/* ───────────────────────── 屏 2 同款页 ───────────────────────── */

/** 点「4,310 remixes」或 Remix 小卡进来:这条视频变成一个「梗」，所有人的版本都在这 */
function TemplateScreen() {
  const [tab, setTab] = useState("friends");
  const remixes = [
    { id: "museum", who: FRIENDS.lily, name: "Lily", likes: "2.1K", friend: true },
    { id: "skate", who: FRIENDS.max, name: "Max", likes: "864", friend: true },
    { id: "scooter", who: FRIENDS.kai, name: "Kai", likes: "312", friend: true },
    { id: "catfan", who: poster("catfan"), name: "whiskers.ai", likes: "18K" },
    { id: "collie", who: poster("collie"), name: "Wind Chaser", likes: "9.4K" },
  ];
  const cw = (W - 4) / 3;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* 头图:原视频模糊铺底，上面是封面 + 信息 */}
        <View style={{ paddingTop: 96, paddingHorizontal: 16, paddingBottom: 18 }}>
          <Image source={{ uri: poster("poodle") }} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} blurRadius={30} resizeMode="cover" />
          <Gradient colors={["rgba(18,18,18,0)", c.page]} style={[StyleSheet.absoluteFill, { top: "40%" }]} pointerEvents="none" />
          <View style={{ flexDirection: "row", gap: 14 }}>
            <View style={s.tplCover}>
              <Image source={{ uri: poster("poodle") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={s.tplPlay}>
                <Icon name="play" size={14} color={c.white} fill={c.white} strokeWidth={1} />
              </View>
            </View>
            <View style={{ flex: 1, justifyContent: "flex-end", gap: 6 }}>
              <Text style={[t.title, { color: c.white }]}>Headscarf Diva</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <KAvatar uri={poster("poodle")} size={18} />
                <Text style={[t.caption, { color: c.text2 }]}>Original by Mochi & Friends</Text>
              </View>
              <Text style={[t.caption, { color: c.text3 }]}>4,310 remixes · 1.2M views</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
                <Pill bg="rgba(255,94,26,0.18)">
                  <Text style={[s.pillText, { color: c.primary }]}>+812 today</Text>
                </Pill>
                <Pill bg={c.fill2}>
                  <Text style={s.pillText}>Pets · Fashion</Text>
                </Pill>
              </View>
            </View>
          </View>
        </View>

        {/* 朋友行:不是数字，是认识的人 */}
        <View style={s.friendsRow}>
          <Stack uris={[FRIENDS.lily, FRIENDS.max, FRIENDS.kai]} size={28} ring={c.page} />
          <Text style={[t.caption, { color: c.text2, flex: 1 }]}>
            <Text style={{ color: c.white, fontWeight: "600" }}>Lily, Max</Text> and 1 more friend made this
          </Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <KIconTabs
            tabs={[
              { id: "top", icon: "flame", label: "Top" },
              { id: "friends", icon: "users", label: "Friends" },
              { id: "new", icon: "sparkles", label: "New" },
            ]}
            current={tab}
            onChange={setTab}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
          {/* 第一格永远留给「你」 */}
          <View style={[s.cell, { width: cw, height: cw * 1.4, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", gap: 8 }]}>
            <View style={{ width: 52, height: 52 }}>
              <KAvatar uri={ME} size={52} />
              <View style={s.youPlus}>
                <Icon name="plus" size={14} color={c.white} strokeWidth={3} />
              </View>
            </View>
            <Text style={[t.captionStrong, { color: c.white }]}>Your turn</Text>
          </View>
          {remixes.map((r) => (
            <View key={r.id} style={[s.cell, { width: cw, height: cw * 1.4 }]}>
              <Image source={{ uri: poster(r.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60 }} pointerEvents="none" />
              {r.friend ? (
                <View style={s.friendTag}>
                  <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>Friend</Text>
                </View>
              ) : null}
              <View style={s.cellFoot}>
                <Image source={{ uri: r.who }} style={{ width: 16, height: 16, borderRadius: 8 }} />
                <Text style={[t.micro, { color: c.white, flex: 1 }]} numberOfLines={1}>
                  {r.name}
                </Text>
                <Icon name="heart" size={11} color={c.white} fill={c.white} strokeWidth={1} />
                <Text style={[t.micro, { color: c.white }]}>{r.likes}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <StatusBar />
      <View style={[s.navTop, { top: 50 }]}>
        <View style={s.navBtn}>
          <Icon name="chevron-left" size={24} color={c.white} strokeWidth={2.2} />
        </View>
        <View style={s.navBtn}>
          <Icon name="share" size={20} color={c.white} strokeWidth={2} />
        </View>
      </View>

      <View style={s.stickyFoot}>
        <KButton label="Remix this" variant="cta" icon="wand-sparkles" />
      </View>
    </View>
  );
}

/* ───────────────────────── 屏 3 做同款(镜头轮盘) ───────────────────────── */

/** 像拍照选滤镜:底部一排「主角」，中间那个大圆就是生成按钮 */
function RemixScreen() {
  const cast: { id: string; label: string; uri?: string; icon?: IconName }[] = [
    { id: "orig", label: "Original", uri: poster("poodle") },
    { id: "me", label: "Me", uri: ME },
    { id: "pet", label: "My pet", uri: poster("collie") },
    { id: "lily", label: "Lily", uri: FRIENDS.lily },
    { id: "add", label: "Upload", icon: "plus" },
  ];
  const [sel, setSel] = useState("me");
  const [style, setStyle] = useState("Original");
  const pulse = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }), [pulse]);
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }), Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false })]));
    a.start();
    return () => a.stop();
  }, [pulse]);
  const current = cast.find((x) => x.id === sel)!;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.black }]}>
      {/* 预览区:原视频 + 选中主角的头像贴在画面上，提示「换成谁」 */}
      <View style={s.preview}>
        <MediaVideo uri={video("poodle")} poster={poster("poodle")} style={StyleSheet.absoluteFill} />
        <Gradient colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} pointerEvents="none" />
        <View style={s.swapBadge}>
          {current.uri ? <Image source={{ uri: current.uri }} style={{ width: 26, height: 26, borderRadius: 13 }} /> : null}
          <Text style={[t.captionStrong, { color: c.white }]}>{sel === "orig" ? "Keep the original star" : `Starring ${current.label === "Me" ? "you" : current.label}`}</Text>
        </View>
      </View>
      <StatusBar />
      <View style={[s.navTop, { top: 50 }]}>
        <View style={s.navBtn}>
          <Icon name="x" size={22} color={c.white} strokeWidth={2.2} />
        </View>
        <View style={[s.pill, { backgroundColor: c.onVideo, height: 30 }]}>
          <KCredits n={545} />
        </View>
      </View>

      {/* 剧情一句话 + 风格 */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 236 }}>
        <View style={s.promptChip}>
          <Icon name="pencil" size={14} color={c.white} strokeWidth={2.2} />
          <Text style={[t.bodyStrong, { color: c.white, flex: 1 }]} numberOfLines={1}>
            Make it a 1920s party
          </Text>
          <Text style={[t.captionStrong, { color: c.primary }]}>Shuffle</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginTop: 10 }}>
          {["Original", "Anime", "Claymation", "Cinematic", "Y2K"].map((x) => (
            <Pressable key={x} onPress={() => setStyle(x)} style={[s.styleChip, style === x && { backgroundColor: c.white }]}>
              <Text style={[t.captionStrong, { color: style === x ? "#000" : c.white }]}>{x}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 主角轮盘:选中的那个放大在中间，外圈是品牌渐变，点它就生成 */}
      <View style={s.carousel}>
        {cast.map((p) => {
          const on = p.id === sel;
          const inner = on ? (
            <Animated.View style={{ transform: [{ scale }] }}>
              <View style={s.shutter}>
                <Gradient colors={BRAND} angle={135} style={StyleSheet.absoluteFill} />
                <View style={s.shutterInner}>{p.uri ? <Image source={{ uri: p.uri }} style={{ width: 66, height: 66, borderRadius: 33 }} /> : null}</View>
              </View>
            </Animated.View>
          ) : (
            <View style={s.lens}>{p.uri ? <Image source={{ uri: p.uri }} style={{ width: 48, height: 48, borderRadius: 24 }} /> : <Icon name={p.icon!} size={22} color={c.white} strokeWidth={2.2} />}</View>
          );
          return (
            <Pressable key={p.id} onPress={() => setSel(p.id)} style={{ alignItems: "center", gap: 6, width: on ? 92 : 56 }} accessibilityRole="button" accessibilityLabel={on ? `Generate with ${p.label}` : `Cast ${p.label}`}>
              {inner}
              <Text style={[t.micro, { color: on ? c.white : c.text2 }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.shutterHint}>Tap the circle to generate · 20 credits · about 40s</Text>
    </View>
  );
}

/* ───────────────────────── 屏 4 成品 + 炫耀 ───────────────────────── */

function ResultScreen() {
  const [picked, setPicked] = useState<string[]>(["tiktok"]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const earn = 20 + picked.filter((x) => x !== "save").length * 30;
  const targets: { id: string; label: string; icon: ReactNode; bonus?: number }[] = [
    { id: "tiktok", label: "TikTok", icon: <BrandIcon brand="tiktok" size={44} style={{ borderRadius: 22 }} />, bonus: 30 },
    { id: "instagram", label: "Reels", icon: <BrandIcon brand="instagram" size={44} style={{ borderRadius: 22 }} />, bonus: 30 },
    { id: "whatsapp", label: "WhatsApp", icon: <BrandIcon brand="whatsapp" size={44} style={{ borderRadius: 22 }} /> },
    { id: "save", label: "Save", icon: <View style={s.saveCircle}><Icon name="download" size={20} color={c.white} strokeWidth={2.2} /></View> },
  ];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.black }]}>
      <View style={[s.preview, { bottom: 300 }]}>
        <MediaVideo uri={video("gatsby")} poster={poster("gatsby")} style={StyleSheet.absoluteFill} />
        {/* 原视频小窗:固定在左上，对比「原版 vs 我的」 */}
        <View style={s.pip}>
          <Image source={{ uri: poster("poodle") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={s.pipLabel}>
            <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>Original</Text>
          </View>
        </View>
        {/* 水印:分享出去的视频都带，回流新用户 */}
        <View style={s.watermark}>
          <Image source={{ uri: "/prototypes/buzzvideo-app/app-logo.svg" }} style={{ width: 14, height: 14 }} />
          <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>Made with BuzzVideo</Text>
        </View>
      </View>
      <StatusBar />
      <View style={[s.navTop, { top: 50 }]}>
        <View style={s.navBtn}>
          <Icon name="chevron-left" size={24} color={c.white} strokeWidth={2.2} />
        </View>
        <View style={[s.pill, { backgroundColor: c.onVideo, height: 32 }]}>
          <Icon name="rotate-ccw" size={14} color={c.white} strokeWidth={2.2} />
          <Text style={s.pillText}>Try another</Text>
        </View>
      </View>

      <View style={s.resultPanel}>
        <View style={s.captionBox}>
          <Text style={[t.body, { color: c.white, flex: 1 }]} numberOfLines={2}>
            Me vs. Mochi. Who wore it better? <Text style={{ color: "#7ab8ff" }}>@lily</Text> your turn
          </Text>
          <View style={s.atBtn}>
            <Icon name="at-sign" size={16} color={c.white} strokeWidth={2.2} />
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
          {targets.map((x) => {
            const on = picked.includes(x.id);
            return (
              <Pressable key={x.id} onPress={() => toggle(x.id)} style={{ alignItems: "center", gap: 6, width: 72 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={[s.targetRing, on && { borderColor: c.primary }]}>{x.icon}</View>
                {x.bonus ? (
                  <View style={s.bonus}>
                    <Text style={s.bonusText}>+{x.bonus}</Text>
                  </View>
                ) : null}
                <Text style={[t.micro, { color: on ? c.white : c.text3 }]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: 18 }}>
          <KButton label={`Post & earn ${earn} credits`} variant="cta" />
        </View>
        <Text style={[t.caption, { color: c.text3, textAlign: "center", marginTop: 8 }]}>Lily, Max and Kai will see it first. They made this too.</Text>
      </View>
    </View>
  );
}

/* ───────────────────────── 屏 5 发出去之后 ───────────────────────── */

/** 发完不是结束:实时看到第一批反应 + 火苗 +1 + 朋友被通知 */
function LiveScreen() {
  const [views, setViews] = useState(12);
  const [likes, setLikes] = useState(3);
  useEffect(() => {
    const id = setInterval(() => {
      setViews((v) => (v > 400 ? 12 : v + Math.ceil(Math.random() * 9)));
      setLikes((l) => (l > 60 ? 3 : l + (Math.random() > 0.5 ? 1 : 0)));
    }, 600);
    return () => clearInterval(id);
  }, []);
  const pop = useMemo(() => new Animated.Value(0.6), []);
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: false, bounciness: 14 }).start();
  }, [pop]);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page }]}>
      <View style={s.liveGlow} />
      <StatusBar />
      <View style={{ alignItems: "center", marginTop: 92 }}>
        <Animated.View style={[s.liveCard, { transform: [{ scale: pop }, { rotate: "-3deg" }] }]}>
          <MediaVideo uri={video("gatsby")} poster={poster("gatsby")} style={StyleSheet.absoluteFill} />
          <View style={s.liveTag}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.white }} />
            <Text style={[t.tab, { color: c.white, fontWeight: "800" }]}>LIVE ON BUZZVIDEO</Text>
          </View>
        </Animated.View>
        <Text style={[t.display, { color: c.white, marginTop: 22 }]}>You&apos;re posted!</Text>
        <View style={{ flexDirection: "row", gap: 22, marginTop: 14 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={[t.title, { color: c.white }]}>{views}</Text>
            <Text style={[t.caption, { color: c.text3 }]}>views</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[t.title, { color: c.like }]}>{likes}</Text>
            <Text style={[t.caption, { color: c.text3 }]}>likes</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={[t.title, { color: c.primary }]}>+50</Text>
            <Text style={[t.caption, { color: c.text3 }]}>credits</Text>
          </View>
        </View>
      </View>

      <View style={s.streakCard}>
        <Flame n={7} size={22} />
        <View style={{ flex: 1 }}>
          <Text style={[t.bodyStrong, { color: c.white }]}>7-day streak!</Text>
          <Text style={[t.caption, { color: c.text2 }]}>You beat Max (5). Lily is on 9.</Text>
        </View>
        <Stack uris={[FRIENDS.max, FRIENDS.lily]} size={26} ring={c.surface} />
      </View>
      <View style={[s.streakCard, { bottom: 150 }]}>
        <Icon name="bell" size={20} color={c.white} strokeWidth={2} />
        <Text style={[t.caption, { color: c.text2, flex: 1 }]}>
          We told <Text style={{ color: c.white, fontWeight: "600" }}>Lily, Max and Kai</Text>. They made this too.
        </Text>
      </View>

      <View style={{ position: "absolute", left: 16, right: 16, bottom: 44, gap: 10 }}>
        <KButton label="Also share to Instagram · +30" variant="cta" />
        <KButton label="Back to feed" variant="secondary" />
      </View>
    </View>
  );
}

/* ───────────────────────── 屏 6 消息 ───────────────────────── */

function ActivityScreen() {
  const rows: { avatars: string[]; text: ReactNode; meta: string; thumb?: string; action?: ReactNode }[] = [
    { avatars: [FRIENDS.lily, FRIENDS.zoe], text: <><B>Lily, Zoe</B> and 21 others remixed your video</>, meta: "2m · +5 credits each", thumb: poster("gatsby") },
    { avatars: [FRIENDS.max], text: <><B>Max</B> challenged you: remix <B>Zoomies</B></>, meta: "18m", action: <KButton label="Remix" size="s" variant="primary" /> },
    { avatars: [FRIENDS.kai, FRIENDS.ben, FRIENDS.lily], text: <><B>Kai, Ben</B> and 214 others liked your remix</>, meta: "1h", thumb: poster("gatsby") },
    { avatars: [FRIENDS.ben], text: <><B>Ben</B> started following you</>, meta: "3h", action: <KButton label="Follow back" size="s" variant="secondary" /> },
    { avatars: [FRIENDS.zoe], text: <><B>Zoe</B> commented: &ldquo;the hat on you though 😭&rdquo;</>, meta: "5h", thumb: poster("gatsby") },
  ];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page }]}>
      <ScrollView contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* 朋友的新作品:故事圈 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
          {[
            ["Lily", FRIENDS.lily],
            ["Max", FRIENDS.max],
            ["Kai", FRIENDS.kai],
            ["Zoe", FRIENDS.zoe],
            ["Ben", FRIENDS.ben, true],
          ].map(([n, u, seen]) => (
            <View key={n as string} style={{ alignItems: "center", gap: 5 }}>
              <RingAvatar uri={u as string} size={58} seen={!!seen} />
              <Text style={[t.micro, { color: c.text2 }]}>{n as string}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 里程碑卡 */}
        <View style={s.milestone}>
          <Gradient colors={BRAND} angle={120} style={StyleSheet.absoluteFill} />
          <View style={{ flex: 1 }}>
            <Text style={[t.captionStrong, { color: "rgba(255,255,255,0.85)" }]}>MILESTONE</Text>
            <Text style={[t.title, { color: c.white }]}>Your remix hit 1K views</Text>
            <Text style={[t.caption, { color: "rgba(255,255,255,0.9)" }]}>Faster than 82% of first posts</Text>
          </View>
          <Image source={{ uri: poster("gatsby") }} style={{ width: 54, height: 72, borderRadius: 6, transform: [{ rotate: "6deg" }] }} />
        </View>

        <Text style={[t.captionStrong, { color: c.text3, marginLeft: 16, marginTop: 22, marginBottom: 4 }]}>Today</Text>
        {rows.map((r, i) => (
          <View key={i} style={s.actRow}>
            <View style={{ width: 48 }}>
              {r.avatars.length > 1 ? (
                <View style={{ width: 48, height: 48 }}>
                  <Image source={{ uri: r.avatars[0] }} style={[s.actAv, { width: 34, height: 34, borderRadius: 17, position: "absolute", top: 0, left: 0 }]} />
                  <Image source={{ uri: r.avatars[1] }} style={[s.actAv, { width: 34, height: 34, borderRadius: 17, position: "absolute", bottom: 0, right: 0, borderWidth: 2, borderColor: c.page }]} />
                </View>
              ) : (
                <Image source={{ uri: r.avatars[0] }} style={[s.actAv, { width: 48, height: 48, borderRadius: 24 }]} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[t.body, { color: c.text }]} numberOfLines={2}>
                {r.text}
              </Text>
              <Text style={[t.caption, { color: c.text3, marginTop: 2 }]}>{r.meta}</Text>
            </View>
            {r.action ?? (r.thumb ? <Image source={{ uri: r.thumb }} style={{ width: 42, height: 56, borderRadius: 4 }} /> : null)}
          </View>
        ))}
      </ScrollView>
      <StatusBar />
      <View style={[s.navTop, { top: 50, height: 44 }]}>
        <Text style={[t.title, { color: c.white }]}>Activity</Text>
        <View style={s.streakChip}>
          <Flame n={7} />
        </View>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <KTabBar current="me" insetBottom={34} />
      </View>
    </View>
  );
}
const B = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: "700", color: c.white }}>{children}</Text>;

/* ───────────────────────── 屏 7 我的 ───────────────────────── */

function ProfileScreen() {
  const [tab, setTab] = useState("posts");
  const cw = (W - 4) / 3;
  const grid = [
    { id: "gatsby", n: "1.2K", tag: "Pinned", remixes: "23 remixes" },
    { id: "dreamcore", n: "864" },
    { id: "gummy", n: "3.1K", remixes: "112 remixes" },
    { id: "fruit", n: "512" },
    { id: "museum", n: "2.4K" },
    { id: "hotel", n: "97" },
  ];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page }]}>
      <ScrollView contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: "center" }}>
          <RingAvatar uri={ME} size={92} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <Text style={[t.title, { color: c.white }]}>Alex Chen</Text>
            <View style={s.streakChip}>
              <Flame n={7} />
            </View>
          </View>
          <View style={s.levelChip}>
            <Gradient colors={BRAND} angle={90} style={StyleSheet.absoluteFill} />
            <Text style={[t.tab, { color: c.white, fontWeight: "800" }]}>LV 2 · RISING CREATOR</Text>
          </View>
        </View>
        {/* 数据里加「被同款」:做内容的人最在乎的是影响力 */}
        <View style={s.stats}>
          {[
            ["348", "Followers"],
            ["2.9K", "Likes"],
            ["1.3K", "Remixed you"],
          ].map(([n, l], i) => (
            <View key={l} style={{ flex: 1, alignItems: "center" }}>
              <Text style={[t.headline, { color: i === 2 ? c.primary : c.white }]}>{n}</Text>
              <Text style={[t.caption, { color: c.text3 }]}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <KButton label="Edit profile" variant="secondary" size="m" block />
          </View>
          <View style={{ flex: 1 }}>
            <KButton label="Share profile" variant="secondary" size="m" block />
          </View>
        </View>

        {/* 签到收在主页里，一行搞定 */}
        <View style={s.checkin}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={[t.bodyStrong, { color: c.white }]}>Daily credits</Text>
            <Text style={[t.caption, { color: c.text3 }]}>Day 7 gift unlocks tomorrow</Text>
          </View>
          <KStreak rewards={[10, 10, 15, 15, 20, 20, 50]} done={6} today={-1} />
        </View>

        <View style={{ marginTop: 14 }}>
          <KIconTabs
            tabs={[
              { id: "posts", icon: "layout-grid", label: "Posts" },
              { id: "remix", icon: "wand-sparkles", label: "Remixes" },
              { id: "saved", icon: "bookmark", label: "Saved" },
            ]}
            current={tab}
            onChange={setTab}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
          {grid.map((g) => (
            <View key={g.id} style={[s.cell, { width: cw, height: cw * 1.33 }]}>
              <Image source={{ uri: poster(g.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              {g.tag ? (
                <View style={[s.friendTag, { backgroundColor: c.primary }]}>
                  <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>{g.tag}</Text>
                </View>
              ) : null}
              {g.remixes ? (
                <View style={s.remixTag}>
                  <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>{g.remixes}</Text>
                </View>
              ) : null}
              <View style={s.cellFoot}>
                <Icon name="play" size={11} color={c.white} fill={c.white} strokeWidth={1} />
                <Text style={[t.micro, { color: c.white }]}>{g.n}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <StatusBar />
      <View style={[s.navTop, { top: 50 }]}>
        <View style={[s.pill, { backgroundColor: c.fill2, height: 30 }]}>
          <KCredits n={545} />
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <View style={s.navBtn}>
            <Icon name="gift" size={22} color={c.white} strokeWidth={2} />
            <View style={s.dot} />
          </View>
          <View style={s.navBtn}>
            <Icon name="menu" size={22} color={c.white} strokeWidth={2} />
          </View>
        </View>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <KTabBar current="me" insetBottom={34} />
      </View>
    </View>
  );
}

/* ───────────────────────── 展示页 ───────────────────────── */

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-black" style={{ width: W, height: H, borderRadius: 48, boxShadow: "0 0 0 9px #141414, 0 0 0 10px #333, 0 28px 56px rgba(0,0,0,0.22)" }}>
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </div>
  );
}

function Shot({ n, title, points, children }: { n: number; title: string; points: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <Phone>{children}</Phone>
      <div className="mt-7 w-[390px]">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-[#FF5E1A]">{String(n).padStart(2, "0")}</span>
          <h3 className="text-[17px] font-semibold text-stone-900">{title}</h3>
        </div>
        <ul className="mt-2.5 space-y-1.5">
          {points.map((p) => (
            <li key={p} className="flex gap-2 text-[14px] leading-6 text-stone-600">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-stone-400" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const LOOP = [
  ["看到", "趋势标签 + 「朋友也做了」"],
  ["进同款页", "所有人的版本，朋友排前面"],
  ["换主角", "像选滤镜，点大圆就生成"],
  ["拿出去炫", "原版小窗对比、@朋友、带水印"],
  ["第一批反应", "实时数字、火苗 +1、朋友被通知"],
  ["被同款", "消息里「谁做了你的同款」"],
];

const IDEAS = [
  ["每条视频都是一个「梗」", "视频左下不只写「4,310 remixes」，而是「Lily 和 2 个朋友做了」。点进去是同款页：原版、所有人的版本、朋友的排前面，第一格永远留给「你」。像 TikTok 的音乐页、剪映的模板页。"],
  ["做同款像拍照选滤镜", "主角做成底部一排圆形轮盘(原角色 / 我 / 我的宠物 / 朋友)，选中的放大到中间，外圈品牌渐变，它本身就是生成按钮。剧情一句话、风格一排胶囊，都不用打字也能玩。"],
  ["成品要能拿出去炫", "结果页左上固定一个原版小窗，「原版 vs 我」一眼看出来;文案默认 @一个朋友;分享出去带「Made with BuzzVideo」水印，每次分享都是一次拉新。"],
  ["发完立刻有反馈", "发布后不是一句「成功」，而是实时跳动的播放和点赞数、火苗连续天数和朋友比、告诉你哪些朋友已被通知。第一分钟的反馈决定他还发不发第二条。"],
  ["给人回来的理由", "火苗连续天数(像 Snapchat)放在名字旁和消息页右上;消息页顶部是朋友新作品的故事圈和里程碑卡;「Max 邀你做同款」带一个 Remix 按钮直接开做。"],
  ["身份感", "主页头像带渐变圈、等级徽章、火苗;数据把「关注」换成「Remixed you(被同款次数)」，这是创作者最想晒的数字;置顶作品和「23 remixes」角标。"],
];

export default function SocialPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="mx-auto max-w-[1320px] px-8 py-12">
        <div className="text-[13px] font-medium text-stone-500">BuzzVideo APP · 第二版 · 探索稿</div>
        <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-stone-900">如果由社交 APP 的资深设计师来做</h1>
        <p className="mt-3 max-w-[780px] text-[15px] leading-7 text-stone-600">
          视觉沿用组件库(TikTok 风格的黑底、实心图标、8pt 圆角、品牌橙和渐变)，改的是产品的「社交回路」。社交 APP 设计师最先想的不是界面长什么样，而是：用户为什么会点、为什么会发、为什么明天还回来。所以这一版每一屏都在回答这三个问题。
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-[13px]">
          {LOOP.map(([a, b], i) => (
            <div key={a} className="flex items-center gap-2">
              <div className="rounded-xl border border-stone-200 bg-white px-3.5 py-2">
                <div className="font-semibold text-stone-900">{a}</div>
                <div className="text-[12px] text-stone-500">{b}</div>
              </div>
              {i < LOOP.length - 1 ? <span className="text-stone-400">→</span> : <span className="text-stone-400">↺</span>}
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {IDEAS.map(([title, d], i) => (
            <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="text-[12px] font-semibold text-[#FF5E1A]">{i + 1}</div>
              <div className="mt-1 text-[15px] font-semibold text-stone-900">{title}</div>
              <p className="mt-2 text-[13px] leading-6 text-stone-600">{d}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-[22px] font-semibold text-stone-900">7 屏</h2>
        <p className="mt-2 text-[14px] text-stone-600">视频会播放;点赞、收藏、关注、频道、同款页分栏、主角轮盘、风格、分享平台、主页分栏都可以点。</p>
        <div className="mt-10 grid justify-center gap-x-12 gap-y-16" style={{ gridTemplateColumns: "repeat(auto-fit, 390px)" }}>
          <Shot n={1} title="视频流 · 社交证明" points={["组件库的视频流原样保留(顶栏三个频道、右侧操作列、Remix 小卡、底部栏方案 A)。", "左下多了两样：橙色趋势标签「#2 Trending in Pets」，和一条「Lily and 2 friends made this」——认识的人在做，比数字更让人想点。"]}>
            <FeedScreen />
          </Shot>
          <Shot n={2} title="同款页 · 一个梗的所有版本" points={["点 Remix 小卡或「friends made this」进来。头图是原版，下面写今天又多了多少人做。", "Top / Friends / New 三栏，默认 Friends;第一格永远是「Your turn」。", "底部固定一个渐变按钮「Remix this」。"]}>
            <TemplateScreen />
          </Shot>
          <Shot n={3} title="做同款 · 主角轮盘" points={["上面是原视频预览，标签写「Starring you」;下面一排圆形主角，选中的放大到中间、外圈品牌渐变、轻轻呼吸——点它就生成。", "剧情是一条可以「Shuffle」的胶囊，风格是一排胶囊，全程可以不打字。", "积分和预计时间在轮盘下面一行小字。"]}>
            <RemixScreen />
          </Shot>
          <Shot n={4} title="成品 · 拿出去炫" points={["左上固定原版小窗，「原版 vs 我」;右下水印「Made with BuzzVideo」。", "文案默认 @朋友;分享平台是一排圆形图标，勾上哪个按钮上的积分就加多少(发布 +20，TikTok / Reels 各 +30)。", "按钮下面写明：做过这条的朋友会先看到。"]}>
            <ResultScreen />
          </Shot>
          <Shot n={5} title="发完 · 第一批反应" points={["作品卡片弹出来，播放和点赞数实时往上跳;积分 +50。", "火苗 +1，并且和朋友比:「You beat Max (5). Lily is on 9.」", "主按钮继续引导分享到还没发的平台。"]}>
            <LiveScreen />
          </Shot>
          <Shot n={6} title="消息 · 回来的理由" points={["顶部是朋友新作品的故事圈(渐变圈 = 没看过)。", "里程碑卡:「Your remix hit 1K views」。", "通知按人合并;「Max challenged you」直接带 Remix 按钮，「started following you」带 Follow back。"]}>
            <ActivityScreen />
          </Shot>
          <Shot n={7} title="我的 · 身份感" points={["头像渐变圈、名字旁火苗、渐变等级徽章。", "数据第三项是「Remixed you」(被同款 1.3K 次)，用主色突出。", "签到收成一行七格，在主页里看;右上礼物图标进任务中心。作品格子带「Pinned」「23 remixes」角标。"]}>
            <ProfileScreen />
          </Shot>
        </div>

        <div className="mt-20 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[14px] leading-7 text-amber-950">
          <div className="font-semibold">需要你判断的地方</div>
          <ul className="mt-1 list-disc pl-5">
            <li>「朋友」是这版的核心(朋友也做了、朋友排前面、通知朋友)。需要通讯录 / 关注关系做底子，冷启动时没朋友的用户会看到「热门创作者」代替。</li>
            <li>做同款从「面板」改成全屏「主角轮盘」，中间大圆就是生成按钮，很像拍照 APP。好玩，但第一次用可能需要一句提示。</li>
            <li>每日签到不再弹窗，收进主页一行;火苗连续天数改成「发布」才算(不只是打开)，激励更偏向发作品。数值仍是占位。</li>
            <li>第 6 屏消息页放在 Me 下面(底部栏还是 Home / Create / Me)，入口是首页右上的铃铛。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── 样式 ───────────────────────── */

const s = StyleSheet.create({
  status: { position: "absolute", left: 0, right: 0, top: 0, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 34, paddingTop: 4, zIndex: 40 },
  time: { color: c.white, fontSize: 16, fontWeight: "600" },
  battery: { width: 24, height: 11, borderRadius: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", padding: 1.5, marginLeft: 5 },

  feedVideo: { position: "absolute", left: 0, right: 0, top: 0, bottom: BAR, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden", backgroundColor: "#111" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, height: 24, paddingHorizontal: 9, borderRadius: 999 },
  pillText: { color: c.white, fontSize: 12, fontWeight: "700" },
  proof: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", maxWidth: "100%", height: 32, paddingLeft: 6, paddingRight: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.18)" },

  navTop: { position: "absolute", left: 12, right: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 30 },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: c.like },

  tplCover: { width: 112, height: 150, borderRadius: 8, overflow: "hidden", backgroundColor: c.surface },
  tplPlay: { position: "absolute", left: 6, bottom: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: c.onVideo, alignItems: "center", justifyContent: "center" },
  friendsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, padding: 12, borderRadius: 8, backgroundColor: c.surface },
  cell: { overflow: "hidden", backgroundColor: c.surface },
  cellFoot: { position: "absolute", left: 6, right: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  remixTag: { position: "absolute", left: 6, bottom: 24, height: 18, paddingHorizontal: 6, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center" },
  friendTag: { position: "absolute", left: 6, top: 6, height: 18, paddingHorizontal: 6, borderRadius: 4, backgroundColor: "rgba(255,94,26,0.92)", justifyContent: "center" },
  youPlus: { position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, borderWidth: 2, borderColor: c.surface, alignItems: "center", justifyContent: "center" },
  stickyFoot: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 38, backgroundColor: "rgba(18,18,18,0.94)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },

  preview: { position: "absolute", left: 0, right: 0, top: 0, bottom: 210, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden", backgroundColor: "#111" },
  swapBadge: { position: "absolute", top: 104, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, height: 36, paddingLeft: 5, paddingRight: 14, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)" },
  promptChip: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, height: 44, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.55)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.25)" },
  styleChip: { height: 30, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
  carousel: { position: "absolute", left: 0, right: 0, bottom: 62, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  lens: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },
  shutter: { width: 86, height: 86, borderRadius: 43, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  shutterHint: { position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", color: c.text3, fontSize: 12, fontWeight: "500" },

  pip: { position: "absolute", left: 12, top: 100, width: 76, height: 104, borderRadius: 8, overflow: "hidden", borderWidth: 2, borderColor: c.white },
  pipLabel: { position: "absolute", left: 0, right: 0, bottom: 0, height: 18, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  watermark: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 8, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.35)" },
  resultPanel: { position: "absolute", left: 0, right: 0, bottom: 0, height: 300, paddingHorizontal: 16, paddingTop: 16 },
  captionBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 8, backgroundColor: c.surface },
  atBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center" },
  targetRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  saveCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center" },
  bonus: { position: "absolute", top: -4, right: 2, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: c.primary, justifyContent: "center", borderWidth: 2, borderColor: c.black },
  bonusText: { color: c.white, fontSize: 10, fontWeight: "800" },

  liveGlow: { position: "absolute", top: 60, left: -40, right: -40, height: 420, borderRadius: 300, backgroundColor: "rgba(255,94,26,0.16)", filter: "blur(60px)" } as object,
  liveCard: { width: 190, height: 300, borderRadius: 12, overflow: "hidden", borderWidth: 3, borderColor: c.white, backgroundColor: "#111" },
  liveTag: { position: "absolute", left: 8, top: 8, flexDirection: "row", alignItems: "center", gap: 5, height: 20, paddingHorizontal: 7, borderRadius: 4, backgroundColor: c.like },
  streakCard: { position: "absolute", left: 16, right: 16, bottom: 214, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: c.surface },

  milestone: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 20, padding: 16, borderRadius: 12, overflow: "hidden" },
  actRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  actAv: { backgroundColor: c.surface },
  streakChip: { height: 28, paddingHorizontal: 9, borderRadius: 14, backgroundColor: "rgba(255,122,26,0.16)", justifyContent: "center" },

  levelChip: { marginTop: 8, height: 22, paddingHorizontal: 10, borderRadius: 11, overflow: "hidden", justifyContent: "center" },
  stats: { flexDirection: "row", marginTop: 18, paddingHorizontal: 24 },
  checkin: { marginHorizontal: 16, marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: c.surface },
});
