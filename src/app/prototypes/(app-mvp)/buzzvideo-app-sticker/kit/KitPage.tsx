"use client";

import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FRIENDS, poster } from "../../buzzvideo-app-v2/v2/data";
import { BrandIcon, Gradient, Icon, MediaVideo } from "../../buzzvideo-app-v2/v2/v1";
import {
  GZAvatar,
  GZBlock,
  GZButton,
  GZCaption,
  GZChip,
  GZCommentRow,
  GZCredits,
  GZFeedHeader,
  GZFlame,
  GZGridCell,
  GZIconButton,
  GZInput,
  GZListRow,
  GZPhoto,
  GZProgress,
  GZRailAction,
  GZRailAvatar,
  GZRemixSticker,
  GZSegmented,
  GZSheet,
  GZStack,
  GZStats,
  GZSticker,
  GZStreak,
  GZTabBar,
  GZToast,
  GZ_TAB_H,
  gz,
  type GZTab,
} from "./gz";

const c = gz.color;
const W = 390;
const ME = "/prototypes/buzzvideo-app/avatar.jpg";
const BAR = GZ_TAB_H + 30;
const video = (id: string) => `/prototypes/buzzvideo-app-v2/feed/${id}.mp4`;

/* ───────────── 组合屏 ───────────── */

function Screen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-medium text-stone-500">{label}</div>
      <div className="relative overflow-hidden bg-black" style={{ width: W, height: 844, borderRadius: 44, boxShadow: "0 0 0 8px #111, 0 24px 48px rgba(0,0,0,0.18)" }}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </div>
    </div>
  );
}

const Status = () => (
  <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 32, zIndex: 5 }} pointerEvents="none">
    <Text style={{ color: c.white, fontSize: 16, fontWeight: "600" }}>9:41</Text>
    <View style={{ width: 24, height: 11, borderRadius: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", padding: 1.5 }}>
      <View style={{ flex: 1, borderRadius: 1.5, backgroundColor: c.white }} />
    </View>
  </View>
);

/** 视频流：每条视频只放一个最强的信号贴纸(这里是「朋友做过」) */
function FeedScreen() {
  const [tab, setTab] = useState("For You");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [cur, setCur] = useState<GZTab>("home");
  return (
    <>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: BAR, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" }}>
        <MediaVideo uri={video("dreamcore")} poster={poster("dreamcore")} style={StyleSheet.absoluteFill} />
        <Gradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} pointerEvents="none" />
        <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300 }} pointerEvents="none" />
        <View style={{ position: "absolute", left: 14, right: 14, bottom: 6 }}>
          <GZProgress value={0.4} />
        </View>
      </View>
      <Status />
      <View style={{ position: "absolute", left: 0, right: 0, top: 46 }}>
        <GZFeedHeader tabs={["Following", "Inspiration", "For You"]} current={tab} onChange={setTab} unread={3} />
      </View>
      <View style={{ position: "absolute", right: 8, bottom: BAR + 12, alignItems: "center" }}>
        <GZRailAvatar uri={poster("dreamcore")} following={following} onFollow={() => setFollowing(true)} />
        <GZRailAction icon="heart" count="13.4K" active={liked} onPress={() => setLiked((v) => !v)} label="Like" />
        <GZRailAction icon="message-circle-more" count="760" label="Comments" />
        <GZRailAction icon="bookmark" count="2,417" active={saved} tint={c.butter} onPress={() => setSaved((v) => !v)} label="Save" />
        <GZRailAction icon="share" count="Share" label="Share" />
        <GZRemixSticker uri={poster("dreamcore")} />
      </View>
      <View style={{ position: "absolute", left: 14, right: 84, bottom: BAR + 18 }}>
        <GZCaption
          name="lunapark"
          caption="tell me this isn't the most comforting thing on your feed ☁️"
          signal={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <GZStack uris={[FRIENDS[0].avatar, FRIENDS[1].avatar]} size={22} />
              <GZSticker label="Lily & Max made this" color="lime" size="s" rotate={-2} />
            </View>
          }
        />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <GZTabBar current={cur} onChange={(t) => t !== "create" && setCur(t)} dot="me" insetBottom={30} />
      </View>
    </>
  );
}

/** 做同款：大圆就是快门;选中的人用青柠圈 */
function RemixScreen() {
  const [sel, setSel] = useState("me");
  const [style, setStyle] = useState("Original");
  const cast = [
    { id: "orig", label: "Original", uri: poster("poodle") },
    { id: "me", label: "Me", uri: ME },
    { id: "pet", label: "My pet", uri: poster("collie") },
    { id: "add", label: "Upload" },
  ];
  const current = cast.find((x) => x.id === sel)!;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.black }]}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 236, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" }}>
        <MediaVideo uri={video("poodle")} poster={poster("poodle")} style={StyleSheet.absoluteFill} />
        <Gradient colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} pointerEvents="none" />
        <View style={{ position: "absolute", top: 104, alignSelf: "center" }}>
          <GZSticker label={sel === "orig" ? "Original star" : `Starring ${current.label === "Me" ? "you" : current.label.toLowerCase()}`} color="white" rotate={-3} />
        </View>
      </View>
      <Status />
      <View style={{ position: "absolute", top: 50, left: 14, right: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <GZIconButton icon="x" onVideo label="Close" size={36} />
        <GZCredits n={545} onVideo />
      </View>
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 186, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.raised }}>
          <Icon name="pencil" size={16} color={c.white} strokeWidth={2.4} />
          <Text style={[gz.body.strong, { color: c.white, flex: 1 }]}>make it a 1920s party</Text>
          <Text style={[gz.display.label, { color: c.lime }]}>Shuffle</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {["Original", "Anime", "Claymation", "Y2K"].map((x) => (
            <GZChip key={x} label={x} on={style === x} color="white" onPress={() => setStyle(x)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {cast.map((x) => {
          const on = x.id === sel;
          return (
            <Pressable key={x.id} onPress={() => setSel(x.id)} style={{ alignItems: "center", gap: 6 }} accessibilityLabel={on ? "Generate" : x.label}>
              {on ? (
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.white, alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: c.ink, alignItems: "center", justifyContent: "center" }}>
                    <Image source={{ uri: x.uri }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                  </View>
                </View>
              ) : (
                <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: c.raised, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {x.uri ? <Image source={{ uri: x.uri }} style={{ width: 54, height: 54 }} /> : <Icon name="plus" size={22} color={c.white} strokeWidth={2.6} />}
                </View>
              )}
              <Text style={[gz.display.tiny, { color: on ? c.white : c.text3 }]}>{x.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[gz.body.caption, { position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", color: c.text3 }]}>Tap the big circle · 20 credits</Text>
    </View>
  );
}

/** 成品 + 发布：原版是一张白边照片贴纸，歪着贴在左上 */
function ResultScreen() {
  const [picked, setPicked] = useState<string[]>(["tiktok"]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const targets: { id: string; label: string; icon: ReactNode }[] = [
    { id: "tiktok", label: "TikTok", icon: <BrandIcon brand="tiktok" size={46} style={{ borderRadius: 23 }} /> },
    { id: "instagram", label: "Reels", icon: <BrandIcon brand="instagram" size={46} style={{ borderRadius: 23 }} /> },
    { id: "whatsapp", label: "WhatsApp", icon: <BrandIcon brand="whatsapp" size={46} style={{ borderRadius: 23 }} /> },
    { id: "save", label: "Save", icon: <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.raised, alignItems: "center", justifyContent: "center" }}><Icon name="download" size={20} color={c.white} strokeWidth={2.4} /></View> },
  ];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.black }]}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 300, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: "hidden" }}>
        <Image source={{ uri: poster("gatsby") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <Status />
      <View style={{ position: "absolute", top: 50, left: 14, right: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <GZIconButton icon="x" onVideo label="Close" size={36} />
        <GZButton label="Try another" variant="white" size="s" icon="rotate-ccw" />
      </View>
      <View style={{ position: "absolute", top: 104, left: 18 }}>
        <GZPhoto uri={poster("museum")} w={78} h={104} rotate={-7} radius={12}>
          <View style={{ position: "absolute", bottom: -10, left: 10 }}>
            <GZSticker label="OG" color="butter" size="s" rotate={5} />
          </View>
        </GZPhoto>
      </View>
      <View style={{ position: "absolute", top: 120, right: 18 }}>
        <GZSticker label="1920s edit" color="lime" rotate={4} slap />
      </View>
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 30 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 48, borderRadius: 14, backgroundColor: c.raised }}>
          <Text style={[gz.body.body, { color: c.white, flex: 1 }]} numberOfLines={1}>
            me at gatsby's party, no notes <Text style={{ color: c.sky }}>@lily</Text>
          </Text>
          <Icon name="at-sign" size={18} color={c.text2} strokeWidth={2.4} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
          {targets.map((x) => {
            const on = picked.includes(x.id);
            return (
              <Pressable key={x.id} onPress={() => toggle(x.id)} style={{ alignItems: "center", gap: 6, width: 74 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: on ? c.white : "transparent" }}>{x.icon}</View>
                <Text style={[gz.display.tiny, { color: on ? c.white : c.text3 }]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: 16 }}>
          <GZButton label="Post it" />
        </View>
      </View>
    </View>
  );
}

/** 我的：身份(大名字 + 火苗 + 等级贴纸)+ 作品;签到一行 */
function MeScreen() {
  const [seg, setSeg] = useState("Posts");
  const cw = (W - 32 - 6) / 3;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.page }]}>
      <ScrollView contentContainerStyle={{ paddingTop: 96, paddingBottom: BAR + 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
          <GZPhoto uri={ME} w={92} h={92} rotate={-4} radius={46} />
          <View style={{ flex: 1, gap: 6, paddingBottom: 4 }}>
            <Text style={[gz.display.hero, { color: c.white }]}>alex</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <GZFlame n={7} />
              <GZSticker label="Lv 2 · Rising" color="lilac" size="s" rotate={3} />
            </View>
          </View>
        </View>
        <View style={{ marginTop: 22 }}>
          <GZStats
            items={[
              { n: "12", label: "Following" },
              { n: "348", label: "Followers" },
              { n: "1.3K", label: "Remixed you", color: "lime" },
            ]}
          />
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <GZBlock color="butter" rotate={-1}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={[gz.display.head, { color: c.ink }]}>Day 6 of 7</Text>
                <Text style={[gz.body.caption, { color: "rgba(0,0,0,0.7)" }]}>Tomorrow: +50 credits</Text>
              </View>
              <Text style={[gz.display.title, { color: c.ink }]}>+20</Text>
            </View>
          </GZBlock>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <GZSegmented options={["Posts", "Saved", "Likes"]} value={seg} onChange={setSeg} />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, paddingHorizontal: 16, marginTop: 12 }}>
          {[
            { id: "gatsby", n: "1.2K", s: <GZSticker label="Pinned" color="white" size="s" rotate={-4} /> },
            { id: "dreamcore", n: "864" },
            { id: "outfit", n: "3.1K", s: <GZSticker label="23 remixes" color="lime" size="s" rotate={3} /> },
            { id: "fruit", n: "512" },
            { id: "museum", n: "2.4K" },
            { id: "hotel", n: "97" },
          ].map((g) => (
            <GZGridCell key={g.id} uri={poster(g.id)} width={cw} count={g.n} sticker={g.s} />
          ))}
        </View>
      </ScrollView>
      <Status />
      <View style={{ position: "absolute", top: 50, left: 14, right: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <GZCredits n={545} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <GZIconButton icon="bell" label="Activity" size={36} badge={3} />
          <GZIconButton icon="settings" label="Settings" size={36} />
        </View>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <GZTabBar current="me" insetBottom={30} />
      </View>
    </View>
  );
}

/* ───────────── 展示页 ───────────── */

function Block({ id, title, rule, children, pad = 16 }: { id?: string; title: string; rule: string[]; children: ReactNode; pad?: number }) {
  return (
    <section id={id} className="grid items-start gap-8 border-t border-stone-200 py-10" style={{ gridTemplateColumns: "minmax(0, 1fr) 390px" }}>
      <div>
        <h3 className="text-[17px] font-semibold text-stone-900">{title}</h3>
        <ul className="mt-3 space-y-1.5">
          {rule.map((r) => (
            <li key={r} className="flex gap-2 text-[14px] leading-6 text-stone-600">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-stone-400" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="overflow-hidden rounded-2xl" style={{ width: W, background: c.page }}>
        <View style={{ padding: pad }}>{children}</View>
      </div>
    </section>
  );
}

const SWATCHES: [string, string, string][] = [
  ["Orange", c.orange, "主操作 / 品牌(全 APP 唯一的主按钮色)"],
  ["Lime", c.lime, "朋友 / 新的 / 选中的人"],
  ["Butter", c.butter, "积分 / 奖励 / 今天"],
  ["Sky", c.sky, "@ 提到 / 分享 / 信息"],
  ["Lilac", c.lilac, "等级 / 身份"],
  ["Pink", c.pink, "点赞 / 喜欢"],
];

const DIFF = [
  ["品牌渐变", "10 多处(按钮、头像圈、等级、里程碑、大圆…)", "一处都不用。颜色来自贴纸色块"],
  ["标签", "同一个橙表示热门、朋友、置顶、奖励", "6 种贴纸色各管一件事;每条视频只放 1 颗"],
  ["按钮", "8pt 矩形、胶囊、圆形混用;橙底白字 3.1:1", "统一粗胶囊 + 圆形图标按钮;橙底白字(粗大字),青柠 / 白 / 奶油底黑字"],
  ["字体", "系统字 17 / 15 / 13,标题和数字没性格", "大标题、数字、贴纸用粗展示字 Bricolage Grotesque,正文系统字"],
  ["装饰", "橙色光晕、回弹动画、呼吸的大圆", "不用光晕;贴纸「啪」地贴上，减速不回弹;大圆静止"],
  ["卡片", "灰卡片一张叠一张", "列表 + 偶尔一块整色贴纸卡(签到、里程碑)"],
];

export default function KitPage() {
  const [tab, setTab] = useState("For You");
  const [chip, setChip] = useState("Trending");
  const [seg, setSeg] = useState("Top");
  const [cur, setCur] = useState<GZTab>("home");
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="mx-auto max-w-[1080px] px-8 py-12">
        <div className="text-[13px] font-medium text-stone-500">BuzzVideo APP · 新版设计</div>
        <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-stone-900">组件库 · 新版设计</h1>
        <p className="mt-3 max-w-[760px] text-[15px] leading-7 text-stone-600">
          第二版 UI 去 AI 味的新方向。底子仍是黑色视频 APP，个性来自「贴纸」:实色 + 白色模切边 + 微微歪斜，橙色贴纸白字，其他贴纸黑字;大标题和数字用粗展示字。不用渐变和光晕，每种贴纸色只表达一件事。这一页先定组件，你确认后再铺到新原型的所有屏幕;第二版原型不动。
        </p>

        <nav className="mt-6 flex flex-wrap gap-2 text-[13px]">
          {[
            ["#screens", "组合效果"],
            ["#diff", "和第二版比"],
            ["#color", "贴纸色"],
            ["#type", "字体"],
            ["#sticker", "贴纸"],
            ["#buttons", "按钮"],
            ["#input", "筛选和输入"],
            ["#feed", "视频流"],
            ["#tabbar", "底部栏"],
            ["#sheets", "面板和提示"],
            ["#content", "内容"],
            ["#rewards", "激励"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-md border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 hover:border-stone-400">
              {label}
            </a>
          ))}
        </nav>

        <h2 id="screens" className="mt-14 text-[22px] font-semibold text-stone-900">组合起来的样子</h2>
        <p className="mt-2 text-[14px] text-stone-600">用下面的组件拼的四屏，点赞、收藏、关注、频道、出镜的人、风格、分享平台、分段都可以点。</p>
        <div className="mt-6 grid gap-10" style={{ gridTemplateColumns: "repeat(auto-fit, 390px)" }}>
          <Screen label="视频流">
            <FeedScreen />
          </Screen>
          <Screen label="做同款">
            <RemixScreen />
          </Screen>
          <Screen label="成品 + 发布">
            <ResultScreen />
          </Screen>
          <Screen label="我的">
            <MeScreen />
          </Screen>
        </div>

        <h2 id="diff" className="mt-16 text-[22px] font-semibold text-stone-900">和第二版比，去掉了哪些 AI 味</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-stone-50 text-[13px] text-stone-500">
              <tr>
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-5 py-3 font-medium">第二版</th>
                <th className="px-5 py-3 font-medium">新版设计</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {DIFF.map(([a, b, d]) => (
                <tr key={a}>
                  <td className="px-5 py-3 font-medium text-stone-900">{a}</td>
                  <td className="px-5 py-3 text-stone-600">{b}</td>
                  <td className="px-5 py-3 text-stone-900">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-16 text-[22px] font-semibold text-stone-900">基础</h2>

        <section id="color" className="border-t border-stone-200 py-10">
          <h3 className="text-[17px] font-semibold text-stone-900">贴纸色</h3>
          <p className="mt-2 text-[14px] text-stone-600">黑底上 6 种贴纸色，每种只有一个意思;贴纸上的字一律黑色。中性色只有黑、#0E0E0E 页面底、#1A1A1A 面板、#262626 输入框和次要按钮。</p>
          <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {SWATCHES.map(([name, hex, note]) => (
              <div key={name} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <div className="flex h-20 items-end p-3" style={{ background: hex }}>
                  <span className="text-[15px] font-extrabold text-black" style={{ fontFamily: "var(--font-gz)" }}>
                    {name}
                  </span>
                </div>
                <div className="p-3 text-[12px] leading-5 text-stone-600">
                  <div className="font-mono text-stone-900">{hex}</div>
                  {note}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Block id="type" title="字体" rule={["大标题、大数字、贴纸字、按钮字：粗展示字 Bricolage Grotesque 800,字距收紧。", "正文、评论、说明：系统字 15 / 13 / 12。", "小写的用户名和文案(像真人随手打的)，不全部首字母大写。", "最小字号 12,不再有 10px。"]}>
          <Text style={[gz.display.hero, { color: c.white }]}>Create anything you've dreamed of</Text>
          <Text style={[gz.display.title, { color: c.white, marginTop: 12 }]}>You&apos;re posted</Text>
          <Text style={[gz.display.head, { color: c.white, marginTop: 10 }]}>Trending now</Text>
          <Text style={[gz.display.label, { color: c.white, marginTop: 10 }]}>Shuffle · Try another</Text>
          <Text style={[gz.body.body, { color: c.text, marginTop: 14 }]}>tell me this isn&apos;t the most comforting thing on your feed</Text>
          <Text style={[gz.body.caption, { color: c.text3, marginTop: 6 }]}>2h · 760 comments</Text>
          <View style={{ flexDirection: "row", gap: 18, marginTop: 16 }}>
            <Text style={[gz.display.hero, { color: c.lime }]}>1.3K</Text>
            <Text style={[gz.display.hero, { color: c.butter }]}>+20</Text>
            <Text style={[gz.display.hero, { color: c.pink }]}>214</Text>
          </View>
        </Block>

        <Block id="sticker" title="贴纸" rule={["文字贴纸：实色 + 2.5pt 白模切边 + 歪 −4°~+5°。用在趋势、朋友、新、置顶、奖励这类标签上。", "每条视频 / 每个格子最多 1 颗贴纸，只放最强的那个信号。", "图片贴纸：白边照片 + 歪斜 + 投影，像贴在屏幕上的拍立得(原版对照、Remix 入口、头像)。", "出现时「啪」地贴上：1.25 倍落到 1,260ms 减速曲线，不回弹;开了减少动态效果直接出现。"]}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <GZSticker label="#1 in Pets" color="orange" icon="flame" />
            <GZSticker label="Lily made this" color="lime" rotate={3} />
            <GZSticker label="+50 credits" color="butter" rotate={-5} />
            <GZSticker label="@lily" color="sky" rotate={2} />
            <GZSticker label="Lv 2 · Rising" color="lilac" rotate={-2} />
            <GZSticker label="New" color="white" size="s" rotate={4} />
            <GZSticker label="Pinned" color="white" size="s" rotate={-3} />
            <GZSticker label="You're posted" color="lime" size="l" rotate={-3} slap />
          </View>
          <View style={{ flexDirection: "row", gap: 22, marginTop: 24, alignItems: "flex-start" }}>
            <GZPhoto uri={poster("museum")} w={84} h={112} rotate={-6} />
            <GZPhoto uri={poster("gatsby")} w={84} h={112} rotate={5} />
            <GZRemixSticker uri={poster("poodle")} />
          </View>
        </Block>

        <Block id="buttons" title="按钮" rule={["只有两种形状：粗胶囊、圆形图标按钮。", "Primary 橙(全 APP 唯一的主操作色，一屏一个)· Lime 和朋友有关的(Follow back、Remix 朋友的)· White 压在视频上 · Dark 次要 · Outline 最轻。", "按钮字是粗展示字，橙底白字，青柠 / 白底黑字;按下缩到 0.96。", "三档高度:L 52(页底主操作)· M 40(行内)· S 30(列表里)。"]}>
          <View style={{ gap: 10 }}>
            <GZButton label="Post it" />
            <GZButton label="Remix this" variant="lime" icon="wand-sparkles" />
            <GZButton label="Keep scrolling" variant="dark" />
            <GZButton label="Not now" variant="outline" />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
            <GZButton label="Follow" size="m" />
            <GZButton label="Follow back" variant="lime" size="m" />
            <GZButton label="Try another" variant="white" size="m" icon="rotate-ccw" />
            <GZButton label="Remix" size="s" />
            <GZButton label="Friends" variant="dark" size="s" />
            <GZButton label="Disabled" size="s" disabled />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <GZIconButton icon="search" label="Search" />
            <GZIconButton icon="bell" label="Inbox" badge={3} />
            <GZIconButton icon="share" label="Share" />
            <GZIconButton icon="x" label="Close" size={36} />
          </View>
        </Block>

        <Block id="input" title="筛选和输入" rule={["筛选:描边胶囊，选中整块填白(或分类自己的贴纸色)。", "分段：深灰底，选中是一块白贴纸。", "输入框：深灰 16pt 圆角，聚焦时白边。"]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {["Trending", "Pets", "Dance", "Cinematic", "Funny"].map((x) => (
              <GZChip key={x} label={x} on={chip === x} onPress={() => setChip(x)} />
            ))}
          </ScrollView>
          <View style={{ marginTop: 14 }}>
            <GZSegmented options={["Top", "Friends", "New"]} value={seg} onChange={setSeg} />
          </View>
          <View style={{ marginTop: 14, gap: 10 }}>
            <GZInput placeholder="Search videos, people, effects" icon="search" />
            <GZInput value="make it a 1920s party" icon="pencil" focus />
          </View>
        </Block>

        <h2 className="mt-16 text-[22px] font-semibold text-stone-900">APP 专用</h2>

        <Block id="feed" title="视频流" pad={0} rule={["顶栏：频道用粗展示字，选中的那个是一块歪 −2° 的白贴纸;左消息、右搜索是半透明黑圆按钮。", "右侧：粗白实心图标 + 展示字体数字;点赞变粉、收藏变黄油。作者头像白边，关注是一颗青柠「+」。", "Remix 入口：这条视频的封面做成白边照片贴纸，压一颗橙色 REMIX 字贴纸。", "左下：只放 1 颗最强的信号贴纸(朋友做过 > 热门排名);作者名展示字体，文案保持真人随手打的样子。"]}>
          <View style={{ height: 420, backgroundColor: "#000" }}>
            <Image source={{ uri: poster("poodle") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 220 }} pointerEvents="none" />
            <View style={{ position: "absolute", left: 0, right: 0, top: 8 }}>
              <GZFeedHeader tabs={["Following", "Inspiration", "For You"]} current={tab} onChange={setTab} unread={3} />
            </View>
            <View style={{ position: "absolute", right: 8, bottom: 6, alignItems: "center" }}>
              <GZRailAvatar uri={poster("poodle")} />
              <GZRailAction icon="heart" count="18.4K" active label="Like" />
              <GZRailAction icon="bookmark" count="3,312" label="Save" />
              <GZRemixSticker uri={poster("poodle")} />
            </View>
            <View style={{ position: "absolute", left: 14, right: 84, bottom: 18 }}>
              <GZCaption name="mochi.pets" caption="she said she's not doing interviews today" signal={<GZSticker label="#1 in Pets" color="orange" icon="flame" size="s" />} />
            </View>
          </View>
        </Block>

        <Block id="tabbar" title="底部栏" pad={0} rule={["贴底黑条，内容区底部 20pt 圆角。", "Home / Me 用粗展示字，选中变白 + 下面一小条橙色;红点改成青柠点。", "Create 是一颗橙色大贴纸：白模切边、歪 −3°、白字带 +，全 APP 最显眼的入口。"]}>
          <View style={{ height: 120, justifyContent: "flex-end", backgroundColor: c.black }}>
            <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: GZ_TAB_H + 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: "hidden" }}>
              <Image source={{ uri: poster("dreamcore") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </View>
            <GZTabBar current={cur} onChange={(t) => t !== "create" && setCur(t)} dot="me" insetBottom={20} />
          </View>
        </Block>

        <Block id="sheets" title="面板和提示" pad={0} rule={["面板：贴底，上面 24pt 圆角，标题粗展示字。", "顶部提示：一颗青柠贴纸，啪地贴上，2 秒后消失;积分到账用黄油色;失败 / 出错(断网、登录失败、付款失败)用红色白字。", "评论：朋友的评论名字旁边一颗小青柠 FRIEND 贴纸。"]}>
          <View style={{ backgroundColor: "#333", paddingTop: 16, gap: 10 }}>
            <GZToast text="Saved to your faves" />
            <GZToast text="+20 credits · Day 6" color="butter" />
            <GZToast text="Couldn't sign in. Please try again." color="red" />
            <View style={{ height: 6 }} />
            <GZSheet title="760 comments">
              <View style={{ paddingHorizontal: 16 }}>
                <GZCommentRow avatar={FRIENDS[0].avatar} name="lily" tag={<GZSticker label="Friend" color="lime" size="s" rotate={-3} />} text="ok i'm doing this with my cat tonight" meta="12m" likes="8" />
                <GZCommentRow avatar={poster("alice")} name="lunapark" text="the toaster cloud omg" meta="2h" likes="214" liked />
              </View>
            </GZSheet>
          </View>
        </Block>

        <Block id="content" title="内容" rule={["数据：展示字体大数字;「Remixed you」用青柠。", "作品网格：3 列、3pt 缝、8pt 圆角;格子上最多一颗小贴纸。", "列表行：头像 + 文字 + 右侧按钮或缩略图，不包卡片。", "色块卡：一整块贴纸色 + 黑字，只给真正值得庆祝的东西(签到、里程碑)。"]}>
          <GZStats
            items={[
              { n: "348", label: "Followers" },
              { n: "2.9K", label: "Likes" },
              { n: "1.3K", label: "Remixed you", color: "lime" },
            ]}
          />
          <View style={{ flexDirection: "row", gap: 3, marginTop: 16 }}>
            <GZGridCell uri={poster("gatsby")} width={(358 - 6) / 3} count="1.2K" sticker={<GZSticker label="Pinned" color="white" size="s" rotate={-4} />} />
            <GZGridCell uri={poster("dreamcore")} width={(358 - 6) / 3} count="864" />
            <GZGridCell uri={poster("poodle")} width={(358 - 6) / 3} progress={0.62} />
          </View>
          <View style={{ marginHorizontal: -16, marginTop: 12 }}>
            <GZListRow leading={<GZAvatar uri={FRIENDS[1].avatar} size={44} ring />} title={<><Text style={{ fontWeight: "700" }}>max</Text> challenged you to remix this</>} sub="18m" right={<GZButton label="Remix" size="s" />} />
            <GZListRow leading={<GZAvatar uri={FRIENDS[3].avatar} size={44} />} title={<><Text style={{ fontWeight: "700" }}>ben</Text> started following you</>} sub="3h" right={<GZButton label="Follow back" variant="lime" size="s" />} />
          </View>
          <View style={{ marginTop: 12 }}>
            <GZBlock color="lime" rotate={-1.5}>
              <Text style={[gz.display.title, { color: c.ink }]}>1,024 views</Text>
              <Text style={[gz.body.caption, { color: "rgba(0,0,0,0.7)", marginTop: 2 }]}>your gatsby remix · 38 came from lily&apos;s share</Text>
            </GZBlock>
          </View>
        </Block>

        <Block id="rewards" title="激励" rule={["积分：黄油色硬币贴纸，在「我的」和做同款页右上。", "签到 7 天：已领 = 青柠圆章打勾;今天 = 黄油贴纸、歪一点;第 7 天礼物。", "火苗(连续发作品天数):一颗橙色小贴纸，放名字旁边。"]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <GZCredits n={545} />
            <GZFlame n={7} />
            <GZSticker label="Lv 2 · Rising" color="lilac" size="s" rotate={3} />
          </View>
          <View style={{ marginTop: 18 }}>
            <GZStreak rewards={[10, 10, 15, 15, 20, 20, 50]} done={5} today={5} />
          </View>
          <View style={{ marginTop: 18 }}>
            <GZButton label="Claim 20 credits" />
          </View>
        </Block>
      </div>
    </div>
  );
}

