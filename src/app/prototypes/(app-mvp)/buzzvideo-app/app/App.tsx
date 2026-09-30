import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
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
import Me from "./screens/Me";
import Members from "./screens/Members";
import Plans from "./screens/Plans";
import Settings from "./screens/Settings";
import UseCaseDetail from "./screens/UseCaseDetail";
import WorkDetail from "./screens/WorkDetail";
import Sheets from "./sheets/Sheets";
import { colors, DRAWER_RATIO } from "./theme";

/** 首页先渲染出来,停一下再弹推送授权 */
const PUSH_PROMPT_DELAY_MS = 800;

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
  const { nav } = useNav();
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
  // 登录完成、首页出现后再请求推送授权(不和登录页同时出现);已回答过则 store 忽略
  useEffect(() => {
    if (!state.signedIn) return;
    const t = setTimeout(() => dispatch({ type: "requestPermission", kind: "push" }), PUSH_PROMPT_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.signedIn, dispatch]);

  const translateX = shift.interpolate({ inputRange: [0, 1], outputRange: [0, width * DRAWER_RATIO] });

  const body = !state.signedIn ? <Login /> : route ? renderRoute(route) : renderTab(nav.tab);

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
