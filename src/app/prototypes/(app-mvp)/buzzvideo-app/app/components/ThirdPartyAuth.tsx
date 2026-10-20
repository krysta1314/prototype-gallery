import { useEffect, useState } from "react";
import { useStill } from "../still";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useInsets, useStore } from "../provider";
import { APPLE_ACCOUNT, GOOGLE_ACCOUNTS } from "../store";
import { colors, radius, smoothCorners, type } from "../theme";
import AuthGlyph from "./AuthGlyph";
import FaceIdGlyph from "./FaceIdGlyph";
import Icon from "./Icon";
import SystemAlert, { SystemAlertMessage } from "./SystemAlert";

/**
 * Apple / Google 登录的系统界面(样式由 iOS 和 Google 决定，APP 改不了，原型按真机还原，不走品牌色):
 * Apple:底部系统面板 → Face ID → 回到 APP 已登录;Google:系统提示框 → Google 选账号网页 → 回到 APP 已登录。
 * 真实 APP:Apple 用 ASAuthorizationController,Google 用 Google Sign-In SDK(内部是 ASWebAuthenticationSession)
 */
export default function ThirdPartyAuth() {
  const { state } = useStore();
  const t = state.thirdPartyAuth;
  if (!t) return null;
  if (t.provider === "apple") return <AppleSheet verifying={t.step === "verifying"} />;
  return t.step === "alert" ? <GoogleAlert /> : <GoogleChooser />;
}

/* ---------------- Apple ---------------- */

const FACE_ID_MS = 900;
const FACE_ID_DONE_MS = 450;

function AppleSheet({ verifying }: { verifying: boolean }) {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const known = state.appleKnown;
  // 第一次登录:默认「隐藏我的邮箱」(和真机一致)
  const [hide, setHide] = useState(true);
  const [verified, setVerified] = useState(false);

  // Face ID:扫脸 → 打勾 → 面板收起、回到 APP(真机时长约 1 秒)
  // 旅程图截图里停在扫脸这一帧
  const still = useStill();
  useEffect(() => {
    if (!verifying || still) return;
    const t1 = setTimeout(() => setVerified(true), FACE_ID_MS);
    const t2 = setTimeout(() => dispatch({ type: "thirdPartyComplete" }), FACE_ID_MS + FACE_ID_DONE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [verifying, dispatch, still]);

  return (
    <View style={styles.overlay}>
      <View style={[styles.appleSheet, { marginBottom: Math.max(insets.bottom, 8) }]} accessibilityViewIsModal>
        <View style={styles.appleTop}>
          <Pressable onPress={() => dispatch({ type: "thirdPartyCancel" })} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.closeBtn} disabled={verifying}>
            <Icon name="x" size={17} color="rgba(235,235,245,0.75)" strokeWidth={2.4} />
          </Pressable>
          <AuthGlyph provider="apple" size={24} color={colors.white} />
          <View style={styles.topSpacer} />
        </View>

        <Text style={styles.appleTitle} accessibilityRole="header">
          {known ? "Sign in to BuzzVideo with your Apple Account?" : "Create an account for BuzzVideo using your Apple Account."}
        </Text>
        {known ? <Text style={styles.appleSub}>{APPLE_ACCOUNT.email}</Text> : null}

        {known ? null : (
          <View style={styles.group}>
            <View style={styles.groupRow}>
              <Text style={styles.groupLabel}>Name</Text>
              <Text style={styles.groupValue}>{APPLE_ACCOUNT.name}</Text>
            </View>
            <View style={styles.sep} />
            <EmailChoice label="Share My Email" detail={APPLE_ACCOUNT.email} on={!hide} onPress={() => setHide(false)} disabled={verifying} />
            <View style={styles.sep} />
            <EmailChoice label="Hide My Email" detail={`Forward To: ${APPLE_ACCOUNT.email}`} on={hide} onPress={() => setHide(true)} disabled={verifying} />
          </View>
        )}

        <Pressable
          onPress={() => dispatch({ type: "thirdPartyContinue" })}
          accessibilityRole="button"
          disabled={verifying}
          style={({ pressed }) => [styles.appleContinue, (pressed || verifying) && styles.dim]}
        >
          <Text style={styles.appleContinueText}>Continue</Text>
        </Pressable>
      </View>

      {verifying ? (
        <View style={styles.faceIdHud} accessibilityLabel={verified ? "Face ID verified" : "Face ID"} accessibilityLiveRegion="polite">
          {verified ? <Icon name="circle-check" size={64} color={colors.white} strokeWidth={1.6} /> : <FaceIdGlyph size={64} />}
          <Text style={styles.faceIdText}>Face ID</Text>
        </View>
      ) : null}
    </View>
  );
}

function EmailChoice({ label, detail, on, onPress, disabled }: { label: string; detail: string; on: boolean; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ checked: on }} style={styles.choice}>
      <View style={styles.choiceText}>
        <Text style={styles.choiceLabel}>{label}</Text>
        <Text style={styles.choiceDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View style={styles.checkSlot}>{on ? <Icon name="check" size={20} color={colors.iosBlue} strokeWidth={2.6} /> : null}</View>
    </Pressable>
  );
}

/* ---------------- Google ---------------- */

function GoogleAlert() {
  const { dispatch } = useStore();
  return (
    <SystemAlert
      title={"“BuzzVideo” Wants to Use “google.com” to Sign In"}
      buttons={[
        { label: "Cancel", onPress: () => dispatch({ type: "thirdPartyCancel" }) },
        { label: "Continue", onPress: () => dispatch({ type: "thirdPartyContinue" }), preferred: true },
      ]}
    >
      <SystemAlertMessage>This allows the app and website to share information about you.</SystemAlertMessage>
    </SystemAlert>
  );
}

const PICK_MS = 700;

function GoogleChooser() {
  const { dispatch } = useStore();
  const insets = useInsets();
  const [picked, setPicked] = useState<string | null>(null);

  // 选好账号:网页转一下圈,系统网页面板收起,回到 APP 已登录
  useEffect(() => {
    if (!picked) return;
    const t = setTimeout(() => dispatch({ type: "thirdPartyComplete" }), PICK_MS);
    return () => clearTimeout(t);
  }, [picked, dispatch]);

  return (
    <View style={styles.overlay}>
      <View style={[styles.webSheet, { marginTop: insets.top + 10 }]} accessibilityViewIsModal>
        {/* 系统网页面板的顶栏:Cancel + 域名,不是 APP 的导航栏 */}
        <View style={styles.webBar}>
          <Pressable onPress={() => dispatch({ type: "thirdPartyCancel" })} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.webCancel}>Cancel</Text>
          </Pressable>
          <View style={styles.webDomain}>
            <Icon name="lock" size={11} color="rgba(235,235,245,0.6)" strokeWidth={2.4} />
            <Text style={styles.webDomainText}>accounts.google.com</Text>
          </View>
          <Text style={styles.webAa}>aA</Text>
        </View>

        <View style={styles.gBody}>
          <View style={styles.gBrand}>
            <AuthGlyph provider="google" size={18} />
            <Text style={styles.gBrandText}>Sign in with Google</Text>
          </View>
          <Text style={styles.gTitle} accessibilityRole="header">
            Choose an account
          </Text>
          <Text style={styles.gSub}>
            to continue to <Text style={styles.gLink}>BuzzVideo</Text>
          </Text>

          <View style={styles.gList}>
            {GOOGLE_ACCOUNTS.map((acc) => (
              <Pressable key={acc.email} onPress={() => setPicked(acc.email)} disabled={!!picked} accessibilityRole="button" accessibilityLabel={`${acc.name}, ${acc.email}`} style={({ pressed }) => [styles.gRow, pressed && styles.gRowPressed]}>
                <View style={[styles.gAvatar, { backgroundColor: acc.color }]}>
                  <Text style={styles.gAvatarText}>{acc.name[0]}</Text>
                </View>
                <View style={styles.gRowText}>
                  <Text style={styles.gName}>{acc.name}</Text>
                  <Text style={styles.gEmail}>{acc.email}</Text>
                </View>
                {picked === acc.email ? <ActivityIndicator size="small" color="#8ab4f8" /> : null}
              </Pressable>
            ))}
            <View style={styles.gRow}>
              <View style={[styles.gAvatar, styles.gAvatarEmpty]}>
                <Icon name="user-round" size={18} color="rgba(235,235,245,0.75)" />
              </View>
              <Text style={styles.gName}>Use another account</Text>
            </View>
          </View>

          <Text style={styles.gLegal}>
            To continue, Google will share your name, email address, language preference, and profile picture with BuzzVideo.
          </Text>
        </View>
      </View>
    </View>
  );
}

const SHEET_BG = "rgba(30,30,32,0.98)";
const G_BG = "#202124";

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", zIndex: 20 },

  appleSheet: {
    marginHorizontal: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    gap: 18,
    borderRadius: 40,
    ...smoothCorners,
    backgroundColor: SHEET_BG,
    boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.12), 0 -10px 40px rgba(0,0,0,0.4)",
  },
  appleTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(120,120,128,0.24)", alignItems: "center", justifyContent: "center" },
  topSpacer: { width: 34, height: 34 },
  appleTitle: { ...type.title2, fontWeight: "700", color: colors.white, textAlign: "center", paddingHorizontal: 8 },
  appleSub: { ...type.subhead, color: "rgba(235,235,245,0.6)", textAlign: "center", marginTop: -10 },
  group: { borderRadius: 16, ...smoothCorners, backgroundColor: "rgba(118,118,128,0.18)", overflow: "hidden" },
  groupRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, minHeight: 48 },
  groupLabel: { ...type.body, color: colors.white },
  groupValue: { ...type.body, color: "rgba(235,235,245,0.6)" },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(84,84,88,0.65)", marginLeft: 16 },
  choice: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, minHeight: 56 },
  choiceText: { flex: 1, gap: 2 },
  choiceLabel: { ...type.body, color: colors.white },
  choiceDetail: { ...type.footnote, color: "rgba(235,235,245,0.6)" },
  checkSlot: { width: 24, alignItems: "flex-end" },
  appleContinue: { height: 52, borderRadius: radius.full, backgroundColor: colors.iosBlue, alignItems: "center", justifyContent: "center" },
  appleContinueText: { ...type.headline, color: colors.white },
  dim: { opacity: 0.6 },
  faceIdHud: {
    position: "absolute",
    alignSelf: "center",
    top: "38%",
    width: 150,
    height: 150,
    borderRadius: 34,
    ...smoothCorners,
    backgroundColor: "rgba(44,44,48,0.96)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  faceIdText: { ...type.subhead, color: colors.white },

  webSheet: { flex: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: G_BG, overflow: "hidden" },
  webBar: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, backgroundColor: "rgba(44,44,46,0.98)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(84,84,88,0.65)" },
  webCancel: { ...type.body, color: colors.iosBlue },
  webDomain: { flexDirection: "row", alignItems: "center", gap: 4 },
  webDomainText: { ...type.footnote, color: "rgba(235,235,245,0.85)" },
  webAa: { ...type.body, color: colors.iosBlue, width: 52, textAlign: "right" },
  gBody: { paddingHorizontal: 24, paddingTop: 28, gap: 6 },
  gBrand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  gBrandText: { ...type.subhead, color: "#e8eaed" },
  gTitle: { fontSize: 26, lineHeight: 32, fontWeight: "400", color: "#e8eaed" },
  gSub: { ...type.body, color: "#e8eaed" },
  gLink: { color: "#8ab4f8", fontWeight: "500" },
  gList: { marginTop: 22, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#5f6368" },
  gRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#5f6368" },
  gRowPressed: { backgroundColor: "rgba(232,234,237,0.06)" },
  gAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  gAvatarEmpty: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#5f6368" },
  gAvatarText: { ...type.subhead, fontWeight: "600", color: colors.white },
  gRowText: { flex: 1, gap: 1 },
  gName: { ...type.subhead, fontWeight: "500", color: "#e8eaed" },
  gEmail: { ...type.footnote, color: "#9aa0a6" },
  gLegal: { ...type.footnote, color: "#9aa0a6", marginTop: 22 },
});
