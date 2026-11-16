import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AuthGlyph from "../../../buzzvideo-app/app/components/AuthGlyph";
import { A, FREE_CREDITS } from "../../../buzzvideo-app/app/data";
import { GZSticker, gz } from "../../kit/gz";
import { Icon, useInsets, useNav, useStore } from "../v1";

const c = gz.color;

/**
 * 贴纸风登录页(逻辑同第一版 screens/Login):纯黑底，品牌 logo(原图不改)+ 粗展示字标题 + 注册福利;
 * 「500 free credits」做成一颗黄油色积分贴纸。三个白色粗胶囊(图标靠左、展示字体居中),
 * 都是第三方 / 系统登录入口，所以这页不放橙色主操作。底部一行「By continuing, you agree to…」
 */
export default function LoginS() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  // 先走系统的登录流程(Apple 面板 / Google 提示框),完成后由 store 登录
  const thirdParty = (provider: "apple" | "google") => {
    navigate({ type: "reset" });
    dispatch({ type: "startThirdPartyLogin", provider });
  };
  const legal = (doc: string) => dispatch({ type: "showToast", text: `Opens ${doc}` });

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.center}>
        <View style={styles.copy}>
          <Image source={{ uri: `${A}/app-logo.svg` }} style={styles.logo} resizeMode="contain" accessibilityLabel="BuzzVideo AI" />
          <Text style={[gz.display.hero, styles.title]} accessibilityRole="header">
            Make your first video
          </Text>
          <View style={styles.perk} accessibilityLabel={`Sign up and get ${FREE_CREDITS} free credits`}>
            <Text style={[gz.body.body, { color: c.text2, fontSize: 16 }]}>Sign up and get</Text>
            <GZSticker label={`${FREE_CREDITS} free credits`} color="butter" rotate={-3} slap />
          </View>
        </View>

        <View style={styles.actions}>
          <LoginButton leading={<AuthGlyph provider="apple" />} label="Continue with Apple" onPress={() => thirdParty("apple")} />
          <LoginButton leading={<AuthGlyph provider="google" size={18} />} label="Continue with Google" onPress={() => thirdParty("google")} />
          <LoginButton leading={<Icon name="mail" size={20} color={c.ink} strokeWidth={2.4} />} label="Continue with email" onPress={() => dispatch({ type: "startEmailLogin" })} />
        </View>
      </View>

      <Text style={[gz.body.caption, styles.legal]}>
        By continuing, you agree to our{" "}
        <Text style={styles.link} onPress={() => legal("Terms of Service")}>
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text style={styles.link} onPress={() => legal("Privacy Policy")}>
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

/** 白色粗胶囊(组件库 GZButton white 的样子):图标固定在左侧，展示字体在整条按钮里居中 */
function LoginButton({ leading, label, onPress }: { leading: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.96 }] }]}>
      <View style={styles.buttonIcon}>{leading}</View>
      <Text style={[gz.display.head, { color: c.ink, fontSize: 17 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.black, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: "center", gap: 40 },
  copy: { alignItems: "center", gap: 14 },
  logo: { width: 88, height: 88, marginBottom: 10 },
  title: { color: c.white, textAlign: "center", fontSize: 38, lineHeight: 40 },
  perk: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  actions: { gap: 12 },
  button: { height: 56, borderRadius: 999, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
  buttonIcon: { position: "absolute", left: 24, top: 0, bottom: 0, justifyContent: "center" },
  legal: { color: c.text3, textAlign: "center" },
  link: { color: c.white, fontWeight: "600" },
});
