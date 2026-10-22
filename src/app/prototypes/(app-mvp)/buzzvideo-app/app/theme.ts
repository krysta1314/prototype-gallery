/* BuzzVideo APP 深色主题 token(2026-10-15 起全 APP 改 dark mode)—— React Native 与网页端共用,真实 APP 可原样搬走
 * 原则:近黑平涂 + 浅色文字,橙色只标「下一步」(主按钮 / 选中 / 发送 / 进度)。
 * 层级靠明度区分:bg(页面)< grouped(胶囊 / 骨架 / 分组页底)< surface(卡片、sheet、输入框)。
 * inverse / onInverse:原来「墨色底白字」的控件(选中胶囊、深色按钮、倒计时胶囊),深色模式下翻成浅底深字 */

export const colors = {
  /** 页面底,平涂 */
  bg: "#0f0f13",
  /** 面(分组列表、sheet、输入框容器) */
  surface: "#24242c",
  /** 分组底 / 骨架 / 胶囊底 / 分段控件底 */
  grouped: "#1a1a20",
  /** 抬升:分段控件选中段等「压在 grouped 上的选中态」,比 surface 再亮一档,深色下才分得出 */
  raised: "#3a3a45",
  /** hairline 分隔线 */
  separator: "#33333d",
  ink: "#f4f4f7",
  /** 次要文字,13px 上对比度 ≥ 4.5:1 */
  sub: "#a5a5b2",
  /** 只用于占位符、chevron 这类非阅读元素 */
  faint: "#6c6c78",
  /** Buzz 橙:只用于选中态、发送键、进度 */
  accent: "#ff5e1a",
  ctaA: "#FFA73C",
  ctaB: "#FF5255",
  success: "#3ccf8e",
  danger: "#ff5a5f",
  /** 白字压在上面的危险红底(角标):比 danger 深一档,白字对比度 ≥ 4.5:1 */
  dangerFill: "#c8323a",
  userBubble: "#24242c",
  /** 反相控件底(原墨色底)与上面的字 */
  inverse: "#f4f4f7",
  onInverse: "#111116",
  /** 页面底色的半透明版:图片底部渐变遮罩、滚动后的导航栏,让图片 / 栏无缝融进页面 */
  bgScrim: "rgba(15,15,19,0.72)",
  /** 深色背景上阴影看不见:浮层(sheet、输入框、toast、横幅)用一道很淡的亮边勾出边缘 */
  edge: "rgba(255,255,255,0.08)",
  /** APP 图标底色(黑底 + 原版 logo,和桌面图标一致) */
  appIconBg: "#111116",
  /** 按压 / 悬停的叠加层 */
  pressedOverlay: "rgba(255,255,255,0.06)",
  /** 压在图片上的按钮 / 胶囊底 */
  onImage: "rgba(0,0,0,0.35)",
  scrim: "rgba(0,0,0,0.6)",
  black: "#000000",
  white: "#ffffff",
  /** iOS 深色模式的系统蓝(systemBlue dark) */
  iosBlue: "#0a84ff",
} as const;

/** 全 APP 唯一的渐变:每屏唯一的主按钮 */
export const ctaGradient = [colors.ctaA, colors.ctaB] as const;

/**
 * 字号阶梯 = iOS 系统字号(SF Pro,固定 px),2026-10-22 统一:只用这 10 档，不再写别的数字。
 * 34 largeTitle / 28 title1 / 22 title2 / 20 title3 / 17 headline / 16 body / 15 subhead / 13 footnote / 12 caption1 / 11 caption(caption2)
 * 例外只有两类：营销大字(付费墙、挽留页的价格和 50% OFF)、照搬 iOS 系统界面(分享面板、设置、文件、键盘、Tab 栏 10pt 标签)
 */
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700", letterSpacing: -0.4 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.3 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "600", letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400", letterSpacing: 0 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: "600", letterSpacing: -0.2 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400", letterSpacing: 0 },
  /** 小一号说明：卡片标题、描述里的次要信息 */
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: "400", letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 13, fontWeight: "600", letterSpacing: 0 },
} as const;

/** 4pt 网格 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/**
 * 圆角(2026-10-22 统一，只用这几档):
 * xs 4 = 细条(下划线、进度、分页点) · md 12 = 缩略图、下拉框、小按钮块 · control 16 = 设置里的选项块(比例、清晰度、时长) · lg 20 = 卡片、横幅、Toast
 * sheet 38 = iOS 26 悬浮面板 · hero 36 = 满版大图底部 · full = 胶囊、圆形、所有小标签(Hot / New / Trending / 时长)、主按钮、输入框
 */
export const radius = { xs: 4, md: 12, control: 16, lg: 20, hero: 36, sheet: 38, full: 999 } as const;

/**
 * 深色底上的半透明填充(2026-10-22 统一，只用这三档):base 普通 / pressed 按下 / strong 压在图上或需要更明显
 */
export const fill = { base: "rgba(255,255,255,0.07)", pressed: "rgba(255,255,255,0.12)", strong: "rgba(255,255,255,0.18)" } as const;

/**
 * 选中态(2026-10-22 定):
 * - 所有单选的选项块 / 卡片 / 分段选项：品牌色淡底 + 同色细边(selectedBox,照即梦「询问 / 自动执行」),文字不变色;没选中的是灰底无边(2026-10-22 定)
 * - 多选(选照片):橙色带数字的圆圈 · 橙色只给主按钮、发送、进度、多选圆圈
 */
export const selectedBox = { backgroundColor: "rgba(255,122,64,0.2)", borderColor: "rgba(255,138,85,0.7)", borderWidth: 1 } as const;

/**
 * iOS 式连续曲率圆角(超椭圆)。网页端用 CSS corner-shape;原生端 RN 不认识这个属性会忽略,
 * 真实 APP 里 iOS 用 borderCurve: "continuous" 达到同样效果。
 */
export const smoothCorners = { cornerShape: "squircle", borderCurve: "continuous" } as unknown as Record<string, never>;

/** 默认无阴影;只有浮层(sheet、输入框容器、toast、push 横幅)用这一档 */
export const elevation = { float: "0px 8px 24px rgba(0,0,0,0.45)" } as const;

/** 最小点击区域 */
export const HIT = 44;

/** 会话抽屉占屏宽的比例(ChatGPT 式) */
export const DRAWER_RATIO = 0.85;
