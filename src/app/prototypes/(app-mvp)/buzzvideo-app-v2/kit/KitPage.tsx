"use client";

import { useState, type ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { STREAK, poster } from "../v2/data";
import { KAvatar, KButton, KCheck, KChip, KCircleButton, KInput, KSearch, KSegmented, KSwitch, KTextArea, KTooltip, KCommentInput, KCommentRow, KCredits, KDialog, KDiscoverCard, KFeedCaption, KFeedHeader, KGridCell, KIconButton, KIconTabs, KLevel, KListRow, KMissionRow, KNavBar, KNudge, KProgress, KRailAction, KRailAvatar, KRemixDisc, KRowIcon, KShareCircle, KShareItem, KSheet, KSlot, KStats, KStreak, KTabBar, KTag, KToast, TAB_BAR_H, type KTabBarVariant, type KTabId } from "../v2/kit/components";
import { tk } from "../v2/kit/tokens";
import { BrandIcon, Gradient, Icon } from "../v2/v1";

const ME = "/prototypes/buzzvideo-app/avatar.jpg";
/** 底部栏 + Home 横条安全区 */
const BAR = TAB_BAR_H + 34;
const W = 390;

/** 一块组件展示:左边说明，右边 390 宽的深色画板 */
function Block({ title, rule, children, bg = tk.color.page, pad = 16 }: { title: string; rule: string[]; children: ReactNode; bg?: string; pad?: number }) {
  return (
    <section className="grid items-start gap-8 border-t border-stone-200 py-10" style={{ gridTemplateColumns: "minmax(0, 1fr) 390px" }}>
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
      <div className="overflow-hidden rounded-2xl" style={{ width: W, background: bg }}>
        <View style={{ padding: pad }}>{children}</View>
      </div>
    </section>
  );
}

/** 一整屏的手机画板(390 × 844) */
function Screen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-medium text-stone-500">{label}</div>
      <div className="relative overflow-hidden rounded-[36px] bg-black" style={{ width: W, height: 844, boxShadow: "0 0 0 8px #111, 0 24px 48px rgba(0,0,0,0.18)" }}>
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </div>
    </div>
  );
}

const Swatch = ({ name, value, note }: { name: string; value: string; note: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 shrink-0 rounded-lg border border-stone-300" style={{ background: value.startsWith("rgba") ? `linear-gradient(${value}, ${value}), linear-gradient(#121212, #121212)` : value }} />
    <div className="min-w-0">
      <div className="text-[13px] font-semibold text-stone-900">{name}</div>
      <div className="truncate text-[12px] text-stone-500">
        {value} · {note}
      </div>
    </div>
  </div>
);

/** 底部栏方案展示:上面一截视频画面(底部圆角)，下面是底部栏，可点 */
function TabBarDemo({ variant }: { variant: KTabBarVariant }) {
  const [cur, setCur] = useState<KTabId>("home");
  return (
    <View style={{ height: 150, justifyContent: "flex-end" }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: TAB_BAR_H + 34, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" }}>
        <Image source={{ uri: poster("dreamcore") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <KTabBar current={cur} onChange={setCur} dot="me" insetBottom={34} variant={variant} />
    </View>
  );
}

/** 组合示例 1:视频流一屏 */
function FeedScreen() {
  const [feedTab, setFeedTab] = useState("For You");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  return (
    <>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: BAR, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" }}>
        <Image source={{ uri: poster("poodle") }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <Gradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140 }} pointerEvents="none" />
        <Gradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300 }} pointerEvents="none" />
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 0 }}>
          <KProgress value={0.36} />
        </View>
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, top: 54 }}>
        <KFeedHeader tabs={["Following", "Inspiration", "For You"]} current={feedTab} onChange={setFeedTab} unread={7} />
      </View>
      <View style={{ position: "absolute", right: 8, bottom: BAR + 14, alignItems: "center" }}>
        <KRailAvatar uri={poster("poodle")} following={following} onFollow={() => setFollowing(true)} />
        <KRailAction icon="heart" count={liked ? "18.4K" : "18.4K"} active={liked} onPress={() => setLiked((v) => !v)} label="Like" />
        <KRailAction icon="message-circle-more" count="532" label="Comments" />
        <KRailAction icon="bookmark" count="3,312" active={saved} tint={tk.color.save} onPress={() => setSaved((v) => !v)} label="Save" />
        <KRailAction icon="share" count="Share" label="Share" />
        <KRemixDisc uri={poster("poodle")} />
      </View>
      <View style={{ position: "absolute", left: 12, right: 76, bottom: BAR + 16 }}>
        <KFeedCaption name="Mochi & Friends" caption="She said she's not doing interviews today" tags={["pets", "fashion"]} remixes="4,310" />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <KTabBar current="home" dot="me" insetBottom={34} />
      </View>
    </>
  );
}

/** 组合示例 2:评论面板 */
function CommentsScreen() {
  const [v, setV] = useState("");
  return (
    <>
      <Image source={{ uri: poster("kings") }} style={{ position: "absolute", left: 0, right: 0, top: 130, height: 220 }} resizeMode="cover" />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <KSheet title="1,264 comments" insetBottom={34}>
          <KCommentRow avatar={poster("alice")} name="Luna Park" text="I have watched this eleven times and I'm not done" meta="2h" likes="214" />
          <KCommentRow reply creator avatar={poster("napoleon")} name="Odd History" text="eleven is a good start" meta="1h" likes="32" />
          <KCommentRow avatar={poster("scooter")} name="Kai Rivers" text="ok how is the lighting this good" meta="5h" likes="96" liked />
          <KCommentRow avatar={poster("poodle")} name="Mochi & Friends" text="Remixed it with my dog. No regrets." meta="1d" likes="480" />
          <KCommentRow avatar={poster("kpop")} name="NEON Crew" text="the timing on the beat" meta="1d" likes="73" />
          <KCommentInput avatar={ME} value={v} onChangeText={setV} onSend={() => setV("")} />
        </KSheet>
      </View>
    </>
  );
}

/** 组合示例 3:我的 */
function ProfileScreen() {
  const cell = (W - 2) / 3;
  return (
    <View style={{ flex: 1, backgroundColor: tk.color.page, paddingTop: 54 }}>
      <View style={{ flexDirection: "row", alignItems: "center", height: 44, paddingLeft: 16, paddingRight: 4 }}>
        <View style={{ height: 28, paddingHorizontal: 10, borderRadius: tk.radius.md, backgroundColor: tk.color.fill, justifyContent: "center" }}>
          <KCredits n={545} />
        </View>
        <View style={{ flex: 1 }} />
        <KIconButton icon="gift" badge={2} label="Rewards" />
        <KIconButton icon="settings" label="Settings" />
      </View>
      <View style={{ alignItems: "center", paddingTop: 4 }}>
        <KAvatar uri={ME} size={96} />
        <Text style={[tk.type.headline, { color: tk.color.text, marginTop: 12 }]}>@alexchen</Text>
        <View style={{ marginTop: 8 }}>
          <KLevel lv={2} title="Rising Creator" pct={0.4} xp="40/100 XP" />
        </View>
        <View style={{ marginTop: 16 }}>
          <KStats
            items={[
              { n: "12", label: "Following" },
              { n: "348", label: "Followers" },
              { n: "2,914", label: "Likes" },
            ]}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <KButton label="My Twin" variant="secondary" size="m" style={{ width: 132 }} />
          <KButton label="Invite friends" variant="secondary" size="m" style={{ width: 132 }} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 12 }}>
        <KNudge thumb={poster("kings")} title="1 draft ready to post" sub="Post it now and earn up to 80 credits" cta="Post" />
      </View>
      <KIconTabs
        current="posts"
        tabs={[
          { id: "posts", icon: "layout-grid", label: "Posts" },
          { id: "twin", icon: "scan-face", label: "Starring me" },
          { id: "saved", icon: "bookmark", label: "Saved" },
          { id: "likes", icon: "heart", label: "Likes" },
        ]}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        <KGridCell uri={poster("kings")} width={cell} tag="Draft" />
        <KGridCell uri={poster("fruit")} width={cell} progress={0.42} />
        <KGridCell uri={poster("poodle")} width={cell} count="1,280" />
        <KGridCell uri={poster("dreamcore")} width={cell} count="612" />
        <KGridCell uri={poster("collie")} width={cell} count="94" />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <KTabBar current="me" insetBottom={34} />
      </View>
    </View>
  );
}

/** 组合示例 4:任务中心 */
function RewardsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: tk.color.page, paddingTop: 54 }}>
      <KNavBar title="Rewards" />
      <View style={{ padding: 16 }}>
        <Text style={[tk.type.title, { color: tk.color.text }]}>2-day streak</Text>
        <Text style={[tk.type.caption, { color: tk.color.text3, marginTop: 2, marginBottom: 12 }]}>Miss a day and it starts over</Text>
        <KStreak rewards={STREAK} done={2} today={2} />
        <KButton label="Claim 15 credits" variant="cta" style={{ marginTop: 12 }} />
        <Text style={[tk.type.captionStrong, { color: tk.color.text3, marginTop: 24 }]}>Daily missions</Text>
        <KMissionRow title="Post a video" reward={20} state="claim" />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.color.line }} />
        <KMissionRow title="Share to TikTok" reward={30} state="go" />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.color.line }} />
        <KMissionRow title="Like 5 videos" reward={5} progress="3/5" state="go" />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.color.line }} />
        <KMissionRow title="Remix 3 videos" reward={15} state="done" />
      </View>
    </View>
  );
}

export default function KitPage() {
  const [chip, setChip] = useState("Trending");
  const [tab, setTab] = useState("For You");
  const [itab, setItab] = useState("posts");
  const [q, setQ] = useState("dance");
  const [area, setArea] = useState("");
  const [sw, setSw] = useState(true);
  const [ck, setCk] = useState(true);
  const [seg, setSeg] = useState("All");
  const c = tk.color;
  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="mx-auto max-w-[1080px] px-8 py-12">
        <div className="text-[13px] font-medium text-stone-500">BuzzVideo APP · 第二版</div>
        <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-stone-900">组件库</h1>
        <p className="mt-3 max-w-[720px] text-[15px] leading-7 text-stone-600">
          结构按网页版 Figma 设计规范的分法(Logo / Typography / Color / Buttons / Icons / Tooltip / Tag / Input)，组件形态参照 TikTok APP 深色模式，品牌色、品牌渐变和图标沿用网页版。这一页只展示组件本身，现有原型页面还没有换用;确认后再逐页替换。
        </p>

        <nav className="mt-6 flex flex-wrap gap-2 text-[13px]">
          {[
            ["#screens", "组合效果"],
            ["#logo", "Logo"],
            ["#type", "Typography"],
            ["#color", "Color"],
            ["#buttons", "Buttons"],
            ["#icons", "Icons"],
            ["#tooltip", "Tooltip"],
            ["#tag", "Tag"],
            ["#input", "Input"],
            ["#feed", "视频流"],
            ["#tabbar", "底部栏方案"],
            ["#sheets", "面板和提示"],
            ["#content", "内容"],
            ["#rewards", "激励和创作"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-md border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 hover:border-stone-400">
              {label}
            </a>
          ))}
        </nav>

        <h2 id="screens" className="mt-14 text-[22px] font-semibold text-stone-900">组合起来的样子</h2>
        <p className="mt-2 text-[14px] text-stone-600">用下面的组件拼出的四屏，点赞、收藏、关注可以点。</p>
        <div className="mt-6 grid gap-10" style={{ gridTemplateColumns: "repeat(auto-fit, 390px)" }}>
          <Screen label="视频流">
            <FeedScreen />
          </Screen>
          <Screen label="评论面板">
            <CommentsScreen />
          </Screen>
          <Screen label="我的">
            <ProfileScreen />
          </Screen>
          <Screen label="任务中心">
            <RewardsScreen />
          </Screen>
        </div>

        <h2 id="base" className="mt-16 text-[22px] font-semibold text-stone-900">基础</h2>

        <section id="logo" className="border-t border-stone-200 py-10">
          <h3 className="text-[17px] font-semibold text-stone-900">Logo</h3>
          <p className="mt-2 text-[14px] text-stone-600">原样引用品牌 SVG，形状和渐变不改，只换底色。APP 里用在启动页、登录页、官方账号头像、水印。</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {[
              ["#000000", "/prototypes/buzzvideo-app/app-logo.svg", 56],
              ["#121212", "/prototypes/buzzvideo-app/app-logo.svg", 56],
              ["#ffffff", "/prototypes/buzzvideo-app/app-logo.svg", 56],
            ].map(([bg, src, h], i) => (
              <div key={i} className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl border border-stone-200" style={{ background: bg as string }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src as string} alt="BuzzVideo logo" style={{ height: h as number }} />
              </div>
            ))}
            <div className="flex h-[120px] items-center justify-center rounded-2xl border border-stone-200 bg-white px-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prototypes/ai-tools/logo-wordmark.svg" alt="BuzzVideo AI wordmark" style={{ height: 32 }} />
            </div>
            <div className="flex h-[120px] items-center justify-center rounded-2xl border border-stone-200 px-8" style={{ background: "#121212" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prototypes/marketing-agent/brand-logo-white.svg" alt="BuzzVideo logo, white" style={{ height: 32 }} />
            </div>
          </div>
        </section>

        <div id="type">
          <Block title="Typography 字号" rule={["只用 8 档，不再写别的数字。", "标题靠字重区分，不靠放大;正文统一 15pt。", "字体沿用系统字体(iOS 是 SF Pro)，和第一版一致。"]}>
            {(
              [
                ["display", "28 / 700", "+15 credits"],
                ["title", "20 / 700", "Rewards"],
                ["headline", "17 / 600", "Mochi & Friends"],
                ["body", "15 / 400", "She said she's not doing interviews today"],
                ["bodyStrong", "15 / 600", "Post a video"],
                ["caption", "13 / 400", "2h · Reply"],
                ["micro", "12 / 600", "18.4K"],
                ["tab", "10 / 500", "Home"],
              ] as const
            ).map(([k, spec, sample]) => (
              <View key={k} style={{ flexDirection: "row", alignItems: "baseline", gap: 12, paddingVertical: 6 }}>
                <Text style={[tk.type.caption, { color: c.text3, width: 92 }]}>
                  {k} {spec}
                </Text>
                <Text style={[tk.type[k], { color: c.text, flex: 1 }]} numberOfLines={1}>
                  {sample}
                </Text>
              </View>
            ))}
          </Block>
        </div>

        <section id="color" className="border-t border-stone-200 py-10">
          <h3 className="text-[17px] font-semibold text-stone-900">Color 颜色</h3>
          <p className="mt-2 text-[14px] text-stone-600">品牌色和网页版同一套;中性色换成不带色偏的黑和灰(第一版的底色偏紫)。强调色只有一个主色，点赞红和收藏黄只用在这两个图标上。</p>
          {(
            [
              [
                "Brand 品牌",
                [
                  ["primary", c.primary, "主色:按钮、关注加号、选中、进度"],
                  ["primaryPressed", c.primaryPressed, "主色按下"],
                  ["primarySoft", c.primarySoft, "主色浅底:提醒条、选中格"],
                  ["cta gradient", "linear-gradient(90deg,#FFA73C,#FF5255)", "品牌渐变:只给 CTA 按钮和创作「+」"],
                ],
              ],
              [
                "Semantic 语义",
                [
                  ["like", c.like, "点赞、未读角标、出错"],
                  ["save", c.save, "收藏"],
                  ["success", c.success, "完成、Live"],
                ],
              ],
              [
                "Neutral 中性",
                [
                  ["black", c.black, "视频流底"],
                  ["page", c.page, "其他页面底"],
                  ["surface", c.surface, "面板、弹窗"],
                  ["raised", c.raised, "再上一层"],
                  ["fill", c.fill, "输入框底"],
                  ["fill2", c.fill2, "次级按钮底"],
                  ["line", c.line, "分隔线"],
                ],
              ],
              [
                "Text 文字",
                [
                  ["text", c.text, "主文字"],
                  ["text2", c.text2, "次要文字"],
                  ["text3", c.text3, "三级:时间、标签"],
                  ["text4", c.text4, "占位、不可用"],
                ],
              ],
            ] as [string, [string, string, string][]][]
          ).map(([group, list]) => (
            <div key={group} className="mt-6">
              <div className="text-[13px] font-semibold text-stone-500">{group}</div>
              <div className="mt-3 grid gap-x-8 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {list.map(([n, v, note]) => (
                  <Swatch key={n} name={n} value={v} note={note} />
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="buttons" className="border-t border-stone-200 py-10">
          <h3 className="text-[17px] font-semibold text-stone-900">Buttons 按钮</h3>
          <ul className="mt-3 space-y-1.5 text-[14px] leading-6 text-stone-600">
            <li>形状统一:8pt 圆角的矩形，不用胶囊。</li>
            <li>CTA 用品牌渐变(和网页版同一条)，只给整条流程里最关键的那一下:Generate、Post、每日 Claim。其他主要操作用主色实底。</li>
            <li>三档高度:Large 48(页面底部，撑满) · Medium 36(行内) · Small 28(列表里)。</li>
            <li>每种样式四个状态:默认 / 按下 / 提交中 / 禁用。</li>
          </ul>
          <div className="mt-6 overflow-hidden rounded-2xl" style={{ background: tk.color.page }}>
            <View style={{ padding: 20, gap: 14 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text style={[tk.type.caption, { color: c.text3, width: 84 }]} />
                {["Default", "Pressed", "Loading", "Disabled"].map((h) => (
                  <Text key={h} style={[tk.type.captionStrong, { color: c.text3, width: 168 }]}>
                    {h}
                  </Text>
                ))}
              </View>
              {(["cta", "primary", "secondary", "outline", "white", "danger", "text"] as const).map((v) => (
                <View key={v} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <Text style={[tk.type.caption, { color: c.text3, width: 84 }]}>{v}</Text>
                  <KButton label="Button" variant={v} block style={{ width: 168, alignSelf: "auto" }} />
                  <KButton label="Button" variant={v} demoPressed style={{ width: 168, alignSelf: "auto" }} />
                  <KButton label="Button" variant={v} loading style={{ width: 168, alignSelf: "auto" }} />
                  <KButton label="Button" variant={v} disabled style={{ width: 168, alignSelf: "auto" }} />
                </View>
              ))}
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginVertical: 6 }} />
              {(
                [
                  ["Large 48", "l"],
                  ["Medium 36", "m"],
                  ["Small 28", "s"],
                ] as const
              ).map(([name, size]) => (
                <View key={size} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <Text style={[tk.type.caption, { color: c.text3, width: 84 }]}>{name}</Text>
                  <KButton label="Generate" variant="cta" size={size} style={{ alignSelf: "auto" }} />
                  <KButton label="Follow" size={size} style={{ alignSelf: "auto" }} />
                  <KButton label="Following" variant="secondary" size={size} style={{ alignSelf: "auto" }} />
                  <KButton label="Edit" variant="outline" size={size} style={{ alignSelf: "auto" }} />
                  <KButton label="Remix" size={size} icon="wand-sparkles" style={{ alignSelf: "auto" }} />
                  <KButton label="Not now" variant="text" size={size} style={{ alignSelf: "auto" }} />
                </View>
              ))}
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginVertical: 6 }} />
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Text style={[tk.type.caption, { color: c.text3, width: 84 }]}>Icon</Text>
                <KCircleButton icon="arrow-up" tone="primary" size={32} label="Send" />
                <KCircleButton icon="images" label="Add photo" />
                <KCircleButton icon="scan-face" label="Star in it" />
                <KCircleButton icon="x" tone="video" label="Close" />
                <KCircleButton icon="images" label="Disabled" disabled />
                <KIconButton icon="chevron-left" label="Back" />
                <KIconButton icon="search" label="Search" />
                <KIconButton icon="gift" badge={2} label="Rewards" />
                <KIconButton icon="ellipsis" label="More" />
              </View>
            </View>
          </div>
        </section>

        <section id="icons" className="border-t border-stone-200 py-10">
          <h3 className="text-[17px] font-semibold text-stone-900">Icons 图标</h3>
          <p className="mt-2 text-[14px] text-stone-600">沿用网页版的 Lucide 图标。页面里用线条(2pt 线宽);压在视频上的操作列用实心。三个尺寸:34 操作列 · 24 导航栏 · 18 行内。底部栏不用图标。</p>
          <div className="mt-5 overflow-hidden rounded-2xl" style={{ background: tk.color.page }}>
            <View style={{ padding: 20, gap: 16 }}>
              <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
                <Text style={[tk.type.caption, { color: c.text3, width: 84 }]}>34 实心</Text>
                {(["heart", "message-circle-more", "bookmark", "share"] as const).map((n) => (
                  <Icon key={n} name={n} size={34} color={c.white} fill={c.white} strokeWidth={0.5} />
                ))}
                <Icon name="heart" size={34} color={c.like} fill={c.like} strokeWidth={0.5} />
                <Icon name="bookmark" size={34} color={c.save} fill={c.save} strokeWidth={0.5} />
              </View>
              <View style={{ flexDirection: "row", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                <Text style={[tk.type.caption, { color: c.text3, width: 84 }]}>24 线条</Text>
                {(["house", "compass", "plus", "message-square-text", "user-round", "search", "bell", "gift", "settings", "chevron-left", "x", "ellipsis", "trophy", "flame", "wand-sparkles", "scan-face"] as const).map((n) => (
                  <Icon key={n} name={n} size={24} color={c.text} strokeWidth={2} />
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                <Text style={[tk.type.caption, { color: c.text3, width: 84 }]}>18 行内</Text>
                {(["check", "chevron-right", "link", "download", "flag", "images", "camera", "lock", "play", "pause", "rotate-ccw", "sliders-horizontal", "user-plus", "layout-grid", "copy", "trash", "info", "circle-alert"] as const).map((n) => (
                  <Icon key={n} name={n} size={18} color={c.text2} strokeWidth={2} />
                ))}
              </View>
            </View>
          </div>
        </section>

        <div id="tooltip">
          <Block bg="#3a3a3a" title="Tooltip 提示气泡" rule={["8pt 圆角 + 小三角，一句话，最多两行。", "白底黑字:压在视频上的新手引导(指向 Remix、指向创作「+」)。", "深灰底白字:页面里的说明(积分规则、任务说明)。", "同一时间只出现一个;点任意处消失，不再出现第二次。"]}>
            <View style={{ gap: 22 }}>
              <KTooltip text="Tap Remix to make your own version" arrow="right" />
              <KTooltip text="Make videos and images here" arrow="bottom" />
              <KTooltip text="Your drafts and posts live here" arrow="top" align="start" />
              <KTooltip text="Credits from rewards never expire" tone="dark" arrow="bottom" align="start" />
            </View>
          </Block>
        </div>

        <div id="tag">
          <Block title="Tag 标签和分类" rule={["小标签 4pt 圆角、18 高:Hot / New 主色实底，Live 绿，压在画面上的用半透明黑底，中性灰用于 Ended。", "分类筛选是 4pt 圆角的小方块，选中白底黑字。", "积分数:品牌积分图标 + 数字，行内用。"]}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <KTag label="Hot" />
              <KTag label="New" />
              <KTag label="Live" tone="success" />
              <KTag label="Draft" tone="video" />
              <KTag label="Ended" tone="neutral" />
              <KCredits n={30} plus />
              <KCredits n={1545} />
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {["Trending", "Pets", "Dance", "Cinematic", "Funny"].map((x) => (
                <KChip key={x} label={x} on={x === chip} onPress={() => setChip(x)} />
              ))}
            </View>
          </Block>
        </div>

        <div id="input">
          <Block title="Input 输入" rule={["输入框:8pt 圆角灰底，44 高;标题在框上面，说明或报错在框下面。", "四个状态:默认 / 聚焦(主色描边) / 出错(红色描边 + 红字) / 禁用。", "搜索框是胶囊形;多行输入右下角显示字数。", "开关用 iOS 尺寸，开 = 主色;勾选是圆形;分段控件用于两三个并列选项。"]}>
            <View style={{ gap: 14 }}>
              <KInput label="Username" placeholder="Pick a name" helper="Letters, numbers and underscores" />
              <KInput label="Username" value="alexchen" state="focus" />
              <KInput label="Email" value="alex@example" error="Enter a valid email address" icon="mail" />
              <KInput label="Invite code" value="BUZZ-2026" state="disabled" />
              <KSearch value={q} onChangeText={setQ} placeholder="Search videos, effects, creators" />
              <KTextArea value={area} onChangeText={setArea} placeholder="Swap the character or change the story" max={200} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <KSwitch on={sw} onChange={setSw} label="Allow remixes" />
                <KSwitch on={false} disabled label="Disabled" />
                <KCheck on={ck} onChange={setCk} label="Share to TikTok" />
                <KCheck on={!ck} onChange={(v) => setCk(!v)} label="Share to Instagram" />
              </View>
              <KSegmented options={["All", "Earned", "Spent"]} value={seg} onChange={setSeg} />
            </View>
          </Block>
        </div>

        <h2 id="feed" className="mt-10 text-[22px] font-semibold text-stone-900">视频流</h2>

        <Block pad={0} bg="#3a3a3a" title="首页顶栏" rule={["三个频道:Following / Inspiration / For You，默认停在 For You。Inspiration 是双列瀑布流。", "文字 Tab:选中加粗变白，下面一条 24pt 的短白线;未选中 60% 白。压在视频上，文字带一层很轻的阴影。", "右边:消息(铃铛 + 红色未读数)和搜索。消息不进底部栏。", "参照即梦首页顶栏(频道 + 消息 + 搜索)。"]}>
          <View style={{ paddingVertical: 12 }}>
            <KFeedHeader tabs={["Following", "Inspiration", "For You"]} current={tab} onChange={setTab} unread={7} />
          </View>
        </Block>

        <Block bg="#3a3a3a" title="右侧操作列" rule={["从上到下:作者头像 + 关注加号 → 点赞 → 评论 → 收藏 → 分享 → Remix。", "图标是实心白色、34pt，数字 12pt 半粗，都带轻阴影。", "点赞后变红，收藏后变黄;关注后加号消失。", "Remix 照即梦「拍同款」:这条视频的封面做成白边圆角小卡、微微歪一点，右下角压一支品牌渐变的笔，下面写 Remix。"]}>
          <View style={{ flexDirection: "row", gap: 28, alignItems: "flex-end" }}>
            <View style={{ alignItems: "center" }}>
              <KRailAvatar uri={poster("poodle")} />
              <KRailAction icon="heart" count="18.4K" label="Like" />
              <KRailAction icon="message-circle-more" count="532" label="Comments" />
              <KRailAction icon="bookmark" count="3,312" label="Save" />
              <KRailAction icon="share" count="Share" label="Share" />
              <KRemixDisc uri={poster("poodle")} />
            </View>
            <View style={{ alignItems: "center" }}>
              <KRailAvatar uri={poster("poodle")} following />
              <KRailAction icon="heart" count="18.4K" active label="Like" />
              <KRailAction icon="message-circle-more" count="532" label="Comments" />
              <KRailAction icon="bookmark" count="3,313" active tint={c.save} label="Save" />
              <KRailAction icon="share" count="Share" label="Share" />
              <KRemixDisc uri={poster("poodle")} />
            </View>
          </View>
        </Block>

        <Block bg="#3a3a3a" title="作品信息" rule={["作者名 17pt 半粗 → 文案 15pt 最多两行 → 一条半透明的做同款胶囊。", "左下不再放头像和 Follow 按钮(挪到操作列顶部)。", "做同款胶囊是第二个 Remix 入口，写明有多少人做过。"]}>
          <KFeedCaption name="Mochi & Friends" caption="She said she's not doing interviews today" tags={["pets", "fashion"]} remixes="4,310" />
          <View style={{ height: 16 }} />
          <KProgress value={0.36} />
        </Block>

        <section id="tabbar" className="border-t border-stone-200 py-10">
          <h3 className="text-[17px] font-semibold text-stone-900">底部栏 · 5 个方案(待选)</h3>
          <ul className="mt-3 space-y-1.5 text-[14px] leading-6 text-stone-600">
            <li>都是 3 格 Home / Create / Me，贴底黑条，上面的内容区底部两个角做 16pt 圆角。Inspiration 留在首页顶部。</li>
            <li>区别只在两处:Home / Me 要不要图标，以及 Create 长什么样。点每个方案里的格子可以切换选中。</li>
            <li>选定后其余方案删掉，组合示例里的四屏换成选中的那个(现在用的是 A)。</li>
          </ul>
          <div className="mt-6 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, 390px)" }}>
            {(
              [
                ["outline", "A · 纯文字 + 渐变描边胶囊", "照即梦。最安静，Create 靠描边突出。"],
                ["filled", "B · 纯文字 + 渐变实心胶囊", "Create 最醒目，像一个主按钮;带「+」一眼看出是新建。"],
                ["icon", "C · 图标 + 小字 + 渐变方块", "TikTok 的结构。图标好认，Create 是一个「+」不带字。"],
                ["white", "D · 纯文字 + 白色胶囊", "选中用下面的小圆点;Create 白底黑字带星星，不用品牌色。"],
                ["raised", "E · 图标 + 小字 + 凸起圆按钮", "Create 凸出黑条，最像「主入口」;但会压到内容区底部。"],
              ] as [KTabBarVariant, string, string][]
            ).map(([v, name, note]) => (
              <div key={v}>
                <div className="text-[14px] font-semibold text-stone-900">{name}</div>
                <div className="mt-1 text-[13px] text-stone-500">{note}</div>
                <div className="mt-3 overflow-hidden rounded-2xl" style={{ width: W, background: "#000" }}>
                  <TabBarDemo variant={v} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <h2 id="sheets" className="mt-10 text-[22px] font-semibold text-stone-900">面板和提示</h2>

        <Block pad={0} bg="#000" title="底部面板" rule={["贴着屏幕底边通栏，只有上面两个角是 12pt 圆角(现在是四周留边的悬浮大圆角面板)。", "标题 13pt 居中，右上角 ×;点遮罩也能关。", "评论、分享、发布、选项都用这一个壳。"]}>
          <View style={{ paddingTop: 24 }}>
            <KSheet title="Share to">
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 14 }}>
                <KShareItem label="TikTok" bonus={30}>
                  <BrandIcon brand="tiktok" size={48} style={{ borderRadius: 24 }} />
                </KShareItem>
                <KShareItem label="Instagram" bonus={30}>
                  <BrandIcon brand="instagram" size={48} style={{ borderRadius: 24 }} />
                </KShareItem>
                <KShareItem label="WhatsApp">
                  <BrandIcon brand="whatsapp" size={48} style={{ borderRadius: 24 }} />
                </KShareItem>
                <KShareItem label="Copy link">
                  <KShareCircle icon="link" />
                </KShareItem>
                <KShareItem label="Save video">
                  <KShareCircle icon="download" />
                </KShareItem>
              </View>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 14 }}>
                <KShareItem label="Remix">
                  <KShareCircle icon="wand-sparkles" />
                </KShareItem>
                <KShareItem label="Not interested">
                  <KShareCircle icon="x" />
                </KShareItem>
                <KShareItem label="Report">
                  <KShareCircle icon="flag" />
                </KShareItem>
              </View>
            </KSheet>
          </View>
        </Block>

        <Block bg="#000" title="弹窗和 toast" rule={["APP 自己的弹窗:12pt 圆角，标题 + 说明 + 主色按钮 + 文字按钮。每日签到用它，不再用大渐变头图。", "系统权限、内购确认、评分仍然照 iOS 真机样式，不用这个。", "toast 在顶部，8pt 圆角的深色小条。"]}>
          <KToast text="+15 credits · Day 3 streak" />
          <View style={{ height: 16 }} />
          <KDialog
            hero={
              <View style={{ alignItems: "center", marginBottom: 12 }}>
                <Text style={[tk.type.captionStrong, { color: c.text3 }]}>Day 3 of your streak</Text>
                <View style={{ marginTop: 8 }}>
                  <KCredits n={15} plus size={28} />
                </View>
                <View style={{ alignSelf: "stretch", marginTop: 16, marginBottom: 4 }}>
                  <KStreak rewards={STREAK} done={2} today={2} />
                </View>
              </View>
            }
            title="Today's free credits"
            body="Come back every day. Day 7 pays 50."
            primary="Claim 15 credits"
            secondary="Not now"
            cta
          />
        </Block>

        <h2 id="content" className="mt-10 text-[22px] font-semibold text-stone-900">内容</h2>

        <Block pad={0} title="评论" rule={["头像 32pt(回复 24pt) · 名字 13pt 灰 · 正文 15pt · 时间和 Reply 13pt 灰 · 右侧爱心和数字。", "作者的回复名字后面带主色 Creator。", "输入条:头像 + 灰色胶囊输入框，有内容时出现主色发送键。"]}>
          <KCommentRow avatar={poster("alice")} name="Luna Park" text="I have watched this eleven times and I'm not done" meta="2h" likes="214" />
          <KCommentRow reply creator avatar={poster("napoleon")} name="Odd History" text="eleven is a good start" meta="1h" likes="32" />
          <KCommentInput avatar={ME} />
        </Block>

        <Block title="发现页卡片" rule={["4pt 圆角封面，左下角是做同款次数，下面两行标题、作者和点赞。", "卡片上不放 Remix 按钮(现在每张卡都有一个)，点进视频再做同款，画面更干净。", "卡片高度跟视频真实比例走。"]}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <KDiscoverCard uri={poster("fruit")} width={175} ratio={1.5} title="Ep. 12: the picnic betrayal" avatar={poster("fruit")} author="Fruit Drama" likes="51.2K" tag="Hot" remixes="15.3K" />
            <View style={{ gap: 12 }}>
              <KDiscoverCard uri={poster("kings")} width={175} ratio={0.75} title="The royal court, but it's that diner dance scene" avatar={poster("napoleon")} author="Odd History" likes="30.7K" remixes="9,028" />
            </View>
          </View>
        </Block>

        <Block pad={0} title="主页:数据、内容 Tab、作品网格" rule={["数据三栏:数字 17pt 粗体，标签 13pt 灰，中间细竖线。", "内容 Tab 用图标(作品 / 出镜 / 收藏 / 点赞)，选中下面一条白线。", "作品网格 3 列、1pt 缝、无圆角;左下角播放数;草稿带 Draft，生成中显示百分比。"]}>
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <KStats
              items={[
                { n: "12", label: "Following" },
                { n: "348", label: "Followers" },
                { n: "2,914", label: "Likes" },
              ]}
            />
          </View>
          <KIconTabs
            current={itab}
            onChange={setItab}
            tabs={[
              { id: "posts", icon: "layout-grid", label: "Posts" },
              { id: "twin", icon: "scan-face", label: "Starring me" },
              { id: "saved", icon: "bookmark", label: "Saved" },
              { id: "likes", icon: "heart", label: "Likes" },
            ]}
          />
          <View style={{ flexDirection: "row", gap: 1 }}>
            <KGridCell uri={poster("kings")} width={(W - 2) / 3} tag="Draft" />
            <KGridCell uri={poster("fruit")} width={(W - 2) / 3} progress={0.42} />
            <KGridCell uri={poster("poodle")} width={(W - 2) / 3} count="1,280" />
          </View>
        </Block>

        <Block pad={0} title="列表行" rule={["左侧 48pt 圆形图标或头像，标题 15pt 半粗，副标题 13pt 灰。", "右侧可以放红点、缩略图、按钮或箭头。消息、挑战、设置入口都用它。"]}>
          <KListRow leading={<KRowIcon icon="trophy" />} title="Challenges" sub="2 live now · win credits" chevron />
          <KListRow leading={<KRowIcon icon="gift" color={c.success} />} title="Rewards" sub="Daily check-in and missions" chevron />
          <KListRow leading={<KAvatar uri={poster("poodle")} size={48} />} title="Mochi & Friends" sub="remixed your video · 2m · +5 credits" right={<Image source={{ uri: poster("poodle") }} style={{ width: 40, height: 52, borderRadius: 4 }} />} />
          <KListRow leading={<KAvatar uri={poster("scooter")} size={48} />} title="Kai Rivers" sub="started following you · 12m" right={<KButton label="Follow back" size="s" />} />
        </Block>

        <h2 id="rewards" className="mt-10 text-[22px] font-semibold text-stone-900">激励和创作</h2>

        <Block title="签到、任务、等级" rule={["签到 7 格:已领打勾，今天主色描边，第 7 天礼物。", "任务行右侧按钮三态:Go(灰) → Claim(主色) → Done(文字)。", "等级:Lv 徽章 + 称号 + 4pt 高的经验条。"]}>
          <KStreak rewards={STREAK} done={2} today={2} />
          <View style={{ height: 8 }} />
          <KMissionRow title="Post a video" reward={20} state="claim" />
          <KMissionRow title="Like 5 videos" reward={5} progress="3/5" state="go" />
          <KMissionRow title="Remix 3 videos" reward={15} state="done" />
          <View style={{ height: 8 }} />
          <KLevel lv={2} title="Rising Creator" pct={0.4} xp="40/100 XP" />
        </Block>

        <Block title="提醒条和做同款标签" rule={["提醒条:主色浅底，左缩略图，右主色小按钮。用在草稿催发、挑战报名。一屏最多一条。", "做同款页的可替换标签:缩略图 + 名字 + ×;换成自己的素材后是主色浅底描边。"]}>
          <KNudge thumb={poster("kings")} title="1 draft ready to post" sub="Post it now and earn up to 80 credits" cta="Post" />
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <KSlot thumb={poster("kings")} label="The King" />
            <KSlot thumb={ME} label="You" on onRemove={() => {}} />
            <KSlot thumb={poster("kings")} label="Image 1" onRemove={() => {}} />
          </View>
        </Block>
      </div>
    </div>
  );
}
