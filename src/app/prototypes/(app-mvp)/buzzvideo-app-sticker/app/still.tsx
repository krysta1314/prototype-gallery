import type { ReactElement } from "react";
import { Image, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import MediaVideoBase from "../../buzzvideo-app/app/components/MediaVideo";
import { StillContext, useStill } from "../../buzzvideo-app/app/still";

/**
 * 静帧模式：用户旅程图一页里摆几十台手机，全部播视频会卡;旅程图里包一层 <StillContext.Provider value>,
 * 所有视频只显示封面。和第一版用同一个开关(第一版会自己往下走的屏，如 Face ID,也会停在这一帧)
 */
export { StillContext, useStill };

type Props = { uri: string; poster?: string; style?: StyleProp<ViewStyle>; muted?: boolean; loop?: boolean; autoPlay?: boolean; controls?: boolean; paused?: boolean; onProgress?: (p: number) => void; seek?: number };
export default function MediaVideo(props: Props) {
  const still = useStill();
  if (still) return props.poster ? <Image source={{ uri: props.poster }} style={[StyleSheet.absoluteFill, props.style as object]} resizeMode="cover" /> : null;
  const Base = MediaVideoBase as unknown as (p: Props) => ReactElement;
  return <Base {...props} />;
}
