import { useEffect, useRef, useState } from "react";
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import { useNow } from "../../../buzzvideo-app/app/components/useNow";
import { EMAIL_RESEND_MS, isValidEmail } from "../../../buzzvideo-app/app/store";
import { GZButton, gz } from "../../kit/gz";
import { Header } from "../ui";
import { Icon, prefersReducedMotion, useInsets, useStore } from "../v1";
import { DANGER } from "./parts-auth";

const c = gz.color;
const noOutline = { outlineStyle: "none" } as unknown as TextStyle;

/**
 * 贴纸风邮箱验证码登录(逻辑同第一版 screens/EmailLogin):
 * 第一步输入邮箱 → Continue(格式不对时置灰);第二步输入 6 位验证码，输满自动提交;
 * 60 秒后可重发;输错(不限次数)/ 过期都有提示。视觉：深灰输入框聚焦白边、出错红边;唯一主操作是橙色 Continue
 */
export default function EmailLoginS() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const auth = state.emailAuth;
  if (!auth) return null;
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 16 }]}>
      <Header onBack={() => dispatch({ type: "emailBack" })} />
      {auth.step === "email" ? <EmailStep initial={auth.email} /> : <CodeStep />}
    </View>
  );
}

function EmailStep({ initial }: { initial: string }) {
  const { dispatch } = useStore();
  const [email, setEmail] = useState(initial);
  // 带着格式不对的草稿回到这页(评审演示「格式不对」):直接显示红框
  const [touched, setTouched] = useState(() => initial.length > 0 && !isValidEmail(initial));
  const [focused, setFocused] = useState(true);
  const valid = isValidEmail(email);
  const showError = touched && email.length > 0 && !valid;
  const submit = () => {
    if (valid) dispatch({ type: "submitEmail", email, now: Date.now() });
    else setTouched(true);
  };
  return (
    // CTA 固定在底部(APP 惯例);真机键盘弹起时随 KeyboardAvoidingView 停在键盘上方
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.body}>
        <Text style={[gz.display.hero, { color: c.white }]} accessibilityRole="header">
          Continue with email
        </Text>
        <Text style={[gz.body.body, styles.lead]}>We&apos;ll email you a 6-digit code to sign in.</Text>
        <View style={styles.field}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setTouched(true);
            }}
            onSubmitEditing={submit}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="go"
            placeholder="Enter your email address"
            placeholderTextColor={c.text3}
            accessibilityLabel="Email address"
            style={[gz.body.body, styles.input, noOutline, focused && styles.inputFocused, showError && styles.inputError]}
          />
          {showError ? <Text style={[gz.body.caption, styles.error]}>Enter a valid email address.</Text> : null}
        </View>
      </View>
      <View style={styles.footer}>
        <GZButton label="Continue" onPress={submit} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}

const CODE_LEN = 6;

function CodeStep() {
  const { state, dispatch } = useStore();
  const auth = state.emailAuth!;
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [focused, setFocused] = useState(true);
  const input = useRef<{ focus: () => void } | null>(null);
  const [shake] = useState(() => new Animated.Value(0));
  const now = useNow(1000);

  const expired = auth.error === "expired";
  const left = Math.max(0, Math.ceil((auth.sentAt + EMAIL_RESEND_MS - now) / 1000));
  const canResend = left === 0 || expired;

  // 输错时格子抖一下(系统开了「减少动态效果」就不抖)
  useEffect(() => {
    if (auth.error !== "wrong" || prefersReducedMotion()) return;
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 360, easing: Easing.linear, useNativeDriver: false }).start();
  }, [auth.attempts, auth.error, shake]);
  const translateX = shake.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -8, 7, -5, 3, 0] });

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LEN);
    setCode(digits);
    // 输满 6 位自动提交，不用再点按钮;校验期间锁住输入
    if (digits.length === CODE_LEN) {
      setVerifying(true);
      setTimeout(() => {
        dispatch({ type: "verifyEmailCode", code: digits });
        setVerifying(false);
        setCode("");
      }, 500);
    }
  };

  const message = auth.error === "wrong" ? "Invalid code. Please try again." : expired ? "This code has expired. Send a new one below." : null;
  const active = Math.min(code.length, CODE_LEN - 1);

  return (
    <View style={styles.body}>
      {/* 信封贴纸：天蓝 = 信息 */}
      <View style={styles.mailSticker}>
        <Icon name="mail" size={26} color={c.ink} strokeWidth={2.4} />
      </View>
      <Text style={[gz.display.hero, { color: c.white }]} accessibilityRole="header">
        Check your email
      </Text>
      <Text style={[gz.body.body, styles.lead]}>
        We sent a 6-digit code to <Text style={styles.email}>{auth.email}</Text>.{" "}
        <Text style={styles.change} accessibilityRole="link" onPress={() => dispatch({ type: "emailBack" })}>
          Change
        </Text>
      </Text>

      {/* 6 个格子：底下是一个真正的输入框(接收键盘、粘贴、iOS 从邮件自动填充),格子只负责显示 */}
      <Pressable onPress={() => input.current?.focus()} accessibilityRole="none">
        <Animated.View style={[styles.boxes, { transform: [{ translateX }] }]}>
          {Array.from({ length: CODE_LEN }, (_, i) => {
            const isActive = focused && !verifying && i === active;
            const filled = !!code[i];
            return (
              <View key={i} style={[styles.box, filled && styles.boxFilled, isActive && styles.boxActive, auth.error === "wrong" && code.length === 0 && styles.boxError]}>
                <Text style={[gz.display.title, { color: c.white, fontVariant: ["tabular-nums"] }]}>{code[i] ?? ""}</Text>
              </View>
            );
          })}
        </Animated.View>
        <TextInput
          ref={input as never}
          value={code}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          editable={!verifying}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CODE_LEN}
          caretHidden
          accessibilityLabel="Verification code"
          style={styles.hiddenInput}
        />
      </Pressable>

      {message ? (
        <Text style={[gz.body.caption, styles.error]} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <View style={styles.resendRow}>
        {verifying ? (
          <Text style={[gz.display.label, { color: c.text2 }]}>Verifying…</Text>
        ) : canResend ? (
          <Pressable onPress={() => dispatch({ type: "resendEmailCode", now: Date.now() })} accessibilityRole="button" hitSlop={13} style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Text style={[gz.display.label, { color: c.sky }]}>Resend code</Text>
          </Pressable>
        ) : (
          <Text style={[gz.display.label, { color: c.text3, fontVariant: ["tabular-nums"] }]}>{`Resend in ${left}s`}</Text>
        )}
      </View>
      <Text style={[gz.body.caption, styles.hint]}>Didn&apos;t get it? Check your spam folder.</Text>
    </View>
  );
}

const BOX_H = 58;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.page },
  fill: { flex: 1 },
  body: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  footer: { marginTop: "auto", paddingHorizontal: 24, paddingTop: 12 },
  lead: { color: c.text2, marginTop: -6 },
  email: { color: c.white, fontWeight: "600" },
  change: { color: c.sky, fontWeight: "600" },
  field: { gap: 8, marginTop: 8 },
  input: { height: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.raised, borderWidth: 2, borderColor: "transparent", color: c.white },
  inputFocused: { borderColor: c.white },
  inputError: { borderColor: DANGER },
  error: { color: DANGER, fontWeight: "600" },
  mailSticker: { width: 58, height: 58, borderRadius: 16, backgroundColor: c.sky, borderWidth: gz.cut, borderColor: c.white, alignItems: "center", justifyContent: "center", marginTop: 12, transform: [{ rotate: "-6deg" }] },
  boxes: { flexDirection: "row", gap: 8, marginTop: 8 },
  box: { flex: 1, height: BOX_H, borderRadius: 14, backgroundColor: c.raised, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  boxFilled: { borderColor: "rgba(255,255,255,0.28)" },
  boxActive: { borderColor: c.white },
  boxError: { borderColor: DANGER },
  // 透明地盖在格子上：点哪都能聚焦，系统自动填充也落在它身上
  hiddenInput: { position: "absolute", top: 8, left: 0, right: 0, height: BOX_H, opacity: 0, color: "transparent" },
  resendRow: { alignItems: "center", minHeight: 22, marginTop: 8 },
  hint: { color: c.text3, textAlign: "center", marginTop: -6 },
});
