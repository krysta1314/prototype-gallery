import { useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CHALLENGES, FRIENDS, MISSIONS, NOTICES, POSTS, STREAK, challenge, creator, fmt, levelOf, post, poster, resultOf, type Post } from "../data";
import { KButton, KGridCell, KIconButton, KIconTabs, KListRow, KNudge, KRowIcon, KStreak, KTag } from "../kit/components";
import { tk } from "../kit/tokens";
import { readyCount, useV2 } from "../store";
import { Avatar, BRAND, CreditsChip, Face, Flame, Header, RingAvatar, Stack, useV1Routes } from "../ui";
import { Gradient, Icon, USER, useInsets } from "../v1";
import { Feed } from "./Home";

const c = tk.color;
const t = tk.type;

/** 三列作品网格(组件库 KGridCell:1pt 缝、无圆角) */
function Grid({ items, onOpen, w }: { items: { key: string; postId: string; tag?: string; count?: string; countIcon?: "play" | "heart"; progress?: number; remixes?: number }[]; onOpen: (i: number) => void; w: number }) {
  const cell = (w - 2) / 3;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
      {items.map((it, i) => (
        <Pressable key={it.key} onPress={() => onOpen(i)} accessibilityLabel="Open video">
          <KGridCell uri={poster(it.postId)} width={cell} count={it.count} countIcon={it.countIcon} tag={it.tag} progress={it.progress} />
          {it.remixes ? (
            <View style={styles.remixTag}>
              <Text style={[t.tab, { color: c.white, fontWeight: "700" }]}>{it.remixes} remixes</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function Empty({ text, cta, onPress }: { text: string; cta?: string; onPress?: () => void }) {
  return (
    <View style={{ paddingVertical: 40, paddingHorizontal: 40, alignItems: "center", gap: 14 }}>
      <Text style={[t.body, { color: c.text3, textAlign: "center" }]}>{text}</Text>
      {cta && onPress ? <KButton label={cta} size="m" onPress={onPress} /> : null}
    </View>
  );
}

/** 数据三栏:第三项「Remixed you」用主色，是创作者最想晒的数字 */
function Stats({ items }: { items: [string, string, boolean?][] }) {
  return (
    <View style={styles.stats}>
      {items.map(([n, label, hi]) => (
        <View key={label} style={{ flex: 1, alignItems: "center" }}>
          <Text style={[t.headline, { fontWeight: "700", color: hi ? c.primary : c.text }]}>{n}</Text>
          <Text style={[t.caption, { color: c.text3, marginTop: 2 }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- 我的 ---------- */

type MeTab = "posts" | "starring" | "saved" | "likes";

export function Me() {
  const { s, d } = useV2();
  const insets = useInsets();
  const v1 = useV1Routes();
  const [tab, setTab] = useState<MeTab>("posts");
  const [w, setW] = useState(0);
  const ready = readyCount(s);
  const lv = levelOf(s.xp);
  const drafts = s.jobs.map((j) => ({ key: j.id, postId: j.status === "done" ? resultOf(j) : j.postId, tag: j.status === "done" ? "Draft" : "Making", progress: j.status === "done" ? undefined : j.progress, jobId: j.id }));
  const mine = s.posts.map((x, i) => ({ key: x.id, postId: x.postId, count: fmt(x.likes * 9 + 12), tag: i === 0 ? "Pinned" : undefined, remixes: x.remixes || undefined, myId: x.id }));
  const liked = s.likes.map((id) => ({ key: id, postId: id, count: fmt(post(id).likes + 1), countIcon: "heart" as const }));
  const saved = s.saves.map((id) => ({ key: "sv" + id, postId: id, count: fmt(post(id).likes), countIcon: "heart" as const }));
  const starring = (s.twin === "ready" ? s.posts : []).map((x) => ({ key: "s" + x.id, postId: x.postId, count: fmt(x.likes) }));
  const readyDrafts = s.jobs.filter((j) => j.status === "done");
  const postBonus = (["firstPost", "shareTikTok", "shareInstagram"] as const).filter((k) => !s.claimed.includes(k)).reduce((n, k) => n + MISSIONS.find((m) => m.id === k)!.reward, 0);
  const remixedMe = s.posts.reduce((n, x) => n + x.remixes, 0);
  const done = s.claimedToday && s.streak % STREAK.length === 0 ? STREAK.length : s.streak % STREAK.length;
  return (
    <View style={{ flex: 1, backgroundColor: c.page, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: 24 }}>
        <View style={{ alignItems: "center" }}>
          <RingAvatar size={92} seen={!s.posts.length}>
            <Avatar id="me" size={88} />
          </RingAvatar>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
            <Text style={[t.title, { color: c.text }]}>{USER.name}</Text>
            <Flame n={s.postStreak} chip />
          </View>
          <View style={styles.levelChip} accessibilityLabel={`Level ${lv.lv}, ${lv.title}`}>
            <Gradient colors={BRAND} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <Text style={[t.tab, { color: c.white, fontWeight: "800" }]}>
              LV {lv.lv} · {lv.title.toUpperCase()}
            </Text>
          </View>
          <Text style={[t.micro, { fontWeight: "400", color: c.text3, marginTop: 6 }]}>{lv.max ? "Max level" : `${lv.span - lv.into} XP to next level`}</Text>
        </View>
        <Stats
          items={[
            [fmt(s.follows.length + 12), "Following"],
            [fmt(s.posts.length ? 348 : 0), "Followers"],
            [fmt(remixedMe), "Remixed you", true],
          ]}
        />
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <KButton label={s.twin === "ready" ? "My Twin" : "Create my Twin"} variant="secondary" size="m" block onPress={() => d({ type: "push", route: { name: "twin" } })} />
          </View>
          <View style={{ flex: 1 }}>
            <KButton label="Invite friends" variant="secondary" size="m" block onPress={v1.invite} />
          </View>
        </View>

        {/* 签到收成一行七格:打开 APP 已自动到账，这里只看进度 */}
        <Pressable onPress={() => d({ type: "push", route: { name: "rewards" } })} style={styles.checkin} accessibilityRole="button">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={[t.bodyStrong, { color: c.text }]}>Daily credits</Text>
            <Text style={[t.caption, { color: c.text3 }]}>{ready ? `${ready} reward${ready > 1 ? "s" : ""} to claim ›` : "Missions ›"}</Text>
          </View>
          <KStreak rewards={STREAK} done={done} today={s.claimedToday ? -1 : done} />
        </Pressable>

        {readyDrafts.length ? (
          <View style={{ marginHorizontal: 16, marginTop: 10 }}>
            <KNudge thumb={poster(resultOf(readyDrafts[0]))} title={`${readyDrafts.length} draft${readyDrafts.length > 1 ? "s" : ""} ready to post`} sub={postBonus ? `Post now and earn up to ${postBonus} credits` : "Post it and keep your streak"} cta="Post" onPress={() => d({ type: "push", route: { name: "result", jobId: readyDrafts[0].id } })} />
          </View>
        ) : null}

        <View style={{ marginTop: 14 }}>
          <KIconTabs
            tabs={[
              { id: "posts", icon: "layout-grid", label: "Posts" },
              { id: "starring", icon: "scan-face", label: "Twin" },
              { id: "saved", icon: "bookmark", label: "Saved" },
              { id: "likes", icon: "heart", label: "Likes" },
            ]}
            current={tab}
            onChange={(x) => setTab(x as MeTab)}
          />
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
              <Empty text="Your videos show up here. Your friends are already remixing — join in." cta="Make my first video" onPress={() => d({ type: "push", route: { name: "play" } })} />
            )
          ) : tab === "starring" ? (
            starring.length ? (
              <Grid w={w} items={starring} onOpen={(i) => d({ type: "push", route: { name: "post", postId: starring[i].postId } })} />
            ) : (
              <Empty text="Videos starring your Twin show up here." cta={s.twin === "ready" ? "Star in a video" : "Create my Twin"} onPress={() => d({ type: "push", route: s.twin === "ready" ? { name: "play" } : { name: "twin" } })} />
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
        <View style={{ flexDirection: "row" }}>
          <KIconButton icon="gift" badge={ready} onPress={() => d({ type: "push", route: { name: "rewards" } })} label="Rewards" />
          <KIconButton icon="bell" badge={s.unread} onPress={() => d({ type: "push", route: { name: "inbox" } })} label="Activity" />
          <KIconButton icon="settings" onPress={v1.settings} label="Settings" />
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
      <Header title={cr.name} right={<KIconButton icon="ellipsis" onPress={() => d({ type: "toast", text: "Report or block" })} label="More" />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: "center", paddingTop: 8, paddingHorizontal: 32 }}>
          <RingAvatar size={88}>
            <Avatar id={userId} size={84} />
          </RingAvatar>
          <Text style={[t.title, { color: c.text, marginTop: 10 }]}>@{cr.handle}</Text>
          <Text style={[t.body, { color: c.text2, textAlign: "center", marginTop: 4 }]}>{cr.bio}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
            <Stack uris={fans.map((f) => f.avatar)} size={18} ring={c.page} />
            <Text style={[t.caption, { color: c.text3 }]}>
              Followed by <Text style={{ color: c.text, fontWeight: "600" }}>{fans.map((f) => f.name).join(" and ")}</Text>
            </Text>
          </View>
        </View>
        <Stats
          items={[
            [fmt(cr.followers + (following ? 1 : 0)), "Followers"],
            [fmt(cr.likes), "Likes"],
            [fmt(remixed), "Remixed", true],
          ]}
        />
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <KButton label={following ? "Following" : "Follow"} variant={following ? "secondary" : "primary"} size="m" block onPress={() => d({ type: "follow", id: userId })} />
          </View>
          <KButton label="Remix their top video" variant="secondary" size="m" icon="wand-sparkles" onPress={() => d({ type: "push", route: { name: "template", postId: [...list].sort((a, b) => b.remixes - a.remixes)[0]?.id ?? "poodle" } })} />
        </View>
        <View style={{ height: 16 }} />
        {w ? <Grid w={w} items={list.map((p) => ({ key: p.id, postId: p.id, count: fmt(p.likes * 9), remixes: p.hot ? Math.round(p.remixes / 100) * 100 : undefined }))} onOpen={(i) => d({ type: "push", route: { name: "post", postId: list[i].id, list: list.map((p) => p.id) } })} /> : null}
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
      <View style={[styles.viewerTop, { paddingTop: insets.top }]}>
        <KIconButton icon="chevron-left" onVideo onPress={() => d({ type: "pop" })} label="Back" />
      </View>
    </View>
  );
}

/* ---------- 消息(Activity):回来的理由 ---------- */

const B = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: "700", color: c.white }}>{children}</Text>;

function ActRow({ avatars, text, meta, right, onPress }: { avatars: string[]; text: ReactNode; meta: string; right?: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actRow, pressed && onPress ? { backgroundColor: c.fill } : null]}>
      <View style={{ width: 48, height: 48 }}>
        {avatars.length > 1 ? (
          <>
            <Image source={{ uri: avatars[0] }} style={[styles.actAv, { top: 0, left: 0 }]} />
            <Image source={{ uri: avatars[1] }} style={[styles.actAv, { bottom: 0, right: 0, borderWidth: 2, borderColor: c.page }]} />
          </>
        ) : (
          <Image source={{ uri: avatars[0] }} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.raised }} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[t.body, { color: c.text }]} numberOfLines={2}>
          {text}
        </Text>
        <Text style={[t.caption, { color: c.text3, marginTop: 2 }]}>{meta}</Text>
      </View>
      {right}
    </Pressable>
  );
}

export function Inbox() {
  const { s, d } = useV2();
  const live = CHALLENGES.filter((x) => x.live);
  const mineId = s.posts[0]?.postId;
  const thumb = (id: string) => <Image source={{ uri: poster(id) }} style={{ width: 42, height: 56, borderRadius: tk.radius.sm }} />;
  const f = (id: string) => FRIENDS.find((x) => x.id === id)!;
  return (
    <View style={{ flex: 1, backgroundColor: c.page }}>
      <Header title="Activity" right={<Flame n={s.postStreak} chip />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* 朋友的新作品:故事圈(渐变圈 = 没看过) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16, paddingTop: 6 }}>
          {FRIENDS.map((x, i) => (
            <Pressable key={x.id} onPress={() => d({ type: "push", route: { name: "post", postId: ["museum", "skate", "alice", "cityjump"][i] } })} style={{ alignItems: "center", gap: 5 }} accessibilityLabel={`${x.name}'s new video`}>
              <RingAvatar size={58} seen={i === 3}>
                <Face uri={x.avatar} size={56} />
              </RingAvatar>
              <Text style={[t.micro, { fontWeight: "500", color: c.text2 }]}>{x.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 里程碑卡:发过作品后才有 */}
        {mineId ? (
          <Pressable onPress={() => d({ type: "push", route: { name: "post", postId: mineId, mine: s.posts[0].id } })} style={styles.milestone} accessibilityRole="button">
            <Gradient colors={BRAND} angle={120} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ flex: 1 }}>
              <Text style={[t.captionStrong, { color: "rgba(255,255,255,0.85)" }]}>MILESTONE</Text>
              <Text style={[t.title, { color: c.white }]}>Your remix hit 1K views</Text>
              <Text style={[t.caption, { color: "rgba(255,255,255,0.9)" }]}>Faster than 82% of first posts</Text>
            </View>
            <Image source={{ uri: poster(mineId) }} style={{ width: 54, height: 72, borderRadius: 6, transform: [{ rotate: "6deg" }] }} />
          </Pressable>
        ) : null}

        <View style={{ marginTop: 10 }}>
          <KListRow
            leading={<KRowIcon icon="trophy" />}
            title="Challenges"
            sub={`${live.length} live now · ${f("lily").name} joined Pet Star Week`}
            right={s.unread ? <View style={styles.dot} /> : undefined}
            chevron
            onPress={() => {
              d({ type: "readInbox" });
              d({ type: "push", route: { name: "challenges" } });
            }}
          />
        </View>

        <Text style={styles.label}>Today</Text>
        {mineId ? (
          <>
            <ActRow avatars={[f("lily").avatar, f("zoe").avatar]} text={<><B>Lily, Zoe</B> and 21 others remixed your video</>} meta="2m · +5 credits each" right={thumb(mineId)} onPress={() => d({ type: "push", route: { name: "template", postId: mineId } })} />
            <ActRow avatars={[f("max").avatar, f("ben").avatar]} text={<><B>Max, Ben</B> and 214 others liked your remix</>} meta="1h" right={thumb(mineId)} />
            <ActRow avatars={[f("zoe").avatar]} text={<><B>Zoe</B> commented: &ldquo;the hat on you though 😭&rdquo;</>} meta="3h" right={thumb(mineId)} onPress={() => d({ type: "sheet", sheet: { name: "comments", postId: mineId } })} />
          </>
        ) : null}
        <ActRow avatars={[f("max").avatar]} text={<><B>Max</B> challenged you: remix <B>Royal Dance-off</B></>} meta="18m" right={<KButton label="Remix" size="s" onPress={() => d({ type: "push", route: { name: "template", postId: "kings" } })} />} />
        <ActRow avatars={[f("lily").avatar]} text={<><B>Lily</B> posted for the 9th day in a row 🔥</>} meta="40m" right={thumb("museum")} onPress={() => d({ type: "push", route: { name: "post", postId: "museum" } })} />
        <ActRow avatars={[f("ben").avatar]} text={<><B>Ben</B> started following you</>} meta="3h" right={<KButton label={s.follows.includes("ben") ? "Friends" : "Follow back"} size="s" variant="secondary" onPress={() => d({ type: "follow", id: "ben" })} />} />

        <Text style={styles.label}>From BuzzVideo</Text>
        {NOTICES.map((n) => (
          <ActRow
            key={n.id}
            avatars={["/prototypes/buzzvideo-app/app-logo.svg"]}
            text={n.text}
            meta={n.ago}
            onPress={() => (n.id === "n1" ? d({ type: "push", route: { name: "challenge", id: "history" } }) : n.id === "n3" ? d({ type: "push", route: { name: "rewards" } }) : d({ type: "push", route: { name: "play" } }))}
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {CHALLENGES.map((x, i) => (
          <Pressable key={x.id} onPress={() => d({ type: "push", route: { name: "challenge", id: x.id } })} accessibilityLabel={x.title} style={({ pressed }) => [styles.chRow, pressed && { opacity: 0.8 }]}>
            <View style={styles.chCover}>
              <Image source={{ uri: poster(x.cover) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={{ position: "absolute", left: 6, top: 6 }}>
                <KTag label={x.live ? "Live" : "Ended"} tone={x.live ? "success" : "video"} />
              </View>
            </View>
            <View style={{ flex: 1, paddingVertical: 2, gap: 4 }}>
              <Text style={[t.headline, { color: c.text }]} numberOfLines={2}>
                {x.title}
              </Text>
              <Text style={[t.caption, { color: c.text2 }]} numberOfLines={2}>
                {x.reward}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {x.live && i < 2 ? <Stack uris={FRIENDS.slice(i, i + 2).map((f) => f.avatar)} size={16} ring={c.page} /> : null}
                <Text style={[t.caption, { color: c.text3 }]} numberOfLines={1}>
                  {fmt(x.entries)} entries · {x.dates}
                </Text>
              </View>
            </View>
          </Pressable>
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
        <View style={{ height: 300, backgroundColor: c.surface }}>
          <Image source={{ uri: poster(ch.cover) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Gradient colors={["rgba(18,18,18,0)", "rgba(18,18,18,0)", c.page]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: -56 }}>
          <Text style={[t.display, { color: c.white }]}>{ch.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <KTag label={ch.live ? "Live" : "Ended"} tone={ch.live ? "success" : "neutral"} />
            <Text style={[t.caption, { color: c.text3 }]}>
              {ch.dates} · {fmt(ch.entries)} entries
            </Text>
          </View>
          {friends.length ? (
            <View style={[styles.friendsBox, { marginTop: 14 }]}>
              <Stack uris={friends.map((f) => f.avatar)} size={26} ring={c.surface} />
              <Text style={[t.caption, { color: c.text2, flex: 1 }]}>
                <Text style={{ color: c.white, fontWeight: "600" }}>{friends.map((f) => f.name).join(", ")}</Text> are in. Lily is ranked #214.
              </Text>
            </View>
          ) : null}
          <View style={[styles.friendsBox, { marginTop: 8 }]}>
            <Icon name="trophy" size={20} color={c.primary} strokeWidth={2} />
            <Text style={[t.bodyStrong, { color: c.text, flex: 1 }]}>{ch.reward}</Text>
          </View>
          <Text style={[t.body, { color: c.text2, marginTop: 14 }]}>{ch.desc}</Text>
          <Text style={[t.headline, { color: c.text, marginTop: 24, marginBottom: 10 }]}>How it works</Text>
          {ch.rules.map((r, i) => (
            <View key={r} style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
              <View style={styles.ruleN}>
                <Text style={[t.captionStrong, { color: c.text }]}>{i + 1}</Text>
              </View>
              <Text style={[t.body, { color: c.text, flex: 1 }]}>{r}</Text>
            </View>
          ))}
          <Text style={[t.headline, { color: c.text, marginTop: 24, marginBottom: 10 }]}>Top entries</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {ch.examples.map((e, i) => (
            <Pressable key={e} onPress={() => d({ type: "push", route: { name: "post", postId: e, list: ch.examples } })} accessibilityLabel={post(e).caption} style={styles.example}>
              <Image source={{ uri: poster(e) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.rank}>
                <Text style={[t.captionStrong, { color: c.white }]}>#{i + 1}</Text>
              </View>
              <View style={styles.exampleFoot}>
                <Icon name="heart" size={12} color={c.white} fill={c.white} strokeWidth={1} />
                <Text style={[t.micro, { color: c.white }, tk.textShadow]}>{fmt(post(e).likes)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
      <Header tone="onImage" right={<KIconButton icon="share" onVideo onPress={() => d({ type: "toast", text: "Link copied" })} label="Share" />} />
      {ch.live ? (
        <View style={[styles.foot, { paddingBottom: insets.bottom + 12 }]}>
          <KButton
            label={joined ? "Make my entry" : "Join the challenge"}
            variant="cta"
            onPress={() => {
              if (!joined) d({ type: "join", id });
              d({ type: "push", route: { name: "template", postId: ch.examples[0] } });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  meTop: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 12, paddingRight: 4, height: undefined, minHeight: 44, backgroundColor: "rgba(18,18,18,0.94)" },
  levelChip: { marginTop: 8, height: 22, paddingHorizontal: 10, borderRadius: 11, overflow: "hidden", justifyContent: "center" },
  stats: { flexDirection: "row", marginTop: 18, paddingHorizontal: 24 },
  checkin: { marginHorizontal: 16, marginTop: 18, padding: 14, borderRadius: tk.radius.lg, backgroundColor: c.surface },
  remixTag: { position: "absolute", left: 4, bottom: 24, height: 18, paddingHorizontal: 6, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center" },
  viewerTop: { position: "absolute", left: 4, top: 0 },
  milestone: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 18, padding: 16, borderRadius: tk.radius.lg, overflow: "hidden" },
  actRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  actAv: { position: "absolute", width: 34, height: 34, borderRadius: 17, backgroundColor: c.raised },
  label: { ...t.captionStrong, color: c.text3, marginLeft: 16, marginTop: 18, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.like },
  chRow: { flexDirection: "row", gap: 12 },
  chCover: { width: 132, height: 100, borderRadius: tk.radius.md, overflow: "hidden", backgroundColor: c.surface },
  friendsBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: tk.radius.md, backgroundColor: c.surface },
  ruleN: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center" },
  example: { width: 120, height: 168, borderRadius: tk.radius.md, overflow: "hidden", backgroundColor: c.surface },
  rank: { position: "absolute", left: 6, top: 6, height: 22, paddingHorizontal: 7, borderRadius: 4, backgroundColor: c.primary, justifyContent: "center" },
  exampleFoot: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  foot: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: "rgba(18,18,18,0.96)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
});
