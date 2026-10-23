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
import SettingsAlert from "./components/SettingsAlert";
import IosSettings from "./components/IosSettings";
import IosFilesPicker from "./components/IosFilesPicker";
import ThirdPartyAuth from "./components/ThirdPartyAuth";
import PushBanner from "./components/PushBanner";
import TabBar from "./components/TabBar";
import Toast from "./components/Toast";
import { topRoute, type Route, type TabId } from "./nav";
import Keyboard from "./components/Keyboard";
import { KeyboardProvider, keyboardHeight, useKeyboard } from "./keyboard";
import { InsetsProvider, useInsets, useNav, useStore } from "./provider";
import { needsAtt } from "./store";
import Camera from "./screens/Camera";
import Create from "./screens/Create";
import Inspire from "./screens/Inspire";
import EmailLogin from "./screens/EmailLogin";
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
      return <UseCaseDetail id={route.id} list={route.list} />;
    case "work":
      return <WorkDetail id={route.id} askWatermark={route.askWatermark} />;
    case "settings":
      return <Settings />;
    case "members":
      return <Members />;
    case "plans":
      return <Paywall trigger={route.trigger} tab={route.tab} confirm={route.confirm} />;
    case "camera":
      return <Camera />;
    case "inviteFriends":
      return <InviteFriends />;
    case "subscription":
      return <Subscription />;
  }
}

/** APP 根：挂键盘状态(监听这台手机里的输入框焦点) */
export default function App() {
  const rootRef = useRef<never>(null as never);
  return (
    <KeyboardProvider rootRef={rootRef}>
      <AppInner rootRef={rootRef} />
    </KeyboardProvider>
  );
}

function AppInner({ rootRef }: { rootRef: React.RefObject<never> }) {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const kb = useKeyboard();
  const kbH = keyboardHeight(kb);
  // 键盘弹起：内容区底部垫高键盘高度(和键盘同一条 250ms 曲线);键盘盖住了 Home 横条区，底部安全区换成 8
  const [lift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(lift, { toValue: kbH, duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: false }).start();
  }, [kbH, lift]);
  const bodyInsets = kb.open ? { top: insets.top, bottom: 8 } : insets;
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
  // 引导页点 Get started 后直接弹系统 ATT 框(不放说明页,2026-10-16 定),背后是登录页;
  // 已回答过 / 非 iOS 时 store 忽略
  const attDue = needsAtt(state) && !state.permissionPrompt;
  useEffect(() => {
    if (attDue) dispatch({ type: "requestPermission", kind: "tracking" });
  }, [attDue, dispatch]);
  // 推送授权不在登录页问(2026-10-19 定):挪到第一次提交生成时，见 store 的 submitPrompt

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

  const translateX = shift.interpolate({ inputRange: [0, 1], outputRange: [0, width * DRAWER_RATIO] });

  const body = !state.signedIn ? (
    !state.onboarded ? <Onboarding /> : state.emailAuth ? <EmailLogin /> : <Login />
) : route ? renderRoute(route) : renderTab(nav.tab);

  return (
    <View ref={rootRef} style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.main, { transform: [{ translateX }], paddingBottom: lift }]}>
        <InsetsProvider value={bodyInsets}>
          <View style={styles.body}>{body}</View>
        </InsetsProvider>
        {/* 打字时(键盘弹起)Tab 栏和挽留横幅都收起 */}
        {state.signedIn && !route && !kb.open && <TabBar />}
        {state.signedIn && !route && !kb.open && nav.tab === "inspire" && <ExitOfferBanner />}
      </Animated.View>
      <Sheets />
      <ExitOfferSheet />
      <PromoPopup />
      <MarketingOptIn />
      <RatingPrompt />
      <PushBanner />
      <OfflineBanner />
      <Toast />
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
  root: { flex: 1, overflow: "hidden", backgroundColor: colors.bg },
  main: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
