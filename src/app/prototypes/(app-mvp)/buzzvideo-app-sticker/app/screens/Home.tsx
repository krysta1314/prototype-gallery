import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { GZAvatar, GZButton, GZChip, GZFeedTabs, GZIconButton, GZProgress, GZRailAction, GZRemixSticker, GZSticker, gz } from "../../kit/gz";
import { CATEGORIES, CREATORS, FOR_YOU, FRIENDS, POSTS, cardRatio, creator, fmt, friendsOn, post, poster, savesOf, trendRank, video, type Category, type Post } from "../data";
import { Coach, Hairline, Scrim, SectionLabel } from "../parts";
import { useV2, type HomeTab } from "../store";
import { Avatar, Face, RingAvatar, Stack, Stage } from "../ui";
import { Icon, MediaVideo, useInsets } from "../v1";

const c = gz.color;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** 作者头像 + 关注:头像白边，可点进主页;关注是一颗青柠「+」(组件库 GZRailAvatar 的样子，多了点头像进主页) */
function RailAvatar({ uri, following, onAvatar, onFollow }: { uri: string; following?: boolean; onAvatar?: () => void; onFollow?: () => void }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <Pressable onPress={onAvatar} accessibilityLabel="Creator profile">
        <GZAvatar uri={uri} size={46} border />
      </Pressable>
      {!following ? (
        <Pressable onPress={onFollow} accessibilityRole="button" accessibilityLabel="Follow" hitSlop={10} style={styles.followPlus}>
          <Icon name="plus" size={14} color={c.ink} strokeWidth={3.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

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
  // 双击的大爱心:啪地贴上(1.25 → 1,不回弹)，停一下再淡出
  const heartStyle = useMemo(() => ({ opacity: heart.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ scale: heart.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1.25, 1, 1] }) }, { rotate: "-8deg" }] }), [heart]);
  const lastTap = useRef(0);
  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);
  // 单击暂停 / 继续;双击点赞并贴一颗大爱心
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      d({ type: "like", id: p.id, on: true });
      setPaused(false);
      setBurst((n) => n + 1);
      heart.setValue(0);
      Animated.timing(heart, { toValue: 1, duration: 800, easing: EASE, useNativeDriver: false }).start();
      return;
    }
    lastTap.current = now;
    setTimeout(() => {
      if (lastTap.current === now) setPaused((v) => !v);
    }, 290);
  };
  // Remix 贴纸和左下的信号贴纸都进同款页(像 TikTok 点音乐碟进音乐页)
  const openTemplate = () => d({ type: "push", route: { name: "template", postId: p.id } });
  // 每条视频只放一颗最强的信号贴纸:朋友做过 > 热门排名 > 多少人做过
  const signal = friends.length ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Stack uris={friends.slice(0, 2).map((f) => f.avatar)} size={22} />
      <GZSticker label={`${friends[0].name}${friends.length > 1 ? ` + ${friends.length - 1} friend${friends.length > 2 ? "s" : ""}` : ""} made this`} color="lime" size="s" rotate={-2} />
    </View>
  ) : rank && !mine ? (
    <GZSticker label={`#${rank} in ${p.cat}`} color="orange" icon="flame" size="s" rotate={-2} />
  ) : (
    <GZSticker label={`${fmt(p.remixes)} remixes`} color="white" size="s" rotate={-2} />
  );
  return (
    <View style={{ height, backgroundColor: c.black }}>
      <Stage id={p.id}>{near ? <MediaVideo uri={video(p.id)} poster={poster(p.id)} style={StyleSheet.absoluteFill} paused={!active || paused} autoPlay={active} /> : <Image source={{ uri: poster(p.id) }} style={StyleSheet.absoluteFill} resizeMode="cover" />}</Stage>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap} accessibilityLabel={paused ? "Play" : "Pause"} />
      <Scrim edge="top" height={150} strength={0.3} />
      <Scrim edge="bottom" height={320} strength={0.6} />
      {paused ? (
        <View style={styles.center} pointerEvents="none">
          <View style={styles.playBadge}>
            <Icon name="play" size={34} color={c.white} fill={c.white} strokeWidth={1} />
          </View>
        </View>
      ) : null}
      {burst ? (
        <Animated.View key={burst} pointerEvents="none" style={[styles.center, heartStyle]}>
          <Icon name="heart" size={110} color={c.pink} fill={c.pink} />
        </Animated.View>
      ) : null}

      {/* 右侧操作列:作者头像 + 关注 · 点赞(粉) · 评论 · 收藏(黄油) · 分享 · Remix 贴纸 */}
      <View style={[styles.rail, { bottom: bottomPad + 12 }]}>
        {mine ? (
          <View style={{ marginBottom: 16 }}>
            <Avatar id="me" size={46} ring />
          </View>
        ) : (
          <RailAvatar uri={poster(p.id)} following={following} onAvatar={() => d({ type: "push", route: { name: "profile", userId: p.author } })} onFollow={() => d({ type: "follow", id: p.author })} />
        )}
        <GZRailAction icon="heart" count={fmt(p.likes + (liked ? 1 : 0))} active={liked} onPress={() => d({ type: "like", id: p.id })} label={liked ? "Unlike" : "Like"} />
        <GZRailAction icon="message-circle-more" count={fmt(p.comments)} onPress={() => d({ type: "sheet", sheet: { name: "comments", postId: p.id } })} label="Comments" />
        <GZRailAction icon="bookmark" count={fmt(savesOf(p) + (saved ? 1 : 0))} active={saved} tint={c.butter} onPress={() => d({ type: "save", id: p.id })} label={saved ? "Remove from Saved" : "Save"} />
        <GZRailAction icon="share" count="Share" onPress={() => d({ type: "sheet", sheet: { name: "share", postId: p.id, mine: mine?.id } })} label="Share" />
        <GZRemixSticker uri={poster(p.id)} onPress={openTemplate} />
      </View>

      {/* 左下:一颗信号贴纸 → 作者 → 文案 */}
      <View style={[styles.meta, { bottom: bottomPad + 18 }]}>
        <Pressable onPress={openTemplate} accessibilityRole="button" accessibilityLabel="See everyone's version" style={{ alignSelf: "flex-start" }}>
          {signal}
        </Pressable>
        <Pressable onPress={() => (mine ? undefined : d({ type: "push", route: { name: "profile", userId: p.author } }))} accessibilityLabel={mine ? "You" : cr.name} style={{ alignSelf: "flex-start" }}>
          <Text style={[gz.display.head, { color: c.white }, gz.textShadow]} numberOfLines={1}>
            {mine ? "you" : cr.name}
          </Text>
        </Pressable>
        <Text style={[gz.body.body, { color: c.white }, gz.textShadow]} numberOfLines={2}>
          {mine ? mine.caption : p.caption} <Text style={{ fontWeight: "600" }}>{p.tags.map((x) => `#${x}`).join(" ")}</Text>
        </Text>
      </View>

      {/* 新手提示:第一次进来指给用户看 Remix 贴纸 */}
      {coach ? (
        <View style={[styles.coach, { bottom: bottomPad + 26 }]} pointerEvents="none">
          <Coach text="Tap to see everyone's version" />
        </View>
      ) : null}
      <View style={styles.progress} pointerEvents="none">
        <GZProgress value={active ? 0.36 : 0} />
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

/* ---------- Inspiration:双列瀑布流。每格最多一颗贴纸(朋友做过 > Hot) ---------- */

function Card({ p, width }: { p: Post; width: number }) {
  const fr = friendsOn(p.id);
  const sticker = fr.length ? <GZSticker label={`${fr[0].name.toLowerCase()}${fr.length > 1 ? ` +${fr.length - 1}` : ""} made this`} color="lime" size="s" rotate={-3} /> : p.hot ? <GZSticker label="Hot" color="orange" icon="flame" size="s" rotate={-3} /> : null;
  return (
    <View style={{ width }}>
      <View style={{ height: width * cardRatio(p), borderRadius: 12, overflow: "hidden", backgroundColor: c.raised }}>
        {/* 视频卡片静音自动循环播放(像小红书 / TikTok 的双列):加载前先显示封面 */}
        <MediaVideo uri={video(p.id)} poster={poster(p.id)} style={StyleSheet.absoluteFill} muted loop autoPlay />
        <View style={styles.cardCount}>
          <Icon name="wand-sparkles" size={12} color={c.white} strokeWidth={2.6} />
          <Text style={[gz.display.tiny, { color: c.white }, gz.textShadow]}>{fmt(p.remixes)}</Text>
        </View>
      </View>
      {sticker ? <View style={{ position: "absolute", left: 6, top: 8 }}>{sticker}</View> : null}
      <Text style={[gz.body.caption, { color: c.text, fontWeight: "500", marginTop: 7 }]} numberOfLines={2}>
        {p.caption}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
        <Avatar id={p.author} size={18} />
        <Text style={[gz.body.micro, { fontWeight: "400", color: c.text3, flex: 1 }]} numberOfLines={1}>
          {creator(p.author).name}
        </Text>
        <Icon name="heart" size={13} color={c.text3} strokeWidth={2.4} />
        <Text style={[gz.body.micro, { fontWeight: "400", color: c.text3 }]}>{fmt(p.likes)}</Text>
      </View>
    </View>
  );
}

function Inspiration({ top }: { top: number }) {
  const { d } = useV2();
  const [cat, setCat] = useState<Category>("Trending");
  const [w, setW] = useState(0);
  const list = useMemo(() => (cat === "Trending" ? [...POSTS].sort((a, b) => b.remixes - a.remixes) : POSTS.filter((p) => p.cat === cat)), [cat]);
  const ids = list.map((p) => p.id);
  const colW = w ? (w - 10 * 2 - 8) / 2 : 0;
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
    <ScrollView style={{ flex: 1, backgroundColor: c.page }} contentContainerStyle={{ paddingTop: top, paddingBottom: 20 }} showsVerticalScrollIndicator={false} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {CATEGORIES.map((x) => (
          <GZChip key={x} label={x} on={x === cat} onPress={() => setCat(x)} />
        ))}
      </ScrollView>
      {colW ? (
        <View style={styles.grid}>
          {cols.map((col, k) => (
            <View key={k} style={{ gap: 18 }}>
              {col.map((p) => (
                <Pressable key={p.id} onPress={() => d({ type: "push", route: { name: "post", postId: p.id, list: ids } })} accessibilityLabel={p.caption} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
                  <Card p={p} width={colW} />
                </Pressable>
              ))}
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
  const suggest = CREATORS.filter((x) => x.id !== "buzz").slice(0, 6);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.page }} contentContainerStyle={{ paddingTop: top + 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      {/* 朋友的新作品(青柠圈 = 没看过):没关注任何创作者时，先从认识的人开始 */}
      <SectionLabel style={{ marginTop: 6, marginBottom: 10 }}>Your friends</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
        {FRIENDS.map((f, i) => (
          <Pressable key={f.id} onPress={() => d({ type: "push", route: { name: "post", postId: ["museum", "skate", "alice", "cityjump"][i] } })} style={{ alignItems: "center", gap: 6 }} accessibilityLabel={`${f.name}'s new video`}>
            <RingAvatar size={58} seen={i === 3}>
              <Face uri={f.avatar} size={58} />
            </RingAvatar>
            <Text style={[gz.display.tiny, { color: i === 3 ? c.text3 : c.white }]}>{f.name.toLowerCase()}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[gz.display.title, { color: c.white, marginTop: 28, marginHorizontal: 16 }]}>Creators your friends follow</Text>
      <Text style={[gz.body.caption, { color: c.text3, marginTop: 6, marginHorizontal: 16, marginBottom: 8 }]}>Follow a few and their new videos show up here.</Text>
      {/* 列表 + 发丝线，不用灰卡片;关注和朋友有关 → 青柠按钮 */}
      {suggest.map((x, i) => {
        const fr = FRIENDS[i % FRIENDS.length];
        return (
          <View key={x.id}>
            {i ? <Hairline inset={80} /> : null}
            <View style={styles.suggestRow}>
              <Pressable onPress={() => d({ type: "push", route: { name: "profile", userId: x.id } })} accessibilityLabel={x.name} style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <Avatar id={x.id} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={[gz.display.label, { color: c.white }]} numberOfLines={1}>
                    {x.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <Face uri={fr.avatar} size={16} />
                    <Text style={[gz.body.caption, { color: c.text3 }]} numberOfLines={1}>
                      {fr.name.toLowerCase()} follows
                    </Text>
                  </View>
                </View>
              </Pressable>
              <GZButton label="Follow" variant="lime" size="s" onPress={() => d({ type: "follow", id: x.id })} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ---------- 首页 ---------- */

const TABS: { id: HomeTab; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "inspiration", label: "Inspiration" },
  { id: "foryou", label: "For You" },
];

/** 首页:内容区底部 20pt 圆角(底部栏是下面一条实底黑条，由 AppS 渲染) */
export default function Home() {
  const { s, d } = useV2();
  const insets = useInsets();
  const onVideo = s.homeTab === "foryou" || (s.homeTab === "following" && s.follows.length > 0);
  const top = insets.top + 52;
  // For You 的顺序:Instagram @buzzvideo.global 的全部视频(从新到旧)在前，再接其他素材(见 data.ts 的 FOR_YOU)
  const forYou = useMemo(() => FOR_YOU.map(post), []);
  return (
    <View style={styles.home}>
      {s.homeTab === "foryou" ? <Feed list={forYou} bottomPad={8} coach={s.coach} /> : s.homeTab === "inspiration" ? <Inspiration top={top} /> : <Following top={top} bottomPad={8} />}
      {/* 顶栏(组件库 GZFeedHeader 的形态):消息 · 三个频道居中(选中一块白贴纸) · 搜索。积分不放首页，画面留给内容 */}
      <View style={[styles.topBar, { paddingTop: insets.top }, !onVideo && { backgroundColor: c.page }]}>
        <View style={styles.feedHead}>
          <View pointerEvents="box-none" style={styles.feedHeadCenter}>
            <GZFeedTabs tabs={TABS.map((x) => x.label)} current={TABS.find((x) => x.id === s.homeTab)!.label} onChange={(label) => d({ type: "homeTab", tab: TABS.find((x) => x.label === label)!.id })} />
          </View>
          <GZIconButton icon="bell" onVideo={onVideo} badge={s.unread || undefined} label="Inbox" size={38} onPress={() => d({ type: "push", route: { name: "inbox" } })} />
          <View style={{ flex: 1 }} />
          <GZIconButton icon="search" onVideo={onVideo} label="Search" size={38} onPress={() => d({ type: "toast", text: "Search opens here" })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1, backgroundColor: c.black, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" },
  center: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  playBadge: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", paddingLeft: 5 },
  rail: { position: "absolute", right: 8, alignItems: "center" },
  meta: { position: "absolute", left: 14, right: 84, gap: 8 },
  followPlus: { position: "absolute", bottom: -9, width: 22, height: 22, borderRadius: 11, backgroundColor: c.lime, borderWidth: 2, borderColor: c.black, alignItems: "center", justifyContent: "center" },
  coach: { position: "absolute", right: 74 },
  progress: { position: "absolute", left: 14, right: 14, bottom: 4 },
  topBar: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 10 },
  feedHead: { flexDirection: "row", alignItems: "center", height: 52, paddingHorizontal: 10 },
  feedHeadCenter: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  cats: { paddingHorizontal: 10, gap: 8, paddingTop: 6, paddingBottom: 14 },
  grid: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10 },
  cardCount: { position: "absolute", left: 7, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  suggestRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
});
