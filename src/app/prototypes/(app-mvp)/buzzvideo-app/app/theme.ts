/* BuzzVideo APP 深色主题 token(默认且唯一)—— React Native 与网页端共用,真实 APP 可原样搬走
 * 依据:docs/superpowers/specs/2026-09-29-buzzvideo-app-redesign.md §2;色值对齐 iOS 深色模式系统语义色
 * 原则:纯黑平涂 + 白色文字,浮层靠更亮的面区分;橙色只标「下一步」(主按钮 / 选中 / 发送 / 进度) */

export const colors = {
  /** 页面底,平涂(iOS systemBackground dark) */
  bg: "#000000",
  /** 面(分组列表、sheet、输入框容器、Tab 栏)—— iOS secondarySystemBackground dark */
  surface: "#1c1c1e",
  /** 分组底 / 骨架 / 胶囊底 / 分段控件底 —— 在 bg 与 surface 上都能区分 */
  grouped: "#2c2c2e",
  /** 压在 grouped 上的更亮一层(分段控件选中块、头像底、Toast) */
  raised: "#48484a",
  /** hairline 分隔线(iOS separator dark) */
  separator: "rgba(84,84,88,0.6)",
  /** 主文字 */
  ink: "#ffffff",
  /** 以 ink 为底色的填充(选中胶囊、角标)上的文字 / 图标 */
  onInk: "#000000",
  /** 次要文字,13px 上对比度 ≥ 4.5:1 */
  sub: "rgba(235,235,245,0.64)",
  /** 只用于占位符、chevron 这类非阅读元素 */
  faint: "rgba(235,235,245,0.32)",
  /** 按下态的轻微提亮 */
  pressed: "rgba(255,255,255,0.06)",
  /** Buzz 橙:只用于选中态、发送键、进度 */
  accent: "#ff6a2b",
  ctaA: "#FFA73C",
  ctaB: "#FF5255",
  success: "#30d158",
  danger: "#ff453a",
  userBubble: "#2c2c2e",
  /** 压在图片上的按钮 / 胶囊底 */
  onImage: "rgba(0,0,0,0.35)",
  scrim: "rgba(0,0,0,0.6)",
  black: "#000000",
  white: "#ffffff",
  iosBlue: "#0a84ff",
  /** iOS 系统填充(开关关闭轨道、系统弹窗灰胶囊) */
  systemFill: "rgba(120,120,128,0.32)",
} as const;

/** 全 APP 唯一的渐变:每屏唯一的主按钮 */
export const ctaGradient = [colors.ctaA, colors.ctaB] as const;

/** 字号阶梯(系统字体 SF Pro,固定 px)。最大字重 700;caption 只给 Tab 标签与角标 */
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700", letterSpacing: -0.4 },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.3 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "600", letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400", letterSpacing: 0 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400", letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 13, fontWeight: "600", letterSpacing: 0 },
} as const;

/** 4pt 网格 */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** 只有 4 档圆角 */
/** hero:满版大图(灵感页 Banner)底部的大圆角,整屏宽的图用 20 会显得像被捏了一下 */
export const radius = { xs: 4, md: 12, lg: 20, hero: 36, full: 999 } as const;

/**
 * iOS 式连续曲率圆角(超椭圆)。网页端用 CSS corner-shape;原生端 RN 不认识这个属性会忽略,
 * 真实 APP 里 iOS 用 borderCurve: "continuous" 达到同样效果。
 */
export const smoothCorners = { cornerShape: "squircle", borderCurve: "continuous" } as unknown as Record<string, never>;

/** 默认无阴影;只有浮层(sheet、输入框容器、toast、push 横幅)用这一档。
 *  深色下阴影几乎看不见,浮层主要靠更亮的面区分;这里只留一道很淡的亮边 + 深色投影 */
export const elevation = { float: "0px 0px 0px 0.5px rgba(255,255,255,0.08), 0px 8px 24px rgba(0,0,0,0.5)" } as const;

/** 最小点击区域 */
export const HIT = 44;

/** 会话抽屉占屏宽的比例(ChatGPT 式) */
export const DRAWER_RATIO = 0.85;
