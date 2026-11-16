/* 贴纸风新原型 · 屏幕间共用的小积木(组件库 kit/gz.tsx 之外的)。
 * 规则同组件库：不用渐变 / 光晕 / 回弹;贴纸色各管一件事;贴纸上黑字;大字用展示字体，正文系统字，最小 12。 */

import { type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GZButton, gz, type GZColor } from "../kit/gz";
import { Gradient, Icon, type IconName } from "./v1";

const c = gz.color;

/** 压在视频上的黑色遮罩(只为让白字看得清，不是品牌渐变) */
export function Scrim({ edge, height, strength = 0.6 }: { edge: "top" | "bottom"; height: number; strength?: number }) {
  return <Gradient colors={edge === "top" ? [`rgba(0,0,0,${strength})`, "rgba(0,0,0,0)"] : ["rgba(0,0,0,0)", `rgba(0,0,0,${strength})`]} style={{ position: "absolute", left: 0, right: 0, [edge]: 0, height }} pointerEvents="none" />;
}

/** 列表分组小标题(展示字体，灰) */
export function SectionLabel({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[gz.display.label, { color: c.text3, marginHorizontal: 16, marginTop: 22, marginBottom: 6 }, style]}>{children}</Text>;
}

/** 发丝分隔线 */
export const Hairline = ({ inset = 16 }: { inset?: number }) => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginLeft: inset }} />;

/** 列表行左侧的圆形图标底(颜色 = 这一行的意思) */
export function RowIcon({ icon, color }: { icon: IconName; color?: GZColor }) {
  const bg = color ? (color === "white" ? c.white : color === "ink" ? c.ink : c[color]) : c.raised;
  return (
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={19} color={color ? c.ink : c.white} strokeWidth={2.4} />
    </View>
  );
}

/** 小圆角标签(网格、封面角上)。实色黑字，不歪(歪的是贴纸) */
export function Tag({ label, color = "white" }: { label: string; color?: GZColor }) {
  const bg = color === "white" ? c.white : color === "ink" ? c.ink : c[color];
  return (
    <View style={{ alignSelf: "flex-start", height: 22, paddingHorizontal: 7, borderRadius: 6, backgroundColor: bg, justifyContent: "center" }}>
      <Text style={[gz.display.tiny, { color: color === "ink" ? c.white : c.ink }]}>{label}</Text>
    </View>
  );
}

/** 分享面板一项:56 圆 + 展示字体小字;bonus = 黄油色积分贴纸 */
export function ShareItem({ label, children, bonus, onPress }: { label: string; children: ReactNode; bonus?: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [{ width: 64, alignItems: "center", gap: 6 }, pressed && { transform: [{ scale: 0.95 }] }]}>
      <View>
        {children}
        {bonus ? <BonusSticker n={bonus} /> : null}
      </View>
      <Text style={[gz.display.tiny, { color: c.text2, textAlign: "center" }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}
export function ShareCircle({ icon, color }: { icon: IconName; color?: GZColor }) {
  const bg = color ? (color === "white" ? c.white : color === "ink" ? c.ink : c[color]) : c.raised;
  return (
    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={22} color={color ? c.ink : c.white} strokeWidth={2.4} />
    </View>
  );
}

/** 角上的「+30」积分小贴纸(黄油色 = 积分) */
export function BonusSticker({ n, style }: { n: number; style?: object }) {
  return (
    <View style={[{ position: "absolute", top: -6, right: -10, height: 22, paddingHorizontal: 6, borderRadius: 7, backgroundColor: c.butter, borderWidth: 2, borderColor: c.white, justifyContent: "center", transform: [{ rotate: "6deg" }] }, style]}>
      <Text style={[gz.display.tiny, { color: c.ink }]}>+{n}</Text>
    </View>
  );
}

/** 评论输入：头像 + 深灰胶囊;有字时右侧橙色发送 */
export function CommentInput({ avatar, value, onChangeText, onSend }: { avatar: string; value?: string; onChangeText?: (v: string) => void; onSend?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>
      <Image source={{ uri: avatar }} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.raised }} />
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", height: 44, paddingLeft: 16, paddingRight: 4, borderRadius: 22, backgroundColor: c.raised }}>
        <TextInput value={value} onChangeText={onChangeText} placeholder="Add comment..." placeholderTextColor={c.text3} style={[gz.body.body, { flex: 1, color: c.white, outlineStyle: "none" } as object]} accessibilityLabel="Add comment" />
        {value ? (
          <Pressable onPress={onSend} accessibilityLabel="Send" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.orange, alignItems: "center", justifyContent: "center" }}>
            <Icon name="arrow-up" size={18} color={c.white} strokeWidth={2.8} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** 任务行:标题 + 积分 · 右侧胶囊按钮(Go 深灰 → Claim 橙 → Done 文字) */
export function MissionRow({ title, reward, progress, state, onPress }: { title: string; reward: number; progress?: string; state: "go" | "claim" | "done"; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={[gz.body.strong, { color: state === "done" ? c.text3 : c.white }]}>{title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Text style={[gz.display.tiny, { color: state === "done" ? c.text3 : c.butter, flexShrink: 0 }]}>+{reward} credits</Text>
          {progress ? (
            <Text style={[gz.body.caption, { color: c.text3, flexShrink: 1 }]} numberOfLines={1}>
              · {progress}
            </Text>
          ) : null}
        </View>
      </View>
      {state === "done" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, width: 76, justifyContent: "center" }}>
          <Icon name="check" size={15} color={c.text3} strokeWidth={3} />
          <Text style={[gz.display.tiny, { color: c.text3 }]}>Done</Text>
        </View>
      ) : (
        <GZButton label={state === "claim" ? "Claim" : "Go"} variant={state === "claim" ? "primary" : "dark"} size="s" onPress={onPress} style={{ width: 76 }} />
      )}
    </View>
  );
}

/** 等级:丁香色 Lv 贴纸 + 称号 + 经验条(丁香 = 等级 / 身份) */
export function LevelBar({ lv, title, pct, xp }: { lv: number; title: string; pct: number; xp: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityLabel={`Level ${lv}, ${title}`}>
      <View style={{ height: 24, paddingHorizontal: 8, borderRadius: 7, backgroundColor: c.lilac, justifyContent: "center", transform: [{ rotate: "-3deg" }] }}>
        <Text style={[gz.display.tiny, { color: c.ink }]}>Lv {lv}</Text>
      </View>
      <Text style={[gz.display.label, { color: c.white }]}>{title}</Text>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.raised, overflow: "hidden" }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: 6, borderRadius: 3, backgroundColor: c.lilac }} />
      </View>
      <Text style={[gz.body.micro, { color: c.text3 }]}>{xp}</Text>
    </View>
  );
}

/** 新手提示：白色贴纸 + 指向右边的小三角 */
export function Coach({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", transform: [{ rotate: "-2deg" }] }}>
      <View style={{ paddingHorizontal: 12, height: 36, borderRadius: 10, backgroundColor: c.white, justifyContent: "center" }}>
        <Text style={[gz.display.label, { color: c.ink }]}>{text}</Text>
      </View>
      <View style={{ width: 10, height: 10, backgroundColor: c.white, marginLeft: -5, transform: [{ rotate: "45deg" }] }} />
    </View>
  );
}

/** 页底固定的主操作区(黑底 + 发丝线) */
export function Foot({ children, bottom }: { children: ReactNode; bottom: number }) {
  return <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottom, gap: 8, backgroundColor: c.page, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}>{children}</View>;
}

