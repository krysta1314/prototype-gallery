import type { StyleProp, ViewStyle } from "react-native";

export type MediaVideoProps = {
  uri: string;
  poster: string;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  /** 播放进度 0–1(网页端来自 timeupdate;原生端由 expo-video 提供) */
  onProgress?: (fraction: number) => void;
};
