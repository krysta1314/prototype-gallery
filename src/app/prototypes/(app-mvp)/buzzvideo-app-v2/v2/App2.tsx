import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import AiConsentDialog from "../../buzzvideo-app/app/components/AiConsentDialog";
import ExitOfferSheet from "../../buzzvideo-app/app/components/ExitOfferSheet";
import IosFilesPicker from "../../buzzvideo-app/app/components/IosFilesPicker";
import IosSettings from "../../buzzvideo-app/app/components/IosSettings";
import Keyboard from "../../buzzvideo-app/app/components/Keyboard";
import MarketingOptIn from "../../buzzvideo-app/app/components/MarketingOptIn";
import OfflineBanner from "../../buzzvideo-app/app/components/OfflineBanner";
import PermissionPrompt from "../../buzzvideo-app/app/components/PermissionPrompt";
import PromoPopup from "../../buzzvideo-app/app/components/PromoPopup";
import SettingsAlert from "../../buzzvideo-app/app/components/SettingsAlert";
import ThirdPartyAuth from "../../buzzvideo-app/app/components/ThirdPartyAuth";
import Toast from "../../buzzvideo-app/app/components/Toast";
import { topRoute } from "../../buzzvideo-app/app/nav";
import EmailLogin from "../../buzzvideo-app/app/screens/EmailLogin";
import InviteFriends from "../../buzzvideo-app/app/screens/InviteFriends";
import Login from "../../buzzvideo-app/app/screens/Login";
import Paywall from "../../buzzvideo-app/app/screens/Paywall";
import Settings from "../../buzzvideo-app/app/screens/Settings";
import Subscription from "../../buzzvideo-app/app/screens/Subscription";
import V1Sheets from "../../buzzvideo-app/app/sheets/Sheets";
import { needsAtt } from "../../buzzvideo-app/app/store";
import { Challenges, ChallengeDetail, Inbox, Me, PostViewer, Profile } from "./screens/Social";
import { Play, Remix, Result, Template } from "./screens/Create";
import Home from "./screens/Home";
import Onboarding from "./screens/Onboarding2";
import { Celebrate, Rewards, Twin } from "./screens/Rewards";
import { KTabBar } from "./kit/components";
import { tk } from "./kit/tokens";
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
  }
}

/**
 * 第二版 APP 根。未登录(引导 → 登录)和第一版的全屏页(付费墙、设置、订阅、邀请好友)直接渲染第一版的页面;
 * 登录后的主体(首页视频流、做同款、我的、社交、签到任务)是第二版自己的。
 */
export default function App2() {
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
  else if (v1Route?.name === "plans") body = <Paywall trigger={v1Route.trigger} tab={v1Route.tab} confirm={v1Route.confirm} />;
  else if (v1Route?.name === "settings") body = <Settings />;
  else if (v1Route?.name === "subscription") body = <Subscription />;
  else if (v1Route?.name === "inviteFriends") body = <InviteFriends />;
  else if (r2) body = renderRoute2(r2);
  else {
    v2Main = true;
    body = s.tab === "home" ? <Home /> : <Me />;
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
          <View style={styles.body}>{body}</View>
        </InsetsProvider>
        {showTabs ? (
          <KTabBar
            current={s.tab}
            dot={readyCount(s) > 0 ? "me" : undefined}
            insetBottom={insets.bottom}
            onChange={(id) => (id === "create" ? d({ type: "push", route: { name: "play" } }) : d({ type: "tab", tab: id }))}
          />
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
      <Toast />
      <Toast2 />
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
  root: { flex: 1, overflow: "hidden", backgroundColor: tk.color.black },
  main: { flex: 1, backgroundColor: tk.color.black },
  body: { flex: 1 },
});
