import { useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GZAvatar, GZBlock, GZButton, GZIconButton, GZListRow, GZPhoto, GZSegmented, GZStats, GZSticker, gz } from "../../kit/gz";
import { CHALLENGES, FRIENDS, MISSIONS, NOTICES, POSTS, STREAK, challenge, creator, fmt, levelOf, post, poster, resultOf, type Post } from "../data";
import { Foot, Hairline, RowIcon, Scrim, SectionLabel, Tag } from "../parts";
import { readyCount, useV2 } from "../store";
import { Avatar, CreditsChip, Face, Flame, Header, RingAvatar, Stack, useV1Routes } from "../ui";
import { Icon, USER, useInsets, useStore } from "../v1";
import { isEnterprise } from "../../../buzzvideo-app/app/store";
import type { GZColor } from "../../kit/gz";
import { Feed } from "./Home";

const c = gz.color;

type GridItem = { key: string; postId: string; count?: string; countIcon?: "play" | "heart"; progress?: number; sticker?: ReactNode };

/** 作品网格一格(组件库 GZGridCell 的样子:8pt 圆角 + 3pt 缝，左上最多一颗贴纸;多了一个点赞数用的爱心图标) */
function Cell({ it, width }: { it: GridItem; width: number }) {
  return (
    <View style={{ width, height: width * 1.33, borderRadius: 8, overflow: "hidden", backgroundColor: c.raised }}>
      <Image source={{ uri: poster(it.postId) }} style={[StyleSheet.absoluteFill, it.progress !== undefined ? { opacity: 0.35 } : null]} resizeMode="cover" />
      {it.progress !== undefined ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={[gz.display.title, { color: c.white }]}>{Math.round(it.progress * 100)}%</Text>
        </View>
      ) : null}
      {it.count ? (
        <>
          <Scrim edge="bottom" height={36} strength={0.45} />
          <View style={{ position: "absolute", left: 6, bottom: 5, flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Icon name={it.countIcon ?? "play"} size={11} color={c.white} fill={c.white} strokeWidth={1} />
            <Text style={[gz.display.tiny, { color: c.white }, gz.textShadow]}>{it.count}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

/** 三列作品网格 */
function Grid({ items, onOpen, w }: { items: GridItem[]; onOpen: (i: number) => void; w: number }) {
  const cell = (w - 32 - 6) / 3;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, paddingHorizontal: 16 }}>
      {items.map((it, i) => (
        <Pressable key={it.key} onPress={() => onOpen(i)} accessibilityLabel="Open video" style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
          <Cell it={it} width={cell} />
          {it.sticker ? <View style={{ position: "absolute", left: 5, top: 6 }}>{it.sticker}</View> : null}
        </Pressable>
      ))}
    </View>
  );
}

function Empty({ text, cta, onPress }: { text: string; cta?: string; onPress?: () => void }) {
  return (
    <View style={{ paddingVertical: 40, paddingHorizontal: 40, alignItems: "center", gap: 16 }}>
      <Text style={[gz.body.body, { color: c.text3, textAlign: "center" }]}>{text}</Text>
      {cta && onPress ? <GZButton label={cta} size="m" onPress={onPress} style={{ alignSelf: "center" }} /> : null}
    </View>
  );
}

/**
 * 订阅身份贴纸(同第一版「我的」名字旁的 PlanBadge):Free / Starter / Pro / Ultra / Enterprise。
 * 颜色按档位从轻到重:Free 白 · Starter 天蓝 · Pro 主橙 · Ultra 黑;在组织空间里显示 Enterprise
 */
const PLAN_STICKER: Record<string, { label: string; color: GZColor }> = {
  free: { label: "Free", color: "white" },
  starter: { label: "Starter", color: "sky" },
  pro: { label: "Pro", color: "orange" },
  ultra: { label: "Ultra", color: "ink" },
  enterprise: { label: "Enterprise", color: "ink" },
};
function PlanSticker() {
  const { state } = useStore();
  const tier = isEnterprise(state) && state.workspace !== "personal" ? "enterprise" : state.subscription.plan;
  const p = PLAN_STICKER[tier] ?? PLAN_STICKER.free;
  return <GZSticker label={p.label} color={p.color} size="s" rotate={-4} />;
}

/* ---------- 我的:身份(大名字 + 火苗 + 等级贴纸)+ 签到色块 + 作品 ---------- */

type MeTab = "posts" | "starring" | "saved" | "likes";
const ME_TABS: { id: MeTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "starring", label: "Twin" },
  { id: "saved", label: "Saved" },
  { id: "likes", label: "Likes" },
];

export function Me() {
  const { s, d } = useV2();
  const insets = useInsets();
  const v1 = useV1Routes();
  const [tab, setTab] = useState<MeTab>("posts");
  const [w, setW] = useState(0);
  const ready = readyCount(s);
  const lv = levelOf(s.xp);
  const drafts: (GridItem & { jobId: string })[] = s.jobs.map((j) => ({ key: j.id, postId: j.status === "done" ? resultOf(j) : j.postId, sticker: j.status === "done" ? <GZSticker label="Draft" color="white" size="s" rotate={-4} /> : undefined, progress: j.status === "done" ? undefined : j.progress, jobId: j.id }));
  // 每格一颗贴纸:被人做过同款(青柠) > 置顶(白)
  const mine: (GridItem & { myId: string })[] = s.posts.map((x, i) => ({ key: x.id, postId: x.postId, count: fmt(x.likes * 9 + 12), sticker: x.remixes ? <GZSticker label={`${x.remixes} remixes`} color="lime" size="s" rotate={3} /> : i === 0 ? <GZSticker label="Pinned" color="white" size="s" rotate={-4} /> : undefined, myId: x.id }));
  const liked: GridItem[] = s.likes.map((id) => ({ key: id, postId: id, count: fmt(post(id).likes + 1), countIcon: "heart" }));
  const saved: GridItem[] = s.saves.map((id) => ({ key: "sv" + id, postId: id, count: fmt(post(id).likes), countIcon: "heart" }));
  const starring: GridItem[] = (s.twin === "ready" ? s.posts : []).map((x) => ({ key: "s" + x.id, postId: x.postId, count: fmt(x.likes) }));
  const readyDrafts = s.jobs.filter((j) => j.status === "done");
  const postBonus = (["firstPost"] as const).filter((k) => !s.claimed.includes(k)).reduce((n, k) => n + MISSIONS.find((m) => m.id === k)!.reward, 0);
  const remixedMe = s.posts.reduce((n, x) => n + x.remixes, 0);
  const done = s.claimedToday && s.streak % STREAK.length === 0 ? STREAK.length : s.streak % STREAK.length;
  const next = STREAK[s.streak % STREAK.length];
  const today = s.claimedToday ? STREAK[(s.streak + STREAK.length - 1) % STREAK.length] : next;
  return (
    <View style={{ flex: 1, backgroundColor: c.page, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 18, flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
          <GZPhoto uri={USER.avatar} w={92} h={92} rotate={-4} radius={46} />
          <View style={{ flex: 1, gap: 8, paddingBottom: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={[gz.display.hero, { color: c.white, flexShrink: 1 }]} numberOfLines={1}>
                {USER.name.toLowerCase()}
              </Text>
              <PlanSticker />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityLabel={`Level ${lv.lv}, ${lv.title}`}>
              <Flame n={s.postStreak} chip />
              <GZSticker label={`Lv ${lv.lv} · ${lv.title}`} color="lilac" size="s" rotate={3} />
            </View>
            <Text style={[gz.body.micro, { fontWeight: "400", color: c.text3 }]}>{lv.max ? "Max level" : `${lv.span - lv.into} XP to next level`}</Text>
          </View>
        </View>
        <View style={{ marginTop: 22 }}>
          <GZStats
            items={[
              { n: fmt(s.follows.length + 12), label: "Following" },
              { n: fmt(s.posts.length ? 348 : 0), label: "Followers" },
              { n: fmt(remixedMe), label: "Remixed you", color: "lime" },
            ]}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 18 }}>
          <View style={{ flex: 1 }}>
            <GZButton label={s.twin === "ready" ? "My Twin" : "Create my Twin"} variant="dark" size="m" block onPress={() => d({ type: "push", route: { name: "twin" } })} />
          </View>
          <View style={{ flex: 1 }}>
            <GZButton label="Invite friends" variant="dark" size="m" icon="user-plus" block onPress={v1.invite} />
          </View>
        </View>

        {/* 签到:一整块黄油色(积分 / 今天)。打开 APP 已自动到账，这里只看进度，点进任务中心 */}
        <Pressable onPress={() => d({ type: "push", route: { name: "rewards" } })} accessibilityRole="button" style={({ pressed }) => [{ paddingHorizontal: 16, marginTop: 18 }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <GZBlock color="butter" rotate={-1}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text style={[gz.display.head, { color: c.ink }]}>Day {Math.max(1, done)} of 7</Text>
                <Text style={[gz.body.caption, { color: "rgba(0,0,0,0.7)", marginTop: 2 }]}>{s.claimedToday ? `Tomorrow: +${next} credits` : "Today's credits are waiting"}</Text>
              </View>
              <Text style={[gz.display.title, { color: c.ink }]}>+{today}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 5, marginTop: 12 }}>
              {STREAK.map((_, i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < done ? c.ink : "rgba(0,0,0,0.15)" }} />
              ))}
            </View>
            <Text style={[gz.display.tiny, { color: c.ink, marginTop: 10 }]}>{ready ? `${ready} reward${ready > 1 ? "s" : ""} to claim ›` : "Missions ›"}</Text>
          </GZBlock>
        </Pressable>

        {readyDrafts.length ? (
          <View style={styles.nudge}>
            <Image source={{ uri: poster(resultOf(readyDrafts[0])) }} style={{ width: 42, height: 56, borderRadius: 8, backgroundColor: c.raised }} />
            <View style={{ flex: 1 }}>
              <Text style={[gz.body.strong, { color: c.white }]} numberOfLines={1}>
                {readyDrafts.length} draft{readyDrafts.length > 1 ? "s" : ""} ready to post
              </Text>
              <Text style={[gz.body.caption, { color: c.text2, marginTop: 2 }]} numberOfLines={2}>
                {postBonus ? `Post now and earn up to ${postBonus} credits` : "Post it and keep your streak"}
              </Text>
            </View>
            <GZButton label="Post" size="s" onPress={() => d({ type: "push", route: { name: "result", jobId: readyDrafts[0].id } })} />
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 18, marginBottom: 12 }}>
          <GZSegmented options={ME_TABS.map((x) => x.label)} value={ME_TABS.find((x) => x.id === tab)!.label} onChange={(label) => setTab(ME_TABS.find((x) => x.label === label)!.id)} />
        </View>
        {w ? (
          tab === "posts" ? (
            drafts.length + mine.length ? (
              <Grid
                w={w}
                items={[...drafts, ...mine]}
                onOpen={(i) => {
                  if (i < drafts.length) d({ type: "push", route: { name: "result", jobId: drafts[i].jobId } });
                  else d({ type: "push", route: { name: "post", postId: mine[i - drafts.length].postId, mine: mine[i - drafts.length].myId } });
                }}
              />
            ) : (
              <Empty text="Your videos show up here. Your friends are already remixing — join in." cta="Make my first video" onPress={() => d({ type: "tab", tab: "create" })} />
            )
          ) : tab === "starring" ? (
            starring.length ? (
              <Grid w={w} items={starring} onOpen={(i) => d({ type: "push", route: { name: "post", postId: starring[i].postId } })} />
            ) : (
              <Empty text="Videos starring your Twin show up here." cta={s.twin === "ready" ? "Star in a video" : "Create my Twin"} onPress={() => (s.twin === "ready" ? d({ type: "tab", tab: "create" }) : d({ type: "push", route: { name: "twin" } }))} />
            )
          ) : tab === "saved" ? (
            saved.length ? <Grid w={w} items={saved} onOpen={(i) => d({ type: "push", route: { name: "post", postId: saved[i].postId, list: saved.map((x) => x.postId) } })} /> : <Empty text="Tap the bookmark on any video to save it. Only you can see these." />
          ) : liked.length ? (
            <Grid w={w} items={liked} onOpen={(i) => d({ type: "push", route: { name: "post", postId: liked[i].postId, list: liked.map((x) => x.postId) } })} />
          ) : (
            <Empty text="Videos you like show up here. Only you can see them." />
          )
        ) : null}
      </ScrollView>
      <View style={[styles.meTop, { paddingTop: insets.top }]}>
        <CreditsChip />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <GZIconButton icon="gift" size={36} badge={ready || undefined} onPress={() => d({ type: "push", route: { name: "rewards" } })} label="Rewards" />
          <GZIconButton icon="bell" size={36} badge={s.unread || undefined} onPress={() => d({ type: "push", route: { name: "inbox" } })} label="Activity" />
          <GZIconButton icon="settings" size={36} onPress={v1.settings} label="Settings" />
        </View>
      </View>
    </View>
  );
}

/* ---------- 作者主页 ---------- */

export function Profile({ userId }: { userId: string }) {
  const { s, d } = useV2();
  const cr = creator(userId);
  const [w, setW] = useState(0);
  const list = POSTS.filter((p) => p.author === userId);
  const following = s.follows.includes(userId);
  const remixed = list.reduce((n, p) => n + p.remixes, 0);
  const fans = FRIENDS.slice(0, 2);
  return (
    <View style={{ flex: 1, backgroundColor: c.page }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Header title={cr.name} right={<GZIconButton icon="ellipsis" size={36} onPress={() => d({ type: "toast", text: "Report or block" })} label="More" />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: "center", paddingTop: 10, paddingHorizontal: 32 }}>
          <View style={{ padding: 3, borderRadius: 48, backgroundColor: c.white, transform: [{ rotate: "-4deg" }] }}>
            <Avatar id={userId} size={88} />
          </View>
          {/* 名字旁边就是关注(像 Instagram / 小红书)：没关注是橙色 Follow,关注后变灰 Following */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
            <Text style={[gz.display.title, { color: c.white, flexShrink: 1 }]} numberOfLines={1}>
              @{cr.handle}
            </Text>
            <GZButton label={following ? "Following" : "Follow"} variant={following ? "dark" : "primary"} size="s" onPress={() => d({ type: "follow", id: userId })} />
          </View>
          <Text style={[gz.body.body, { color: c.text2, textAlign: "center", marginTop: 6 }]}>{cr.bio}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Stack uris={fans.map((f) => f.avatar)} size={20} ring={c.page} />
            <Text style={[gz.body.caption, { color: c.text3 }]}>
              Followed by <Text style={{ color: c.white, fontWeight: "600" }}>{fans.map((f) => f.name.toLowerCase()).join(" and ")}</Text>
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 20 }}>
          <GZStats
            items={[
              { n: fmt(cr.followers + (following ? 1 : 0)), label: "Followers" },
              { n: fmt(cr.likes), label: "Likes" },
              { n: fmt(remixed), label: "Remixed", color: "lime" },
            ]}
          />
        </View>
        <View style={{ height: 18 }} />
        {w ? (
          <Grid
            w={w}
            items={list.map((p) => ({ key: p.id, postId: p.id, count: fmt(p.likes * 9), sticker: p.hot ? <GZSticker label={`${fmt(Math.round(p.remixes / 100) * 100)} remixes`} color="lime" size="s" rotate={3} /> : undefined }))}
            onOpen={(i) => d({ type: "push", route: { name: "post", postId: list[i].id, list: list.map((p) => p.id) } })}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

/* ---------- 单条视频(从网格 / 瀑布流点进来):上下滑同一个列表 ---------- */

export function PostViewer({ postId, list, mine }: { postId: string; list?: string[]; mine?: string }) {
  const { s, d } = useV2();
  const insets = useInsets();
  const posts: Post[] = useMemo(() => (list ?? [postId]).map(post), [list, postId]);
  const my = mine ? s.posts.find((x) => x.id === mine) : undefined;
  return (
    <View style={{ flex: 1, backgroundColor: c.black }}>
      <Feed list={posts} bottomPad={insets.bottom + 8} initial={Math.max(0, posts.findIndex((p) => p.id === postId))} mine={my ? { [postId]: { id: my.id, caption: my.caption } } : undefined} />
      <View style={[styles.viewerTop, { top: insets.top + 6 }]}>
        <GZIconButton icon="chevron-left" onVideo size={38} onPress={() => d({ type: "pop" })} label="Back" />
      </View>
    </View>
  );
}

/* ---------- 消息(Activity):回来的理由 ---------- */

const B = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: "700", color: c.white }}>{children}</Text>;

function ActRow({ avatars, text, meta, right, onPress }: { avatars: string[]; text: ReactNode; meta: string; right?: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actRow, pressed && onPress ? { backgroundColor: "rgba(255,255,255,0.05)" } : null]}>
      <View style={{ width: 48, height: 48 }}>
        {avatars.length > 1 ? (
          <>
            <Image source={{ uri: avatars[0] }} style={[styles.actAv, { top: 0, left: 0 }]} />
            <Image source={{ uri: avatars[1] }} style={[styles.actAv, { bottom: 0, right: 0, borderWidth: 2, borderColor: c.page }]} />
          </>
        ) : (
          <GZAvatar uri={avatars[0]} size={48} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[gz.body.body, { color: c.text }]} numberOfLines={2}>
          {text}
        </Text>
        <Text style={[gz.body.caption, { color: c.text3, marginTop: 2 }]}>{meta}</Text>
      </View>
      {right}
    </Pressable>
  );
}

export function Inbox() {
  const { s, d } = useV2();
  const live = CHALLENGES.filter((x) => x.live);
  const mineId = s.posts[0]?.postId;
  const thumb = (id: string) => <Image source={{ uri: poster(id) }} style={{ width: 42, height: 56, borderRadius: 8 }} />;
  const f = (id: string) => FRIENDS.find((x) => x.id === id)!;
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Header title="Activity" right={<Flame n={s.postStreak} chip />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* 朋友的新作品:青柠圈 = 没看过 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16, paddingTop: 8 }}>
          {FRIENDS.map((x, i) => (
            <Pressable key={x.id} onPress={() => d({ type: "push", route: { name: "post", postId: ["museum", "skate", "alice", "cityjump"][i] } })} style={{ alignItems: "center", gap: 6 }} accessibilityLabel={`${x.name}'s new video`}>
              <RingAvatar size={58} seen={i === 3}>
                <Face uri={x.avatar} size={58} />
              </RingAvatar>
              <Text style={[gz.display.tiny, { color: i === 3 ? c.text3 : c.white }]}>{x.name.toLowerCase()}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 里程碑:值得庆祝 → 一整块青柠色贴纸卡 + 作品照片贴纸(发过作品后才有) */}
        {mineId ? (
          <Pressable onPress={() => d({ type: "push", route: { name: "post", postId: mineId, mine: s.posts[0].id } })} accessibilityRole="button" style={({ pressed }) => [{ marginHorizontal: 16, marginTop: 20 }, pressed && { transform: [{ scale: 0.98 }] }]}>
            <GZBlock color="lime" rotate={-1.5}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[gz.display.tiny, { color: "rgba(0,0,0,0.65)" }]}>MILESTONE</Text>
                  <Text style={[gz.display.title, { color: c.ink, marginTop: 4 }]}>Your remix hit 1K views</Text>
                  <Text style={[gz.body.caption, { color: "rgba(0,0,0,0.7)", marginTop: 4 }]}>Faster than 82% of first posts</Text>
                </View>
                <GZPhoto uri={poster(mineId)} w={56} h={74} rotate={7} radius={10} />
              </View>
            </GZBlock>
          </Pressable>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <GZListRow
            leading={<RowIcon icon="trophy" color="orange" />}
            title={<Text style={{ fontWeight: "600" }}>Challenges</Text>}
            sub={`${live.length} live now · ${f("lily").name} joined Pet Star Week`}
            right={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {s.unread ? <View style={styles.dot} /> : null}
                <Icon name="chevron-right" size={18} color={c.text3} strokeWidth={2.4} />
              </View>
            }
            onPress={() => {
              d({ type: "readInbox" });
              d({ type: "push", route: { name: "challenges" } });
            }}
          />
        </View>

        <SectionLabel>Today</SectionLabel>
        {mineId ? (
          <>
            <ActRow avatars={[f("lily").avatar, f("zoe").avatar]} text={<><B>Lily, Zoe</B> and 21 others remixed your video</>} meta="2m · +5 credits each" right={thumb(mineId)} onPress={() => d({ type: "push", route: { name: "template", postId: mineId } })} />
            <ActRow avatars={[f("max").avatar, f("ben").avatar]} text={<><B>Max, Ben</B> and 214 others liked your remix</>} meta="1h" right={thumb(mineId)} />
            <ActRow avatars={[f("zoe").avatar]} text={<><B>Zoe</B> commented: &ldquo;the hat on you though 😭&rdquo;</>} meta="3h" right={thumb(mineId)} onPress={() => d({ type: "sheet", sheet: { name: "comments", postId: mineId } })} />
          </>
        ) : null}
        <ActRow avatars={[f("max").avatar]} text={<><B>Max</B> challenged you: remix <B>Royal Dance-off</B></>} meta="18m" right={<GZButton label="Remix" size="s" onPress={() => d({ type: "push", route: { name: "template", postId: "kings" } })} />} />
        <ActRow avatars={[f("lily").avatar]} text={<><B>Lily</B> posted for the 9th day in a row 🔥</>} meta="40m" right={thumb("museum")} onPress={() => d({ type: "push", route: { name: "post", postId: "museum" } })} />
        <ActRow avatars={[f("ben").avatar]} text={<><B>Ben</B> started following you</>} meta="3h" right={s.follows.includes("ben") ? <GZButton label="Friends" size="s" variant="dark" onPress={() => d({ type: "follow", id: "ben" })} /> : <GZButton label="Follow back" size="s" variant="lime" onPress={() => d({ type: "follow", id: "ben" })} />} />

        <SectionLabel>From BuzzVideo</SectionLabel>
        {NOTICES.map((n) => (
          <ActRow
            key={n.id}
            avatars={["/prototypes/buzzvideo-app/app-logo.svg"]}
            text={n.text}
            meta={n.ago}
            onPress={() => (n.id === "n1" ? d({ type: "push", route: { name: "challenge", id: "history" } }) : n.id === "n3" ? d({ type: "push", route: { name: "rewards" } }) : d({ type: "tab", tab: "create" }))}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- 挑战活动 ---------- */

export function Challenges() {
  const { d } = useV2();
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Header title="Challenges" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>
        {CHALLENGES.map((x, i) => (
          <View key={x.id}>
            {i ? <Hairline /> : null}
            <Pressable onPress={() => d({ type: "push", route: { name: "challenge", id: x.id } })} accessibilityLabel={x.title} style={({ pressed }) => [styles.chRow, pressed && { backgroundColor: "rgba(255,255,255,0.05)" }]}>
              <View style={styles.chCover}>
                <Image source={{ uri: poster(x.cover) }} style={[StyleSheet.absoluteFill, !x.live && { opacity: 0.6 }]} resizeMode="cover" />
                <View style={{ position: "absolute", left: 6, top: 6 }}>
                  <Tag label={x.live ? "Live" : "Ended"} color={x.live ? "lime" : "ink"} />
                </View>
              </View>
              <View style={{ flex: 1, paddingVertical: 2, gap: 4 }}>
                <Text style={[gz.display.head, { color: x.live ? c.white : c.text2 }]} numberOfLines={2}>
                  {x.title}
                </Text>
                <Text style={[gz.body.caption, { color: c.text2 }]} numberOfLines={2}>
                  {x.reward}
                </Text>
                <View style={{ flex: 1 }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {x.live && i < 2 ? <Stack uris={FRIENDS.slice(i, i + 2).map((f) => f.avatar)} size={18} ring={c.page} /> : null}
                  <Text style={[gz.body.caption, { color: c.text3, flexShrink: 1 }]} numberOfLines={1}>
                    {fmt(x.entries)} entries · {x.dates}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ChallengeDetail({ id }: { id: string }) {
  const { s, d } = useV2();
  const insets = useInsets();
  const ch = challenge(id);
  const joined = s.joined.includes(id);
  const friends = ch.live ? FRIENDS.slice(0, 3) : [];
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 300, backgroundColor: c.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" }}>
          <Image source={{ uri: poster(ch.cover) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Scrim edge="top" height={120} strength={0.35} />
          <Scrim edge="bottom" height={150} strength={0.55} />
          <View style={{ position: "absolute", left: 16, bottom: 16 }}>
            <GZSticker label={ch.live ? "Live" : "Ended"} color={ch.live ? "lime" : "white"} rotate={-3} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={[gz.display.hero, { color: c.white }]}>{ch.title}</Text>
          <Text style={[gz.body.caption, { color: c.text3, marginTop: 8 }]}>
            {ch.dates} · {fmt(ch.entries)} entries
          </Text>
        </View>
        <View style={{ marginTop: 14 }}>
          {friends.length ? (
            <>
              <View style={styles.infoRow}>
                <Stack uris={friends.map((f) => f.avatar)} size={28} ring={c.page} />
                <Text style={[gz.body.caption, { color: c.text2, flex: 1 }]}>
                  <Text style={{ color: c.white, fontWeight: "600" }}>{friends.map((f) => f.name).join(", ")}</Text> are in. Lily is ranked #214.
                </Text>
              </View>
              <Hairline />
            </>
          ) : null}
          <View style={styles.infoRow}>
            <RowIcon icon="trophy" color="butter" />
            <Text style={[gz.body.strong, { color: c.white, flex: 1 }]}>{ch.reward}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[gz.body.body, { color: c.text2, marginTop: 10 }]}>{ch.desc}</Text>
          <Text style={[gz.display.head, { color: c.white, marginTop: 26, marginBottom: 12 }]}>How it works</Text>
          {ch.rules.map((r, i) => (
            <View key={r} style={{ flexDirection: "row", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
              <View style={styles.ruleN}>
                <Text style={[gz.display.tiny, { color: c.ink }]}>{i + 1}</Text>
              </View>
              <Text style={[gz.body.body, { color: c.text, flex: 1 }]}>{r}</Text>
            </View>
          ))}
          <Text style={[gz.display.head, { color: c.white, marginTop: 26, marginBottom: 12 }]}>Top entries</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 4 }}>
          {ch.examples.map((e, i) => (
            <Pressable key={e} onPress={() => d({ type: "push", route: { name: "post", postId: e, list: ch.examples } })} accessibilityLabel={post(e).caption} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
              <View style={styles.example}>
                <Image source={{ uri: poster(e) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Scrim edge="bottom" height={50} strength={0.5} />
                <View style={styles.exampleFoot}>
                  <Icon name="heart" size={12} color={c.white} fill={c.white} strokeWidth={1} />
                  <Text style={[gz.display.tiny, { color: c.white }, gz.textShadow]}>{fmt(post(e).likes)}</Text>
                </View>
              </View>
              <View style={{ position: "absolute", left: 5, top: -2 }}>
                <GZSticker label={`#${i + 1}`} color="orange" size="s" rotate={-5} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
      <Header tone="onImage" right={<GZIconButton icon="share" onVideo size={36} onPress={() => d({ type: "toast", text: "Link copied" })} label="Share" />} />
      {ch.live ? (
        <Foot bottom={insets.bottom + 12}>
          <GZButton
            label={joined ? "Make my entry" : "Join the challenge"}
            onPress={() => {
              if (!joined) d({ type: "join", id });
              d({ type: "push", route: { name: "template", postId: ch.examples[0] } });
            }}
          />
        </Foot>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  meTop: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 8, minHeight: 52, backgroundColor: c.page },
  nudge: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 14, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
  viewerTop: { position: "absolute", left: 10 },
  actRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  actAv: { position: "absolute", width: 34, height: 34, borderRadius: 17, backgroundColor: c.raised },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.lime },
  chRow: { flexDirection: "row", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  chCover: { width: 120, height: 96, borderRadius: 12, overflow: "hidden", backgroundColor: c.surface },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  ruleN: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.white, alignItems: "center", justifyContent: "center", marginTop: -1 },
  example: { width: 120, height: 168, borderRadius: 12, overflow: "hidden", backgroundColor: c.surface },
  exampleFoot: { position: "absolute", left: 7, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4 },
});
