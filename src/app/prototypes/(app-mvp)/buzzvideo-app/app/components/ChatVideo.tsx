import { StyleSheet } from "react-native";
import type { ChatVideoProps } from "./chat-video-types";
import MediaVideo from "./MediaVideo";

/** 原生端：用系统播放器自带的控件(真实 APP 用 expo-video 的 nativeControls) */
export default function ChatVideo({ uri, poster }: ChatVideoProps) {
  return <MediaVideo uri={uri} poster={poster} autoPlay={false} muted={false} controls style={StyleSheet.absoluteFill} />;
}
