import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStore } from "../provider";
import { colors, radius, smoothCorners, space } from "../theme";
import Coin from "./Coin";

/**
 * 模拟 iOS 系统评分框(SKStoreReviewController,spec §6.1)。这是系统 UI,不走品牌色;
 * 真实 APP 只调用系统接口,弹不弹、长什么样由系统决定(每人每年最多 3 次)
 */
export default function RatingPrompt() {
  const { state, dispatch } = useStore();
  const [stars, setStars] = useState(0);
  if (!state.ratingPromptOpen) return null;
  const done = () => {
    setStars(0);
    dispatch({ type: "dismissRating" });
  };
  const rate = (n: number) => {
    setStars(n);
    setTimeout(() => {
      dispatch({ type: "showToast", text: "Thanks for your feedback" });
      done();
    }, 450);
  };
  return (
    <View style={styles.overlay}>
      <View style={styles.alert} accessibilityViewIsModal accessibilityRole="alert">
        <View style={styles.icon}>
          <Coin size={26} />
        </View>
        <Text style={styles.title}>Enjoying BuzzVideo?</Text>
        <Text style={styles.message}>Tap a star to rate it on the App Store.</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => rate(n)} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`} hitSlop={6}>
              <Text style={[styles.star, n <= stars && styles.starOn]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={done} accessibilityRole="button" style={styles.notNow}>
          <Text style={styles.notNowText}>Not Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center" },
  alert: {
    width: 270,
    alignItems: "center",
    paddingTop: space.lg,
    backgroundColor: "rgba(36,36,40,0.97)",
    borderRadius: 28,
    ...smoothCorners,
    overflow: "hidden",
  },
  icon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", marginBottom: space.sm },
  title: { fontSize: 17, lineHeight: 22, fontWeight: "600", color: colors.white },
  message: { fontSize: 13, lineHeight: 18, color: colors.white, textAlign: "center", paddingHorizontal: space.lg, marginTop: 2 },
  stars: { flexDirection: "row", gap: space.sm, paddingVertical: space.md },
  star: { fontSize: 28, lineHeight: 32, color: "#48484a" },
  starOn: { color: colors.iosBlue },
  notNow: { alignSelf: "stretch", alignItems: "center", paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(84,84,88,0.65)" },
  notNowText: { fontSize: 17, lineHeight: 22, color: colors.iosBlue },
});
