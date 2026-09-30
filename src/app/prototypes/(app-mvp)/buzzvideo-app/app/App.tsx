import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import PrivacyDialog from "./components/PrivacyDialog";
import PermissionPrompt from "./components/PermissionPrompt";
import PushBanner from "./components/PushBanner";
import TabBar from "./components/TabBar";
import Toast from "./components/Toast";
import { topRoute, type Route, type TabId } from "./nav";
import { useNav, useStore } from "./provider";
import Camera from "./screens/Camera";
import Create from "./screens/Create";
import Inspire from "./screens/Inspire";
import Login from "./screens/Login";
import Onboarding from "./screens/Onboarding";
import Me from "./screens/Me";
import Members from "./screens/Members";
import Plans from "./screens/Plans";
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
      return <Plans />;
    case "camera":
      return <Camera />;
  }
}

export default function App() {
  const { state, dispatch } = useStore();
  const { nav, navigate } = useNav();
  const route = topRoute(nav);
  const [width, setWidth] = useState(390);

  // 会话抽屉打开时,主页面整体右移(ChatGPT 式)
  const drawerOpen = nav.sheet?.name === "sessions";
  const shift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(shift, {
      toValue: drawerOpen ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [drawerOpen, shift]);
  // 隐私弹窗同意后、登录页出现时请求推送授权;已回答过则 store 忽略(之后再到登录页不会重复弹)
  const onLogin = !state.signedIn && state.onboarded && state.privacyAccepted;
  useEffect(() => {
    if (onLogin) dispatch({ type: "requestPermission", kind: "push" });
  }, [onLogin, dispatch]);

  // 首次登录的 Free 用户:自动打开一次订阅页(是否弹由 reducer 决定)
  useEffect(() => {
    if (!state.signedIn || !state.plansPromptPending) return;
    navigate({ type: "push", route: { name: "plans" } });
    dispatch({ type: "consumePlansPrompt" });
  }, [state.signedIn, state.plansPromptPending, navigate, dispatch]);

  const translateX = shift.interpolate({ inputRange: [0, 1], outputRange: [0, width * DRAWER_RATIO] });

  const body = !state.signedIn ? (
    !state.onboarded ? (
      <Onboarding />
    ) : (
      <View style={styles.body}>
        <Login />
        {!state.privacyAccepted && <PrivacyDialog />}
      </View>
    )
  ) : route ? renderRoute(route) : renderTab(nav.tab);

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.main, { transform: [{ translateX }] }]}>
        <View style={styles.body}>{body}</View>
        {state.signedIn && !route && <TabBar />}
      </Animated.View>
      <Sheets />
      <PushBanner />
      <Toast />
      <PermissionPrompt />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: colors.bg },
  main: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
});
