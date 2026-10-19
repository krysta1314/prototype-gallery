/**
 * 埋点汇总(2026-10-19 起唯一来源):各屏说明里不再单独列埋点,统一在评审左栏「埋点」模块里看。
 * module 和左栏一级模块同名,汇总页按模块分组、用同一套模块色;source 写清由谁上报
 */
export type TrackedEvent = {
  name: string;
  /** 参数;没有就留空 */
  params?: string;
  /** 什么时候打 */
  when: string;
  source: "客户端" | "服务端" | "Adjust";
  /** 在哪一屏 */
  screen: string;
  module: string;
  /** 补充说明(口径、去重等) */
  note?: string;
};

export const EVENTS: TrackedEvent[] = [
  // 首次打开
  { module: "首次打开", screen: "引导页", name: "install", when: "第一次打开 APP", source: "Adjust", note: "Adjust SDK 自动采集,带广告归因" },
  { module: "首次打开", screen: "ATT 系统框", name: "att_result", params: "allow / deny", when: "用户回答 ATT 系统框", source: "客户端" },
  { module: "首次打开", screen: "登录页", name: "login_start", params: "method = apple / google / email", when: "点三种登录按钮之一", source: "客户端", note: "用来看各登录方式的取消率" },
  { module: "首次打开", screen: "登录页", name: "sign_up", params: "method, invite_code, email_hidden(仅 Apple)", when: "新账号注册成功", source: "客户端" },
  { module: "首次打开", screen: "登录页", name: "login", params: "method", when: "老账号登录成功", source: "客户端" },

  // 付费
  { module: "付费", screen: "付费墙", name: "paywall_view", params: "trigger, campaign_id", when: "付费墙出现", source: "客户端", note: "trigger:first_login / daily / video_locked / model_locked / low_credits / promo / manual" },
  { module: "付费", screen: "付费墙", name: "paywall_close", params: "tab, period", when: "关闭付费墙", source: "客户端" },
  { module: "付费", screen: "挽留弹窗", name: "exit_offer_view", when: "挽留弹窗出现", source: "客户端" },
  { module: "付费", screen: "挽留弹窗", name: "exit_offer_close", when: "关闭挽留弹窗", source: "客户端" },
  { module: "付费", screen: "付费墙 / 挽留弹窗", name: "subscribe", params: "plan, period, price, is_exit_offer, source", when: "订阅成功", source: "服务端", note: "以 App Store 回执为准,客户端不打;升级也算一次" },
  { module: "付费", screen: "积分包", name: "credit_pack_purchase", params: "pack, price", when: "积分包购买成功", source: "服务端" },

  // 运营与增长
  { module: "运营与增长", screen: "首页运营弹窗", name: "promo_popup_view", params: "campaign_id", when: "运营弹窗出现", source: "客户端" },
  { module: "运营与增长", screen: "首页运营弹窗", name: "promo_popup_click", params: "campaign_id", when: "点运营弹窗的按钮", source: "客户端" },
  { module: "运营与增长", screen: "邀请好友", name: "invite_share", params: "channel", when: "分享邀请链接", source: "客户端" },
  { module: "运营与增长", screen: "邀请好友", name: "invite_reward", when: "好友首次订阅,双方发奖励", source: "服务端" },

  // 创作
  { module: "创作", screen: "Create", name: "generation_submit", params: "mode, model", when: "每次提交生成", source: "客户端" },
  { module: "创作", screen: "Create", name: "first_generation", when: "账号第一次提交生成", source: "客户端" },
  { module: "创作", screen: "Create", name: "first_result_ready", when: "账号第一条成片完成", source: "客户端", note: "投放激活事件,回传 Adjust" },
  { module: "创作", screen: "Create", name: "first_video_ready", when: "账号第一条视频成片完成", source: "客户端" },
  { module: "创作", screen: "成片详情", name: "save", when: "保存成片到相册", source: "客户端" },
  { module: "创作", screen: "成片详情", name: "share", params: "channel", when: "分享成片", source: "客户端", note: "选了渠道才算分享成功" },
  { module: "创作", screen: "评分弹窗", name: "rating_prompt", when: "弹出系统评分框", source: "客户端" },
];
