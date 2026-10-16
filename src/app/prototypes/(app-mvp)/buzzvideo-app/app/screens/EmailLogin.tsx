import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Icon from "../components/Icon";
import IconButton from "../components/IconButton";
import NavBar from "../components/NavBar";
import PrimaryButton from "../components/PrimaryButton";
import { prefersReducedMotion } from "../components/motion";
import { useNow } from "../components/useNow";
import { useInsets, useStore } from "../provider";
import {
  EMAIL_CODE_MAX_ATTEMPTS,
  EMAIL_RESEND_MS,
  isValidEmail,
} from "../store";
import { colors, radius, smoothCorners, space, type } from "../theme";

/**
 * 邮箱验证码登录(和网页同一流程,2026-10-16):登录页点 Continue with email 进来。
 * 第一步输入邮箱 → Continue(格式不对时置灰);第二步输入 6 位验证码,输满自动提交;
 * 60 秒后可重发;输错 / 过期 / 输错太多次都有提示。验证通过和 Apple / Google 登录走同一条路
 */
export default function EmailLogin() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const auth = state.emailAuth;
  if (!auth) return null;
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + space.lg }]}>
      <NavBar
        left={
          <IconButton
            icon="chevron-left"
            onPress={() => dispatch({ type: "emailBack" })}
            accessibilityLabel="Back"
          />
        }
      />
      {auth.step === "email" ? (
        <EmailStep initial={auth.email} />
      ) : (
        <CodeStep />
      )}
    </View>
  );
}

function EmailStep({ initial }: { initial: string }) {
  const { dispatch } = useStore();
  const [email, setEmail] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(true);
  const valid = isValidEmail(email);
  const showError = touched && email.length > 0 && !valid;
  const submit = () => {
    if (valid) dispatch({ type: "submitEmail", email, now: Date.now() });
    else setTouched(true);
  };
  return (
    // CTA 固定在底部(APP 惯例);真机键盘弹起时随 KeyboardAvoidingView 停在键盘上方
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          Continue with email
        </Text>
        <Text style={styles.lead}>
          We&apos;ll email you a 6-digit code to sign in.
        </Text>
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
            placeholderTextColor={colors.sub}
            accessibilityLabel="Email address"
            style={[
              styles.input,
              focused && styles.inputFocused,
              showError && styles.inputError,
            ]}
          />
          {showError ? (
            <Text style={styles.error}>Enter a valid email address.</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Continue" onPress={submit} disabled={!valid} />
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

  const locked = auth.error === "locked";
  const expired = auth.error === "expired";
  const left = Math.max(
    0,
    Math.ceil((auth.sentAt + EMAIL_RESEND_MS - now) / 1000),
  );
  const canResend = left === 0 || locked || expired;

  // 输错时格子抖一下(系统开了「减少动态效果」就不抖)
  useEffect(() => {
    if (auth.error !== "wrong" || prefersReducedMotion()) return;
    shake.setValue(0);
    Animated.timing(shake, {
      toValue: 1,
      duration: 360,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [auth.attempts, auth.error, shake]);
  const translateX = shake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -8, 7, -5, 3, 0],
  });

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LEN);
    setCode(digits);
    // 输满 6 位自动提交,不用再点按钮;校验期间锁住输入
    if (digits.length === CODE_LEN && !locked) {
      setVerifying(true);
      setTimeout(() => {
        dispatch({ type: "verifyEmailCode", code: digits });
        setVerifying(false);
        setCode("");
      }, 500);
    }
  };

  const message =
    auth.error === "wrong"
      ? `That code isn't right. ${EMAIL_CODE_MAX_ATTEMPTS - auth.attempts} ${EMAIL_CODE_MAX_ATTEMPTS - auth.attempts === 1 ? "try" : "tries"} left.`
      : expired
        ? "This code has expired. Send a new one below."
        : locked
          ? "Too many tries. Send a new code to try again."
          : null;
  const active = Math.min(code.length, CODE_LEN - 1);

  return (
    <View style={styles.body}>
      <View style={styles.mailIcon}>
        <Icon name="mail" size={26} color={colors.accent} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Check your email
      </Text>
      <Text style={styles.lead}>
        We sent a 6-digit code to <Text style={styles.email}>{auth.email}</Text>
        .{" "}
        <Text
          style={styles.change}
          accessibilityRole="link"
          onPress={() => dispatch({ type: "emailBack" })}
        >
          Change
        </Text>
      </Text>

      {/* 6 个格子:底下是一个真正的输入框(接收键盘、粘贴、iOS 从邮件自动填充),格子只负责显示 */}
      <Pressable
        onPress={() => input.current?.focus()}
        accessibilityRole="none"
        disabled={locked}
      >
        <Animated.View style={[styles.boxes, { transform: [{ translateX }] }]}>
          {Array.from({ length: CODE_LEN }, (_, i) => {
            const isActive = focused && !verifying && !locked && i === active;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  isActive && styles.boxActive,
                  (auth.error === "wrong" || locked) &&
                    code.length === 0 &&
                    styles.boxError,
                  locked && styles.boxLocked,
                ]}
              >
                <Text style={styles.digit}>{code[i] ?? ""}</Text>
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
          editable={!verifying && !locked}
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
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <View style={styles.resendRow}>
        {verifying ? (
          <Text style={styles.muted}>Verifying…</Text>
        ) : canResend ? (
          <Pressable
            onPress={() =>
              dispatch({ type: "resendEmailCode", now: Date.now() })
            }
            accessibilityRole="button"
            hitSlop={13}
          >
            <Text style={styles.resend}>Resend code</Text>
          </Pressable>
        ) : (
          <Text
            style={[styles.muted, styles.tabular]}
          >{`Resend in ${left}s`}</Text>
        )}
      </View>
      <Text style={styles.hint}>
        Didn&apos;t get it? Check your spam folder.
      </Text>
    </View>
  );
}

const BOX_H = 56;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  body: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.lg },
  footer: {
    marginTop: "auto",
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  title: { ...type.title1, color: colors.ink },
  lead: { ...type.body, color: colors.sub, marginTop: -space.sm },
  email: { color: colors.ink, fontWeight: "600" },
  change: {
    color: colors.ink,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  field: { gap: space.sm },
  input: {
    ...type.body,
    height: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.separator,
    color: colors.ink,
  },
  inputFocused: { borderColor: colors.accent },
  inputError: { borderColor: colors.danger },
  error: { ...type.footnote, color: colors.danger },
  mailIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,94,26,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.lg,
  },
  boxes: { flexDirection: "row", gap: space.sm },
  box: {
    flex: 1,
    height: BOX_H,
    borderRadius: radius.md,
    ...smoothCorners,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.separator,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: colors.accent },
  boxError: { borderColor: colors.danger },
  boxLocked: { opacity: 0.5 },
  digit: { ...type.title2, color: colors.ink, fontVariant: ["tabular-nums"] },
  // 透明地盖在格子上:点哪都能聚焦,系统自动填充也落在它身上
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BOX_H,
    opacity: 0,
    color: "transparent",
  },
  resendRow: { alignItems: "center", minHeight: 22, marginTop: space.sm },
  muted: { ...type.subhead, color: colors.sub },
  tabular: { fontVariant: ["tabular-nums"] },
  resend: { ...type.subhead, fontWeight: "600", color: colors.ink },
  hint: {
    ...type.footnote,
    color: colors.sub,
    textAlign: "center",
    marginTop: -space.sm,
  },
});
