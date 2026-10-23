import { useEffect, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import type { MediaVideoProps } from "./media-types";

export default function MediaVideo({ uri, poster, style, muted = true, loop = true, autoPlay = true, controls = false, onProgress, paused, seek }: MediaVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || paused === undefined) return;
    if (paused) v.pause();
    else void v.play().catch(() => {});
  }, [paused]);
  useEffect(() => {
    const v = ref.current;
    if (!v || !seek || !v.duration) return;
    v.currentTime = seek.fraction * v.duration;
  }, [seek]);
  return (
    <View style={[styles.box, style]}>
      {/* 视频下面垫封面:视频层还没渲染(或截图抓不到视频层)时看到的是封面而不是灰块 */}
      <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <video
        ref={ref}
        src={uri}
        poster={poster}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        controls={controls}
        playsInline
        onTimeUpdate={onProgress ? (e) => { const v = e.currentTarget; if (v.duration) onProgress(v.currentTime / v.duration); } : undefined}
        style={{ position: "relative", width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ box: { overflow: "hidden", backgroundColor: "#000" } });
