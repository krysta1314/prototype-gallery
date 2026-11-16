import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { CATEGORIES, CREATORS, FOR_YOU, FRIENDS, POSTS, cardRatio, creator, fmt, friendsOn, post, poster, savesOf, trendRank, video, type Category, type Post } from "../data";
import { KButton, KChip, KDiscoverCard, KFeedHeader, KProgress, KRailAction, KRailAvatar, KRemixDisc, KTooltip } from "../kit/components";
import { tk } from "../kit/tokens";
import { useV2, type HomeTab } from "../store";
import { Avatar, Face, RingAvatar, Stack, Stage } from "../ui";
import { Gradient, Icon, MediaVideo, useInsets } from "../v1";

const c = tk.color;
const t = tk.type;

/* ---------- 单条全屏视频(For You、Following、单条查看共用) ---------- */

export function FeedItem({ p, height, active, near, bottomPad, coach, mine }: { p: Post; height: number; active: boolean; near: boolean; bottomPad: number; coach?: boolean; mine?: { id: string; caption: string } }) {
  const { s, d } = useV2();
  const liked = s.likes.includes(p.id);
  const saved = s.saves.includes(p.id);
  const cr = creator(p.author);
  const following = s.follows.includes(p.author);
  const friends = friendsOn(p.id);
  const rank = trendRank(p);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);
  const heart = useState(() => new Animated.Value(0))[0];
  const heartStyle = useMemo(() => ({ opacity: heart.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ scale: heart.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.15, 1.4] }) }] }), [heart]);
  const lastTap = useRef(0);
  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);
  // 单击暂停 / 继续;双击点赞并冒一颗大爱心
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      d({ type: "like", id: p.id, on: true });
      setPaused(false);
      setBurst((n) => n + 1);
      heart.setValue(0);
      Animated.timing(heart, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current === now) setPaused((v) => !v);
    }, 290);
  };
  // Remix 小卡和「朋友也做了」都进同款页(像 TikTok 点音乐碟进音乐页)
  const openTemplate = () => d({ type: "push", route: { name: "template", postId: p.id } });
  return (
    <View style={{ height, backgroundColor: c.black }}>
      <Stage id={p.id}>{near ? <MediaVideo uri={video(p.id)} poster={poster(p.id)} style={StyleSheet.absoluteFill} paused={!active || paused} autoPlay={active} /> : <Image source={{ uri: poster(p.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</Stage>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} accessibilityLabel={paused ? "Play" : "Pause"} />
      <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={styles.topShade} pointerEvents="none" />
      <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]} style={styles.bottomShade} pointerEvents="none" />
      {paused ? (
        <View style={styles.center} pointerEvents="none">
          <Icon name="play" size={64} color="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.75)" />
        </View>
      ) : null}
      {burst ? (
        <Animated.View key={burst} pointerEvents="none" style={[styles.center, heartStyle]}>
          <Icon name="heart" size={110} color={c.like} fill={c.like} />
        </Animated.View>
      ) : null}

      {/* 右侧操作列(组件库):作者头像 + 关注 · 点赞 · 评论 · 收藏 · 分享 · Remix 小卡 */}
      <View style={[styles.rail, { bottom: bottomPad + 12 }]}>
        {mine ? <Avatar id="me" size={tk.size.railAvatar} ring /> : <KRailAvatar uri={poster(p.id)} following={following} onAvatar={() => d({ type: "push", route: { name: "profile", userId: p.author } })} onFollow={() => d({ type: "follow", id: p.author })} />}
        <KRailAction icon="heart" count={fmt(p.likes + (liked ? 1 : 0))} active={liked} onPress={() => d({ type: "like", id: p.id })} label={liked ? "Unlike" : "Like"} />
        <KRailAction icon="message-circle-more" count={fmt(p.comments)} onPress={() => d({ type: "sheet", sheet: { name: "comments", postId: p.id } })} label="Comments" />
        <KRailAction icon="bookmark" count={fmt(savesOf(p) + (saved ? 1 : 0))} active={saved} tint={c.save} onPress={() => d({ type: "save", id: p.id })} label={saved ? "Remove from Saved" : "Save"} />
        <KRailAction icon="share" count="Share" onPress={() => d({ type: "sheet", sheet: { name: "share", postId: p.id, mine: mine?.id } })} label="Share" />
        <KRemixDisc uri={poster(p.id)} onPress={openTemplate} />
      </View>

      {/* 左下:趋势标签 → 作者 → 文案 → 朋友也做了 */}
      <View style={[styles.meta, { bottom: bottomPad + 14 }]}>
        {rank && !mine ? (
          <View style={styles.trend}>
            <Icon name="flame" size={12} color={c.white} fill={c.white} strokeWidth={1.5} />
            <Text style={styles.trendText}>
              #{rank} Trending in {p.cat}
            </Text>
          </View>
        ) : null}
        <Pressable onPress={() => (mine ? undefined : d({ type: "push", route: { name: "profile", userId: p.author } }))} accessibilityLabel={mine ? "You" : cr.name}>
          <Text style={[t.headline, { color: c.white }, tk.textShadow]} numberOfLines={1}>
            {mine ? "You" : cr.name}
          </Text>
        </Pressable>
        <Text style={[t.body, { color: c.white }, tk.textShadow]} numberOfLines={2}>
          {mine ? mine.caption : p.caption} <Text style={{ fontWeight: "600" }}>{p.tags.map((x) => `#${x}`).join(" ")}</Text>
        </Text>
        <Pressable onPress={openTemplate} accessibilityRole="button" accessibilityLabel="See everyone's version" style={styles.proof}>
          {friends.length ? <Stack uris={friends.slice(0, 3).map((f) => f.avatar)} size={20} ring="rgba(0,0,0,0.5)" /> : <Icon name="wand-sparkles" size={14} color={c.white} strokeWidth={2} />}
          <Text style={[t.captionStrong, { color: c.white, flexShrink: 1 }]} numberOfLines={1}>
            {friends.length ? `${friends[0].name}${friends.length > 1 ? ` + ${friends.length - 1} friend${friends.length > 2 ? "s" : ""}` : ""} made this` : `${fmt(p.remixes)} remixes`}
          </Text>
          <Icon name="chevron-right" size={14} color={c.white} strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* 新手提示:第一次进来指给用户看 Remix 小卡 */}
      {coach ? (
        <View style={[styles.coach, { bottom: bottomPad + 22 }]} pointerEvents="none">
          <KTooltip text="Tap to see everyone's version" arrow="right" />
        </View>
      ) : null}
      <View style={styles.progress} pointerEvents="none">
        <KProgress value={active ? 0.36 : 0} />
      </View>
    </View>
  );
}

/** 上下滑的全屏视频流:一次一条(scroll-snap),只播当前这条，前后各预载一条 */
export function Feed({ list, bottomPad, coach, initial = 0, mine }: { list: Post[]; bottomPad: number; coach?: boolean; initial?: number; mine?: Record<string, { id: string; caption: string }> }) {
  const [h, setH] = useState(0);
  const [idx, setIdx] = useState(initial);
  const ref = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (h && initial) ref.current?.scrollTo({ y: initial * h, animated: false });
  }, [h, initial]);
  return (
    <View style={{ flex: 1, backgroundColor: c.black }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      {h ? (
        <ScrollView
          ref={ref}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={32}
          onScroll={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.y / h);
            if (i !== idx) setIdx(i);
          }}
        >
          {list.map((p, i) => (
            <FeedItem key={p.id + i} p={p} height={h} active={i === idx} near={Math.abs(i - idx) <= 1} bottomPad={bottomPad} coach={coach && i === 0 && idx === 0} mine={mine?.[p.id]} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

/* ---------- Inspiration:双列瀑布流 ---------- */

function Inspiration({ top }: { top: number }) {
  const { d } = useV2();
  const [cat, setCat] = useState<Category>("Trending");
  const [w, setW] = useState(0);
  const list = useMemo(() => (cat === "Trending" ? [...POSTS].sort((a, b) => b.remixes - a.remixes) : POSTS.filter((p) => p.cat === cat)), [cat]);
  const ids = list.map((p) => p.id);
  const colW = w ? (w - 8 * 2 - 6) / 2 : 0;
  const cols = useMemo(() => {
    const out: [Post[], Post[]] = [[], []];
    const hs = [0, 0];
    for (const p of list) {
      const k = hs[0] <= hs[1] ? 0 : 1;
      out[k].push(p);
      hs[k] += cardRatio(p) + 0.5;
    }
    return out;
  }, [list]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.page }} contentContainerStyle={{ paddingTop: top, paddingBottom: 16 }} showsVerticalScrollIndicator={false} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {CATEGORIES.map((x) => (
          <KChip key={x} label={x} on={x === cat} onPress={() => setCat(x)} />
        ))}
      </ScrollView>
      {colW ? (
        <View style={styles.grid}>
          {cols.map((col, k) => (
            <View key={k} style={{ gap: 14 }}>
              {col.map((p) => {
                const fr = friendsOn(p.id);
                return (
                  <Pressable key={p.id} onPress={() => d({ type: "push", route: { name: "post", postId: p.id, list: ids } })} accessibilityLabel={p.caption}>
                    <KDiscoverCard uri={poster(p.id)} width={colW} ratio={cardRatio(p)} title={p.caption} avatar={poster(p.id)} author={creator(p.author).name} likes={fmt(p.likes)} tag={p.hot ? "Hot" : undefined} remixes={fmt(p.remixes)} />
                    {fr.length ? (
                      <View style={styles.cardFriends}>
                        <Stack uris={fr.slice(0, 2).map((f) => f.avatar)} size={16} ring={c.page} />
                        <Text style={[t.micro, { color: c.primary }]} numberOfLines={1}>
                          {fr[0].name}
                          {fr.length > 1 ? ` +${fr.length - 1}` : ""} made this
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

/* ---------- Following ---------- */

function Following({ top, bottomPad }: { top: number; bottomPad: number }) {
  const { s, d } = useV2();
  const list = POSTS.filter((p) => s.follows.includes(p.author));
  if (list.length) return <Feed list={list} bottomPad={bottomPad} />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.page }} contentContainerStyle={{ paddingTop: top + 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      {/* 朋友的新作品(故事圈):没关注任何创作者时，先从认识的人开始 */}
      <Text style={[t.captionStrong, { color: c.text3, marginLeft: 16, marginBottom: 10 }]}>Friends on BuzzVideo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
        {FRIENDS.map((f, i) => (
          <Pressable key={f.id} onPress={() => d({ type: "push", route: { name: "post", postId: ["museum", "skate", "alice", "cityjump"][i] } })} style={{ alignItems: "center", gap: 5 }} accessibilityLabel={`${f.name}'s new video`}>
            <RingAvatar size={58} seen={i === 3}>
              <Face uri={f.avatar} size={56} />
            </RingAvatar>
            <Text style={[t.micro, { fontWeight: "500", color: c.text2 }]}>{f.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[t.title, { color: c.text, marginTop: 24, marginHorizontal: 16 }]}>Creators your friends follow</Text>
      <Text style={[t.caption, { color: c.text3, marginTop: 4, marginHorizontal: 16 }]}>Follow a few and their new videos show up here.</Text>
      <View style={styles.suggest}>
        {CREATORS.filter((x) => x.id !== "buzz")
          .slice(0, 6)
          .map((x, i) => (
            <View key={x.id} style={styles.suggestCard}>
              <Pressable onPress={() => d({ type: "push", route: { name: "profile", userId: x.id } })} accessibilityLabel={x.name} style={{ alignItems: "center" }}>
                <Avatar id={x.id} size={68} />
                <Text style={[t.bodyStrong, { color: c.text, marginTop: 10 }]} numberOfLines={1}>
                  {x.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Face uri={FRIENDS[i % FRIENDS.length].avatar} size={14} />
                  <Text style={[t.micro, { fontWeight: "400", color: c.text3 }]} numberOfLines={1}>
                    {FRIENDS[i % FRIENDS.length].name} follows
                  </Text>
                </View>
              </Pressable>
              <KButton label="Follow" size="m" block onPress={() => d({ type: "follow", id: x.id })} />
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

/* ---------- 首页 ---------- */

const TABS: { id: HomeTab; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "inspiration", label: "Inspiration" },
  { id: "foryou", label: "For You" },
];

/** 首页:内容区底部 16pt 圆角(底部栏是下面一条实底黑条，由 App2 渲染) */
export default function Home() {
  const { s, d } = useV2();
  const insets = useInsets();
  const onVideo = s.homeTab === "foryou" || (s.homeTab === "following" && s.follows.length > 0);
  const top = insets.top + 48;
  // For You 的顺序:Instagram @buzzvideo.global 的全部视频(从新到旧)在前，再接其他素材(见 data.ts 的 FOR_YOU)
  const forYou = useMemo(() => FOR_YOU.map(post), []);
  return (
    <View style={styles.home}>
      {s.homeTab === "foryou" ? <Feed list={forYou} bottomPad={8} coach={s.coach} /> : s.homeTab === "inspiration" ? <Inspiration top={top} /> : <Following top={top} bottomPad={8} />}
      {/* 顶栏(组件库):消息 · 三个频道居中 · 搜索。积分不放首页(在「我的」和做同款页)，画面留给内容 */}
      <View style={[styles.topBar, { paddingTop: insets.top }, !onVideo && { backgroundColor: c.page }]}>
        <KFeedHeader
          tabs={TABS.map((x) => x.label)}
          current={TABS.find((x) => x.id === s.homeTab)!.label}
          onChange={(label) => d({ type: "homeTab", tab: TABS.find((x) => x.label === label)!.id })}
          unread={s.unread}
          onInbox={() => d({ type: "push", route: { name: "inbox" } })}
          onSearch={() => d({ type: "toast", text: "Search opens here" })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1, backgroundColor: c.black, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" },
  topShade: { position: "absolute", left: 0, right: 0, top: 0, height: 150 },
  bottomShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 340 },
  center: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  rail: { position: "absolute", right: 8, alignItems: "center" },
  meta: { position: "absolute", left: 12, right: 80, gap: 7 },
  trend: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", height: 24, paddingHorizontal: 9, borderRadius: 999, backgroundColor: "rgba(255,94,26,0.9)" },
  trendText: { color: c.white, fontSize: 12, fontWeight: "700" },
  proof: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", maxWidth: "100%", height: 32, paddingLeft: 6, paddingRight: 8, borderRadius: tk.radius.md, backgroundColor: "rgba(255,255,255,0.18)" },
  coach: { position: "absolute", right: 70 },
  progress: { position: "absolute", left: 12, right: 12, bottom: 2 },
  topBar: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 10 },
  cats: { paddingHorizontal: 8, gap: 8, paddingTop: 6, paddingBottom: 12 },
  grid: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 },
  cardFriends: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  suggest: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14, rowGap: 10, paddingHorizontal: 16 },
  suggestCard: { width: "48.5%", backgroundColor: c.surface, borderRadius: tk.radius.md, paddingVertical: 16, paddingHorizontal: 12, alignItems: "center", gap: 12 },
});
