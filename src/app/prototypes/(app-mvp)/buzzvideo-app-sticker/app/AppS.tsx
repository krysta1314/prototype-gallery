import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import AiConsentDialog from "./v1s/AiConsentDialogS";
import ExitOfferSheet from "./v1s/ExitOfferSheetS";
import ExitOfferBannerS from "./v1s/ExitOfferBannerS";
import Editor from "./screens/Editor";
import IosFilesPicker from "../../buzzvideo-app/app/components/IosFilesPicker";
import IosSettings from "./v1s/IosSettingsS";
import Keyboard from "../../buzzvideo-app/app/components/Keyboard";
import MarketingOptIn from "../../buzzvideo-app/app/components/MarketingOptIn";
import OfflineBanner from "../../buzzvideo-app/app/components/OfflineBanner";
import PermissionPrompt from "./v1s/PermissionPromptS";
import PromoPopup from "./v1s/PromoPopupS";
import SettingsAlert from "./v1s/SettingsAlertS";
import ThirdPartyAuth from "../../buzzvideo-app/app/components/ThirdPartyAuth";
import Toast from "./v1s/ToastS";
import { topRoute } from "../../buzzvideo-app/app/nav";
import EmailLogin from "./v1s/EmailLoginS";
import InviteFriends from "./v1s/InviteFriendsS";
import Login from "./v1s/LoginS";
import Paywall from "./v1s/PaywallS";
import Settings from "./v1s/SettingsS";
import Subscription from "./v1s/SubscriptionS";
import V1Sheets from "./v1s/SheetsS";
import { needsAtt } from "../../buzzvideo-app/app/store";
import { Challenges, ChallengeDetail, Inbox, Me, PostViewer, Profile } from "./screens/Social";
import { Play, Remix, Result, Template } from "./screens/Remix";
import CreateS from "./screens/CreateS";
import Home from "./screens/Home";
import Onboarding from "./screens/Onboarding2";
import { Celebrate, Rewards, Twin } from "./screens/Rewards";
import { GZTabBar, gz } from "../kit/gz";
import Sheets2 from "./sheets";
import { readyCount, topRoute2, useV2, type Route2 } from "./store";
import { DailyBanner, Toast2 } from "./ui";
import { InsetsProvider, KeyboardProvider, keyboardHeight, useInsets, useKeyboard, useNav, useStore } from "./v1";

function renderRoute2(r: Route2) {
  switch (r.name) {
    case "remix":
      return <Remix key={r.postId} postId={r.postId} effect={r.effect} />;
    case "template":
      return <Template key={r.postId} postId={r.postId} />;
    case "play":
      return <Play />;
    case "result":
      return <Result jobId={r.jobId} />;
    case "profile":
      return <Profile userId={r.userId} />;
    case "post":
      return <PostViewer key={r.postId + (r.mine ?? "")} postId={r.postId} list={r.list} mine={r.mine} />;
    case "inbox":
      return <Inbox />;
    case "challenges":
      return <Challenges />;
    case "challenge":
      return <ChallengeDetail id={r.id} />;
    case "rewards":
      return <Rewards />;
    case "twin":
      return <Twin />;
    case "editor":
      return <Editor key={(r.seed ?? "") + (r.postId ?? "")} seed={r.seed} postId={r.postId} />;
  }
}

/**
 * 第二版 APP 根。未登录(引导 → 登录)和第一版的全屏页(付费墙、设置、订阅、邀请好友)直接渲染第一版的页面;
 * 登录后的主体(首页视频流、做同款、我的、社交、签到任务)是第二版自己的。
 */
/** 贴纸风新原型的 APP 根(结构同第二版 App2):底部栏 Home / Create / Me,Create 是 Tab(第一版的创作流程) */
export default function AppS() {
  const rootRef = useRef<never>(null as never);
  return (
    <KeyboardProvider rootRef={rootRef}>
      <Inner rootRef={rootRef} />
    </KeyboardProvider>
  );
}

function Inner({ rootRef }: { rootRef: React.RefObject<never> }) {
  const { state, dispatch } = useStore();
  const { nav, navigate } = useNav();
  const { s, d } = useV2();
  const insets = useInsets();
  const kb = useKeyboard();
  const kbH = keyboardHeight(kb);
  const [lift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(lift, { toValue: kbH, duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: false }).start();
  }, [kbH, lift]);

  // 以下三段和第一版 App 一致:ATT 框、付费墙请求、积分包
  const attDue = needsAtt(state) && !state.permissionPrompt;
  useEffect(() => {
    if (attDue) dispatch({ type: "requestPermission", kind: "tracking" });
  }, [attDue, dispatch]);
  useEffect(() => {
    if (!state.signedIn || !state.paywallRequest) return;
    navigate({ type: "push", route: { name: "plans", ...state.paywallRequest } });
    dispatch({ type: "consumePaywallRequest" });
  }, [state.signedIn, state.paywallRequest, navigate, dispatch]);
  useEffect(() => {
    if (!state.topUpRequested) return;
    navigate({ type: "sheet", sheet: { name: "topUp" } });
    dispatch({ type: "consumeTopUpRequest" });
  }, [state.topUpRequested, navigate, dispatch]);
  // 付费成功:第一版会回到它的「我的」,第二版里直接收起付费墙
  useEffect(() => {
    if (state.planUpgrade) navigate({ type: "reset" });
  }, [state.planUpgrade, navigate]);

  const v1Route = topRoute(nav);
  const r2 = topRoute2(s);
  let body;
  let v2Main = false;
  if (!state.signedIn) body = !state.onboarded ? <Onboarding /> : state.emailAuth ? <EmailLogin /> : <Login />;
  // 剪辑器里弹付费墙：盖在剪辑器上面，不卸载剪辑器(关掉付费墙回到原来的剪辑进度)
  else if (v1Route?.name === "plans" && r2?.name === "editor") body = renderRoute2(r2);
  else if (v1Route?.name === "plans") body = <Paywall trigger={v1Route.trigger} tab={v1Route.tab} confirm={v1Route.confirm} />;
  else if (v1Route?.name === "settings") body = <Settings />;
  else if (v1Route?.name === "subscription") body = <Subscription />;
  else if (v1Route?.name === "inviteFriends") body = <InviteFriends />;
  else if (r2) body = renderRoute2(r2);
  else {
    v2Main = true;
    body = s.tab === "home" ? <Home /> : s.tab === "create" ? <CreateS /> : <Me />;
  }
  const v2Active = state.signedIn && !v1Route;
  // 底部栏是一条实底黑条(组件库方案 A),页面内容在它上面;有底部栏时页面不用再留安全区
  const showTabs = v2Main && !kb.open;
  const bodyInsets = kb.open ? { top: insets.top, bottom: 8 } : showTabs ? { top: insets.top, bottom: 0 } : insets;
  // 每日签到不弹窗:登录后第一次回到首页 / 我的，自动到账，顶部横幅告知(不盖在付费墙、挽留面板上)
  const canClaim = v2Main && !s.claimedToday && !s.sheet && !state.exitOfferOpen && !state.promoOpen && !nav.sheet;
  useEffect(() => {
    if (!canClaim) return;
    const tm = setTimeout(() => d({ type: "claimDaily" }), 700);
    return () => clearTimeout(tm);
  }, [canClaim, d]);

  return (
    <View ref={rootRef} style={styles.root}>
      <Animated.View style={[styles.main, { paddingBottom: lift }]}>
        <InsetsProvider value={bodyInsets}>
          <View style={styles.body}>
            {body}
            {v1Route?.name === "plans" && r2?.name === "editor" ? (
              <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
                <Paywall trigger={v1Route.trigger} tab={v1Route.tab} confirm={v1Route.confirm} />
              </View>
            ) : null}
            {/* 挽留优惠 24 小时内：首页底部栏上方的回访券(同第一版) */}
            {v2Main && s.tab === "home" && !kb.open ? <ExitOfferBannerS /> : null}
          </View>
        </InsetsProvider>
        {showTabs ? (
          <GZTabBar current={s.tab} dot={readyCount(s) > 0 ? "me" : undefined} insetBottom={insets.bottom} onChange={(id) => d({ type: "tab", tab: id })} />
        ) : null}
      </Animated.View>
      {v2Active ? <Sheets2 /> : null}
      {v2Active && s.celebrate ? <Celebrate /> : null}
      {v2Active ? <DailyBanner /> : null}
      <V1Sheets />
      <ExitOfferSheet />
      <PromoPopup />
      <MarketingOptIn />
      <OfflineBanner />
      {/* 剪辑器里顶栏有 ✕ 和 Export,提示往下让一点(审核 #13) */}
      <Toast offset={v2Active && r2?.name === "editor" ? 52 : 0} />
      <Toast2 offset={v2Active && r2?.name === "editor" ? 52 : 0} />
      {!state.signedIn ? <ThirdPartyAuth /> : null}
      <PermissionPrompt />
      <SettingsAlert />
      <IosSettings />
      <IosFilesPicker />
      {state.aiConsentPrompt && <AiConsentDialog />}
      <Keyboard />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: gz.color.black },
  main: { flex: 1, backgroundColor: gz.color.black },
  body: { flex: 1 },
});
