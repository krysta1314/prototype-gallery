import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import Sheet from "../components/Sheet";
import TabGlyph from "../components/TabGlyph";
import { pressScale } from "../components/motion";
import { MODES, type Mode } from "../data";
import { useNav, useStore } from "../provider";
import { isEnterprise, isSubscribed } from "../store";
import { colors, fill, radius, selectedBox, smoothCorners, space, type } from "../theme";

/** 右上角运营标签：Hot = 最多人用，New = 新上(真实 APP 由后台配置) */
const BADGE: Partial<Record<Mode, "Hot" | "New">> = { agent: "Hot", hybrid: "New" };

/**
 * 创作模式(2026-10-23 改成工具卡片，和「全部工具」面板同一套卡片):
 * 两列卡片，每张：圆形图标 + 名字 + 一句做出什么;所有模式一样大，一行两张(2026-10-23)。
 * 右上角 Hot / New;选中是品牌色淡底 + 同色细边(selectedBox)。
 * Free 用户在 Video 右上角带钻石标(和 Model Settings 里会员项同一个);点了不切模式，直接弹付费墙(2026-10-23)。
 * Hybrid Reel 只给 Enterprise:非 Enterprise 用户卡片标「Enterprise」,点了打开 Contact Sales,不切模式;Enterprise 用户照常标 New。
 * Hybrid Reel:选了只切模式，不自动弹「+」面板(2026-10-23),用户自己点 + 放实拍片段
 */
export default function ModeSheet({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const current = state.composer.mode;
  const { navigate } = useNav();
  const free = state.workspace === "personal" && !isSubscribed(state) && !isEnterprise(state);
  // Hybrid Reel 只给 Enterprise(2026-10-23):其他人卡片标 Enterprise,点了打开联系销售，不切模式
  const enterpriseOnly = (m: Mode) => m === "hybrid" && !isEnterprise(state);
  const pick = (m: Mode) => {
    // Free 点带钻石的 Video:不切模式，直接弹付费墙(2026-10-23)
    if (free && m === "video") {
      onClose();
      dispatch({ type: "openPaywall", trigger: "video_locked" });
      return;
    }
    if (enterpriseOnly(m)) {
      navigate({ type: "sheet", sheet: { name: "contactSales" } });
      return;
    }
    // 只改模式：默认模型由 store 按套餐选(没锁的第一个)
    dispatch({ type: "setComposer", patch: { mode: m } });
    onClose();
  };

  return (
    <Sheet title="Creation mode" onClose={onClose}>
      <View style={styles.grid}>
        {MODES.map((m) => {
          const on = current === m.id;
          const wide = false;
          const badge = enterpriseOnly(m.id) ? "Enterprise" : BADGE[m.id];
          const members = free && m.id === "video";
          return (
            <Pressable
              key={m.id}
              onPress={() => pick(m.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [styles.card, wide ? styles.cardWide : styles.cardHalf, on && selectedBox, pressed && !on && styles.cardPressed, pressScale(pressed)]}
            >
              <View style={styles.icon}>
                {m.id === "agent" ? <TabGlyph name="create" size={19} color={colors.white} filled={false} outline /> : <Icon name={m.icon} size={18} color={colors.white} strokeWidth={1.8} />}
              </View>
              <View style={wide ? styles.flex : undefined}>
                <Text style={styles.name} numberOfLines={1}>
                  {m.label}
                </Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {m.outcome}
                </Text>
              </View>
              {badge || members ? (
                <View style={styles.corner}>
                  {members ? (
                    <View style={styles.gem} accessibilityLabel="Paid plans only">
                      <Icon name="gem" size={12} color={colors.ctaA} strokeWidth={2.2} />
                    </View>
                  ) : null}
                  {badge ? (
                    <View style={[styles.badge, badge === "Hot" && styles.badgeHot, badge === "Enterprise" && styles.badgeEnt]}>
                      <Text style={[styles.badgeText, badge === "Hot" && styles.badgeTextHot, badge === "Enterprise" && styles.badgeTextEnt]}>{badge}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

/** New 标签的玫红 */
const NEW_PINK = "#ff2d78";

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, paddingTop: space.xs },
  card: { padding: space.md, borderRadius: radius.lg, backgroundColor: colors.grouped, borderWidth: 1, borderColor: "transparent", ...smoothCorners },
  cardWide: { width: "100%", flexDirection: "row", alignItems: "center", gap: space.md },
  cardHalf: { width: "48.6%", gap: space.sm } as object,
  cardPressed: { backgroundColor: colors.raised },
  icon: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: fill.strong },
  name: { ...type.subhead, fontWeight: "600", color: colors.ink },
  desc: { ...type.footnote, color: colors.sub, marginTop: 2, minHeight: 36 },
  // 右上角运营标签:New 玫红底白字(2026-10-23),Hot 品牌橙底白字
  corner: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  // 会员标：和 Model Settings 里会员选项的钻石标一致
  gem: { width: 20, height: 20, borderRadius: radius.full, backgroundColor: "rgba(255,167,60,0.16)", alignItems: "center", justifyContent: "center" },
  badge: { height: 18, paddingHorizontal: 7, borderRadius: radius.full, backgroundColor: NEW_PINK, justifyContent: "center" },
  badgeHot: { backgroundColor: colors.accent },
  badgeText: { ...type.caption, fontWeight: "800", color: colors.white },
  badgeTextHot: { color: colors.white },
  // Enterprise 专享:白底黑字，和运营标签(Hot / New)区分开
  badgeEnt: { backgroundColor: colors.inverse },
  badgeTextEnt: { color: colors.onInverse },
});
