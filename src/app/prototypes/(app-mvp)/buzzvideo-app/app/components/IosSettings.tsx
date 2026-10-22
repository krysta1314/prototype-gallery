import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import type { IconName } from "../data";
import { useInsets, useStore } from "../provider";
import type { PermissionValue } from "../store";
import { smoothCorners } from "../theme";
import Icon from "./Icon";

/* iOS 深色外观的系统色(设置是系统 UI,不走品牌色) */
const IOS = {
  bg: "#000000",
  cell: "#1c1c1e",
  separator: "#38383a",
  label: "#ffffff",
  secondary: "rgba(235,235,245,0.6)",
  blue: "#0a84ff",
  green: "#30d158",
  glass: "rgba(120,120,128,0.32)",
};

const webThumb = { activeThumbColor: "#ffffff" } as object;
function IosSwitch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  return <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} trackColor={{ false: "#39393d", true: IOS.green }} thumbColor="#ffffff" {...webThumb} />;
}

const PHOTO_LABEL: Record<PermissionValue, string> = { undetermined: "Ask Next Time", denied: "None", limited: "Limited Access", granted: "Full Access" };

/**
 * 模拟 iOS 26 设置 › BuzzVideo(2026-10-22):从权限提示框点 Settings 跳过来。
 * 在这里打开相机 / 相册 / 通知，回到 APP 就生效;原型里左上返回键直接回到 APP(真机是点状态栏左边的「◀ BuzzVideo」)。
 * 真实 APP 不画这一页,openSettingsURLString 打开的就是系统设置
 */
export default function IosSettings() {
  const { state, dispatch } = useStore();
  const insets = useInsets();
  const [page, setPage] = useState<"main" | "photos" | "push">("main");
  const [cellular, setCellular] = useState(true);
  if (!state.iosSettingsOpen) return null;
  const p = state.permissions;
  const set = (kind: "camera" | "photos" | "push" | "microphone", value: PermissionValue) => dispatch({ type: "setPermission", kind, value });
  const back = () => (page === "main" ? dispatch({ type: "closeIosSettings" }) : setPage("main"));
  const title = page === "photos" ? "Photos" : page === "push" ? "Notifications" : "BuzzVideo";

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.nav}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}>
            <Icon name="chevron-left" size={20} color={IOS.label} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.navTitle} accessibilityRole="header">
            {title}
          </Text>
          <View style={styles.navBtnSpace} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {page === "main" ? (
          <>
            <Text style={styles.sectionHead}>ALLOW BUZZVIDEO TO ACCESS</Text>
            <Group>
              <Cell icon="images" tint="#ff375f" label="Photos" value={PHOTO_LABEL[p.photos]} onPress={() => setPage("photos")} />
              <Cell icon="camera" tint="#8e8e93" label="Camera" right={<IosSwitch label="Camera" value={p.camera === "granted"} onValueChange={(on) => set("camera", on ? "granted" : "denied")} />} />
              <Cell icon="mic" tint="#ff9f0a" label="Microphone" right={<IosSwitch label="Microphone" value={p.microphone === "granted"} onValueChange={(on) => set("microphone", on ? "granted" : "denied")} />} />
              <Cell icon="bell" tint="#ff453a" label="Notifications" value={p.push === "granted" ? "On" : "Off"} onPress={() => setPage("push")} />
              <Cell icon="globe" tint={IOS.green} label="Cellular Data" right={<IosSwitch label="Cellular Data" value={cellular} onValueChange={setCellular} />} last />
            </Group>
          </>
        ) : page === "photos" ? (
          <>
            <Text style={styles.sectionHead}>PHOTO LIBRARY ACCESS</Text>
            <Group>
              {(["denied", "limited", "granted"] as const).map((v, i, arr) => (
                <Cell
                  key={v}
                  label={PHOTO_LABEL[v]}
                  onPress={() => set("photos", v)}
                  right={p.photos === v ? <Icon name="check" size={18} color={IOS.blue} strokeWidth={2.6} /> : null}
                  last={i === arr.length - 1}
                />
              ))}
            </Group>
            <Text style={styles.footer}>BuzzVideo uses your photos and videos to make ads of your products.</Text>
          </>
        ) : (
          <Group>
            <Cell label="Allow Notifications" right={<IosSwitch label="Allow Notifications" value={p.push === "granted"} onValueChange={(on) => set("push", on ? "granted" : "denied")} />} last />
          </Group>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function Cell({ icon, tint, label, value, right, onPress, last }: { icon?: IconName; tint?: string; label: string; value?: string; right?: ReactNode; onPress?: () => void; last?: boolean }) {
  const body = (
    <View style={styles.cell}>
      {icon ? (
        <View style={[styles.cellIcon, { backgroundColor: tint }]}>
          <Icon name={icon} size={15} color="#ffffff" strokeWidth={2.2} />
        </View>
      ) : null}
      <View style={[styles.cellMain, !last && styles.cellSep]}>
        <Text style={styles.cellLabel}>{label}</Text>
        {value ? (
          <Text style={styles.cellValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {right}
        {onPress && !right ? <Icon name="chevron-right" size={16} color="rgba(235,235,245,0.3)" strokeWidth={2.4} /> : null}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && styles.cellPressed}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, backgroundColor: IOS.bg },
  nav: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: IOS.glass, alignItems: "center", justifyContent: "center" },
  navBtnSpace: { width: 44 },
  pressed: { opacity: 0.6 },
  navTitle: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.4, color: IOS.label },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  sectionHead: { fontSize: 13, lineHeight: 18, color: IOS.secondary, marginLeft: 20, marginBottom: 7 },
  footer: { fontSize: 13, lineHeight: 18, color: IOS.secondary, marginHorizontal: 20, marginTop: 7 },
  group: { borderRadius: 26, backgroundColor: IOS.cell, overflow: "hidden", ...smoothCorners },
  cell: { flexDirection: "row", alignItems: "center", paddingLeft: 16, minHeight: 52 },
  cellPressed: { backgroundColor: "#2c2c2e" },
  cellIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 14 },
  cellMain: { flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 16 },
  cellSep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: IOS.separator },
  cellLabel: { flex: 1, fontSize: 17, lineHeight: 22, letterSpacing: -0.4, color: IOS.label },
  cellValue: { fontSize: 17, lineHeight: 22, letterSpacing: -0.4, color: IOS.secondary, maxWidth: 190 },
});
