import { screenKey, type NavState } from "../app/nav";
import { needsAtt, type StoreState } from "../app/store";

/**
 * 当前「屏」的 key,评审右栏按它取需求说明。弹层优先于页面:
 * 系统权限框 > 挽留 > 运营弹窗 > 评分 > 营销轻问 > AI 授权 > 活动推送 > 未登录三屏 > 待打开的付费墙 > 待打开的积分包 > 底部面板 > 页面
 */
export function surfaceOf(s: StoreState, nav: NavState): string {
  if (s.permissionPrompt) return `perm-${s.permissionPrompt.kind}`;
  if (s.exitOfferOpen) return "exitOffer";
  if (s.promoOpen) return "promo";
  if (s.ratingPromptOpen) return "rating";
  if (s.marketingPromptOpen) return "marketingOptIn";
  if (s.aiConsentPrompt) return "aiConsent";
  if (s.campaignBanner) return "campaignPush";
  if (!s.signedIn) return !s.onboarded ? "onboarding" : needsAtt(s) ? "att" : "login";
  if (s.paywallRequest) return "plans";
  if (s.topUpRequested) return "sheet-topUp";
  if (nav.sheet) return `sheet-${nav.sheet.name}`;
  return screenKey(nav);
}
