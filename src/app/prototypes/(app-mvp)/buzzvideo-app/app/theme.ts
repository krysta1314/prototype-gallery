/* BuzzVideo APP 浅色主题 token —— React Native 与网页端共用,真实 APP 可原样搬走 */
export const colors = {
  ink: "#1a1a2e",
  sub: "#6a6b7b",
  faint: "#a3a2b1",
  line: "#ececf1",
  surface: "#ffffff",
  surfaceMuted: "#f7f4f1",
  bgTop: "#ffe7d2",
  bgBottom: "#fffaf6",
  peach: "#fff0e6",
  peachLine: "#ffd2b8",
  accent: "#ff5e1a",
  ctaA: "#FFA73C",
  ctaB: "#FF5255",
  success: "#1f9d55",
  danger: "#e5484d",
  dangerSoft: "#fff1f1",
  warnSoft: "#fff7ed",
  scrim: "rgba(26,26,46,0.42)",
  black: "#000000",
  white: "#ffffff",
  iosBlue: "#007aff",
} as const;

export const ctaGradient = [colors.ctaA, colors.ctaB] as const;
export const bgGradient = [colors.bgTop, colors.bgBottom] as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const shadow = {
  card: "0px 6px 20px rgba(26,26,46,0.07)",
  float: "0px 10px 30px rgba(26,26,46,0.12)",
  cta: "0px 8px 18px rgba(255,82,85,0.28)",
} as const;

export const font = { title: 28, h2: 22, h3: 17, body: 15, small: 13, tiny: 11 } as const;

/** 会话抽屉占屏宽的比例(ChatGPT 式) */
export const DRAWER_RATIO = 0.85;
