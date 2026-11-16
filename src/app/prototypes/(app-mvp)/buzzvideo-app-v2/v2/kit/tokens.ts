/* BuzzVideo APP 第二版 · 设计 token(2026-11-10)
 * 参照 TikTok APP 深色模式的组件体系:纯黑视频底、中性灰阶(不带色偏)、实心图标、8pt 圆角的实底按钮、贴底的面板。
 * 和 TikTok 不同的只有品牌色:主色用 Buzz 橙(TikTok 是红),点赞红、收藏黄沿用短视频产品的通用约定。
 * 这一份只给 kit/ 里的新组件用;现有页面还在用第一版的 theme.ts,等组件确认后再统一替换。 */

export const tk = {
  color: {
    /** 视频流、全屏播放页的底 */
    black: "#000000",
    /** 其他页面的底(我的、消息、任务…) */
    page: "#121212",
    /** 面板、弹窗、卡片 */
    surface: "#1e1e1e",
    /** 压在 surface 上的再一层(输入框、选中行) */
    raised: "#2a2a2a",
    /** 文字四档:主 / 次 / 三级 / 占位 */
    text: "rgba(255,255,255,0.92)",
    text2: "rgba(255,255,255,0.72)",
    text3: "rgba(255,255,255,0.5)",
    text4: "rgba(255,255,255,0.34)",
    /** 分隔线 */
    line: "rgba(255,255,255,0.12)",
    /** 灰色填充两档:输入框 / 次级按钮 */
    fill: "rgba(255,255,255,0.08)",
    fill2: "rgba(255,255,255,0.14)",
    /** 压在视频上的半透明胶囊 */
    onVideo: "rgba(0,0,0,0.4)",
    onVideoLight: "rgba(255,255,255,0.18)",
    white: "#ffffff",
    /** 品牌主色:唯一的强调色(主按钮、关注加号、选中、进度) */
    primary: "#ff5e1a",
    primaryPressed: "#e24f12",
    /** 主色的浅底(选中的签到格、提醒条) */
    primarySoft: "rgba(255,94,26,0.16)",
    /** 点赞 */
    like: "#fe2c55",
    /** 收藏 */
    save: "#face15",
    success: "#2fd08a",
    /** 遮罩 */
    scrim: "rgba(0,0,0,0.5)",
  },
  /** 字号阶梯(pt):只用这 8 档 */
  type: {
    /** 大数字、弹窗大标题 */
    display: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.3 },
    /** 页面标题 */
    title: { fontSize: 20, lineHeight: 26, fontWeight: "700", letterSpacing: -0.2 },
    /** 导航栏标题、作者名、数据数字 */
    headline: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.2 },
    /** 正文、文案、评论、按钮文字 */
    body: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
    bodyStrong: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
    /** 次要信息:时间、数据标签、面板标题 */
    caption: { fontSize: 13, lineHeight: 17, fontWeight: "400" },
    captionStrong: { fontSize: 13, lineHeight: 17, fontWeight: "600" },
    /** 右侧操作列的数字、角标 */
    micro: { fontSize: 12, lineHeight: 15, fontWeight: "600" },
    /** 底部栏标签 */
    tab: { fontSize: 10, lineHeight: 12, fontWeight: "500" },
  },
  /** 间距:4pt 网格 */
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 },
  /** 圆角只有 4 档 */
  radius: {
    /** 缩略图、小标签 */
    sm: 4,
    /** 按钮、卡片、输入框、toast */
    md: 8,
    /** 面板顶部、弹窗 */
    lg: 12,
    /** 头像、圆形图标按钮、评论输入胶囊 */
    full: 999,
  },
  /** 固定尺寸 */
  size: {
    /** 底部栏内容高度(不含安全区) */
    tabBar: 49,
    navBar: 44,
    /** 按钮三档高度 */
    btnL: 48,
    btnM: 36,
    btnS: 28,
    /** 右侧操作列图标 */
    railIcon: 34,
    railAvatar: 48,
    hit: 44,
  },
  /** 压在视频上的文字阴影 */
  textShadow: { textShadowColor: "rgba(0,0,0,0.45)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
} as const;
