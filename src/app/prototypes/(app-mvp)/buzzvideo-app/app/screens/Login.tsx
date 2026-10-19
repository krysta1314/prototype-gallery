import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AuthGlyph from "../components/AuthGlyph";
import Icon from "../components/Icon";
import { pressScale } from "../components/motion";
import { A, FREE_CREDITS } from "../data";
import { useInsets, useNav, useStore } from "../provider";
import { colors, radius, space, type } from "../theme";

/**
 * 登录(2026-10-19 改):纯黑底，品牌 logo + 标题 + 注册福利 + 三个登录按钮整组在屏幕正中;
 * 三个全圆角白色胶囊(图标靠左、文字居中);最底部一行说明「By continuing, you agree to…」(海外常见做法，不做勾选框)。
 * 前一屏引导页已经放过广告片，这屏不再放视频，只留 logo,让注意力落在登录按钮上
 */
export default function Login() {
  const { dispatch } = useStore();
  const { navigate } = useNav();
  const insets = useInsets();
  // 先走系统的登录流程(Apple 面板 / Google 提示框),完成后由 store 登录
  const thirdParty = (provider: "apple" | "google") => {
    navigate({ type: "reset" });
    dispatch({ type: "startThirdPartyLogin", provider });
  };
  const legal = (doc: string) =>
    dispatch({ type: "showToast", text: `Opens ${doc}` });

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom + space.md },
      ]}
    >
      <View style={styles.center}>
        <View style={styles.copy}>
          <Image
            source={{ uri: `${A}/app-logo.svg` }}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="BuzzVideo AI"
          />
          <Text style={styles.title} accessibilityRole="header">
            Create your first ad
          </Text>
          <Text
            style={styles.subtitle}
          >{`Sign up and get ${FREE_CREDITS} free credits`}</Text>
        </View>

        <View style={styles.actions}>
          <LoginButton
            leading={<AuthGlyph provider="apple" />}
            label="Continue with Apple"
            onPress={() => thirdParty("apple")}
          />
          <LoginButton
            leading={<AuthGlyph provider="google" size={18} />}
            label="Continue with Google"
            onPress={() => thirdParty("google")}
          />
          <LoginButton
            leading={<Icon name="mail" size={18} color={colors.black} />}
            label="Continue with email"
            onPress={() => dispatch({ type: "startEmailLogin" })}
          />
        </View>
      </View>

      <Text style={styles.legal}>
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

/** 全圆角浅色胶囊:图标固定在左侧,文字在整条按钮里居中 */
function LoginButton({
  leading,
  label,
  onPress,
}: {
  leading: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressScale(pressed)]}
    >
      <View style={styles.buttonIcon}>{leading}</View>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black, paddingHorizontal: space.xl },
  center: { flex: 1, justifyContent: "center", gap: space.xxl },
  copy: { gap: space.sm, alignItems: "center" },
  logo: { width: 88, height: 88, marginBottom: space.lg },
  title: { ...type.title1, color: colors.white, textAlign: "center" },
  subtitle: {
    ...type.subhead,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  actions: { gap: space.md },
  button: {
    height: 56,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    position: "absolute",
    left: space.xl,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  buttonText: { ...type.headline, fontWeight: "500", color: colors.black },
  legal: {
    ...type.footnote,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  link: { color: colors.white, fontWeight: "600" },
});
