import { useRef, useState } from "react";
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { colors, radius } from "../theme";

type Props = { value: number; min: number; max: number; step: number; onChange: (v: number) => void; accessibilityLabel: string };

/**
 * 滑块(2026-10-23,模型设置里的语速 / 音量 / 音调):细轨道，已选那段品牌橙，白色圆形拖柄;点轨道任意位置跳过去，按住拖动。
 * 真实 APP 用系统 Slider(或 @react-native-community/slider)
 */
export default function Slider({ value, min, max, step, onChange, accessibilityLabel }: Props) {
  const [w, setW] = useState(0);
  const left = useRef(0);
  const trackRef = useRef<{ measure: (cb: (x: number, y: number, w: number, h: number, pageX: number) => void) => void } | null>(null);
  const pct = (value - min) / (max - min);
  const set = (pageX: number) => {
    if (!w) return;
    const raw = min + Math.min(1, Math.max(0, (pageX - left.current) / w)) * (max - min);
    const v = Math.round(raw / step) * step;
    onChange(Number(v.toFixed(2)));
  };
  const grant = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.pageX;
    trackRef.current?.measure((_x, _y, _w, _h, px) => {
      left.current = px;
      set(x);
    });
  };
  return (
    <View
      ref={trackRef as never}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={grant}
      onResponderMove={(e) => set(e.nativeEvent.pageX)}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      style={styles.hit}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={[styles.knob, { left: Math.max(0, pct * w - KNOB / 2) }]} pointerEvents="none" />
    </View>
  );
}

const KNOB = 22;
const styles = StyleSheet.create({
  hit: { height: 32, justifyContent: "center" },
  track: { height: 4, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  fill: { height: 4, backgroundColor: colors.accent },
  knob: { position: "absolute", top: 5, width: KNOB, height: KNOB, borderRadius: radius.full, backgroundColor: colors.white, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" },
});
