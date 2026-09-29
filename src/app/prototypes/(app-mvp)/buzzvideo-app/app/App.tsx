import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Gradient from "./components/Gradient";
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
import Settings from "./screens/Settings";
import UseCaseDetail from "./screens/UseCaseDetail";
import WorkDetail from "./screens/WorkDetail";
import Sheets from "./sheets/Sheets";
import { bgGradient, DRAWER_RATIO } from "./theme";

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
    case "camera":
      return <Camera />;
  }
}

export default function App() {
  const { state } = useStore();
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
  const translateX = shift.interpolate({ inputRange: [0, 1], outputRange: [0, width * DRAWER_RATIO] });

  const body = !state.signedIn ? <Login /> : route ? renderRoute(route) : renderTab(nav.tab);

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Gradient colors={bgGradient} dots style={StyleSheet.absoluteFill} />
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
  root: { flex: 1, overflow: "hidden" },
  main: { flex: 1 },
  body: { flex: 1 },
});
