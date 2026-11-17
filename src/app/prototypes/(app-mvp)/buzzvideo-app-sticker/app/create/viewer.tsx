/* 成片全屏查看(第一版点结果卡进 Work 详情;这里换成贴纸风全屏):
 * 视频铺满，左上关闭;底部提示词 + 一排:存相册 · 再来一次 · 改提示词，最右橙色 Post(进第二版的发布页) */

import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { GZButton, GZIconButton, GZSticker, GZToast, gz, isErrorToast } from "../../kit/gz";
import { poster, video } from "../data";
import { MediaVideo, useInsets, useStore } from "../v1";
import { useV2 } from "../store";
import { FullScreen } from "./overlay";
import { nextId, type Job } from "./shared";

const c = gz.color;

export function Viewer({ job, clip, onClose, onPost }: { job: Job; clip: string; onClose: () => void; onPost: () => void }) {
  const v2 = useV2();
  const { dispatch } = useStore();
  const insets = useInsets();
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  const running = job.status !== "done";
  return (
    <FullScreen>
      {job.mode === "image" || running ? (
        <Image source={{ uri: poster(clip) }} style={[StyleSheet.absoluteFill, running && { opacity: 0.3 }]} blurRadius={running ? 20 : 0} resizeMode="cover" />
      ) : (
        <MediaVideo uri={video(clip)} poster={poster(clip)} loop autoPlay muted style={StyleSheet.absoluteFill} />
      )}
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 44) }]}>
        <GZIconButton icon="x" onVideo label="Close" onPress={onClose} />
        <View style={{ flex: 1 }} />
        {running ? <GZSticker label="STILL MAKING IT" color="sky" size="s" /> : null}
      </View>
      {toast ? (
        <View style={styles.toast} pointerEvents="none">
          <GZToast text={toast} color={isErrorToast(toast) ? "red" : undefined} />
        </View>
      ) : null}
      <View style={styles.bottom}>
        <Text style={[gz.display.head, { color: c.white }, gz.textShadow]} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={[gz.body.body, { color: c.white }, gz.textShadow]} numberOfLines={3}>
          {job.prompt}
        </Text>
        {running ? null : (
          <View style={styles.actions}>
            <GZIconButton icon="download" onVideo label="Save to Photos" onPress={() => setToast("Saved to Photos")} />
            <GZIconButton
              icon="rotate-ccw"
              onVideo
              label="Make another"
              onPress={() => {
                dispatch({ type: "regenerateJob", id: job.id, newId: nextId("j") });
                onClose();
              }}
            />
            <GZIconButton
              icon="pencil"
              onVideo
              label="Edit prompt"
              onPress={() => {
                dispatch({ type: "setComposer", patch: { text: job.prompt, mode: job.mode, model: job.model } });
                onClose();
              }}
            />
            {job.mode !== "image" && job.mode !== "audio" ? <GZIconButton icon="scissors" onVideo label="Edit in editor" onPress={() => { onClose(); v2.d({ type: "push", route: { name: "editor", seed: "from-job", postId: clip } }); }} /> : null}
            <GZButton label="Post" icon="upload" size="l" block={false} style={{ flex: 1 }} onPress={onPost} />
          </View>
        )}
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  toast: { position: "absolute", top: 110, left: 0, right: 0, alignItems: "center" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingBottom: 34, paddingTop: 40, gap: 8, backgroundColor: "rgba(0,0,0,0.35)" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
});
