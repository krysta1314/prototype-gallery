import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { GZButton, gz } from "../../kit/gz";
import { Icon, prefersReducedMotion, useStore } from "../v1";
import { EASE } from "./parts-auth";

const c = gz.color;

/**
 * 贴纸风 AI 数据共享同意弹窗(逻辑和文案同第一版 components/AiConsentDialog):第一次把内容发给 AI 时出现。
 * 这是 APP 自己的弹窗(不是 iOS 系统权限框),所以按贴纸风画：深色卡片 + 天蓝盾牌贴纸(天蓝 = 信息)+ 展示字体标题;
 * Allow 橙色主操作，Not now 深灰。拒绝不锁 APP,只是这次不发送
 */
export default function AiConsentDialogS() {
  const { dispatch } = useStore();
  const [v] = useState(() => new Animated.Value(prefersReducedMotion() ? 1 : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const a = Animated.timing(v, { toValue: 1, duration: 240, easing: EASE, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [v]);
  const card = useMemo(() => ({ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] }), [v]);
  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: v }]} />
      <Animated.View style={[styles.card, card]} accessibilityRole="alert" accessibilityViewIsModal>
        <View style={styles.badge}>
          <Icon name="shield" size={24} color={c.ink} strokeWidth={2.4} />
        </View>
        <Text style={[gz.display.title, { color: c.white, textAlign: "center" }]} accessibilityRole="header">
          Share your content with AI providers?
        </Text>
        <Text style={[gz.body.caption, styles.msg]}>
          To create your ads, BuzzVideo sends your prompts and the photos, videos and files you upload to our third-party AI model providers (such as BytePlus). They use it only to generate your results — they don’t receive your account info or train their models on your content. You can change this anytime in Settings.
        </Text>
        <Pressable onPress={() => dispatch({ type: "showToast", text: "Opens Privacy Policy" })} accessibilityRole="link" hitSlop={10} style={({ pressed }) => [{ alignSelf: "center" }, pressed && { opacity: 0.6 }]}>
          <Text style={[gz.display.label, { color: c.sky }]}>Privacy Policy</Text>
        </Pressable>
        <View style={styles.buttons}>
          <GZButton label="Allow" onPress={() => dispatch({ type: "allowAiConsent" })} />
          <GZButton label="Not now" variant="dark" onPress={() => dispatch({ type: "dismissAiConsent" })} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: 80, paddingHorizontal: 24 },
  scrim: { backgroundColor: "rgba(0,0,0,0.6)" },
  card: { width: "100%", maxWidth: 340, backgroundColor: c.surface, borderRadius: 24, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, gap: 12 },
  badge: { alignSelf: "center", width: 52, height: 52, borderRadius: 16, backgroundColor: c.sky, borderWidth: gz.cut, borderColor: c.white, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }], marginBottom: 2 },
  msg: { color: c.text2, textAlign: "center" },
  buttons: { gap: 8, marginTop: 6 },
});
