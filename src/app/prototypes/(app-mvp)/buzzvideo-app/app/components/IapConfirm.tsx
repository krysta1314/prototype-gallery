import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { A } from "../data";
import { useInsets } from "../provider";
import { useStill } from "../still";
import { colors } from "../theme";
import Icon from "./Icon";

/** 原型里的 Apple 账户(真实 APP 由系统显示当前登录的 Apple 账户) */
const APPLE_ACCOUNT = "alex@example.com";
/** 订阅类商品的系统固定说明(iOS 英文原文) */
/** 系统面板里的价格总是带两位小数(StoreKit displayPrice):$168/year → $168.00/year */
const withCents = (s: string) => s.replace(/\$([\d,]+)(?![\d.,])/g, "$$$1.00");
const RENEW_TERMS = "Cancel anytime in Settings > Apple Account at least one day before each renewal date. Plan automatically renews until cancelled.";

/**
 * App Store 应用内购买确认面板(2026-10-20 按 iOS 真机还原，替换原来的简易弹窗):
 * 底部浮起的深色面板 —— 左上 ✕、标题「 In-App Purchase」;商品图(带档位条)+ 商品名 + APP 名与年龄分级 + 类型;
 * 价格卡片(价格 / 续费说明 / Apple 账户);底部「Confirm with Side Button」。
 * 原型里点底部那一行 = 双击侧边按钮确认，显示「Done」后关闭。样式由系统决定，不走品牌色
 */
export default function IapConfirm({
  product,
  badge,
  price,
  terms,
  kind = "subscription",
  onCancel,
  onConfirm,
}: {
  /** 商品名，如「BuzzVideo Starter (Yearly)」 */
  product: string;
  /** 商品图下方的档位条，如「STARTER 1Y」 */
  badge: string;
  /** 价格行，如「$168.00/year」 */
  price: string;
  /** 价格下方的说明;订阅默认是系统的自动续费说明 */
  terms?: string;
  /** subscription = 订阅;purchase = 一次性购买(积分包) */
  kind?: "subscription" | "purchase";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const insets = useInsets();
  const still = useStill();
  const [done, setDone] = useState(false);
  // 「Done」停一下再关(真机：侧边按钮确认 → Face ID → Done)
  useEffect(() => {
    if (!done || still) return;
    const t = setTimeout(onConfirm, 700);
    return () => clearTimeout(t);
  }, [done, still, onConfirm]);
  const note = terms ?? (kind === "subscription" ? RENEW_TERMS : undefined);

  return (
    <View style={styles.overlay}>
      <View style={[styles.sheet, { marginBottom: Math.max(8, insets.bottom - 26) }]} accessibilityViewIsModal>
        <View style={styles.header}>
          <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel" style={styles.close}>
            <Icon name="x" size={20} color={colors.white} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.headerTitle}>
            <Text style={styles.apple}>{""}</Text> In-App Purchase
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.product}>
          <View style={styles.art}>
            <View style={styles.icon}>
              <Image source={{ uri: `${A}/app-logo.svg` }} style={{ width: 44, height: 44 }} resizeMode="contain" />
            </View>
            <Text style={styles.badge}>{badge}</Text>
          </View>
          <Text style={styles.productName}>{product}</Text>
          <View style={styles.appRow}>
            <Text style={styles.appName}>BuzzVideo AI</Text>
            <Text style={styles.rating}>4+</Text>
          </View>
          <Text style={styles.appName}>{kind === "subscription" ? "Subscription" : "In-App Purchase"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.price}>{withCents(price)}</Text>
          {note ? (
            <>
              <View style={styles.cardDivider} />
              <Text style={styles.terms}>{note}</Text>
            </>
          ) : null}
          <View style={styles.cardDivider} />
          <Text style={styles.account}>{`Account: ${APPLE_ACCOUNT}`}</Text>
        </View>

        <View style={styles.divider} />
        <Pressable onPress={() => setDone(true)} accessibilityRole="button" accessibilityLabel="Confirm with Side Button" style={styles.confirm}>
          {done ? (
            <>
              <Icon name="check" size={22} color={colors.iosBlue} strokeWidth={2.6} />
              <Text style={styles.confirmText}>Done</Text>
            </>
          ) : (
            <>
              {/* 侧边按钮图示：手机侧边 + 指向按钮的箭头 */}
              <View style={styles.sideIcon}>
                <View style={styles.sideButton} />
                <Icon name="chevron-left" size={12} color={colors.iosBlue} strokeWidth={2.6} />
              </View>
              <Text style={styles.confirmText}>Confirm with Side Button</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", zIndex: 40 },
  sheet: { marginHorizontal: 8, borderRadius: 42, backgroundColor: "#2a2a2c", overflow: "hidden" },
  header: { height: 64, alignItems: "center", justifyContent: "center" },
  close: {
    position: "absolute",
    left: 16,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(118,118,128,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 19, fontWeight: "600", color: colors.white, letterSpacing: -0.3 },
  apple: { fontSize: 19, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.12)" },
  product: { alignItems: "center", paddingTop: 18, paddingHorizontal: 20, gap: 3 },
  art: { width: 76, height: 76, borderRadius: 8, overflow: "hidden", backgroundColor: colors.appIconBg, marginBottom: 10 },
  icon: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { backgroundColor: "#000", color: colors.white, fontSize: 8, fontWeight: "700", textAlign: "center", paddingVertical: 2, letterSpacing: 0.3 },
  productName: { fontSize: 19, fontWeight: "600", color: colors.white, textAlign: "center", letterSpacing: -0.3 },
  appRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  appName: { fontSize: 15, color: "rgba(235,235,245,0.6)", textAlign: "center" },
  rating: {
    fontSize: 11,
    color: "rgba(235,235,245,0.6)",
    borderWidth: 1,
    borderColor: "rgba(235,235,245,0.4)",
    borderRadius: 4,
    paddingHorizontal: 4,
    lineHeight: 14,
  },
  card: { margin: 16, marginTop: 18, borderRadius: 22, backgroundColor: "rgba(118,118,128,0.2)", paddingHorizontal: 16, paddingVertical: 14 },
  price: { fontSize: 17, fontWeight: "700", color: colors.white },
  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.14)", marginVertical: 12 },
  terms: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: colors.white },
  account: { fontSize: 13, color: "rgba(235,235,245,0.6)" },
  confirm: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  sideIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.iosBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  sideButton: { width: 2.5, height: 9, borderRadius: 1.5, backgroundColor: colors.iosBlue },
  confirmText: { fontSize: 17, color: colors.iosBlue },
});
