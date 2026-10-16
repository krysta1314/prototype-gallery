import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { DURATION, SHEET_SPRING } from "./components/motion";
import AiConsentDialog from "./components/AiConsentDialog";
import ExitOfferBanner from "./components/ExitOfferBanner";
import OfflineBanner from "./components/OfflineBanner";
import ExitOfferSheet from "./components/ExitOfferSheet";
import MarketingOptIn from "./components/MarketingOptIn";
import PromoPopup from "./components/PromoPopup";
import RatingPrompt from "./components/RatingPrompt";
import PermissionPrompt from "./components/PermissionPrompt";
import PushBanner from "./components/PushBanner";
import TabBar from "./components/TabBar";
import Toast from "./components/Toast";
import { topRoute, type Route, type TabId } from "./nav";
import { useNav, useStore } from "./provider";
import AttExplainer from "./screens/AttExplainer";
import { deepLinkUseCase, needsAtt } from "./store";
import Camera from "./screens/Camera";
import Create from "./screens/Create";
import Inspire from "./screens/Inspire";
import Login from "./screens/Login";
import Onboarding from "./screens/Onboarding";
import Me from "./screens/Me";
import Members from "./screens/Members";
import Paywall from "./screens/Paywall";
import InviteFriends from "./screens/InviteFriends";
import Subscription from "./screens/Subscription";
import Settings from "./screens/Settings";
import UseCaseDetail from "./screens/UseCaseDetail";
import WorkDetail from "./screens/WorkDetail";
import Sheets from "./sheets/Sheets";
import { colors, DRAWER_RATIO } from "./theme";

function renderTab(tab: TabId) {
  if (tab === "inspire") return <Inspire />;
  if (tab === "create") return <Create />;
  return <Me />;
}

function renderRoute(route: Route) {
  switch (route.name) {
    case "useCase":
      return <UseCaseDetail id={route.id} />;
    case "work":
      return <WorkDetail id={route.id} />;
    case "settings":
      return <Settings />;
    case "members":
      return <Members />;
    case "plans":
      return <Paywall trigger={route.trigger} tab={route.tab} />;
    case "camera":
      return <Camera />;
    case "inviteFriends":
      return <InviteFriends />;
    case "subscription":
      return <Subscription />;
  }
}

export default function App() {
  const { state, dispatch } = useStore();
  const { nav, navigate } = useNav();
  const route = topRoute(nav);
  const [width, setWidth] = useState(390);

  // 付费成功(首次订阅 / 升级):回到「我的」页,在那里播订阅标签换档动画
  useEffect(() => {
    if (!state.planUpgrade) return;
    navigate({ type: "reset" });
    navigate({ type: "tab", tab: "me" });
  }, [state.planUpgrade, navigate]);

  // 会话抽屉打开时,主页面整体右移(ChatGPT 式)
  const drawerOpen = nav.sheet?.name === "sessions";
  const shift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // 和会话抽屉同一组弹簧,两者同步
    (drawerOpen
      ? Animated.spring(shift, { toValue: 1, ...SHEET_SPRING, useNativeDriver: false })
      : Animated.timing(shift, { toValue: 0, duration: DURATION.sheetOut, easing: Easing.in(Easing.cubic), useNativeDriver: false })
    ).start();
  }, [drawerOpen, shift]);
  // ATT 答完、登录页出现时请求推送授权;已回答过则 store 忽略(之后再到登录页不会重复弹)
  const onLogin = !state.signedIn && state.onboarded && !needsAtt(state);
  useEffect(() => {
    if (onLogin) dispatch({ type: "requestPermission", kind: "push" });
  }, [onLogin, dispatch]);

  // 付费墙请求(首登、每日冷启动、生成视频、锁定模型、积分不足、运营弹窗…):由 reducer 决定弹不弹,这里负责打开
  useEffect(() => {
    if (!state.signedIn || !state.paywallRequest) return;
    navigate({ type: "push", route: { name: "plans", ...state.paywallRequest } });
    dispatch({ type: "consumePaywallRequest" });
  }, [state.signedIn, state.paywallRequest, navigate, dispatch]);

  // 会员积分不足:自动打开积分包面板
  useEffect(() => {
    if (!state.topUpRequested) return;
    navigate({ type: "sheet", sheet: { name: "topUp" } });
    dispatch({ type: "consumeTopUpRequest" });
  }, [state.topUpRequested, navigate, dispatch]);

  // 从广告链接进来:登录、付费墙、挽留都走完后,直接打开那条 Use Case(spec §8.3)
  const linked = deepLinkUseCase(state);
  const busy = !!state.paywallRequest || state.exitOfferOpen || route?.name === "plans";
  useEffect(() => {
    if (!state.signedIn || !linked || busy) return;
    navigate({ type: "push", route: { name: "useCase", id: linked.id } });
    dispatch({ type: "consumeDeepLink" });
  }, [state.signedIn, linked, busy, navigate, dispatch]);

  const translateX = shift.interpolate({ inputRange: [0, 1], outputRange: [0, width * DRAWER_RATIO] });

  const body = !state.signedIn ? (
    !state.onboarded ? <Onboarding /> : needsAtt(state) ? <AttExplainer /> : <Login />
) : route ? renderRoute(route) : renderTab(nav.tab);

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.main, { transform: [{ translateX }] }]}>
        <View style={styles.body}>{body}</View>
        {state.signedIn && !route && <TabBar />}
        {state.signedIn && !route && nav.tab === "inspire" && <ExitOfferBanner />}
      </Animated.View>
      <Sheets />
      <ExitOfferSheet />
      <PromoPopup />
      <MarketingOptIn />
      <RatingPrompt />
      <PushBanner />
      <OfflineBanner />
      <Toast />
      <PermissionPrompt />
      {state.aiConsentPrompt && <AiConsentDialog />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: colors.bg },
  main: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
