import { StyleSheet, View } from "react-native";
import type { MediaVideoProps } from "./media-types";

export default function MediaVideo({ uri, poster, style, muted = true, loop = true, autoPlay = true, controls = false, onProgress }: MediaVideoProps) {
  return (
    <View style={[styles.box, style]}>
      <video
        src={uri}
        poster={poster}
        muted={muted}
        loop={loop}
        autoPlay={autoPlay}
        controls={controls}
        playsInline
        onTimeUpdate={onProgress ? (e) => { const v = e.currentTarget; if (v.duration) onProgress(v.currentTime / v.duration); } : undefined}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ box: { overflow: "hidden", backgroundColor: "#000" } });
