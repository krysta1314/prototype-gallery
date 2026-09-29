import type { StyleProp, ViewStyle } from "react-native";

export type MediaVideoProps = {
  uri: string;
  poster: string;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
};
