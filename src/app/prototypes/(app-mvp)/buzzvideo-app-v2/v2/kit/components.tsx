import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { Coin, Gradient, Icon, type IconName } from "../v1";
import { tk } from "./tokens";

/* BuzzVideo APP 第二版 · 组件(2026-11-10)
 * 参照 TikTok APP 深色模式的组件形态。全部是纯展示组件:数据和点击从 props 传入，不依赖任何 store，
 * 现有页面还没换用它们(Monica:先把组件设计好，UI 先不改)。展示页:/prototypes/buzzvideo-app-v2/kit */

const c = tk.color;
const t = tk.type;

/* ============ 基础 ============ */

/** 头像:圆形图片;ring = 压在视频上时的白边 */
export function KAvatar({ uri, size = 40, ring }: { uri: string; size?: number; ring?: boolean }) {
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.raised, borderWidth: ring ? 1.5 : 0, borderColor: c.white }} />;
}

type BtnVariant = "cta" | "primary" | "secondary" | "outline" | "text" | "white" | "danger";
type BtnSize = "l" | "m" | "s";
/**
 * 按钮:8pt 圆角的实底矩形(不是胶囊，不用渐变)。
 * cta 品牌渐变(和网页版的 CTA 同一条渐变，只给整条流程里最关键的那一下:Generate、Post、每日 Claim)
 * primary 主色实底(每屏一个) · secondary 灰底 · outline 细边 · text 纯文字 · white 白底(压在视频上) · danger 红字浅红底
 * l 48 高(页面底部主操作，默认撑满) · m 36 高(行内:Follow、Claim) · s 28 高(列表里的小操作)
 */
export function KButton({ label, onPress, variant = "primary", size = "l", icon, disabled, loading, block, style, demoPressed }: { label: string; onPress?: () => void; variant?: BtnVariant; size?: BtnSize; icon?: IconName; disabled?: boolean; /** 提交中:文字换成转圈，不能再点 */ loading?: boolean; block?: boolean; style?: StyleProp<ViewStyle>; /** 组件库展示用:固定显示按下态 */ demoPressed?: boolean }) {
  const h = size === "l" ? tk.size.btnL : size === "m" ? tk.size.btnM : tk.size.btnS;
  const fg = variant === "primary" || variant === "cta" ? c.white : variant === "text" ? c.primary : variant === "white" ? "#000000" : variant === "danger" ? c.like : c.text;
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed: p }) => {
        const pressed = p || !!demoPressed;
        return [
        styles.btn,
        { height: h, paddingHorizontal: size === "l" ? 20 : size === "m" ? 16 : 12, alignSelf: block ?? size === "l" ? "stretch" : "flex-start" },
        variant === "primary" && { backgroundColor: pressed ? c.primaryPressed : c.primary },
        variant === "secondary" && { backgroundColor: pressed ? "rgba(255,255,255,0.2)" : c.fill2 },
        variant === "outline" && { borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.fill : "transparent" },
        variant === "text" && { paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 },
        variant === "white" && { backgroundColor: pressed ? "#d9d9d9" : c.white },
        variant === "danger" && { backgroundColor: pressed ? "rgba(254,44,85,0.28)" : "rgba(254,44,85,0.16)" },
        disabled && { opacity: 0.4 },
        style,
        ];
      }}
    >
      {variant === "cta" ? <Gradient colors={demoPressed ? ["#e8932f", "#e4464a"] : ["#FFA73C", "#FF5255"]} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
      {loading ? <KSpinner color={fg} size={size === "s" ? 14 : 18} /> : icon ? <Icon name={icon} size={size === "l" ? 18 : 16} color={fg} strokeWidth={2} /> : null}
      {loading ? null : <Text style={[size === "s" ? t.captionStrong : t.bodyStrong, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

/** 转圈:按钮提交中、列表加载。网页端用 CSS 动画;真实 APP 用 ActivityIndicator */
export function KSpinner({ color = c.white, size = 18 }: { color?: string; size?: number }) {
  return <View accessibilityLabel="Loading" style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, borderTopColor: "transparent" }, { animationKeyframes: { from: { transform: [{ rotate: "0deg" }] }, to: { transform: [{ rotate: "360deg" }] } }, animationDuration: "0.8s", animationIterationCount: "infinite", animationTimingFunction: "linear" } as object]} />;
}

/** 圆形实底图标按钮:创作页的小操作(加图、出镜)、发送。tone:fill 灰底 · primary 主色 · video 压在画面上 */
export function KCircleButton({ icon, onPress, tone = "fill", size = 40, label, disabled }: { icon: IconName; onPress?: () => void; tone?: "fill" | "primary" | "video"; size?: number; label: string; disabled?: boolean }) {
  const bg = tone === "primary" ? c.primary : tone === "video" ? c.onVideo : c.fill2;
  return (
    <Pressable onPress={disabled ? undefined : onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }, pressed && { opacity: 0.7 }, disabled && { opacity: 0.4 }]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={c.white} strokeWidth={2} />
    </Pressable>
  );
}

/** 圆形图标按钮:导航栏和视频上的返回、搜索、更多 */
export function KIconButton({ icon, onPress, onVideo, badge, label }: { icon: IconName; onPress?: () => void; onVideo?: boolean; badge?: number; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={24} color={onVideo ? c.white : c.text} strokeWidth={2} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** 小标签:Hot / New / Live / Draft。solid 实底;video 压在画面上的半透明底 */
export function KTag({ label, tone = "primary" }: { label: string; tone?: "primary" | "success" | "video" | "neutral" }) {
  const bg = tone === "primary" ? c.primary : tone === "success" ? c.success : tone === "video" ? c.onVideo : c.fill2;
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, tone === "success" && { color: "#04281a" }]}>{label}</Text>
    </View>
  );
}

/** 分类 / 筛选:4pt 圆角的小方块，选中是白底黑字 */
export function KChip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} style={[styles.chip, on && { backgroundColor: c.white }]}>
      <Text style={[t.captionStrong, { color: on ? "#000" : c.text2 }]}>{label}</Text>
    </Pressable>
  );
}

/** 积分数:coin + 数字，行内用 */
export function KCredits({ n, plus, size = 13 }: { n: number; plus?: boolean; size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Coin size={size} />
      <Text style={{ fontSize: size, lineHeight: size + 4, fontWeight: "700", color: c.text }}>
        {plus ? "+" : ""}
        {n.toLocaleString("en-US")}
      </Text>
    </View>
  );
}

/* ============ 视频流 ============ */

/** 首页顶部的频道切换:文字 Tab，选中加粗变白 + 下面一条短白线 */
export function KFeedTabs({ tabs, current, onChange }: { tabs: string[]; current: string; onChange?: (t: string) => void }) {
  return (
    <View style={styles.feedTabs} accessibilityRole="tablist">
      {tabs.map((x) => {
        const on = x === current;
        return (
          <Pressable key={x} onPress={() => onChange?.(x)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.feedTab}>
            <Text style={[on ? t.headline : { ...t.headline, fontWeight: "500" }, { color: on ? c.white : "rgba(255,255,255,0.6)" }, tk.textShadow]}>{x}</Text>
            <View style={[styles.feedTabLine, !on && { opacity: 0 }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * 首页顶栏(参照即梦):三个频道 Following / Inspiration / For You 居中偏左，右边消息(带未读数)和搜索。
 * left 可选，放积分之类的小东西;不传就空着
 */
export function KFeedHeader({ tabs, current, onChange, unread, left, onInbox, onSearch }: { tabs: string[]; current: string; onChange?: (t: string) => void; unread?: number; left?: ReactNode; onInbox?: () => void; onSearch?: () => void }) {
  return (
    <View style={styles.feedHead}>
      {/* 频道绝对居中于整屏宽度，不受左右图标宽度影响 */}
      <View pointerEvents="box-none" style={styles.feedHeadCenter}>
        <KFeedTabs tabs={tabs} current={current} onChange={onChange} />
      </View>
      {/* 左右各一个图标，两边等宽，频道才能真正居中又不挤 */}
      {left ?? <KIconButton icon="bell" onVideo badge={unread} onPress={onInbox} label="Inbox" />}
      <View style={{ flex: 1 }} pointerEvents="none" />
      <KIconButton icon="search" onVideo onPress={onSearch} label="Search" />
    </View>
  );
}

/** 操作列最上面:作者头像 + 关注加号(关注后加号消失) */
export function KRailAvatar({ uri, following, onAvatar, onFollow }: { uri: string; following?: boolean; onAvatar?: () => void; onFollow?: () => void }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 10 }}>
      <Pressable onPress={onAvatar} accessibilityLabel="Creator profile">
        <KAvatar uri={uri} size={tk.size.railAvatar} ring />
      </Pressable>
      {!following ? (
        <Pressable onPress={onFollow} accessibilityRole="button" accessibilityLabel="Follow" hitSlop={10} style={styles.followPlus}>
          <Icon name="plus" size={14} color={c.white} strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** 操作列的一项:实心白图标 + 下面的数字。选中时图标变色(点赞红、收藏黄) */
export function KRailAction({ icon, count, active, tint = c.like, onPress, label }: { icon: IconName; count: string; active?: boolean; tint?: string; onPress?: () => void; label: string }) {
  const color = active ? tint : c.white;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.railAction}>
      <View style={styles.railIconShadow}>
        <Icon name={icon} size={tk.size.railIcon} color={color} fill={color} strokeWidth={0.5} />
      </View>
      <Text style={[t.micro, { color: c.white }, tk.textShadow]}>{count}</Text>
    </Pressable>
  );
}

/**
 * 操作列最下面:Remix 入口(照即梦「拍同款」):这条视频的封面做成一张白边圆角小卡，微微歪一点，
 * 右下角压一支品牌渐变底的笔;下面写 Remix。整屏最想让人点的东西
 */
export function KRemixDisc({ uri, onPress }: { uri: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Remix this video" style={({ pressed }) => [{ alignItems: "center", gap: 6, marginTop: 12 }, pressed && { opacity: 0.8 }]}>
      <View>
        <View style={styles.remixCard}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
        <View style={styles.remixPen}>
          <Gradient colors={["#FFA73C", "#FF5255"]} angle={135} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <Icon name="pencil" size={13} color={c.white} strokeWidth={2.5} />
        </View>
      </View>
      <Text style={[t.micro, { color: c.white }, tk.textShadow]}>Remix</Text>
    </Pressable>
  );
}

/** 左下的作品信息:作者名 · 文案(两行，超出显示 more) · 一条半透明的做同款胶囊 */
export function KFeedCaption({ name, caption, tags, remixes, onRemix }: { name: string; caption: string; tags?: string[]; remixes?: string; onRemix?: () => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[t.headline, { color: c.white }, tk.textShadow]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[t.body, { color: c.white }, tk.textShadow]} numberOfLines={2}>
        {caption}
        {tags?.length ? <Text style={{ fontWeight: "600" }}> {tags.map((x) => `#${x}`).join(" ")}</Text> : null}
      </Text>
      {remixes ? (
        <Pressable onPress={onRemix} accessibilityRole="button" style={styles.anchor}>
          <Icon name="wand-sparkles" size={14} color={c.white} strokeWidth={2} />
          <Text style={[t.captionStrong, { color: c.white }]} numberOfLines={1}>
            Remix this · {remixes} made
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 视频底部的细进度条 */
export function KProgress({ value }: { value: number }) {
  return (
    <View style={styles.progress}>
      <View style={[styles.progressFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

/* ============ 底部栏 ============ */

export type KTabId = "home" | "create" | "me";
/** 底部栏内容高度(不含 Home 横条安全区) */
export const TAB_BAR_H = 56;
/**
 * 底部栏的几种做法(2026-11-11,Monica 要求出几个方案对比，还没定):全部是 3 格 Home / Create / Me,贴底黑条;
 * 上面的内容区底部两个角做圆角。Inspiration 留在首页顶部频道里。
 * - outline:纯文字，Create 是品牌渐变描边胶囊(照即梦)
 * - filled:纯文字，Create 是品牌渐变实心胶囊 +「+」
 * - icon:图标 + 小字，Create 是品牌渐变圆角方块里一个「+」(TikTok 的结构)
 * - white:纯文字，选中下面一个小圆点;Create 是白底黑字胶囊 + 星星
 * - raised:图标 + 小字，Create 是凸出黑条的品牌渐变圆形按钮
 */
export type KTabBarVariant = "outline" | "filled" | "icon" | "white" | "raised";
const TAB_ICON: Record<"home" | "me", IconName> = { home: "house", me: "user-round" };

export function KTabBar({ current, onChange, insetBottom = 0, dot, variant = "outline" }: { current: KTabId; onChange?: (id: KTabId) => void; insetBottom?: number; /** 哪一格带红点 */ dot?: KTabId; variant?: KTabBarVariant }) {
  const withIcon = variant === "icon" || variant === "raised";
  const tab = (id: "home" | "me", label: string) => {
    const on = id === current;
    const color = on ? c.white : "rgba(255,255,255,0.5)";
    return (
      <Pressable key={id} onPress={() => onChange?.(id)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tabItem}>
        <View style={{ alignItems: "center", gap: withIcon ? 2 : 4 }}>
          {withIcon ? <Icon name={TAB_ICON[id]} size={24} color={color} fill={on && id === "home" ? color : undefined} strokeWidth={on ? 2.25 : 1.75} /> : null}
          <Text style={withIcon ? [styles.tabSmall, { color }] : [styles.tabText, { color }]}>{label}</Text>
          {variant === "white" ? <View style={[styles.tabDot, !on && { opacity: 0 }]} /> : null}
          {dot === id ? <View style={[styles.dot, withIcon ? { right: -6, top: -2 } : { right: -10, top: -2 }]} /> : null}
        </View>
      </Pressable>
    );
  };
  const brand = <Gradient colors={["#FFA73C", "#FF5255"]} angle={90} style={StyleSheet.absoluteFill} pointerEvents="none" />;
  const create =
    variant === "outline" ? (
      <View style={styles.createRing}>
        {brand}
        <View style={styles.createInner}>
          <Text style={[styles.tabText, { color: c.white }]}>Create</Text>
        </View>
      </View>
    ) : variant === "filled" ? (
      <View style={styles.createPill}>
        {brand}
        <Icon name="plus" size={18} color={c.white} strokeWidth={3} />
        <Text style={[styles.tabText, { color: c.white }]}>Create</Text>
      </View>
    ) : variant === "icon" ? (
      <View style={styles.createSquare}>
        {brand}
        <Icon name="plus" size={22} color={c.white} strokeWidth={3} />
      </View>
    ) : variant === "white" ? (
      <View style={styles.createWhite}>
        <Icon name="sparkles" size={16} color="#000" fill="#000" strokeWidth={1.5} />
        <Text style={[styles.tabText, { color: "#000" }]}>Create</Text>
      </View>
    ) : (
      <View style={styles.createRaised}>
        {brand}
        <Icon name="plus" size={28} color={c.white} strokeWidth={3} />
      </View>
    );
  return (
    <View style={[styles.tabBar, { paddingBottom: insetBottom }]} accessibilityRole="tablist">
      {tab("home", "Home")}
      <Pressable onPress={() => onChange?.("create")} accessibilityRole="tab" accessibilityLabel="Create" accessibilityState={{ selected: current === "create" }} style={[styles.tabItem, variant === "raised" && { justifyContent: "flex-start" }]}>
        {create}
      </Pressable>
      {tab("me", "Me")}
    </View>
  );
}

/* ============ 导航栏 / 面板 / 提示 ============ */

/** 二级页导航栏:返回 · 居中标题 · 右侧操作 */
export function KNavBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.nav}>
      <KIconButton icon="chevron-left" onPress={onBack} label="Back" />
      <Text style={[t.headline, { color: c.text, flex: 1, textAlign: "center" }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ minWidth: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

/** 底部面板的壳:贴底通栏，只有上面两个角是 12pt 圆角;标题 13pt 居中，右上角 × */
export function KSheet({ title, onClose, children, insetBottom = 0 }: { title?: string; onClose?: () => void; children: ReactNode; insetBottom?: number }) {
  return (
    <View style={[styles.sheet, { paddingBottom: insetBottom }]}>
      <View style={styles.sheetHead}>
        <Text style={[t.captionStrong, { color: c.text }]}>{title}</Text>
        <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={10} style={styles.sheetClose}>
          <Icon name="x" size={20} color={c.text2} strokeWidth={2} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

/** 顶部 toast:8pt 圆角的深色小条(不是胶囊) */
export function KToast({ text }: { text: string }) {
  return (
    <View style={styles.toast}>
      <Text style={[t.caption, { color: c.white, fontWeight: "500", textAlign: "center" }]}>{text}</Text>
    </View>
  );
}

/** 居中弹窗:标题 + 说明 + 上下两个按钮。APP 自己的确认用它;系统权限、内购确认仍照 iOS 原样 */
export function KDialog({ title, body, primary, secondary, onPrimary, onSecondary, hero, cta }: { title: string; body?: string; primary: string; secondary?: string; onPrimary?: () => void; onSecondary?: () => void; hero?: ReactNode; /** 主按钮用品牌渐变(每日签到这类关键一下) */ cta?: boolean }) {
  return (
    <View style={styles.dialog}>
      {hero}
      <Text style={[t.headline, { color: c.text, textAlign: "center" }]}>{title}</Text>
      {body ? <Text style={[t.body, { color: c.text2, textAlign: "center", marginTop: 6 }]}>{body}</Text> : null}
      <KButton label={primary} variant={cta ? "cta" : "primary"} onPress={onPrimary} style={{ marginTop: 20 }} />
      {secondary ? <KButton label={secondary} variant="text" onPress={onSecondary} block style={{ marginTop: 4, alignSelf: "center" }} /> : null}
    </View>
  );
}

/* ============ 评论 / 分享 ============ */

export function KCommentRow({ avatar, name, text, meta, likes, liked, creator, reply, onLike }: { avatar: string; name: string; text: string; meta: string; likes: string; liked?: boolean; creator?: boolean; reply?: boolean; onLike?: () => void }) {
  return (
    <View style={[styles.comment, reply && { marginLeft: 44 }]}>
      <KAvatar uri={avatar} size={reply ? 24 : 32} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[t.captionStrong, { color: c.text3 }]}>{name}</Text>
          {creator ? <Text style={[t.micro, { color: c.primary }]}>· Creator</Text> : null}
        </View>
        <Text style={[t.body, { color: c.text, marginTop: 2 }]}>{text}</Text>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
          <Text style={[t.caption, { color: c.text3 }]}>{meta}</Text>
          <Text style={[t.captionStrong, { color: c.text3 }]}>Reply</Text>
        </View>
      </View>
      <Pressable onPress={onLike} accessibilityLabel={liked ? "Unlike comment" : "Like comment"} hitSlop={8} style={{ alignItems: "center", gap: 2, width: 32 }}>
        <Icon name="heart" size={18} color={liked ? c.like : c.text3} fill={liked ? c.like : undefined} strokeWidth={2} />
        <Text style={[t.micro, { fontWeight: "400", color: c.text3 }]}>{likes}</Text>
      </Pressable>
    </View>
  );
}

/** 评论输入条:头像 + 灰色胶囊输入框;有内容时右侧出现主色发送键 */
export function KCommentInput({ avatar, value, onChangeText, onSend }: { avatar: string; value?: string; onChangeText?: (v: string) => void; onSend?: () => void }) {
  return (
    <View style={styles.commentBar}>
      <KAvatar uri={avatar} size={32} />
      <TextInput value={value} onChangeText={onChangeText} placeholder="Add comment..." placeholderTextColor={c.text3} style={styles.commentInput} accessibilityLabel="Add comment" />
      {value ? (
        <Pressable onPress={onSend} accessibilityLabel="Send" style={styles.send}>
          <Icon name="arrow-up" size={18} color={c.white} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** 分享面板里的一项:48pt 圆 + 下面一行小字。平台用品牌色底，操作用灰底 */
export function KShareItem({ label, children, bonus, onPress }: { label: string; children: ReactNode; bonus?: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.shareItem}>
      <View>
        {children}
        {bonus ? (
          <View style={styles.shareBonus}>
            <Text style={styles.shareBonusText}>+{bonus}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[t.micro, { fontWeight: "400", color: c.text2, textAlign: "center" }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}
export function KShareCircle({ icon }: { icon: IconName }) {
  return (
    <View style={styles.shareCircle}>
      <Icon name={icon} size={22} color={c.text} strokeWidth={2} />
    </View>
  );
}

/* ============ 个人主页 / 网格 / 列表 ============ */

/** 数据三栏:数字 17 粗体 + 13 灰色标签，中间细竖线 */
export function KStats({ items }: { items: { n: string; label: string }[] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {items.map((x, i) => (
        <View key={x.label} style={{ flexDirection: "row", alignItems: "center" }}>
          {i ? <View style={{ width: StyleSheet.hairlineWidth, height: 16, backgroundColor: c.line }} /> : null}
          <View style={{ alignItems: "center", width: 96 }}>
            <Text style={[t.headline, { fontWeight: "700", color: c.text }]}>{x.n}</Text>
            <Text style={[t.caption, { color: c.text3, marginTop: 2 }]}>{x.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** 主页的内容 Tab:图标 Tab，选中下面一条白线，通栏细分隔线 */
export function KIconTabs({ tabs, current, onChange }: { tabs: { id: string; icon: IconName; label: string }[]; current: string; onChange?: (id: string) => void }) {
  return (
    <View style={styles.iconTabs} accessibilityRole="tablist">
      {tabs.map((x) => {
        const on = x.id === current;
        return (
          <Pressable key={x.id} onPress={() => onChange?.(x.id)} accessibilityRole="tab" accessibilityLabel={x.label} accessibilityState={{ selected: on }} style={styles.iconTab}>
            <Icon name={x.icon} size={22} color={on ? c.text : c.text4} fill={on && x.icon !== "layout-grid" ? c.text : undefined} strokeWidth={2} />
            <View style={[styles.iconTabLine, !on && { opacity: 0 }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** 作品网格的一格:3 列、1pt 缝、无圆角;左下角播放数或点赞数;草稿和生成中带标签 */
export function KGridCell({ uri, width, count, countIcon = "play", tag, progress }: { uri: string; width: number; count?: string; countIcon?: "play" | "heart"; tag?: string; progress?: number }) {
  return (
    <View style={{ width, height: width * 1.33, backgroundColor: c.raised }}>
      <Image source={{ uri }} style={[StyleSheet.absoluteFill, progress !== undefined ? { opacity: 0.35 } : null]} resizeMode="cover" />
      {tag ? (
        <View style={{ position: "absolute", left: 4, top: 4 }}>
          <KTag label={tag} tone="video" />
        </View>
      ) : null}
      {progress !== undefined ? (
        <View style={styles.cellCenter}>
          <Text style={[t.headline, { color: c.white }]}>{Math.round(progress * 100)}%</Text>
        </View>
      ) : null}
      {count ? (
        <View style={styles.cellCount}>
          <Icon name={countIcon} size={12} color={c.white} fill={countIcon === "heart" ? c.white : undefined} strokeWidth={2.5} />
          <Text style={[t.micro, { color: c.white }, tk.textShadow]}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** 发现页(瀑布流)卡片:4pt 圆角封面 + 两行标题 + 作者和点赞。卡片上不放按钮，点进去再 Remix */
export function KDiscoverCard({ uri, width, ratio, title, avatar, author, likes, tag, remixes }: { uri: string; width: number; ratio: number; title: string; avatar: string; author: string; likes: string; tag?: string; remixes?: string }) {
  return (
    <View style={{ width }}>
      <View style={{ height: width * ratio, borderRadius: tk.radius.sm, overflow: "hidden", backgroundColor: c.raised }}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {tag ? (
          <View style={{ position: "absolute", left: 6, top: 6 }}>
            <KTag label={tag} />
          </View>
        ) : null}
        {remixes ? (
          <View style={styles.cellCount}>
            <Icon name="wand-sparkles" size={12} color={c.white} strokeWidth={2.5} />
            <Text style={[t.micro, { color: c.white }, tk.textShadow]}>{remixes}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[t.caption, { color: c.text, fontWeight: "500", marginTop: 6 }]} numberOfLines={2}>
        {title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
        <KAvatar uri={avatar} size={18} />
        <Text style={[t.micro, { fontWeight: "400", color: c.text3, flex: 1 }]} numberOfLines={1}>
          {author}
        </Text>
        <Icon name="heart" size={13} color={c.text3} strokeWidth={2} />
        <Text style={[t.micro, { fontWeight: "400", color: c.text3 }]}>{likes}</Text>
      </View>
    </View>
  );
}

/** 列表行:左侧 48 圆形图标或头像 · 标题 + 副标题 · 右侧(角标 / 缩略图 / 按钮 / 箭头) */
export function KListRow({ leading, title, sub, right, chevron, onPress }: { leading: ReactNode; title: string; sub?: string; right?: ReactNode; chevron?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.fill }]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Text style={[t.bodyStrong, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={[t.caption, { color: c.text3, marginTop: 2 }]} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron-right" size={18} color={c.text4} strokeWidth={2} /> : null}
    </Pressable>
  );
}
/** 列表行左侧的圆形图标 */
export function KRowIcon({ icon, color = c.primary }: { icon: IconName; color?: string }) {
  return (
    <View style={[styles.rowIcon, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color={c.white} strokeWidth={2} />
    </View>
  );
}

/* ============ 激励(游戏化) ============ */

/** 连续签到的 7 格:已领打勾、今天主色描边、第 7 天礼物 */
export function KStreak({ rewards, done, today }: { rewards: number[]; done: number; /** 今天是第几格(从 0 起);已领过传 -1 */ today: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {rewards.map((n, i) => {
        const got = i < done;
        const now = i === today;
        return (
          <View key={i} style={[styles.day, now && { backgroundColor: c.primarySoft, borderColor: c.primary }, i === rewards.length - 1 && { flex: 1.4 }]} accessibilityLabel={`Day ${i + 1}: ${n} credits${got ? ", claimed" : ""}`}>
            {got ? <Icon name="check" size={16} color={c.success} strokeWidth={3} /> : i === rewards.length - 1 ? <Icon name="gift" size={16} color={c.primary} strokeWidth={2} /> : <Coin size={14} />}
            <Text style={[t.captionStrong, { color: got ? c.text3 : c.text }]}>+{n}</Text>
            <Text style={[t.tab, { color: c.text3 }]}>{now ? "Today" : `Day ${i + 1}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** 任务行:标题 + 奖励和进度 · 右侧按钮(Go 灰 → Claim 主色 → Done 文字) */
export function KMissionRow({ title, reward, progress, state, onPress }: { title: string; reward: number; progress?: string; state: "go" | "claim" | "done"; onPress?: () => void }) {
  return (
    <View style={styles.mission}>
      <View style={{ flex: 1 }}>
        <Text style={[t.bodyStrong, { color: c.text }]}>{title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          <KCredits n={reward} plus />
          {progress ? <Text style={[t.caption, { color: c.text3 }]}>· {progress}</Text> : null}
        </View>
      </View>
      {state === "done" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, width: 72, justifyContent: "center" }}>
          <Icon name="check" size={14} color={c.text3} strokeWidth={3} />
          <Text style={[t.caption, { color: c.text3 }]}>Done</Text>
        </View>
      ) : (
        <KButton label={state === "claim" ? "Claim" : "Go"} variant={state === "claim" ? "primary" : "secondary"} size="m" onPress={onPress} style={{ width: 72, paddingHorizontal: 0 }} />
      )}
    </View>
  );
}

/** 创作者等级:Lv 徽章 + 称号 + 经验条 + 数字 */
export function KLevel({ lv, title, pct, xp }: { lv: number; title: string; pct: number; xp: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessibilityLabel={`Level ${lv}, ${title}`}>
      <View style={styles.lv}>
        <Text style={[t.micro, { color: c.white }]}>Lv.{lv}</Text>
      </View>
      <Text style={[t.captionStrong, { color: c.text }]}>{title}</Text>
      <View style={styles.lvTrack}>
        <View style={[styles.lvFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={[t.micro, { fontWeight: "400", color: c.text3 }]}>{xp}</Text>
    </View>
  );
}

/** 提醒条:主色浅底 + 细边，左缩略图，右主色小按钮(草稿催发、挑战报名) */
export function KNudge({ thumb, title, sub, cta, onPress }: { thumb?: string; title: string; sub: string; cta: string; onPress?: () => void }) {
  return (
    <View style={styles.nudge}>
      {thumb ? <Image source={{ uri: thumb }} style={{ width: 40, height: 52, borderRadius: tk.radius.sm, backgroundColor: c.raised }} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[t.bodyStrong, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[t.caption, { color: c.text2, marginTop: 2 }]} numberOfLines={2}>
          {sub}
        </Text>
      </View>
      <KButton label={cta} size="m" onPress={onPress} />
    </View>
  );
}

/** 做同款页的可替换标签:缩略图 + 名字 + ×;选中(换成了自己的)是主色浅底描边 */
export function KSlot({ thumb, label, on, onPress, onRemove }: { thumb: string; label: string; on?: boolean; onPress?: () => void; onRemove?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.slot, on && { backgroundColor: c.primarySoft, borderColor: c.primary }]}>
      <Image source={{ uri: thumb }} style={{ width: 24, height: 24, borderRadius: tk.radius.sm, backgroundColor: c.raised }} />
      <Text style={[t.captionStrong, { color: c.text, maxWidth: 110 }]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityLabel={`Remove ${label}`} hitSlop={8}>
          <Icon name="x" size={14} color={c.text3} strokeWidth={2} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

/* ============ 表单 ============ */

type FieldState = "default" | "focus" | "error" | "disabled";
/**
 * 输入框:8pt 圆角灰底，44 高。聚焦时主色描边;出错时红色描边 + 下面一行红字;禁用 40% 透明。
 * label 在框上面(13pt 灰)，helper 在框下面
 */
export function KInput({ label, value, placeholder, onChangeText, helper, error, state, icon, right, secure }: { label?: string; value?: string; placeholder?: string; onChangeText?: (v: string) => void; helper?: string; error?: string; /** 组件库展示用:固定显示某个状态 */ state?: FieldState; icon?: IconName; right?: ReactNode; secure?: boolean }) {
  const st: FieldState = error ? "error" : (state ?? "default");
  return (
    <View style={st === "disabled" && { opacity: 0.4 }}>
      {label ? <Text style={[t.captionStrong, { color: c.text2, marginBottom: 6 }]}>{label}</Text> : null}
      <View style={[styles.field, st === "focus" && { borderColor: c.primary }, st === "error" && { borderColor: c.like }]}>
        {icon ? <Icon name={icon} size={18} color={c.text3} strokeWidth={2} /> : null}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.text3} editable={st !== "disabled"} secureTextEntry={secure} style={styles.fieldInput} accessibilityLabel={label ?? placeholder} />
        {right}
      </View>
      {error || helper ? <Text style={[t.caption, { color: error ? c.like : c.text3, marginTop: 6 }]}>{error ?? helper}</Text> : null}
    </View>
  );
}

/** 搜索框:胶囊形灰底 + 放大镜;有内容时右侧出现清除 */
export function KSearch({ value, placeholder = "Search", onChangeText }: { value?: string; placeholder?: string; onChangeText?: (v: string) => void }) {
  return (
    <View style={styles.search}>
      <Icon name="search" size={18} color={c.text3} strokeWidth={2} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.text3} style={styles.fieldInput} accessibilityLabel={placeholder} />
      {value ? (
        <Pressable onPress={() => onChangeText?.("")} accessibilityLabel="Clear" hitSlop={8} style={styles.clear}>
          <Icon name="x" size={12} color="#000" strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** 多行输入:创作页的提示词、发布文案。右下角字数 */
export function KTextArea({ value, placeholder, onChangeText, max, state }: { value?: string; placeholder?: string; onChangeText?: (v: string) => void; max?: number; state?: FieldState }) {
  return (
    <View style={[styles.area, state === "focus" && { borderColor: c.primary }]}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.text3} multiline style={[styles.fieldInput, { height: 72, textAlignVertical: "top" } as object]} accessibilityLabel={placeholder} />
      {max ? (
        <Text style={[t.micro, { fontWeight: "400", color: c.text4, alignSelf: "flex-end" }]}>
          {(value ?? "").length}/{max}
        </Text>
      ) : null}
    </View>
  );
}

/** 开关:iOS 尺寸(51 × 31)，开 = 主色 */
export function KSwitch({ on, onChange, disabled, label }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <Pressable onPress={() => !disabled && onChange?.(!on)} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on, disabled: !!disabled }} style={[styles.switch, { backgroundColor: on ? c.primary : c.fill2 }, disabled && { opacity: 0.4 }]}>
      <View style={[styles.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </Pressable>
  );
}

/** 勾选:圆形。多选(发布到哪些平台)和单选(选套餐)都用它 */
export function KCheck({ on, onChange, label }: { on: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange?.(!on)} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: on }} hitSlop={10} style={[styles.check, on && { backgroundColor: c.primary, borderColor: c.primary }]}>
      {on ? <Icon name="check" size={14} color={c.white} strokeWidth={3} /> : null}
    </Pressable>
  );
}

/** 分段控件:灰底里一块亮起的选中段(消耗 / 获得、月付 / 年付) */
export function KSegmented({ options, value, onChange }: { options: string[]; value: string; onChange?: (v: string) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange?.(o)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.segItem, on && { backgroundColor: c.fill2 }]}>
            <Text style={[t.captionStrong, { color: on ? c.text : c.text3 }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============ 提示气泡 ============ */

/**
 * 提示气泡(Tooltip / 新手引导):8pt 圆角 + 小三角。light 白底黑字(压在视频上的新手引导);dark 深灰(页面里的说明)。
 * arrow:三角在气泡的哪一边、靠哪头
 */
export function KTooltip({ text, tone = "light", arrow = "bottom", align = "center" }: { text: string; tone?: "light" | "dark"; arrow?: "top" | "bottom" | "right"; align?: "start" | "center" | "end" }) {
  const bg = tone === "light" ? c.white : "#161616";
  const pos = align === "start" ? { left: 16 } : align === "end" ? { right: 16 } : { alignSelf: "center" as const };
  return (
    <View style={{ alignSelf: "flex-start" }}>
      <View style={[styles.tip, { backgroundColor: bg }]}>
        <Text style={[t.captionStrong, { color: tone === "light" ? "#000000" : c.white }]}>{text}</Text>
      </View>
      <View style={[styles.tipArrow, { backgroundColor: bg }, arrow === "bottom" && { bottom: -4, ...pos }, arrow === "top" && { top: -4, ...pos }, arrow === "right" && { right: -4, top: "50%", marginTop: -5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: tk.radius.md, backgroundColor: c.fill, borderWidth: 1, borderColor: "transparent" },
  fieldInput: { flex: 1, fontSize: 15, lineHeight: 20, color: c.text, padding: 0, outlineStyle: "none" } as object,
  search: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 12, borderRadius: tk.radius.full, backgroundColor: c.fill },
  clear: { width: 18, height: 18, borderRadius: 9, backgroundColor: c.text3, alignItems: "center", justifyContent: "center" },
  area: { padding: 12, borderRadius: tk.radius.md, backgroundColor: c.fill, borderWidth: 1, borderColor: "transparent", gap: 4 },
  switch: { width: 51, height: 31, borderRadius: 16, padding: 2 },
  knob: { width: 27, height: 27, borderRadius: 14, backgroundColor: c.white, transitionProperty: "transform", transitionDuration: "180ms" } as object,
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: c.text4, alignItems: "center", justifyContent: "center" },
  seg: { flexDirection: "row", padding: 2, borderRadius: tk.radius.md, backgroundColor: c.fill, alignSelf: "flex-start" },
  segItem: { height: 32, paddingHorizontal: 16, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  tip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: tk.radius.md, maxWidth: 240 },
  tipArrow: { position: "absolute", width: 10, height: 10, transform: [{ rotate: "45deg" }] },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: tk.radius.md, overflow: "hidden" },
  iconBtn: { width: tk.size.hit, height: tk.size.hit, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", right: 4, top: 4, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: c.like, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: "700", color: c.white },
  dot: { position: "absolute", right: -4, top: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: c.like },
  tag: { alignSelf: "flex-start", height: 18, paddingHorizontal: 6, borderRadius: tk.radius.sm, alignItems: "center", justifyContent: "center" },
  tagText: { fontSize: 11, lineHeight: 13, fontWeight: "700", color: c.white },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: tk.radius.sm, backgroundColor: c.fill, alignItems: "center", justifyContent: "center" },
  feedTabs: { flexDirection: "row", justifyContent: "center", gap: 14 },
  feedHead: { flexDirection: "row", alignItems: "center", height: tk.size.navBar, paddingHorizontal: 4 },
  feedHeadCenter: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" },
  feedTab: { alignItems: "center", height: tk.size.navBar, justifyContent: "center" },
  feedTabLine: { position: "absolute", bottom: 4, width: 24, height: 3, borderRadius: 2, backgroundColor: c.white },
  followPlus: { position: "absolute", bottom: -10, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" },
  railAction: { alignItems: "center", gap: 2, width: 48, marginTop: 16 },
  railIconShadow: { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" } as object,
  remixCard: { width: 46, height: 46, borderRadius: tk.radius.lg, overflow: "hidden", borderWidth: 2, borderColor: c.white, backgroundColor: c.raised, transform: [{ rotate: "-6deg" }], boxShadow: "0 2px 6px rgba(0,0,0,0.35)" } as object,
  remixPen: { position: "absolute", right: -7, bottom: -5, width: 22, height: 22, borderRadius: 11, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.white },
  anchor: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, height: 28, paddingHorizontal: 8, borderRadius: tk.radius.sm, backgroundColor: c.onVideoLight, maxWidth: "100%" },
  progress: { height: 2, backgroundColor: "rgba(255,255,255,0.25)" },
  progressFill: { height: 2, backgroundColor: c.white },
  tabBar: { flexDirection: "row", backgroundColor: c.black },
  tabItem: { flex: 1, height: TAB_BAR_H, alignItems: "center", justifyContent: "center" },
  tabText: { fontSize: 17, lineHeight: 22, fontWeight: "700" },
  tabSmall: { fontSize: 11, lineHeight: 13, fontWeight: "600" },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.white },
  createRing: { height: 38, borderRadius: tk.radius.full, padding: 2, overflow: "hidden" },
  createPill: { height: 40, paddingHorizontal: 18, borderRadius: tk.radius.full, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 4 },
  createSquare: { width: 48, height: 34, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  createWhite: { height: 40, paddingHorizontal: 18, borderRadius: tk.radius.full, backgroundColor: c.white, flexDirection: "row", alignItems: "center", gap: 6 },
  createRaised: { width: 60, height: 60, borderRadius: 30, marginTop: -18, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: c.black },
  createInner: { flex: 1, paddingHorizontal: 18, borderRadius: tk.radius.full, backgroundColor: c.black, alignItems: "center", justifyContent: "center" },
  nav: { flexDirection: "row", alignItems: "center", height: tk.size.navBar, backgroundColor: c.page },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: tk.radius.lg, borderTopRightRadius: tk.radius.lg, overflow: "hidden" },
  sheetHead: { height: 48, alignItems: "center", justifyContent: "center" },
  sheetClose: { position: "absolute", right: 14, top: 14 },
  toast: { alignSelf: "center", maxWidth: "86%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: tk.radius.md, backgroundColor: "rgba(60,60,60,0.96)" },
  dialog: { backgroundColor: c.surface, borderRadius: tk.radius.lg, padding: 20, paddingTop: 24 },
  comment: { flexDirection: "row", gap: 12, paddingVertical: 10, paddingHorizontal: 16 },
  commentBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
  commentInput: { flex: 1, height: 40, paddingHorizontal: 14, borderRadius: tk.radius.full, backgroundColor: c.fill, fontSize: 15, color: c.text, outlineStyle: "none" } as object,
  send: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.primary, alignItems: "center", justifyContent: "center" },
  shareItem: { width: 64, alignItems: "center", gap: 6 },
  shareCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.fill2, alignItems: "center", justifyContent: "center" },
  shareBonus: { position: "absolute", right: -8, top: -6, height: 16, paddingHorizontal: 5, borderRadius: 8, backgroundColor: c.primary, justifyContent: "center" },
  shareBonusText: { fontSize: 10, lineHeight: 12, fontWeight: "700", color: c.white },
  iconTabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  iconTab: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  iconTabLine: { position: "absolute", bottom: 0, width: 36, height: 2, backgroundColor: c.text },
  cellCenter: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  cellCount: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, minHeight: 68 },
  rowIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  day: { flex: 1, paddingVertical: 8, borderRadius: tk.radius.md, backgroundColor: c.fill, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "transparent" },
  mission: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  lv: { height: 18, paddingHorizontal: 6, borderRadius: tk.radius.sm, backgroundColor: c.primary, justifyContent: "center" },
  lvTrack: { width: 64, height: 4, borderRadius: 2, backgroundColor: c.fill2, overflow: "hidden" },
  lvFill: { height: 4, backgroundColor: c.primary },
  nudge: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: tk.radius.md, backgroundColor: c.primarySoft },
  slot: { flexDirection: "row", alignItems: "center", gap: 8, height: 36, paddingLeft: 6, paddingRight: 10, borderRadius: tk.radius.md, backgroundColor: c.fill, borderWidth: 1, borderColor: "transparent" },
});
