/* BuzzVideo APP 浅色主题 token —— React Native 与网页端共用,真实 APP 可原样搬走
 * 依据:docs/superpowers/specs/2026-09-29-buzzvideo-app-redesign.md §2
 * 原则:暖白平涂 + 墨色文字,橙色只标「下一步」(主按钮 / 选中 / 发送 / 进度) */

export const colors = {
  /** 页面底,平涂 */
  bg: "#faf8f6",
  /** 面(分组列表、sheet、输入框容器) */
  surface: "#ffffff",
  /** 分组底 / 骨架 / 胶囊底 / 分段控件底 */
  grouped: "#f2f1ef",
  /** hairline 分隔线 */
  separator: "#e6e4e1",
  ink: "#1a1a2e",
  /** 次要文字,13px 上对比度 ≥ 4.5:1 */
  sub: "#5f6070",
  /** 只用于占位符、chevron 这类非阅读元素 */
  faint: "#8e8d99",
  /** Buzz 橙:只用于选中态、发送键、进度 */
  accent: "#ff5e1a",
  ctaA: "#FFA73C",
  ctaB: "#FF5255",
  success: "#16794a",
  danger: "#c5282f",
  userBubble: "#f2f1ef",
  /** 压在图片上的按钮 / 胶囊底 */
  onImage: "rgba(0,0,0,0.35)",
  scrim: "rgba(26,26,46,0.42)",
  black: "#000000",
  white: "#ffffff",
  iosBlue: "#007aff",
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
export const radius = { xs: 4, md: 12, lg: 20, hero: 32, full: 999 } as const;

/** 默认无阴影;只有浮层(sheet、输入框容器、toast、push 横幅)用这一档 */
export const elevation = { float: "0px 8px 24px rgba(26,26,46,0.08)" } as const;

/** 最小点击区域 */
export const HIT = 44;

/** 会话抽屉占屏宽的比例(ChatGPT 式) */
export const DRAWER_RATIO = 0.85;
