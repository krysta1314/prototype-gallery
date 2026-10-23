import type { StyleProp, ViewStyle } from "react-native";

export type MediaVideoProps = {
  uri: string;
  poster: string;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  /** 外部控制暂停(作品详情点画面暂停 / 继续) */
  paused?: boolean;
  /** 播放进度 0–1(网页端来自 timeupdate;原生端由 expo-video 提供) */
  onProgress?: (fraction: number) => void;
  /** 拖进度条跳到某处:fraction 0–1,n 每次拖动递增(同一位置也能再跳) */
  seek?: { fraction: number; n: number };
};
